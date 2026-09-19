import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { AiPlatformRepository } from "../ai/platform-capacity";
import { ClaimsRepository } from "../claims/repository";
import { getDatabase } from "../db";
import { NeonReportsRepository } from "../reports/neon-repository";
import { ResearchQueueRepository } from "../research/queue-repository";
import { methodologyVersion, VerdictRepository } from "../verdicts/repository";
import { applyVerdictRules } from "../verdicts/rules";
import { EvidenceRepository } from "./repository";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const usageDate = "2100-03-03";
let reportId: string | undefined;
const circuitProvider = `test-provider-${randomUUID()}`;

describe.skipIf(!runDatabaseTests)("evidence persistence", () => {
  afterAll(async () => {
    if (!runDatabaseTests) return;
    const sql = getDatabase();
    if (reportId)
      await sql.query("DELETE FROM reports WHERE id = $1", [reportId]);
    await sql.query("DELETE FROM provider_circuits WHERE provider = $1", [
      circuitProvider,
    ]);
    await sql.query("DELETE FROM daily_usage WHERE usage_date = $1", [
      usageDate,
    ]);
  });

  it("reserves a bounded search and atomically stores validated evidence", async () => {
    const reports = new NeonReportsRepository();
    const created = await reports.createUrlReport({
      shortId: `evid${randomUUID().replaceAll("-", "").slice(0, 14)}`,
      sourceUrl: "https://news.example/original",
      reportLocale: "en",
      visitorKey: `evidence-visitor-${randomUUID()}`,
      networkKey: `evidence-network-${randomUUID()}`,
      idempotencyKey: `evidence-request-${randomUUID()}`,
      usageDate,
    });
    if (!created.accepted) throw new Error("Test report was rejected");
    reportId = created.report.id;
    const queue = new ResearchQueueRepository();
    await queue.acquireLease(reportId, "evidence-run");
    const text =
      "The city opened 12 libraries in 2025. This is enough additional content for extraction persistence.";
    await reports.markExtracted(reportId, {
      canonicalUrl: "https://news.example/original",
      title: "Original",
      author: null,
      text,
      extractedWordCount: 15,
      analyzedWordCount: 15,
      truncated: false,
    });
    await new ClaimsRepository().persistIdentification(
      reportId,
      [
        {
          statement: "The city opened 12 libraries in 2025.",
          sourceStart: 0,
          sourceEnd: 41,
          contextPassage: text,
          importance: 5,
          referencePeriod: "2025",
          referenceScope: "the city",
          canonicalKey: "city-opened-libraries",
          selectionStatus: "selected",
        },
      ],
      {
        requestedModel: "inclusionai/test-free",
        responseModel: "inclusionai/test-free",
        usage: {},
      },
    );

    const repository = new EvidenceRepository();
    const input = await repository.getResearchInput(reportId);
    expect(input?.claims).toHaveLength(1);
    const searchId = await repository.reserveSearch({
      reportId,
      claimId: input?.claims[0].id ?? "",
      query: "library evidence query",
      maxSearches: 1,
    });
    expect(searchId).not.toBeNull();
    expect(
      await repository.reserveSearch({
        reportId,
        claimId: input?.claims[0].id ?? "",
        query: "duplicate query",
        maxSearches: 1,
      }),
    ).toBeNull();

    await repository.completeSearch(searchId ?? "", "direct_exa", 2, [
      {
        sourceUrl: "https://city.gov/release",
        canonicalUrl: "https://city.gov/release",
        sourceTitle: "Release",
        sourceAuthor: "City",
        publishedAt: "2025-01-02T00:00:00.000Z",
        sourceFragment: "The city opened 12 libraries in 2025.",
        sourceLanguage: "en",
        translatedFragment: "The city opened 12 libraries in 2025.",
        query: "library evidence query",
        sourceHierarchy: "primary",
        contentFingerprint: "a".repeat(64),
        dependencyFingerprint: "b".repeat(64),
        searchProvider: "direct_exa",
      },
    ]);
    await repository.finishResearch(reportId);

    const rows = await getDatabase().query(
      `SELECT source_hierarchy, search_provider, source_fragment
       FROM evidence_records WHERE report_id = $1`,
      [reportId],
    );
    expect(rows).toEqual([
      {
        source_hierarchy: "primary",
        search_provider: "direct_exa",
        source_fragment: "The city opened 12 libraries in 2025.",
      },
    ]);
    expect((await reports.findByShortId(created.report.shortId))?.status).toBe(
      "evaluating",
    );

    const verdictRepository = new VerdictRepository();
    const evaluationInput =
      await verdictRepository.getEvaluationInput(reportId);
    if (!evaluationInput) throw new Error("Evaluation input was not persisted");
    const evidenceId = evaluationInput.claims[0].evidence[0].id;
    const evaluation = applyVerdictRules(evaluationInput.claims, [
      {
        claimId: evaluationInput.claims[0].id,
        verdict: "supported",
        explanation:
          "The primary source confirms the same count, scope and period.",
        relations: [
          {
            evidenceId,
            relation: "supports",
            temporalCompatible: true,
            scopeCompatible: true,
            rationale: "Same city and 2025 period.",
          },
        ],
      },
    ]);
    await verdictRepository.persistEvaluation(
      reportId,
      evaluationInput,
      evaluation,
      {
        requestedModel: "inclusionai/test-free",
        responseModel: "inclusionai/test-free",
        usage: { inputTokens: 20, outputTokens: 10 },
      },
    );
    const completedRows = await getDatabase().query(
      `SELECT status, evidence_coverage::float8 AS evidence_coverage,
              support_index::float8 AS support_index, report_outcome,
              methodology_version, configuration_snapshot, model_snapshot
       FROM reports WHERE id = $1`,
      [reportId],
    );
    const completed = (completedRows as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(completed).toMatchObject({
      status: "completed",
      evidence_coverage: 100,
      support_index: 100,
      report_outcome: "conclusive",
      methodology_version: methodologyVersion,
    });
    expect(completed.configuration_snapshot).toMatchObject({
      maxClaims: 15,
    });
    expect(completed.model_snapshot).toHaveLength(2);
    const relationRows = await getDatabase().query(
      `SELECT relation, temporal_compatible, scope_compatible
       FROM claim_evidence_relations
       WHERE evidence_id = $1`,
      [evidenceId],
    );
    expect(relationRows).toEqual([
      {
        relation: "supports",
        temporal_compatible: true,
        scope_compatible: true,
      },
    ]);

    const platform = new AiPlatformRepository();
    await platform.openCircuit(circuitProvider, "http_429", 120);
    expect(await platform.isCircuitOpen(circuitProvider)).toBe(true);
    await platform.recordAttempt({
      reportId,
      phase: "claim_identification",
      requestedModel: "inclusionai/test-free",
      outcome: "failed",
      errorCode: "http_429",
    });
    const attempts = await getDatabase().query(
      `SELECT outcome, error_code FROM ai_attempts WHERE report_id = $1`,
      [reportId],
    );
    expect(attempts).toContainEqual({
      outcome: "failed",
      error_code: "http_429",
    });
  });
});

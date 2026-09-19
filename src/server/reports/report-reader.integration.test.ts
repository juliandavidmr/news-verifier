import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDatabase } from "../db";
import { NeonReportsRepository } from "./neon-repository";
import { ReportReaderRepository } from "./report-reader";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const usageDate = "2100-02-02";
const reportIds: string[] = [];

describe.skipIf(!runDatabaseTests)("public report reader", () => {
  afterAll(async () => {
    if (!runDatabaseTests || reportIds.length === 0) return;
    await getDatabase().query(
      "DELETE FROM reports WHERE id = ANY($1::uuid[])",
      [reportIds],
    );
    await getDatabase().query("DELETE FROM daily_usage WHERE usage_date = $1", [
      usageDate,
    ]);
  });

  it("returns auditable claim details without the full analyzed excerpt", async () => {
    const created = await new NeonReportsRepository().createUrlReport({
      shortId: `reader${randomUUID().replaceAll("-", "").slice(0, 12)}`,
      sourceUrl: "https://example.com/report-reader",
      reportLocale: "en",
      visitorKey: `reader-visitor-${randomUUID()}`,
      networkKey: `reader-network-${randomUUID()}`,
      idempotencyKey: `reader-test-${randomUUID()}`,
      usageDate,
    });
    expect(created.accepted).toBe(true);
    if (!created.accepted) return;
    reportIds.push(created.report.id);
    const database = getDatabase();
    const claimRows = await database.query(
      `INSERT INTO claims (
         report_id, ordinal, statement, source_start, source_end,
         context_passage, importance, reference_period, reference_scope,
         canonical_key, selection_status, research_status
       ) VALUES ($1, 1, $2, 30, 65, $3, 5, '2026', 'global',
                 'reader-claim', 'selected', 'completed')
       RETURNING id`,
      [
        created.report.id,
        "The public record confirms the result.",
        "In context, the public record confirms the result for this period.",
      ],
    );
    const claimId = (claimRows as Array<{ id: string }>)[0]?.id;
    if (!claimId) throw new Error("Reader fixture claim was not created");
    const searchRows = await database.query(
      `INSERT INTO evidence_searches (
         report_id, claim_id, query, provider, status, candidate_count,
         finished_at
       ) VALUES ($1, $2, 'public record result', 'direct_exa', 'completed', 1, now())
       RETURNING id`,
      [created.report.id, claimId],
    );
    const searchId = (searchRows as Array<{ id: string }>)[0]?.id;
    const evidenceRows = await database.query(
      `INSERT INTO evidence_records (
         report_id, claim_id, search_id, source_url, canonical_url,
         source_title, source_author, published_at, source_fragment,
         source_language, translated_fragment, query, source_hierarchy,
         content_fingerprint, dependency_fingerprint, search_provider
       ) VALUES (
         $1, $2, $3, 'https://example.gov/record',
         'https://example.gov/record', 'Official record', 'Agency', now(),
         'The official record confirms the result.', 'en', null,
         'public record result', 'primary', repeat('a', 64), repeat('b', 64),
         'direct_exa'
       ) RETURNING id`,
      [created.report.id, claimId, searchId],
    );
    const evidenceId = (evidenceRows as Array<{ id: string }>)[0]?.id;
    const verdictRows = await database.query(
      `INSERT INTO claim_verdicts (
         report_id, claim_id, proposed_verdict, final_verdict,
         evidence_strength, explanation, importance_class, weight,
         included_in_index, contribution
       ) VALUES ($1, $2, 'supported', 'supported', 'high',
                 'A primary record directly supports the claim.',
                 'primary', 5, true, 100)
       RETURNING id`,
      [created.report.id, claimId],
    );
    const verdictId = (verdictRows as Array<{ id: string }>)[0]?.id;
    await database.query(
      `INSERT INTO claim_evidence_relations (
         verdict_id, evidence_id, relation, temporal_compatible,
         scope_compatible, rationale
       ) VALUES ($1, $2, 'supports', true, true, 'Direct primary evidence')`,
      [verdictId, evidenceId],
    );
    await database.query(
      `INSERT INTO evidence_records (
         report_id, claim_id, search_id, source_url, canonical_url,
         source_title, source_author, published_at, source_fragment,
         source_language, translated_fragment, query, source_hierarchy,
         content_fingerprint, dependency_fingerprint, search_provider
       ) VALUES (
         $1, $2, $3, 'https://example.edu/context',
         'https://example.edu/context', 'Context record', 'University', now(),
         'The record discusses the same public program.', 'en', null,
         'public record result', 'expert', repeat('c', 64), repeat('d', 64),
         'direct_exa'
       )`,
      [created.report.id, claimId, searchId],
    );
    await database.query(
      `UPDATE reports
       SET status = 'completed', analyzed_excerpt = $2,
           evidence_coverage = 100, support_index = 100,
           report_outcome = 'conclusive', methodology_version = 'test.1',
           completed_at = now()
       WHERE id = $1`,
      [created.report.id, "PRIVATE FULL EXTRACT MUST NEVER BE RETURNED"],
    );

    const details = await new ReportReaderRepository().findDetails(
      created.report.id,
    );
    expect(details).toMatchObject({
      supportIndex: 100,
      evidenceCoverage: 100,
      outcome: "conclusive",
      claims: [
        {
          verdict: "supported",
          evidenceStrength: "high",
          weight: 5,
          contribution: 100,
          evidence: [
            {
              title: "Official record",
              relation: "supports",
              originalFragment: "The official record confirms the result.",
            },
            {
              title: "Context record",
              relation: "context",
              originalFragment: "The record discusses the same public program.",
            },
          ],
        },
      ],
    });
    const serialized = JSON.stringify(details);
    expect(serialized).not.toContain("analyzedExcerpt");
    expect(serialized).not.toContain("PRIVATE FULL EXTRACT");
  });
});

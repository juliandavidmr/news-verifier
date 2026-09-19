import type { SupportedLocale } from "../../domain/reports";
import { getDatabase } from "../db";
import type {
  AppliedReportEvaluation,
  EvaluationClaim,
  EvaluationEvidence,
  ReportEvaluationInput,
  VerdictModelResult,
} from "./types";

export const methodologyVersion = "2026-09-19.1";

type ReportRow = {
  report_locale: SupportedLocale;
  max_claims: number;
  max_evidence_searches: number;
  max_search_results: number;
  max_evidence_per_claim: number;
  claim_concurrency: number;
  search_cutoff_seconds: number;
  research_budget_seconds: number;
};

type ClaimRow = {
  id: string;
  statement: string;
  importance: number;
  selection_status: EvaluationClaim["selectionStatus"];
  research_status: EvaluationClaim["researchStatus"];
  reference_period: string;
  reference_scope: string;
};

type EvidenceRow = {
  id: string;
  claim_id: string;
  source_url: string;
  source_title: string | null;
  source_fragment: string;
  translated_fragment: string | null;
  source_hierarchy: EvaluationEvidence["hierarchy"];
  published_at: string | null;
  dependency_fingerprint: string;
};

type ModelRow = {
  phase: string;
  requested_model: string;
  response_model: string;
  usage: Record<string, unknown>;
};

export class VerdictRepository {
  async getEvaluationInput(
    reportId: string,
  ): Promise<ReportEvaluationInput | null> {
    const database = getDatabase();
    const [reportRows, claimRows, evidenceRows, modelRows] = await Promise.all([
      database.query(
        `SELECT reports.report_locale, config.max_claims,
                config.max_evidence_searches, config.max_search_results,
                config.max_evidence_per_claim, config.claim_concurrency,
                config.search_cutoff_seconds, config.research_budget_seconds
         FROM reports CROSS JOIN quota_config config
         WHERE reports.id = $1 AND config.id = 1
           AND reports.status = 'evaluating'`,
        [reportId],
      ),
      database.query(
        `SELECT id, statement, importance, selection_status, research_status,
                reference_period, reference_scope
         FROM claims WHERE report_id = $1 ORDER BY ordinal`,
        [reportId],
      ),
      database.query(
        `SELECT id, claim_id, source_url, source_title, source_fragment,
                translated_fragment, source_hierarchy, published_at,
                dependency_fingerprint
         FROM evidence_records WHERE report_id = $1 ORDER BY created_at, id`,
        [reportId],
      ),
      database.query(
        `SELECT phase, requested_model, response_model, usage
         FROM ai_calls WHERE report_id = $1 ORDER BY id`,
        [reportId],
      ),
    ]);
    const report = (reportRows as unknown[])[0] as ReportRow | undefined;
    if (!report) return null;
    const evidenceByClaim = new Map<string, EvaluationEvidence[]>();
    for (const row of evidenceRows as unknown as EvidenceRow[]) {
      const evidence = evidenceByClaim.get(row.claim_id) ?? [];
      evidence.push({
        id: row.id,
        sourceUrl: row.source_url,
        sourceTitle: row.source_title,
        fragment: row.source_fragment,
        translatedFragment: row.translated_fragment,
        hierarchy: row.source_hierarchy,
        publishedAt: row.published_at,
        dependencyFingerprint: row.dependency_fingerprint,
      });
      evidenceByClaim.set(row.claim_id, evidence);
    }
    return {
      reportId,
      reportLocale: report.report_locale,
      claims: (claimRows as unknown as ClaimRow[]).map((claim) => ({
        id: claim.id,
        statement: claim.statement,
        importance: claim.importance,
        selectionStatus: claim.selection_status,
        researchStatus: claim.research_status,
        referencePeriod: claim.reference_period,
        referenceScope: claim.reference_scope,
        evidence: evidenceByClaim.get(claim.id) ?? [],
      })),
      configuration: {
        maxClaims: report.max_claims,
        maxEvidenceSearches: report.max_evidence_searches,
        maxSearchResults: report.max_search_results,
        maxEvidencePerClaim: report.max_evidence_per_claim,
        claimConcurrency: report.claim_concurrency,
        searchCutoffSeconds: report.search_cutoff_seconds,
        researchBudgetSeconds: report.research_budget_seconds,
      },
      previousModels: (modelRows as unknown as ModelRow[]).map((model) => ({
        phase: model.phase,
        requestedModel: model.requested_model,
        responseModel: model.response_model,
        usage: model.usage,
      })),
    };
  }

  async persistEvaluation(
    reportId: string,
    input: ReportEvaluationInput,
    evaluation: AppliedReportEvaluation,
    model: Omit<VerdictModelResult, "verdicts"> | null,
  ) {
    const verdicts = evaluation.verdicts.map((verdict) => ({
      ...verdict,
      relations: undefined,
    }));
    const relations = evaluation.verdicts.flatMap((verdict) =>
      verdict.relations.map((relation) => ({
        claimId: verdict.claimId,
        ...relation,
      })),
    );
    const modelSnapshot = model
      ? [
          ...input.previousModels,
          {
            phase: "verdict_evaluation",
            requestedModel: model.requestedModel,
            responseModel: model.responseModel,
            usage: model.usage,
          },
        ]
      : input.previousModels;
    const eventPayload = JSON.stringify({
      status: evaluation.terminalStatus,
      evidenceCoverage: evaluation.evidenceCoverage,
      supportIndex: evaluation.supportIndex,
      reportOutcome: evaluation.reportOutcome,
      partialReason: evaluation.partialReason,
    });
    await getDatabase().query(
      `WITH removed AS (
        DELETE FROM claim_verdicts WHERE report_id = $1
      ), inserted_verdicts AS (
        INSERT INTO claim_verdicts (
          report_id, claim_id, proposed_verdict, final_verdict,
          evidence_strength, explanation, importance_class, weight,
          included_in_index, contribution
        )
        SELECT $1, item."claimId"::uuid, item."proposedVerdict",
               item."finalVerdict", item."evidenceStrength", item.explanation,
               item."importanceClass", item.weight, item."includedInIndex",
               item.contribution
        FROM jsonb_to_recordset($2::jsonb) AS item(
          "claimId" text,
          "proposedVerdict" text,
          "finalVerdict" text,
          "evidenceStrength" text,
          explanation text,
          "importanceClass" text,
          weight integer,
          "includedInIndex" boolean,
          contribution numeric
        )
        RETURNING id, claim_id
      ), inserted_relations AS (
        INSERT INTO claim_evidence_relations (
          verdict_id, evidence_id, relation, temporal_compatible,
          scope_compatible, rationale
        )
        SELECT verdict.id, relation."evidenceId"::uuid, relation.relation,
               relation."temporalCompatible", relation."scopeCompatible",
               relation.rationale
        FROM jsonb_to_recordset($3::jsonb) AS relation(
          "claimId" text,
          "evidenceId" text,
          relation text,
          "temporalCompatible" boolean,
          "scopeCompatible" boolean,
          rationale text
        )
        JOIN inserted_verdicts verdict
          ON verdict.claim_id = relation."claimId"::uuid
        JOIN evidence_records evidence
          ON evidence.id = relation."evidenceId"::uuid
         AND evidence.claim_id = verdict.claim_id
        ON CONFLICT DO NOTHING
      ), updated AS (
        UPDATE reports
        SET status = $14, evidence_coverage = $4,
            support_index = $5, report_outcome = $6,
            methodology_version = $7, configuration_snapshot = $8::jsonb,
            model_snapshot = $9::jsonb, partial_reason = $15,
            completed_at = now(), updated_at = now(),
            next_event_sequence = next_event_sequence + 1
        WHERE id = $1 AND status = 'evaluating'
        RETURNING id, next_event_sequence - 1 AS sequence
      ), consumed AS (
        UPDATE quota_reservations
        SET status = 'consumed', updated_at = now()
        WHERE report_id IN (SELECT id FROM updated) AND status = 'reserved'
      ), event AS (
        INSERT INTO report_events (report_id, sequence, stage, public_payload)
        SELECT id, sequence, $14, $10::jsonb FROM updated
      ), ai AS (
        INSERT INTO ai_calls (
          report_id, phase, requested_model, response_model, usage
        ) SELECT $1, 'verdict_evaluation', $11, $12, $13::jsonb
        WHERE $11::text IS NOT NULL
      )
      SELECT count(*)::integer AS verdict_count FROM inserted_verdicts`,
      [
        reportId,
        JSON.stringify(verdicts),
        JSON.stringify(relations),
        evaluation.evidenceCoverage,
        evaluation.supportIndex,
        evaluation.reportOutcome,
        methodologyVersion,
        JSON.stringify(input.configuration),
        JSON.stringify(modelSnapshot),
        eventPayload,
        model?.requestedModel ?? null,
        model?.responseModel ?? null,
        model ? JSON.stringify(model.usage) : null,
        evaluation.terminalStatus,
        evaluation.partialReason,
      ],
    );
  }
}

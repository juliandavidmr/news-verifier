import type { SupportedLocale } from "../../domain/reports";
import { getDatabase } from "../db";
import type {
  EvidenceProvider,
  EvidenceResearchInput,
  ValidatedEvidence,
} from "./types";

type ResearchRow = {
  report_id: string;
  report_locale: SupportedLocale;
  source_url: string;
  max_evidence_searches: number;
  max_search_results: number;
  max_evidence_per_claim: number;
  claim_concurrency: number;
  research_started_at: string;
  search_cutoff_seconds: number;
  claims: unknown;
};

function parseClaims(value: unknown): EvidenceResearchInput["claims"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((claim) =>
    typeof claim === "object" &&
    claim !== null &&
    "id" in claim &&
    typeof claim.id === "string" &&
    "statement" in claim &&
    typeof claim.statement === "string" &&
    "referencePeriod" in claim &&
    typeof claim.referencePeriod === "string" &&
    "referenceScope" in claim &&
    typeof claim.referenceScope === "string"
      ? [
          {
            id: claim.id,
            statement: claim.statement,
            referencePeriod: claim.referencePeriod,
            referenceScope: claim.referenceScope,
          },
        ]
      : [],
  );
}

export class EvidenceRepository {
  async getResearchInput(
    reportId: string,
  ): Promise<EvidenceResearchInput | null> {
    const rows = await getDatabase().query(
      `SELECT reports.id AS report_id, reports.report_locale, reports.source_url,
              config.max_evidence_searches, config.max_search_results,
              config.max_evidence_per_claim,
              config.claim_concurrency, reports.research_started_at,
              config.search_cutoff_seconds,
              COALESCE(jsonb_agg(jsonb_build_object(
                'id', claims.id,
                'statement', claims.statement,
                'referencePeriod', claims.reference_period,
                'referenceScope', claims.reference_scope
              ) ORDER BY claims.ordinal) FILTER (WHERE claims.id IS NOT NULL), '[]') AS claims
       FROM reports
       CROSS JOIN quota_config config
       LEFT JOIN claims ON claims.report_id = reports.id
         AND claims.selection_status = 'selected'
       WHERE reports.id = $1 AND config.id = 1
       GROUP BY reports.id, config.id`,
      [reportId],
    );
    const row = (rows as unknown[])[0] as ResearchRow | undefined;
    if (!row?.source_url) return null;
    return {
      reportId: row.report_id,
      reportLocale: row.report_locale,
      sourceUrl: row.source_url,
      claims: parseClaims(row.claims),
      maxSearches: row.max_evidence_searches,
      maxResults: row.max_search_results,
      maxEvidencePerClaim: row.max_evidence_per_claim,
      concurrency: row.claim_concurrency,
      stopStartingAt: new Date(
        new Date(row.research_started_at).valueOf() +
          row.search_cutoff_seconds * 1_000,
      ).toISOString(),
    };
  }

  async reserveSearch(input: {
    reportId: string;
    claimId: string;
    query: string;
    maxSearches: number;
  }) {
    const rows = await getDatabase().query(
      `INSERT INTO evidence_searches (
         report_id, claim_id, query, provider, status
       )
       SELECT $1, $2, $3, 'gateway_exa', 'reserved'
       WHERE (
         SELECT count(*) FROM evidence_searches WHERE report_id = $1
       ) < $4
       ON CONFLICT (claim_id) DO NOTHING
       RETURNING id`,
      [input.reportId, input.claimId, input.query, input.maxSearches],
    );
    const row = (rows as unknown[])[0] as { id: string | number } | undefined;
    return row ? String(row.id) : null;
  }

  async completeSearch(
    searchId: string,
    provider: EvidenceProvider,
    candidateCount: number,
    evidence: ValidatedEvidence[],
    modelCall?: {
      requestedModel: string;
      responseModel: string;
      usage: Record<string, unknown>;
    },
  ) {
    await getDatabase().query(
      `WITH search AS (
        UPDATE evidence_searches
        SET provider = $2, status = 'completed', candidate_count = $3,
            error_code = NULL, finished_at = now()
        WHERE id = $1 AND status = 'reserved'
        RETURNING id, report_id, claim_id, query, provider
      ), ai AS (
        INSERT INTO ai_calls (
          report_id, phase, requested_model, response_model, usage
        )
        SELECT search.report_id, 'evidence_search',
               model."requestedModel", model."responseModel", model.usage
        FROM search
        CROSS JOIN jsonb_to_record($5::jsonb) AS model(
          "requestedModel" text,
          "responseModel" text,
          usage jsonb
        )
        WHERE $5::jsonb IS NOT NULL
      ), researched AS (
        UPDATE claims
        SET research_status = 'completed'
        WHERE id = (SELECT claim_id FROM search)
      )
      INSERT INTO evidence_records (
        report_id, claim_id, search_id, source_url, canonical_url,
        source_title, source_author, published_at, source_fragment,
        source_language, translated_fragment, query, source_hierarchy,
        content_fingerprint, dependency_fingerprint, search_provider
      )
      SELECT
        search.report_id, search.claim_id, search.id,
        item."sourceUrl", item."canonicalUrl", item."sourceTitle",
        item."sourceAuthor", NULLIF(item."publishedAt", '')::timestamptz,
        item."sourceFragment", item."sourceLanguage",
        item."translatedFragment", search.query, item."sourceHierarchy",
        item."contentFingerprint", item."dependencyFingerprint", search.provider
      FROM search
      CROSS JOIN jsonb_to_recordset($4::jsonb) AS item(
        "sourceUrl" text,
        "canonicalUrl" text,
        "sourceTitle" text,
        "sourceAuthor" text,
        "publishedAt" text,
        "sourceFragment" text,
        "sourceLanguage" text,
        "translatedFragment" text,
        "sourceHierarchy" text,
        "contentFingerprint" text,
        "dependencyFingerprint" text
      )
      ON CONFLICT DO NOTHING`,
      [
        searchId,
        provider,
        candidateCount,
        JSON.stringify(evidence),
        modelCall ? JSON.stringify(modelCall) : null,
      ],
    );
  }

  async failSearch(searchId: string, code: string) {
    await getDatabase().query(
      `WITH failed AS (
        UPDATE evidence_searches
        SET status = 'failed', error_code = $2, finished_at = now()
        WHERE id = $1 AND status = 'reserved'
        RETURNING claim_id
      )
      UPDATE claims SET research_status = 'uninvestigated_platform'
      WHERE id IN (SELECT claim_id FROM failed)`,
      [searchId, code],
    );
  }

  async markTimeLimited(reportId: string, claimIds: string[]) {
    if (claimIds.length === 0) return;
    await getDatabase().query(
      `UPDATE claims
       SET research_status = 'uninvestigated_time'
       WHERE report_id = $1 AND id = ANY($2::uuid[])
         AND research_status = 'pending'`,
      [reportId, claimIds],
    );
  }

  async finishResearch(reportId: string) {
    await getDatabase().query(
      `WITH totals AS (
        SELECT
          count(DISTINCT evidence_searches.id)::integer AS searches,
          count(DISTINCT evidence_records.id)::integer AS evidence
        FROM evidence_searches
        LEFT JOIN evidence_records
          ON evidence_records.search_id = evidence_searches.id
        WHERE evidence_searches.report_id = $1
      ), updated AS (
        UPDATE reports
        SET status = 'evaluating', updated_at = now(),
            next_event_sequence = next_event_sequence + 1
        WHERE id = $1 AND status = 'researching'
        RETURNING id, next_event_sequence - 1 AS sequence
      )
      INSERT INTO report_events (report_id, sequence, stage, public_payload)
      SELECT updated.id, updated.sequence, 'evaluating', jsonb_build_object(
        'status', 'evaluating',
        'searches', totals.searches,
        'evidenceRecords', totals.evidence
      )
      FROM updated CROSS JOIN totals`,
      [reportId],
    );
  }
}

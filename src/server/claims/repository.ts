import type { SupportedLocale } from "../../domain/reports";
import { getDatabase } from "../db";
import type { ClaimIdentification, ClaimModelResult } from "./types";

type ClaimInputRow = {
  analyzed_excerpt: string;
  report_locale: SupportedLocale;
  max_claims: number;
};

function firstRow<T>(rows: readonly unknown[]) {
  return rows[0] as T | undefined;
}

export class ClaimsRepository {
  async getIdentificationInput(reportId: string) {
    const rows = await getDatabase().query(
      `SELECT reports.analyzed_excerpt, reports.report_locale, config.max_claims
       FROM reports
       CROSS JOIN quota_config config
       WHERE reports.id = $1 AND config.id = 1`,
      [reportId],
    );
    const row = firstRow<ClaimInputRow>(rows as unknown[]);
    return row
      ? {
          text: row.analyzed_excerpt,
          reportLocale: row.report_locale,
          maxClaims: row.max_claims,
        }
      : null;
  }

  async persistIdentification(
    reportId: string,
    claims: ClaimIdentification[],
    model: Omit<ClaimModelResult, "claims">,
  ) {
    const payload = claims.map((claim, index) => ({
      ordinal: index + 1,
      ...claim,
    }));
    const eventPayload = JSON.stringify({
      status: "researching",
      detectedClaims: claims.length,
      selectedClaims: claims.filter(
        (claim) => claim.selectionStatus === "selected",
      ).length,
    });
    await getDatabase().query(
      `WITH removed AS (
        DELETE FROM claims WHERE report_id = $1
      ), inserted AS (
        INSERT INTO claims (
          report_id, ordinal, statement, source_start, source_end,
          context_passage, importance, reference_period, reference_scope,
          canonical_key, selection_status, research_status
        )
        SELECT
          $1, item.ordinal, item.statement, item."sourceStart", item."sourceEnd",
          item."contextPassage", item.importance, item."referencePeriod",
          item."referenceScope", item."canonicalKey", item."selectionStatus"
          , CASE WHEN item."selectionStatus" = 'selected'
              THEN 'pending' ELSE 'uninvestigated_limit' END
        FROM jsonb_to_recordset($2::jsonb) AS item(
          ordinal integer,
          statement text,
          "sourceStart" integer,
          "sourceEnd" integer,
          "contextPassage" text,
          importance integer,
          "referencePeriod" text,
          "referenceScope" text,
          "canonicalKey" text,
          "selectionStatus" text
        )
      ), updated AS (
        UPDATE reports
        SET status = 'researching', updated_at = now(),
            next_event_sequence = next_event_sequence + 1
        WHERE id = $1 AND status = 'identifying_claims'
        RETURNING id, next_event_sequence - 1 AS sequence
      ), event AS (
        INSERT INTO report_events (report_id, sequence, stage, public_payload)
        SELECT id, sequence, 'researching', $3::jsonb FROM updated
      )
      INSERT INTO ai_calls (
        report_id, phase, requested_model, response_model, usage
      ) VALUES ($1, 'claim_identification', $4, $5, $6::jsonb)`,
      [
        reportId,
        JSON.stringify(payload),
        eventPayload,
        model.requestedModel,
        model.responseModel,
        JSON.stringify(model.usage),
      ],
    );
  }
}

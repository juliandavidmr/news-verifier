import type {
  ExtractedContent,
  Report,
  ReportEvent,
  ReportStatus,
  SupportedLocale,
} from "../../domain/reports";
import { getDatabase } from "../db";
import type { CreateUrlReportInput, ReportsRepository } from "./repository";

type ReportRow = {
  id: string;
  short_id: string;
  source_kind: "url" | "image";
  source_url: string | null;
  report_locale: SupportedLocale;
  status: ReportStatus;
  extracted_title: string | null;
  extracted_author: string | null;
  analyzed_excerpt: string | null;
  extracted_word_count: number | null;
  analyzed_word_count: number | null;
  truncated: boolean;
  error_code: string | null;
  error_message: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type EventRow = {
  sequence: number;
  stage: ReportStatus;
  public_payload: Record<string, unknown> | string;
  created_at: string | Date;
};

function iso(value: string | Date) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    shortId: row.short_id,
    sourceKind: row.source_kind,
    sourceUrl: row.source_url,
    reportLocale: row.report_locale,
    status: row.status,
    extractedTitle: row.extracted_title,
    extractedAuthor: row.extracted_author,
    analyzedExcerpt: row.analyzed_excerpt,
    extractedWordCount: row.extracted_word_count,
    analyzedWordCount: row.analyzed_word_count,
    truncated: row.truncated,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapEvent(row: EventRow): ReportEvent {
  return {
    sequence: row.sequence,
    stage: row.stage,
    payload:
      typeof row.public_payload === "string"
        ? JSON.parse(row.public_payload)
        : row.public_payload,
    createdAt: iso(row.created_at),
  };
}

function firstRow<T>(rows: readonly unknown[]) {
  return rows[0] as T | undefined;
}

export class NeonReportsRepository implements ReportsRepository {
  async createUrlReport(input: CreateUrlReportInput) {
    const sql = getDatabase();
    const rows = await sql.query(
      `SELECT accept_url_investigation($1, $2, $3, $4, $5, $6, COALESCE($7::date, current_date)) AS decision`,
      [
        input.shortId,
        input.sourceUrl,
        input.reportLocale,
        input.visitorKey,
        input.networkKey,
        input.idempotencyKey,
        input.usageDate ?? null,
      ],
    );
    const row = firstRow<{
      decision:
        | { accepted: false; reason: "global" | "visitor" }
        | { accepted: true; replayed: boolean; report: ReportRow };
    }>(rows as unknown[]);
    if (!row) throw new Error("Report admission returned no row");
    if (!row.decision.accepted) return row.decision;
    return {
      accepted: true as const,
      replayed: row.decision.replayed,
      report: mapReport(row.decision.report),
    };
  }

  async markExtracted(reportId: string, content: ExtractedContent) {
    const sql = getDatabase();
    const payload = JSON.stringify({
      status: "identifying_claims",
      title: content.title,
      extractedWordCount: content.extractedWordCount,
      analyzedWordCount: content.analyzedWordCount,
      truncated: content.truncated,
    });
    await sql.query(
      `WITH updated AS (
        UPDATE reports
        SET source_url = $2,
            status = 'identifying_claims',
            extracted_title = $3,
            extracted_author = $4,
            analyzed_excerpt = $5,
            extracted_word_count = $6,
            analyzed_word_count = $7,
            truncated = $8,
            extraction_finished_at = now(),
            updated_at = now(),
            next_event_sequence = next_event_sequence + 1
        WHERE id = $1 AND status = 'extracting'
        RETURNING id, next_event_sequence - 1 AS sequence
      )
      INSERT INTO report_events (report_id, sequence, stage, public_payload)
      SELECT id, sequence, 'identifying_claims', $9::jsonb FROM updated`,
      [
        reportId,
        content.canonicalUrl,
        content.title,
        content.author,
        content.text,
        content.extractedWordCount,
        content.analyzedWordCount,
        content.truncated,
        payload,
      ],
    );
  }

  async markFailed(
    reportId: string,
    error: { code: string; publicMessage: string },
  ) {
    const sql = getDatabase();
    const payload = JSON.stringify({
      status: "failed",
      errorCode: error.code,
      message: error.publicMessage,
    });
    await sql.query(
      `WITH updated AS (
        UPDATE reports
        SET status = 'failed',
            error_code = $2,
            error_message = $3,
            extraction_finished_at = now(),
            updated_at = now(),
            next_event_sequence = next_event_sequence + 1
        WHERE id = $1 AND status NOT IN ('completed', 'partial', 'failed')
        RETURNING id, next_event_sequence - 1 AS sequence
      ), refunded AS (
        UPDATE quota_reservations
        SET status = 'refunded', refund_reason = $2, updated_at = now()
        WHERE report_id IN (SELECT id FROM updated)
          AND status IN ('reserved', 'consumed')
        RETURNING visitor_key, usage_date
      ), released AS (
        UPDATE daily_usage usage
        SET used_count = GREATEST(0, used_count - 1), updated_at = now()
        FROM refunded
        WHERE usage.usage_date = refunded.usage_date
          AND usage.scope = 'visitor'
          AND usage.scope_key = refunded.visitor_key
      )
      INSERT INTO report_events (report_id, sequence, stage, public_payload)
      SELECT id, sequence, 'failed', $4::jsonb FROM updated`,
      [reportId, error.code, error.publicMessage, payload],
    );
  }

  async findByShortId(shortId: string) {
    const sql = getDatabase();
    const rows = await sql.query(`SELECT * FROM reports WHERE short_id = $1`, [
      shortId,
    ]);
    const row = firstRow<ReportRow>(rows as unknown[]);
    return row ? mapReport(row) : null;
  }

  async listEvents(reportId: string, afterSequence: number) {
    const sql = getDatabase();
    const rows = await sql.query(
      `SELECT sequence, stage, public_payload, created_at
       FROM report_events
       WHERE report_id = $1 AND sequence > $2
       ORDER BY sequence ASC
       LIMIT 100`,
      [reportId, afterSequence],
    );
    return (rows as EventRow[]).map(mapEvent);
  }
}

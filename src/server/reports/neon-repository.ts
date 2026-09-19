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
    const payload = JSON.stringify({ status: "extracting" });
    const rows = await sql.query(
      `WITH inserted AS (
        INSERT INTO reports (short_id, source_kind, source_url, report_locale, status)
        VALUES ($1, 'url', $2, $3, 'extracting')
        RETURNING *
      ), event AS (
        INSERT INTO report_events (report_id, sequence, stage, public_payload)
        SELECT id, 1, 'extracting', $4::jsonb FROM inserted
      )
      SELECT * FROM inserted`,
      [input.shortId, input.sourceUrl, input.reportLocale, payload],
    );
    const row = firstRow<ReportRow>(rows as unknown[]);
    if (!row) throw new Error("Report creation returned no row");
    return mapReport(row);
  }

  async markExtracted(reportId: string, content: ExtractedContent) {
    const sql = getDatabase();
    const payload = JSON.stringify({
      status: "partial",
      title: content.title,
      extractedWordCount: content.extractedWordCount,
      analyzedWordCount: content.analyzedWordCount,
      truncated: content.truncated,
    });
    await sql.query(
      `WITH updated AS (
        UPDATE reports
        SET source_url = $2,
            status = 'partial',
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
      SELECT id, sequence, 'partial', $9::jsonb FROM updated`,
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
        WHERE id = $1 AND status = 'extracting'
        RETURNING id, next_event_sequence - 1 AS sequence
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

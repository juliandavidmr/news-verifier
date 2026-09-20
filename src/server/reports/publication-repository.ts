import type {
  IndexableReport,
  PublicReportListing,
} from "../../domain/public-report-listing";
import { getDatabase } from "../db";

type PublicationRow = {
  short_id: string;
  extracted_title: string;
  source_url: string;
  completed_at: string | Date;
};

function iso(value: string | Date) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function listingFrom(row: PublicationRow): PublicReportListing | null {
  try {
    return {
      shortId: row.short_id,
      title: row.extracted_title.trim(),
      sourceHostname: new URL(row.source_url).hostname,
      completedAt: iso(row.completed_at),
    };
  } catch {
    return null;
  }
}

const publicableReportWhere = `
  publications.withdrawn_at IS NULL
  AND reports.publicly_visible = true
  AND reports.source_kind = 'url'
  AND reports.status = 'completed'
  AND reports.report_outcome = 'conclusive'
  AND reports.evidence_coverage >= 60
  AND NULLIF(BTRIM(reports.extracted_title), '') IS NOT NULL
  AND reports.source_url IS NOT NULL
  AND reports.completed_at IS NOT NULL`;

export class ReportPublicationRepository {
  async listRecent(limit = 8): Promise<PublicReportListing[]> {
    const rows = await getDatabase().query(
      `WITH distinct_sources AS (
         SELECT reports.short_id, reports.extracted_title, reports.source_url,
                reports.completed_at,
                ROW_NUMBER() OVER (
                  PARTITION BY reports.source_url
                  ORDER BY reports.completed_at DESC, reports.id DESC
                ) AS source_rank
         FROM reports
         JOIN report_publications publications
           ON publications.report_id = reports.id
         WHERE ${publicableReportWhere}
       )
       SELECT short_id, extracted_title, source_url, completed_at
       FROM distinct_sources
       WHERE source_rank = 1
       ORDER BY completed_at DESC, short_id DESC
       LIMIT $1`,
      [limit],
    );

    return (rows as PublicationRow[])
      .map(listingFrom)
      .filter((report): report is PublicReportListing => report !== null);
  }

  async listIndexable(limit = 50_000): Promise<IndexableReport[]> {
    const rows = await getDatabase().query(
      `SELECT reports.short_id, reports.completed_at
       FROM reports
       JOIN report_publications publications
         ON publications.report_id = reports.id
       WHERE ${publicableReportWhere}
       ORDER BY reports.completed_at DESC, reports.id DESC
       LIMIT $1`,
      [limit],
    );

    return (
      rows as Array<{ short_id: string; completed_at: string | Date }>
    ).map((row) => ({
      shortId: row.short_id,
      completedAt: iso(row.completed_at),
    }));
  }

  async isIndexable(reportId: string): Promise<boolean> {
    const rows = await getDatabase().query(
      `SELECT 1
       FROM reports
       JOIN report_publications publications
         ON publications.report_id = reports.id
       WHERE reports.id = $1 AND ${publicableReportWhere}
       LIMIT 1`,
      [reportId],
    );
    return (rows as unknown[]).length > 0;
  }
}

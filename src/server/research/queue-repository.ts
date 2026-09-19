import type { SupportedLocale } from "../../domain/reports";
import { getDatabase } from "../db";

export type LeaseOutcome =
  | { outcome: "acquired"; slot: number; deadline: string }
  | { outcome: "queued"; retryAfterSeconds: number }
  | { outcome: "duplicate" | "expired" | "missing" | "terminal" };

export type QueuedReportSource =
  | {
      sourceKind: "url";
      sourceUrl: string;
      reportLocale: SupportedLocale;
    }
  | {
      sourceKind: "image";
      reportLocale: SupportedLocale;
      text: string;
      extractedWordCount: number;
      analyzedWordCount: number;
      truncated: boolean;
    };

export type OutboxDispatch = {
  id: number;
  reportId: string;
};

function firstRow<T>(rows: readonly unknown[]) {
  return rows[0] as T | undefined;
}

export class ResearchQueueRepository {
  async acquireLease(
    reportId: string,
    workflowRunId: string,
    now?: Date,
  ): Promise<LeaseOutcome> {
    const rows = await getDatabase().query(
      `SELECT try_acquire_research_lease($1, $2, COALESCE($3::timestamptz, now())) AS decision`,
      [reportId, workflowRunId, now?.toISOString() ?? null],
    );
    const row = firstRow<{ decision: LeaseOutcome }>(rows as unknown[]);
    if (!row) throw new Error("Lease acquisition returned no result");
    return row.decision;
  }

  async heartbeat(reportId: string, workflowRunId: string, now?: Date) {
    const rows = await getDatabase().query(
      `SELECT heartbeat_research_lease($1, $2, COALESCE($3::timestamptz, now())) AS renewed`,
      [reportId, workflowRunId, now?.toISOString() ?? null],
    );
    return Boolean(firstRow<{ renewed: boolean }>(rows as unknown[])?.renewed);
  }

  async release(reportId: string, workflowRunId: string) {
    await getDatabase().query("SELECT release_research_lease($1, $2)", [
      reportId,
      workflowRunId,
    ]);
  }

  async getSource(reportId: string): Promise<QueuedReportSource | null> {
    const rows = await getDatabase().query(
      `SELECT source_kind, source_url, report_locale, analyzed_excerpt,
              extracted_word_count, analyzed_word_count, truncated
       FROM reports
       WHERE id = $1`,
      [reportId],
    );
    const row = firstRow<{
      source_kind: "url" | "image";
      source_url: string | null;
      report_locale: SupportedLocale;
      analyzed_excerpt: string | null;
      extracted_word_count: number | null;
      analyzed_word_count: number | null;
      truncated: boolean;
    }>(rows as unknown[]);
    if (!row) return null;
    if (row.source_kind === "url" && row.source_url) {
      return {
        sourceKind: "url",
        sourceUrl: row.source_url,
        reportLocale: row.report_locale,
      };
    }
    if (
      row.source_kind === "image" &&
      row.analyzed_excerpt &&
      row.extracted_word_count !== null &&
      row.analyzed_word_count !== null
    ) {
      return {
        sourceKind: "image",
        reportLocale: row.report_locale,
        text: row.analyzed_excerpt,
        extractedWordCount: row.extracted_word_count,
        analyzedWordCount: row.analyzed_word_count,
        truncated: row.truncated,
      };
    }
    return null;
  }

  async claimDispatch(reportId?: string): Promise<OutboxDispatch | null> {
    const rows = await getDatabase().query(
      `WITH candidate AS (
        SELECT id
        FROM dispatch_outbox
        WHERE ($1::uuid IS NULL OR report_id = $1)
          AND (
            status IN ('pending', 'failed')
            OR (status = 'dispatching' AND available_at <= now())
          )
          AND available_at <= now()
        ORDER BY id
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE dispatch_outbox outbox
      SET status = 'dispatching',
          attempts = attempts + 1,
          available_at = now() + interval '2 minutes',
          updated_at = now(),
          last_error = NULL
      FROM candidate
      WHERE outbox.id = candidate.id
      RETURNING outbox.id, outbox.report_id`,
      [reportId ?? null],
    );
    const row = firstRow<{ id: number; report_id: string }>(rows as unknown[]);
    return row ? { id: row.id, reportId: row.report_id } : null;
  }

  async markDispatched(outboxId: number, workflowRunId: string) {
    await getDatabase().query(
      `UPDATE dispatch_outbox
       SET status = 'dispatched', workflow_run_id = $2,
           dispatched_at = now(), updated_at = now()
       WHERE id = $1 AND status = 'dispatching'`,
      [outboxId, workflowRunId],
    );
  }

  async markDispatchFailed(outboxId: number, error: unknown) {
    const message = error instanceof Error ? error.message : "Dispatch failed";
    await getDatabase().query(
      `UPDATE dispatch_outbox
       SET status = 'failed', last_error = $2,
           available_at = now() + interval '15 seconds', updated_at = now()
       WHERE id = $1 AND status = 'dispatching'`,
      [outboxId, message.slice(0, 500)],
    );
  }
}

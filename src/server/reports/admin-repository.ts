import { getDatabase } from "../db";

export type WithdrawalResult = "withdrawn" | "already_withdrawn" | "not_found";

export class AdministrativeReportRepository {
  async withdraw(shortId: string, reason: string): Promise<WithdrawalResult> {
    const rows = await getDatabase().query(
      `WITH updated AS (
         UPDATE reports
         SET publicly_visible = false,
             withdrawn_at = now(),
             withdrawal_reason = $2,
             updated_at = now()
         WHERE short_id = $1 AND publicly_visible = true
         RETURNING id
       ), target AS (
         SELECT id FROM reports WHERE short_id = $1
       )
       SELECT CASE
         WHEN EXISTS (SELECT 1 FROM updated) THEN 'withdrawn'
         WHEN EXISTS (SELECT 1 FROM target) THEN 'already_withdrawn'
         ELSE 'not_found'
       END AS result`,
      [shortId, reason],
    );
    const row = (rows as unknown[])[0] as
      | { result: WithdrawalResult }
      | undefined;
    return row?.result ?? "not_found";
  }
}

import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDatabase } from "../db";
import { NeonReportsRepository } from "./neon-repository";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const usageDate = "2100-01-31";
const visitorKey = `test-visitor-${randomUUID()}`;
const networkKey = `test-network-${randomUUID()}`;
const createdReportIds: string[] = [];

describe.skipIf(!runDatabaseTests)("Neon quota admission", () => {
  afterAll(async () => {
    if (!runDatabaseTests) return;
    const sql = getDatabase();
    if (createdReportIds.length > 0) {
      await sql.query("DELETE FROM reports WHERE id = ANY($1::uuid[])", [
        createdReportIds,
      ]);
    }
    await sql.query("DELETE FROM daily_usage WHERE usage_date = $1", [
      usageDate,
    ]);
  });

  it("admits exactly the configured visitor limit under concurrency", async () => {
    const repository = new NeonReportsRepository();
    const attempts = await Promise.all(
      Array.from({ length: 35 }, async (_, index) => {
        const idempotencyKey = `quota-test-${randomUUID()}-${index}`;
        const result = await repository.createUrlReport({
          shortId: `quota${randomUUID().replaceAll("-", "").slice(0, 14)}`,
          sourceUrl: "https://example.com/quota-test",
          reportLocale: "en",
          visitorKey,
          networkKey,
          idempotencyKey,
          usageDate,
        });
        return { idempotencyKey, result };
      }),
    );

    const accepted = attempts.filter(({ result }) => result.accepted);
    const rejected = attempts.filter(({ result }) => !result.accepted);
    for (const { result } of accepted) {
      if (result.accepted) createdReportIds.push(result.report.id);
    }

    expect(accepted).toHaveLength(30);
    expect(rejected).toHaveLength(5);
    expect(
      rejected.every(
        ({ result }) => !result.accepted && result.reason === "visitor",
      ),
    ).toBe(true);

    const first = accepted[0];
    if (!first?.result.accepted) throw new Error("Expected an accepted report");
    const replay = await repository.createUrlReport({
      shortId: `unused${randomUUID().replaceAll("-", "").slice(0, 14)}`,
      sourceUrl: "https://example.com/quota-test",
      reportLocale: "en",
      visitorKey,
      networkKey,
      idempotencyKey: first.idempotencyKey,
      usageDate,
    });
    expect(replay).toMatchObject({
      accepted: true,
      replayed: true,
      report: { id: first.result.report.id },
    });

    await repository.markFailed(first.result.report.id, {
      code: "test_failure",
      publicMessage: "Test failure",
    });
    const replacement = await repository.createUrlReport({
      shortId: `refund${randomUUID().replaceAll("-", "").slice(0, 14)}`,
      sourceUrl: "https://example.com/refund-test",
      reportLocale: "en",
      visitorKey,
      networkKey,
      idempotencyKey: `refund-test-${randomUUID()}`,
      usageDate,
    });
    expect(replacement.accepted).toBe(true);
    if (replacement.accepted) createdReportIds.push(replacement.report.id);

    const sql = getDatabase();
    const usage = await sql.query(
      `SELECT scope, used_count
       FROM daily_usage
       WHERE usage_date = $1 AND (scope = 'global' OR scope_key = $2)
       ORDER BY scope`,
      [usageDate, visitorKey],
    );
    expect(usage).toEqual([
      { scope: "global", used_count: 31 },
      { scope: "visitor", used_count: 30 },
    ]);
  });
});

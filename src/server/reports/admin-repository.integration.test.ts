import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDatabase } from "../db";
import { AdministrativeReportRepository } from "./admin-repository";
import { NeonReportsRepository } from "./neon-repository";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const usageDate = "2100-02-01";
const visitorKey = `withdrawal-visitor-${randomUUID()}`;
const networkKey = `withdrawal-network-${randomUUID()}`;
let reportId: string | undefined;

describe.skipIf(!runDatabaseTests)("administrative report withdrawal", () => {
  afterAll(async () => {
    if (!runDatabaseTests) return;
    if (reportId) {
      await getDatabase().query("DELETE FROM reports WHERE id = $1", [
        reportId,
      ]);
    }
    await getDatabase().query(
      `DELETE FROM daily_usage
       WHERE usage_date = $1 AND scope_key IN ($2, $3)`,
      [usageDate, visitorKey, networkKey],
    );
  });

  it("withdraws exactly one report and removes it from public reads", async () => {
    const shortId = `hide${randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const publicReports = new NeonReportsRepository();
    const created = await publicReports.createUrlReport({
      shortId,
      sourceUrl: "https://example.com/withdrawal-test",
      reportLocale: "en",
      visitorKey,
      networkKey,
      idempotencyKey: `withdrawal-test-${randomUUID()}`,
      usageDate,
    });
    expect(created.accepted).toBe(true);
    if (!created.accepted) throw new Error("Expected report admission");
    reportId = created.report.id;

    const administrator = new AdministrativeReportRepository();
    expect(await administrator.withdraw(shortId, "privacy request")).toBe(
      "withdrawn",
    );
    expect(await publicReports.findByShortId(shortId)).toBeNull();
    expect(await administrator.withdraw(shortId, "duplicate request")).toBe(
      "already_withdrawn",
    );

    const rows = await getDatabase().query(
      `SELECT publicly_visible, withdrawal_reason
       FROM reports WHERE id = $1`,
      [reportId],
    );
    expect(rows).toEqual([
      { publicly_visible: false, withdrawal_reason: "privacy request" },
    ]);
  });
});

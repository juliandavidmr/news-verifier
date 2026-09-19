import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDatabase } from "../db";
import { NeonReportsRepository } from "../reports/neon-repository";
import { ResearchQueueRepository } from "../research/queue-repository";
import { ClaimsRepository } from "./repository";
import type { ClaimIdentification } from "./types";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const usageDate = "2100-02-02";
let reportId: string | undefined;

describe.skipIf(!runDatabaseTests)("claim persistence", () => {
  afterAll(async () => {
    if (!runDatabaseTests) return;
    const sql = getDatabase();
    if (reportId)
      await sql.query("DELETE FROM reports WHERE id = $1", [reportId]);
    await sql.query("DELETE FROM daily_usage WHERE usage_date = $1", [
      usageDate,
    ]);
  });

  it("stores selected and limit-skipped claims with one visible transition", async () => {
    const reports = new NeonReportsRepository();
    const created = await reports.createUrlReport({
      shortId: `claim${randomUUID().replaceAll("-", "").slice(0, 14)}`,
      sourceUrl: "https://example.com/claim-test",
      reportLocale: "en",
      visitorKey: `claim-visitor-${randomUUID()}`,
      networkKey: `claim-network-${randomUUID()}`,
      idempotencyKey: `claim-request-${randomUUID()}`,
      usageDate,
    });
    if (!created.accepted) throw new Error("Test report was rejected");
    reportId = created.report.id;

    const queue = new ResearchQueueRepository();
    expect(await queue.acquireLease(reportId, "claim-run")).toMatchObject({
      outcome: "acquired",
    });
    const text =
      "A sufficiently long analyzed excerpt for deterministic claim persistence testing. ".repeat(
        4,
      );
    await reports.markExtracted(reportId, {
      canonicalUrl: "https://example.com/claim-test",
      title: "Claim test",
      author: null,
      text,
      extractedWordCount: 40,
      analyzedWordCount: 40,
      truncated: false,
    });

    const claims: ClaimIdentification[] = Array.from(
      { length: 16 },
      (_, index) => ({
        statement: `Claim ${index + 1}`,
        sourceStart: index * 2,
        sourceEnd: index * 2 + 1,
        contextPassage: `Context ${index + 1}`,
        importance: 5,
        referencePeriod: "2026",
        referenceScope: "Example",
        canonicalKey: `claim-${index + 1}`,
        selectionStatus: index < 15 ? "selected" : "uninvestigated_limit",
      }),
    );
    await new ClaimsRepository().persistIdentification(reportId, claims, {
      requestedModel: "inclusionai/test-free",
      responseModel: "inclusionai/test-free",
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const rows = await getDatabase().query(
      `SELECT selection_status, count(*)::integer AS count
       FROM claims WHERE report_id = $1
       GROUP BY selection_status ORDER BY selection_status`,
      [reportId],
    );
    expect(rows).toEqual([
      { selection_status: "selected", count: 15 },
      { selection_status: "uninvestigated_limit", count: 1 },
    ]);
    const events = await reports.listEvents(reportId, 0);
    expect(events.map((event) => event.stage)).toEqual([
      "queued",
      "extracting",
      "identifying_claims",
      "researching",
    ]);
  });
});

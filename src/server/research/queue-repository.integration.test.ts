import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDatabase } from "../db";
import { NeonReportsRepository } from "../reports/neon-repository";
import { ResearchQueueRepository } from "./queue-repository";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const usageDate = "2100-02-01";
const reportIds: string[] = [];

async function createQueuedReport(index: number) {
  const result = await new NeonReportsRepository().createUrlReport({
    shortId: `lease${randomUUID().replaceAll("-", "").slice(0, 14)}`,
    sourceUrl: "https://example.com/lease-test",
    reportLocale: "en",
    visitorKey: `lease-visitor-${index}-${randomUUID()}`,
    networkKey: `lease-network-${randomUUID()}`,
    idempotencyKey: `lease-request-${randomUUID()}`,
    usageDate,
  });
  if (!result.accepted) throw new Error("Test report was rejected");
  reportIds.push(result.report.id);
  return result.report;
}

describe.skipIf(!runDatabaseTests)("research queue leases", () => {
  afterAll(async () => {
    if (!runDatabaseTests) return;
    const sql = getDatabase();
    if (reportIds.length > 0) {
      await sql.query("DELETE FROM reports WHERE id = ANY($1::uuid[])", [
        reportIds,
      ]);
    }
    await sql.query("DELETE FROM daily_usage WHERE usage_date = $1", [
      usageDate,
    ]);
  });

  it("handles redelivery, concurrency, expiry, queue timeout and resumption", async () => {
    const queue = new ResearchQueueRepository();
    const [first, second, third, timedOut] = await Promise.all([
      createQueuedReport(1),
      createQueuedReport(2),
      createQueuedReport(3),
      createQueuedReport(4),
    ]);
    const start = new Date();

    const firstDispatch = await queue.claimDispatch(first.id);
    expect(firstDispatch?.reportId).toBe(first.id);
    await getDatabase().query(
      "UPDATE dispatch_outbox SET available_at = now() - interval '1 second' WHERE id = $1",
      [firstDispatch?.id],
    );
    const recoveredDispatch = await queue.claimDispatch(first.id);
    expect(recoveredDispatch?.id).toBe(firstDispatch?.id);
    if (!recoveredDispatch) throw new Error("Expected recovered outbox row");
    await queue.markDispatchFailed(recoveredDispatch.id, new Error("crash"));
    await getDatabase().query(
      "UPDATE dispatch_outbox SET available_at = now() - interval '1 second' WHERE id = $1",
      [recoveredDispatch.id],
    );
    const retriedDispatch = await queue.claimDispatch(first.id);
    expect(retriedDispatch?.id).toBe(firstDispatch?.id);
    if (!retriedDispatch) throw new Error("Expected retried outbox row");
    await queue.markDispatched(retriedDispatch.id, "run-1");

    expect(await queue.acquireLease(first.id, "run-1", start)).toMatchObject({
      outcome: "acquired",
      slot: 1,
    });
    expect(await queue.acquireLease(first.id, "run-1", start)).toMatchObject({
      outcome: "acquired",
      slot: 1,
    });
    expect(await queue.acquireLease(first.id, "duplicate", start)).toEqual({
      outcome: "duplicate",
    });
    expect(await queue.acquireLease(second.id, "run-2", start)).toMatchObject({
      outcome: "acquired",
      slot: 2,
    });
    expect(await queue.acquireLease(third.id, "run-3", start)).toEqual({
      outcome: "queued",
      retryAfterSeconds: 10,
    });

    const heartbeatAt = new Date(start.getTime() + 30_000);
    expect(await queue.heartbeat(first.id, "run-1", heartbeatAt)).toBe(true);
    const recoveryAt = new Date(start.getTime() + 61_000);
    expect(
      await queue.acquireLease(third.id, "run-3", recoveryAt),
    ).toMatchObject({ outcome: "acquired", slot: 2 });

    await queue.release(third.id, "run-3");
    expect(
      await queue.acquireLease(
        third.id,
        "run-resumed",
        new Date(recoveryAt.getTime() + 1_000),
      ),
    ).toMatchObject({ outcome: "acquired", slot: 2 });

    const exhaustedAt = new Date(start.getTime() + 901_000);
    expect(
      await queue.acquireLease(timedOut.id, "run-timeout", exhaustedAt),
    ).toEqual({ outcome: "expired" });
  });
});

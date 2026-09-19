import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDatabase } from "../db";
import { ResearchQueueRepository } from "../research/queue-repository";
import { NeonReportsRepository } from "./neon-repository";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const usageDate = "2100-02-01";
const reportIds: string[] = [];

describe.skipIf(!runDatabaseTests)("ephemeral image report admission", () => {
  afterAll(async () => {
    if (!runDatabaseTests || reportIds.length === 0) return;
    await getDatabase().query(
      "DELETE FROM reports WHERE id = ANY($1::uuid[])",
      [reportIds],
    );
    await getDatabase().query("DELETE FROM daily_usage WHERE usage_date = $1", [
      usageDate,
    ]);
  });

  it("persists only extracted text and replays the admission idempotently", async () => {
    const reports = new NeonReportsRepository();
    const idempotencyKey = `image-test-${randomUUID()}`;
    const input = {
      shortId: `image${randomUUID().replaceAll("-", "").slice(0, 14)}`,
      reportLocale: "es" as const,
      visitorKey: `image-visitor-${randomUUID()}`,
      networkKey: `image-network-${randomUUID()}`,
      idempotencyKey,
      usageDate,
      extracted: {
        canonicalUrl: "",
        title: null,
        author: null,
        text: "Esta captura contiene una afirmación verificable con suficiente contexto para investigar.",
        extractedWordCount: 12,
        analyzedWordCount: 12,
        truncated: false,
        confidence: 91.5,
      },
    };

    const created = await reports.createImageReport(input);
    expect(created.accepted).toBe(true);
    if (!created.accepted) return;
    reportIds.push(created.report.id);
    expect(created.report).toMatchObject({
      sourceKind: "image",
      sourceUrl: null,
      status: "queued",
      analyzedWordCount: 12,
    });

    const source = await new ResearchQueueRepository().getSource(
      created.report.id,
    );
    expect(source).toMatchObject({
      sourceKind: "image",
      reportLocale: "es",
      analyzedWordCount: 12,
    });

    const replay = await reports.createImageReport({
      ...input,
      shortId: `unused${randomUUID().replaceAll("-", "").slice(0, 13)}`,
    });
    expect(replay).toMatchObject({
      accepted: true,
      replayed: true,
      report: { id: created.report.id, sourceKind: "image", sourceUrl: null },
    });
  });
});

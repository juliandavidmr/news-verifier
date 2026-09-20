import { describe, expect, it, vi } from "vitest";
import { InMemoryReportsRepository } from "../testing/in-memory-reports";
import { startImageInvestigation } from "./start-image-investigation";

const extracted = {
  canonicalUrl: "",
  title: null,
  author: null,
  text: "A screenshot with enough readable factual content to begin an evidence investigation safely.",
  extractedWordCount: 13,
  analyzedWordCount: 13,
  truncated: false,
  confidence: 94,
  languageSet: "eng+spa+fra+por",
};

describe("image investigation admission", () => {
  it("responds after admission and defers image processing exactly once", async () => {
    const reports = new InMemoryReportsRepository();
    const tasks: Array<() => Promise<void>> = [];
    const process = vi.fn(async (reportId: string) => {
      await reports.completeImageOcr(reportId, extracted);
    });
    const dependencies = {
      reports,
      backgroundTasks: {
        defer: (task: () => Promise<void>) => tasks.push(task),
      },
      process,
      createShortId: () => "imageScenario1",
    };
    const input = {
      reportLocale: "en" as const,
      visitorKey: "visitor",
      networkKey: "network",
      idempotencyKey: "image-idempotency-key",
    };

    const first = await startImageInvestigation(dependencies, input);
    const replay = await startImageInvestigation(dependencies, input);

    expect(first.report).toMatchObject({
      sourceKind: "image",
      sourceUrl: null,
      status: "extracting",
      analyzedExcerpt: null,
    });
    expect(first.processingScheduled).toBe(true);
    expect(replay.report.id).toBe(first.report.id);
    expect(replay.processingScheduled).toBe(false);
    expect(process).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(1);
    await tasks[0]?.();
    expect(process).toHaveBeenCalledExactlyOnceWith(first.report.id);
    expect(reports.reports.get(first.report.id)).toMatchObject({
      status: "queued",
      analyzedExcerpt: extracted.text,
    });
    expect(reports.events.get(first.report.id)?.at(-1)).toMatchObject({
      stage: "queued",
      payload: { status: "queued" },
    });
  });

  it("does not await deferred image processing", async () => {
    const reports = new InMemoryReportsRepository();
    let task: (() => Promise<void>) | undefined;
    const neverFinishes = new Promise<void>(() => undefined);

    const result = await startImageInvestigation(
      {
        reports,
        backgroundTasks: {
          defer: (deferredTask) => {
            task = deferredTask;
          },
        },
        process: () => neverFinishes,
        createShortId: () => "fastImageResponse",
      },
      {
        reportLocale: "es",
        visitorKey: "visitor-fast",
        networkKey: "network-fast",
        idempotencyKey: "image-fast-response",
      },
    );

    expect(result.processingScheduled).toBe(true);
    expect(task).toBeTypeOf("function");
  });
});

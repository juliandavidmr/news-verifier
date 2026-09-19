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
  it("creates an image report and dispatches it exactly once", async () => {
    const reports = new InMemoryReportsRepository();
    const tasks: Array<() => Promise<void>> = [];
    const dispatch = vi.fn(async () => undefined);
    const dependencies = {
      reports,
      backgroundTasks: {
        defer: (task: () => Promise<void>) => tasks.push(task),
      },
      dispatch,
      createShortId: () => "imageScenario1",
    };
    const input = {
      extracted,
      reportLocale: "en" as const,
      visitorKey: "visitor",
      networkKey: "network",
      idempotencyKey: "image-idempotency-key",
    };

    const first = await startImageInvestigation(dependencies, input);
    const replay = await startImageInvestigation(dependencies, input);

    expect(first).toMatchObject({
      sourceKind: "image",
      sourceUrl: null,
      analyzedExcerpt: extracted.text,
    });
    expect(replay.id).toBe(first.id);
    expect(tasks).toHaveLength(1);
    await tasks[0]?.();
    expect(dispatch).toHaveBeenCalledExactlyOnceWith(first.id);
  });
});

import { describe, expect, it } from "vitest";
import { InvestigationScenario } from "../testing/investigation-scenario";

describe("URL investigation scenario", () => {
  it("creates an addressable report before extraction and persists the result", async () => {
    const scenario = new InvestigationScenario();
    const started = await scenario.startUrl();

    expect(started.shortId).toBe("scenario1234");
    expect(started.status).toBe("extracting");

    await scenario.runBackgroundTasks();

    const report = await scenario.reports.findByShortId(started.shortId);
    const events = await scenario.reports.listEvents(started.id, 0);
    expect(report).toMatchObject({
      status: "partial",
      extractedTitle: "Example story",
      extractedWordCount: 19,
      analyzedWordCount: 19,
      truncated: false,
    });
    expect(events.map((event) => event.stage)).toEqual([
      "extracting",
      "partial",
    ]);
  });

  it("persists an extraction failure without throwing from the background task", async () => {
    const scenario = new InvestigationScenario().givenRemoteDocument({
      finalUrl: "https://example.com/empty",
      contentType: "text/plain",
      body: "Too short",
    });
    const started = await scenario.startUrl("https://example.com/empty");

    await scenario.runBackgroundTasks();

    const report = await scenario.reports.findByShortId(started.shortId);
    expect(report).toMatchObject({
      status: "failed",
      errorCode: "unsupported_content",
    });
  });

  it("replays an idempotent request without scheduling duplicate work", async () => {
    const scenario = new InvestigationScenario();
    const first = await scenario.startUrl();
    const replay = await scenario.startUrl();

    expect(replay.id).toBe(first.id);
    expect(scenario.reports.reports.size).toBe(1);

    await scenario.runBackgroundTasks();
    const events = await scenario.reports.listEvents(first.id, 0);
    expect(events.map((event) => event.stage)).toEqual([
      "extracting",
      "partial",
    ]);
  });
});

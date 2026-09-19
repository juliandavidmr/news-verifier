import { describe, expect, it } from "vitest";
import type { ReportEvent } from "../domain/reports";
import {
  advanceEventCursor,
  maximumPollDelay,
  regularPollDelay,
  retryDelay,
  shouldAnnounceReady,
} from "./report-live-state";

describe("live report recovery", () => {
  it("backs off after disconnects and returns to the normal cadence after recovery", () => {
    expect(retryDelay(0)).toBe(regularPollDelay);
    expect(retryDelay(1)).toBe(regularPollDelay);
    expect(retryDelay(2)).toBe(3_000);
    expect(retryDelay(8)).toBe(maximumPollDelay);
    expect(retryDelay(0)).toBe(regularPollDelay);
  });

  it("resumes after the last authoritative event without replaying the cursor", () => {
    const events = [
      { sequence: 4 },
      { sequence: 6 },
      { sequence: 5 },
    ] as ReportEvent[];
    expect(advanceEventCursor(3, events)).toBe(6);
    expect(advanceEventCursor(6, [])).toBe(6);
  });

  it("announces only the first active-to-terminal transition in a tab", () => {
    expect(shouldAnnounceReady("researching", "completed", false)).toBe(true);
    expect(shouldAnnounceReady("completed", "completed", false)).toBe(false);
    expect(shouldAnnounceReady("researching", "failed", true)).toBe(false);
  });
});

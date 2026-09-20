import { describe, expect, it } from "vitest";
import { imageOcrOutcome } from "./image-ocr-state";

describe("image OCR navigation gate", () => {
  it("stays pending while OCR has not persisted extracted text", () => {
    expect(
      imageOcrOutcome({
        report: { status: "extracting", errorCode: null },
        events: [{ sequence: 1, stage: "extracting" }],
      }),
    ).toEqual({ state: "pending" });
  });

  it("allows navigation only after the post-OCR queued event", () => {
    expect(
      imageOcrOutcome({
        report: { status: "extracting", errorCode: null },
        events: [
          { sequence: 1, stage: "extracting" },
          { sequence: 2, stage: "queued" },
          { sequence: 3, stage: "extracting" },
        ],
      }),
    ).toEqual({ state: "ready" });
  });

  it("keeps OCR failures on the upload screen", () => {
    expect(
      imageOcrOutcome({
        report: {
          status: "failed",
          errorCode: "ocr_quality_insufficient",
        },
        events: [
          { sequence: 1, stage: "extracting" },
          { sequence: 2, stage: "failed" },
        ],
      }),
    ).toEqual({ state: "failed", code: "ocr_quality_insufficient" });
  });
});

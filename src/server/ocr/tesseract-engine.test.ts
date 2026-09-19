import { describe, expect, it } from "vitest";
import { assessOcrQuality } from "./ocr-quality";

describe("OCR quality assessment", () => {
  const readable =
    "This is a sufficiently long and readable sentence containing enough words for a news verification report.";

  it("accepts readable text with a reliable confidence score", () => {
    expect(assessOcrQuality(readable, 70).text).toBe(readable);
  });

  it("rejects plausible-looking transliteration with low confidence", () => {
    expect(() => assessOcrQuality(readable, 53)).toThrow(
      "ocr_quality_insufficient",
    );
  });
});

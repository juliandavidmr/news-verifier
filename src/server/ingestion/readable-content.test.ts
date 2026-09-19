import { describe, expect, it } from "vitest";
import { extractReadableContent } from "./readable-content";

describe("readable content extraction", () => {
  it("extracts article metadata and readable text", () => {
    const result = extractReadableContent({
      finalUrl: "https://example.com/report",
      contentType: "text/html",
      body: `<html><head><title>Public report</title></head><body>
        <nav>Navigation should be ignored</nav>
        <article><h1>Public report</h1><p>The agency released the complete dataset on Friday.</p>
        <p>The figures cover the full calendar year and include a documented methodology.</p></article>
      </body></html>`,
    });
    expect(result.title).toBe("Public report");
    expect(result.text).toContain("complete dataset");
    expect(result.text).not.toContain("Navigation should be ignored");
  });

  it("limits the analyzed extract to 2,000 words", () => {
    const words = Array.from(
      { length: 2_005 },
      (_, index) => `word${index}`,
    ).join(" ");
    const result = extractReadableContent({
      finalUrl: "https://example.com/long",
      contentType: "text/plain",
      body: words,
    });
    expect(result.extractedWordCount).toBe(2_005);
    expect(result.analyzedWordCount).toBe(2_000);
    expect(result.truncated).toBe(true);
    expect(result.text).not.toContain("word2004");
  });
});

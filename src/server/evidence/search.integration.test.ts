import { describe, expect, it } from "vitest";
import { DirectExaSearchAdapter } from "./search";

const runExaTests = process.env.RUN_EXA_TESTS === "1";

describe.skipIf(!runExaTests)("direct Exa evidence search", () => {
  it("returns candidate URLs without treating excerpts as evidence", async () => {
    const result = await new DirectExaSearchAdapter().search({
      query:
        "World Health Organization official source climate change health facts",
      limit: 2,
      reportId: "integration-test",
    });
    expect(result.provider).toBe("direct_exa");
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(
      result.candidates.every((candidate) => candidate.url.startsWith("http")),
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { DirectExaSearchAdapter, ResilientExaSearchAdapter } from "./search";
import type { EvidenceSearchAdapter } from "./types";

const request = { query: "verified claim", limit: 3, reportId: "report-1" };

describe("Exa search adapters", () => {
  it("maps direct Exa results while keeping excerpts discovery-only", async () => {
    const adapter = new DirectExaSearchAdapter(
      "test-key",
      async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                url: "https://example.com/source",
                title: "Source",
                highlights: ["Unverified discovery excerpt"],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    await expect(adapter.search(request)).resolves.toEqual({
      provider: "direct_exa",
      candidates: [
        {
          url: "https://example.com/source",
          title: "Source",
          author: null,
          publishedDate: null,
          discoveryExcerpt: "Unverified discovery excerpt",
        },
      ],
    });
  });

  it("falls back once and then bypasses an unavailable Gateway", async () => {
    let primaryCalls = 0;
    let fallbackCalls = 0;
    const primary: EvidenceSearchAdapter = {
      search: async () => {
        primaryCalls += 1;
        throw new Error("Gateway unavailable");
      },
    };
    const fallback: EvidenceSearchAdapter = {
      search: async () => {
        fallbackCalls += 1;
        return { provider: "direct_exa", candidates: [] };
      },
    };
    const adapter = new ResilientExaSearchAdapter(primary, fallback);
    await adapter.search(request);
    await adapter.search(request);
    expect({ primaryCalls, fallbackCalls }).toEqual({
      primaryCalls: 1,
      fallbackCalls: 2,
    });
  });
});

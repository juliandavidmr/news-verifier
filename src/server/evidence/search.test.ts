import { describe, expect, it, vi } from "vitest";
import type { AiPlatformRepository } from "../ai/platform-capacity";
import { PlatformCapacityError } from "../ai/platform-capacity";
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

  it("isolates Gateway search failures from inference circuits", async () => {
    const openCircuit = vi.fn(async () => undefined);
    const platform = {
      isCircuitOpen: vi.fn(async () => false),
      openCircuit,
      recordAttempt: vi.fn(async () => undefined),
    } as unknown as AiPlatformRepository;
    const primary: EvidenceSearchAdapter = {
      search: async () => {
        throw new PlatformCapacityError("ai_gateway", "search_model_not_free");
      },
    };
    const fallback: EvidenceSearchAdapter = {
      search: async () => ({ provider: "direct_exa", candidates: [] }),
    };

    const adapter = new ResilientExaSearchAdapter(primary, fallback, platform);
    await expect(adapter.search(request)).resolves.toMatchObject({
      provider: "direct_exa",
    });
    expect(openCircuit).toHaveBeenCalledWith(
      "ai_gateway_search",
      "search_model_not_free",
    );
    expect(openCircuit).not.toHaveBeenCalledWith(
      "ai_gateway",
      expect.anything(),
    );
  });
});

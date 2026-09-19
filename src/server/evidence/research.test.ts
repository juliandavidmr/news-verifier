import { describe, expect, it } from "vitest";
import type { RemoteDocumentFetcher } from "../ingestion/public-url";
import { type EvidenceResearchStore, researchEvidence } from "./research";
import type {
  EvidenceResearchInput,
  EvidenceSearchAdapter,
  ValidatedEvidence,
} from "./types";
import { verifyProposedFragment } from "./validate";

const input: EvidenceResearchInput = {
  reportId: "report-1",
  reportLocale: "en",
  sourceUrl: "https://news.example/original",
  claims: [
    {
      id: "claim-1",
      statement: "The city opened 12 libraries in 2025.",
      referencePeriod: "2025",
      referenceScope: "the city",
    },
  ],
  maxSearches: 1,
  maxResults: 6,
  maxEvidencePerClaim: 3,
};

function harness() {
  const saved: ValidatedEvidence[][] = [];
  const failed: string[] = [];
  const store: EvidenceResearchStore = {
    reserveSearch: async () => "search-1",
    completeSearch: async (_id, _provider, _count, evidence) => {
      saved.push(evidence);
    },
    failSearch: async (_id, code) => {
      failed.push(code);
    },
  };
  const search: EvidenceSearchAdapter = {
    search: async () => ({
      provider: "direct_exa",
      candidates: [
        {
          url: "https://city.gov/library-release?utm_source=test",
          title: "City release",
          author: "City office",
          publishedDate: "2025-02-02",
          discoveryExcerpt: "The city opened 12 libraries in 2025.",
        },
        {
          url: "https://offline.example/story",
          title: "Offline",
          author: null,
          publishedDate: null,
          discoveryExcerpt: null,
        },
        {
          url: "https://snippet.example/story",
          title: "Misleading snippet",
          author: null,
          publishedDate: null,
          discoveryExcerpt: "The city opened 12 libraries in 2025.",
        },
        {
          url: "https://wire-a.example/story",
          title: "Wire copy A",
          author: "Wire",
          publishedDate: null,
          discoveryExcerpt: null,
        },
        {
          url: "https://wire-b.example/story",
          title: "Wire copy B",
          author: "Wire",
          publishedDate: null,
          discoveryExcerpt: null,
        },
        {
          url: "https://news.example/original#copy",
          title: "The submitted source",
          author: null,
          publishedDate: null,
          discoveryExcerpt: null,
        },
      ],
    }),
  };
  const documents = new Map([
    [
      "https://city.gov/library-release?utm_source=test",
      "The city opened 12 libraries in 2025. The municipal register lists each location.",
    ],
    [
      "https://snippet.example/story",
      "This page discusses a concert and contains no information about public buildings.",
    ],
    [
      "https://wire-a.example/story",
      "Records confirm the city opened 12 libraries in 2025. Residents attended the ceremonies.",
    ],
    [
      "https://wire-b.example/story",
      "Records confirm the city opened 12 libraries in 2025. Residents attended the ceremonies.",
    ],
  ]);
  const fetcher: RemoteDocumentFetcher = {
    fetch: async (url) => {
      const body = documents.get(url.toString());
      if (!body) throw new Error("unavailable");
      return { finalUrl: url.toString(), contentType: "text/plain", body };
    },
  };
  return { store, search, fetcher, saved, failed };
}

describe("evidence research", () => {
  it("validates downloaded pages and rejects inaccessible, snippet-only, self, and syndicated duplicates", async () => {
    const test = harness();
    const result = await researchEvidence(input, test.store, {
      search: test.search,
      fetcher: test.fetcher,
    });

    expect(result).toEqual({ completedSearches: 1, evidenceRecords: 2 });
    expect(test.failed).toEqual([]);
    expect(test.saved[0]).toHaveLength(2);
    expect(test.saved[0][0]).toMatchObject({
      canonicalUrl: "https://city.gov/library-release",
      sourceHierarchy: "primary",
      searchProvider: "direct_exa",
    });
    expect(test.saved[0].every((evidence) => evidence.sourceFragment)).toBe(
      true,
    );
    expect(
      test.saved[0].some((evidence) =>
        evidence.sourceUrl.includes("snippet.example"),
      ),
    ).toBe(false);
  });

  it("rejects a fabricated quote even when a search snippet supplied it", () => {
    expect(
      verifyProposedFragment(
        "The official page says nine branches were renovated.",
        "The city opened 12 libraries in 2025.",
      ),
    ).toBe(false);
  });

  it("never exceeds the persisted search budget", async () => {
    let reservations = 0;
    const test = harness();
    const budgetedInput = {
      ...input,
      maxSearches: 1,
      claims: [input.claims[0], { ...input.claims[0], id: "claim-2" }],
    };
    test.store.reserveSearch = async () => {
      reservations += 1;
      return reservations <= 1 ? `search-${reservations}` : null;
    };
    await researchEvidence(budgetedInput, test.store, {
      search: test.search,
      fetcher: test.fetcher,
    });
    expect(reservations).toBe(1);
  });
});

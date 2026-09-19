import type { SupportedLocale } from "../../domain/reports";
import type { RemoteDocumentFetcher } from "../ingestion/public-url";

export type EvidenceProvider = "gateway_exa" | "direct_exa";
export type SourceHierarchy = "primary" | "expert" | "independent" | "other";

export type EvidenceClaim = {
  id: string;
  statement: string;
  referencePeriod: string;
  referenceScope: string;
};

export type EvidenceResearchInput = {
  reportId: string;
  reportLocale: SupportedLocale;
  sourceUrl: string | null;
  claims: EvidenceClaim[];
  maxSearches: number;
  maxResults: number;
  maxEvidencePerClaim: number;
  concurrency: number;
  stopStartingAt: string;
};

export type EvidenceSearchRequest = {
  query: string;
  limit: number;
  reportId: string;
};

export type EvidenceCandidate = {
  url: string;
  title: string | null;
  author: string | null;
  publishedDate: string | null;
  discoveryExcerpt: string | null;
};

export type EvidenceSearchResult = {
  provider: EvidenceProvider;
  candidates: EvidenceCandidate[];
  modelCall?: {
    requestedModel: string;
    responseModel: string;
    usage: Record<string, unknown>;
  };
};

export interface EvidenceSearchAdapter {
  search(request: EvidenceSearchRequest): Promise<EvidenceSearchResult>;
}

export type ValidatedEvidence = {
  sourceUrl: string;
  canonicalUrl: string;
  sourceTitle: string | null;
  sourceAuthor: string | null;
  publishedAt: string | null;
  sourceFragment: string;
  sourceLanguage: string;
  translatedFragment: string | null;
  query: string;
  sourceHierarchy: SourceHierarchy;
  contentFingerprint: string;
  dependencyFingerprint: string;
  searchProvider: EvidenceProvider;
};

export type EvidenceResearchDependencies = {
  search: EvidenceSearchAdapter;
  fetcher: RemoteDocumentFetcher;
  now?: () => Date;
};

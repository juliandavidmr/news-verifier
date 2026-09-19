import { parsePublicHttpUrl } from "../ingestion/public-url";
import { extractReadableContent } from "../ingestion/readable-content";
import { buildEvidenceQuery } from "./query";
import type { EvidenceRepository } from "./repository";
import type {
  EvidenceResearchDependencies,
  EvidenceResearchInput,
  ValidatedEvidence,
} from "./types";
import {
  canonicalizeEvidenceUrl,
  classifySource,
  detectEvidenceLanguage,
  fingerprint,
  selectEvidenceFragment,
  verifyProposedFragment,
} from "./validate";

export type EvidenceResearchStore = Pick<
  EvidenceRepository,
  "reserveSearch" | "completeSearch" | "failSearch"
>;

function validPublishedDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function hierarchyRank(value: ReturnType<typeof classifySource>) {
  return { primary: 0, expert: 1, independent: 2, other: 3 }[value];
}

function candidateRank(url: string) {
  try {
    return hierarchyRank(classifySource(url));
  } catch {
    return 4;
  }
}

export async function researchEvidence(
  input: EvidenceResearchInput,
  store: EvidenceResearchStore,
  dependencies: EvidenceResearchDependencies,
) {
  const reportSource = canonicalizeEvidenceUrl(input.sourceUrl);
  let completedSearches = 0;
  let evidenceRecords = 0;

  for (const claim of input.claims.slice(0, input.maxSearches)) {
    const query = buildEvidenceQuery(claim, input.reportLocale);
    const searchId = await store.reserveSearch({
      reportId: input.reportId,
      claimId: claim.id,
      query,
      maxSearches: input.maxSearches,
    });
    if (!searchId) continue;

    try {
      const result = await dependencies.search.search({
        query,
        limit: input.maxResults,
        reportId: input.reportId,
      });
      const accepted: ValidatedEvidence[] = [];
      const seenUrls = new Set<string>();
      const seenDependencies = new Set<string>();
      const candidates = [...result.candidates].sort(
        (left, right) => candidateRank(left.url) - candidateRank(right.url),
      );

      for (const candidate of candidates) {
        if (accepted.length >= input.maxEvidencePerClaim) break;
        let requestedUrl: URL;
        let canonicalCandidate: string;
        try {
          requestedUrl = parsePublicHttpUrl(candidate.url);
          canonicalCandidate = canonicalizeEvidenceUrl(requestedUrl.toString());
        } catch {
          continue;
        }
        if (
          canonicalCandidate === reportSource ||
          seenUrls.has(canonicalCandidate)
        ) {
          continue;
        }

        try {
          const document = await dependencies.fetcher.fetch(requestedUrl);
          const canonicalFinal = canonicalizeEvidenceUrl(document.finalUrl);
          if (canonicalFinal === reportSource || seenUrls.has(canonicalFinal)) {
            continue;
          }
          const extracted = extractReadableContent(document, {
            maxWords: 8_000,
          });
          const fragment = selectEvidenceFragment(
            extracted.text,
            claim.statement,
          );
          if (!fragment || !verifyProposedFragment(extracted.text, fragment)) {
            continue;
          }
          const dependencyFingerprint = fingerprint(extracted.text);
          if (seenDependencies.has(dependencyFingerprint)) continue;
          const language = detectEvidenceLanguage(fragment);
          accepted.push({
            sourceUrl: document.finalUrl,
            canonicalUrl: canonicalFinal,
            sourceTitle: extracted.title ?? candidate.title,
            sourceAuthor: extracted.author ?? candidate.author,
            publishedAt: validPublishedDate(candidate.publishedDate),
            sourceFragment: fragment,
            sourceLanguage: language,
            translatedFragment:
              language === input.reportLocale ? fragment : null,
            query,
            sourceHierarchy: classifySource(canonicalFinal),
            contentFingerprint: fingerprint(document.body),
            dependencyFingerprint,
            searchProvider: result.provider,
          });
          seenUrls.add(canonicalFinal);
          seenDependencies.add(dependencyFingerprint);
        } catch {
          // Inaccessible and unsupported candidates are discovery misses, not evidence.
        }
      }

      await store.completeSearch(
        searchId,
        result.provider,
        result.candidates.length,
        accepted,
        result.modelCall,
      );
      completedSearches += 1;
      evidenceRecords += accepted.length;
    } catch {
      await store.failSearch(searchId, "search_unavailable");
    }
  }

  return { completedSearches, evidenceRecords };
}

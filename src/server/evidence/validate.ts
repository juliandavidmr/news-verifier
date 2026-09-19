import { createHash } from "node:crypto";
import type { SourceHierarchy } from "./types";

const trackingParameters = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
]);

const stopWords = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "from",
  "this",
  "was",
  "were",
  "los",
  "las",
  "del",
  "que",
  "con",
  "para",
  "por",
  "una",
  "uno",
  "les",
  "des",
  "que",
  "pour",
  "avec",
  "une",
  "dans",
  "dos",
  "das",
  "que",
  "com",
  "para",
  "uma",
  "por",
]);

export function normalizeEvidenceText(value: string) {
  return value
    .normalize("NFKC")
    .replaceAll(/[“”]/gu, '"')
    .replaceAll(/[‘’]/gu, "'")
    .replaceAll(/\s+/gu, " ")
    .trim();
}

export function canonicalizeEvidenceUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (
    (url.protocol === "https:" && url.port === "443") ||
    (url.protocol === "http:" && url.port === "80")
  ) {
    url.port = "";
  }
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || trackingParameters.has(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/u, "");
  return url.toString();
}

export function fingerprint(value: string) {
  return createHash("sha256")
    .update(normalizeEvidenceText(value))
    .digest("hex");
}

function keywords(value: string) {
  return new Set(
    normalizeEvidenceText(value)
      .toLocaleLowerCase()
      .replaceAll(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/u)
      .filter((word) => word.length > 2 && !stopWords.has(word)),
  );
}

export function verifyProposedFragment(source: string, fragment: string) {
  const normalizedFragment = normalizeEvidenceText(fragment);
  return (
    normalizedFragment.length >= 20 &&
    normalizeEvidenceText(source).includes(normalizedFragment)
  );
}

export function selectEvidenceFragment(source: string, claim: string) {
  const claimWords = keywords(claim);
  if (claimWords.size === 0) return null;
  const segments = source
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length >= 20 && segment.length <= 900);
  let best: { segment: string; score: number } | null = null;
  for (const segment of segments) {
    const segmentWords = keywords(segment);
    let overlap = 0;
    for (const word of claimWords) if (segmentWords.has(word)) overlap += 1;
    const score = overlap / Math.max(1, Math.min(claimWords.size, 8));
    if (!best || score > best.score) best = { segment, score };
  }
  if (!best || best.score < 0.2) return null;
  return best.segment;
}

export function detectEvidenceLanguage(value: string) {
  const sample = ` ${normalizeEvidenceText(value).toLocaleLowerCase()} `;
  const scores = {
    es: [" el ", " la ", " de ", " que ", " para ", " los "],
    en: [" the ", " of ", " and ", " that ", " for ", " with "],
    fr: [" le ", " la ", " de ", " et ", " pour ", " les "],
    pt: [" o ", " a ", " de ", " que ", " para ", " os "],
  };
  return (Object.entries(scores) as [string, string[]][])
    .map(([language, markers]) => ({
      language,
      score: markers.filter((marker) => sample.includes(marker)).length,
    }))
    .sort((left, right) => right.score - left.score)[0]?.score
    ? (Object.entries(scores) as [string, string[]][])
        .map(([language, markers]) => ({
          language,
          score: markers.filter((marker) => sample.includes(marker)).length,
        }))
        .sort((left, right) => right.score - left.score)[0].language
    : "und";
}

export function classifySource(urlValue: string): SourceHierarchy {
  const hostname = new URL(urlValue).hostname.toLowerCase();
  if (
    hostname.endsWith(".gov") ||
    hostname.includes(".gov.") ||
    hostname.endsWith(".int") ||
    hostname.endsWith("who.int") ||
    hostname.endsWith("europa.eu") ||
    hostname.endsWith("un.org")
  ) {
    return "primary";
  }
  if (
    hostname.endsWith(".edu") ||
    hostname.includes(".edu.") ||
    hostname.endsWith("nature.com") ||
    hostname.endsWith("science.org") ||
    hostname.endsWith("thelancet.com")
  ) {
    return "expert";
  }
  return hostname ? "independent" : "other";
}

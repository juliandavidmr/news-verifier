import type { ClaimIdentification, DetectedClaim } from "./types";

function normalizedWords(value: string) {
  return new Set(
    value
      .toLocaleLowerCase()
      .normalize("NFKD")
      .replaceAll(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .split(/\s+/u)
      .filter((word) => word.length > 2),
  );
}

function similarity(left: string, right: string) {
  const leftWords = normalizedWords(left);
  const rightWords = normalizedWords(right);
  const union = new Set([...leftWords, ...rightWords]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const word of leftWords) if (rightWords.has(word)) intersection += 1;
  return intersection / union.size;
}

function canonicalKey(claim: DetectedClaim) {
  const proposed = claim.equivalenceKey
    .toLocaleLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "")
    .slice(0, 120);
  return proposed || [...normalizedWords(claim.statement)].sort().join("-");
}

function passageAround(text: string, start: number, end: number) {
  const before = text.lastIndexOf(". ", Math.max(0, start - 1));
  const after = text.indexOf(". ", Math.min(text.length, end));
  const passageStart =
    before >= Math.max(0, start - 220) ? before + 2 : Math.max(0, start - 160);
  const passageEnd =
    after >= 0 && after <= end + 220
      ? after + 1
      : Math.min(text.length, end + 160);
  return text.slice(passageStart, passageEnd).trim();
}

export function prioritizeClaims(
  text: string,
  detected: DetectedClaim[],
  maxClaims: number,
): ClaimIdentification[] {
  const occurrences = new Map<string, number>();
  const located = detected.flatMap((claim) => {
    const from = occurrences.get(claim.quote) ?? 0;
    let start = text.indexOf(claim.quote, from);
    if (start < 0) start = text.indexOf(claim.quote);
    if (start < 0 || claim.quote.trim().length < 4) return [];
    occurrences.set(claim.quote, start + claim.quote.length);
    return [
      {
        ...claim,
        sourceStart: start,
        sourceEnd: start + claim.quote.length,
        canonicalKey: canonicalKey(claim),
      },
    ];
  });

  const grouped: typeof located = [];
  for (const claim of located.sort((a, b) => a.sourceStart - b.sourceStart)) {
    const duplicate = grouped.find(
      (candidate) =>
        candidate.canonicalKey === claim.canonicalKey &&
        similarity(candidate.statement, claim.statement) >= 0.5,
    );
    if (duplicate) {
      duplicate.importance = Math.max(duplicate.importance, claim.importance);
      continue;
    }
    grouped.push({ ...claim });
  }

  const selected = new Set(
    [...grouped]
      .sort(
        (left, right) =>
          right.importance - left.importance ||
          left.sourceStart - right.sourceStart,
      )
      .slice(0, Math.max(1, Math.min(15, maxClaims)))
      .map((claim) => claim),
  );

  return grouped.map((claim) => ({
    statement: claim.statement.trim(),
    sourceStart: claim.sourceStart,
    sourceEnd: claim.sourceEnd,
    contextPassage: passageAround(text, claim.sourceStart, claim.sourceEnd),
    importance: Math.max(1, Math.min(5, Math.round(claim.importance))),
    referencePeriod: claim.referencePeriod.trim() || "not specified",
    referenceScope: claim.referenceScope.trim() || "not specified",
    canonicalKey: claim.canonicalKey,
    selectionStatus: selected.has(claim) ? "selected" : "uninvestigated_limit",
  }));
}

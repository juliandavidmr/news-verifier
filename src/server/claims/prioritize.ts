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

function anchorTokens(value: string) {
  return [...value.matchAll(/[\p{L}\p{N}]+/gu)].map((match) => ({
    value: match[0]
      .toLocaleLowerCase()
      .normalize("NFKD")
      .replaceAll(/\p{M}/gu, ""),
    start: match.index,
    end: match.index + match[0].length,
  }));
}

function locateQuote(text: string, quote: string, from: number) {
  const exactStart = text.indexOf(quote, from);
  if (exactStart >= 0) {
    return { start: exactStart, end: exactStart + quote.length };
  }

  const quoteTokens = anchorTokens(quote);
  if (quoteTokens.length < 4) return null;
  const textTokens = anchorTokens(text);
  const firstCandidate = textTokens.findIndex((token) => token.start >= from);
  if (firstCandidate < 0) return null;
  for (let index = firstCandidate; index < textTokens.length; index += 1) {
    let textIndex = index;
    let quoteIndex = 0;
    let skippedNoise = 0;
    let lastMatchedTextIndex = -1;
    while (quoteIndex < quoteTokens.length && textIndex < textTokens.length) {
      if (quoteTokens[quoteIndex].value === textTokens[textIndex].value) {
        lastMatchedTextIndex = textIndex;
        quoteIndex += 1;
        textIndex += 1;
        continue;
      }
      if (textTokens[textIndex].value.length === 1 && skippedNoise < 2) {
        skippedNoise += 1;
        textIndex += 1;
        continue;
      }
      break;
    }
    if (quoteIndex === quoteTokens.length && lastMatchedTextIndex >= index) {
      const start = textTokens[index].start;
      const lastTextToken = textTokens[lastMatchedTextIndex];
      const lastQuoteToken = quoteTokens.at(-1);
      let end = lastTextToken.end;
      const suffix = lastQuoteToken
        ? quote.slice(lastQuoteToken.end).trim()
        : "";
      if (suffix && text.startsWith(suffix, end)) end += suffix.length;
      return { start, end };
    }
  }
  return null;
}

export function prioritizeClaims(
  text: string,
  detected: DetectedClaim[],
  maxClaims: number,
): ClaimIdentification[] {
  const occurrences = new Map<string, number>();
  const located = detected.flatMap((claim) => {
    const from = occurrences.get(claim.quote) ?? 0;
    const location =
      locateQuote(text, claim.quote, from) ?? locateQuote(text, claim.quote, 0);
    if (!location || claim.quote.trim().length < 4) return [];
    occurrences.set(claim.quote, location.end);
    return [
      {
        ...claim,
        sourceStart: location.start,
        sourceEnd: location.end,
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

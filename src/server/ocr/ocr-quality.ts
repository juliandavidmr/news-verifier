import { OcrProcessingError } from "./ocr-errors";

const maximumWords = 2_000;
// Valid one-letter words across the bundled Latin languages must never be
// discarded merely because Tesseract assigned a low local confidence.
const standaloneLetters = new Set(["a", "e", "i", "o", "u", "y", "à", "é"]);

export type OcrWordSignal = {
  text: string;
  confidence: number;
};

function normalizeOcrText(value: string) {
  return value
    .normalize("NFKC")
    .replaceAll(/\r\n?/gu, "\n")
    .split(/\n+/u)
    .map((line) => line.replaceAll(/\s+/gu, " ").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function normalizedToken(value: string) {
  return value.normalize("NFKC").trim();
}

function isLowConfidenceArtifact({ text, confidence }: OcrWordSignal) {
  const token = normalizedToken(text);
  // These thresholds intentionally require both an isolated suspicious token
  // and weak word-level evidence. High-confidence punctuation is preserved.
  if (/^[\\|]$/u.test(token)) return confidence < 60;
  if (/^[-‐‑‒–—]$/u.test(token)) return confidence < 30;
  if (/^\p{L}$/u.test(token)) {
    return confidence < 25 && !standaloneLetters.has(token.toLowerCase());
  }
  return false;
}

function removeLowConfidenceArtifacts(
  words: string[],
  signals: readonly OcrWordSignal[],
) {
  if (signals.length === 0) return words;

  const rejected = new Set<number>();
  let wordIndex = 0;
  for (const signal of signals) {
    if (wordIndex >= words.length) break;
    const signalToken = normalizedToken(signal.text);
    if (!signalToken) continue;

    let matchIndex = -1;
    for (let index = wordIndex; index < words.length; index += 1) {
      const word = words[index];
      if (!word || normalizedToken(word) !== signalToken) continue;
      matchIndex = index;
      break;
    }
    if (matchIndex < 0) continue;
    wordIndex = matchIndex + 1;
    if (isLowConfidenceArtifact(signal)) rejected.add(matchIndex);
  }

  return words.filter((_word, index) => !rejected.has(index));
}

export function parseTsvWordSignals(
  tsv: string | null | undefined,
): OcrWordSignal[] {
  if (!tsv) return [];
  return tsv.split(/\r?\n/u).flatMap((row) => {
    const columns = row.split("\t");
    if (columns[0] !== "5" || columns.length < 12) return [];
    const confidence = Number(columns[10]);
    const text = columns.slice(11).join("\t").trim();
    return text && Number.isFinite(confidence) && confidence >= 0
      ? [{ text, confidence }]
      : [];
  });
}

export function assessOcrQuality(
  text: string,
  confidence: number,
  wordSignals: readonly OcrWordSignal[] = [],
) {
  const normalized = normalizeOcrText(text);
  const words = normalized.match(/\S+/gu) ?? [];
  const visible = normalized.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  const suspicious = normalized.match(/[�□]/gu)?.length ?? 0;
  if (
    normalized.length < 80 ||
    words.length < 8 ||
    visible / Math.max(1, normalized.length) < 0.45 ||
    suspicious / Math.max(1, normalized.length) > 0.02 ||
    confidence < 70
  ) {
    throw new OcrProcessingError("ocr_quality_insufficient");
  }
  const analyzed = removeLowConfidenceArtifacts(
    words.slice(0, maximumWords),
    wordSignals,
  );
  return {
    text: analyzed.join(" "),
    extractedWordCount: words.length,
    analyzedWordCount: analyzed.length,
    truncated: words.length > maximumWords,
  };
}

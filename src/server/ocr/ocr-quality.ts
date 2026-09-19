import { OcrProcessingError } from "./ocr-errors";

const maximumWords = 2_000;

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

export function assessOcrQuality(text: string, confidence: number) {
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
  const analyzed = words.slice(0, maximumWords);
  return {
    text: analyzed.join(" "),
    extractedWordCount: words.length,
    analyzedWordCount: analyzed.length,
    truncated: words.length > maximumWords,
  };
}

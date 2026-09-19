export const supportedLocales = ["es", "en", "fr", "pt"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const reportStatuses = [
  "queued",
  "extracting",
  "identifying_claims",
  "researching",
  "evaluating",
  "generating_report",
  "completed",
  "partial",
  "failed",
] as const;

export type ReportStatus = (typeof reportStatuses)[number];

export type ReportSourceKind = "url" | "image";

export type Report = {
  id: string;
  shortId: string;
  sourceKind: ReportSourceKind;
  sourceUrl: string | null;
  reportLocale: SupportedLocale;
  status: ReportStatus;
  extractedTitle: string | null;
  extractedAuthor: string | null;
  analyzedExcerpt: string | null;
  extractedWordCount: number | null;
  analyzedWordCount: number | null;
  truncated: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportEvent = {
  sequence: number;
  stage: ReportStatus;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type ExtractedContent = {
  canonicalUrl: string;
  title: string | null;
  author: string | null;
  text: string;
  extractedWordCount: number;
  analyzedWordCount: number;
  truncated: boolean;
};

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === "string" &&
    supportedLocales.includes(value as SupportedLocale)
  );
}

export function isTerminalStatus(status: ReportStatus) {
  return status === "completed" || status === "partial" || status === "failed";
}

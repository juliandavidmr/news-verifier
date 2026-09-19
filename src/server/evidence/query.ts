import type { SupportedLocale } from "../../domain/reports";
import type { EvidenceClaim } from "./types";

const languageNames: Record<SupportedLocale, string> = {
  es: "español",
  en: "English",
  fr: "français",
  pt: "português",
};

export function buildEvidenceQuery(
  claim: EvidenceClaim,
  locale: SupportedLocale,
) {
  return [
    claim.statement,
    `period: ${claim.referencePeriod}`,
    `scope: ${claim.referenceScope}`,
    `sources in ${languageNames[locale]} or the source's original language`,
    "official primary source, expert source, or independent reporting",
  ].join(" | ");
}

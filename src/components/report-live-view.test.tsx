import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SupportedLocale } from "../domain/reports";
import type { PublicReport } from "../server/reports/repository";
import { ReportLiveView } from "./report-live-view";

function report(reportLocale: SupportedLocale): PublicReport {
  return {
    id: "report-id",
    shortId: "short-id",
    sourceKind: "url",
    sourceUrl: "https://example.com/article",
    reportLocale,
    status: "extracting",
    extractedTitle: "Example report",
    extractedAuthor: null,
    extractedWordCount: null,
    analyzedWordCount: null,
    truncated: false,
    errorCode: null,
    errorMessage: null,
    createdAt: "2026-09-20T12:00:00.000Z",
    updatedAt: "2026-09-20T12:00:00.000Z",
  };
}

describe("report navigation locale", () => {
  it.each([
    ["es", "/es", "/es/privacy", "/es/methodology"],
    ["fr", "/fr", "/fr/privacy", "/fr/methodology"],
    ["pt", "/pt", "/pt/privacy", "/pt/methodology"],
    ["en", "/", "/privacy", "/methodology"],
  ] as const)(
    "keeps %s in every internal destination",
    (locale, homePath, privacyPath, methodologyPath) => {
      const html = renderToStaticMarkup(
        <ReportLiveView
          initialReport={report(locale)}
          initialDetails={null}
          initialPubliclyListed={false}
        />,
      );

      expect(html).toContain(`class="brand" href="${homePath}"`);
      expect(html).toContain(`href="${privacyPath}"`);
      expect(html).toContain(`href="${methodologyPath}"`);
    },
  );
});

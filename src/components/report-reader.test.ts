import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  PublicReportClaim,
  PublicReportDetails,
} from "../server/reports/report-reader";
import {
  evidenceHasUsefulTranslation,
  orderClaimsForDisplay,
  ReportReader,
} from "./report-reader";

function claim(
  id: string,
  ordinal: number,
  verdict: PublicReportClaim["verdict"],
): PublicReportClaim {
  return {
    id,
    ordinal,
    statement: id,
    contextPassage: id,
    referencePeriod: "n/a",
    referenceScope: "n/a",
    selectionStatus: verdict ? "selected" : "uninvestigated_limit",
    researchStatus: verdict ? "completed" : "uninvestigated_limit",
    verdict,
    evidenceStrength: null,
    explanation: null,
    importanceClass: "secondary",
    weight: 1,
    includedInIndex: false,
    contribution: null,
    evidence: [],
  };
}

describe("report claim ordering", () => {
  it("places uninvestigated claims after every evaluated claim", () => {
    const ordered = orderClaimsForDisplay([
      claim("pending-first", 1, null),
      claim("evaluated-third", 3, "supported"),
      claim("pending-second", 2, null),
      claim("evaluated-fourth", 4, "insufficient_evidence"),
    ]);

    expect(ordered.map((item) => item.id)).toEqual([
      "evaluated-third",
      "evaluated-fourth",
      "pending-first",
      "pending-second",
    ]);
  });
});

describe("report evidence language", () => {
  it("does not offer a duplicate translation", () => {
    expect(
      evidenceHasUsefulTranslation({
        originalFragment: "The same excerpt.",
        translatedFragment: "  The same   excerpt. ",
      }),
    ).toBe(false);
  });

  it("shows one excerpt at a time and keeps the original behind a control", () => {
    const details: PublicReportDetails = {
      status: "completed",
      evidenceCoverage: 100,
      supportIndex: 100,
      outcome: "partial",
      partialReason: "platform_limit",
      methodologyVersion: "test",
      completedAt: "2026-09-23T12:00:00.000Z",
      claims: [
        {
          ...claim("claim-1", 1, "supported"),
          statement: "La afirmación evaluada",
          contextPassage: "Contexto de la afirmación evaluada",
          evidenceStrength: "high",
          explanation: "La evidencia coincide con la afirmación.",
          evidence: [
            {
              id: "evidence-1",
              sourceUrl: "https://example.com/source",
              canonicalUrl: "https://example.com/source",
              title: "Fuente primaria",
              author: null,
              publishedAt: "2026-09-20T12:00:00.000Z",
              consultedAt: "2026-09-23T12:00:00.000Z",
              originalFragment: "Original fragment that should be hidden.",
              originalLanguage: "en",
              translatedFragment: "Fragmento traducido visible.",
              hierarchy: "primary",
              relation: "supports",
              temporalCompatible: true,
              scopeCompatible: true,
              rationale: "Coincide con el alcance.",
            },
          ],
        },
      ],
    };

    const html = renderToStaticMarkup(
      createElement(ReportReader, { locale: "es", details }),
    );

    expect(html).toContain("Fragmento traducido visible.");
    expect(html).not.toContain("Original fragment that should be hidden.");
    expect(html).toContain("Mostrar fragmento original");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('<section class="outcome-evaluation-details">');
    expect(html).toContain('<section class="claim-evaluation-details">');
    expect(html).not.toContain('<details class="outcome-evaluation-details">');
    expect(html).not.toContain('<details class="claim-evaluation-details">');
  });
});

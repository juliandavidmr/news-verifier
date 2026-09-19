import { describe, expect, it } from "vitest";
import type { PublicReportClaim } from "../server/reports/report-reader";
import { orderClaimsForDisplay } from "./report-reader";

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

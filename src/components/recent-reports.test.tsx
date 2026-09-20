import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PublicReportListing } from "../domain/public-report-listing";
import { RecentReports } from "./recent-reports";

function reports(count: number): PublicReportListing[] {
  return Array.from({ length: count }, (_, index) => ({
    shortId: `report-${index}`,
    title: `Report ${index}`,
    sourceHostname: `source-${index}.example`,
    completedAt: `2026-09-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
  }));
}

describe("recent reports", () => {
  it("hides the complete section when fewer than three reports exist", () => {
    expect(
      renderToStaticMarkup(<RecentReports locale="en" reports={reports(2)} />),
    ).toBe("");
  });

  it("renders every supplied report as a fully linked card", () => {
    const html = renderToStaticMarkup(
      <RecentReports locale="es" reports={reports(3)} />,
    );

    expect(html).toContain("Informes recientes");
    expect(html.match(/class="recent-report-card"/gu)).toHaveLength(3);
    expect(html).toContain('href="/r/report-0"');
    expect(html).toContain("source-2.example");
    expect(html).not.toContain("Ver informe");
  });
});

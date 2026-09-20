import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDatabase } from "../db";
import { ReportPublicationRepository } from "./publication-repository";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const reportIds: string[] = [];

async function insertReport({
  shortId,
  sourceUrl,
  title,
  coverage = 100,
  outcome = "conclusive",
  completedAt,
}: {
  shortId: string;
  sourceUrl: string;
  title: string | null;
  coverage?: number;
  outcome?: "conclusive" | "inconclusive";
  completedAt: string;
}) {
  const rows = await getDatabase().query(
    `INSERT INTO reports (
       short_id, source_kind, source_url, report_locale, status,
       extracted_title, evidence_coverage, support_index, report_outcome,
       completed_at
     ) VALUES ($1, 'url', $2, 'en', 'completed', $3, $4, 0, $5, $6)
     RETURNING id`,
    [shortId, sourceUrl, title, coverage, outcome, completedAt],
  );
  const id = (rows as Array<{ id: string }>)[0]?.id;
  if (!id) throw new Error("Expected a report fixture");
  reportIds.push(id);
  return id;
}

describe.skipIf(!runDatabaseTests)("public report listing", () => {
  afterAll(async () => {
    if (!runDatabaseTests || reportIds.length === 0) return;
    await getDatabase().query(
      "DELETE FROM reports WHERE id = ANY($1::uuid[])",
      [reportIds],
    );
  });

  it("lists only conclusive reports and keeps the newest canonical URL", async () => {
    const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
    const oldId = await insertReport({
      shortId: `old${suffix}`,
      sourceUrl: `https://example.com/${suffix}/same`,
      title: "Older report",
      completedAt: "2200-01-01T00:00:00.000Z",
    });
    const newestId = await insertReport({
      shortId: `new${suffix}`,
      sourceUrl: `https://example.com/${suffix}/same`,
      title: "Newest report",
      completedAt: "2200-01-02T00:00:00.000Z",
    });
    const lowCoverageId = await insertReport({
      shortId: `low${suffix}`,
      sourceUrl: `https://example.com/${suffix}/low`,
      title: "Low coverage",
      coverage: 59,
      outcome: "inconclusive",
      completedAt: "2200-01-03T00:00:00.000Z",
    });

    const listing = await new ReportPublicationRepository().listRecent(50);
    const fixtureReports = listing.filter((report) =>
      report.shortId.endsWith(suffix),
    );

    expect(fixtureReports).toEqual([
      expect.objectContaining({
        shortId: `new${suffix}`,
        title: "Newest report",
        sourceHostname: "example.com",
      }),
    ]);
    const repository = new ReportPublicationRepository();
    expect(await repository.isIndexable(oldId)).toBe(true);
    expect(await repository.isIndexable(newestId)).toBe(true);
    expect(await repository.isIndexable(lowCoverageId)).toBe(false);
  });
});

import { after } from "next/server";
import { NeonReportsRepository } from "@/server/reports/neon-repository";
import { ReportPublicationRepository } from "@/server/reports/publication-repository";
import { ReportReaderRepository } from "@/server/reports/report-reader";
import { toPublicReport } from "@/server/reports/repository";
import { dispatchPendingInvestigations } from "../../../../../server/research/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: RouteContext<"/api/reports/[shortId]/events">,
) {
  const { shortId } = await context.params;
  const afterSequence = Number(
    new URL(request.url).searchParams.get("after") ?? 0,
  );
  const repository = new NeonReportsRepository();
  const report = await repository.findByShortId(shortId);
  if (!report) {
    return Response.json({ code: "not_found" }, { status: 404 });
  }
  if (report.status === "queued") {
    after(() => dispatchPendingInvestigations(1, report.id));
  }
  const [events, details, isPubliclyListed] = await Promise.all([
    repository.listEvents(
      report.id,
      Number.isSafeInteger(afterSequence) && afterSequence >= 0
        ? afterSequence
        : 0,
    ),
    ["completed", "partial"].includes(report.status)
      ? new ReportReaderRepository().findDetails(report.id)
      : Promise.resolve(null),
    new ReportPublicationRepository().isIndexable(report.id),
  ]);
  return Response.json(
    {
      report: toPublicReport(report),
      events,
      details,
      isPubliclyListed,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

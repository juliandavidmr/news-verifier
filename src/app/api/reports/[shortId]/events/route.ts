import { NeonReportsRepository } from "@/server/reports/neon-repository";
import { toPublicReport } from "@/server/reports/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: RouteContext<"/api/reports/[shortId]/events">,
) {
  const { shortId } = await context.params;
  const after = Number(new URL(request.url).searchParams.get("after") ?? 0);
  const repository = new NeonReportsRepository();
  const report = await repository.findByShortId(shortId);
  if (!report) {
    return Response.json({ code: "not_found" }, { status: 404 });
  }
  const events = await repository.listEvents(
    report.id,
    Number.isSafeInteger(after) && after >= 0 ? after : 0,
  );
  return Response.json(
    { report: toPublicReport(report), events },
    { headers: { "cache-control": "no-store" } },
  );
}

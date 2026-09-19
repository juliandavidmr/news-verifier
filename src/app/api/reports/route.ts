import { after } from "next/server";
import { isSupportedLocale } from "../../../domain/reports";
import { startUrlInvestigation } from "../../../server/application/start-url-investigation";
import {
  RemoteContentError,
  SafeRemoteDocumentFetcher,
} from "../../../server/ingestion/public-url";
import { NeonReportsRepository } from "../../../server/reports/neon-repository";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ code: "invalid_request" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("url" in body) ||
    typeof body.url !== "string" ||
    body.url.length > 2_048 ||
    !("reportLocale" in body) ||
    !isSupportedLocale(body.reportLocale)
  ) {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }

  try {
    const report = await startUrlInvestigation(
      {
        reports: new NeonReportsRepository(),
        fetcher: new SafeRemoteDocumentFetcher(),
        backgroundTasks: { defer: (task) => after(task) },
      },
      { url: body.url, reportLocale: body.reportLocale },
    );

    return Response.json(
      { shortId: report.shortId, status: report.status },
      { status: 202, headers: { location: `/r/${report.shortId}` } },
    );
  } catch (error) {
    if (error instanceof RemoteContentError) {
      return Response.json({ code: error.code }, { status: 400 });
    }
    return Response.json({ code: "internal_error" }, { status: 500 });
  }
}

import { after, NextResponse } from "next/server";
import { isSupportedLocale } from "../../../domain/reports";
import {
  QuotaExceededError,
  startUrlInvestigation,
} from "../../../server/application/start-url-investigation";
import {
  resolveAnonymousIdentity,
  visitorCookieName,
} from "../../../server/identity/anonymous-visitor";
import { RemoteContentError } from "../../../server/ingestion/public-url";
import { NeonReportsRepository } from "../../../server/reports/neon-repository";
import { dispatchPendingInvestigations } from "../../../server/research/dispatcher";

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
    !isSupportedLocale(body.reportLocale) ||
    !("idempotencyKey" in body) ||
    typeof body.idempotencyKey !== "string" ||
    body.idempotencyKey.length < 8 ||
    body.idempotencyKey.length > 128
  ) {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }

  const identity = resolveAnonymousIdentity(request);
  const json = (payload: unknown, init: ResponseInit) => {
    const response = NextResponse.json(payload, init);
    if (identity.cookie) {
      response.cookies.set(visitorCookieName, identity.cookie, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return response;
  };

  try {
    const report = await startUrlInvestigation(
      {
        reports: new NeonReportsRepository(),
        backgroundTasks: { defer: (task) => after(task) },
        dispatch: async (reportId) => {
          await dispatchPendingInvestigations(1, reportId);
        },
      },
      {
        url: body.url,
        reportLocale: body.reportLocale,
        visitorKey: identity.visitorKey,
        networkKey: identity.networkKey,
        idempotencyKey: body.idempotencyKey,
      },
    );

    return json(
      { shortId: report.shortId, status: report.status },
      { status: 202, headers: { location: `/r/${report.shortId}` } },
    );
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return json({ code: `${error.scope}_quota_reached` }, { status: 429 });
    }
    if (error instanceof RemoteContentError) {
      return json({ code: error.code }, { status: 400 });
    }
    return json({ code: "internal_error" }, { status: 500 });
  }
}

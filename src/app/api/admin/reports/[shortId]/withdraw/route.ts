import { isAuthorizedAdministrator } from "@/server/admin/auth";
import { AdministrativeReportRepository } from "@/server/reports/admin-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/reports/[shortId]/withdraw">,
) {
  if (!isAuthorizedAdministrator(request)) {
    return Response.json({ code: "unauthorized" }, { status: 401 });
  }

  const { shortId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }
  const reason =
    typeof body === "object" &&
    body !== null &&
    "reason" in body &&
    typeof body.reason === "string"
      ? body.reason.trim()
      : "";
  if (reason.length < 3 || reason.length > 500) {
    return Response.json({ code: "invalid_reason" }, { status: 400 });
  }

  const result = await new AdministrativeReportRepository().withdraw(
    shortId,
    reason,
  );
  if (result === "not_found") {
    return Response.json({ code: "not_found" }, { status: 404 });
  }
  return Response.json({ ok: true, shortId, result });
}

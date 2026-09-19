import { dispatchPendingInvestigations } from "../../../../server/research/dispatcher";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const dispatched = await dispatchPendingInvestigations(20);
  return Response.json({ ok: true, dispatched });
}

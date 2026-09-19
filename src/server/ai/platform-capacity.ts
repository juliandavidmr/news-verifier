import { APICallError } from "ai";
import { getDatabase } from "../db";

type GatewayModel = {
  id: string;
  pricing?: { input?: string; output?: string };
  tags?: string[] | null;
  supported_parameters?: string[];
};

let gatewayCatalog:
  | { fetchedAt: number; models: Map<string, GatewayModel> }
  | undefined;

export async function freeEligibleGatewayModels(configured: string[]) {
  if (!gatewayCatalog || Date.now() - gatewayCatalog.fetchedAt > 300_000) {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error("AI Gateway model catalog unavailable");
    const body = (await response.json()) as { data?: GatewayModel[] };
    gatewayCatalog = {
      fetchedAt: Date.now(),
      models: new Map((body.data ?? []).map((model) => [model.id, model])),
    };
  }
  const models = gatewayCatalog.models;
  return configured.filter((id) => {
    const model = models.get(id);
    return (
      model?.pricing?.input === "0" &&
      model.pricing.output === "0" &&
      model.tags?.includes("free") === true &&
      model.supported_parameters?.includes("tools") === true &&
      model.supported_parameters.includes("tool_choice")
    );
  });
}

export class PlatformCapacityError extends Error {
  constructor(
    readonly provider: string,
    readonly code: string,
  ) {
    super(`${provider} capacity unavailable: ${code}`);
    this.name = "PlatformCapacityError";
  }
}

export function capacityFailure(error: unknown) {
  if (!APICallError.isInstance(error)) return null;
  if (![402, 403, 429, 503].includes(error.statusCode ?? 0)) return null;
  const retryAfter = Number(error.responseHeaders?.["retry-after"] ?? 0);
  return {
    code:
      error.statusCode === 403 &&
      error.responseBody?.includes("customer_verification_required")
        ? "customer_verification_required"
        : `http_${error.statusCode}`,
    retryAfterSeconds:
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 300,
  };
}

export class AiPlatformRepository {
  async isCircuitOpen(provider: string) {
    const rows = await getDatabase().query(
      `SELECT opened_until > now() AS open
       FROM provider_circuits WHERE provider = $1`,
      [provider],
    );
    return Boolean((rows as unknown as Array<{ open: boolean }>)[0]?.open);
  }

  async openCircuit(provider: string, reason: string, retryAfterSeconds = 300) {
    await getDatabase().query(
      `INSERT INTO provider_circuits (
         provider, opened_until, reason, retry_after_seconds, updated_at
       ) VALUES ($1, now() + make_interval(secs => $3), $2, $3, now())
       ON CONFLICT (provider) DO UPDATE
       SET opened_until = EXCLUDED.opened_until, reason = EXCLUDED.reason,
           retry_after_seconds = EXCLUDED.retry_after_seconds, updated_at = now()`,
      [provider, reason, retryAfterSeconds],
    );
  }

  async recordAttempt(input: {
    reportId: string;
    phase: string;
    requestedModel: string;
    outcome: "succeeded" | "failed" | "circuit_open";
    errorCode?: string;
  }) {
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/iu.test(input.reportId)) return;
    await getDatabase().query(
      `INSERT INTO ai_attempts (
         report_id, phase, requested_model, outcome, error_code
       ) SELECT $1::uuid, $2, $3, $4, $5
       WHERE EXISTS (SELECT 1 FROM reports WHERE id = $1::uuid)`,
      [
        input.reportId,
        input.phase,
        input.requestedModel,
        input.outcome,
        input.errorCode ?? null,
      ],
    );
  }
}

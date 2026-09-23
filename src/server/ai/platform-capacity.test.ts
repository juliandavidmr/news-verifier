import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import {
  capacityFailure,
  eligibleGatewayModelsFromCatalog,
  type GatewayModel,
  resolveGatewayModelPoolFromCatalog,
} from "./platform-capacity";

describe("platform capacity classification", () => {
  it("honors Retry-After for rate limits", () => {
    const failure = capacityFailure(
      new APICallError({
        message: "rate limited",
        url: "https://ai-gateway.vercel.sh/v1",
        requestBodyValues: {},
        statusCode: 429,
        responseHeaders: { "retry-after": "120" },
      }),
    );
    expect(failure).toEqual({ code: "http_429", retryAfterSeconds: 120 });
  });

  it("identifies account verification without interpreting it as paid fallback", () => {
    const apiError = new APICallError({
      message: "verification required",
      url: "https://ai-gateway.vercel.sh/v1",
      requestBodyValues: {},
      statusCode: 403,
      responseBody: "customer_verification_required",
    });
    for (const error of [apiError, { statusCode: 403, cause: apiError }]) {
      expect(capacityFailure(error)).toMatchObject({
        code: "customer_verification_required",
      });
    }
  });
});

describe("Gateway model eligibility", () => {
  const models = new Map<string, GatewayModel>([
    [
      "free/model",
      {
        id: "free/model",
        pricing: { input: "0", output: "0" },
        tags: ["free"],
        supported_parameters: ["tools", "tool_choice"],
      },
    ],
    [
      "alibaba/qwen3.8-27b",
      {
        id: "alibaba/qwen3.8-27b",
        pricing: { input: "0.0000005", output: "0.000003" },
        tags: ["tool-use", "structured-output"],
        supported_parameters: ["tools", "tool_choice"],
      },
    ],
    [
      "paid/without-tools",
      {
        id: "paid/without-tools",
        pricing: { input: "0.000001", output: "0.000001" },
        supported_parameters: ["temperature"],
      },
    ],
  ]);

  it("keeps free and paid-fallback eligibility explicit and disjoint", () => {
    expect(
      eligibleGatewayModelsFromCatalog(
        ["free/model", "alibaba/qwen3.8-27b"],
        models,
        "free",
      ),
    ).toEqual(["free/model"]);
    expect(
      eligibleGatewayModelsFromCatalog(
        ["free/model", "paid/without-tools", "alibaba/qwen3.8-27b"],
        models,
        "paid-fallback",
      ),
    ).toEqual(["alibaba/qwen3.8-27b"]);
  });

  it("always appends the paid fallback after eligible free models", () => {
    expect(
      resolveGatewayModelPoolFromCatalog(
        ["free/model"],
        ["alibaba/qwen3.8-27b"],
        models,
      ),
    ).toEqual([
      { id: "free/model", tier: "free" },
      { id: "alibaba/qwen3.8-27b", tier: "paid-fallback" },
    ]);
  });
});

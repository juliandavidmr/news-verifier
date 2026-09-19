import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import { capacityFailure } from "./platform-capacity";

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
    const failure = capacityFailure(
      new APICallError({
        message: "verification required",
        url: "https://ai-gateway.vercel.sh/v1",
        requestBodyValues: {},
        statusCode: 403,
        responseBody: "customer_verification_required",
      }),
    );
    expect(failure).toMatchObject({
      code: "customer_verification_required",
    });
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  resolveAnonymousIdentity,
  visitorCookieName,
} from "./anonymous-visitor";

describe("anonymous visitor identity", () => {
  const originalSecret = process.env.VISITOR_SIGNING_SECRET;

  beforeEach(() => {
    process.env.VISITOR_SIGNING_SECRET = "test-only-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.VISITOR_SIGNING_SECRET;
    else process.env.VISITOR_SIGNING_SECRET = originalSecret;
  });

  it("reuses a signed visitor while rotating the daily network signal", () => {
    const first = resolveAnonymousIdentity(
      new Request("https://example.com", {
        headers: { "x-forwarded-for": "203.0.113.7" },
      }),
      new Date("2026-09-19T23:00:00Z"),
    );
    expect(first.cookie).toBeTruthy();

    const second = resolveAnonymousIdentity(
      new Request("https://example.com", {
        headers: {
          cookie: `${visitorCookieName}=${first.cookie}`,
          "x-forwarded-for": "203.0.113.7",
        },
      }),
      new Date("2026-09-20T01:00:00Z"),
    );

    expect(second.cookie).toBeNull();
    expect(second.visitorKey).toBe(first.visitorKey);
    expect(second.networkKey).not.toBe(first.networkKey);
  });

  it("rejects a tampered visitor cookie", () => {
    const first = resolveAnonymousIdentity(new Request("https://example.com"));
    const tampered = `${first.cookie}x`;
    const second = resolveAnonymousIdentity(
      new Request("https://example.com", {
        headers: { cookie: `${visitorCookieName}=${tampered}` },
      }),
    );

    expect(second.cookie).toBeTruthy();
    expect(second.visitorKey).not.toBe(first.visitorKey);
  });
});

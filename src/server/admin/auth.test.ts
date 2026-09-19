import { describe, expect, it } from "vitest";
import { matchesBearerToken } from "./auth";

describe("administrative authentication", () => {
  it("accepts only an exact bearer secret", () => {
    expect(matchesBearerToken("Bearer private-token", "private-token")).toBe(
      true,
    );
    expect(matchesBearerToken("Bearer wrong-token", "private-token")).toBe(
      false,
    );
    expect(matchesBearerToken(null, "private-token")).toBe(false);
    expect(matchesBearerToken("Bearer private-token", undefined)).toBe(false);
  });
});

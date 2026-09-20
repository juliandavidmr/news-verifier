import { describe, expect, it } from "vitest";
import {
  isBlockedHostname,
  isPublicAddress,
  parsePublicHttpUrl,
  RemoteContentError,
} from "./public-url";

describe("public URL policy", () => {
  it.each([
    "file:///etc/passwd",
    "ftp://example.com/file",
    "https://user:password@example.com",
    "http://localhost/admin",
    "http://service.internal/data",
    "http://metadata.google.internal/",
  ])("rejects %s", (value) => {
    expect(() => parsePublicHttpUrl(value)).toThrow(RemoteContentError);
  });

  it("normalizes a public URL and removes its fragment", () => {
    expect(
      parsePublicHttpUrl("https://example.com/story#comments").toString(),
    ).toBe("https://example.com/story");
  });

  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.5",
    "100.64.0.1",
    "::1",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "2001:db8::1",
  ])("classifies %s as non-public", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "classifies %s as public",
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    },
  );

  it("blocks local hostnames regardless of case", () => {
    expect(isBlockedHostname("ADMIN.Local.")).toBe(true);
  });
});

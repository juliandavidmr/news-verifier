import { describe, expect, it } from "vitest";
import { imageUploadMime, normalizeImageMime } from "./image-mime";

describe("image MIME handling", () => {
  it.each(["image/jpeg", "image/jpg", "image/pjpeg"])(
    "normalizes the %s JPEG MIME type",
    (mime) => {
      expect(normalizeImageMime(mime)).toBe("image/jpeg");
    },
  );

  it.each([
    ["photo.jpg", "", "image/jpeg"],
    ["photo.JPG", "application/octet-stream", "image/jpeg"],
    ["photo.jpeg", "", "image/jpeg"],
  ])(
    "uses the extension when %s has an unhelpful MIME type",
    (name, type, expected) => {
      expect(imageUploadMime({ name, type })).toBe(expected);
    },
  );

  it("keeps a specific declared MIME so the server can detect mismatches", () => {
    expect(imageUploadMime({ name: "photo.jpg", type: "image/png" })).toBe(
      "image/png",
    );
  });
});

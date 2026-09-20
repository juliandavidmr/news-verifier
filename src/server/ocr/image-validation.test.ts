import { describe, expect, it } from "vitest";
import {
  ImageValidationError,
  imageUploadLimits,
  validateImageUpload,
} from "./image-validation";

function png(width: number, height: number) {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([0, 0, 0, 13, 73, 72, 68, 82], 8);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function jpeg(width: number, height: number) {
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x0b,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x01,
    0x01,
    0x11,
    0x00,
    0xff,
    0xd9,
  ]);
}

function jpegWithInvalidAndroidOrientation(width: number, height: number) {
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xe1,
    0x00,
    0x22,
    ...Buffer.from("Exif\0\0"),
    ...Buffer.from("MM"),
    0x00,
    0x2a,
    0x00,
    0x00,
    0x00,
    0x08,
    0x00,
    0x01,
    0x01,
    0x12,
    0x00,
    0x04, // Incorrectly encoded as LONG rather than SHORT.
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00, // Invalid zero orientation, as in the reported Android image.
    0x00,
    0x00,
    0x00,
    0x00,
    ...jpeg(width, height).subarray(2),
  ]);
}

function webp(width: number, height: number) {
  const bytes = new Uint8Array(30);
  bytes.set(Buffer.from("RIFF"), 0);
  bytes.set(Buffer.from("WEBPVP8X"), 8);
  const w = width - 1;
  const h = height - 1;
  bytes.set([w & 255, (w >> 8) & 255, (w >> 16) & 255], 24);
  bytes.set([h & 255, (h >> 8) & 255, (h >> 16) & 255], 27);
  return bytes;
}

describe("image upload validation", () => {
  it.each([
    ["image/png", png(1200, 800)],
    ["image/jpeg", jpeg(1200, 800)],
    ["image/webp", webp(1200, 800)],
  ])("accepts a valid %s signature and dimensions", (mime, bytes) => {
    expect(validateImageUpload(bytes, mime)).toMatchObject({
      mime,
      width: 1200,
      height: 800,
    });
  });

  it.each(["image/jpg", "image/pjpeg"])(
    "accepts the %s MIME alias and normalizes it to JPEG",
    (mime) => {
      expect(validateImageUpload(jpeg(1200, 800), mime)).toMatchObject({
        mime: "image/jpeg",
        width: 1200,
        height: 800,
      });
    },
  );

  it("accepts a JPEG with malformed optional Android orientation metadata", () => {
    expect(
      validateImageUpload(
        jpegWithInvalidAndroidOrientation(1080, 628),
        "image/jpeg",
      ),
    ).toMatchObject({
      mime: "image/jpeg",
      width: 1080,
      height: 628,
      orientation: 1,
    });
  });

  it("rejects a declared MIME that differs from the binary signature", () => {
    expect(() => validateImageUpload(png(100, 100), "image/jpeg")).toThrowError(
      expect.objectContaining({ code: "image_type_mismatch" }),
    );
  });

  it("rejects oversize bytes and excessive pixels before OCR", () => {
    expect(() =>
      validateImageUpload(
        new Uint8Array(imageUploadLimits.maxBytes + 1),
        "image/png",
      ),
    ).toThrowError(ImageValidationError);
    expect(() =>
      validateImageUpload(png(5000, 5000), "image/png"),
    ).toThrowError(
      expect.objectContaining({ code: "image_dimensions_exceeded" }),
    );
  });
});

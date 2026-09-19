export const imageUploadLimits = {
  maxBytes: 4 * 1024 * 1024,
  maxPixels: 20_000_000,
} as const;

export type AcceptedImageMime =
  | "image/png"
  | "image/jpeg"
  | "image/jpg"
  | "image/webp";

export class ImageValidationError extends Error {
  constructor(
    readonly code:
      | "image_too_large"
      | "unsupported_image"
      | "image_type_mismatch"
      | "invalid_image"
      | "image_dimensions_exceeded",
  ) {
    super(code);
    this.name = "ImageValidationError";
  }
}

function u16be(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function u16(bytes: Uint8Array, offset: number, little: boolean) {
  return little
    ? bytes[offset] | (bytes[offset + 1] << 8)
    : u16be(bytes, offset);
}

function u32(bytes: Uint8Array, offset: number, little = false) {
  return little
    ? (bytes[offset] |
        (bytes[offset + 1] << 8) |
        (bytes[offset + 2] << 16) |
        (bytes[offset + 3] << 24)) >>>
        0
    : ((bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3]) >>>
        0;
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function pngDimensions(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    bytes.length < 24 ||
    !signature.every((value, index) => bytes[index] === value) ||
    ascii(bytes, 12, 4) !== "IHDR"
  ) {
    return null;
  }
  return {
    mime: "image/png" as const,
    width: u32(bytes, 16),
    height: u32(bytes, 20),
    orientation: 1,
  };
}

function jpegOrientation(bytes: Uint8Array, marker: number, length: number) {
  const exif = marker + 4;
  if (length < 14 || ascii(bytes, exif, 6) !== "Exif\0\0") return 1;
  const tiff = exif + 6;
  const endian = ascii(bytes, tiff, 2);
  if (endian !== "II" && endian !== "MM") {
    throw new ImageValidationError("invalid_image");
  }
  const little = endian === "II";
  if (u16(bytes, tiff + 2, little) !== 42) {
    throw new ImageValidationError("invalid_image");
  }
  const ifd = tiff + u32(bytes, tiff + 4, little);
  if (ifd + 2 > bytes.length) throw new ImageValidationError("invalid_image");
  const entries = u16(bytes, ifd, little);
  for (let index = 0; index < entries; index += 1) {
    const entry = ifd + 2 + index * 12;
    if (entry + 12 > bytes.length)
      throw new ImageValidationError("invalid_image");
    if (u16(bytes, entry, little) === 0x0112) {
      const orientation = u16(bytes, entry + 8, little);
      if (orientation < 1 || orientation > 8) {
        throw new ImageValidationError("invalid_image");
      }
      return orientation;
    }
  }
  return 1;
}

function jpegDimensions(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  let orientation = 1;
  const sof = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new ImageValidationError("invalid_image");
    while (bytes[offset] === 0xff) offset += 1;
    const markerCode = bytes[offset];
    const marker = offset - 1;
    offset += 1;
    if (markerCode === 0xd9 || markerCode === 0xda) break;
    const length = u16be(bytes, offset);
    if (length < 2 || offset + length > bytes.length) {
      throw new ImageValidationError("invalid_image");
    }
    if (markerCode === 0xe1)
      orientation = jpegOrientation(bytes, marker, length);
    if (sof.has(markerCode)) {
      if (length < 7) throw new ImageValidationError("invalid_image");
      return {
        mime: "image/jpeg" as const,
        width: u16be(bytes, offset + 5),
        height: u16be(bytes, offset + 3),
        orientation,
      };
    }
    offset += length;
  }
  throw new ImageValidationError("invalid_image");
}

function webpDimensions(bytes: Uint8Array) {
  if (
    bytes.length < 30 ||
    ascii(bytes, 0, 4) !== "RIFF" ||
    ascii(bytes, 8, 4) !== "WEBP"
  ) {
    return null;
  }
  const kind = ascii(bytes, 12, 4);
  if (kind === "VP8X") {
    return {
      mime: "image/webp" as const,
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      orientation: 1,
    };
  }
  if (kind === "VP8L" && bytes[20] === 0x2f) {
    return {
      mime: "image/webp" as const,
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height:
        1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
      orientation: 1,
    };
  }
  if (
    kind === "VP8 " &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    return {
      mime: "image/webp" as const,
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
      orientation: 1,
    };
  }
  throw new ImageValidationError("invalid_image");
}

export function validateImageUpload(bytes: Uint8Array, declaredMime: string) {
  if (bytes.byteLength > imageUploadLimits.maxBytes) {
    throw new ImageValidationError("image_too_large");
  }
  const normalizedMime =
    declaredMime === "image/jpg" ? "image/jpeg" : declaredMime;
  if (
    !(["image/png", "image/jpeg", "image/webp"] as string[]).includes(
      normalizedMime,
    )
  ) {
    throw new ImageValidationError("unsupported_image");
  }
  const metadata =
    pngDimensions(bytes) ?? jpegDimensions(bytes) ?? webpDimensions(bytes);
  if (!metadata) throw new ImageValidationError("invalid_image");
  if (metadata.mime !== normalizedMime) {
    throw new ImageValidationError("image_type_mismatch");
  }
  if (
    metadata.width < 1 ||
    metadata.height < 1 ||
    metadata.width * metadata.height > imageUploadLimits.maxPixels
  ) {
    throw new ImageValidationError("image_dimensions_exceeded");
  }
  const rotated = metadata.orientation >= 5;
  return {
    ...metadata,
    displayWidth: rotated ? metadata.height : metadata.width,
    displayHeight: rotated ? metadata.width : metadata.height,
  };
}

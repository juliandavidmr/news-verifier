const mimeByExtension = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
} as const;

export function normalizeImageMime(mime: string) {
  const normalized = mime.trim().toLowerCase();
  return normalized === "image/jpg" || normalized === "image/pjpeg"
    ? "image/jpeg"
    : normalized;
}

export function imageUploadMime(file: Pick<File, "name" | "type">) {
  const declaredMime = normalizeImageMime(file.type);
  if (declaredMime && declaredMime !== "application/octet-stream") {
    return declaredMime;
  }

  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  return extension
    ? (mimeByExtension[extension as keyof typeof mimeByExtension] ??
        declaredMime)
    : declaredMime;
}

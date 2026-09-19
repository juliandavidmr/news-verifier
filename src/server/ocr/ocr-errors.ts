export class OcrProcessingError extends Error {
  constructor(
    readonly code: "ocr_timeout" | "ocr_quality_insufficient" | "ocr_failed",
  ) {
    super(code);
    this.name = "OcrProcessingError";
  }
}

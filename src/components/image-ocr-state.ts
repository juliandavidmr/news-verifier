export type ImageOcrPoll = {
  report: { status: string; errorCode: string | null };
  events: Array<{ sequence: number; stage: string }>;
};

export function imageOcrOutcome(result: ImageOcrPoll) {
  if (
    result.events.some(
      (event) => event.stage === "queued" && event.sequence > 1,
    )
  ) {
    return { state: "ready" } as const;
  }
  if (result.report.status === "failed") {
    return {
      state: "failed",
      code: result.report.errorCode ?? "ocr_failed",
    } as const;
  }
  return { state: "pending" } as const;
}

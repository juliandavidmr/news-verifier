import { randomBytes } from "node:crypto";
import type { SupportedLocale } from "../../domain/reports";
import type { OcrResult } from "../ocr/tesseract-engine";
import type { ReportsRepository } from "../reports/repository";
import type { BackgroundTasks } from "./start-url-investigation";
import { QuotaExceededError } from "./start-url-investigation";

export async function startImageInvestigation(
  dependencies: {
    reports: ReportsRepository;
    backgroundTasks: BackgroundTasks;
    dispatch(reportId: string): Promise<void>;
    createShortId?: () => string;
  },
  input: {
    extracted: OcrResult;
    reportLocale: SupportedLocale;
    visitorKey: string;
    networkKey: string;
    idempotencyKey: string;
  },
) {
  const admission = await dependencies.reports.createImageReport({
    shortId:
      dependencies.createShortId?.() ?? randomBytes(9).toString("base64url"),
    reportLocale: input.reportLocale,
    visitorKey: input.visitorKey,
    networkKey: input.networkKey,
    idempotencyKey: input.idempotencyKey,
    extracted: input.extracted,
  });
  if (!admission.accepted) throw new QuotaExceededError(admission.reason);
  if (!admission.replayed) {
    dependencies.backgroundTasks.defer(() =>
      dependencies.dispatch(admission.report.id),
    );
  }
  return admission.report;
}

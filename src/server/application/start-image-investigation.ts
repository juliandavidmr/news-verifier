import { randomBytes } from "node:crypto";
import type { SupportedLocale } from "../../domain/reports";
import type { ReportsRepository } from "../reports/repository";
import type { BackgroundTasks } from "./start-url-investigation";
import { QuotaExceededError } from "./start-url-investigation";

export async function startImageInvestigation(
  dependencies: {
    reports: ReportsRepository;
    backgroundTasks: BackgroundTasks;
    process(reportId: string): Promise<void>;
    createShortId?: () => string;
  },
  input: {
    reportLocale: SupportedLocale;
    visitorKey: string;
    networkKey: string;
    idempotencyKey: string;
  },
) {
  const admission = await dependencies.reports.createPendingImageReport({
    shortId:
      dependencies.createShortId?.() ?? randomBytes(9).toString("base64url"),
    reportLocale: input.reportLocale,
    visitorKey: input.visitorKey,
    networkKey: input.networkKey,
    idempotencyKey: input.idempotencyKey,
  });
  if (!admission.accepted) throw new QuotaExceededError(admission.reason);
  if (!admission.replayed) {
    dependencies.backgroundTasks.defer(() =>
      dependencies.process(admission.report.id),
    );
  }
  return {
    report: admission.report,
    processingScheduled: !admission.replayed,
  };
}

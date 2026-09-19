import { randomBytes } from "node:crypto";
import type { SupportedLocale } from "../../domain/reports";
import { parsePublicHttpUrl } from "../ingestion/public-url";
import type { ReportsRepository } from "../reports/repository";

export type BackgroundTasks = {
  defer(task: () => Promise<void>): void;
};

export type StartUrlInvestigationDependencies = {
  reports: ReportsRepository;
  backgroundTasks: BackgroundTasks;
  dispatch(reportId: string): Promise<void>;
  createShortId?: () => string;
};

export type StartUrlInvestigationInput = {
  url: string;
  reportLocale: SupportedLocale;
  visitorKey: string;
  networkKey: string;
  idempotencyKey: string;
};

export class QuotaExceededError extends Error {
  constructor(readonly scope: "global" | "visitor") {
    super(`${scope} quota reached`);
    this.name = "QuotaExceededError";
  }
}

export async function startUrlInvestigation(
  dependencies: StartUrlInvestigationDependencies,
  input: StartUrlInvestigationInput,
) {
  const sourceUrl = parsePublicHttpUrl(input.url);
  const admission = await dependencies.reports.createUrlReport({
    shortId:
      dependencies.createShortId?.() ?? randomBytes(9).toString("base64url"),
    sourceUrl: sourceUrl.toString(),
    reportLocale: input.reportLocale,
    visitorKey: input.visitorKey,
    networkKey: input.networkKey,
    idempotencyKey: input.idempotencyKey,
  });

  if (!admission.accepted) throw new QuotaExceededError(admission.reason);

  const { report } = admission;
  if (admission.replayed) return report;

  dependencies.backgroundTasks.defer(() => dependencies.dispatch(report.id));

  return report;
}

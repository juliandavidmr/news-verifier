import type {
  ExtractedContent,
  Report,
  ReportEvent,
  ReportStatus,
  SupportedLocale,
} from "../../domain/reports";

export type CreateUrlReportInput = {
  shortId: string;
  sourceUrl: string;
  reportLocale: SupportedLocale;
  visitorKey: string;
  networkKey: string;
  idempotencyKey: string;
  usageDate?: string;
};

export type CreateImageReportInput = Omit<CreateUrlReportInput, "sourceUrl"> & {
  extracted: ExtractedContent & { confidence: number };
};

export type CreateUrlReportResult =
  | { accepted: true; report: Report; replayed: boolean }
  | { accepted: false; reason: "global" | "visitor" };

export interface ReportsRepository {
  createUrlReport(input: CreateUrlReportInput): Promise<CreateUrlReportResult>;
  createImageReport(
    input: CreateImageReportInput,
  ): Promise<CreateUrlReportResult>;
  markExtracted(reportId: string, content: ExtractedContent): Promise<void>;
  markFailed(
    reportId: string,
    error: { code: string; publicMessage: string },
  ): Promise<void>;
  findByShortId(shortId: string): Promise<Report | null>;
  listEvents(reportId: string, afterSequence: number): Promise<ReportEvent[]>;
}

export type PublicReport = Omit<Report, "analyzedExcerpt">;

export function toPublicReport(report: Report): PublicReport {
  const { analyzedExcerpt: _privateExcerpt, ...publicReport } = report;
  return publicReport;
}

export function publicStagePayload(
  status: ReportStatus,
  extra: Record<string, unknown> = {},
) {
  return { status, ...extra };
}

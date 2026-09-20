import type {
  ExtractedContent,
  Report,
  ReportEvent,
} from "../../domain/reports";
import type {
  CompleteImageOcrInput,
  CreateImageReportInput,
  CreatePendingImageReportInput,
  CreateUrlReportInput,
  ReportsRepository,
} from "../reports/repository";

export class InMemoryReportsRepository implements ReportsRepository {
  readonly reports = new Map<string, Report>();
  readonly events = new Map<string, ReportEvent[]>();
  readonly idempotency = new Map<string, string>();

  constructor(private readonly now = () => new Date("2026-09-19T00:00:00Z")) {}

  async createUrlReport(input: CreateUrlReportInput) {
    const existingId = this.idempotency.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.reports.get(existingId);
      if (!existing) throw new Error("Missing idempotent report");
      return {
        accepted: true as const,
        replayed: true,
        report: structuredClone(existing),
      };
    }
    const timestamp = this.now().toISOString();
    const report: Report = {
      id: crypto.randomUUID(),
      shortId: input.shortId,
      sourceKind: "url",
      sourceUrl: input.sourceUrl,
      reportLocale: input.reportLocale,
      status: "queued",
      extractedTitle: null,
      extractedAuthor: null,
      analyzedExcerpt: null,
      extractedWordCount: null,
      analyzedWordCount: null,
      truncated: false,
      errorCode: null,
      errorMessage: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.reports.set(report.id, report);
    this.idempotency.set(input.idempotencyKey, report.id);
    this.events.set(report.id, [
      {
        sequence: 1,
        stage: "queued",
        payload: { status: "queued" },
        createdAt: timestamp,
      },
    ]);
    return {
      accepted: true as const,
      replayed: false,
      report: structuredClone(report),
    };
  }

  async createImageReport(input: CreateImageReportInput) {
    const existingId = this.idempotency.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.reports.get(existingId);
      if (!existing) throw new Error("Missing idempotent report");
      return {
        accepted: true as const,
        replayed: true,
        report: structuredClone(existing),
      };
    }
    const timestamp = this.now().toISOString();
    const report: Report = {
      id: crypto.randomUUID(),
      shortId: input.shortId,
      sourceKind: "image",
      sourceUrl: null,
      reportLocale: input.reportLocale,
      status: "queued",
      extractedTitle: null,
      extractedAuthor: null,
      analyzedExcerpt: input.extracted.text,
      extractedWordCount: input.extracted.extractedWordCount,
      analyzedWordCount: input.extracted.analyzedWordCount,
      truncated: input.extracted.truncated,
      errorCode: null,
      errorMessage: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.reports.set(report.id, report);
    this.idempotency.set(input.idempotencyKey, report.id);
    this.events.set(report.id, [
      {
        sequence: 1,
        stage: "queued",
        payload: { status: "queued" },
        createdAt: timestamp,
      },
    ]);
    return {
      accepted: true as const,
      replayed: false,
      report: structuredClone(report),
    };
  }

  async createPendingImageReport(input: CreatePendingImageReportInput) {
    const existingId = this.idempotency.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.reports.get(existingId);
      if (!existing) throw new Error("Missing idempotent report");
      return {
        accepted: true as const,
        replayed: true,
        report: structuredClone(existing),
      };
    }
    const timestamp = this.now().toISOString();
    const report: Report = {
      id: crypto.randomUUID(),
      shortId: input.shortId,
      sourceKind: "image",
      sourceUrl: null,
      reportLocale: input.reportLocale,
      status: "extracting",
      extractedTitle: null,
      extractedAuthor: null,
      analyzedExcerpt: null,
      extractedWordCount: null,
      analyzedWordCount: null,
      truncated: false,
      errorCode: null,
      errorMessage: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.reports.set(report.id, report);
    this.idempotency.set(input.idempotencyKey, report.id);
    this.events.set(report.id, [
      {
        sequence: 1,
        stage: "extracting",
        payload: { status: "extracting" },
        createdAt: timestamp,
      },
    ]);
    return {
      accepted: true as const,
      replayed: false,
      report: structuredClone(report),
    };
  }

  async completeImageOcr(reportId: string, extracted: CompleteImageOcrInput) {
    const report = this.reports.get(reportId);
    if (report?.sourceKind !== "image" || report.analyzedExcerpt) return;
    Object.assign(report, {
      status: "queued",
      analyzedExcerpt: extracted.text,
      extractedWordCount: extracted.extractedWordCount,
      analyzedWordCount: extracted.analyzedWordCount,
      truncated: extracted.truncated,
      updatedAt: this.now().toISOString(),
    });
    this.appendEvent(reportId, "queued", { status: "queued" });
  }

  async markExtracted(reportId: string, content: ExtractedContent) {
    const report = this.reports.get(reportId);
    if (
      !report ||
      (report.status !== "queued" && report.status !== "extracting")
    )
      return;
    const timestamp = this.now().toISOString();
    Object.assign(report, {
      status: "partial",
      sourceUrl: content.canonicalUrl,
      extractedTitle: content.title,
      extractedAuthor: content.author,
      analyzedExcerpt: content.text,
      extractedWordCount: content.extractedWordCount,
      analyzedWordCount: content.analyzedWordCount,
      truncated: content.truncated,
      updatedAt: timestamp,
    });
    this.appendEvent(reportId, "partial", {
      status: "partial",
      title: content.title,
    });
  }

  async markFailed(
    reportId: string,
    error: { code: string; publicMessage: string },
  ) {
    const report = this.reports.get(reportId);
    if (
      !report ||
      (report.status !== "queued" && report.status !== "extracting")
    )
      return;
    report.status = "failed";
    report.errorCode = error.code;
    report.errorMessage = error.publicMessage;
    report.updatedAt = this.now().toISOString();
    this.appendEvent(reportId, "failed", {
      status: "failed",
      errorCode: error.code,
    });
  }

  async findByShortId(shortId: string) {
    const report = [...this.reports.values()].find(
      (candidate) => candidate.shortId === shortId,
    );
    return report ? structuredClone(report) : null;
  }

  async listEvents(reportId: string, afterSequence: number) {
    return structuredClone(
      (this.events.get(reportId) ?? []).filter(
        (event) => event.sequence > afterSequence,
      ),
    );
  }

  private appendEvent(
    reportId: string,
    stage: ReportEvent["stage"],
    payload: Record<string, unknown>,
  ) {
    const events = this.events.get(reportId) ?? [];
    events.push({
      sequence: events.length + 1,
      stage,
      payload,
      createdAt: this.now().toISOString(),
    });
    this.events.set(reportId, events);
  }
}

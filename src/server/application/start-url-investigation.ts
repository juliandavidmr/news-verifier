import { randomBytes } from "node:crypto";
import type { ExtractedContent, SupportedLocale } from "../../domain/reports";
import { messages } from "../../lib/i18n";
import type { RemoteDocumentFetcher } from "../ingestion/public-url";
import {
  parsePublicHttpUrl,
  RemoteContentError,
} from "../ingestion/public-url";
import { extractReadableContent } from "../ingestion/readable-content";
import type { ReportsRepository } from "../reports/repository";

export type BackgroundTasks = {
  defer(task: () => Promise<void>): void;
};

export type StartUrlInvestigationDependencies = {
  reports: ReportsRepository;
  fetcher: RemoteDocumentFetcher;
  backgroundTasks: BackgroundTasks;
  createShortId?: () => string;
};

export type StartUrlInvestigationInput = {
  url: string;
  reportLocale: SupportedLocale;
};

export async function startUrlInvestigation(
  dependencies: StartUrlInvestigationDependencies,
  input: StartUrlInvestigationInput,
) {
  const sourceUrl = parsePublicHttpUrl(input.url);
  const report = await dependencies.reports.createUrlReport({
    shortId:
      dependencies.createShortId?.() ?? randomBytes(9).toString("base64url"),
    sourceUrl: sourceUrl.toString(),
    reportLocale: input.reportLocale,
  });

  dependencies.backgroundTasks.defer(async () => {
    try {
      const remoteDocument = await dependencies.fetcher.fetch(sourceUrl);
      const extracted = extractReadableContent(remoteDocument);
      await dependencies.reports.markExtracted(report.id, extracted);
    } catch (error) {
      const known =
        error instanceof RemoteContentError
          ? error
          : new RemoteContentError(
              "unreachable",
              "The page could not be processed",
            );
      await dependencies.reports.markFailed(report.id, {
        code: known.code,
        publicMessage: messages[input.reportLocale].extractionError,
      });
    }
  });

  return report;
}

export type UrlExtractionResult = ExtractedContent;

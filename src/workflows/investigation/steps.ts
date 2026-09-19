import { messages } from "../../lib/i18n";
import { SafeRemoteDocumentFetcher } from "../../server/ingestion/public-url";
import { extractReadableContent } from "../../server/ingestion/readable-content";
import { NeonReportsRepository } from "../../server/reports/neon-repository";
import { ResearchQueueRepository } from "../../server/research/queue-repository";

export async function acquireResearchLease(
  reportId: string,
  workflowRunId: string,
) {
  "use step";
  return new ResearchQueueRepository().acquireLease(reportId, workflowRunId);
}

export async function extractQueuedUrl(
  reportId: string,
  workflowRunId: string,
) {
  "use step";
  const queue = new ResearchQueueRepository();
  if (!(await queue.heartbeat(reportId, workflowRunId))) {
    throw new Error("Research lease was lost before extraction");
  }
  const source = await queue.getSource(reportId);
  if (!source) throw new Error("Queued URL source is unavailable");

  const remoteDocument = await new SafeRemoteDocumentFetcher().fetch(
    new URL(source.sourceUrl),
  );
  const extracted = extractReadableContent(remoteDocument);

  if (!(await queue.heartbeat(reportId, workflowRunId))) {
    throw new Error("Research lease expired during extraction");
  }
  await new NeonReportsRepository().markExtracted(reportId, extracted);
}

export async function failQueuedInvestigation(reportId: string) {
  "use step";
  const queue = new ResearchQueueRepository();
  const source = await queue.getSource(reportId);
  await new NeonReportsRepository().markFailed(reportId, {
    code: "extraction_failed",
    publicMessage: messages[source?.reportLocale ?? "en"].extractionError,
  });
}

export async function releaseResearchLease(
  reportId: string,
  workflowRunId: string,
) {
  "use step";
  await new ResearchQueueRepository().release(reportId, workflowRunId);
}

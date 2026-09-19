import { getWorkflowMetadata, sleep } from "workflow";
import {
  acquireResearchLease,
  extractQueuedUrl,
  failQueuedInvestigation,
  identifyQueuedClaims,
  releaseResearchLease,
  researchQueuedEvidence,
} from "./steps";

export async function investigationWorkflow(reportId: string) {
  "use workflow";
  const { workflowRunId } = getWorkflowMetadata();

  while (true) {
    const lease = await acquireResearchLease(reportId, workflowRunId);
    if (lease.outcome === "queued") {
      await sleep(`${lease.retryAfterSeconds}s`);
      continue;
    }
    if (lease.outcome !== "acquired") return { outcome: lease.outcome };

    try {
      await extractQueuedUrl(reportId, workflowRunId);
      await identifyQueuedClaims(reportId, workflowRunId);
      await researchQueuedEvidence(reportId, workflowRunId);
      return { outcome: "partial" as const };
    } catch {
      await failQueuedInvestigation(reportId);
      return { outcome: "failed" as const };
    } finally {
      await releaseResearchLease(reportId, workflowRunId);
    }
  }
}

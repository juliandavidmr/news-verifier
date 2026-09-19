import { start } from "workflow/api";
import { investigationWorkflow } from "../../workflows/investigation";
import { ResearchQueueRepository } from "./queue-repository";

export async function dispatchPendingInvestigations(
  limit = 5,
  reportId?: string,
) {
  const queue = new ResearchQueueRepository();
  let dispatched = 0;

  for (let index = 0; index < limit; index += 1) {
    const outbox = await queue.claimDispatch(reportId);
    if (!outbox) break;
    try {
      const run = await start(investigationWorkflow, [outbox.reportId]);
      await queue.markDispatched(outbox.id, run.runId);
      dispatched += 1;
    } catch (error) {
      await queue.markDispatchFailed(outbox.id, error);
      throw error;
    }
    if (reportId) break;
  }

  return dispatched;
}

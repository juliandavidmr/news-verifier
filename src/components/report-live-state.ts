import type { ReportEvent, ReportStatus } from "../domain/reports";
import { isTerminalStatus } from "../domain/reports";

export const initialPollDelay = 600;
export const regularPollDelay = 1_500;
export const maximumPollDelay = 10_000;

export function retryDelay(failures: number) {
  if (failures <= 0) return regularPollDelay;
  return Math.min(
    regularPollDelay * 2 ** Math.min(failures - 1, 4),
    maximumPollDelay,
  );
}

export function advanceEventCursor(
  current: number,
  events: readonly ReportEvent[],
) {
  return events.reduce(
    (latest, event) => Math.max(latest, event.sequence),
    current,
  );
}

export function shouldAnnounceReady(
  previousStatus: ReportStatus,
  nextStatus: ReportStatus,
  alreadyAnnounced: boolean,
) {
  return (
    !alreadyAnnounced &&
    !isTerminalStatus(previousStatus) &&
    isTerminalStatus(nextStatus)
  );
}

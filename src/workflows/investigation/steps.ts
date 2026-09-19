import { messages } from "../../lib/i18n";
import { GatewayClaimIdentifier } from "../../server/claims/gateway-identifier";
import { prioritizeClaims } from "../../server/claims/prioritize";
import { ClaimsRepository } from "../../server/claims/repository";
import { EvidenceRepository } from "../../server/evidence/repository";
import { researchEvidence } from "../../server/evidence/research";
import { ResilientExaSearchAdapter } from "../../server/evidence/search";
import { SafeRemoteDocumentFetcher } from "../../server/ingestion/public-url";
import { extractReadableContent } from "../../server/ingestion/readable-content";
import { NeonReportsRepository } from "../../server/reports/neon-repository";
import { ResearchQueueRepository } from "../../server/research/queue-repository";
import { GatewayVerdictEvaluator } from "../../server/verdicts/gateway-evaluator";
import { VerdictRepository } from "../../server/verdicts/repository";
import { applyVerdictRules } from "../../server/verdicts/rules";

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
    code: "investigation_failed",
    publicMessage: messages[source?.reportLocale ?? "en"].investigationError,
  });
}

export async function identifyQueuedClaims(
  reportId: string,
  workflowRunId: string,
) {
  "use step";
  const queue = new ResearchQueueRepository();
  const claims = new ClaimsRepository();
  const input = await claims.getIdentificationInput(reportId);
  if (!input) throw new Error("Claim identification input is unavailable");

  let heartbeatError: unknown;
  const heartbeat = setInterval(() => {
    void queue.heartbeat(reportId, workflowRunId).catch((error: unknown) => {
      heartbeatError = error;
    });
  }, 20_000);
  try {
    const result = await new GatewayClaimIdentifier().identify({
      text: input.text,
      reportLocale: input.reportLocale,
      reportId,
    });
    if (heartbeatError) throw heartbeatError;
    if (!(await queue.heartbeat(reportId, workflowRunId))) {
      throw new Error("Research lease expired during claim identification");
    }
    const prioritized = prioritizeClaims(
      input.text,
      result.claims,
      input.maxClaims,
    );
    await claims.persistIdentification(reportId, prioritized, result);
  } finally {
    clearInterval(heartbeat);
  }
}

export async function researchQueuedEvidence(
  reportId: string,
  workflowRunId: string,
) {
  "use step";
  const queue = new ResearchQueueRepository();
  const repository = new EvidenceRepository();
  const input = await repository.getResearchInput(reportId);
  if (!input) throw new Error("Evidence research input is unavailable");

  let heartbeatError: unknown;
  const heartbeat = setInterval(() => {
    void queue.heartbeat(reportId, workflowRunId).catch((error: unknown) => {
      heartbeatError = error;
    });
  }, 20_000);
  try {
    await researchEvidence(input, repository, {
      search: new ResilientExaSearchAdapter(),
      fetcher: new SafeRemoteDocumentFetcher(),
    });
    if (heartbeatError) throw heartbeatError;
    if (!(await queue.heartbeat(reportId, workflowRunId))) {
      throw new Error("Research lease expired during evidence discovery");
    }
    await repository.finishResearch(reportId);
  } finally {
    clearInterval(heartbeat);
  }
}

export async function evaluateQueuedReport(
  reportId: string,
  workflowRunId: string,
) {
  "use step";
  const queue = new ResearchQueueRepository();
  const repository = new VerdictRepository();
  const input = await repository.getEvaluationInput(reportId);
  if (!input) throw new Error("Verdict evaluation input is unavailable");

  let heartbeatError: unknown;
  const heartbeat = setInterval(() => {
    void queue.heartbeat(reportId, workflowRunId).catch((error: unknown) => {
      heartbeatError = error;
    });
  }, 20_000);
  try {
    const result = await new GatewayVerdictEvaluator().evaluate(input);
    if (heartbeatError) throw heartbeatError;
    if (!(await queue.heartbeat(reportId, workflowRunId))) {
      throw new Error("Research lease expired during verdict evaluation");
    }
    const evaluation = applyVerdictRules(input.claims, result.verdicts);
    await repository.persistEvaluation(reportId, input, evaluation, result);
  } finally {
    clearInterval(heartbeat);
  }
}

export async function releaseResearchLease(
  reportId: string,
  workflowRunId: string,
) {
  "use step";
  await new ResearchQueueRepository().release(reportId, workflowRunId);
}

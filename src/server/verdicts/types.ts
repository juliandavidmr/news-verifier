import type { SupportedLocale } from "../../domain/reports";
import type { SourceHierarchy } from "../evidence/types";

export const verdictValues = [
  "supported",
  "contradicted",
  "misleading",
  "disputed",
  "insufficient_evidence",
  "not_verifiable",
] as const;

export type Verdict = (typeof verdictValues)[number];
export type EvidenceStrength = "high" | "medium" | "low";
export type EvidenceRelation = "supports" | "contradicts" | "context";

export type EvaluationEvidence = {
  id: string;
  sourceUrl: string;
  sourceTitle: string | null;
  fragment: string;
  translatedFragment: string | null;
  hierarchy: SourceHierarchy;
  publishedAt: string | null;
  dependencyFingerprint: string;
};

export type EvaluationClaim = {
  id: string;
  statement: string;
  importance: number;
  selectionStatus: "selected" | "uninvestigated_limit";
  researchStatus:
    | "pending"
    | "completed"
    | "uninvestigated_limit"
    | "uninvestigated_time"
    | "uninvestigated_platform";
  referencePeriod: string;
  referenceScope: string;
  evidence: EvaluationEvidence[];
};

export type ReportEvaluationInput = {
  reportId: string;
  reportLocale: SupportedLocale;
  claims: EvaluationClaim[];
  configuration: Record<string, number>;
  previousModels: Array<{
    phase: string;
    requestedModel: string;
    responseModel: string;
    usage: Record<string, unknown>;
  }>;
};

export type ProposedEvidenceRelation = {
  evidenceId: string;
  relation: EvidenceRelation;
  temporalCompatible: boolean;
  scopeCompatible: boolean;
  rationale: string;
};

export type ProposedVerdict = {
  claimId: string;
  verdict: Verdict;
  explanation: string;
  relations: ProposedEvidenceRelation[];
};

export type VerdictModelResult = {
  verdicts: ProposedVerdict[];
  requestedModel: string;
  responseModel: string;
  usage: Record<string, unknown>;
};

export type AppliedRelation = ProposedEvidenceRelation;

export type AppliedVerdict = {
  claimId: string;
  proposedVerdict: Verdict;
  finalVerdict: Verdict;
  evidenceStrength: EvidenceStrength | null;
  explanation: string;
  importanceClass: "primary" | "relevant" | "secondary";
  weight: 5 | 2 | 1;
  includedInIndex: boolean;
  contribution: 100 | 50 | 0 | null;
  relations: AppliedRelation[];
};

export type AppliedReportEvaluation = {
  verdicts: AppliedVerdict[];
  evidenceCoverage: number;
  supportIndex: number | null;
  reportOutcome: "conclusive" | "inconclusive" | "partial";
  terminalStatus: "completed" | "partial";
  partialReason: "time_limit" | "platform_limit" | null;
};

export interface VerdictEvaluator {
  evaluate(input: ReportEvaluationInput): Promise<VerdictModelResult>;
}

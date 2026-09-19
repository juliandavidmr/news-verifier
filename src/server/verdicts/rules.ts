import type {
  AppliedReportEvaluation,
  AppliedVerdict,
  EvaluationClaim,
  ProposedVerdict,
  Verdict,
} from "./types";

const conclusiveVerdicts = new Set<Verdict>([
  "supported",
  "contradicted",
  "misleading",
]);

function importance(importanceValue: number) {
  if (importanceValue >= 4) {
    return { importanceClass: "primary" as const, weight: 5 as const };
  }
  if (importanceValue >= 2) {
    return { importanceClass: "relevant" as const, weight: 2 as const };
  }
  return { importanceClass: "secondary" as const, weight: 1 as const };
}

function contribution(verdict: Verdict): 100 | 50 | 0 | null {
  if (verdict === "supported") return 100;
  if (verdict === "misleading") return 50;
  if (verdict === "contradicted") return 0;
  return null;
}

function applyClaim(
  claim: EvaluationClaim,
  proposal: ProposedVerdict,
): AppliedVerdict {
  const evidenceById = new Map(claim.evidence.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const relations = proposal.relations.filter((relation) => {
    if (
      !evidenceById.has(relation.evidenceId) ||
      seen.has(relation.evidenceId)
    ) {
      return false;
    }
    seen.add(relation.evidenceId);
    return true;
  });
  const compatible = relations.filter(
    (relation) =>
      relation.temporalCompatible &&
      relation.scopeCompatible &&
      relation.relation !== "context",
  );
  const supports = compatible.filter(
    (relation) => relation.relation === "supports",
  );
  const contradicts = compatible.filter(
    (relation) => relation.relation === "contradicts",
  );
  const hasConflict = supports.length > 0 && contradicts.length > 0;
  const decisive = proposal.verdict === "contradicted" ? contradicts : supports;
  const decisiveEvidence = decisive.flatMap((relation) => {
    const evidence = evidenceById.get(relation.evidenceId);
    return evidence ? [evidence] : [];
  });
  const independentLines = new Set(
    decisiveEvidence.map((evidence) => evidence.dependencyFingerprint),
  ).size;
  const hasPrimary = decisiveEvidence.some(
    (evidence) => evidence.hierarchy === "primary",
  );
  const hasReliable = decisiveEvidence.some((evidence) =>
    ["primary", "expert", "independent"].includes(evidence.hierarchy),
  );
  const strength =
    proposal.verdict === "not_verifiable"
      ? null
      : hasConflict
        ? ("low" as const)
        : hasPrimary || independentLines >= 2
          ? ("high" as const)
          : hasReliable
            ? ("medium" as const)
            : ("low" as const);

  let finalVerdict = proposal.verdict;
  if (proposal.verdict === "not_verifiable") {
    finalVerdict = "not_verifiable";
  } else if (hasConflict) {
    finalVerdict = "disputed";
  } else if (proposal.verdict === "disputed") {
    finalVerdict = "insufficient_evidence";
  } else if (
    proposal.verdict === "supported" &&
    (supports.length === 0 || strength === "low")
  ) {
    finalVerdict = "insufficient_evidence";
  } else if (
    proposal.verdict === "contradicted" &&
    (contradicts.length === 0 || strength === "low")
  ) {
    finalVerdict = "insufficient_evidence";
  } else if (proposal.verdict === "misleading" && compatible.length === 0) {
    finalVerdict = "insufficient_evidence";
  } else if (
    proposal.verdict === "insufficient_evidence" ||
    compatible.length === 0
  ) {
    finalVerdict = "insufficient_evidence";
  }

  const finalContribution = contribution(finalVerdict);
  return {
    claimId: claim.id,
    proposedVerdict: proposal.verdict,
    finalVerdict,
    evidenceStrength: finalVerdict === "not_verifiable" ? null : strength,
    explanation: proposal.explanation,
    ...importance(claim.importance),
    includedInIndex: finalContribution !== null,
    contribution: finalContribution,
    relations,
  };
}

export function applyVerdictRules(
  claims: EvaluationClaim[],
  proposals: ProposedVerdict[],
  forcePartial = false,
): AppliedReportEvaluation {
  const proposalByClaim = new Map(
    proposals.map((item) => [item.claimId, item]),
  );
  const verdicts = claims.flatMap((claim) => {
    if (
      claim.selectionStatus !== "selected" ||
      claim.researchStatus !== "completed"
    ) {
      return [];
    }
    const proposal = proposalByClaim.get(claim.id) ?? {
      claimId: claim.id,
      verdict: "insufficient_evidence" as const,
      explanation: "No structured evaluation was returned for this claim.",
      relations: [],
    };
    return [applyClaim(claim, proposal)];
  });
  const verdictByClaim = new Map(verdicts.map((item) => [item.claimId, item]));
  const totalWeight = claims.reduce(
    (total, claim) => total + importance(claim.importance).weight,
    0,
  );
  const coveredWeight = claims.reduce((total, claim) => {
    const verdict = verdictByClaim.get(claim.id);
    return verdict && conclusiveVerdicts.has(verdict.finalVerdict)
      ? total + importance(claim.importance).weight
      : total;
  }, 0);
  const evidenceCoverage =
    totalWeight === 0
      ? 0
      : Math.round((coveredWeight / totalWeight) * 10_000) / 100;
  const primaryWithoutConclusion = claims.some((claim) => {
    if (importance(claim.importance).importanceClass !== "primary")
      return false;
    const verdict = verdictByClaim.get(claim.id);
    return !verdict || !conclusiveVerdicts.has(verdict.finalVerdict);
  });
  const indexNumerator = verdicts.reduce(
    (total, verdict) =>
      total +
      (verdict.contribution === null
        ? 0
        : verdict.weight * verdict.contribution),
    0,
  );
  const supportIndex =
    evidenceCoverage < 60 || primaryWithoutConclusion || coveredWeight === 0
      ? null
      : Math.round((indexNumerator / coveredWeight) * 100) / 100;
  const incomplete =
    forcePartial ||
    claims.some(
      (claim) =>
        claim.selectionStatus === "selected" &&
        claim.researchStatus !== "completed",
    );
  const partialReason = incomplete
    ? claims.some((claim) => claim.researchStatus === "uninvestigated_time")
      ? ("time_limit" as const)
      : ("platform_limit" as const)
    : null;
  return {
    verdicts,
    evidenceCoverage,
    supportIndex,
    reportOutcome: incomplete
      ? "partial"
      : supportIndex === null
        ? "inconclusive"
        : "conclusive",
    terminalStatus: incomplete ? "partial" : "completed",
    partialReason,
  };
}

import type { SupportedLocale } from "../../domain/reports";
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

const materialStopWords = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "de",
  "del",
  "des",
  "do",
  "dos",
  "el",
  "en",
  "et",
  "for",
  "from",
  "in",
  "la",
  "las",
  "le",
  "les",
  "los",
  "of",
  "on",
  "or",
  "para",
  "por",
  "the",
  "to",
  "un",
  "una",
  "une",
  "with",
  "y",
]);

const insufficientExplanations: Record<SupportedLocale, string> = {
  en: "The retrieved fragments do not explicitly address enough of this claim to support a conclusive verdict.",
  es: "Los fragmentos recuperados no abordan explícitamente suficiente parte de esta afirmación para sostener un veredicto concluyente.",
  fr: "Les extraits récupérés ne traitent pas explicitement une part suffisante de cette affirmation pour étayer un verdict concluant.",
  pt: "Os trechos recuperados não abordam explicitamente uma parte suficiente desta afirmação para sustentar um veredito conclusivo.",
};

function materialTokens(value: string) {
  return new Set(
    value
      .normalize("NFKD")
      .replaceAll(/\p{M}/gu, "")
      .toLocaleLowerCase()
      .replaceAll(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/u)
      .filter((word) => word.length > 1 && !materialStopWords.has(word)),
  );
}

export function fragmentMateriallyAddressesClaim(
  statement: string,
  fragment: string,
) {
  const fragmentWords = fragment.trim().split(/\s+/u);
  if (fragment.length > 650 || fragmentWords.length > 110) return false;

  const claimTokens = materialTokens(statement);
  const fragmentTokens = materialTokens(fragment);
  if (claimTokens.size === 0 || fragmentTokens.size === 0) return false;

  let overlap = 0;
  for (const token of claimTokens) {
    if (fragmentTokens.has(token)) overlap += 1;
  }
  const requiredCoverage = claimTokens.size <= 5 ? 0.8 : 0.65;
  if (overlap / claimTokens.size < requiredCoverage) return false;

  const numbers = [...claimTokens].filter((token) => /^\d/u.test(token));
  return numbers.every((number) => fragmentTokens.has(number));
}

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
  reportLocale: SupportedLocale,
): AppliedVerdict {
  const evidenceById = new Map(claim.evidence.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const relations = proposal.relations.flatMap((relation) => {
    if (
      !evidenceById.has(relation.evidenceId) ||
      seen.has(relation.evidenceId)
    ) {
      return [];
    }
    seen.add(relation.evidenceId);
    const evidence = evidenceById.get(relation.evidenceId);
    if (
      evidence &&
      relation.relation !== "context" &&
      !fragmentMateriallyAddressesClaim(claim.statement, evidence.fragment)
    ) {
      return [{ ...relation, relation: "context" as const }];
    }
    return [relation];
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
    explanation:
      finalVerdict === "insufficient_evidence" &&
      conclusiveVerdicts.has(proposal.verdict)
        ? insufficientExplanations[reportLocale]
        : proposal.explanation,
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
  reportLocale: SupportedLocale = "en",
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
    return [applyClaim(claim, proposal, reportLocale)];
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

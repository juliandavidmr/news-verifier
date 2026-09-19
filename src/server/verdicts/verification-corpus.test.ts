import { describe, expect, it } from "vitest";
import type { SupportedLocale } from "../../domain/reports";
import type { SourceHierarchy } from "../evidence/types";
import { applyVerdictRules } from "./rules";
import type {
  EvaluationClaim,
  EvidenceRelation,
  ProposedVerdict,
  Verdict,
} from "./types";
import corpus from "./verification-corpus.json";

type CorpusCase = (typeof corpus)[number];

function claim(testCase: CorpusCase): EvaluationClaim {
  return {
    id: testCase.id,
    statement: testCase.statement,
    importance: 5,
    selectionStatus: "selected",
    researchStatus: "completed",
    referencePeriod: "stated in the claim",
    referenceScope: "stated in the claim",
    evidence: testCase.evidence.map((evidence) => ({
      id: evidence.id,
      sourceUrl: `https://corpus.example/${evidence.id}`,
      sourceTitle: "Corpus evidence",
      fragment: evidence.fragment,
      translatedFragment: null,
      hierarchy: evidence.hierarchy as SourceHierarchy,
      publishedAt: null,
      dependencyFingerprint: evidence.dependency,
    })),
  };
}

function humanProposal(testCase: CorpusCase): ProposedVerdict {
  return {
    claimId: testCase.id,
    verdict: testCase.expectedVerdict as Verdict,
    explanation: "Human-reviewed corpus expectation.",
    relations: testCase.evidence.map((evidence) => ({
      evidenceId: evidence.id,
      relation: evidence.relation as EvidenceRelation,
      temporalCompatible: true,
      scopeCompatible: true,
      rationale: "Human-reviewed literal relation.",
    })),
  };
}

describe("versioned verification corpus", () => {
  for (const testCase of corpus) {
    it(`${testCase.id} preserves its reviewed deterministic outcome`, () => {
      const result = applyVerdictRules(
        [claim(testCase)],
        [humanProposal(testCase)],
        false,
        testCase.locale as SupportedLocale,
      );
      expect(result.verdicts[0].finalVerdict).toBe(testCase.expectedVerdict);
    });
  }
});

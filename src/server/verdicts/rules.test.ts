import { describe, expect, it } from "vitest";
import { applyVerdictRules } from "./rules";
import type { EvaluationClaim, ProposedVerdict } from "./types";

function claim(overrides: Partial<EvaluationClaim> = {}): EvaluationClaim {
  return {
    id: "claim-1",
    statement: "The city opened 12 libraries in 2025.",
    importance: 5,
    selectionStatus: "selected",
    researchStatus: "completed",
    referencePeriod: "2025",
    referenceScope: "the city",
    evidence: [
      {
        id: "evidence-1",
        sourceUrl: "https://city.gov/release",
        sourceTitle: "Release",
        fragment: "The city opened 12 libraries in 2025.",
        translatedFragment: null,
        hierarchy: "primary",
        publishedAt: "2025-02-01T00:00:00.000Z",
        dependencyFingerprint: "source-a",
      },
    ],
    ...overrides,
  };
}

function proposal(overrides: Partial<ProposedVerdict> = {}): ProposedVerdict {
  return {
    claimId: "claim-1",
    verdict: "supported",
    explanation: "The primary register confirms the claim.",
    relations: [
      {
        evidenceId: "evidence-1",
        relation: "supports",
        temporalCompatible: true,
        scopeCompatible: true,
        rationale: "Same city and year.",
      },
    ],
    ...overrides,
  };
}

describe("deterministic verdict rules", () => {
  it("accepts a compatible conclusive primary source without model confidence", () => {
    const result = applyVerdictRules([claim()], [proposal()]);
    expect(result).toMatchObject({
      evidenceCoverage: 100,
      supportIndex: 100,
      reportOutcome: "conclusive",
    });
    expect(result.verdicts[0]).toMatchObject({
      finalVerdict: "supported",
      evidenceStrength: "high",
      weight: 5,
      contribution: 100,
    });
    expect(JSON.stringify(result)).not.toContain("confidence");
  });

  it("degrades missing, unknown, time-incompatible and scope-incompatible evidence", () => {
    for (const relations of [
      [],
      [
        {
          ...proposal().relations[0],
          evidenceId: "fabricated-evidence-id",
        },
      ],
      [{ ...proposal().relations[0], temporalCompatible: false }],
      [{ ...proposal().relations[0], scopeCompatible: false }],
    ]) {
      const result = applyVerdictRules([claim()], [proposal({ relations })]);
      expect(result.verdicts[0]).toMatchObject({
        finalVerdict: "insufficient_evidence",
        includedInIndex: false,
      });
      expect(result.supportIndex).toBeNull();
    }
  });

  it("degrades thematic DART fragments that do not state the full claim", () => {
    const dartClaim = claim({
      statement:
        "DART was a NASA space mission designed to test a method of planetary defense against near-Earth objects.",
      evidence: [
        {
          ...claim().evidence[0],
          fragment:
            "Coupled with enhanced capabilities to accelerate finding the remaining hazardous asteroid population by our next Planetary Defense mission, the Near-Earth Object (NEO) Surveyor, a DART successor could provide what we need to save the day. With the asteroid pair within 7 million miles (11 million kilometers) of Earth, a global team is using dozens of telescopes stationed around the world and in space to observe the asteroid system.",
        },
        {
          ...claim().evidence[0],
          id: "evidence-2",
          fragment:
            "NASA's Planetary Defense Coordination Office is the lead for planetary defense activities and is sponsoring the DART mission.",
        },
        {
          ...claim().evidence[0],
          id: "evidence-3",
          fragment:
            "Relevant Links and Resources Pre- and Post-Impact Imagery Mission Resources DART Fact Sheet Press Kit Become a Planetary Defender Relevant Mission Releases NASA, SpaceX Launch DART: First Test Mission to Defend Planet Earth NASA’s DART Mission Hits Asteroid in First-Ever Planetary Defense Test NASA DART Imagery Shows Changed Orbit of Target Asteroid NASA Confirms DART Mission Impact Changed Asteroid’s Motion in Space NASA’s DART Data Validates Kinetic Impact as Planetary Defense Method Media 10 Images Planetary Defense Missions NEO Surveyor Designed to help NASA discover and characterize most of the potentially hazardous asteroids and comets that come within 30 million miles of Earth.",
        },
      ],
    });
    const result = applyVerdictRules(
      [dartClaim],
      [
        proposal({
          relations: dartClaim.evidence.map((evidence) => ({
            ...proposal().relations[0],
            evidenceId: evidence.id,
          })),
        }),
      ],
      false,
      "es",
    );

    expect(result.verdicts[0]).toMatchObject({
      finalVerdict: "insufficient_evidence",
      evidenceStrength: "low",
      includedInIndex: false,
    });
    expect(result.verdicts[0].relations).toHaveLength(3);
    expect(
      result.verdicts[0].relations.map((relation) => relation.relation),
    ).toEqual(["context", "context", "context"]);
    expect(result.verdicts[0].explanation).toContain(
      "no abordan explícitamente",
    );
  });

  it("rejects resource-list fragments even when they repeat claim terms", () => {
    const navigation = Array.from(
      { length: 14 },
      () =>
        "NASA DART space mission planetary defense near-Earth objects test method resources images press kit links.",
    ).join(" ");
    const result = applyVerdictRules(
      [
        claim({
          statement:
            "DART was a NASA space mission designed to test a method of planetary defense against near-Earth objects.",
          evidence: [{ ...claim().evidence[0], fragment: navigation }],
        }),
      ],
      [proposal()],
    );

    expect(result.verdicts[0].finalVerdict).toBe("insufficient_evidence");
    expect(result.verdicts[0].relations[0].relation).toBe("context");
  });

  it("turns reliable conflicts into disputed", () => {
    const conflicted = claim({
      evidence: [
        ...claim().evidence,
        {
          ...claim().evidence[0],
          id: "evidence-2",
          sourceUrl: "https://university.edu/study",
          hierarchy: "expert",
          dependencyFingerprint: "source-b",
        },
      ],
    });
    const result = applyVerdictRules(
      [conflicted],
      [
        proposal({
          relations: [
            proposal().relations[0],
            {
              evidenceId: "evidence-2",
              relation: "contradicts",
              temporalCompatible: true,
              scopeCompatible: true,
              rationale: "Same scope but conflicting count.",
            },
          ],
        }),
      ],
    );
    expect(result.verdicts[0].finalVerdict).toBe("disputed");
    expect(result.supportIndex).toBeNull();
  });

  it("supports all six verdict labels and excludes normative non-conclusions", () => {
    const verdicts = [
      "supported",
      "contradicted",
      "misleading",
      "disputed",
      "insufficient_evidence",
      "not_verifiable",
    ] as const;
    for (const verdict of verdicts) {
      const relation =
        verdict === "contradicted"
          ? "contradicts"
          : verdict === "disputed" ||
              verdict === "insufficient_evidence" ||
              verdict === "not_verifiable"
            ? "context"
            : "supports";
      const result = applyVerdictRules(
        [claim()],
        [
          proposal({
            verdict,
            relations: [{ ...proposal().relations[0], relation }],
          }),
        ],
      );
      expect(result.verdicts[0].finalVerdict).toBe(
        verdict === "disputed" ? "insufficient_evidence" : verdict,
      );
      expect(result.verdicts[0].includedInIndex).toBe(
        ["supported", "contradicted", "misleading"].includes(
          result.verdicts[0].finalVerdict,
        ),
      );
    }
  });

  it("hides the index below 60 percent coverage or with a primary gap", () => {
    const secondaryClaims = Array.from({ length: 5 }, (_, index) =>
      claim({
        id: `secondary-${index}`,
        importance: 1,
        evidence: claim().evidence.map((item) => ({
          ...item,
          id: `evidence-${index}`,
        })),
      }),
    );
    const lowCoverage = applyVerdictRules(secondaryClaims, [
      proposal({
        claimId: "secondary-0",
        relations: [{ ...proposal().relations[0], evidenceId: "evidence-0" }],
      }),
    ]);
    expect(lowCoverage.evidenceCoverage).toBe(20);
    expect(lowCoverage.supportIndex).toBeNull();

    const primaryGap = applyVerdictRules(
      [
        claim({ selectionStatus: "uninvestigated_limit" }),
        claim({ id: "relevant", importance: 3 }),
      ],
      [proposal({ claimId: "relevant" })],
    );
    expect(primaryGap.supportIndex).toBeNull();
  });

  it("distinguishes unfinished time and platform branches from insufficient evidence", () => {
    const timeLimited = applyVerdictRules(
      [claim({ researchStatus: "uninvestigated_time" })],
      [],
    );
    expect(timeLimited).toMatchObject({
      terminalStatus: "partial",
      reportOutcome: "partial",
      partialReason: "time_limit",
    });
    expect(timeLimited.verdicts).toEqual([]);

    const noEvidence = applyVerdictRules(
      [claim({ evidence: [] })],
      [proposal({ verdict: "insufficient_evidence", relations: [] })],
    );
    expect(noEvidence).toMatchObject({
      terminalStatus: "completed",
      partialReason: null,
    });
    expect(noEvidence.verdicts[0].finalVerdict).toBe("insufficient_evidence");
  });
});

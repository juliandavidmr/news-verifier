import { describe, expect, it } from "vitest";
import { GatewayVerdictEvaluator } from "./gateway-evaluator";

const runAiTests = process.env.RUN_AI_TESTS === "1";

describe.skipIf(!runAiTests)("AI Gateway verdict evaluation", () => {
  it("returns a structured verdict through the configured model pool", async () => {
    const result = await new GatewayVerdictEvaluator().evaluate({
      reportId: "gateway-verdict-integration-test",
      reportLocale: "en",
      configuration: {},
      previousModels: [],
      claims: [
        {
          id: "claim-lisbon",
          statement: "Lisbon is the capital of Portugal.",
          importance: 5,
          selectionStatus: "selected",
          researchStatus: "completed",
          referencePeriod: "current",
          referenceScope: "Portugal",
          evidence: [
            {
              id: "evidence-lisbon",
              sourceUrl: "https://corpus.example/lisbon",
              sourceTitle: "Official geographic record",
              fragment: "Lisbon is the capital and largest city of Portugal.",
              translatedFragment: null,
              hierarchy: "primary",
              publishedAt: null,
              dependencyFingerprint: "corpus-lisbon",
            },
          ],
        },
      ],
    });

    expect([
      "inclusionai/ling-3.0-flash-vl-free",
      "inclusionai/ling-3.0-flash-fin-free",
      "poolside/laguna-s-2.1-free",
      "alibaba/qwen3.8-27b",
    ]).toContain(result.requestedModel);
    expect(result.verdicts).toHaveLength(1);
    expect(result.verdicts[0]).toMatchObject({
      claimId: "claim-lisbon",
      verdict: "supported",
    });
    expect(result.verdicts[0]?.relations).toContainEqual(
      expect.objectContaining({
        evidenceId: "evidence-lisbon",
        relation: "supports",
      }),
    );
  }, 90_000);
});

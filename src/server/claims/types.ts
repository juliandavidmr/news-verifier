export type DetectedClaim = {
  statement: string;
  quote: string;
  importance: number;
  referencePeriod: string;
  referenceScope: string;
  equivalenceKey: string;
};

export type ClaimIdentification = {
  statement: string;
  sourceStart: number;
  sourceEnd: number;
  contextPassage: string;
  importance: number;
  referencePeriod: string;
  referenceScope: string;
  canonicalKey: string;
  selectionStatus: "selected" | "uninvestigated_limit";
};

export type ClaimModelResult = {
  claims: DetectedClaim[];
  requestedModel: string;
  responseModel: string;
  usage: Record<string, unknown>;
};

export interface ClaimIdentifier {
  identify(input: {
    text: string;
    reportLocale: "es" | "en" | "fr" | "pt";
    reportId: string;
  }): Promise<ClaimModelResult>;
}

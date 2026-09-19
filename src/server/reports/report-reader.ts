import type { ReportStatus } from "../../domain/reports";
import { getDatabase } from "../db";
import type {
  EvidenceRelation,
  EvidenceStrength,
  Verdict,
} from "../verdicts/types";

export type PublicEvidenceRecord = {
  id: string;
  sourceUrl: string;
  canonicalUrl: string;
  title: string | null;
  author: string | null;
  publishedAt: string | null;
  consultedAt: string;
  originalFragment: string;
  originalLanguage: string;
  translatedFragment: string | null;
  hierarchy: "primary" | "expert" | "independent" | "other";
  relation: EvidenceRelation;
  temporalCompatible: boolean;
  scopeCompatible: boolean;
  rationale: string;
};

export type PublicReportClaim = {
  id: string;
  ordinal: number;
  statement: string;
  contextPassage: string;
  referencePeriod: string;
  referenceScope: string;
  selectionStatus: "selected" | "uninvestigated_limit";
  researchStatus:
    | "pending"
    | "completed"
    | "uninvestigated_limit"
    | "uninvestigated_time"
    | "uninvestigated_platform";
  verdict: Verdict | null;
  evidenceStrength: EvidenceStrength | null;
  explanation: string | null;
  importanceClass: "primary" | "relevant" | "secondary";
  weight: 5 | 2 | 1;
  includedInIndex: boolean;
  contribution: number | null;
  evidence: PublicEvidenceRecord[];
};

export type PublicReportDetails = {
  status: ReportStatus;
  evidenceCoverage: number | null;
  supportIndex: number | null;
  outcome: "conclusive" | "inconclusive" | "partial" | null;
  partialReason: "time_limit" | "platform_limit" | null;
  methodologyVersion: string | null;
  completedAt: string | null;
  claims: PublicReportClaim[];
};

type SummaryRow = {
  status: ReportStatus;
  evidence_coverage: string | number | null;
  support_index: string | number | null;
  report_outcome: PublicReportDetails["outcome"];
  partial_reason: PublicReportDetails["partialReason"];
  methodology_version: string | null;
  completed_at: string | Date | null;
};

type ClaimRow = {
  id: string;
  ordinal: number;
  statement: string;
  context_passage: string;
  reference_period: string;
  reference_scope: string;
  selection_status: PublicReportClaim["selectionStatus"];
  research_status: PublicReportClaim["researchStatus"];
  importance: number;
  final_verdict: Verdict | null;
  evidence_strength: EvidenceStrength | null;
  explanation: string | null;
  importance_class: PublicReportClaim["importanceClass"] | null;
  weight: 5 | 2 | 1 | null;
  included_in_index: boolean | null;
  contribution: string | number | null;
};

type EvidenceRow = {
  claim_id: string;
  id: string;
  source_url: string;
  canonical_url: string;
  source_title: string | null;
  source_author: string | null;
  published_at: string | Date | null;
  created_at: string | Date;
  source_fragment: string;
  source_language: string;
  translated_fragment: string | null;
  source_hierarchy: PublicEvidenceRecord["hierarchy"];
  relation: EvidenceRelation;
  temporal_compatible: boolean;
  scope_compatible: boolean;
  rationale: string;
};

function iso(value: string | Date | null) {
  return value ? new Date(value).toISOString() : null;
}

function importance(value: number) {
  if (value >= 4)
    return { importanceClass: "primary" as const, weight: 5 as const };
  if (value >= 2)
    return { importanceClass: "relevant" as const, weight: 2 as const };
  return { importanceClass: "secondary" as const, weight: 1 as const };
}

export class ReportReaderRepository {
  async findDetails(reportId: string): Promise<PublicReportDetails | null> {
    const database = getDatabase();
    const [summaryRows, claimRows, evidenceRows] = await Promise.all([
      database.query(
        `SELECT status, evidence_coverage, support_index, report_outcome,
                partial_reason, methodology_version, completed_at
         FROM reports WHERE id = $1`,
        [reportId],
      ),
      database.query(
        `SELECT claims.id, claims.ordinal, claims.statement,
                claims.context_passage, claims.reference_period,
                claims.reference_scope, claims.selection_status,
                claims.research_status, claims.importance,
                verdict.final_verdict, verdict.evidence_strength,
                verdict.explanation, verdict.importance_class, verdict.weight,
                verdict.included_in_index, verdict.contribution
         FROM claims
         LEFT JOIN claim_verdicts verdict ON verdict.claim_id = claims.id
         WHERE claims.report_id = $1
         ORDER BY claims.ordinal`,
        [reportId],
      ),
      database.query(
        `SELECT evidence.claim_id, evidence.id, evidence.source_url,
                evidence.canonical_url, evidence.source_title,
                evidence.source_author, evidence.published_at,
                evidence.created_at, evidence.source_fragment,
                evidence.source_language, evidence.translated_fragment,
                evidence.source_hierarchy,
                COALESCE(relation.relation, 'context') AS relation,
                COALESCE(relation.temporal_compatible, false) AS temporal_compatible,
                COALESCE(relation.scope_compatible, false) AS scope_compatible,
                COALESCE(relation.rationale, '') AS rationale
         FROM evidence_records evidence
         LEFT JOIN claim_evidence_relations relation
           ON relation.evidence_id = evidence.id
         LEFT JOIN claim_verdicts verdict
           ON verdict.id = relation.verdict_id AND verdict.report_id = $1
         WHERE evidence.report_id = $1
         ORDER BY evidence.claim_id, evidence.created_at, evidence.id`,
        [reportId],
      ),
    ]);
    const summary = (summaryRows as unknown[])[0] as SummaryRow | undefined;
    if (!summary) return null;

    const evidenceByClaim = new Map<string, PublicEvidenceRecord[]>();
    for (const row of evidenceRows as unknown as EvidenceRow[]) {
      const evidence = evidenceByClaim.get(row.claim_id) ?? [];
      evidence.push({
        id: row.id,
        sourceUrl: row.source_url,
        canonicalUrl: row.canonical_url,
        title: row.source_title,
        author: row.source_author,
        publishedAt: iso(row.published_at),
        consultedAt: iso(row.created_at) ?? new Date(0).toISOString(),
        originalFragment: row.source_fragment,
        originalLanguage: row.source_language,
        translatedFragment: row.translated_fragment,
        hierarchy: row.source_hierarchy,
        relation: row.relation,
        temporalCompatible: row.temporal_compatible,
        scopeCompatible: row.scope_compatible,
        rationale: row.rationale,
      });
      evidenceByClaim.set(row.claim_id, evidence);
    }

    return {
      status: summary.status,
      evidenceCoverage:
        summary.evidence_coverage === null
          ? null
          : Number(summary.evidence_coverage),
      supportIndex:
        summary.support_index === null ? null : Number(summary.support_index),
      outcome: summary.report_outcome,
      partialReason: summary.partial_reason,
      methodologyVersion: summary.methodology_version,
      completedAt: iso(summary.completed_at),
      claims: (claimRows as unknown as ClaimRow[]).map((claim) => {
        const fallbackImportance = importance(claim.importance);
        return {
          id: claim.id,
          ordinal: claim.ordinal,
          statement: claim.statement,
          contextPassage: claim.context_passage,
          referencePeriod: claim.reference_period,
          referenceScope: claim.reference_scope,
          selectionStatus: claim.selection_status,
          researchStatus: claim.research_status,
          verdict: claim.final_verdict,
          evidenceStrength: claim.evidence_strength,
          explanation: claim.explanation,
          importanceClass:
            claim.importance_class ?? fallbackImportance.importanceClass,
          weight: claim.weight ?? fallbackImportance.weight,
          includedInIndex: claim.included_in_index ?? false,
          contribution:
            claim.contribution === null ? null : Number(claim.contribution),
          evidence: evidenceByClaim.get(claim.id) ?? [],
        };
      }),
    };
  }
}

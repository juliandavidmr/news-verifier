ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS evidence_coverage numeric(5,2),
  ADD COLUMN IF NOT EXISTS support_index numeric(5,2),
  ADD COLUMN IF NOT EXISTS report_outcome text CHECK (
    report_outcome IN ('conclusive', 'inconclusive', 'partial')
  ),
  ADD COLUMN IF NOT EXISTS methodology_version text,
  ADD COLUMN IF NOT EXISTS configuration_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS model_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE TABLE IF NOT EXISTS claim_verdicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  proposed_verdict text NOT NULL CHECK (
    proposed_verdict IN (
      'supported', 'contradicted', 'misleading', 'disputed',
      'insufficient_evidence', 'not_verifiable'
    )
  ),
  final_verdict text NOT NULL CHECK (
    final_verdict IN (
      'supported', 'contradicted', 'misleading', 'disputed',
      'insufficient_evidence', 'not_verifiable'
    )
  ),
  evidence_strength text CHECK (evidence_strength IN ('high', 'medium', 'low')),
  explanation text NOT NULL,
  importance_class text NOT NULL CHECK (
    importance_class IN ('primary', 'relevant', 'secondary')
  ),
  weight smallint NOT NULL CHECK (weight IN (1, 2, 5)),
  included_in_index boolean NOT NULL,
  contribution numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (claim_id)
);

CREATE TABLE IF NOT EXISTS claim_evidence_relations (
  verdict_id uuid NOT NULL REFERENCES claim_verdicts(id) ON DELETE CASCADE,
  evidence_id uuid NOT NULL REFERENCES evidence_records(id) ON DELETE CASCADE,
  relation text NOT NULL CHECK (relation IN ('supports', 'contradicts', 'context')),
  temporal_compatible boolean NOT NULL,
  scope_compatible boolean NOT NULL,
  rationale text NOT NULL,
  PRIMARY KEY (verdict_id, evidence_id)
);

CREATE INDEX IF NOT EXISTS claim_verdicts_report_idx
  ON claim_verdicts (report_id, created_at);

ALTER TABLE quota_config
  ADD COLUMN IF NOT EXISTS claim_concurrency integer NOT NULL DEFAULT 3
    CHECK (claim_concurrency BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS search_cutoff_seconds integer NOT NULL DEFAULT 270
    CHECK (search_cutoff_seconds BETWEEN 30 AND 270);

ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS research_status text NOT NULL DEFAULT 'pending'
    CHECK (research_status IN (
      'pending', 'completed', 'uninvestigated_limit',
      'uninvestigated_time', 'uninvestigated_platform'
    ));

UPDATE claims
SET research_status = 'uninvestigated_limit'
WHERE selection_status = 'uninvestigated_limit'
  AND research_status = 'pending';

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS partial_reason text;

CREATE TABLE IF NOT EXISTS provider_circuits (
  provider text PRIMARY KEY,
  opened_until timestamptz NOT NULL,
  reason text NOT NULL,
  retry_after_seconds integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  phase text NOT NULL,
  requested_model text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('succeeded', 'failed', 'circuit_open')),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_attempts_report_idx
  ON ai_attempts (report_id, id);

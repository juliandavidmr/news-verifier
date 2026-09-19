ALTER TABLE quota_config
  ADD COLUMN IF NOT EXISTS max_claims integer NOT NULL DEFAULT 15
    CHECK (max_claims BETWEEN 1 AND 15);

CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  ordinal integer NOT NULL,
  statement text NOT NULL,
  source_start integer NOT NULL CHECK (source_start >= 0),
  source_end integer NOT NULL CHECK (source_end > source_start),
  context_passage text NOT NULL,
  importance smallint NOT NULL CHECK (importance BETWEEN 1 AND 5),
  reference_period text NOT NULL,
  reference_scope text NOT NULL,
  canonical_key text NOT NULL,
  selection_status text NOT NULL CHECK (
    selection_status IN ('selected', 'uninvestigated_limit')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, ordinal)
);

CREATE INDEX IF NOT EXISTS claims_report_selection_idx
  ON claims (report_id, selection_status, ordinal);

CREATE TABLE IF NOT EXISTS ai_calls (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  phase text NOT NULL,
  requested_model text NOT NULL,
  response_model text NOT NULL,
  usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

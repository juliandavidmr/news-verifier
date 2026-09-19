ALTER TABLE quota_config
  ADD COLUMN IF NOT EXISTS max_evidence_searches integer NOT NULL DEFAULT 15
    CHECK (max_evidence_searches BETWEEN 1 AND 30),
  ADD COLUMN IF NOT EXISTS max_search_results integer NOT NULL DEFAULT 5
    CHECK (max_search_results BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS max_evidence_per_claim integer NOT NULL DEFAULT 3
    CHECK (max_evidence_per_claim BETWEEN 1 AND 5);

CREATE TABLE IF NOT EXISTS evidence_searches (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  query text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gateway_exa', 'direct_exa')),
  status text NOT NULL CHECK (status IN ('reserved', 'completed', 'failed')),
  candidate_count integer NOT NULL DEFAULT 0 CHECK (candidate_count >= 0),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (claim_id)
);

CREATE INDEX IF NOT EXISTS evidence_searches_report_idx
  ON evidence_searches (report_id, created_at);

CREATE TABLE IF NOT EXISTS evidence_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  search_id bigint NOT NULL REFERENCES evidence_searches(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  canonical_url text NOT NULL,
  source_title text,
  source_author text,
  published_at timestamptz,
  source_fragment text NOT NULL,
  source_language varchar(8) NOT NULL,
  translated_fragment text,
  query text NOT NULL,
  source_hierarchy text NOT NULL CHECK (
    source_hierarchy IN ('primary', 'expert', 'independent', 'other')
  ),
  content_fingerprint varchar(64) NOT NULL,
  dependency_fingerprint varchar(64) NOT NULL,
  search_provider text NOT NULL CHECK (
    search_provider IN ('gateway_exa', 'direct_exa')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (claim_id, canonical_url),
  UNIQUE (claim_id, dependency_fingerprint)
);

CREATE INDEX IF NOT EXISTS evidence_records_report_claim_idx
  ON evidence_records (report_id, claim_id, created_at);

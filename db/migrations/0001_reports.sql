CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id varchar(24) NOT NULL UNIQUE,
  source_kind text NOT NULL CHECK (source_kind IN ('url', 'image')),
  source_url text,
  report_locale varchar(2) NOT NULL CHECK (report_locale IN ('es', 'en', 'fr', 'pt')),
  status text NOT NULL CHECK (
    status IN (
      'queued',
      'extracting',
      'identifying_claims',
      'researching',
      'evaluating',
      'generating_report',
      'completed',
      'partial',
      'failed'
    )
  ),
  extracted_title text,
  extracted_author text,
  analyzed_excerpt text,
  extracted_word_count integer,
  analyzed_word_count integer,
  truncated boolean NOT NULL DEFAULT false,
  error_code text,
  error_message text,
  next_event_sequence integer NOT NULL DEFAULT 2,
  extraction_started_at timestamptz NOT NULL DEFAULT now(),
  extraction_finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_url_source CHECK (
    (source_kind = 'url' AND source_url IS NOT NULL) OR source_kind = 'image'
  )
);

CREATE TABLE IF NOT EXISTS report_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  stage text NOT NULL CHECK (
    stage IN (
      'queued',
      'extracting',
      'identifying_claims',
      'researching',
      'evaluating',
      'generating_report',
      'completed',
      'partial',
      'failed'
    )
  ),
  public_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, sequence)
);

CREATE INDEX IF NOT EXISTS report_events_report_sequence_idx
  ON report_events (report_id, sequence);

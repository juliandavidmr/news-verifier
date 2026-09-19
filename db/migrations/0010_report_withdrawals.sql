ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS publicly_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawal_reason text;

CREATE INDEX IF NOT EXISTS reports_public_short_id_idx
  ON reports (short_id)
  WHERE publicly_visible = true;

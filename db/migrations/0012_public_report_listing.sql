CREATE TABLE IF NOT EXISTS report_publications (
  report_id uuid PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  withdrawal_reason text
);

CREATE OR REPLACE FUNCTION register_report_publication()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.source_kind = 'url' THEN
    INSERT INTO report_publications (report_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_register_publication ON reports;

CREATE TRIGGER reports_register_publication
AFTER INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION register_report_publication();

CREATE INDEX IF NOT EXISTS report_publications_active_idx
  ON report_publications (created_at DESC, report_id)
  WHERE withdrawn_at IS NULL;

CREATE INDEX IF NOT EXISTS reports_public_listing_idx
  ON reports (completed_at DESC, id DESC)
  WHERE publicly_visible = true
    AND source_kind = 'url'
    AND status = 'completed'
    AND report_outcome = 'conclusive'
    AND evidence_coverage >= 60
    AND extracted_title IS NOT NULL;

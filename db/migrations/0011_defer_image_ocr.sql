CREATE OR REPLACE FUNCTION accept_pending_image_investigation(
  p_short_id text,
  p_report_locale varchar(2),
  p_visitor_key text,
  p_network_key text,
  p_idempotency_key text,
  p_usage_date date DEFAULT current_date
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_decision jsonb;
  v_report reports%ROWTYPE;
BEGIN
  v_decision := accept_url_investigation(
    p_short_id,
    'https://ephemeral-image.invalid/' || p_short_id,
    p_report_locale,
    p_visitor_key,
    p_network_key,
    p_idempotency_key,
    p_usage_date
  );

  IF NOT (v_decision->>'accepted')::boolean THEN
    RETURN v_decision;
  END IF;

  IF (v_decision->>'replayed')::boolean THEN
    SELECT * INTO v_report
    FROM reports
    WHERE id = (v_decision->'report'->>'id')::uuid;
    RETURN jsonb_build_object(
      'accepted', true,
      'replayed', true,
      'report', to_jsonb(v_report)
    );
  END IF;

  UPDATE reports
  SET source_kind = 'image',
      source_url = NULL,
      status = 'extracting',
      updated_at = now()
  WHERE id = (v_decision->'report'->>'id')::uuid
  RETURNING * INTO v_report;

  UPDATE report_events
  SET stage = 'extracting',
      public_payload = '{"status":"extracting"}'::jsonb
  WHERE report_id = v_report.id AND sequence = 1;

  DELETE FROM dispatch_outbox WHERE report_id = v_report.id;

  RETURN jsonb_build_object(
    'accepted', true,
    'replayed', false,
    'report', to_jsonb(v_report)
  );
END;
$$;

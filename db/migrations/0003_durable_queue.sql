ALTER TABLE quota_config
  ADD COLUMN IF NOT EXISTS max_active_researches integer NOT NULL DEFAULT 2
    CHECK (max_active_researches >= 2),
  ADD COLUMN IF NOT EXISTS max_queue_seconds integer NOT NULL DEFAULT 900
    CHECK (max_queue_seconds > 0),
  ADD COLUMN IF NOT EXISTS research_budget_seconds integer NOT NULL DEFAULT 300
    CHECK (research_budget_seconds > 0),
  ADD COLUMN IF NOT EXISTS lease_seconds integer NOT NULL DEFAULT 60
    CHECK (lease_seconds >= 15);

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS queued_at timestamptz,
  ADD COLUMN IF NOT EXISTS research_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS research_deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS workflow_run_id text,
  ADD COLUMN IF NOT EXISTS active_workflow_run_id text,
  ADD COLUMN IF NOT EXISTS lease_slot integer;

ALTER TABLE dispatch_outbox
  DROP CONSTRAINT IF EXISTS dispatch_outbox_status_check;

ALTER TABLE dispatch_outbox
  ADD CONSTRAINT dispatch_outbox_status_check
  CHECK (status IN ('pending', 'dispatching', 'dispatched', 'failed'));

ALTER TABLE dispatch_outbox
  ADD COLUMN IF NOT EXISTS workflow_run_id text,
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE TABLE IF NOT EXISTS research_leases (
  slot integer PRIMARY KEY CHECK (slot > 0),
  report_id uuid NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  workflow_run_id text NOT NULL,
  heartbeat_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS research_leases_expiry_idx
  ON research_leases (expires_at);

CREATE OR REPLACE FUNCTION accept_url_investigation(
  p_short_id text,
  p_source_url text,
  p_report_locale varchar(2),
  p_visitor_key text,
  p_network_key text,
  p_idempotency_key text,
  p_usage_date date DEFAULT current_date
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_config quota_config%ROWTYPE;
  v_existing reports%ROWTYPE;
  v_report reports%ROWTYPE;
  v_global_count integer;
  v_visitor_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));

  SELECT reports.* INTO v_existing
  FROM quota_reservations
  JOIN reports ON reports.id = quota_reservations.report_id
  WHERE quota_reservations.idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'accepted', true,
      'replayed', true,
      'report', to_jsonb(v_existing)
    );
  END IF;

  SELECT * INTO v_config FROM quota_config WHERE id = 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'quota_config row 1 is missing';
  END IF;

  INSERT INTO daily_usage (usage_date, scope, scope_key)
  VALUES (p_usage_date, 'global', 'global')
  ON CONFLICT DO NOTHING;

  INSERT INTO daily_usage (usage_date, scope, scope_key)
  VALUES (p_usage_date, 'visitor', p_visitor_key)
  ON CONFLICT DO NOTHING;

  SELECT used_count INTO v_global_count
  FROM daily_usage
  WHERE usage_date = p_usage_date AND scope = 'global' AND scope_key = 'global'
  FOR UPDATE;

  SELECT used_count INTO v_visitor_count
  FROM daily_usage
  WHERE usage_date = p_usage_date AND scope = 'visitor' AND scope_key = p_visitor_key
  FOR UPDATE;

  IF v_global_count >= v_config.daily_global_limit THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'global');
  END IF;

  IF v_visitor_count >= v_config.daily_visitor_limit THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'visitor');
  END IF;

  UPDATE daily_usage
  SET used_count = used_count + 1, updated_at = now()
  WHERE usage_date = p_usage_date AND scope = 'global' AND scope_key = 'global';

  UPDATE daily_usage
  SET used_count = used_count + 1, updated_at = now()
  WHERE usage_date = p_usage_date AND scope = 'visitor' AND scope_key = p_visitor_key;

  INSERT INTO reports (
    short_id, source_kind, source_url, report_locale, status, queued_at
  ) VALUES (
    p_short_id, 'url', p_source_url, p_report_locale, 'queued', now()
  ) RETURNING * INTO v_report;

  INSERT INTO report_events (report_id, sequence, stage, public_payload)
  VALUES (v_report.id, 1, 'queued', '{"status":"queued"}'::jsonb);

  INSERT INTO quota_reservations (
    report_id, idempotency_key, visitor_key, network_key, usage_date, status
  ) VALUES (
    v_report.id, p_idempotency_key, p_visitor_key, p_network_key,
    p_usage_date, 'reserved'
  );

  INSERT INTO dispatch_outbox (report_id, payload)
  VALUES (v_report.id, jsonb_build_object('reportId', v_report.id));

  RETURN jsonb_build_object(
    'accepted', true,
    'replayed', false,
    'report', to_jsonb(v_report)
  );
END;
$$;

CREATE OR REPLACE FUNCTION try_acquire_research_lease(
  p_report_id uuid,
  p_workflow_run_id text,
  p_now timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_config quota_config%ROWTYPE;
  v_report reports%ROWTYPE;
  v_slot integer;
  v_sequence integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('news-verifier-research-leases'));
  SELECT * INTO v_config FROM quota_config WHERE id = 1;
  SELECT * INTO v_report FROM reports WHERE id = p_report_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('outcome', 'missing');
  END IF;

  IF v_report.status IN ('completed', 'partial', 'failed') THEN
    RETURN jsonb_build_object('outcome', 'terminal');
  END IF;

  DELETE FROM research_leases WHERE expires_at <= p_now;

  IF v_report.active_workflow_run_id IS NOT NULL
     AND v_report.active_workflow_run_id <> p_workflow_run_id
     AND EXISTS (
       SELECT 1 FROM research_leases
       WHERE report_id = p_report_id AND expires_at > p_now
     ) THEN
    RETURN jsonb_build_object('outcome', 'duplicate');
  END IF;

  IF COALESCE(v_report.queued_at, v_report.created_at)
     + make_interval(secs => v_config.max_queue_seconds) <= p_now THEN
    UPDATE reports
    SET status = 'failed',
        error_code = 'queue_capacity_timeout',
        error_message = 'The investigation could not start before the queue deadline.',
        updated_at = p_now,
        next_event_sequence = next_event_sequence + 1,
        active_workflow_run_id = NULL,
        lease_slot = NULL
    WHERE id = p_report_id
    RETURNING next_event_sequence - 1 INTO v_sequence;

    INSERT INTO report_events (report_id, sequence, stage, public_payload)
    VALUES (
      p_report_id, v_sequence, 'failed',
      '{"status":"failed","errorCode":"queue_capacity_timeout"}'::jsonb
    );

    WITH refunded AS (
      UPDATE quota_reservations
      SET status = 'refunded', refund_reason = 'queue_capacity_timeout', updated_at = p_now
      WHERE report_id = p_report_id AND status = 'reserved'
      RETURNING visitor_key, usage_date
    )
    UPDATE daily_usage usage
    SET used_count = GREATEST(0, used_count - 1), updated_at = p_now
    FROM refunded
    WHERE usage.usage_date = refunded.usage_date
      AND usage.scope = 'visitor'
      AND usage.scope_key = refunded.visitor_key;

    RETURN jsonb_build_object('outcome', 'expired');
  END IF;

  SELECT candidate INTO v_slot
  FROM generate_series(1, v_config.max_active_researches) AS candidate
  WHERE NOT EXISTS (
    SELECT 1 FROM research_leases WHERE slot = candidate
  )
  ORDER BY candidate
  LIMIT 1;

  IF v_slot IS NULL THEN
    RETURN jsonb_build_object('outcome', 'queued', 'retryAfterSeconds', 10);
  END IF;

  INSERT INTO research_leases (
    slot, report_id, workflow_run_id, heartbeat_at, expires_at
  ) VALUES (
    v_slot, p_report_id, p_workflow_run_id, p_now,
    p_now + make_interval(secs => v_config.lease_seconds)
  );

  UPDATE reports
  SET status = 'extracting',
      workflow_run_id = COALESCE(workflow_run_id, p_workflow_run_id),
      active_workflow_run_id = p_workflow_run_id,
      lease_slot = v_slot,
      research_started_at = COALESCE(research_started_at, p_now),
      research_deadline_at = COALESCE(
        research_deadline_at,
        p_now + make_interval(secs => v_config.research_budget_seconds)
      ),
      extraction_started_at = p_now,
      updated_at = p_now,
      next_event_sequence = next_event_sequence + 1
  WHERE id = p_report_id
  RETURNING next_event_sequence - 1 INTO v_sequence;

  INSERT INTO report_events (report_id, sequence, stage, public_payload)
  VALUES (p_report_id, v_sequence, 'extracting', '{"status":"extracting"}'::jsonb);

  RETURN jsonb_build_object(
    'outcome', 'acquired',
    'slot', v_slot,
    'deadline', p_now + make_interval(secs => v_config.research_budget_seconds)
  );
END;
$$;

CREATE OR REPLACE FUNCTION heartbeat_research_lease(
  p_report_id uuid,
  p_workflow_run_id text,
  p_now timestamptz DEFAULT now()
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_lease_seconds integer;
BEGIN
  SELECT lease_seconds INTO v_lease_seconds FROM quota_config WHERE id = 1;
  UPDATE research_leases
  SET heartbeat_at = p_now,
      expires_at = p_now + make_interval(secs => v_lease_seconds)
  WHERE report_id = p_report_id
    AND workflow_run_id = p_workflow_run_id
    AND expires_at > p_now;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION release_research_lease(
  p_report_id uuid,
  p_workflow_run_id text
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM research_leases
  WHERE report_id = p_report_id AND workflow_run_id = p_workflow_run_id;

  UPDATE reports
  SET active_workflow_run_id = NULL, lease_slot = NULL, updated_at = now()
  WHERE id = p_report_id AND active_workflow_run_id = p_workflow_run_id;
END;
$$;

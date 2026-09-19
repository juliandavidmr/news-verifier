CREATE TABLE IF NOT EXISTS quota_config (
  id smallint PRIMARY KEY CHECK (id = 1),
  daily_global_limit integer NOT NULL CHECK (daily_global_limit > 0),
  daily_visitor_limit integer NOT NULL CHECK (daily_visitor_limit > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO quota_config (id, daily_global_limit, daily_visitor_limit)
VALUES (1, 100, 30)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS daily_usage (
  usage_date date NOT NULL,
  scope text NOT NULL CHECK (scope IN ('global', 'visitor')),
  scope_key text NOT NULL,
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usage_date, scope, scope_key)
);

CREATE TABLE IF NOT EXISTS quota_reservations (
  report_id uuid PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL UNIQUE,
  visitor_key text NOT NULL,
  network_key text NOT NULL,
  usage_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('reserved', 'consumed', 'refunded')),
  refund_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quota_reservations_visitor_date_idx
  ON quota_reservations (visitor_key, usage_date);

CREATE TABLE IF NOT EXISTS dispatch_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id uuid NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'start_investigation',
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

  INSERT INTO reports (short_id, source_kind, source_url, report_locale, status)
  VALUES (p_short_id, 'url', p_source_url, p_report_locale, 'extracting')
  RETURNING * INTO v_report;

  INSERT INTO report_events (report_id, sequence, stage, public_payload)
  VALUES (v_report.id, 1, 'extracting', '{"status":"extracting"}'::jsonb);

  INSERT INTO quota_reservations (
    report_id,
    idempotency_key,
    visitor_key,
    network_key,
    usage_date,
    status
  ) VALUES (
    v_report.id,
    p_idempotency_key,
    p_visitor_key,
    p_network_key,
    p_usage_date,
    'reserved'
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

ALTER FUNCTION try_acquire_research_lease(uuid, text, timestamptz)
  RENAME TO try_acquire_research_lease_v1;

CREATE FUNCTION try_acquire_research_lease(
  p_report_id uuid,
  p_workflow_run_id text,
  p_now timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_slot integer;
  v_deadline timestamptz;
  v_lease_seconds integer;
BEGIN
  SELECT lease.slot, reports.research_deadline_at, config.lease_seconds
  INTO v_slot, v_deadline, v_lease_seconds
  FROM research_leases lease
  JOIN reports ON reports.id = lease.report_id
  CROSS JOIN quota_config config
  WHERE lease.report_id = p_report_id
    AND lease.workflow_run_id = p_workflow_run_id
    AND lease.expires_at > p_now
    AND config.id = 1
  FOR UPDATE OF lease;

  IF FOUND THEN
    UPDATE research_leases
    SET heartbeat_at = p_now,
        expires_at = p_now + make_interval(secs => v_lease_seconds)
    WHERE slot = v_slot;
    RETURN jsonb_build_object(
      'outcome', 'acquired',
      'slot', v_slot,
      'deadline', v_deadline
    );
  END IF;

  RETURN try_acquire_research_lease_v1(
    p_report_id,
    p_workflow_run_id,
    p_now
  );
END;
$$;

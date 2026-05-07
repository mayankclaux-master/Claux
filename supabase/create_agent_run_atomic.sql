-- Atomic agent run creation with transaction lock
-- This function acquires a transaction-level advisory lock, creates a run record,
-- updates agent state, and returns the runId - all in one transaction

CREATE OR REPLACE FUNCTION create_agent_run_atomic(
  p_tenant_id UUID,
  p_agent TEXT,
  p_triggered_by TEXT DEFAULT 'manual',
  p_execution_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_run_id UUID;
  v_lock_key BIGINT;
  v_lock_acquired BOOLEAN;
BEGIN
  -- Generate lock key from tenant_id and agent
  v_lock_key := hashtext(p_tenant_id::TEXT || ':' || p_agent);
  
  -- Acquire transaction-level advisory lock (auto-releases on transaction end)
  -- pg_advisory_xact_lock waits until lock is available
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Generate run ID
  v_run_id := gen_random_uuid();
  
  -- Insert into agent_runs
  INSERT INTO agent_runs (
    id,
    tenant_id,
    agent,
    status,
    triggered_by,
    created_at,
    metadata
  ) VALUES (
    v_run_id,
    p_tenant_id,
    p_agent,
    'queued',
    p_triggered_by,
    NOW(),
    jsonb_build_object(
      'retry_count', 0,
      'max_retries', 3,
      'execution_id', COALESCE(p_execution_id, v_run_id::TEXT)
    )
  );
  
  -- Update agent_states
  UPDATE agent_states
  SET
    status = 'queued',
    progress = 0,
    current_task = 'Run created, awaiting execution',
    last_run_at = NOW(),
    current_run_id = v_run_id
  WHERE
    tenant_id = p_tenant_id
    AND agent = p_agent;
  
  -- Return runId
  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'success', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will roll back and lock will auto-release
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;

COMMENT ON FUNCTION create_agent_run_atomic IS 'Atomic agent run creation with transaction-level advisory lock';

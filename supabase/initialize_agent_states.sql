CREATE OR REPLACE FUNCTION initialize_agent_states(p_tenant_id UUID)
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO agent_states (
    tenant_id,
    agent,
    status,
    progress,
    current_task,
    run_count,
    error_count,
    enabled,
    config
  ) VALUES
    (p_tenant_id, 'ARIA', 'queued', 0, 'Initializing', 0, 0, true, '{}'::jsonb),
    (p_tenant_id, 'SCRIBE', 'queued', 0, 'Initializing', 0, 0, true, '{}'::jsonb),
    (p_tenant_id, 'LOCL', 'queued', 0, 'Initializing', 0, 0, true, '{}'::jsonb),
    (p_tenant_id, 'LINX', 'queued', 0, 'Initializing', 0, 0, true, '{}'::jsonb),
    (p_tenant_id, 'CORE', 'queued', 0, 'Initializing', 0, 0, true, '{}'::jsonb),
    (p_tenant_id, 'REPUTE', 'queued', 0, 'Initializing', 0, 0, true, '{}'::jsonb),
    (p_tenant_id, 'AMPLI', 'queued', 0, 'Initializing', 0, 0, true, '{}'::jsonb),
    (p_tenant_id, 'PRISM', 'queued', 0, 'Initializing', 0, 0, true, '{}'::jsonb),
    (p_tenant_id, 'PULSE', 'queued', 0, 'Initializing', 0, 0, true, '{}'::jsonb)
  ON CONFLICT (tenant_id, agent) DO NOTHING;

  RETURN json_build_object('success', true);
END;
$$;

-- Add unique constraint to prevent duplicate agents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agent_states_tenant_agent_unique'
  ) THEN
    ALTER TABLE agent_states
    ADD CONSTRAINT agent_states_tenant_agent_unique
    UNIQUE (tenant_id, agent);
  END IF;
END $$;

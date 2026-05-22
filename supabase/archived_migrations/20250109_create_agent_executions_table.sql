-- Migration: Create agent_executions table
-- Purpose: Tracks full workflow executions across all agents
-- Sprint: Phase 1 / Sprint 1 - Agent Runtime Foundation

CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
    'retrying'
  )),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  execution_source TEXT NOT NULL DEFAULT 'manual' CHECK (execution_source IN (
    'manual',
    'scheduled',
    'event',
    'webhook',
    'api'
  )),
  initiated_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  total_cost NUMERIC(10, 4) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  inngest_run_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_id ON agent_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_name ON agent_executions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_workflow_type ON agent_executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_agent_executions_started_at ON agent_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_status ON agent_executions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_agent ON agent_executions(tenant_id, agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_executions_inngest_run_id ON agent_executions(inngest_run_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_status_started 
  ON agent_executions(tenant_id, status, started_at DESC);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_agent_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_executions_updated_at
  BEFORE UPDATE ON agent_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_executions_updated_at();

-- RLS policies
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent executions"
  ON agent_executions FOR SELECT
  USING (
    tenant_id::text IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "System can insert agent executions"
  ON agent_executions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update agent executions"
  ON agent_executions FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "System can delete agent executions"
  ON agent_executions FOR DELETE
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE agent_executions IS 'Tracks full workflow executions across all agents';
COMMENT ON COLUMN agent_executions.id IS 'Unique identifier for the execution';
COMMENT ON COLUMN agent_executions.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN agent_executions.agent_name IS 'Name of the agent (e.g., LOCL, ARIA,SCRIBE)';
COMMENT ON COLUMN agent_executions.workflow_type IS 'Type of workflow being executed';
COMMENT ON COLUMN agent_executions.status IS 'Current status of the execution';
COMMENT ON COLUMN agent_executions.started_at IS 'When the execution started';
COMMENT ON COLUMN agent_executions.completed_at IS 'When the execution completed successfully';
COMMENT ON COLUMN agent_executions.failed_at IS 'When the execution failed';
COMMENT ON COLUMN agent_executions.retry_count IS 'Number of retry attempts';
COMMENT ON COLUMN agent_executions.max_retries IS 'Maximum allowed retry attempts';
COMMENT ON COLUMN agent_executions.execution_source IS 'How the execution was triggered';
COMMENT ON COLUMN agent_executions.initiated_by IS 'User or system that initiated the execution';
COMMENT ON COLUMN agent_executions.metadata IS 'Additional execution metadata';
COMMENT ON COLUMN agent_executions.total_cost IS 'Total cost of the execution in USD';
COMMENT ON COLUMN agent_executions.total_tokens IS 'Total tokens consumed during execution';
COMMENT ON COLUMN agent_executions.inngest_run_id IS 'Reference to Inngest run for observability';
COMMENT ON COLUMN agent_executions.error_message IS 'Error message if execution failed';

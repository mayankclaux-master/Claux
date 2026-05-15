-- Migration: Create agent_logs table
-- Purpose: Structured execution logs for debugging and observability
-- Sprint: Phase 1 / Sprint 1 - Agent Runtime Foundation

CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  log_level TEXT NOT NULL CHECK (log_level IN (
    'debug',
    'info',
    'warn',
    'error',
    'fatal'
  )),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_id ON agent_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_task_id ON agent_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_log_level ON agent_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_level ON agent_logs(execution_id, log_level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_created ON agent_logs(execution_id, created_at DESC);

-- Composite index for log queries
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_task_created 
  ON agent_logs(execution_id, task_id, created_at DESC);

-- GIN index for metadata searches
CREATE INDEX IF NOT EXISTS idx_agent_logs_metadata_gin 
  ON agent_logs USING GIN (metadata);

-- Partial index for error logs (most common query)
CREATE INDEX IF NOT EXISTS idx_agent_logs_errors 
  ON agent_logs(execution_id, created_at DESC)
  WHERE log_level IN ('error', 'fatal');

-- RLS policies
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs from their own executions"
  ON agent_logs FOR SELECT
  USING (
    execution_id IN (
      SELECT id FROM agent_executions 
      WHERE tenant_id::text IN (
        SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "System can insert agent logs"
  ON agent_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can delete agent logs"
  ON agent_logs FOR DELETE
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE agent_logs IS 'Structured execution logs for debugging and observability';
COMMENT ON COLUMN agent_logs.id Is 'Unique identifier for the log entry';
COMMENT ON COLUMN agent_logs.execution_id IS 'Reference to parent execution';
COMMENT ON COLUMN agent_logs.task_id IS 'Reference to associated task';
COMMENT ON COLUMN agent_logs.log_level IS 'Log level (debug, info, warn, error, fatal)';
COMMENT ON COLUMN agent_logs.message IS 'Log message';
COMMENT ON COLUMN agent_logs.metadata IS 'Additional metadata';
COMMENT ON COLUMN agent_logs.context IS 'Execution context data';
COMMENT ON COLUMN agent_logs.created_at IS 'When the log was created';

-- Retention Policy: Delete logs older than 90 days
-- This policy runs daily and removes logs older than 90 days
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'clean-agent-logs',
  '0 2 * * *', -- Run daily at 2 AM UTC
  $$
  DELETE FROM agent_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  $$
);

COMMENT ON POLICY "System can delete agent logs" ON agent_logs IS 'Allows system to delete old logs via retention policy';

-- Migration: Create agent_tasks table
-- Purpose: Tracks individual workflow tasks within executions
-- Sprint: Phase 1 / Sprint 1 - Agent Runtime Foundation

CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'skipped',
    'retrying'
  )),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB,
  error_payload JSONB,
  step_order INTEGER NOT NULL,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_id ON agent_tasks(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_task_name ON agent_tasks(task_name);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_task_type ON agent_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_step_order ON agent_tasks(step_order);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_status ON agent_tasks(execution_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_step ON agent_tasks(execution_id, step_order);

-- Composite index for timeline queries
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_started 
  ON agent_tasks(execution_id, started_at);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_agent_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_tasks_updated_at
  BEFORE UPDATE ON agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_tasks_updated_at();

-- RLS policies
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks from their own executions"
  ON agent_tasks FOR SELECT
  USING (
    execution_id IN (
      SELECT id FROM agent_executions 
      WHERE tenant_id::text IN (
        SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "System can insert agent tasks"
  ON agent_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update agent tasks"
  ON agent_tasks FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "System can delete agent tasks"
  ON agent_tasks FOR DELETE
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE agent_tasks IS 'Tracks individual workflow tasks within executions';
COMMENT ON COLUMN agent_tasks.id IS 'Unique identifier for the task';
COMMENT ON COLUMN agent_tasks.execution_id IS 'Reference to parent execution';
COMMENT ON COLUMN agent_tasks.task_name IS 'Name of the task';
COMMENT ON COLUMN agent_tasks.task_type IS 'Type of task (e.g., api_call, data_transform, ai_generation)';
COMMENT ON COLUMN agent_tasks.status IS 'Current status of the task';
COMMENT ON COLUMN agent_tasks.started_at IS 'When the task started';
COMMENT ON COLUMN agent_tasks.completed_at IS 'When the task completed successfully';
COMMENT ON COLUMN agent_tasks.failed_at IS 'When the task failed';
COMMENT ON COLUMN agent_tasks.retry_count IS 'Number of retry attempts';
COMMENT ON COLUMN agent_tasks.max_retries IS 'Maximum allowed retry attempts';
COMMENT ON COLUMN agent_tasks.input_payload IS 'Input data for the task';
COMMENT ON COLUMN agent_tasks.output_payload IS 'Output data from the task';
COMMENT ON COLUMN agent_tasks.error_payload IS 'Error details if task failed';
COMMENT ON COLUMN agent_tasks.step_order IS 'Order of task in workflow';
COMMENT ON COLUMN agent_tasks.duration_ms IS 'Task duration in milliseconds';

-- Retention Policy: Delete tasks older than 180 days
-- This policy runs daily and removes tasks older than 180 days
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'clean-agent-tasks',
  '0 4 * * *', -- Run daily at 4 AM UTC
  $$
  DELETE FROM agent_tasks
  WHERE created_at < NOW() - INTERVAL '180 days'
  $$
);

COMMENT ON POLICY "System can delete agent tasks" ON agent_tasks IS 'Allows system to delete old tasks via retention policy';

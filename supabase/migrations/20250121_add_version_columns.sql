-- Migration: Add version columns for optimistic concurrency
-- Purpose: Add integer-based version columns to canonical runtime tables
-- Sprint: Phase 2 / Sprint 5 - Schema Concurrency Foundation
-- Dependencies: 20250109_create_agent_executions_table.sql
--              20250109_create_agent_tasks_table.sql
--              20250109_create_agent_events_table.sql
--              20250109_create_agent_logs_table.sql

-- Enable migration
BEGIN;

-- Add version column to agent_executions
ALTER TABLE agent_executions 
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN agent_executions.version IS 'Optimistic concurrency version - increments on each update';

-- Add version column to agent_tasks
ALTER TABLE agent_tasks 
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN agent_tasks.version IS 'Optimistic concurrency version - increments on each update';

-- Add version column to agent_events
ALTER TABLE agent_events 
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN agent_events.version IS 'Optimistic concurrency version - increments on each update';

-- Add version column to agent_logs
ALTER TABLE agent_logs 
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN agent_logs.version IS 'Optimistic concurrency version - increments on each update';

-- Update agent_executions trigger to auto-increment version
CREATE OR REPLACE FUNCTION update_agent_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update agent_tasks trigger to auto-increment version
CREATE OR REPLACE FUNCTION update_agent_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update agent_events trigger to auto-increment version
-- Note: agent_events doesn't have an update trigger yet, create one
CREATE OR REPLACE FUNCTION update_agent_events_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_events_version
  BEFORE UPDATE ON agent_events
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_events_version();

-- Update agent_logs trigger to auto-increment version
-- Note: agent_logs doesn't have an update trigger yet, create one
CREATE OR REPLACE FUNCTION update_agent_logs_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_logs_version
  BEFORE UPDATE ON agent_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_logs_version();

-- Add indexes for version-based queries (future optimistic concurrency)
CREATE INDEX IF NOT EXISTS idx_agent_executions_version ON agent_executions(version);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_version ON agent_tasks(version);
CREATE INDEX IF NOT EXISTS idx_agent_events_version ON agent_events(version);
CREATE INDEX IF NOT EXISTS idx_agent_logs_version ON agent_logs(version);

COMMIT;

-- Rollback script
-- BEGIN;
-- DROP TRIGGER IF EXISTS trigger_update_agent_logs_version ON agent_logs;
-- DROP FUNCTION IF EXISTS update_agent_logs_version;
-- DROP TRIGGER IF EXISTS trigger_update_agent_events_version ON agent_events;
-- DROP FUNCTION IF EXISTS update_agent_events_version;
-- CREATE OR REPLACE FUNCTION update_agent_tasks_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
-- CREATE OR REPLACE FUNCTION update_agent_executions_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
-- DROP INDEX IF EXISTS idx_agent_logs_version;
-- DROP INDEX IF EXISTS idx_agent_events_version;
-- DROP INDEX IF EXISTS idx_agent_tasks_version;
-- DROP INDEX IF EXISTS idx_agent_executions_version;
-- ALTER TABLE agent_logs DROP COLUMN IF EXISTS version;
-- ALTER TABLE agent_events DROP COLUMN IF EXISTS version;
-- ALTER TABLE agent_tasks DROP COLUMN IF EXISTS version;
-- ALTER TABLE agent_executions DROP COLUMN IF EXISTS version;
-- COMMIT;

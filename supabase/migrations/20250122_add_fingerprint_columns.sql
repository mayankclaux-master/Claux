-- Migration: Add fingerprint columns for deduplication support
-- Purpose: Add SHA-256-compatible fingerprint columns for deduplication
-- Sprint: Phase 2 / Sprint 5 - Schema Concurrency Foundation
-- Dependencies: 20250109_create_agent_executions_table.sql
--              20250109_create_agent_tasks_table.sql

-- Enable migration
BEGIN;

-- Add fingerprint column to agent_executions for execution deduplication
ALTER TABLE agent_executions 
  ADD COLUMN IF NOT EXISTS fingerprint TEXT;

COMMENT ON COLUMN agent_executions.fingerprint IS 'SHA-256 fingerprint of execution input for deduplication (nullable during migration)';

-- Add fingerprint column to agent_tasks for task deduplication
ALTER TABLE agent_tasks 
  ADD COLUMN IF NOT EXISTS fingerprint TEXT;

COMMENT ON COLUMN agent_tasks.fingerprint IS 'SHA-256 fingerprint of task input for deduplication (nullable during migration)';

-- Add indexes for fingerprint-based deduplication queries
-- Note: These are partial indexes to handle NULL values during migration
CREATE INDEX IF NOT EXISTS idx_agent_executions_fingerprint 
  ON agent_executions(tenant_id, fingerprint) 
  WHERE fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_tasks_fingerprint 
  ON agent_tasks(execution_id, fingerprint) 
  WHERE fingerprint IS NOT NULL;

-- Add unique constraint for tenant-scoped execution deduplication
-- This prevents duplicate executions with the same fingerprint within a tenant
-- Note: Constraint is DEFERRABLE INITIALLY DEFERRED to allow bulk operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uk_agent_executions_tenant_fingerprint'
  ) THEN
    ALTER TABLE agent_executions 
      ADD CONSTRAINT uk_agent_executions_tenant_fingerprint 
      UNIQUE (tenant_id, fingerprint) 
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

COMMENT ON CONSTRAINT uk_agent_executions_tenant_fingerprint ON agent_executions IS 
  'Prevents duplicate executions with same fingerprint within tenant (deferred for bulk operations)';

-- Add unique constraint for execution-scoped task deduplication
-- This prevents duplicate tasks with the same fingerprint within an execution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uk_agent_tasks_execution_fingerprint'
  ) THEN
    ALTER TABLE agent_tasks 
      ADD CONSTRAINT uk_agent_tasks_execution_fingerprint 
      UNIQUE (execution_id, fingerprint) 
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

COMMENT ON CONSTRAINT uk_agent_tasks_execution_fingerprint ON agent_tasks IS 
  'Prevents duplicate tasks with same fingerprint within execution (deferred for bulk operations)';

COMMIT;

-- Rollback script
-- BEGIN;
-- ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS uk_agent_tasks_execution_fingerprint;
-- ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS uk_agent_executions_tenant_fingerprint;
-- DROP INDEX IF EXISTS idx_agent_tasks_fingerprint;
-- DROP INDEX IF EXISTS idx_agent_executions_fingerprint;
-- ALTER TABLE agent_tasks DROP COLUMN IF EXISTS fingerprint;
-- ALTER TABLE agent_executions DROP COLUMN IF EXISTS fingerprint;
-- COMMIT;

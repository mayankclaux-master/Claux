-- Migration: Add unique constraints for runtime integrity
-- Purpose: Add authoritative database-level uniqueness guarantees
-- Sprint: Phase 2 / Sprint 5 - Schema Concurrency Foundation
-- Dependencies: 20250109_create_agent_executions_table.sql
--              20250109_create_agent_tasks_table.sql
--              20250109_create_agent_events_table.sql

-- Enable migration
BEGIN;

-- Add unique constraint for agent_executions to prevent duplicate inngest runs
-- This ensures idempotency for Inngest-triggered executions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uk_agent_executions_inngest_run'
  ) THEN
    ALTER TABLE agent_executions 
      ADD CONSTRAINT uk_agent_executions_inngest_run 
      UNIQUE (tenant_id, inngest_run_id) 
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

COMMENT ON CONSTRAINT uk_agent_executions_inngest_run ON agent_executions IS 
  'Prevents duplicate executions for same Inngest run within tenant (deferred for bulk operations)';

-- Add unique constraint for agent_tasks to prevent duplicate step orders within execution
-- This ensures task ordering integrity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uk_agent_tasks_execution_step'
  ) THEN
    ALTER TABLE agent_tasks 
      ADD CONSTRAINT uk_agent_tasks_execution_step 
      UNIQUE (execution_id, step_order) 
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

COMMENT ON CONSTRAINT uk_agent_tasks_execution_step ON agent_tasks IS 
  'Prevents duplicate step orders within execution (deferred for bulk operations)';

-- Add unique constraint for agent_events to prevent duplicate correlation chains
-- This ensures event correlation integrity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uk_agent_events_correlation_causation'
  ) THEN
    ALTER TABLE agent_events 
      ADD CONSTRAINT uk_agent_events_correlation_causation 
      UNIQUE (correlation_id, causation_id) 
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

COMMENT ON CONSTRAINT uk_agent_events_correlation_causation ON agent_events IS 
  'Prevents duplicate correlation-causation pairs (deferred for bulk operations)';

-- Add index for inngest run id lookups (for idempotency checks)
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_inngest 
  ON agent_executions(tenant_id, inngest_run_id) 
  WHERE inngest_run_id IS NOT NULL;

-- Add index for step order lookups (for task ordering integrity)
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_step 
  ON agent_tasks(execution_id, step_order);

-- Add index for correlation chain lookups (for event correlation integrity)
CREATE INDEX IF NOT EXISTS idx_agent_events_correlation_causation 
  ON agent_events(correlation_id, causation_id)
  WHERE causation_id IS NOT NULL;

COMMIT;

-- Rollback script
-- BEGIN;
-- DROP INDEX IF EXISTS idx_agent_events_correlation_causation;
-- DROP INDEX IF EXISTS idx_agent_tasks_execution_step;
-- DROP INDEX IF EXISTS idx_agent_executions_tenant_inngest;
-- ALTER TABLE agent_events DROP CONSTRAINT IF EXISTS uk_agent_events_correlation_causation;
-- ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS uk_agent_tasks_execution_step;
-- ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS uk_agent_executions_inngest_run;
-- COMMIT;

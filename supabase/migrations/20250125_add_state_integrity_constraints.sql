-- Migration: Add state integrity constraints
-- Purpose: Add database-level state integrity protections
-- Sprint: Phase 2 / Sprint 5 - Schema Concurrency Foundation
-- Dependencies: 20250109_create_agent_executions_table.sql
--              20250109_create_agent_tasks_table.sql

-- Enable migration
BEGIN;

-- Add CHECK constraint to ensure retry_count does not exceed max_retries for agent_executions
-- This prevents invalid retry states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_executions_retry_limit'
  ) THEN
    ALTER TABLE agent_executions 
      ADD CONSTRAINT ck_agent_executions_retry_limit 
      CHECK (retry_count <= max_retries);
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_executions_retry_limit ON agent_executions IS 
  'Ensures retry_count never exceeds max_retries';

-- Add CHECK constraint to ensure retry_count does not exceed max_retries for agent_tasks
-- This prevents invalid retry states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_tasks_retry_limit'
  ) THEN
    ALTER TABLE agent_tasks 
      ADD CONSTRAINT ck_agent_tasks_retry_limit 
      CHECK (retry_count <= max_retries);
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_tasks_retry_limit ON agent_tasks IS 
  'Ensures retry_count never exceeds max_retries';

-- Add CHECK constraint to ensure completed_at is set when status is completed for agent_executions
-- This prevents inconsistent completion states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_executions_completed_timestamp'
  ) THEN
    ALTER TABLE agent_executions 
      ADD CONSTRAINT ck_agent_executions_completed_timestamp 
      CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed')
      );
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_executions_completed_timestamp ON agent_executions IS 
  'Ensures completed_at is set when status is completed';

-- Add CHECK constraint to ensure failed_at is set when status is failed for agent_executions
-- This prevents inconsistent failure states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_executions_failed_timestamp'
  ) THEN
    ALTER TABLE agent_executions 
      ADD CONSTRAINT ck_agent_executions_failed_timestamp 
      CHECK (
        (status = 'failed' AND failed_at IS NOT NULL) OR 
        (status != 'failed')
      );
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_executions_failed_timestamp ON agent_executions IS 
  'Ensures failed_at is set when status is failed';

-- Add CHECK constraint to ensure started_at is set when status is running for agent_executions
-- This prevents inconsistent running states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_executions_started_timestamp'
  ) THEN
    ALTER TABLE agent_executions 
      ADD CONSTRAINT ck_agent_executions_started_timestamp 
      CHECK (
        (status = 'running' AND started_at IS NOT NULL) OR 
        (status != 'running')
      );
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_executions_started_timestamp ON agent_executions IS 
  'Ensures started_at is set when status is running';

-- Add CHECK constraint to ensure completed_at is set when status is completed for agent_tasks
-- This prevents inconsistent completion states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_tasks_completed_timestamp'
  ) THEN
    ALTER TABLE agent_tasks 
      ADD CONSTRAINT ck_agent_tasks_completed_timestamp 
      CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed')
      );
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_tasks_completed_timestamp ON agent_tasks IS 
  'Ensures completed_at is set when status is completed';

-- Add CHECK constraint to ensure failed_at is set when status is failed for agent_tasks
-- This prevents inconsistent failure states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_tasks_failed_timestamp'
  ) THEN
    ALTER TABLE agent_tasks 
      ADD CONSTRAINT ck_agent_tasks_failed_timestamp 
      CHECK (
        (status = 'failed' AND failed_at IS NOT NULL) OR 
        (status != 'failed')
      );
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_tasks_failed_timestamp ON agent_tasks IS 
  'Ensures failed_at is set when status is failed';

-- Add CHECK constraint to ensure started_at is set when status is running for agent_tasks
-- This prevents inconsistent running states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_tasks_started_timestamp'
  ) THEN
    ALTER TABLE agent_tasks 
      ADD CONSTRAINT ck_agent_tasks_started_timestamp 
      CHECK (
        (status = 'running' AND started_at IS NOT NULL) OR 
        (status != 'running')
      );
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_tasks_started_timestamp ON agent_tasks IS 
  'Ensures started_at is set when status is running';

-- Add CHECK constraint to ensure duration_ms is non-negative for agent_tasks
-- This prevents invalid duration values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_tasks_duration_positive'
  ) THEN
    ALTER TABLE agent_tasks 
      ADD CONSTRAINT ck_agent_tasks_duration_positive 
      CHECK (duration_ms IS NULL OR duration_ms >= 0);
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_tasks_duration_positive ON agent_tasks IS 
  'Ensures duration_ms is non-negative';

-- Add CHECK constraint to ensure total_cost is non-negative for agent_executions
-- This prevents invalid cost values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_executions_cost_positive'
  ) THEN
    ALTER TABLE agent_executions 
      ADD CONSTRAINT ck_agent_executions_cost_positive 
      CHECK (total_cost >= 0);
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_executions_cost_positive ON agent_executions IS 
  'Ensures total_cost is non-negative';

-- Add CHECK constraint to ensure total_tokens is non-negative for agent_executions
-- This prevents invalid token values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_agent_executions_tokens_positive'
  ) THEN
    ALTER TABLE agent_executions 
      ADD CONSTRAINT ck_agent_executions_tokens_positive 
      CHECK (total_tokens >= 0);
  END IF;
END $$;

COMMENT ON CONSTRAINT ck_agent_executions_tokens_positive ON agent_executions IS 
  'Ensures total_tokens is non-negative';

COMMIT;

-- Rollback script
-- BEGIN;
-- ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS ck_agent_executions_tokens_positive;
-- ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS ck_agent_executions_cost_positive;
-- ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS ck_agent_tasks_duration_positive;
-- ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS ck_agent_tasks_started_timestamp;
-- ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS ck_agent_tasks_failed_timestamp;
-- ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS ck_agent_tasks_completed_timestamp;
-- ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS ck_agent_executions_started_timestamp;
-- ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS ck_agent_executions_failed_timestamp;
-- ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS ck_agent_executions_completed_timestamp;
-- ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS ck_agent_tasks_retry_limit;
-- ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS ck_agent_executions_retry_limit;
-- COMMIT;

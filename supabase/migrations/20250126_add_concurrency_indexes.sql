-- Migration: Add supporting concurrency indexes
-- Purpose: Add indexes required for future concurrency operations
-- Sprint: Phase 2 / Sprint 5 - Schema Concurrency Foundation
-- Dependencies: 20250109_create_agent_executions_table.sql
--              20250109_create_agent_tasks_table.sql
--              20250109_create_agent_events_table.sql
--              20250109_create_agent_logs_table.sql
--              20250121_add_version_columns.sql
--              20250122_add_fingerprint_columns.sql

-- Enable migration
BEGIN;

-- Add composite index for tenant-scoped execution lookups with version
-- Supports future SELECT FOR UPDATE operations on tenant executions
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_version 
  ON agent_executions(tenant_id, status, version);

-- Add composite index for execution retry coordination
-- Supports future retry coordination lookups
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_retry 
  ON agent_executions(tenant_id, status, retry_count, max_retries)
  WHERE status IN ('failed', 'retrying');

-- Add composite index for task retry coordination
-- Supports future retry coordination lookups
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_retry 
  ON agent_tasks(execution_id, status, retry_count, max_retries)
  WHERE status IN ('failed', 'retrying');

-- Add composite index for tenant-scoped fingerprint lookups
-- Supports future compare-and-swap operations on fingerprints
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_fingerprint_status 
  ON agent_executions(tenant_id, fingerprint, status)
  WHERE fingerprint IS NOT NULL;

-- Add composite index for execution-scoped task fingerprint lookups
-- Supports future compare-and-swap operations on task fingerprints
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_fingerprint_status 
  ON agent_tasks(execution_id, fingerprint, status)
  WHERE fingerprint IS NOT NULL;

-- Add composite index for tenant-scoped execution mutations
-- Supports future SELECT FOR UPDATE operations on tenant executions
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_status_created 
  ON agent_executions(tenant_id, status, created_at DESC);

-- Add composite index for execution-scoped task mutations
-- Supports future SELECT FOR UPDATE operations on execution tasks
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_status_created 
  ON agent_tasks(execution_id, status, created_at DESC);

-- Add composite index for tenant-scoped event streaming
-- Supports future event consistency operations
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_correlation_created 
  ON agent_events(tenant_id, correlation_id, created_at DESC)
  WHERE correlation_id IS NOT NULL;

-- Add composite index for execution-scoped log streaming
-- Supports future log consistency operations
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_level_created 
  ON agent_logs(execution_id, log_level, created_at DESC);

-- Add partial index for running executions (for lock coordination)
-- Supports future advisory lock coordination
CREATE INDEX IF NOT EXISTS idx_agent_executions_running 
  ON agent_executions(tenant_id, agent_name, started_at)
  WHERE status = 'running';

-- Add partial index for running tasks (for lock coordination)
-- Supports future advisory lock coordination
CREATE INDEX IF NOT EXISTS idx_agent_tasks_running 
  ON agent_tasks(execution_id, task_name, started_at)
  WHERE status = 'running';

-- Add partial index for failed executions (for retry coordination)
-- Supports future retry coordination
CREATE INDEX IF NOT EXISTS idx_agent_executions_failed 
  ON agent_executions(tenant_id, agent_name, failed_at)
  WHERE status = 'failed';

-- Add partial index for failed tasks (for retry coordination)
-- Supports future retry coordination
CREATE INDEX IF NOT EXISTS idx_agent_tasks_failed 
  ON agent_tasks(execution_id, task_name, failed_at)
  WHERE status = 'failed';

-- Add composite index for version-based optimistic concurrency
-- Supports future compare-and-swap operations
CREATE INDEX IF NOT EXISTS idx_agent_executions_id_version 
  ON agent_executions(id, version);

-- Add composite index for version-based optimistic concurrency on tasks
-- Supports future compare-and-swap operations
CREATE INDEX IF NOT EXISTS idx_agent_tasks_id_version 
  ON agent_tasks(id, version);

-- Add composite index for version-based optimistic concurrency on events
-- Supports future compare-and-swap operations
CREATE INDEX IF NOT EXISTS idx_agent_events_id_version 
  ON agent_events(id, version);

-- Add composite index for version-based optimistic concurrency on logs
-- Supports future compare-and-swap operations
CREATE INDEX IF NOT EXISTS idx_agent_logs_id_version 
  ON agent_logs(id, version);

COMMIT;

-- Rollback script
-- BEGIN;
-- DROP INDEX IF EXISTS idx_agent_logs_id_version;
-- DROP INDEX IF EXISTS idx_agent_events_id_version;
-- DROP INDEX IF EXISTS idx_agent_tasks_id_version;
-- DROP INDEX IF EXISTS idx_agent_executions_id_version;
-- DROP INDEX IF EXISTS idx_agent_tasks_failed;
-- DROP INDEX IF EXISTS idx_agent_executions_failed;
-- DROP INDEX IF EXISTS idx_agent_tasks_running;
-- DROP INDEX IF EXISTS idx_agent_executions_running;
-- DROP INDEX IF EXISTS idx_agent_logs_execution_level_created;
-- DROP INDEX IF EXISTS idx_agent_events_tenant_correlation_created;
-- DROP INDEX IF EXISTS idx_agent_tasks_execution_status_created;
-- DROP INDEX IF EXISTS idx_agent_executions_tenant_status_created;
-- DROP INDEX IF EXISTS idx_agent_tasks_execution_fingerprint_status;
-- DROP INDEX IF EXISTS idx_agent_executions_tenant_fingerprint_status;
-- DROP INDEX IF EXISTS idx_agent_tasks_execution_retry;
-- DROP INDEX IF EXISTS idx_agent_executions_tenant_retry;
-- DROP INDEX IF EXISTS idx_agent_executions_tenant_version;
-- COMMIT;

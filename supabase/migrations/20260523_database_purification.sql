-- CLAUX Phase 4A — Database Purification and Multitenant Scalability Hardening
-- Purpose: Remove deprecated systems, normalize types, simplify concurrency, add performance indexes
-- Architecture: CLAUX V1 HYBRID (AI intelligence + Human execution)
-- Target Scale: 1000 clients, 100k+ tasks

-- Enable migration
BEGIN;

-- ============================================================
-- PHASE 1: DEPRECATE publish_jobs TABLE
-- ============================================================
-- Reason: Conflicts with V1 architecture (no CMS publishing)
-- Action: Rename to publish_jobs_deprecated

ALTER TABLE IF EXISTS publish_jobs RENAME TO publish_jobs_deprecated;

COMMENT ON TABLE publish_jobs_deprecated IS 'DEPRECATED: Conflicts with V1 architecture. Replaced by Command Centre tasks.';

-- ============================================================
-- PHASE 2: NORMALIZE tenant_id TYPES
-- ============================================================
-- Reason: Command Center tables use UUID, runtime tables use TEXT
-- Action: Convert Command Center tenant_id from UUID to TEXT

-- Convert command_center_tasks tenant_id
ALTER TABLE command_center_tasks 
  ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;

-- Convert task_activity_logs tenant_id
ALTER TABLE task_activity_logs 
  ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;

-- Convert client_keyword_universe tenant_id
ALTER TABLE client_keyword_universe 
  ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;

-- ============================================================
-- PHASE 3: REMOVE OVER-ENGINEERED CONCURRENCY FEATURES
-- ============================================================

-- Remove version columns from runtime tables
ALTER TABLE agent_executions DROP COLUMN IF EXISTS version;
ALTER TABLE agent_tasks DROP COLUMN IF EXISTS version;
ALTER TABLE agent_events DROP COLUMN IF EXISTS version;
ALTER TABLE agent_logs DROP COLUMN IF EXISTS version;

-- Remove fingerprint columns from runtime tables
ALTER TABLE agent_executions DROP COLUMN IF EXISTS fingerprint;
ALTER TABLE agent_tasks DROP COLUMN IF EXISTS fingerprint;

-- Remove fingerprint constraints
ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS uk_agent_executions_tenant_fingerprint;
ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS uk_agent_tasks_execution_fingerprint;

-- Remove fingerprint indexes
DROP INDEX IF EXISTS idx_agent_executions_fingerprint;
DROP INDEX IF EXISTS idx_agent_tasks_fingerprint;

-- ============================================================
-- PHASE 4: REMOVE INNGEST-SPECIFIC CONSTRAINTS
-- ============================================================
-- Reason: Conflicts with V1 architecture (no queue system)
-- Action: Remove Inngest constraint, keep column for backward compatibility

ALTER TABLE agent_executions DROP CONSTRAINT IF EXISTS uk_agent_executions_inngest_run;
DROP INDEX IF EXISTS idx_agent_executions_tenant_inngest;

-- ============================================================
-- PHASE 5: REMOVE ADVISORY LOCK INDEXES
-- ============================================================
-- Reason: Over-engineered for V1 architecture
-- Action: Remove advisory lock indexes

DROP INDEX IF EXISTS idx_agent_executions_running;
DROP INDEX IF EXISTS idx_agent_tasks_running;
DROP INDEX IF EXISTS idx_agent_executions_failed;
DROP INDEX IF EXISTS idx_agent_tasks_failed;

-- ============================================================
-- PHASE 6: REMOVE VERSION-BASED INDEXES
-- ============================================================
-- Reason: Over-engineered for V1 architecture
-- Action: Remove version-based indexes

DROP INDEX IF EXISTS idx_agent_executions_version;
DROP INDEX IF EXISTS idx_agent_tasks_version;
DROP INDEX IF EXISTS idx_agent_events_version;
DROP INDEX IF EXISTS idx_agent_logs_version;
DROP INDEX IF EXISTS idx_agent_executions_id_version;
DROP INDEX IF EXISTS idx_agent_tasks_id_version;
DROP INDEX IF EXISTS idx_agent_events_id_version;
DROP INDEX IF EXISTS idx_agent_logs_id_version;

-- ============================================================
-- PHASE 7: REMOVE EXCESSIVE CONCURRENCY INDEXES
-- ============================================================
-- Reason: Over-engineered for V1 architecture
-- Action: Remove excessive concurrency indexes

DROP INDEX IF EXISTS idx_agent_executions_tenant_version;
DROP INDEX IF EXISTS idx_agent_executions_tenant_retry;
DROP INDEX IF EXISTS idx_agent_tasks_execution_retry;
DROP INDEX IF EXISTS idx_agent_executions_tenant_fingerprint_status;
DROP INDEX IF EXISTS idx_agent_tasks_execution_fingerprint_status;
DROP INDEX IF EXISTS idx_agent_events_tenant_correlation_created;
DROP INDEX IF EXISTS idx_agent_logs_execution_level_created;

-- ============================================================
-- PHASE 8: REMOVE VERSION TRIGGERS
-- ============================================================
-- Reason: Version columns removed, triggers no longer needed
-- Action: Remove version increment triggers

DROP TRIGGER IF EXISTS trigger_update_agent_events_version ON agent_events;
DROP FUNCTION IF EXISTS update_agent_events_version;

DROP TRIGGER IF EXISTS trigger_update_agent_logs_version ON agent_logs;
DROP FUNCTION IF EXISTS update_agent_logs_version;

-- ============================================================
-- PHASE 9: ADD PERFORMANCE INDEXES
-- ============================================================

-- Dashboard query indexes
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_status_created 
  ON agent_executions(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_status_created 
  ON agent_tasks(execution_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_activity_logs_tenant_created 
  ON task_activity_logs(tenant_id, created_at DESC);

-- Command Center query indexes
CREATE INDEX IF NOT EXISTS idx_command_center_tasks_tenant_status_priority 
  ON command_center_tasks(tenant_id, status, priority);

CREATE INDEX IF NOT EXISTS idx_command_center_tasks_tenant_agent_status 
  ON command_center_tasks(tenant_id, agent_name, status);

-- Rankings query indexes
CREATE INDEX IF NOT EXISTS idx_client_keyword_universe_tenant_ranking 
  ON client_keyword_universe(tenant_id, ranking_position);

CREATE INDEX IF NOT EXISTS idx_client_keyword_universe_tenant_opportunity 
  ON client_keyword_universe(tenant_id, opportunity_score DESC);

-- ============================================================
-- PHASE 10: VERIFY RLS POLICIES
-- ============================================================
-- Ensure RLS policies use TEXT tenant_id comparison

-- Command Center tasks RLS
DROP POLICY IF EXISTS "Users can view own tenant tasks" ON command_center_tasks;
CREATE POLICY "Users can view own tenant tasks" ON command_center_tasks
  FOR SELECT USING (tenant_id::TEXT = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can insert own tenant tasks" ON command_center_tasks;
CREATE POLICY "Users can insert own tenant tasks" ON command_center_tasks
  FOR INSERT WITH CHECK (tenant_id::TEXT = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can update own tenant tasks" ON command_center_tasks;
CREATE POLICY "Users can update own tenant tasks" ON command_center_tasks
  FOR UPDATE USING (tenant_id::TEXT = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can delete own tenant tasks" ON command_center_tasks;
CREATE POLICY "Users can delete own tenant tasks" ON command_center_tasks
  FOR DELETE USING (tenant_id::TEXT = auth.jwt() ->> 'sub');

-- Task activity logs RLS
DROP POLICY IF EXISTS "Users can view own tenant activity logs" ON task_activity_logs;
CREATE POLICY "Users can view own tenant activity logs" ON task_activity_logs
  FOR SELECT USING (tenant_id::TEXT = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can insert own tenant activity logs" ON task_activity_logs;
CREATE POLICY "Users can insert own tenant activity logs" ON task_activity_logs
  FOR INSERT WITH CHECK (tenant_id::TEXT = auth.jwt() ->> 'sub');

-- Client keyword universe RLS
DROP POLICY IF EXISTS "Users can view own tenant keywords" ON client_keyword_universe;
CREATE POLICY "Users can view own tenant keywords" ON client_keyword_universe
  FOR SELECT USING (tenant_id::TEXT = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can insert own tenant keywords" ON client_keyword_universe;
CREATE POLICY "Users can insert own tenant keywords" ON client_keyword_universe
  FOR INSERT WITH CHECK (tenant_id::TEXT = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can update own tenant keywords" ON client_keyword_universe;
CREATE POLICY "Users can update own tenant keywords" ON client_keyword_universe
  FOR UPDATE USING (tenant_id::TEXT = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can delete own tenant keywords" ON client_keyword_universe;
CREATE POLICY "Users can delete own tenant keywords" ON client_keyword_universe
  FOR DELETE USING (tenant_id::TEXT = auth.jwt() ->> 'sub');

-- ============================================================
-- PHASE 11: UPDATE COMMENTS
-- ============================================================

COMMENT ON COLUMN command_center_tasks.tenant_id IS 'Tenant identifier (TEXT for consistency with runtime tables)';
COMMENT ON COLUMN task_activity_logs.tenant_id IS 'Tenant identifier (TEXT for consistency with runtime tables)';
COMMENT ON COLUMN client_keyword_universe.tenant_id IS 'Tenant identifier (TEXT for consistency with runtime tables)';

COMMENT ON TABLE agent_executions IS 'Canonical agent execution records (V1 simplified - no version/fingerprint)';
COMMENT ON TABLE agent_tasks IS 'Agent task execution records within executions (V1 simplified - no version/fingerprint)';
COMMENT ON TABLE agent_events IS 'Agent event correlation and causation tracking (V1 simplified - no version)';
COMMENT ON TABLE agent_logs IS 'Agent execution log entries (V1 simplified - no version)';

COMMIT;

-- ============================================================
-- ROLLBACK SCRIPT
-- ============================================================
-- BEGIN;
-- 
-- -- Restore publish_jobs
-- ALTER TABLE IF EXISTS publish_jobs_deprecated RENAME TO publish_jobs;
-- 
-- -- Restore tenant_id types
-- ALTER TABLE command_center_tasks ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID;
-- ALTER TABLE task_activity_logs ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID;
-- ALTER TABLE client_keyword_universe ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID;
-- 
-- -- Restore version columns
-- ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
-- ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
-- ALTER TABLE agent_events ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
-- ALTER TABLE agent_logs ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
-- 
-- -- Restore fingerprint columns
-- ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS fingerprint TEXT;
-- ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS fingerprint TEXT;
-- 
-- -- Restore fingerprint constraints
-- ALTER TABLE agent_executions ADD CONSTRAINT uk_agent_executions_tenant_fingerprint UNIQUE (tenant_id, fingerprint) DEFERRABLE INITIALLY DEFERRED;
-- ALTER TABLE agent_tasks ADD CONSTRAINT uk_agent_tasks_execution_fingerprint UNIQUE (execution_id, fingerprint) DEFERRABLE INITIALLY DEFERRED;
-- 
-- -- Restore fingerprint indexes
-- CREATE INDEX IF NOT EXISTS idx_agent_executions_fingerprint ON agent_executions(tenant_id, fingerprint) WHERE fingerprint IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_agent_tasks_fingerprint ON agent_tasks(execution_id, fingerprint) WHERE fingerprint IS NOT NULL;
-- 
-- -- Restore Inngest constraint
-- ALTER TABLE agent_executions ADD CONSTRAINT uk_agent_executions_inngest_run UNIQUE (tenant_id, inngest_run_id) DEFERRABLE INITIALLY DEFERRED;
-- CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_inngest ON agent_executions(tenant_id, inngest_run_id) WHERE inngest_run_id IS NOT NULL;
-- 
-- -- Restore advisory lock indexes
-- CREATE INDEX IF NOT EXISTS idx_agent_executions_running ON agent_executions(tenant_id, agent_name, started_at) WHERE status = 'running';
-- CREATE INDEX IF NOT EXISTS idx_agent_tasks_running ON agent_tasks(execution_id, task_name, started_at) WHERE status = 'running';
-- CREATE INDEX IF NOT EXISTS idx_agent_executions_failed ON agent_executions(tenant_id, agent_name, failed_at) WHERE status = 'failed';
-- CREATE INDEX IF NOT EXISTS idx_agent_tasks_failed ON agent_tasks(execution_id, task_name, failed_at) WHERE status = 'failed';
-- 
-- -- Restore version-based indexes
-- CREATE INDEX IF NOT EXISTS idx_agent_executions_version ON agent_executions(version);
-- CREATE INDEX IF NOT EXISTS idx_agent_tasks_version ON agent_tasks(version);
-- CREATE INDEX IF NOT EXISTS idx_agent_events_version ON agent_events(version);
-- CREATE INDEX IF NOT EXISTS idx_agent_logs_version ON agent_logs(version);
-- CREATE INDEX IF NOT EXISTS idx_agent_executions_id_version ON agent_executions(id, version);
-- CREATE INDEX IF NOT EXISTS idx_agent_tasks_id_version ON agent_tasks(id, version);
-- CREATE INDEX IF NOT EXISTS idx_agent_events_id_version ON agent_events(id, version);
-- CREATE INDEX IF NOT EXISTS idx_agent_logs_id_version ON agent_logs(id, version);
-- 
-- -- Restore excessive concurrency indexes
-- CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_version ON agent_executions(tenant_id, status, version);
-- CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_retry ON agent_executions(tenant_id, status, retry_count, max_retries) WHERE status IN ('failed', 'retrying');
-- CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_retry ON agent_tasks(execution_id, status, retry_count, max_retries) WHERE status IN ('failed', 'retrying');
-- CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_fingerprint_status ON agent_executions(tenant_id, fingerprint, status) WHERE fingerprint IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_fingerprint_status ON agent_tasks(execution_id, fingerprint, status) WHERE fingerprint IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_correlation_created ON agent_events(tenant_id, correlation_id, created_at DESC) WHERE correlation_id IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_level_created ON agent_logs(execution_id, log_level, created_at DESC);
-- 
-- -- Restore version triggers
-- CREATE OR REPLACE FUNCTION update_agent_events_version() RETURNS TRIGGER AS $$ BEGIN NEW.version = OLD.version + 1; RETURN NEW; END; $$ LANGUAGE plpgsql;
-- CREATE TRIGGER trigger_update_agent_events_version BEFORE UPDATE ON agent_events FOR EACH ROW EXECUTE FUNCTION update_agent_events_version();
-- CREATE OR REPLACE FUNCTION update_agent_logs_version() RETURNS TRIGGER AS $$ BEGIN NEW.version = OLD.version + 1; RETURN NEW; END; $$ LANGUAGE plpgsql;
-- CREATE TRIGGER trigger_update_agent_logs_version BEFORE UPDATE ON agent_logs FOR EACH ROW EXECUTE FUNCTION update_agent_logs_version();
-- 
-- -- Remove performance indexes
-- DROP INDEX IF EXISTS idx_agent_executions_tenant_status_created;
-- DROP INDEX IF EXISTS idx_agent_tasks_execution_status_created;
-- DROP INDEX IF EXISTS idx_task_activity_logs_tenant_created;
-- DROP INDEX IF EXISTS idx_command_center_tasks_tenant_status_priority;
-- DROP INDEX IF EXISTS idx_command_center_tasks_tenant_agent_status;
-- DROP INDEX IF EXISTS idx_client_keyword_universe_tenant_ranking;
-- DROP INDEX IF EXISTS idx_client_keyword_universe_tenant_opportunity;
-- 
-- -- Restore RLS policies
-- DROP POLICY IF EXISTS "Users can view own tenant tasks" ON command_center_tasks;
-- CREATE POLICY "Users can view own tenant tasks" ON command_center_tasks FOR SELECT USING (tenant_id = auth.jwt() ->> 'sub');
-- DROP POLICY IF EXISTS "Users can insert own tenant tasks" ON command_center_tasks;
-- CREATE POLICY "Users can insert own tenant tasks" ON command_center_tasks FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'sub');
-- DROP POLICY IF EXISTS "Users can update own tenant tasks" ON command_center_tasks;
-- CREATE POLICY "Users can update own tenant tasks" ON command_center_tasks FOR UPDATE USING (tenant_id = auth.jwt() ->> 'sub');
-- DROP POLICY IF EXISTS "Users can delete own tenant tasks" ON command_center_tasks;
-- CREATE POLICY "Users can delete own tenant tasks" ON command_center_tasks FOR DELETE USING (tenant_id = auth.jwt() ->> 'sub');
-- 
-- DROP POLICY IF EXISTS "Users can view own tenant activity logs" ON task_activity_logs;
-- CREATE POLICY "Users can view own tenant activity logs" ON task_activity_logs FOR SELECT USING (tenant_id = auth.jwt() ->> 'sub');
-- DROP POLICY IF EXISTS "Users can insert own tenant activity logs" ON task_activity_logs;
-- CREATE POLICY "Users can insert own tenant activity logs" ON task_activity_logs FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'sub');
-- 
-- DROP POLICY IF EXISTS "Users can view own tenant keywords" ON client_keyword_universe;
-- CREATE POLICY "Users can view own tenant keywords" ON client_keyword_universe FOR SELECT USING (tenant_id = auth.jwt() ->> 'sub');
-- DROP POLICY IF EXISTS "Users can insert own tenant keywords" ON client_keyword_universe;
-- CREATE POLICY "Users can insert own tenant keywords" ON client_keyword_universe FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'sub');
-- DROP POLICY IF EXISTS "Users can update own tenant keywords" ON client_keyword_universe;
-- CREATE POLICY "Users can update own tenant keywords" ON client_keyword_universe FOR UPDATE USING (tenant_id = auth.jwt() ->> 'sub');
-- DROP POLICY IF EXISTS "Users can delete own tenant keywords" ON client_keyword_universe;
-- CREATE POLICY "Users can delete own tenant keywords" ON client_keyword_universe FOR DELETE USING (tenant_id = auth.jwt() ->> 'sub');
-- 
-- COMMIT;

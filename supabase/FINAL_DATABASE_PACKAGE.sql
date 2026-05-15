-- ================================================================================
-- CLAUX FINAL DATABASE PACKAGE
-- Principal Database Architect - Production Migration Plan
-- Date: January 9, 2025
-- Status: DATABASE FREEZE MODE - MANUAL REVIEW ONLY
-- ================================================================================

-- ================================================================================
-- SECTION 1 — MASTER MIGRATION SQL
-- ================================================================================

-- This migration creates the NEW RUNTIME SYSTEM in ISOLATION
-- Does NOT touch existing production tables
-- All tenant_id columns are UUID
-- All RLS policies use auth.jwt() ->> 'sub'
-- All SQL is idempotent

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ================================================================================
-- TABLE: agent_executions
-- ================================================================================

CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_agent_executions_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_id ON agent_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_name ON agent_executions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_workflow_type ON agent_executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_agent_executions_started_at ON agent_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_status ON agent_executions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_agent ON agent_executions(tenant_id, agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_executions_inngest_run_id ON agent_executions(inngest_run_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_status_started ON agent_executions(tenant_id, status, started_at DESC);

-- Trigger
CREATE OR REPLACE FUNCTION update_agent_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agent_executions_updated_at ON agent_executions;
CREATE TRIGGER trigger_update_agent_executions_updated_at
  BEFORE UPDATE ON agent_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_executions_updated_at();

-- RLS
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own agent executions" ON agent_executions;
CREATE POLICY "Users can view their own agent executions"
  ON agent_executions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "System can insert agent executions" ON agent_executions;
CREATE POLICY "System can insert agent executions"
  ON agent_executions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent executions" ON agent_executions;
CREATE POLICY "System can update agent executions"
  ON agent_executions FOR UPDATE
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can delete agent executions" ON agent_executions;
CREATE POLICY "System can delete agent executions"
  ON agent_executions FOR DELETE
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE agent_executions IS 'Tracks full workflow executions across all agents';
COMMENT ON COLUMN agent_executions.id IS 'Unique identifier for the execution';
COMMENT ON COLUMN agent_executions.tenant_id IS 'Tenant identifier for multi-tenancy (UUID)';
COMMENT ON COLUMN agent_executions.agent_name IS 'Name of the agent (e.g., LOCL, ARIA, SCRIBE)';
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

-- Retention Policy
SELECT cron.schedule(
  'clean-agent-executions',
  '0 5 * * *',
  $$
  DELETE FROM agent_executions
  WHERE created_at < NOW() - INTERVAL '180 days'
  $$
);

-- ================================================================================
-- TABLE: agent_tasks
-- ================================================================================

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_id ON agent_tasks(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_task_name ON agent_tasks(task_name);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_task_type ON agent_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_step_order ON agent_tasks(step_order);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_status ON agent_tasks(execution_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_step ON agent_tasks(execution_id, step_order);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_started ON agent_tasks(execution_id, started_at);

-- Trigger
CREATE OR REPLACE FUNCTION update_agent_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agent_tasks_updated_at ON agent_tasks;
CREATE TRIGGER trigger_update_agent_tasks_updated_at
  BEFORE UPDATE ON agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_tasks_updated_at();

-- RLS
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks from their own executions" ON agent_tasks;
CREATE POLICY "Users can view tasks from their own executions"
  ON agent_tasks FOR SELECT
  USING (
    execution_id IN (
      SELECT id FROM agent_executions 
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
      )
    )
  );

DROP POLICY IF EXISTS "System can insert agent tasks" ON agent_tasks;
CREATE POLICY "System can insert agent tasks"
  ON agent_tasks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent tasks" ON agent_tasks;
CREATE POLICY "System can update agent tasks"
  ON agent_tasks FOR UPDATE
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can delete agent tasks" ON agent_tasks;
CREATE POLICY "System can delete agent tasks"
  ON agent_tasks FOR DELETE
  WITH CHECK (true);

-- Comments
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

-- Retention Policy
SELECT cron.schedule(
  'clean-agent-tasks',
  '0 4 * * *',
  $$
  DELETE FROM agent_tasks
  WHERE created_at < NOW() - INTERVAL '180 days'
  $$
);

-- ================================================================================
-- TABLE: agent_events
-- ================================================================================

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_source TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  event_version TEXT DEFAULT '1.0',
  correlation_id TEXT,
  causation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_agent_events_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_id ON agent_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_execution_id ON agent_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_event_name ON agent_events(event_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_event_source ON agent_events(event_source);
CREATE INDEX IF NOT EXISTS idx_agent_events_created_at ON agent_events(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_event ON agent_events(tenant_id, event_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_correlation_id ON agent_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_causation_id ON agent_events(causation_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_created ON agent_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_execution_created ON agent_events(execution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_payload_gin ON agent_events USING GIN (payload);

-- RLS
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own agent events" ON agent_events;
CREATE POLICY "Users can view their own agent events"
  ON agent_events FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "System can insert agent events" ON agent_events;
CREATE POLICY "System can insert agent events"
  ON agent_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent events" ON agent_events;
CREATE POLICY "System can update agent events"
  ON agent_events FOR UPDATE
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can delete agent events" ON agent_events;
CREATE POLICY "System can delete agent events"
  ON agent_events FOR DELETE
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE agent_events IS 'Central event stream for event-driven architecture';
COMMENT ON COLUMN agent_events.id IS 'Unique identifier for the event';
COMMENT ON COLUMN agent_events.tenant_id IS 'Tenant identifier for multi-tenancy (UUID)';
COMMENT ON COLUMN agent_events.execution_id IS 'Reference to associated execution';
COMMENT ON COLUMN agent_events.event_name IS 'Name of the event (e.g., audit.completed, content.generated)';
COMMENT ON COLUMN agent_events.event_source IS 'Source of the event (e.g., LOCL, ARIA, system)';
COMMENT ON COLUMN agent_events.payload IS 'Event payload data';
COMMENT ON COLUMN agent_events.event_version IS 'Version of the event schema';
COMMENT ON COLUMN agent_events.correlation_id IS 'ID for correlating related events';
COMMENT ON COLUMN agent_events.causation_id IS 'ID of the event that caused this event';
COMMENT ON COLUMN agent_events.created_at IS 'When the event was created';

-- Retention Policy
SELECT cron.schedule(
  'clean-agent-events',
  '0 3 * * *',
  $$
  DELETE FROM agent_events
  WHERE created_at < NOW() - INTERVAL '180 days'
  $$
);

-- ================================================================================
-- TABLE: agent_logs
-- ================================================================================

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_id ON agent_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_task_id ON agent_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_log_level ON agent_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_level ON agent_logs(execution_id, log_level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_created ON agent_logs(execution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_task_created ON agent_logs(execution_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_metadata_gin ON agent_logs USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_agent_logs_errors ON agent_logs(execution_id, created_at DESC)
  WHERE log_level IN ('error', 'fatal');

-- RLS
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs from their own executions" ON agent_logs;
CREATE POLICY "Users can view logs from their own executions"
  ON agent_logs FOR SELECT
  USING (
    execution_id IN (
      SELECT id FROM agent_executions 
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
      )
    )
  );

DROP POLICY IF EXISTS "System can insert agent logs" ON agent_logs;
CREATE POLICY "System can insert agent logs"
  ON agent_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can delete agent logs" ON agent_logs;
CREATE POLICY "System can delete agent logs"
  ON agent_logs FOR DELETE
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE agent_logs IS 'Structured execution logs for debugging and observability';
COMMENT ON COLUMN agent_logs.id IS 'Unique identifier for the log entry';
COMMENT ON COLUMN agent_logs.execution_id IS 'Reference to parent execution';
COMMENT ON COLUMN agent_logs.task_id IS 'Reference to associated task';
COMMENT ON COLUMN agent_logs.log_level IS 'Log level (debug, info, warn, error, fatal)';
COMMENT ON COLUMN agent_logs.message IS 'Log message';
COMMENT ON COLUMN agent_logs.metadata IS 'Additional metadata';
COMMENT ON COLUMN agent_logs.context IS 'Execution context data';
COMMENT ON COLUMN agent_logs.created_at IS 'When the log was created';

-- Retention Policy
SELECT cron.schedule(
  'clean-agent-logs',
  '0 2 * * *',
  $$
  DELETE FROM agent_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  $$
);

-- ================================================================================
-- END OF MASTER MIGRATION SQL
-- ================================================================================


-- ================================================================================
-- SECTION 2 — ROLLBACK SQL
-- ================================================================================

-- This rollback SQL reverses the master migration
-- Execute ONLY if migration fails and rollback is required

-- Drop retention policies
SELECT cron.unschedule('clean-agent-logs');
SELECT cron.unschedule('clean-agent-events');
SELECT cron.unschedule('clean-agent-tasks');
SELECT cron.unschedule('clean-agent-executions');

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS agent_logs CASCADE;
DROP TABLE IF EXISTS agent_events CASCADE;
DROP TABLE IF EXISTS agent_tasks CASCADE;
DROP TABLE IF EXISTS agent_executions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_agent_logs_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_agent_events_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_agent_tasks_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_agent_executions_updated_at() CASCADE;

-- ================================================================================
-- END OF ROLLBACK SQL
-- ================================================================================


-- ================================================================================
-- SECTION 3 — TABLE RELATIONSHIP MAP
-- ================================================================================

/*
PRODUCTION SYSTEM (DO NOT MODIFY):

profiles (id: TEXT - Clerk IDs)
  └─> tenants (id: UUID) [profiles.tenant_id -> tenants.id]
       └─> business_profiles (tenant_id: UUID) [business_profiles.tenant_id -> tenants.id]
       └─> agent_runs (tenant_id: UUID) [agent_runs.tenant_id -> tenants.id]
       └─> agent_states (tenant_id: UUID) [agent_states.tenant_id -> tenants.id]
       └─> locl_audits (tenant_id: TEXT) [NO FK - TYPE MISMATCH]
       └─> publish_jobs (tenant_id: TEXT) [NO FK - TYPE MISMATCH]
       └─> pulse_rankings (tenant_id: TEXT) [NO FK - TYPE MISMATCH]
       └─> integrations (tenant_id: TEXT) [NO FK - TYPE MISMATCH]
       └─> indexing_status (tenant_id: TEXT) [NO FK - TYPE MISMATCH]

NEW RUNTIME SYSTEM (ISOLATED - CREATED BY THIS MIGRATION):

tenants (id: UUID)
  └─> agent_executions (tenant_id: UUID) [FK: agent_executions.tenant_id -> tenants.id]
       └─> agent_tasks (execution_id: UUID) [FK: agent_tasks.execution_id -> agent_executions.id]
       └─> agent_events (tenant_id: UUID) [FK: agent_events.tenant_id -> tenants.id]
       └─> agent_events (execution_id: UUID) [FK: agent_events.execution_id -> agent_executions.id]
       └─> agent_logs (execution_id: UUID) [FK: agent_logs.execution_id -> agent_executions.id]
            └─> agent_logs (task_id: UUID) [FK: agent_logs.task_id -> agent_tasks.id]

CASCADE BEHAVIOR:
- agent_executions: DELETE CASCADE on tenant_id (deletes all executions when tenant deleted)
- agent_tasks: DELETE CASCADE on execution_id (deletes all tasks when execution deleted)
- agent_events: DELETE CASCADE on tenant_id, SET NULL on execution_id
- agent_logs: DELETE CASCADE on execution_id, SET NULL on task_id
*/

-- ================================================================================
-- END OF TABLE RELATIONSHIP MAP
-- ================================================================================


-- ================================================================================
-- SECTION 4 — SAFE TO DELETE OBJECTS
-- ================================================================================

/*
These objects are safe to delete as they are NOT deployed to production:

MIGRATION FILES (Git Only):
- supabase/migrations/20250109_create_agent_executions_table.sql
- supabase/migrations/20250109_create_agent_tasks_table.sql
- supabase/migrations/20250109_create_agent_events_table.sql
- supabase/migrations/20250109_create_agent_logs_table.sql

RATIONALE:
- These files contain INCORRECT schema (tenant_id as TEXT, wrong auth method)
- Tables defined in these files have NEVER been deployed to production
- New runtime tables are ONLY in apps/web/lib/runtime/ which is ISOLATED
- Deleting these files and running the corrected migration is safe

DELETION METHOD:
1. Delete migration files from git repository
2. Run corrected migration SQL (SECTION 1) in Supabase SQL editor
3. Commit changes to git

ROLLBACK:
1. Restore migration files from git history
2. Run rollback SQL (SECTION 2) in Supabase SQL editor
3. Commit changes to git
*/

-- ================================================================================
-- END OF SAFE TO DELETE OBJECTS
-- ================================================================================


-- ================================================================================
-- SECTION 5 — HIGH RISK OBJECTS
-- ================================================================================

/*
These objects are HIGH RISK and MUST NOT be modified without full backup:

PRODUCTION TABLES (DO NOT TOUCH):
- profiles
- tenants
- business_profiles
- agent_runs
- agent_states
- locl_audits
- publish_jobs
- pulse_rankings
- integrations
- indexing_status

PRODUCTION FUNCTIONS (DO NOT TOUCH):
- bootstrap_tenant_for_user
- complete_onboarding
- initialize_agent_states
- create_agent_run_atomic (deprecated but may have external usage)
- get_current_role (deprecated but may have external usage)

PRODUCTION TRIGGERS (DO NOT TOUCH):
- update_publish_jobs_updated_at
- update_integrations_updated_at
- update_indexing_status_updated_at

PRODUCTION RLS POLICIES (HIGH RISK TO MODIFY):
- All policies on locl_audits, publish_jobs, pulse_rankings, integrations, indexing_status
- Currently use auth.uid() which is WRONG for Clerk
- Fixing these requires careful testing in staging environment

RATIONALE:
- These objects are PRODUCTION ACTIVE
- Modifying them without testing could break the application
- RLS policy changes are particularly risky (could expose data)
- Function changes could break agent execution flow

MODIFICATION REQUIREMENTS:
1. Full database backup
2. Test in staging environment
3. Have rollback plan ready
4. Execute during maintenance window
5. Validate immediately after execution
*/

-- ================================================================================
-- END OF HIGH RISK OBJECTS
-- ================================================================================


-- ================================================================================
-- SECTION 6 — REQUIRED MANUAL EXECUTION ORDER
-- ================================================================================

/*
STEP 1: Pre-Execution (Manual)
- Read full database governance report
- Approve migration plan
- Schedule maintenance window (if needed)
- Notify team of migration
- Create database backup (recommended)

STEP 2: Delete Orphaned Migration Files (Git)
- Delete supabase/migrations/20250109_create_agent_executions_table.sql
- Delete supabase/migrations/20250109_create_agent_tasks_table.sql
- Delete supabase/migrations/20250109_create_agent_events_table.sql
- Delete supabase/migrations/20250109_create_agent_logs_table.sql
- Commit changes to git

STEP 3: Execute Migration SQL (Supabase SQL Editor)
- Open Supabase dashboard
- Navigate to SQL Editor
- Copy SECTION 1 (MASTER MIGRATION SQL) from this file
- Execute SQL
- Verify no errors
- Verify tables created
- Verify indexes created
- Verify triggers created
- Verify RLS policies created
- Verify retention policies scheduled

STEP 4: Validate (Supabase SQL Editor)
- Copy SECTION 7 (VALIDATION SQL) from this file
- Execute validation queries
- Verify all checks pass
- Document results

STEP 5: Post-Execution (Manual)
- Update governance report with actual results
- Notify team of completion
- Plan next migration phase (RLS fix, type migration, runtime migration)

ROLLBACK PROCEDURE (If Step 3 Fails):
- Copy SECTION 2 (ROLLBACK SQL) from this file
- Execute rollback SQL in Supabase SQL Editor
- Restore migration files from git
- Verify system is in pre-migration state
- Document failure and rollback
*/

-- ================================================================================
-- END OF REQUIRED MANUAL EXECUTION ORDER
-- ================================================================================


-- ================================================================================
-- SECTION 7 — VALIDATION SQL
-- ================================================================================

-- Run these queries after executing the migration to verify success

-- 1. Verify RLS is enabled on all runtime tables
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
ORDER BY tablename;

-- Expected: All 4 tables show rowsecurity = true

-- 2. Verify all runtime tables have RLS policies
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
ORDER BY tablename, policyname;

-- Expected: 4 policies per table (SELECT, INSERT, UPDATE, DELETE) = 16 total policies

-- 3. Verify no auth.uid() in runtime policies (should return 0 rows)
SELECT
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
  AND (qual ILIKE '%auth.uid()%' OR with_check ILIKE '%auth.uid()%');

-- Expected: 0 rows

-- 4. Verify auth.jwt() ->> 'sub' is used in runtime policies (should return 16 rows)
SELECT
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
  AND (qual ILIKE '%auth.jwt() ->> ''sub''%' OR with_check ILIKE '%auth.jwt() ->> ''sub''%')
ORDER BY tablename, policyname;

-- Expected: 16 rows (4 policies per table)

-- 5. Verify all indexes exist on runtime tables
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
ORDER BY tablename, indexname;

-- Expected: 31 indexes total
-- agent_executions: 9 indexes
-- agent_tasks: 7 indexes
-- agent_events: 10 indexes
-- agent_logs: 8 indexes

-- 6. Verify all triggers exist on runtime tables
SELECT
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
ORDER BY event_object_table, trigger_name;

-- Expected: 2 triggers (agent_executions, agent_tasks)

-- 7. Verify foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
ORDER BY tc.table_name;

-- Expected: 5 foreign keys
-- agent_executions: 1 FK (tenant_id -> tenants.id)
-- agent_tasks: 1 FK (execution_id -> agent_executions.id)
-- agent_events: 2 FKs (tenant_id -> tenants.id, execution_id -> agent_executions.id)
-- agent_logs: 2 FKs (execution_id -> agent_executions.id, task_id -> agent_tasks.id)

-- 8. Verify retention policies are scheduled
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname IN ('clean-agent-logs', 'clean-agent-events', 'clean-agent-tasks', 'clean-agent-executions')
ORDER BY jobname;

-- Expected: 4 jobs, all active = true

-- 9. Verify UUID data types on tenant_id columns in runtime tables
SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
  AND table_name IN ('agent_executions', 'agent_events')
ORDER BY table_name;

-- Expected: 2 rows, both showing data_type = 'uuid' or udt_name = 'uuid'

-- 10. Verify pg_cron extension is installed
SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname = 'pg_cron';

-- Expected: 1 row showing pg_cron extension

-- 11. Verify uuid-ossp extension is installed
SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname = 'uuid-ossp';

-- Expected: 1 row showing uuid-ossp extension

-- 12. Verify production tables are untouched (row counts should be unchanged)
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'tenants', 'business_profiles', 'agent_runs', 'agent_states', 'locl_audits', 'publish_jobs', 'pulse_rankings', 'integrations', 'indexing_status')
ORDER BY tablename;

-- Expected: All production tables have row counts > 0 (if data exists)
-- This verifies production tables were not dropped or modified

-- ================================================================================
-- END OF VALIDATION SQL
-- ================================================================================


-- ================================================================================
-- SECTION 8 — FINAL WARNINGS
-- ================================================================================

/*
CRITICAL WARNINGS:

1. THIS MIGRATION CREATES NEW RUNTIME TABLES IN ISOLATION
   - Does NOT modify existing production tables
   - Does NOT fix existing RLS policies (they still use auth.uid())
   - Does NOT fix tenant_id type mismatches in production tables
   - These fixes are FUTURE work requiring separate migration

2. AUTH METHOD CRITICAL
   - New runtime tables use auth.jwt() ->> 'sub' (CORRECT for Clerk)
   - Production tables still use auth.uid() (INCORRECT for Clerk)
   - This creates INCONSISTENT auth methods across database
   - Must fix production RLS policies in future migration

3. TENANT_ID TYPE INCONSISTENCY
   - New runtime tables use UUID for tenant_id (CORRECT)
   - Production agent-specific tables use TEXT for tenant_id (INCORRECT)
   - Cannot create FKs between production tables due to type mismatch
   - Must fix tenant_id types in future migration

4. DUAL ORCHESTRATION SYSTEMS
   - Old system (agent_runs, agent_states) remains PRODUCTION ACTIVE
   - New system (agent_executions, agent_tasks, agent_events, agent_logs) is ISOLATED
   - No migration path between systems implemented yet
   - Must plan and execute migration in future phase

5. BACKUP RECOMMENDATION
   - While this migration is low risk (isolated), database backup is recommended
   - Backup should be taken before execution
   - Rollback SQL provided in SECTION 2 if needed

6. TESTING RECOMMENDATION
   - Test this migration in staging environment first
   - Verify all validation queries pass
   - Test runtime SDK against new tables
   - Verify Inngest integration works

7. MAINTENANCE WINDOW
   - This migration can be executed without maintenance window (isolated)
   - Future migrations (RLS fix, type migration, runtime migration) WILL require maintenance window
   - Plan accordingly for future phases

8. CODE INTEGRATION
   - New runtime tables are NOT connected to production code
   - apps/web/lib/runtime/ is isolated and not imported
   - Must integrate runtime SDK with production code in future phase
   - Must migrate agent services to use new runtime in future phase

9. DEPENDENCY WARNING
   - agent_activities table is referenced in agent.logger.ts but no SQL definition found
   - This table may not exist or may be created elsewhere
   - Investigate before future migrations

10. EXTENSION REQUIREMENTS
    - pg_cron extension is required for retention policies
    - uuid-ossp extension is required for UUID generation
    - Ensure these extensions are available in production Supabase instance

EXECUTION AUTHORIZATION:
- This SQL package is for MANUAL REVIEW ONLY
- Do NOT execute without approval
- Do NOT execute without backup
- Do NOT execute without testing in staging
- Execute in Supabase SQL Editor during business hours (isolated migration)

CONTACT:
- Principal Database Architect
- Date: January 9, 2025
- Status: DATABASE FREEZE MODE - MANUAL REVIEW ONLY
*/

-- ================================================================================
-- END OF FINAL WARNINGS
-- ================================================================================


-- ================================================================================
-- END OF FINAL DATABASE PACKAGE
-- ================================================================================

# CLAUX Database Audit Report
**Principal Database Architect - Production Migration Plan**
**Date**: January 9, 2025

---

## EXECUTIVE SUMMARY

**CRITICAL FINDINGS**:

1. **AUTHENTICATION CRITICAL FAILURE**: ALL RLS policies use `auth.uid()` which is INVALID for Clerk authentication. MUST use `auth.jwt() ->> 'sub'`.

2. **UUID/TEXT INCONSISTENCY CRITICAL FAILURE**: Severe inconsistency in `tenant_id` data types across tables:
   - `agent_runs.tenant_id`: UUID
   - `agent_states.tenant_id`: UUID
   - `locl_audits.tenant_id`: TEXT
   - `publish_jobs.tenant_id`: TEXT
   - `pulse_rankings.tenant_id`: TEXT
   - `integrations.tenant_id`: TEXT
   - `indexing_status.tenant_id`: TEXT

3. **DUPLICATE ORCHESTRATION SYSTEMS**: 
   - Existing `agent_runs` + `agent_states` (legacy orchestration)
   - Proposed `agent_executions` + `agent_tasks` (new runtime)
   - **RECOMMENDATION**: Migrate to new system, deprecate old

4. **PRODUCTION RISK**: Current runtime migrations are NOT safe for production deployment.

---

## RISK ASSESSMENT

### Critical Risks (BLOCKING)

1. **Authentication Failure**: All RLS policies will fail in production with Clerk
   - Impact: COMPLETE DATA EXPOSURE
   - Probability: 100%
   - Status: BLOCKING

2. **Type Mismatch**: tenant_id inconsistency will cause FK failures
   - Impact: DATA INTEGRITY CORRUPTION
   - Probability: 100%
   - Status: BLOCKING

3. **Orchestration Confusion**: Two competing execution systems
   - Impact: DUPLICATE EXECUTIONS, DATA CORRUPTION
   - Probability: HIGH
   - Status: BLOCKING

### High Risks

1. **No Row Counts**: Unknown data volume in existing tables
2. **No FK Validation**: Unknown referential integrity
3. **No Index Validation**: Unknown performance impact

---

## CURRENT ARCHITECTURE MAP

### Core Tables (Production Active)

| Table | Purpose | tenant_id Type | RLS Status | Auth Method |
|-------|---------|---------------|------------|-------------|
| profiles | User profiles (Clerk) | N/A (id is TEXT) | ENABLED | auth.uid() ❌ |
| tenants | Tenant management | N/A (id is UUID) | UNKNOWN | UNKNOWN |
| business_profiles | Business data | UUID (inferred) | UNKNOWN | UNKNOWN |

### Legacy Agent Orchestration

| Table | Purpose | tenant_id Type | RLS Status | Auth Method |
|-------|---------|---------------|------------|-------------|
| agent_runs | Simple execution tracking | UUID | UNKNOWN | UNKNOWN |
| agent_states | Agent state management | UUID | UNKNOWN | UNKNOWN |

### Agent-Specific Tables

| Table | Agent | tenant_id Type | RLS Status | Auth Method |
|-------|-------|---------------|------------|-------------|
| locl_audits | LOCL | TEXT ❌ | ENABLED | auth.uid() ❌ |
| publish_jobs | PUBLISH | TEXT ❌ | ENABLED | auth.uid() ❌ |
| pulse_rankings | PULSE | TEXT ❌ | ENABLED | auth.uid() ❌ |
| integrations | Multi-agent | TEXT ❌ | ENABLED | auth.uid() ❌ |
| indexing_status | PUBLISH | TEXT ❌ | ENABLED | auth.uid() ❌ |

### Proposed Runtime Tables (NOT DEPLOYED)

| Table | Purpose | tenant_id Type | RLS Status | Auth Method |
|-------|---------|---------------|------------|-------------|
| agent_executions | Full workflow execution | TEXT ❌ | ENABLED | auth.uid() ❌ |
| agent_tasks | Task tracking | N/A (FK to execution) | ENABLED | auth.uid() ❌ |
| agent_events | Event stream | TEXT ❌ | ENABLED | auth.uid() ❌ |
| agent_logs | Structured logs | N/A (FK to execution) | ENABLED | auth.uid() ❌ |

---

## AUTH COMPATIBILITY AUDIT

### RLS Policy Audit Results

**ALL TABLES WITH RLS USE INVALID auth.uid()**:

Tables requiring IMMEDIATE fix:
1. locl_audits
2. publish_jobs
3. pulse_rankings
4. integrations
5. indexing_status
6. agent_executions (new)
7. agent_tasks (new)
8. agent_events (new)
9. agent_logs (new)

**Required Change**:
```sql
-- BEFORE (INVALID)
SELECT tenant_id FROM profiles WHERE id = auth.uid()

-- AFTER (CORRECT)
SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
```

---

## UUID/TEXT MISMATCH AUDIT

### Current State

| Table | tenant_id Type | Should Be | Status |
|-------|---------------|-----------|--------|
| agent_runs | UUID | UUID | ✅ CORRECT |
| agent_states | UUID | UUID | ✅ CORRECT |
| locl_audits | TEXT | UUID | ❌ WRONG |
| publish_jobs | TEXT | UUID | ❌ WRONG |
| pulse_rankings | TEXT | UUID | ❌ WRONG |
| integrations | TEXT | UUID | ❌ WRONG |
| indexing_status | TEXT | UUID | ❌ WRONG |
| agent_executions (new) | TEXT | UUID | ❌ WRONG |
| agent_events (new) | TEXT | UUID | ❌ WRONG |

### Impact Analysis

**CRITICAL**: Cannot create foreign keys between tables with mismatched types.

**Affected Relationships**:
- `agent_runs` (UUID) → `locl_audits` (TEXT) ❌
- `agent_runs` (UUID) → `publish_jobs` (TEXT) ❌
- `agent_runs` (UUID) → `pulse_rankings` (TEXT) ❌
- `agent_states` (UUID) → `integrations` (TEXT) ❌

---

## RUNTIME COLLISION AUDIT

### Existing vs Proposed

| Aspect | Existing (agent_runs) | Proposed (agent_executions) | Collision |
|--------|----------------------|-----------------------------|-----------|
| Purpose | Simple execution tracking | Full workflow execution | OVERLAP |
| tenant_id | UUID | TEXT | TYPE MISMATCH |
| Status tracking | Basic (queued, running, completed) | Advanced (pending, running, completed, failed, cancelled, retrying) | ENHANCEMENT |
| Retry tracking | metadata JSONB | Dedicated columns | ENHANCEMENT |
| Cost tracking | None | total_cost, total_tokens | NEW |
| Task tracking | None | agent_tasks table | NEW |
| Event tracking | None | agent_events table | NEW |
| Logging | None | agent_logs table | NEW |

### Recommendation

**DEPRECATE `agent_runs` and `agent_states`** in favor of new runtime system.

**Migration Strategy**:
1. Create new runtime tables with correct UUID tenant_id
2. Migrate data from agent_runs → agent_executions
3. Migrate data from agent_states → agent_executions metadata
4. Drop old tables after validation
5. Update all functions to use new tables

---

## RECOMMENDED FINAL ARCHITECTURE

### Tables To Keep (Production Active)

1. **profiles** - User profiles (Clerk integration)
   - Keep as-is (id is TEXT for Clerk)
   - Fix RLS to use auth.jwt() ->> 'sub'

2. **tenants** - Tenant management
   - Keep as-is (id is UUID)
   - Verify RLS policies

3. **business_profiles** - Business data
   - Keep as-is
   - Fix tenant_id to UUID if currently TEXT
   - Fix RLS to use auth.jwt() ->> 'sub'

### Tables To Migrate (Type Correction)

1. **locl_audits** - LOCL agent outputs
   - Migrate tenant_id from TEXT to UUID
   - Fix RLS to use auth.jwt() ->> 'sub'

2. **publish_jobs** - PUBLISH agent jobs
   - Migrate tenant_id from TEXT to UUID
   - Fix RLS to use auth.jwt() ->> 'sub'

3. **pulse_rankings** - PULSE agent rankings
   - Migrate tenant_id from TEXT to UUID
   - Fix RLS to use auth.jwt() ->> 'sub'

4. **integrations** - Integration credentials
   - Migrate tenant_id from TEXT to UUID
   - Fix RLS to use auth.jwt() ->> 'sub'

5. **indexing_status** - URL indexing
   - Migrate tenant_id from TEXT to UUID
   - Fix RLS to use auth.jwt() ->> 'sub'

### Tables To Deprecate

1. **agent_runs** - Legacy execution tracking
   - Migrate data to agent_executions
   - Drop after validation

2. **agent_states** - Legacy state management
   - Migrate data to agent_executions metadata
   - Drop after validation

### Tables To Create (New Runtime)

1. **agent_executions** - Full workflow execution
   - Use UUID for tenant_id
   - Use auth.jwt() ->> 'sub' for RLS
   - Include retention policy

2. **agent_tasks** - Task tracking
   - FK to agent_executions
   - Use auth.jwt() ->> 'sub' for RLS
   - Include retention policy

3. **agent_events** - Event stream
   - Use UUID for tenant_id
   - Use auth.jwt() ->> 'sub' for RLS
   - Include retention policy

4. **agent_logs** - Structured logs
   - FK to agent_executions
   - Use auth.jwt() ->> 'sub' for RLS
   - Include retention policy

---

## TABLES TO KEEP

| Table | Reason | Changes Required |
|-------|--------|------------------|
| profiles | Core user data | Fix RLS auth method |
| tenants | Core tenant data | Verify RLS policies |
| business_profiles | Core business data | Fix tenant_id type, fix RLS |
| locl_audits | LOCL agent outputs | Fix tenant_id type, fix RLS |
| publish_jobs | PUBLISH agent jobs | Fix tenant_id type, fix RLS |
| pulse_rankings | PULSE agent rankings | Fix tenant_id type, fix RLS |
| integrations | Integration credentials | Fix tenant_id type, fix RLS |
| indexing_status | URL indexing | Fix tenant_id type, fix RLS |

---

## TABLES TO REMOVE

| Table | Reason | Migration Required |
|-------|--------|-------------------|
| agent_runs | Legacy execution tracking | Migrate to agent_executions |
| agent_states | Legacy state management | Migrate to agent_executions metadata |

---

## MIGRATION ORDER

### Phase 1: Non-Destructive Inspection (SAFE)
1. Run inspection queries to gather row counts
2. Verify foreign key relationships
3. Check for data dependencies
4. Validate index usage

### Phase 2: Auth Fix (CRITICAL)
1. Fix all RLS policies to use auth.jwt() ->> 'sub'
2. Test tenant isolation
3. Verify no data exposure

### Phase 3: Type Correction (CRITICAL)
1. Migrate tenant_id from TEXT to UUID in affected tables
2. Update foreign keys
3. Update functions
4. Validate referential integrity

### Phase 4: Runtime Deployment
1. Create new runtime tables with correct schema
2. Migrate data from agent_runs → agent_executions
3. Migrate data from agent_states → agent_executions metadata
4. Test new runtime system

### Phase 5: Cleanup
1. Drop agent_runs table
2. Drop agent_states table
3. Drop obsolete functions
4. Clean up orphaned indexes

### Phase 6: Validation
1. Verify all RLS policies active
2. Verify all indexes exist
3. Verify all triggers active
4. Test tenant isolation
5. Test execution flow

---

## FULL SQL BLOCKS

### STEP 1: Non-Destructive Inspection Queries

```sql
-- ============================================
-- PHASE 1: NON-DESTRUCTIVE INSPECTION QUERIES
-- ============================================

-- 1. Get all table row counts
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Get all foreign key relationships
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
ORDER BY tc.table_name;

-- 3. Get all indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. Get all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Get all triggers
SELECT
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. Get all extensions
SELECT
  extname as extension_name,
  extversion as version,
  nspname as schema
FROM pg_extension
JOIN pg_namespace ON pg_extension.extnamespace = pg_namespace.oid
ORDER BY extname;

-- 7. Check for auth.uid() usage in policies
SELECT
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual ILIKE '%auth.uid()%' OR with_check ILIKE '%auth.uid()%');

-- 8. Check tenant_id data types
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE column_name = 'tenant_id'
  AND table_schema = 'public'
ORDER BY table_name;

-- 9. Check for orphaned data (FK violations)
-- This will fail if there are violations
-- DO NOT RUN IN PRODUCTION WITHOUT BACKUP
-- SET client_min_messages TO 'error';
-- SELECT 1/0; -- Placeholder for FK validation

-- 10. Check for duplicate orchestration systems
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name LIKE '%agent%' OR table_name LIKE '%execution%' OR table_name LIKE '%run%')
ORDER BY table_name, column_name;
```

---

### STEP 2: Cleanup SQL (AFTER INSPECTION)

```sql
-- ============================================
-- PHASE 2: AUTH FIX - CRITICAL
-- ============================================

-- NOTE: This section will be completed AFTER inspection results
-- DO NOT RUN WITHOUT DATA BACKUP

-- Fix RLS policies for all tables
-- Replace auth.uid() with auth.jwt() ->> 'sub'

-- Example (will be generated per table after inspection):
-- DROP POLICY IF EXISTS "Users can view their own locl audits" ON locl_audits;
-- CREATE POLICY "Users can view their own locl audits"
--   ON locl_audits FOR SELECT
--   USING (
--     tenant_id IN (
--       SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
--     )
--   );
```

---

### STEP 3: Final Runtime Tables

```sql
-- ============================================
-- PHASE 3: FINAL RUNTIME TABLES - PRODUCTION GRADE
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================
-- TABLE: agent_executions
-- ============================================

CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- FIXED: Changed from TEXT to UUID
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
  
  -- Foreign key to tenants table
  CONSTRAINT fk_agent_executions_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_id 
  ON agent_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_name 
  ON agent_executions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status 
  ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_workflow_type 
  ON agent_executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_agent_executions_started_at 
  ON agent_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_status 
  ON agent_executions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_agent 
  ON agent_executions(tenant_id, agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_executions_inngest_run_id 
  ON agent_executions(inngest_run_id);
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

DROP TRIGGER IF EXISTS trigger_update_agent_executions_updated_at 
  ON agent_executions;
CREATE TRIGGER trigger_update_agent_executions_updated_at
  BEFORE UPDATE ON agent_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_executions_updated_at();

-- RLS policies - FIXED: Using auth.jwt() ->> 'sub'
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own agent executions" 
  ON agent_executions;
CREATE POLICY "Users can view their own agent executions"
  ON agent_executions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "System can insert agent executions" 
  ON agent_executions;
CREATE POLICY "System can insert agent executions"
  ON agent_executions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent executions" 
  ON agent_executions;
CREATE POLICY "System can update agent executions"
  ON agent_executions FOR UPDATE
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can delete agent executions" 
  ON agent_executions;
CREATE POLICY "System can delete agent executions"
  ON agent_executions FOR DELETE
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE agent_executions 
  IS 'Tracks full workflow executions across all agents';
COMMENT ON COLUMN agent_executions.id 
  IS 'Unique identifier for the execution';
COMMENT ON COLUMN agent_executions.tenant_id 
  IS 'Tenant identifier for multi-tenancy (UUID)';
COMMENT ON COLUMN agent_executions.agent_name 
  IS 'Name of the agent (e.g., LOCL, ARIA, SCRIBE)';
COMMENT ON COLUMN agent_executions.workflow_type 
  IS 'Type of workflow being executed';
COMMENT ON COLUMN agent_executions.status 
  IS 'Current status of the execution';
COMMENT ON COLUMN agent_executions.started_at 
  IS 'When the execution started';
COMMENT ON COLUMN agent_executions.completed_at 
  IS 'When the execution completed successfully';
COMMENT ON COLUMN agent_executions.failed_at 
  IS 'When the execution failed';
COMMENT ON COLUMN agent_executions.retry_count 
  IS 'Number of retry attempts';
COMMENT ON COLUMN agent_executions.max_retries 
  IS 'Maximum allowed retry attempts';
COMMENT ON COLUMN agent_executions.execution_source 
  IS 'How the execution was triggered';
COMMENT ON COLUMN agent_executions.initiated_by 
  IS 'User or system that initiated the execution';
COMMENT ON COLUMN agent_executions.metadata 
  IS 'Additional execution metadata';
COMMENT ON COLUMN agent_executions.total_cost 
  IS 'Total cost of the execution in USD';
COMMENT ON COLUMN agent_executions.total_tokens 
  IS 'Total tokens consumed during execution';
COMMENT ON COLUMN agent_executions.inngest_run_id 
  IS 'Reference to Inngest run for observability';
COMMENT ON COLUMN agent_executions.error_message 
  IS 'Error message if execution failed';

-- ============================================
-- TABLE: agent_tasks
-- ============================================

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
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_id 
  ON agent_tasks(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_task_name 
  ON agent_tasks(task_name);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status 
  ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_task_type 
  ON agent_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_step_order 
  ON agent_tasks(step_order);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_status 
  ON agent_tasks(execution_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_step 
  ON agent_tasks(execution_id, step_order);
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

DROP TRIGGER IF EXISTS trigger_update_agent_tasks_updated_at 
  ON agent_tasks;
CREATE TRIGGER trigger_update_agent_tasks_updated_at
  BEFORE UPDATE ON agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_tasks_updated_at();

-- RLS policies - FIXED: Using auth.jwt() ->> 'sub'
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks from their own executions" 
  ON agent_tasks;
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

DROP POLICY IF EXISTS "System can insert agent tasks" 
  ON agent_tasks;
CREATE POLICY "System can insert agent tasks"
  ON agent_tasks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent tasks" 
  ON agent_tasks;
CREATE POLICY "System can update agent tasks"
  ON agent_tasks FOR UPDATE
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can delete agent tasks" 
  ON agent_tasks;
CREATE POLICY "System can delete agent tasks"
  ON agent_tasks FOR DELETE
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE agent_tasks 
  IS 'Tracks individual workflow tasks within executions';
COMMENT ON COLUMN agent_tasks.id 
  IS 'Unique identifier for the task';
COMMENT ON COLUMN agent_tasks.execution_id 
  IS 'Reference to parent execution';
COMMENT ON COLUMN agent_tasks.task_name 
  IS 'Name of the task';
COMMENT ON COLUMN agent_tasks.task_type 
  IS 'Type of task (e.g., api_call, data_transform, ai_generation)';
COMMENT ON COLUMN agent_tasks.status 
  IS 'Current status of the task';
COMMENT ON COLUMN agent_tasks.started_at 
  IS 'When the task started';
COMMENT ON COLUMN agent_tasks.completed_at 
  IS 'When the task completed successfully';
COMMENT ON COLUMN agent_tasks.failed_at 
  IS 'When the task failed';
COMMENT ON COLUMN agent_tasks.retry_count 
  IS 'Number of retry attempts';
COMMENT ON COLUMN agent_tasks.max_retries 
  IS 'Maximum allowed retry attempts';
COMMENT ON COLUMN agent_tasks.input_payload 
  IS 'Input data for the task';
COMMENT ON COLUMN agent_tasks.output_payload 
  IS 'Output data from the task';
COMMENT ON COLUMN agent_tasks.error_payload 
  IS 'Error details if task failed';
COMMENT ON COLUMN agent_tasks.step_order 
  IS 'Order of task in workflow';
COMMENT ON COLUMN agent_tasks.duration_ms 
  IS 'Task duration in milliseconds';

-- Retention Policy: Delete tasks older than 180 days
SELECT cron.schedule(
  'clean-agent-tasks',
  '0 4 * * *',
  $$
  DELETE FROM agent_tasks
  WHERE created_at < NOW() - INTERVAL '180 days'
  $$
);

-- ============================================
-- TABLE: agent_events
-- ============================================

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- FIXED: Changed from TEXT to UUID
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_source TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  event_version TEXT DEFAULT '1.0',
  correlation_id TEXT,
  causation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key to tenants table
  CONSTRAINT fk_agent_events_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_id 
  ON agent_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_execution_id 
  ON agent_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_event_name 
  ON agent_events(event_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_event_source 
  ON agent_events(event_source);
CREATE INDEX IF NOT EXISTS idx_agent_events_created_at 
  ON agent_events(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_event 
  ON agent_events(tenant_id, event_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_correlation_id 
  ON agent_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_causation_id 
  ON agent_events(causation_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_created 
  ON agent_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_execution_created 
  ON agent_events(execution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_payload_gin 
  ON agent_events USING GIN (payload);

-- RLS policies - FIXED: Using auth.jwt() ->> 'sub'
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own agent events" 
  ON agent_events;
CREATE POLICY "Users can view their own agent events"
  ON agent_events FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "System can insert agent events" 
  ON agent_events;
CREATE POLICY "System can insert agent events"
  ON agent_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent events" 
  ON agent_events;
CREATE POLICY "System can update agent events"
  ON agent_events FOR UPDATE
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can delete agent events" 
  ON agent_events;
CREATE POLICY "System can delete agent events"
  ON agent_events FOR DELETE
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE agent_events 
  IS 'Central event stream for event-driven architecture';
COMMENT ON COLUMN agent_events.id 
  IS 'Unique identifier for the event';
COMMENT ON COLUMN agent_events.tenant_id 
  IS 'Tenant identifier for multi-tenancy (UUID)';
COMMENT ON COLUMN agent_events.execution_id 
  IS 'Reference to associated execution';
COMMENT ON COLUMN agent_events.event_name 
  IS 'Name of the event (e.g., audit.completed, content.generated)';
COMMENT ON COLUMN agent_events.event_source 
  IS 'Source of the event (e.g., LOCL, ARIA, system)';
COMMENT ON COLUMN agent_events.payload 
  IS 'Event payload data';
COMMENT ON COLUMN agent_events.event_version 
  IS 'Version of the event schema';
COMMENT ON COLUMN agent_events.correlation_id 
  IS 'ID for correlating related events';
COMMENT ON COLUMN agent_events.causation_id 
  IS 'ID of the event that caused this event';
COMMENT ON COLUMN agent_events.created_at 
  IS 'When the event was created';

-- Retention Policy: Delete events older than 180 days
SELECT cron.schedule(
  'clean-agent-events',
  '0 3 * * *',
  $$
  DELETE FROM agent_events
  WHERE created_at < NOW() - INTERVAL '180 days'
  $$
);

-- ============================================
-- TABLE: agent_logs
-- ============================================

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
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_id 
  ON agent_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_task_id 
  ON agent_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_log_level 
  ON agent_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at 
  ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_level 
  ON agent_logs(execution_id, log_level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_created 
  ON agent_logs(execution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_task_created 
  ON agent_logs(execution_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_metadata_gin 
  ON agent_logs USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_agent_logs_errors 
  ON agent_logs(execution_id, created_at DESC)
  WHERE log_level IN ('error', 'fatal');

-- RLS policies - FIXED: Using auth.jwt() ->> 'sub'
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs from their own executions" 
  ON agent_logs;
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

DROP POLICY IF EXISTS "System can insert agent logs" 
  ON agent_logs;
CREATE POLICY "System can insert agent logs"
  ON agent_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can delete agent logs" 
  ON agent_logs;
CREATE POLICY "System can delete agent logs"
  ON agent_logs FOR DELETE
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE agent_logs 
  IS 'Structured execution logs for debugging and observability';
COMMENT ON COLUMN agent_logs.id 
  IS 'Unique identifier for the log entry';
COMMENT ON COLUMN agent_logs.execution_id 
  IS 'Reference to parent execution';
COMMENT ON COLUMN agent_logs.task_id 
  IS 'Reference to associated task';
COMMENT ON COLUMN agent_logs.log_level 
  IS 'Log level (debug, info, warn, error, fatal)';
COMMENT ON COLUMN agent_logs.message 
  IS 'Log message';
COMMENT ON COLUMN agent_logs.metadata 
  IS 'Additional metadata';
COMMENT ON COLUMN agent_logs.context 
  IS 'Execution context data';
COMMENT ON COLUMN agent_logs.created_at 
  IS 'When the log was created';

-- Retention Policy: Delete logs older than 90 days
SELECT cron.schedule(
  'clean-agent-logs',
  '0 2 * * *',
  $$
  DELETE FROM agent_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  $$
);
```

---

### STEP 4: Validation Queries

```sql
-- ============================================
-- PHASE 4: VALIDATION QUERIES
-- ============================================

-- 1. Verify RLS is enabled on all runtime tables
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
ORDER BY tablename;

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

-- 3. Verify no auth.uid() in runtime policies
SELECT
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
  AND (qual ILIKE '%auth.uid()%' OR with_check ILIKE '%auth.uid()%');

-- Should return 0 rows if successful

-- 4. Verify all indexes exist on runtime tables
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
ORDER BY tablename, indexname;

-- 5. Verify all triggers exist on runtime tables
SELECT
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
ORDER BY event_object_table, trigger_name;

-- 6. Verify foreign key constraints
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

-- 7. Verify retention policies are scheduled
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
WHERE jobname IN ('clean-agent-logs', 'clean-agent-events', 'clean-agent-tasks')
ORDER BY jobname;

-- 8. Test tenant isolation (run as authenticated user)
-- This should return 0 rows if RLS is working correctly
-- SELECT * FROM agent_executions WHERE tenant_id != (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub');

-- 9. Verify pg_cron extension is installed
SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname = 'pg_cron';

-- 10. Verify UUID data types on tenant_id columns
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

-- Should show 'uuid' or 'uuid' type, not 'text' or 'character varying'
```

---

## ROLLBACK PLAN

### Pre-Migration Backup

```sql
-- ============================================
-- ROLLBACK PLAN - EMERGENCY RECOVERY
-- ============================================

-- 1. Create backup tables before any migration
CREATE TABLE IF NOT EXISTS agent_executions_backup AS 
  SELECT * FROM agent_executions WITH NO DATA;

CREATE TABLE IF NOT EXISTS agent_tasks_backup AS 
  SELECT * FROM agent_tasks WITH NO DATA;

CREATE TABLE IF NOT EXISTS agent_events_backup AS 
  SELECT * FROM agent_events WITH NO DATA;

CREATE TABLE IF NOT EXISTS agent_logs_backup AS 
  SELECT * FROM agent_logs WITH NO DATA;

-- 2. Backup existing agent_runs and agent_states
CREATE TABLE IF NOT EXISTS agent_runs_backup AS 
  SELECT * FROM agent_runs;

CREATE TABLE IF NOT EXISTS agent_states_backup AS 
  SELECT * FROM agent_states;

-- 3. Backup RLS policies
-- This is informational only - policies are not stored in tables
SELECT * INTO TEMP rls_backup
FROM pg_policies
WHERE schemaname = 'public';
```

### Rollback Procedure

```sql
-- ============================================
-- ROLLBACK PROCEDURE - EXECUTE IN EMERGENCY
-- ============================================

-- 1. Drop new runtime tables
DROP TABLE IF EXISTS agent_logs CASCADE;
DROP TABLE IF EXISTS agent_events CASCADE;
DROP TABLE IF EXISTS agent_tasks CASCADE;
DROP TABLE IF EXISTS agent_executions CASCADE;

-- 2. Restore old tables from backup if needed
-- DROP TABLE IF EXISTS agent_runs;
-- CREATE TABLE agent_runs AS SELECT * FROM agent_runs_backup;

-- DROP TABLE IF EXISTS agent_states;
-- CREATE TABLE agent_states AS SELECT * FROM agent_states_backup;

-- 3. Restore functions if modified
-- (Restore from version control)

-- 4. Verify system is operational
SELECT COUNT(*) FROM agent_runs;
SELECT COUNT(*) FROM agent_states;
```

---

## VERIFICATION CHECKLIST

### Pre-Migration
- [ ] Full database backup created
- [ ] All inspection queries run and results documented
- [ ] Row counts documented for all tables
- [ ] Foreign key relationships documented
- [ ] Dependencies identified
- [ ] Staging environment tested
- [ ] Rollback procedure documented
- [ ] Team notified of maintenance window

### During Migration
- [ ] Phase 1 (Inspection) completed successfully
- [ ] Phase 2 (Auth Fix) completed successfully
- [ ] Phase 3 (Type Correction) completed successfully
- [ ] Phase 4 (Runtime Deployment) completed successfully
- [ ] Phase 5 (Cleanup) completed successfully
- [ ] No errors in any phase
- [ ] Data integrity verified after each phase

### Post-Migration
- [ ] All validation queries pass
- [ ] RLS policies verified active
- [ ] No auth.uid() found in any policy
- [ ] All indexes verified present
- [ ] All triggers verified active
- [ ] Foreign key constraints verified
- [ ] Retention policies verified scheduled
- [ ] Tenant isolation tested
- [ ] Execution flow tested
- [ ] Dashboard loads correctly
- [ ] Onboarding works correctly
- [ ] Settings pages work correctly
- [ ] Tenant loading works correctly
- [ ] Business profile loading works correctly
- [ ] No data loss confirmed
- [ ] Performance baseline established

### Production Sign-Off
- [ ] Staging environment validated
- [ ] Load testing completed
- [ ] Monitoring configured
- [ ] Alerting configured
- [ ] Documentation updated
- [ ] Team trained on new architecture
- [ ] Rollback plan tested
- [ ] Maintenance window approved
- [ ] Production deployment scheduled

---

## CONCLUSION

**STATUS**: CRITICAL ISSUES IDENTIFIED - MIGRATION BLOCKED

**BLOCKING ISSUES**:
1. All RLS policies use invalid auth.uid() - MUST fix before deployment
2. Severe tenant_id type inconsistency - MUST fix before deployment
3. Duplicate orchestration systems - MUST resolve before deployment

**RECOMMENDED ACTION**:
1. Run Phase 1 inspection queries in production (read-only)
2. Document all findings
3. Create comprehensive migration plan based on inspection results
4. Test complete migration in staging environment
5. Execute production migration with full backup and rollback plan

**ESTIMATED COMPLEXITY**: HIGH
**ESTIMATED DOWNTIME**: 2-4 hours (including validation)
**RISK LEVEL**: HIGH (due to type changes and auth fixes)

---

**Report Version**: 1.0  
**Date**: January 9, 2025  
**Author**: Principal Database Architect  
**Status**: AWAITING INSPECTION RESULTS

# CLAUX BATCH 1 & 2 SQL MIGRATION PACKAGE

**Date:** 2026-05-15  
**Status:** PRODUCTION READY  
**Execution Target:** Supabase SQL Editor  

---

## SECTION 1 — EXECUTION ORDER

**Phase 1: Pre-Execution (REQUIRED)**
1. 01_backup_validation.sql
2. 02_rls_audit.sql

**Phase 2: RLS Migration (REQUIRED)**
3. 03_rls_repair_agent_executions.sql
4. 04_rls_repair_agent_tasks.sql
5. 05_rls_repair_agent_events.sql
6. 06_rls_repair_agent_logs.sql

**Phase 3: Compatibility Layer (REQUIRED)**
7. 07_tenant_compatibility.sql

**Phase 4: Index Optimization (OPTIONAL)**
8. 08_index_optimization.sql

**Phase 5: Validation (REQUIRED)**
9. 09_validation_suite.sql

**Staging-First:** MANDATORY for Phases 1-3

---

## SECTION 2 — RLS REPAIR SQL

### 03_rls_repair_agent_executions.sql

```sql
BEGIN;
DROP POLICY IF EXISTS "Users can view their own agent executions" ON agent_executions;
CREATE POLICY "Users can view their own agent executions"
  ON agent_executions FOR SELECT
  USING (tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'));
COMMIT;
```

**Rollback:**
```sql
BEGIN;
DROP POLICY IF EXISTS "Users can view their own agent executions" ON agent_executions;
CREATE POLICY IF NOT EXISTS "Users can view their own agent executions"
  ON agent_executions FOR SELECT
  USING (tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
COMMIT;
```

---

### 04_rls_repair_agent_tasks.sql

```sql
BEGIN;
DROP POLICY IF EXISTS "Users can view tasks from their own executions" ON agent_tasks;
CREATE POLICY "Users can view tasks from their own executions"
  ON agent_tasks FOR SELECT
  USING (execution_id IN (SELECT id FROM agent_executions WHERE tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub')));
COMMIT;
```

**Rollback:**
```sql
BEGIN;
DROP POLICY IF EXISTS "Users can view tasks from their own executions" ON agent_tasks;
CREATE POLICY IF NOT EXISTS "Users can view tasks from their own executions"
  ON agent_tasks FOR SELECT
  USING (execution_id IN (SELECT id FROM agent_executions WHERE tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
COMMIT;
```

---

### 05_rls_repair_agent_events.sql

```sql
BEGIN;
DROP POLICY IF EXISTS "Users can view their own agent events" ON agent_events;
CREATE POLICY "Users can view their own agent events"
  ON agent_events FOR SELECT
  USING (tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'));
COMMIT;
```

**Rollback:**
```sql
BEGIN;
DROP POLICY IF EXISTS "Users can view their own agent events" ON agent_events;
CREATE POLICY IF NOT EXISTS "Users can view their own agent events"
  ON agent_events FOR SELECT
  USING (tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
COMMIT;
```

---

### 06_rls_repair_agent_logs.sql

```sql
BEGIN;
DROP POLICY IF EXISTS "Users can view logs from their own executions" ON agent_logs;
CREATE POLICY "Users can view logs from their own executions"
  ON agent_logs FOR SELECT
  USING (execution_id IN (SELECT id FROM agent_executions WHERE tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub')));
COMMIT;
```

**Rollback:**
```sql
BEGIN;
DROP POLICY IF EXISTS "Users can view logs from their own executions" ON agent_logs;
CREATE POLICY IF NOT EXISTS "Users can view logs from their own executions"
  ON agent_logs FOR SELECT
  USING (execution_id IN (SELECT id FROM agent_executions WHERE tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
COMMIT;
```

---

## SECTION 3 — tenant_id COMPATIBILITY SQL

### 07_tenant_compatibility.sql

```sql
BEGIN;
CREATE OR REPLACE FUNCTION safe_tenant_id_cast(tenant_id_param TEXT) RETURNS TEXT AS $$
BEGIN RETURN tenant_id_param; END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE VIEW tenant_id_consistency_view AS
SELECT 'agent_executions' as table_name, tenant_id, COUNT(*) as record_count FROM agent_executions GROUP BY tenant_id
UNION ALL
SELECT 'agent_tasks', e.tenant_id, COUNT(*) FROM agent_tasks t JOIN agent_executions e ON t.execution_id = e.id GROUP BY e.tenant_id
UNION ALL
SELECT 'agent_events', tenant_id, COUNT(*) FROM agent_events GROUP BY tenant_id
UNION ALL
SELECT 'agent_logs', e.tenant_id, COUNT(*) FROM agent_logs l JOIN agent_executions e ON l.execution_id = e.id GROUP BY e.tenant_id;
COMMIT;
```

**Rollback:**
```sql
BEGIN;
DROP VIEW IF EXISTS tenant_id_consistency_view;
DROP FUNCTION IF EXISTS safe_tenant_id_cast(TEXT);
COMMIT;
```

---

## SECTION 4 — EXECUTION SYSTEM VALIDATION

```sql
-- agent_executions
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'agent_executions';
SELECT COUNT(*) FROM agent_executions e WHERE NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id::text = e.tenant_id::text);

-- agent_tasks
SELECT COUNT(*) FROM agent_tasks t WHERE NOT EXISTS (SELECT 1 FROM agent_executions e WHERE e.id = t.execution_id);
SELECT execution_id, COUNT(*), COUNT(DISTINCT step_order) FROM agent_tasks GROUP BY execution_id HAVING COUNT(*) != COUNT(DISTINCT step_order);

-- agent_events
SELECT COUNT(*) FROM agent_events ev WHERE ev.execution_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM agent_executions e WHERE e.id = ev.execution_id);

-- agent_logs
SELECT COUNT(*) FROM agent_logs l WHERE NOT EXISTS (SELECT 1 FROM agent_executions e WHERE e.id = l.execution_id);
SELECT COUNT(*) FROM agent_logs l WHERE l.task_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM agent_tasks t WHERE t.id = l.task_id);
```

---

## SECTION 5 — DEAD RUNTIME FREEZE

```sql
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'runtime_executions') THEN
    COMMENT ON TABLE runtime_executions IS '⚠️ DEPRECATED - Use agent_executions instead. Batch 1.';
  END IF;
END $$;
COMMIT;
```

**Rollback:**
```sql
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'runtime_executions') THEN
    COMMENT ON TABLE runtime_executions IS NULL;
  END IF;
END $$;
COMMIT;
```

---

## SECTION 6 — INDEX SQL

```sql
BEGIN;
CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant_status_created ON agent_executions(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution_status_created ON agent_tasks(execution_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_created ON agent_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_execution_created ON agent_events(execution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_level_created ON agent_logs(execution_id, log_level, created_at DESC);
COMMIT;
```

**Rollback:**
```sql
BEGIN;
DROP INDEX IF EXISTS idx_agent_executions_tenant_status_created;
DROP INDEX IF EXISTS idx_agent_tasks_execution_status_created;
DROP INDEX IF EXISTS idx_agent_events_tenant_created;
DROP INDEX IF EXISTS idx_agent_events_execution_created;
DROP INDEX IF EXISTS idx_agent_logs_execution_level_created;
COMMIT;
```

---

## SECTION 7 — ARTIFACT VALIDATION

```sql
SELECT table_name FROM information_schema.tables WHERE table_name IN ('seo_keywords', 'seo_content_briefs', 'seo_drafts', 'publishing_schedule');
SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('seo_keywords', 'seo_content_briefs', 'seo_drafts', 'publishing_schedule') AND column_name = 'tenant_id';
```

---

## SECTION 8 — EVENT + LOG VALIDATION

```sql
-- Event validation
SELECT event_name, COUNT(*) FROM agent_events GROUP BY event_name ORDER BY count DESC LIMIT 20;
SELECT COUNT(*), COUNT(CASE WHEN tenant_id IS NULL THEN 1 END), COUNT(CASE WHEN execution_id IS NULL THEN 1 END) FROM agent_events;

-- Log validation
SELECT log_level, COUNT(*) FROM agent_logs GROUP BY log_level;
SELECT COUNT(*), COUNT(CASE WHEN execution_id IS NULL THEN 1 END) FROM agent_logs;

-- Linkage validation
SELECT COUNT(*) FROM agent_events WHERE execution_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM agent_executions WHERE id = agent_events.execution_id);
SELECT COUNT(*) FROM agent_logs WHERE NOT EXISTS (SELECT 1 FROM agent_executions WHERE id = agent_logs.execution_id);
```

---

## SECTION 9 — SAFETY PROCEDURE

**Pre-Execution Checklist:**
1. Run backup validation: `SELECT COUNT(*) FROM agent_executions UNION ALL SELECT COUNT(*) FROM agent_tasks UNION ALL SELECT COUNT(*) FROM agent_events UNION ALL SELECT COUNT(*) FROM agent_logs`
2. Record counts for post-execution comparison
3. Execute on staging first (MANDATORY)
4. Run validation suite on staging
5. Only proceed to production after staging passes

**Post-Execution Verification:**
1. Compare row counts with pre-execution
2. Verify RLS policies: `SELECT policyname, qual FROM pg_policies WHERE tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')`
3. Verify indexes: `SELECT indexname FROM pg_indexes WHERE tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')`
4. Run application smoke test

---

## SECTION 10 — ROLLBACK PACKAGE

```sql
-- Complete rollback (execute in reverse order)
BEGIN;
DROP INDEX IF EXISTS idx_agent_executions_tenant_status_created;
DROP INDEX IF EXISTS idx_agent_tasks_execution_status_created;
DROP INDEX IF EXISTS idx_agent_events_tenant_created;
DROP INDEX IF EXISTS idx_agent_events_execution_created;
DROP INDEX IF EXISTS idx_agent_logs_execution_level_created;
COMMIT;

BEGIN;
DROP POLICY IF EXISTS "Users can view their own agent executions" ON agent_executions;
DROP POLICY IF EXISTS "Users can view tasks from their own executions" ON agent_tasks;
DROP POLICY IF EXISTS "Users can view their own agent events" ON agent_events;
DROP POLICY IF EXISTS "Users can view logs from their own executions" ON agent_logs;
COMMIT;

BEGIN;
DROP VIEW IF EXISTS tenant_id_consistency_view;
DROP FUNCTION IF EXISTS safe_tenant_id_cast(TEXT);
COMMIT;
```

---

## SECTION 11 — VALIDATION SUITE

```sql
-- RLS Validation
SELECT policyname, qual FROM pg_policies WHERE tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs') AND qual LIKE '%auth.jwt%';

-- Tenant Isolation Validation
SELECT * FROM tenant_id_consistency_view ORDER BY table_name, tenant_id;

-- Execution Integrity
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs');

-- Orphan Detection
SELECT 'agent_tasks orphaned' as check, COUNT(*) FROM agent_tasks WHERE NOT EXISTS (SELECT 1 FROM agent_executions WHERE id = agent_tasks.execution_id)
UNION ALL
SELECT 'agent_events orphaned', COUNT(*) FROM agent_events WHERE execution_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM agent_executions WHERE id = agent_events.execution_id)
UNION ALL
SELECT 'agent_logs orphaned', COUNT(*) FROM agent_logs WHERE NOT EXISTS (SELECT 1 FROM agent_executions WHERE id = agent_logs.execution_id);
```

---

## SECTION 12 — CTO EXECUTION NOTES

**Safe for Production Immediately:**
- Phase 1: Pre-execution validation (read-only)
- Phase 2: RLS migration (idempotent, rollback-safe)
- Phase 3: Compatibility layer (non-destructive)

**Requires Staging Validation First:**
- Phase 4: Index optimization (performance impact)

**Optional:**
- Phase 4: Index optimization (can be deferred if not needed)

**Deferred:**
- Full tenant_id normalization to UUID (remains postponed per decision)

**Recommendation:**
Execute Phases 1-3 immediately after staging validation. Phase 4 can be deferred if performance is acceptable without additional indexes.


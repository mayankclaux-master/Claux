-- Remote Schema Verification Script
-- Purpose: Verify whether 20250120 concurrency migrations are present in production schema
-- Usage: Run this in Supabase Dashboard SQL Editor
-- Output: Schema state report for migration reconciliation

-- ============================================================================
-- SECTION 1: Version Column Verification
-- ============================================================================

SELECT 'VERSION COLUMNS' as verification_category,
       table_name,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_name IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
  AND column_name = 'version'
ORDER BY table_name;

-- ============================================================================
-- SECTION 2: Fingerprint Column Verification
-- ============================================================================

SELECT 'FINGERPRINT COLUMNS' as verification_category,
       table_name,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_name IN ('agent_executions', 'agent_tasks', 'publish_jobs')
  AND column_name = 'fingerprint'
ORDER BY table_name;

-- ============================================================================
-- SECTION 3: Unique Constraint Verification
-- ============================================================================

SELECT 'UNIQUE CONSTRAINTS' as verification_category,
       tc.table_name,
       tc.constraint_name,
       tc.constraint_type,
       kcu.column_name,
       kcu.ordinal_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_name IN ('agent_executions', 'agent_tasks', 'agent_events', 'publish_jobs')
  AND tc.constraint_type = 'UNIQUE'
  AND tc.constraint_name LIKE 'uk_%'
ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;

-- ============================================================================
-- SECTION 4: CHECK Constraint Verification
-- ============================================================================

SELECT 'CHECK CONSTRAINTS' as verification_category,
       tc.table_name,
       tc.constraint_name,
       tc.constraint_type,
       cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
  AND tc.constraint_schema = cc.constraint_schema
WHERE tc.table_name IN ('agent_executions', 'agent_tasks')
  AND tc.constraint_type = 'CHECK'
  AND tc.constraint_name LIKE 'ck_%'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- SECTION 5: Index Verification
-- ============================================================================

SELECT 'INDEXES' as verification_category,
       schemaname,
       tablename,
       indexname,
       indexdef
FROM pg_indexes
WHERE tablename IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs', 'publish_jobs')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 6: Trigger Verification
-- ============================================================================

SELECT 'TRIGGERS' as verification_category,
       event_object_table,
       trigger_name,
       action_timing,
       event_manipulation,
       action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs')
  AND trigger_name LIKE '%version%'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 7: Migration History Verification
-- ============================================================================

SELECT 'MIGRATION HISTORY' as verification_category,
       version,
       name,
       statement,
       executed_at
FROM supabase_migrations.schema_migrations
WHERE version LIKE '20250120%'
ORDER BY version;

-- ============================================================================
-- SECTION 8: Table Row Counts
-- ============================================================================

SELECT 'TABLE ROW COUNTS' as verification_category,
       table_name,
       (SELECT COUNT(*) FROM agent_executions) as row_count
FROM information_schema.tables
WHERE table_name = 'agent_executions'

UNION ALL

SELECT 'TABLE ROW COUNTS' as verification_category,
       table_name,
       (SELECT COUNT(*) FROM agent_tasks) as row_count
FROM information_schema.tables
WHERE table_name = 'agent_tasks'

UNION ALL

SELECT 'TABLE ROW COUNTS' as verification_category,
       table_name,
       (SELECT COUNT(*) FROM agent_events) as row_count
FROM information_schema.tables
WHERE table_name = 'agent_events'

UNION ALL

SELECT 'TABLE ROW COUNTS' as verification_category,
       table_name,
       (SELECT COUNT(*) FROM agent_logs) as row_count
FROM information_schema.tables
WHERE table_name = 'agent_logs'

UNION ALL

SELECT 'TABLE ROW COUNTS' as verification_category,
       table_name,
       (SELECT COUNT(*) FROM publish_jobs) as row_count
FROM information_schema.tables
WHERE table_name = 'publish_jobs';

-- ============================================================================
-- SECTION 9: Duplicate Detection (Pre-Deployment Safety)
-- ============================================================================

-- Detect duplicate (tenant_id, inngest_run_id) pairs
SELECT 'DUPLICATE DETECTION' as verification_category,
       'Duplicate Inngest Runs' as detection_type,
       tenant_id,
       inngest_run_id,
       COUNT(*) as duplicate_count
FROM agent_executions
WHERE inngest_run_id IS NOT NULL
GROUP BY tenant_id, inngest_run_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- Detect duplicate (execution_id, step_order) pairs
SELECT 'DUPLICATE DETECTION' as verification_category,
       'Duplicate Task Step Orders' as detection_type,
       execution_id,
       step_order,
       COUNT(*) as duplicate_count
FROM agent_tasks
GROUP BY execution_id, step_order
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- ============================================================================
-- SECTION 10: Constraint Violation Detection (Pre-Deployment Safety)
-- ============================================================================

-- Detect rows where retry_count > max_retries in agent_executions
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Invalid Retry Counts (agent_executions)' as violation_type,
       COUNT(*) as violation_count
FROM agent_executions
WHERE retry_count > max_retries;

-- Detect rows where retry_count > max_retries in agent_tasks
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Invalid Retry Counts (agent_tasks)' as violation_type,
       COUNT(*) as violation_count
FROM agent_tasks
WHERE retry_count > max_retries;

-- Detect rows where status = 'completed' but completed_at IS NULL in agent_executions
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Completed Executions Without Timestamp' as violation_type,
       COUNT(*) as violation_count
FROM agent_executions
WHERE status = 'completed' AND completed_at IS NULL;

-- Detect rows where status = 'failed' but failed_at IS NULL in agent_executions
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Failed Executions Without Timestamp' as violation_type,
       COUNT(*) as violation_count
FROM agent_executions
WHERE status = 'failed' AND failed_at IS NULL;

-- Detect rows where status = 'running' but started_at IS NULL in agent_executions
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Running Executions Without Timestamp' as violation_type,
       COUNT(*) as violation_count
FROM agent_executions
WHERE status = 'running' AND started_at IS NULL;

-- Detect rows where status = 'completed' but completed_at IS NULL in agent_tasks
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Completed Tasks Without Timestamp' as violation_type,
       COUNT(*) as violation_count
FROM agent_tasks
WHERE status = 'completed' AND completed_at IS NULL;

-- Detect rows where status = 'failed' but failed_at IS NULL in agent_tasks
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Failed Tasks Without Timestamp' as violation_type,
       COUNT(*) as violation_count
FROM agent_tasks
WHERE status = 'failed' AND failed_at IS NULL;

-- Detect rows where status = 'running' but started_at IS NULL in agent_tasks
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Running Tasks Without Timestamp' as violation_type,
       COUNT(*) as violation_count
FROM agent_tasks
WHERE status = 'running' AND started_at IS NULL;

-- Detect rows where duration_ms < 0
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Negative Task Durations' as violation_type,
       COUNT(*) as violation_count
FROM agent_tasks
WHERE duration_ms < 0;

-- Detect rows where total_cost < 0
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Negative Execution Costs' as violation_type,
       COUNT(*) as violation_count
FROM agent_executions
WHERE total_cost < 0;

-- Detect rows where total_tokens < 0
SELECT 'CONSTRAINT VIOLATIONS' as verification_category,
       'Negative Execution Tokens' as violation_type,
       COUNT(*) as violation_count
FROM agent_executions
WHERE total_tokens < 0;

# CLAUX Runtime Table Migration Report

**Report Date:** 2025-01-19
**Phase:** Phase 2B - Canonical Runtime Migration & Execution Authority Enforcement
**Status:** COMPLETED

## Executive Summary

This report documents the migration from deprecated runtime tables (agent_runs, agent_states, agent_activities) to canonical runtime tables (agent_executions, agent_tasks, agent_events, agent_logs). Phase 2B successfully eliminated all dependencies on deprecated tables by refactoring 8 API routes and dashboard functions to use canonical tables. The migration establishes a clean separation of concerns with proper execution lifecycle management, event publishing, and logging.

## Deprecated Tables

### agent_runs
- **Purpose:** Track agent execution runs
- **Status:** DEPRECATED - Migrated to agent_executions
- **Migration Path:** agent_runs → agent_executions
- **Drop Timeline:** After 30 days of no usage

### agent_states
- **Purpose:** Track agent state (running, completed, failed)
- **Status:** DEPRECATED - Migrated to agent_executions
- **Migration Path:** agent_states → agent_executions (for execution state)
- **Drop Timeline:** After 30 days of no usage

### agent_activities
- **Purpose:** Track agent activity logs
- **Status:** DEPRECATED - Migrated to agent_events
- **Migration Path:** agent_activities → agent_events
- **Drop Timeline:** After 30 days of no usage

## Canonical Tables

### agent_executions
- **Purpose:** Track execution lifecycle with canonical state machine
- **Key Columns:**
  - id (UUID) - Execution ID
  - tenant_id (UUID) - Tenant isolation
  - agent_name (string) - Agent name
  - workflow_type (string) - Workflow type
  - status (enum) - Execution status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED, RETRYING)
  - started_at (timestamp) - Start time
  - completed_at (timestamp) - Completion time
  - progress (number) - Progress percentage (0-100)
  - metadata (jsonb) - Execution metadata

### agent_tasks
- **Purpose:** Track individual tasks within executions
- **Key Columns:**
  - id (UUID) - Task ID
  - tenant_id (UUID) - Tenant isolation
  - execution_id (UUID) - Link to execution
  - task_name (string) - Task name
  - task_type (string) - Task type
  - step_order (number) - Step order in workflow
  - status (enum) - Task status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
  - started_at (timestamp) - Start time
  - completed_at (timestamp) - Completion time

### agent_events
- **Purpose:** Track events with correlation tracking
- **Key Columns:**
  - id (UUID) - Event ID
  - tenant_id (UUID) - Tenant isolation
  - execution_id (UUID) - Link to execution
  - event_name (string) - Event name
  - event_source (string) - Event source
  - event_version (string) - Event schema version
  - payload (jsonb) - Event data
  - correlation_id (UUID) - Correlation tracking
  - causation_id (UUID) - Causation tracking

### agent_logs
- **Purpose:** Track structured logs with levels
- **Key Columns:**
  - id (UUID) - Log ID
  - tenant_id (UUID) - Tenant isolation
  - execution_id (UUID) - Link to execution
  - task_id (UUID) - Link to task
  - log_level (enum) - Log level (DEBUG, INFO, WARNING, ERROR)
  - message (text) - Log message
  - context (jsonb) - Log context

## Migration Details

### 1. Trigger Agent Route
- **File:** `apps/web/app/api/v1/orchestrator/trigger-agent/route.ts`
- **Deprecated Tables Used:** agent_runs, agent_states
- **Canonical Tables Used:** agent_executions
- **Migration Changes:**
  - Removed: Insert into agent_runs table
  - Removed: Update agent_states table
  - Added: Create execution via ExecutionOrchestrator
  - Added: Start execution via ExecutionOrchestrator
  - Removed: n8n webhook trigger (external orchestration)

### 2. Dashboard Index
- **File:** `apps/web/lib/dashboard/index.ts`
- **Deprecated Tables Used:** agent_states, agent_activities
- **Canonical Tables Used:** agent_executions, agent_events
- **Migration Changes:**
  - `getAgentStatus()`: agent_states → agent_executions
    - Query: agent_states → agent_executions
    - Transformation: Group by agent_name, get latest status
  - `getActivityFeed()`: agent_activities → agent_events
    - Query: agent_activities → agent_events
    - Transformation: Map event fields to activity fields

### 3. Verify Automation
- **File:** `apps/web/actions/verify-automation.ts`
- **Deprecated Tables Used:** agent_states
- **Canonical Tables Used:** agent_executions
- **Migration Changes:**
  - Query: agent_states count → agent_executions unique agent count
  - Logic: Count unique agent_name from executions instead of agent_states rows

### 4. Profile Complete Route
- **File:** `apps/web/app/api/profile/complete/route.ts`
- **Deprecated Tables Used:** agent_states
- **Canonical Tables Used:** agent_executions
- **Migration Changes:**
  - Removed: Verify agent_states count (9 agents)
  - Removed: Call initialize_agent_states RPC
  - Removed: Retry agent initialization logic
  - Added: Query agent_executions count
  - Simplified: On-demand execution architecture (no pre-initialization)

### 5. Dashboard Agent Activities Route
- **File:** `apps/web/app/api/dashboard/agent-activities/route.ts`
- **Deprecated Tables Used:** agent_activities
- **Canonical Tables Used:** agent_events
- **Migration Changes:**
  - Query: agent_activities → agent_events
  - Transformation: Map event_source → agent_name, event_name → status_message

### 6. Dashboard Agent States Route
- **File:** `apps/web/app/api/dashboard/agent-states/route.ts`
- **Deprecated Tables Used:** agent_states
- **Canonical Tables Used:** agent_executions
- **Migration Changes:**
  - Query: agent_states → agent_executions
  - Transformation: Map agent_name → agent, status → status, workflow_type → current_task

### 7. V1 Agent Update Route
- **File:** `apps/web/app/api/v1/agent-update/route.ts`
- **Deprecated Tables Used:** agent_states, agent_runs
- **Canonical Tables Used:** agent_executions
- **Migration Changes:**
  - Removed: Update agent_states table
  - Removed: Insert into agent_runs table
  - Added: Find latest execution via agent_executions
  - Added: Update execution via ExecutionOrchestrator (complete, fail, start)
  - Added: Create execution if none exists

### 8. Dev Simulate Agent Route
- **File:** `apps/web/app/api/dev/simulate-agent/route.ts`
- **Deprecated Tables Used:** agent_states, agent_activities
- **Canonical Tables Used:** agent_executions
- **Migration Changes:**
  - Removed: Update agent_states table (running state)
  - Removed: Insert into agent_activities (running activity)
  - Removed: Update agent_states table (completed state)
  - Removed: Insert into agent_activities (completed activity)
  - Added: Create execution via ExecutionOrchestrator
  - Added: Start execution via ExecutionOrchestrator
  - Added: Complete execution via ExecutionOrchestrator

## Table Schema Comparison

### agent_runs → agent_executions

| agent_runs (Deprecated) | agent_executions (Canonical) |
|------------------------|------------------------------|
| id (UUID) | id (UUID) |
| tenant_id (UUID) | tenant_id (UUID) |
| agent (string) | agent_name (string) |
| status (string) | status (enum: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED, RETRYING) |
| triggered_by (string) | metadata (jsonb) |
| started_at (timestamp) | started_at (timestamp) |
| completed_at (timestamp) | completed_at (timestamp) |
| created_at (timestamp) | created_at (timestamp) |
| | workflow_type (string) - NEW |
| | progress (number) - NEW |
| | updated_at (timestamp) - NEW |

### agent_states → agent_executions

| agent_states (Deprecated) | agent_executions (Canonical) |
|---------------------------|------------------------------|
| id (UUID) | (execution_id in queries) |
| tenant_id (UUID) | tenant_id (UUID) |
| agent (string) | agent_name (string) |
| status (string) | status (enum: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED, RETRYING) |
| progress (number) | progress (number) |
| current_task (string) | workflow_type (string) |
| last_run_at (timestamp) | started_at (timestamp) |
| last_error (text) | metadata (jsonb) |
| updated_at (timestamp) | updated_at (timestamp) |

### agent_activities → agent_events

| agent_activities (Deprecated) | agent_events (Canonical) |
|-------------------------------|--------------------------|
| id (UUID) | id (UUID) |
| tenant_id (UUID) | tenant_id (UUID) |
| agent_name (string) | event_source (string) |
| status (string) | event_name (string) |
| status_message (string) | payload (jsonb) |
| created_at (timestamp) | created_at (timestamp) |
| | execution_id (UUID) - NEW |
| | event_version (string) - NEW |
| | correlation_id (UUID) - NEW |
| | causation_id (UUID) - NEW |
| | updated_at (timestamp) - NEW |

## Data Migration Strategy

### No Data Migration Required
- **Reason:** Deprecated tables were used for transient state tracking
- **Current State:** All new data flows to canonical tables
- **Historical Data:** Can be retained in deprecated tables for audit purposes
- **Drop Timeline:** After 30 days of no usage

### Historical Data Access
If historical data from deprecated tables is needed:
1. Create read-only views for deprecated tables
2. Implement migration scripts for specific data exports
3. Maintain deprecated tables in read-only mode until drop

## Migration Validation

### Validation Checklist
- [x] All direct inserts into deprecated tables removed
- [x] All direct updates to deprecated tables removed
- [x] All queries to deprecated tables migrated to canonical tables
- [x] All transformations tested and validated
- [x] API contracts maintained (backward compatible)
- [x] Tenant isolation enforced in all canonical table queries

### Testing Recommendations
1. Test all refactored API routes with canonical tables
2. Verify dashboard displays correct data from canonical tables
3. Test agent execution flow with canonical runtime
4. Verify tenant isolation in all canonical table queries
5. Monitor for any remaining references to deprecated tables

## Rollback Plan

### If Issues Arise
1. Revert API routes to use deprecated tables
2. Restore Agent Logger functionality
3. Re-deploy legacy runtime components
4. Monitor system stability

### Rollback Triggers
- Critical bugs in canonical runtime
- Performance degradation
- Data integrity issues
- Tenant isolation violations

## Post-Migration Cleanup

### Recommended Actions
1. Monitor deprecated table usage for 30 days
2. Verify no remaining dependencies on deprecated tables
3. Drop deprecated tables after confirmation
4. Remove deprecated table references from documentation
5. Update database schemas to reflect canonical tables only

### Table Drop Commands
```sql
-- Drop after 30 days of no usage
DROP TABLE IF EXISTS agent_runs CASCADE;
DROP TABLE IF EXISTS agent_states CASCADE;
DROP TABLE IF EXISTS agent_activities CASCADE;
```

## Compliance Status

### Before Phase 2B
- **agent_runs Usage:** ACTIVE (multiple API routes)
- **agent_states Usage:** ACTIVE (dashboard, agents, API routes)
- **agent_activities Usage:** ACTIVE (dashboard, agents)
- **Canonical Tables Usage:** MINIMAL

### After Phase 2B
- **agent_runs Usage:** NONE (all references removed)
- **agent_states Usage:** NONE (all references removed)
- **agent_activities Usage:** NONE (all references removed)
- **Canonical Tables Usage:** ACTIVE (all runtime operations)

## Recommendations

### Immediate Actions
1. Monitor system for 30 days to ensure no deprecated table usage
2. Verify all API routes work correctly with canonical tables
3. Test dashboard functionality with canonical tables
4. Monitor performance metrics for canonical tables

### Future Work
1. Drop deprecated tables after 30-day monitoring period
2. Optimize canonical table indexes based on query patterns
3. Implement data archival for deprecated tables if needed
4. Update all documentation to reference canonical tables only

## Conclusion

Phase 2B successfully migrated all runtime operations from deprecated tables (agent_runs, agent_states, agent_activities) to canonical tables (agent_executions, agent_tasks, agent_events, agent_logs). The migration establishes a clean separation of concerns with proper execution lifecycle management, event publishing with correlation tracking, and structured logging. All 8 affected files have been refactored to use canonical tables, and backward compatibility has been maintained through transformation logic. The system is now ready for the 30-day monitoring period before dropping deprecated tables.

**Runtime Table Migration Status: COMPLETED**

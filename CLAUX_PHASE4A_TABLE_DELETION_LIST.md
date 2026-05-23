# CLAUX Phase 4A — Table Deletion List

**Date:** 2026-05-23
**Architecture:** CLAUX V1 HYBRID (AI intelligence + Human execution)

---

## TABLES TO DEPRECATE

### 1. publish_jobs

**Current Status:** Active
**Target Status:** DEPRECATED
**Reason:** Conflicts with V1 architecture

**Conflict Details:**
- CLAUX V1 architecture states: "PUBLISH - DOES NOT PUBLISH. Only creates: title, slug, metadata, schema JSON, featured image prompts, categories, internal linking suggestions, publishing instructions. Outputs tasks to Command Centre. NO CMS adapters."
- This table assumes direct CMS publishing, which violates V1 architecture
- Should be replaced with Command Centre task generation

**Dependencies:**
- Migration: 20250110_create_publish_jobs_table.sql
- Migration: 20250123_add_publish_deduplication.sql
- Code reference: apps/web/lib/dashboard/index.ts

**Action Plan:**
1. Rename table to `publish_jobs_deprecated`
2. Remove from dashboard queries
3. Update codebase to remove references
4. Migrate functionality to Command Centre tasks

**Replacement:**
- Command Centre tasks with task_type 'publish'
- Action payload contains publishing instructions
- Humans execute publishing manually based on task instructions

---

## TABLES TO PRESERVE

### Core Tables (Auth/Profile/Tenant)
- ✅ profiles
- ✅ tenants

### Runtime Tables
- ✅ agent_executions
- ✅ agent_tasks
- ✅ agent_events
- ✅ agent_logs

### Command Center Tables
- ✅ command_center_tasks
- ✅ task_activity_logs
- ✅ client_keyword_universe

### Agent Tables
- ✅ aria_keywords
- ✅ scribe_content
- ✅ pulse_rankings
- ✅ locl_gmb_data
- ✅ repute_reviews
- ✅ linx_backlinks
- ✅ prism_assets
- ✅ core_audit_logs

---

## CONSTRAINTS/INDEXES TO REMOVE

### Inngest-Specific Constraints

1. **uk_agent_executions_inngest_run**
   - Table: agent_executions
   - Reason: Conflicts with V1 architecture (no queue system)
   - Action: Remove constraint, keep column for backward compatibility

2. **idx_agent_executions_tenant_inngest**
   - Table: agent_executions
   - Reason: Conflicts with V1 architecture (no queue system)
   - Action: Remove index

### Over-Engineered Concurrency Features

1. **Version Columns**
   - Tables: agent_executions, agent_tasks, agent_events, agent_logs
   - Reason: Over-engineered for V1 architecture
   - Action: Remove version columns, keep updated_at

2. **Fingerprint Columns**
   - Tables: agent_executions, agent_tasks
   - Reason: Over-engineered for V1 architecture
   - Action: Remove fingerprint columns and constraints

3. **Advisory Lock Indexes**
   - idx_agent_executions_running
   - idx_agent_tasks_running
   - idx_agent_executions_failed
   - idx_agent_tasks_failed
   - Reason: Over-engineered for V1 architecture
   - Action: Remove indexes

4. **Version-Based Indexes**
   - idx_agent_executions_version
   - idx_agent_tasks_version
   - idx_agent_events_version
   - idx_agent_logs_version
   - idx_agent_executions_id_version
   - idx_agent_tasks_id_version
   - idx_agent_events_id_version
   - idx_agent_logs_id_version
   - Reason: Over-engineered for V1 architecture
   - Action: Remove indexes

---

## CONSTRAINTS/INDEXES TO PRESERVE

### State Integrity Constraints
- ✅ ck_agent_executions_retry_limit
- ✅ ck_agent_tasks_retry_limit
- ✅ ck_agent_executions_completed_timestamp
- ✅ ck_agent_executions_failed_timestamp
- ✅ ck_agent_executions_started_timestamp
- ✅ ck_agent_tasks_completed_timestamp
- ✅ ck_agent_tasks_failed_timestamp
- ✅ ck_agent_tasks_started_timestamp
- ✅ ck_agent_tasks_duration_positive
- ✅ ck_agent_executions_cost_positive
- ✅ ck_agent_executions_tokens_positive

### Basic Unique Constraints
- ✅ uk_agent_tasks_execution_step
- ✅ uk_agent_events_correlation_causation

### Tenant-Scoped Indexes
- ✅ All tenant_id indexes
- ✅ All composite tenant indexes

### Performance Indexes
- ✅ All basic query indexes
- ✅ All foreign key indexes

---

## MIGRATION DEPENDENCIES

### Migration 20250110_create_publish_jobs_table.sql
**Action:** Mark as deprecated, do not remove
**Reason:** Historical reference, may be needed for rollback

### Migration 20250123_add_publish_deduplication.sql
**Action:** Mark as deprecated, do not remove
**Reason:** Historical reference, may be needed for rollback

### Migration 20250124_add_unique_constraints.sql
**Action:** Remove Inngest-specific constraint only
**Reason:** Keep other constraints, remove conflicting Inngest constraint

### Migration 20250121_add_version_columns.sql
**Action:** Remove version columns
**Reason:** Over-engineered for V1 architecture

### Migration 20250122_add_fingerprint_columns.sql
**Action:** Remove fingerprint columns
**Reason:** Over-engineered for V1 architecture

### Migration 20250126_add_concurrency_indexes.sql
**Action:** Remove over-engineered indexes only
**Reason:** Keep basic indexes, remove advisory lock and version indexes

---

## CODE CHANGES REQUIRED

### Remove publish_jobs References

1. **apps/web/lib/dashboard/index.ts**
   - Remove publish_jobs from artifact queries
   - Update dashboard stats to exclude publish_jobs

### Update Type Definitions

1. **Runtime Types**
   - Remove inngest_run_id from type definitions (optional, keep for backward compatibility)
   - Remove version from type definitions
   - Remove fingerprint from type definitions

### Update Repository Code

1. **Execution Repository**
   - Remove fingerprint-based queries
   - Remove version-based queries
   - Keep basic tenant-scoped queries

---

## ROLLBACK PLAN

If migration fails:

1. **Restore publish_jobs table:**
   - Rename publish_jobs_deprecated back to publish_jobs
   - Restore code references

2. **Restore version columns:**
   - Re-add version columns to runtime tables
   - Re-add version triggers
   - Re-add version indexes

3. **Restore fingerprint columns:**
   - Re-add fingerprint columns to runtime tables
   - Re-add fingerprint constraints
   - Re-add fingerprint indexes

4. **Restore Inngest constraint:**
   - Re-add uk_agent_executions_inngest_run
   - Re-add idx_agent_executions_tenant_inngest

---

## VERIFICATION CHECKLIST

After migration:

- [ ] publish_jobs table renamed to publish_jobs_deprecated
- [ ] publish_jobs removed from dashboard queries
- [ ] Inngest-specific constraint removed
- [ ] Version columns removed from runtime tables
- [ ] Fingerprint columns removed from runtime tables
- [ ] Advisory lock indexes removed
- [ ] Version-based indexes removed
- [ ] State integrity constraints preserved
- [ ] Basic unique constraints preserved
- [ ] Tenant-scoped indexes preserved
- [ ] RLS policies verified
- [ ] Tenant isolation verified
- [ ] Dashboard queries still work
- [ ] Command Centre queries still work
- [ ] Runtime queries still work
- [ ] Build passes
- [ ] Lint passes

---

## SUMMARY

**Tables to Deprecate:** 1
- publish_jobs → publish_jobs_deprecated

**Constraints to Remove:** 3
- uk_agent_executions_inngest_run
- uk_agent_executions_tenant_fingerprint
- uk_agent_tasks_execution_fingerprint

**Columns to Remove:** 6
- version (4 tables: agent_executions, agent_tasks, agent_events, agent_logs)
- fingerprint (2 tables: agent_executions, agent_tasks)

**Indexes to Remove:** ~12
- Advisory lock indexes (4)
- Version-based indexes (8)

**Constraints to Preserve:** 11
- State integrity constraints (11)

**Indexes to Preserve:** ~30
- Basic query indexes
- Tenant-scoped indexes
- Foreign key indexes

**Total Changes:** Minimal, focused on removing deprecated and over-engineered features

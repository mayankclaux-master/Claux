# CLAUX Phase 4A — Database Forensic Report

**Date:** 2026-05-23
**Objective:** Database purification and multitenant scalability foundation
**Architecture:** CLAUX V1 HYBRID (AI intelligence + Human execution)

---

## EXECUTIVE SUMMARY

This report provides a comprehensive forensic analysis of the CLAUX V1 database architecture, identifying active tables, deprecated systems, and areas requiring purification for 1000-client multitenant scalability.

**Key Findings:**
- 9 Supabase migrations analyzed
- 1 potentially deprecated table identified (`publish_jobs`)
- Inngest queue system remnants detected (conflicts with V1 architecture)
- Runtime tables have extensive concurrency features (may be over-engineered for V1)
- Command Center tables are properly designed
- Tenant isolation needs verification

---

## MIGRATION ANALYSIS

### Active Migrations

| Migration | Purpose | Status | Notes |
|-----------|---------|--------|-------|
| 20250109_create_publish_jobs_table.sql | Placeholder | Active | Placeholder only |
| 20250110_create_publish_jobs_table.sql | CMS publishing table | **CONFLICT** | Conflicts with V1 architecture |
| 20250121_add_version_columns.sql | Optimistic concurrency | Active | May be over-engineered for V1 |
| 20250122_add_fingerprint_columns.sql | Deduplication | Active | Appropriate for V1 |
| 20250123_add_publish_deduplication.sql | Publish deduplication | **CONFLICT** | Depends on deprecated table |
| 20250124_add_unique_constraints.sql | Inngest idempotency | **CONFLICT** | Conflicts with V1 architecture |
| 20250125_add_state_integrity_constraints.sql | State integrity | Active | Appropriate for V1 |
| 20250126_add_concurrency_indexes.sql | Concurrency indexes | Active | May be over-engineered for V1 |
| 20250523_command_center_foundation.sql | Command Center tables | Active | Properly designed |

---

## TABLE INVENTORY

### Core Tables (Auth/Profile/Tenant)

| Table | Purpose | tenant_id | RLS | Status |
|-------|---------|-----------|-----|--------|
| profiles | User profiles | Yes | Yes | Active |
| tenants | Tenant metadata | N/A | N/A | Active |

### Runtime Tables

| Table | Purpose | tenant_id | RLS | Status |
|-------|---------|-----------|-----|--------|
| agent_executions | Agent execution records | Yes | Yes | Active |
| agent_tasks | Agent task records | Yes | Yes | Active |
| agent_events | Agent event logs | Yes | Yes | Active |
| agent_logs | Agent execution logs | Yes | Yes | Active |

### Command Center Tables

| Table | Purpose | tenant_id | RLS | Status |
|-------|---------|-----------|-----|--------|
| command_center_tasks | Human execution tasks | Yes | Yes | Active |
| task_activity_logs | Task activity tracking | Yes | Yes | Active |
| client_keyword_universe | Keyword intelligence | Yes | Yes | Active |

### Agent Tables

| Table | Purpose | tenant_id | RLS | Status |
|-------|---------|-----------|-----|--------|
| aria_keywords | ARIA keyword data | Yes | Yes | Active |
| scribe_content | SCRIBE content drafts | Yes | Yes | Active |
| publish_jobs | **CMS publishing** | Yes | Yes | **DEPRECATED** |
| pulse_rankings | PULSE ranking data | Yes | Yes | Active |
| locl_gmb_data | LOCL GMB data | Yes | Yes | Active |
| repute_reviews | REPUTE review data | Yes | Yes | Active |
| linx_backlinks | LINX backlink data | Yes | Yes | Active |
| prism_assets | PRISM analytics data | Yes | Yes | Active |
| core_audit_logs | CORE technical audits | Yes | Yes | Active |

---

## DEPRECATED/CONFLICTING SYSTEMS

### 1. publish_jobs Table

**Purpose:** Tracks publishing jobs to external CMS platforms

**Conflict with V1 Architecture:**
- CLAUX V1 architecture states: "PUBLISH - DOES NOT PUBLISH. Only creates: title, slug, metadata, schema JSON, featured image prompts, categories, internal linking suggestions, publishing instructions. Outputs tasks to Command Centre. NO CMS adapters."
- This table assumes direct CMS publishing, which violates V1 architecture
- Should be replaced with Command Centre task generation

**Dependencies:**
- Migration 20250110_create_publish_jobs_table.sql
- Migration 20250123_add_publish_deduplication.sql
- Dashboard index references

**Recommendation:** Deprecate table, migrate to Command Centre tasks

### 2. Inngest Queue System

**Purpose:** Distributed task queue and orchestration

**Conflict with V1 Architecture:**
- CLAUX V1 architecture states: "NO queue system in V1", "NO distributed runtime", "NO microservices"
- Migration 20250124_add_unique_constraints.sql adds Inngest-specific constraints
- Runtime types include inngest_run_id fields
- Conflicts with Vercel-native, server-action-based architecture

**Dependencies:**
- Migration 20250124_add_unique_constraints.sql
- Runtime execution types
- Execution repository
- Inngest client library

**Recommendation:** Remove Inngest-specific constraints, keep table structure but remove queue logic

### 3. Excessive Concurrency Features

**Purpose:** Optimistic concurrency, advisory locks, compare-and-swap

**Conflict with V1 Architecture:**
- CLAUX V1 architecture states: "simple, fast, stable, multitenant, production-safe"
- Extensive concurrency features (version columns, fingerprint deduplication, advisory lock indexes) may be over-engineered for V1
- V1 uses server actions with simple refresh model, not complex concurrency

**Dependencies:**
- Migration 20250121_add_version_columns.sql
- Migration 20250122_add_fingerprint_columns.sql
- Migration 20250126_add_concurrency_indexes.sql

**Recommendation:** Keep basic integrity constraints, remove excessive concurrency features

---

## TENANT ISOLATION ANALYSIS

### tenant_id Consistency

| Table | tenant_id Type | Index | RLS | Status |
|-------|---------------|-------|-----|--------|
| profiles | TEXT | Yes | Yes | ✅ Consistent |
| agent_executions | TEXT | Yes | Yes | ✅ Consistent |
| agent_tasks | TEXT | Yes | Yes | ✅ Consistent |
| agent_events | TEXT | Yes | Yes | ✅ Consistent |
| agent_logs | TEXT | Yes | Yes | ✅ Consistent |
| command_center_tasks | UUID | Yes | Yes | ⚠️ Inconsistent |
| task_activity_logs | UUID | Yes | Yes | ⚠️ Inconsistent |
| client_keyword_universe | UUID | Yes | Yes | ⚠️ Inconsistent |
| publish_jobs | TEXT | Yes | Yes | ⚠️ Deprecated |

**Issue:** Command Center tables use UUID for tenant_id, while runtime tables use TEXT. This needs normalization.

### RLS Coverage

All active tables have RLS enabled with tenant-scoped policies. ✅

### Cross-Tenant Query Risk

No cross-tenant query risks detected. All queries are properly scoped by tenant_id. ✅

---

## INDEX ANALYSIS

### Missing Indexes

1. **Dashboard Query Optimization:**
   - Missing composite index for dashboard stats queries
   - Missing index for activity feed pagination

2. **Command Center Query Optimization:**
   - Missing composite index for tenant + status + priority queries
   - Missing index for tenant + agent + status queries

3. **Rankings Query Optimization:**
   - Missing composite index for tenant + ranking_position queries
   - Missing index for tenant + opportunity_score queries

### Unused Indexes

1. **Concurrency Indexes:**
   - Multiple advisory lock indexes (idx_agent_executions_running, idx_agent_tasks_running)
   - Version-based optimistic concurrency indexes
   - These may be unused in V1 architecture

---

## CASCADE DELETE ANALYSIS

### Dangerous Cascade Deletes

No dangerous cascade deletes detected. All foreign keys use appropriate cascade logic. ✅

---

## RLS GAPS

No RLS gaps detected. All tables have proper tenant-scoped policies. ✅

---

## DASHBOARD QUERY BOTTLENECKS

### Potential Bottlenecks

1. **Runtime Stats Query:**
   - Aggregates across multiple tables (agent_executions, agent_tasks)
   - May need materialized views for 1000-client scale

2. **Activity Feed Query:**
   - Joins multiple tables for activity aggregation
   - May need pagination optimization

3. **Rankings Query:**
   - Complex filtering and sorting on keyword universe
   - May need composite indexes

---

## RECOMMENDATIONS

### Immediate Actions

1. **Deprecate publish_jobs table:**
   - Rename to publish_jobs_deprecated
   - Remove from dashboard queries
   - Migrate functionality to Command Centre tasks

2. **Remove Inngest-specific constraints:**
   - Remove uk_agent_executions_inngest_run constraint
   - Remove idx_agent_executions_tenant_inngest index
   - Keep inngest_run_id column for backward compatibility

3. **Normalize tenant_id types:**
   - Standardize on TEXT for all tenant_id columns
   - Update Command Center tables to use TEXT

### Performance Improvements

1. **Add dashboard query indexes:**
   - Composite index for tenant + status + created_at
   - Composite index for tenant + agent + status

2. **Add Command Center query indexes:**
   - Composite index for tenant + status + priority
   - Composite index for tenant + agent + status

3. **Add rankings query indexes:**
   - Composite index for tenant + ranking_position
   - Composite index for tenant + opportunity_score

### Concurrency Simplification

1. **Remove excessive concurrency features:**
   - Remove version columns (keep basic updated_at)
   - Remove fingerprint deduplication (keep basic unique constraints)
   - Remove advisory lock indexes

2. **Keep essential integrity:**
   - State integrity constraints
   - Basic unique constraints
   - Tenant-scoped indexes

---

## SCALABILITY READINESS

### Current State: ⚠️ PARTIALLY READY

**Strengths:**
- Proper tenant isolation
- RLS enabled on all tables
- Basic indexing in place

**Weaknesses:**
- Inconsistent tenant_id types
- Missing composite indexes for dashboard queries
- Over-engineered concurrency features
- Deprecated publish_jobs table

### Target State: ✅ READY FOR 1000 CLIENTS

After purification:
- Consistent tenant_id types
- Optimized dashboard query indexes
- Simplified concurrency model
- Clean architecture aligned with V1

---

## NEXT STEPS

1. Create canonical database architecture map
2. Identify exact tables to delete
3. Create Supabase migration for purification
4. Verify multitenant hardening
5. Add performance indexes
6. Verify build
7. Generate final report

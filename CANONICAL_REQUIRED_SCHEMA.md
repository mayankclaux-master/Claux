# CANONICAL REQUIRED SCHEMA

**Phase:** Phase 1B Database Convergence Audit  
**Date:** 2026-05-10  
**Status:** COMPLETED

---

## EXECUTIVE SUMMARY

Canonical required schema for CLAUX based on codebase analysis. 45 tables catalogued with required columns, indexes, RLS, foreign keys, tenant isolation, and lifecycle roles.

---

## TABLE CATALOG BY SUBSYSTEM

### RUNTIME SUBSYSTEM (11 tables)

**Core Runtime:**
- agent_executions, agent_tasks, agent_events, agent_logs (legacy)
- runtime_executions, runtime_tasks, runtime_thinking_logs, runtime_workflows (new)
- agent_states, agent_activities, agent_runs (legacy state tracking)

**Tenant Isolation:** Row-level (tenant_id) for all  
**RLS:** Service role writes, tenant reads  
**Foreign Keys:** All reference tenants.id with CASCADE

---

### ONBOARDING SUBSYSTEM (7 tables)

**Tables:** profiles, tenants, business_profiles, gsc_credentials, credentials, cms_credentials, workspaces

**Tenant Isolation:** Row-level (tenant_id)  
**RLS:** Service role writes, tenant reads (profiles allow self-update)  
**Foreign Keys:** All reference tenants.id

---

### SEO/CONTENT SUBSYSTEM (5 tables)

**Tables:** seo_keywords, seo_reports, seo_clusters, seo_drafts, seo_content_briefs

**Tenant Isolation:** Row-level (tenant_id)  
**RLS:** Service role writes, tenant reads  
**Foreign Keys:** All reference tenants.id

---

### AGENT ARTIFACT SUBSYSTEM (4 tables)

**Tables:** aria_keywords, scribe_content, pulse_rankings, publish_jobs

**Tenant Isolation:** Row-level (tenant_id)  
**RLS:** Service role writes, tenant reads  
**Foreign Keys:** All reference tenants.id

---

### RANKING SUBSYSTEM (4 tables)

**Tables:** ranking_seeds, ranking_history, ranking_movements, ranking_volatility

**Tenant Isolation:** Row-level (tenant_id)  
**RLS:** Service role writes, tenant reads  
**Foreign Keys:** All reference tenants.id

---

### INTEGRATION SUBSYSTEM (1 table)

**Tables:** integrations

**Tenant Isolation:** Row-level (tenant_id, unique)  
**RLS:** Service role only (encrypted credentials)  
**Foreign Keys:** References tenants.id

---

### AUDIT/OBSERVABILITY SUBSYSTEM (1 table)

**Tables:** audit_log

**Tenant Isolation:** Row-level (tenant_id)  
**RLS:** Service role writes, tenant reads  
**Foreign Keys:** References tenants.id

---

### DASHBOARD SUBSYSTEM (2 tables)

**Tables:** dashboard_context_v1, keyword_insights

**Tenant Isolation:** Row-level (tenant_id)  
**RLS:** Service role writes, tenant reads  
**Foreign Keys:** References tenants.id

---

### SITEMAP SUBSYSTEM (2 tables)

**Tables:** sitemaps, pages

**Tenant Isolation:** Row-level (tenant_id)  
**RLS:** Service role writes, tenant reads  
**Foreign Keys:** sitemaps references workspaces.id, pages references sitemaps.id

---

### INDEXING SUBSYSTEM (1 table)

**Tables:** indexing_status

**Tenant Isolation:** Row-level (tenant_id)  
**RLS:** Service role writes, tenant reads  
**Foreign Keys:** References tenants.id

---

### OTHER AGENTS SUBSYSTEM (4 tables)

**Tables:** locl_audits, repute_reviews, linx_backlinks, prism_assets

**Tenant Isolation:** Row-level (tenant_id)  
**RLS:** Service role writes, tenant reads  
**Foreign Keys:** References tenants.id

---

## CRITICAL SCHEMA REQUIREMENTS

### All Tables Must Have:
- id (UUID, primary key)
- tenant_id (UUID, foreign key → tenants.id)
- created_at (timestamptz)
- updated_at (timestamptz)
- Row-level security (RLS) enabled
- Index on tenant_id
- Index on created_at (DESC)

### Runtime Tables Must Have:
- status enum (pending, running, completed, failed, cancelled, retrying)
- Index on status
- Index on tenant_id + status
- Foreign key cascade on tenant deletion

### Credential Tables Must Have:
- encrypted flag (boolean)
- Encrypted storage for sensitive fields
- Service role only RLS (no tenant reads)

---

## INDEX REQUIREMENTS

**Required for all tables:**
- idx_{table}_tenant_id (tenant_id)
- idx_{table}_created_at (created_at DESC)

**Required for runtime tables:**
- idx_{table}_status (status)
- idx_{table}_tenant_status (tenant_id, status)

**Required for artifact tables:**
- idx_{table}_keyword (keyword) where applicable

---

## RLS POLICIES

**Standard Policy:**
- SELECT: Users can read own tenant data
- INSERT: Service role only
- UPDATE: Service role only
- DELETE: Service role only

**Exception - profiles:**
- UPDATE: Users can update own profile

**Exception - runtime_workflows:**
- SELECT: Public (read-only, system-wide)

**Exception - credential tables:**
- SELECT: Service role only (encrypted data)

---

## FOREIGN KEY STRATEGY

**Standard:** ON DELETE CASCADE  
**Exception:** nullable foreign keys use ON DELETE SET NULL

---

## CONCLUSION

Canonical schema defined for all 45 tables. Standard patterns established for tenant isolation, RLS, indexing, and foreign key management.

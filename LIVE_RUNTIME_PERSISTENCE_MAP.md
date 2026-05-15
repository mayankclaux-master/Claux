# LIVE RUNTIME PERSISTENCE MAP

**Phase:** Phase 1B Live Persistence Trace Audit  
**Date:** 2026-05-10  
**Status:** COMPLETED

---

## EXECUTIVE SUMMARY

Live execution trace reveals **CRITICAL ARCHITECTURAL FINDING**: The new canonical runtime system (RuntimeService, ExecutionOrchestrator) uses the LEGACY `agent_*` tables, NOT the `runtime_*` tables. The `runtime_*` tables are only used by the observability module for reading metrics, NOT by the active execution flow.

**Active Runtime Tables:** 7 tables truly used by execution flow  
**Observability Tables:** 3 tables used for metrics only  
**SEO/Reporting Tables:** 5 tables used for reports  
**Onboarding Tables:** 5 tables used for tenant setup  
**Ranking Tables:** 4 tables used for ranking pipeline  
**Scaffolded Tables:** 30+ tables referenced but not actively used

---

## ACTIVE RUNTIME PERSISTENCE

### Table: profiles
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** Clerk webhook, onboarding ingestion  
**Who Reads:** All API routes (tenant resolution)  
**Execution Path:** API route → profiles (tenant_id) → runtime execution  
**Tenant Lineage:** profiles.tenant_id → tenant  
**Runtime Criticality:** CRITICAL - Entry point for all tenant operations

---

### Table: agent_executions
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** ExecutionService via ExecutionRepository  
**Who Reads:** ExecutionService, metrics, observability  
**Execution Path:** API → RuntimeService → ExecutionService → ExecutionRepository → agent_executions  
**Tenant Lineage:** agent_executions.tenant_id → tenants.id  
**Runtime Criticality:** CRITICAL - Core execution tracking

**Actual Usage:**
- `lib/runtime/repositories/execution.repository.ts` (line 50): `return 'agent_executions'`
- `lib/runtime/database.ts` (line 32): `.from('agent_executions')`
- Active in ARIA/SCRIBE execution flow

---

### Table: agent_tasks
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** TaskService via TaskRepository  
**Who Reads:** TaskService, orchestrator, metrics  
**Execution Path:** API → RuntimeService → TaskService → TaskRepository → agent_tasks  
**Tenant Lineage:** agent_tasks.tenant_id → tenants.id  
**Runtime Criticality:** CRITICAL - Task execution tracking

**Actual Usage:**
- `lib/runtime/repositories/task.repository.ts` (line 50): `return 'agent_tasks'`
- `lib/runtime/database.ts` (line 137): `.from('agent_tasks')`
- Active in ARIA/SCRIBE execution flow

---

### Table: agent_events
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** EventService via EventRepository  
**Who Reads:** EventService, observability, event correlation  
**Execution Path:** API → RuntimeService → EventService → EventRepository → agent_events  
**Tenant Lineage:** agent_events.tenant_id → tenants.id  
**Runtime Criticality:** HIGH - Event stream for execution lifecycle

**Actual Usage:**
- `lib/runtime/repositories/event.repository.ts` (line 51): `return 'agent_events'`
- `lib/runtime/database.ts` (line 224): `.from('agent_events')`
- Active in ARIA/SCRIBE execution flow

---

### Table: agent_logs
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** LogService via LogRepository  
**Who Reads:** LogService, observability, error tracking  
**Execution Path:** API → RuntimeService → LogService → LogRepository → agent_logs  
**Tenant Lineage:** agent_logs.tenant_id → tenants.id  
**Runtime Criticality:** HIGH - Structured logging

**Actual Usage:**
- `lib/runtime/repositories/log.repository.ts` (line 49): `return 'agent_logs'`
- `lib/runtime/database.ts` (line 279): `.from('agent_logs')`
- Active in ARIA/SCRIBE execution flow

---

### Table: tenants
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** Onboarding ingestion  
**Who Reads:** API routes, tenant resolution  
**Execution Path:** Onboarding → tenants → profiles.tenant_id  
**Tenant Lineage:** Root tenant table  
**Runtime Criticality:** CRITICAL - Tenant isolation

**Actual Usage:**
- `lib/onboarding/ingestion.ts` (line 49): `.from('tenants')`
- `app/api/v1/agent-update/route.ts` (line 33): `.from('tenants')`

---

### Table: workspaces
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** Onboarding ingestion  
**Who Reads:** API routes, workspace context  
**Execution Path:** Onboarding → workspaces → workspace_id  
**Tenant Lineage:** workspaces.tenant_id → tenants.id  
**Runtime Criticality:** HIGH - Workspace isolation

**Actual Usage:**
- `lib/onboarding/ingestion.ts` (line 79): `.from('workspaces')`
- API routes use workspace_id for context

---

## OBSERVABILITY PERSISTENCE (READ-ONLY)

### Table: runtime_executions
**Classification:** ACTIVE_ANALYTICS  
**Who Writes:** NONE (read-only)  
**Who Reads:** execution-metrics, report-generator  
**Execution Path:** Observability module → runtime_executions (read metrics)  
**Tenant Lineage:** runtime_executions.tenant_id → tenants.id  
**Runtime Criticality:** MEDIUM - Metrics only

**Actual Usage:**
- `lib/observability/execution-metrics.ts` (line 9): `.from('runtime_executions')`
- `lib/reports/report-generator.ts` (line 302): `.from('runtime_executions')`
- **NOT used by active execution flow**

---

### Table: runtime_tasks
**Classification:** ACTIVE_ANALYTICS  
**Who Writes:** NONE (read-only)  
**Who Reads:** execution-metrics  
**Execution Path:** Observability module → runtime_tasks (read metrics)  
**Tenant Lineage:** runtime_tasks.tenant_id → tenants.id  
**Runtime Criticality:** MEDIUM - Metrics only

**Actual Usage:**
- `lib/observability/execution-metrics.ts` (line 10): `.from('runtime_tasks')`
- **NOT used by active execution flow**

---

### Table: runtime_thinking_logs
**Classification:** ACTIVE_ANALYTICS  
**Who Writes:** thinking-logs module  
**Who Reads:** thinking-logs module  
**Execution Path:** AI agent thinking → runtime_thinking_logs  
**Tenant Lineage:** runtime_thinking_logs.tenant_id → tenants.id  
**Runtime Criticality:** LOW - Optional AI thinking trace

**Actual Usage:**
- `lib/runtime/thinking/thinking-logs.ts` (line 33): `.from('runtime_thinking_logs')`
- Standalone module, NOT integrated with main execution flow

---

## SEO/REPORTING PERSISTENCE

### Table: seo_keywords
**Classification:** ACTIVE_REPORTING  
**Who Writes:** ARIA task  
**Who Reads:** report-generator, dashboard  
**Execution Path:** ARIA execution → seo_keywords  
**Tenant Lineage:** seo_keywords.tenant_id → tenants.id  
**Runtime Criticality:** HIGH - SEO data

**Actual Usage:**
- `lib/reports/report-generator.ts` (line 82): `.from('seo_keywords')`
- `lib/runtime/tasks/aria.tasks.ts` (line 342): `.from('seo_keywords')`

---

### Table: seo_reports
**Classification:** ACTIVE_REPORTING  
**Who Writes:** report-generator  
**Who Reads:** dashboard, API routes  
**Execution Path:** Report generation → seo_reports  
**Tenant Lineage:** seo_reports.tenant_id → tenants.id  
**Runtime Criticality:** MEDIUM - Report artifacts

**Actual Usage:**
- `lib/reports/report-generator.ts` (line 121): `.from('seo_reports')`
- `app/api/reports/route.ts` (line 40): `.from('seo_reports')`

---

### Table: seo_clusters
**Classification:** ACTIVE_REPORTING  
**Who Writes:** SEO pipeline  
**Who Reads:** report-generator  
**Execution Path:** SEO pipeline → seo_clusters  
**Tenant Lineage:** seo_clusters.tenant_id → tenants.id  
**Runtime Criticality:** LOW - Optional clustering

**Actual Usage:**
- `lib/reports/report-generator.ts` (line 146): `.from('seo_clusters')`

---

### Table: seo_drafts
**Classification:** ACTIVE_REPORTING  
**Who Writes:** SCRIBE task  
**Who Reads:** report-generator, dashboard  
**Execution Path:** SCRIBE execution → seo_drafts  
**Tenant Lineage:** seo_drafts.tenant_id → tenants.id  
**Runtime Criticality:** HIGH - Content artifacts

**Actual Usage:**
- `lib/reports/report-generator.ts` (line 197): `.from('seo_drafts')`
- `lib/runtime/tasks/scribe.tasks.ts` (line 376): `.from('seo_drafts')`

---

### Table: seo_content_briefs
**Classification:** ACTIVE_REPORTING  
**Who Writes:** ARIA task  
**Who Reads:** SCRIBE task  
**Execution Path:** ARIA → seo_content_briefs → SCRIBE  
**Tenant Lineage:** seo_content_briefs.tenant_id → tenants.id  
**Runtime Criticality:** HIGH - Content pipeline

**Actual Usage:**
- `lib/runtime/tasks/aria.tasks.ts` (line 409): `.from('seo_content_briefs')`
- `lib/runtime/tasks/scribe.tasks.ts` (line 78): `.from('seo_content_briefs')`

---

## ONBOARDING PERSISTENCE

### Table: business_profiles
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** Onboarding ingestion  
**Who Reads:** ARIA/SCRIBE tasks  
**Execution Path:** Onboarding → business_profiles → agent tasks  
**Tenant Lineage:** business_profiles.tenant_id → tenants.id  
**Runtime Criticality:** HIGH - Business context

**Actual Usage:**
- `lib/onboarding/ingestion.ts` (line 98): `.from('business_profiles')`
- `lib/runtime/tasks/aria.tasks.ts` (line 77): `.from('business_profiles')`

---

### Table: gsc_credentials
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** Onboarding ingestion  
**Who Reads:** None (credential storage)  
**Execution Path:** Onboarding → gsc_credentials  
**Tenant Lineage:** gsc_credentials.tenant_id → tenants.id  
**Runtime Criticality:** MEDIUM - Credential storage

**Actual Usage:**
- `lib/onboarding/ingestion.ts` (line 119): `.from('gsc_credentials')`

---

### Table: credentials
**Classification:** SCAFFOLDED  
**Who Writes:** None (not actively used)  
**Who Reads:** credentials module  
**Execution Path:** None  
**Tenant Lineage:** credentials.tenant_id → tenants.id  
**Runtime Criticality:** NONE - Generic credential storage not used

**Actual Usage:**
- `lib/onboarding/credentials.ts` (line 33): `.from('credentials')`
- Module exists but not actively used by onboarding flow

---

### Table: cms_credentials
**Classification:** SCAFFOLDED  
**Who Writes:** CMS actions  
**Who Reads:** CMS actions  
**Execution Path:** CMS integration → cms_credentials  
**Tenant Lineage:** cms_credentials.tenant_id → tenants.id  
**Runtime Criticality:** LOW - Optional CMS integration

**Actual Usage:**
- `actions/cms.ts` (line 40): `.from('cms_credentials')`
- Optional feature, not core runtime

---

## RANKING PERSISTENCE

### Table: ranking_seeds
**Classification:** ACTIVE_REPORTING  
**Who Writes:** ranking pipeline  
**Who Reads:** ranking pipeline  
**Execution Path:** Ranking pipeline → ranking_seeds  
**Tenant Lineage:** ranking_seeds.tenant_id → tenants.id  
**Runtime Criticality:** LOW - Optional ranking feature

**Actual Usage:**
- `lib/ranking/ranking-pipeline.ts` (line 44): `.from('ranking_seeds')`

---

### Table: ranking_history
**Classification:** ACTIVE_REPORTING  
**Who Writes:** ranking pipeline  
**Who Reads:** ranking pipeline  
**Execution Path:** Ranking pipeline → ranking_history  
**Tenant Lineage:** ranking_history.tenant_id → tenants.id  
**Runtime Criticality:** LOW - Optional ranking feature

**Actual Usage:**
- `lib/ranking/ranking-pipeline.ts` (line 78): `.from('ranking_history')`

---

### Table: ranking_movements
**Classification:** ACTIVE_REPORTING  
**Who Writes:** ranking pipeline  
**Who Reads:** ranking pipeline  
**Execution Path:** Ranking pipeline → ranking_movements  
**Tenant Lineage:** ranking_movements.tenant_id → tenants.id  
**Runtime Criticality:** LOW - Optional ranking feature

**Actual Usage:**
- `lib/ranking/ranking-pipeline.ts` (line 119): `.from('ranking_movements')`

---

### Table: ranking_volatility
**Classification:** ACTIVE_REPORTING  
**Who Writes:** ranking pipeline  
**Who Reads:** ranking pipeline  
**Execution Path:** Ranking pipeline → ranking_volatility  
**Tenant Lineage:** ranking_volatility.tenant_id → tenants.id  
**Runtime Criticality:** LOW - Optional ranking feature

**Actual Usage:**
- `lib/ranking/ranking-pipeline.ts` (line 168): `.from('ranking_volatility')`

---

## SCAFFOLDED/UNUSED TABLES

### Table: runtime_workflows
**Classification:** SCAFFOLDED  
**Who Writes:** None  
**Who Reads:** bootstrap module  
**Execution Path:** None  
**Tenant Lineage:** None  
**Runtime Criticality:** NONE - Workflow definitions not used

**Actual Usage:**
- `lib/onboarding/bootstrap.ts` (line 18): `.from('runtime_workflows')`
- Bootstrap only, not used by execution flow

---

### Table: agent_states
**Classification:** DEAD_CODE  
**Who Writes:** Legacy agent system  
**Who Reads:** Legacy dashboard  
**Execution Path:** Legacy agent runs → agent_states  
**Tenant Lineage:** agent_states.tenant_id → tenants.id  
**Runtime Criticality:** NONE - Legacy system

**Actual Usage:**
- `app/api/v1/agent-update/route.ts` (line 53): `.from('agent_states')`
- Legacy v1 API, not used by new runtime

---

### Table: agent_activities
**Classification:** DEAD_CODE  
**Who Writes:** Legacy agent system  
**Who Reads:** Legacy dashboard  
**Execution Path:** Legacy agent runs → agent_activities  
**Tenant Lineage:** agent_activities.tenant_id → tenants.id  
**Runtime Criticality:** NONE - Legacy system

**Actual Usage:**
- `app/api/dev/simulate-agent/route.ts` (line 66): `.from('agent_activities')`
- Legacy simulation, not used by new runtime

---

### Table: agent_runs
**Classification:** DEAD_CODE  
**Who Writes:** Legacy agent system  
**Who Reads:** Legacy dashboard  
**Execution Path:** Legacy agent runs → agent_runs  
**Tenant Lineage:** agent_runs.tenant_id → tenants.id  
**Runtime Criticality:** NONE - Legacy system

**Actual Usage:**
- `app/api/v1/agent-update/route.ts` (line 70): `.from('agent_runs')`
- Legacy v1 API, not used by new runtime

---

### Table: aria_keywords
**Classification:** SCAFFOLDED  
**Who Writes:** None (not actively used)  
**Who Reads:** Dashboard artifacts  
**Execution Path:** None  
**Tenant Lineage:** aria_keywords.tenant_id → tenants.id  
**Runtime Criticality:** NONE - Artifact storage not used

**Actual Usage:**
- `actions/artifacts.ts` (line 9): `.from('aria_keywords')`
- Artifact storage, not used by execution flow

---

### Table: scribe_content
**Classification:** SCAFFOLDED  
**Who Writes:** None (not actively used)  
**Who Reads:** Dashboard artifacts  
**Execution Path:** None  
**Tenant Lineage:** scribe_content.tenant_id → tenants.id  
**Runtime Criticality:** NONE - Artifact storage not used

**Actual Usage:**
- `actions/artifacts.ts` (line 26): `.from('scribe_content')`
- Artifact storage, not used by execution flow

---

### Table: pulse_rankings
**Classification:** SCAFFOLDED  
**Who Writes:** None  
**Who Reads:** Dashboard artifacts  
**Execution Path:** None  
**Tenant Lineage:** pulse_rankings.tenant_id → tenants.id  
**Runtime Criticality:** NONE - PULSE agent not active

**Actual Usage:**
- `actions/artifacts.ts` (line 43): `.from('pulse_rankings')`
- PULSE agent not deployed

---

### Table: publish_jobs
**Classification:** SCAFFOLDED  
**Who Writes:** None  
**Who Reads:** Dashboard  
**Execution Path:** None  
**Tenant Lineage:** publish_jobs.tenant_id → tenants.id  
**Runtime Criticality:** NONE - Publishing not implemented

**Actual Usage:**
- `lib/dashboard/index.ts` (line 131): `.from('publish_jobs')`
- Publishing feature not implemented

---

### Table: integrations
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** Integration modules  
**Who Reads:** Integration modules  
**Execution Path:** Google/CMS integrations → integrations  
**Tenant Lineage:** integrations.tenant_id → tenants.id  
**Runtime Criticality:** MEDIUM - Third-party integrations

**Actual Usage:**
- `lib/integrations/utils.ts` (line 59): `.from('integrations')`
- Active for Google/CMS integrations

---

### Table: sitemaps
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** Sitemap ingestion  
**Who Reads:** Sitemap ingestion  
**Execution Path:** Onboarding → sitemap ingestion → sitemaps  
**Tenant Lineage:** sitemaps.tenant_id → tenants.id  
**Runtime Criticality:** MEDIUM - Sitemap tracking

**Actual Usage:**
- `lib/onboarding/sitemap-ingestion.ts` (line 23): `.from('sitemaps')`

---

### Table: pages
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** Sitemap ingestion  
**Who Reads:** Sitemap ingestion  
**Execution Path:** Onboarding → sitemap ingestion → pages  
**Tenant Lineage:** pages.sitemap_id → sitemaps.id  
**Runtime Criticality:** MEDIUM - Page tracking

**Actual Usage:**
- `lib/onboarding/sitemap-ingestion.ts` (line 57): `.from('pages')`

---

### Table: indexing_status
**Classification:** SCAFFOLDED  
**Who Writes:** Indexing assistant  
**Who Reads:** Indexing assistant  
**Execution Path:** Google indexing → indexing_status  
**Tenant Lineage:** indexing_status.tenant_id → tenants.id  
**Runtime Criticality:** LOW - Optional indexing

**Actual Usage:**
- `lib/integrations/indexing/assistant.ts` (line 127): `.from('indexing_status')`

---

### Table: dashboard_context_v1
**Classification:** SCAFFOLDED  
**Who Writes:** Dashboard context  
**Who Reads:** Dashboard  
**Execution Path:** Dashboard → dashboard_context_v1  
**Tenant Lineage:** dashboard_context_v1.tenant_id → tenants.id  
**Runtime Criticality:** NONE - Dashboard cache

**Actual Usage:**
- `app/api/dashboard/context/route.ts` (line 23): `.from('dashboard_context_v1')`

---

### Table: keyword_insights
**Classification:** SCAFFOLDED  
**Who Writes:** None  
**Who Reads:** Dashboard  
**Execution Path:** None  
**Tenant Lineage:** keyword_insights.tenant_id → tenants.id  
**Runtime Criticality:** NONE - Dashboard feature

**Actual Usage:**
- `app/api/dashboard/keyword-insights/route.ts` (line 32): `.from('keyword_insights')`

---

### Table: audit_log
**Classification:** ACTIVE_RUNTIME  
**Who Writes:** Audit actions  
**Who Reads:** Audit actions  
**Execution Path:** Audit operations → audit_log  
**Tenant Lineage:** audit_log.tenant_id → tenants.id  
**Runtime Criticality:** MEDIUM - Audit trail

**Actual Usage:**
- `actions/audit.ts` (line 38): `.from('audit_log')`

---

### Table: locl_audits
**Classification:** SCAFFOLDED  
**Who Writes:** None  
**Who Reads:** Dashboard artifacts  
**Execution Path:** None  
**Tenant Lineage:** locl_audits.tenant_id → tenants.id  
**Runtime Criticality:** NONE - LOCL agent not active

**Actual Usage:**
- `actions/artifacts.ts` (line 60): `.from('locl_audits')`
- LOCL agent not deployed

---

### Table: repute_reviews
**Classification:** SCAFFOLDED  
**Who Writes:** None  
**Who Reads:** Dashboard artifacts  
**Execution Path:** None  
**Tenant Lineage:** repute_reviews.tenant_id → tenants.id  
**Runtime Criticality:** NONE - REPUTE agent not active

**Actual Usage:**
- `actions/artifacts.ts` (line 77): `.from('repute_reviews')`
- REPUTE agent not deployed

---

### Table: linx_backlinks
**Classification:** SCAFFOLDED  
**Who Writes:** None  
**Who Reads:** Dashboard artifacts  
**Execution Path:** None  
**Tenant Lineage:** linx_backlinks.tenant_id → tenants.id  
**Runtime Criticality:** NONE - LINX agent not active

**Actual Usage:**
- `actions/artifacts.ts` (line 94): `.from('linx_backlinks')`
- LINX agent not deployed

---

### Table: prism_assets
**Classification:** SCAFFOLDED  
**Who Writes:** None  
**Who Reads:** Dashboard artifacts  
**Execution Path:** None  
**Tenant Lineage:** prism_assets.tenant_id → tenants.id  
**Runtime Criticality:** NONE - PRISM agent not active

**Actual Usage:**
- `actions/artifacts.ts` (line 94): `.from('prism_assets')`
- PRISM agent not deployed

---

## CRITICAL FINDING: RUNTIME TABLE DUALITY

### Active Runtime Uses agent_* Tables
- `agent_executions` - ACTIVE (ExecutionRepository)
- `agent_tasks` - ACTIVE (TaskRepository)
- `agent_events` - ACTIVE (EventRepository)
- `agent_logs` - ACTIVE (LogRepository)

### Observability Uses runtime_* Tables (Read-Only)
- `runtime_executions` - READ-ONLY (execution-metrics, report-generator)
- `runtime_tasks` - READ-ONLY (execution-metrics)
- `runtime_thinking_logs` - OPTIONAL (thinking-logs module)

### Conclusion
The `runtime_*` tables are **NOT used by the active execution flow**. They are only used by the observability module for reading metrics. The true canonical runtime uses the `agent_*` tables.

---

## TABLE CLASSIFICATION SUMMARY

| Classification | Table Count | Tables |
|---------------|-------------|--------|
| ACTIVE_RUNTIME | 7 | profiles, agent_executions, agent_tasks, agent_events, agent_logs, tenants, workspaces |
| ACTIVE_ANALYTICS | 3 | runtime_executions, runtime_tasks, runtime_thinking_logs |
| ACTIVE_REPORTING | 5 | seo_keywords, seo_reports, seo_clusters, seo_drafts, seo_content_briefs |
| ACTIVE_RUNTIME (Onboarding) | 2 | business_profiles, gsc_credentials |
| ACTIVE_RUNTIME (Integrations) | 1 | integrations |
| ACTIVE_RUNTIME (Sitemap) | 2 | sitemaps, pages |
| ACTIVE_RUNTIME (Audit) | 1 | audit_log |
| SCAFFOLDED | 8 | runtime_workflows, credentials, cms_credentials, aria_keywords, scribe_content, pulse_rankings, publish_jobs, dashboard_context_v1, keyword_insights, indexing_status |
| DEAD_CODE | 3 | agent_states, agent_activities, agent_runs |
| SCAFFOLDED (Agents) | 4 | locl_audits, repute_reviews, linx_backlinks, prism_assets |
| SCAFFOLDED (Ranking) | 4 | ranking_seeds, ranking_history, ranking_movements, ranking_volatility |

**Total Tables Traced:** 37 (out of 45 total referenced)
**Truly Required Today:** 21 tables
**Future-Only/Scaffolded:** 16 tables

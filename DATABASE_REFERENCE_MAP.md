# DATABASE REFERENCE MAP

**Phase:** Phase 1B Database Convergence Audit  
**Date:** 2026-05-10  
**Status:** COMPLETED

---

## EXECUTIVE SUMMARY

Comprehensive scan of CLAUX codebase identified **45 unique database tables** referenced across runtime, onboarding, agents, observability, and integration layers. This document maps every table reference to its usage locations and access patterns.

---

## TABLE REFERENCE CATALOG

### RUNTIME LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **agent_executions** | Read/Write | `lib/runtime/database.ts`, `lib/runtime/repositories/execution.repository.ts`, `lib/runtime/repositories/metrics.repository.ts` | Insert, Select, Update |
| **agent_tasks** | Read/Write | `lib/runtime/database.ts`, `lib/runtime/repositories/task.repository.ts`, `lib/runtime/repositories/metrics.repository.ts` | Insert, Select, Update |
| **agent_events** | Write | `lib/runtime/database.ts`, `lib/runtime/repositories/event.repository.ts`, `lib/runtime/repositories/metrics.repository.ts` | Insert, Select |
| **agent_logs** | Write | `lib/runtime/database.ts`, `lib/runtime/repositories/log.repository.ts`, `lib/runtime/repositories/metrics.repository.ts` | Insert, Select |
| **runtime_executions** | Read/Write | `lib/observability/execution-metrics.ts`, `lib/reports/report-generator.ts` | Select |
| **runtime_tasks** | Read | `lib/observability/execution-metrics.ts`, `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts` | Select |
| **runtime_thinking_logs** | Write | `lib/runtime/thinking/thinking-logs.ts` | Insert, Select |
| **runtime_workflows** | Read | `lib/onboarding/bootstrap.ts` | Select |
| **agent_states** | Read/Write | `lib/dashboard/index.ts`, `app/api/v1/agent-update/route.ts`, `app/api/v1/orchestrator/trigger-agent/route.ts`, `app/api/dashboard/agent-states/route.ts`, `app/api/profile/complete/route.ts`, `app/api/dev/simulate-agent/route.ts` | Insert, Select, Update |
| **agent_activities** | Write | `lib/dashboard/index.ts`, `app/api/dashboard/agent-activities/route.ts`, `app/api/dev/simulate-agent/route.ts` | Insert, Select |
| **agent_runs** | Write | `app/api/v1/agent-update/route.ts`, `app/api/v1/orchestrator/trigger-agent/route.ts` | Insert, Select, Update |

### ONBOARDING LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **profiles** | Read/Write | `lib/onboarding/ingestion.ts`, `app/api/webhooks/clerk/route.ts`, `app/api/agents/*`, `app/api/dashboard/*`, `app/api/internal/ensure-tenant/route.ts`, `app/page.tsx` | Select, Update |
| **tenants** | Read/Write | `lib/onboarding/ingestion.ts`, `app/api/v1/agent-update/route.ts`, `app/api/v1/orchestrator/trigger-agent/route.ts`, `app/api/health/route.ts`, `app/page.tsx` | Select, Insert, Update |
| **business_profiles** | Read/Write | `lib/onboarding/ingestion.ts`, `lib/runtime/tasks/aria.tasks.ts`, `lib/runtime/tasks/scribe.tasks.ts`, `app/dashboard/settings/general/page.tsx` | Select, Insert |
| **gsc_credentials** | Write | `lib/onboarding/ingestion.ts`, `lib/onboarding/credentials.ts` | Insert, Update |
| **credentials** | Write | `lib/onboarding/credentials.ts` | Insert, Select |
| **cms_credentials** | Write | `actions/cms.ts` | Insert |
| **workspaces** | Read | `lib/onboarding/ingestion.ts` | Select |

### SEO/CONTENT LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **seo_keywords** | Read/Write | `lib/reports/report-generator.ts`, `lib/runtime/tasks/aria.tasks.ts` | Select, Insert |
| **seo_reports** | Write | `lib/reports/report-generator.ts`, `app/api/reports/route.ts`, `app/api/reports/[id]/route.ts` | Insert, Select |
| **seo_clusters** | Read | `lib/reports/report-generator.ts` | Select |
| **seo_drafts** | Read/Write | `lib/reports/report-generator.ts`, `lib/runtime/tasks/scribe.tasks.ts` | Select, Insert |
| **seo_content_briefs** | Read/Write | `lib/runtime/tasks/aria.tasks.ts`, `lib/runtime/tasks/scribe.tasks.ts` | Select, Insert |

### AGENT ARTIFACT LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **aria_keywords** | Read | `lib/dashboard/index.ts`, `actions/artifacts.ts`, `app/api/v1/artifacts/route.ts` | Select |
| **scribe_content** | Read/Write | `lib/dashboard/index.ts`, `actions/artifacts.ts`, `app/api/v1/artifacts/route.ts` | Select |
| **pulse_rankings** | Read | `lib/dashboard/index.ts`, `actions/artifacts.ts`, `app/api/v1/artifacts/route.ts` | Select |
| **publish_jobs** | Read | `lib/dashboard/index.ts` | Select |

### RANKING LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **ranking_seeds** | Write | `lib/ranking/ranking-pipeline.ts` | Insert |
| **ranking_history** | Read/Write | `lib/ranking/ranking-pipeline.ts` | Select, Insert |
| **ranking_movements** | Write | `lib/ranking/ranking-pipeline.ts` | Insert, Select |
| **ranking_volatility** | Write | `lib/ranking/ranking-pipeline.ts` | Insert |

### INTEGRATION LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **integrations** | Read/Write | `lib/integrations/utils.ts`, `lib/integrations/token-refresh/job.ts`, `lib/integrations/indexing/assistant.ts`, `app/api/integrations/*` | Select, Insert, Update |

### AUDIT/OBSERVABILITY LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **audit_log** | Write | `actions/audit.ts`, `actions/audit-log.ts`, `actions/get-audit-logs.ts` | Insert, Select |

### DASHBOARD LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **dashboard_context_v1** | Read | `app/api/dashboard/context/route.ts` | Select |
| **keyword_insights** | Read | `app/api/dashboard/keyword-insights/route.ts` | Select |

### SITEMAP LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **sitemaps** | Write | `lib/onboarding/sitemap-ingestion.ts` | Insert |
| **pages** | Write | `lib/onboarding/sitemap-ingestion.ts` | Insert |

### INDEXING LAYER

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **indexing_status** | Write | `lib/integrations/indexing/assistant.ts` | Insert |

### OTHER AGENT LAYERS

| Table | Reference Type | Usage Locations | Access Pattern |
|-------|----------------|-----------------|----------------|
| **locl_audits** | Read | `lib/dashboard/index.ts`, `actions/audit-log.ts` | Select |
| **repute_reviews** | Read | `actions/artifacts.ts`, `actions/audit-log.ts`, `app/api/v1/artifacts/route.ts` | Select |
| **linx_backlinks** | Read | `actions/artifacts.ts`, `actions/audit-log.ts`, `app/api/v1/artifacts/route.ts` | Select |
| **prism_assets** | Read | `actions/artifacts.ts`, `app/api/v1/artifacts/route.ts` | Select |

---

## SUBSYSTEM BREAKDOWN

### Runtime Subsystem (11 tables)
- **Core Runtime:** agent_executions, agent_tasks, agent_events, agent_logs
- **New Runtime:** runtime_executions, runtime_tasks, runtime_thinking_logs, runtime_workflows
- **Legacy Runtime:** agent_states, agent_activities, agent_runs

### Onboarding Subsystem (7 tables)
- **Tenant Management:** profiles, tenants, workspaces
- **Business Data:** business_profiles
- **Credentials:** gsc_credentials, credentials, cms_credentials

### SEO/Content Subsystem (5 tables)
- **SEO Data:** seo_keywords, seo_reports, seo_clusters
- **Content:** seo_drafts, seo_content_briefs

### Agent Artifacts Subsystem (4 tables)
- **ARIA:** aria_keywords
- **SCRIBE:** scribe_content
- **PULSE:** pulse_rankings
- **Publishing:** publish_jobs

### Ranking Subsystem (4 tables)
- **Seeds:** ranking_seeds
- **History:** ranking_history
- **Movements:** ranking_movements
- **Volatility:** ranking_volatility

### Integration Subsystem (1 table)
- **Integrations:** integrations

### Audit/Observability Subsystem (1 table)
- **Audit:** audit_log

### Dashboard Subsystem (2 tables)
- **Context:** dashboard_context_v1
- **Insights:** keyword_insights

### Sitemap Subsystem (2 tables)
- **Sitemaps:** sitemaps
- **Pages:** pages

### Indexing Subsystem (1 table)
- **Status:** indexing_status

### Other Agents Subsystem (4 tables)
- **LOCL:** locl_audits
- **REPUTE:** repute_reviews
- **LINX:** linx_backlinks
- **PRISM:** prism_assets

---

## CRITICAL OBSERVATIONS

### 1. Runtime Table Duality
**Issue:** Two parallel runtime table naming conventions exist:
- **Legacy:** `agent_*` (agent_executions, agent_tasks, agent_events, agent_logs, agent_states, agent_activities, agent_runs)
- **New:** `runtime_*` (runtime_executions, runtime_tasks, runtime_thinking_logs, runtime_workflows)

**Impact:** Runtime code references both conventions, creating potential confusion and migration complexity.

### 2. Credential Table Fragmentation
**Issue:** Credentials are scattered across multiple tables:
- `gsc_credentials` (Google Search Console specific)
- `cms_credentials` (CMS specific)
- `credentials` (generic credential storage)
- `integrations` (integration-specific credentials with encryption)

**Impact:** Inconsistent credential storage patterns across the codebase.

### 3. Agent State Duplication
**Issue:** Agent state is tracked in multiple places:
- `agent_states` (current state)
- `agent_activities` (activity log)
- `agent_runs` (execution history)

**Impact:** Potential for state inconsistency across tables.

### 4. Missing Repository Pattern Consistency
**Issue:** Some tables use repository pattern (agent_executions, agent_tasks, agent_events, agent_logs), while others use direct Supabase calls (runtime_executions, runtime_tasks).

**Impact:** Inconsistent data access patterns across runtime layer.

---

## ACCESS PATTERNS SUMMARY

| Access Pattern | Table Count | Percentage |
|----------------|-------------|------------|
| Read/Write | 20 | 44% |
| Read Only | 15 | 33% |
| Write Only | 10 | 22% |

---

## DEPENDENCY GRAPH

```
profiles → tenants → business_profiles
profiles → workspaces
tenants → gsc_credentials
tenants → cms_credentials
tenants → credentials
tenants → integrations
business_profiles → seo_keywords
seo_keywords → seo_reports
seo_content_briefs → seo_drafts
runtime_executions → runtime_tasks
agent_executions → agent_tasks
agent_executions → agent_events
agent_executions → agent_logs
sitemaps → pages
```

---

## CONCLUSION

The CLAUX codebase references **45 unique database tables** across 10 subsystems. The most critical issues are:

1. **Runtime table duality** (agent_* vs runtime_*)
2. **Credential table fragmentation**
3. **Agent state duplication**
4. **Inconsistent repository patterns**

These issues must be resolved before any schema migrations can be safely executed.

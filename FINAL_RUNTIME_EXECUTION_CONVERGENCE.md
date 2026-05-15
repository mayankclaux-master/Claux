# FINAL RUNTIME EXECUTION CONVERGENCE

**Phase:** Phase 1B Live Persistence Trace Audit  
**Date:** 2026-05-10  
**Status:** COMPLETED

---

## EXECUTIVE SUMMARY

**CRITICAL ARCHITECTURAL TRUTH DISCOVERED:**

The new canonical runtime system (RuntimeService, ExecutionOrchestrator) **uses the LEGACY `agent_*` tables**, NOT the `runtime_*` tables. The `runtime_*` tables are only used by the observability module for READ-ONLY metrics, NOT by the active execution flow.

**Key Finding:** `agent_*` tables are the TRUE canonical runtime. `runtime_*` tables are scaffolded for future use but not actively wired.

---

## QUESTION 1: Which Tables Are Truly Required TODAY?

### Core Runtime (7 tables) - REQUIRED
- `profiles` - Tenant resolution, entry point
- `tenants` - Tenant isolation
- `workspaces` - Workspace context
- `agent_executions` - Execution tracking (ACTIVE)
- `agent_tasks` - Task tracking (ACTIVE)
- `agent_events` - Event stream (ACTIVE)
- `agent_logs` - Structured logging (ACTIVE)

### SEO/Content Pipeline (5 tables) - REQUIRED
- `seo_keywords` - Keyword data
- `seo_reports` - Report artifacts
- `seo_clusters` - Keyword clustering
- `seo_drafts` - Content drafts
- `seo_content_briefs` - Content pipeline

### Onboarding (4 tables) - REQUIRED
- `business_profiles` - Business context
- `gsc_credentials` - GSC credentials
- `sitemaps` - Sitemap tracking
- `pages` - Page tracking

### Integrations (2 tables) - REQUIRED
- `integrations` - Third-party integrations
- `audit_log` - Audit trail

**Total Truly Required: 18 tables**

---

## QUESTION 2: Which Tables Are Future-Only?

### Observability (3 tables) - FUTURE
- `runtime_executions` - Metrics only, not used by execution
- `runtime_tasks` - Metrics only, not used by execution
- `runtime_thinking_logs` - Optional AI thinking trace

### Scaffolded Features (13 tables) - FUTURE
- `runtime_workflows` - Workflow definitions not used
- `credentials` - Generic credential storage not used
- `cms_credentials` - Optional CMS integration
- `aria_keywords` - Artifact storage not used
- `scribe_content` - Artifact storage not used
- `pulse_rankings` - PULSE agent not deployed
- `publish_jobs` - Publishing not implemented
- `dashboard_context_v1` - Dashboard cache
- `keyword_insights` - Dashboard feature
- `indexing_status` - Optional indexing
- `ranking_seeds` - Optional ranking
- `ranking_history` - Optional ranking
- `ranking_movements` - Optional ranking
- `ranking_volatility` - Optional ranking

### Dead Code (7 tables) - DEPRECATED
- `agent_states` - Legacy system
- `agent_activities` - Legacy system
- `agent_runs` - Legacy system
- `locl_audits` - LOCL agent not active
- `repute_reviews` - REPUTE agent not active
- `linx_backlinks` - LINX agent not active
- `prism_assets` - PRISM agent not active

**Total Future-Only/Deprecated: 23 tables**

---

## QUESTION 3: Which Code Paths Are Inactive?

### Legacy Agent System (DEAD)
- `app/api/v1/agent-update/route.ts` - Legacy v1 API
- `app/api/v1/orchestrator/trigger-agent/route.ts` - Legacy orchestrator
- `app/api/dev/simulate-agent/route.ts` - Legacy simulation
- `lib/agents/aria.service.ts` - Legacy ARIA service
- `lib/agents/scribe.service.ts` - Legacy SCRIBE service

**Status:** These use `agent_states`, `agent_activities`, `agent_runs` but are NOT called by new runtime system.

### Undeployed Agents (SCAFFOLDED)
- LOCL agent - Not deployed, `locl_audits` table unused
- REPUTE agent - Not deployed, `repute_reviews` table unused
- LINX agent - Not deployed, `linx_backlinks` table unused
- PRISM agent - Not deployed, `prism_assets` table unused

**Status:** Agent code exists but not wired to execution flow.

### Ranking Pipeline (SCAFFOLDED)
- `lib/ranking/ranking-pipeline.ts` - Implemented but not called by any active flow
- Tables: `ranking_seeds`, `ranking_history`, `ranking_movements`, `ranking_volatility`

**Status:** Feature scaffolded but not integrated.

### Publishing System (SCAFFOLDED)
- `publish_jobs` table exists but no publishing logic implemented

**Status:** Feature scaffolded but not implemented.

---

## QUESTION 4: Which Migrations Are Actually Necessary?

### NONE - No Schema Migrations Required

**Reason:** The active runtime system already uses the correct tables (`agent_*`). The schema is already aligned with code.

**What Actually Exists:**
- `agent_executions` - Used by ExecutionRepository
- `agent_tasks` - Used by TaskRepository
- `agent_events` - Used by EventRepository
- `agent_logs` - Used by LogRepository

**What Does NOT Exist (or is unused):**
- `runtime_executions` - Only used for metrics read-only
- `runtime_tasks` - Only used for metrics read-only
- `runtime_thinking_logs` - Optional AI thinking

**Conclusion:** The canonical runtime is ALREADY `agent_*`. No migration needed.

---

## QUESTION 5: Is runtime_* Persistence Real or Theoretical?

**Answer: THEORETICAL**

### Evidence:
1. **Active Execution Flow:** Uses `agent_executions`, `agent_tasks`, `agent_events`, `agent_logs`
   - API routes → RuntimeService → ExecutionService → ExecutionRepository → `agent_executions`
   - Confirmed in `lib/runtime/repositories/execution.repository.ts` (line 50): `return 'agent_executions'`

2. **Observability Module Only:** Uses `runtime_executions`, `runtime_tasks` for READ-ONLY metrics
   - `lib/observability/execution-metrics.ts` (line 9, 10): `.from('runtime_executions')`, `.from('runtime_tasks')`
   - These are NOT used by execution, only for dashboard metrics

3. **Report Generator:** Uses `runtime_executions` for execution summary report
   - `lib/reports/report-generator.ts` (line 302): `.from('runtime_executions')`
   - This is READ-ONLY for report generation

4. **No Writes to runtime_* Tables:** The execution flow NEVER writes to `runtime_*` tables
   - All writes go to `agent_*` tables via repositories
   - `runtime_*` tables are only READ for metrics

### Conclusion:
The `runtime_*` persistence system is **theoretical scaffold** for future observability, not the active runtime. The true canonical runtime is `agent_*`.

---

## QUESTION 6: Is agent_* Already the True Canonical Runtime?

**Answer: YES**

### Evidence:
1. **Repository Pattern:** All repositories use `agent_*` tables
   - `ExecutionRepository` → `agent_executions`
   - `TaskRepository` → `agent_tasks`
   - `EventRepository` → `agent_events`
   - `LogRepository` → `agent_logs`

2. **Service Layer:** All services use repositories which use `agent_*` tables
   - `ExecutionService` → `ExecutionRepository` → `agent_executions`
   - `TaskService` → `TaskRepository` → `agent_tasks`
   - `EventService` → `EventRepository` → `agent_events`
   - `LogService` → `LogRepository` → `agent_logs`

3. **Orchestrator:** Uses services which use `agent_*` tables
   - `ExecutionOrchestrator` → `RuntimeService` → `ExecutionService` → `agent_executions`

4. **Active Execution Flow:** ARIA/SCRIBE both use `agent_*` tables
   - Confirmed in API routes and task implementations

### Conclusion:
`agent_*` tables are the **true canonical runtime**. The new runtime system was built on top of the existing `agent_*` schema, not a new `runtime_*` schema.

---

## QUESTION 7: Can Onboarding Be Added Incrementally Instead of Full Convergence?

**Answer: YES - Onboarding is Already Wired**

### Current State:
- `lib/onboarding/ingestion.ts` - Fully wired and active
- `lib/onboarding/orchestration.ts` - Fully wired and active
- `lib/onboarding/sitemap-ingestion.ts` - Fully wired and active
- `lib/onboarding/bootstrap.ts` - Fully wired and active
- `lib/onboarding/credentials.ts` - Fully wired and active

### Tables Used:
- `profiles` - Active
- `tenants` - Active
- `workspaces` - Active
- `business_profiles` - Active
- `gsc_credentials` - Active
- `sitemaps` - Active
- `pages` - Active

### Conclusion:
Onboarding is **already fully wired** and uses the correct tables. No convergence needed. It can be used incrementally as-is.

---

## NON-WIRED MODULES ANALYSIS

### Module: Onboarding
**Status:** FULLY WIRED
- All onboarding modules are active and use correct tables
- No convergence needed
- Can be used incrementally

### Module: Sitemap Ingestion
**Status:** FULLY WIRED
- `lib/onboarding/sitemap-ingestion.ts` is active
- Uses `sitemaps` and `pages` tables
- No convergence needed

### Module: Crawler
**Status:** SCAFFOLDED
- `lib/onboarding/page-crawler.ts` exists but not called by active flow
- No table dependencies
- Future feature, not blocking

### Module: Ranking History
**Status:** SCAFFOLDED
- `lib/ranking/ranking-pipeline.ts` exists but not called by active flow
- Uses `ranking_*` tables
- Future feature, not blocking

### Module: Ranking Volatility
**Status:** SCAFFOLDED
- Part of ranking pipeline, not called by active flow
- Future feature, not blocking

### Module: Workspace Bootstrap
**Status:** FULLY WIRED
- `lib/onboarding/bootstrap.ts` is active
- Uses `runtime_workflows` table for workflow definitions
- No convergence needed

---

## ARCHITECTURAL TRUTH SUMMARY

### What Actually Works Today:
1. **Runtime System:** Uses `agent_*` tables via repository pattern
2. **Onboarding:** Fully wired and active
3. **Sitemap Ingestion:** Fully wired and active
4. **SEO/Content Pipeline:** Fully wired and active
5. **Integrations:** Fully wired and active

### What Is Scaffolded/Future:
1. **Observability:** `runtime_*` tables for metrics (read-only)
2. **Thinking Logs:** `runtime_thinking_logs` (optional)
3. **Ranking Pipeline:** Not integrated into active flow
4. **Publishing System:** Not implemented
5. **Undeployed Agents:** LOCL, REPUTE, LINX, PRISM

### What Is Dead/Deprecated:
1. **Legacy Agent System:** `agent_states`, `agent_activities`, `agent_runs`
2. **Legacy v1 APIs:** Not used by new runtime

---

## CONVERGENCE RECOMMENDATIONS

### Immediate Actions (Phase 2A):
1. **NO schema migrations required** - Runtime already uses correct tables
2. **Remove dead code** - Delete legacy agent system and v1 APIs
3. **Document architectural truth** - `agent_*` is canonical, `runtime_*` is future observability
4. **Remove scaffolded tables** - Drop unused agent artifact tables

### Future Actions (Phase 2B+):
1. **Decide on observability strategy** - Keep `runtime_*` for metrics or migrate to `agent_*`
2. **Implement ranking pipeline** - Wire ranking modules to active flow
3. **Implement publishing system** - Wire publishing logic
4. **Deploy additional agents** - Wire LOCL, REPUTE, LINX, PRISM agents

### Do NOT Do:
1. **Do NOT migrate `agent_*` to `runtime_*`** - This would break active runtime
2. **Do NOT create new runtime tables** - Existing tables are correct
3. **Do NOT refactor onboarding** - Already fully wired
4. **Do NOT add migrations** - Schema is already aligned

---

## FINAL ANSWERS

1. **Which tables are truly required TODAY?**
   - 18 tables: 7 core runtime + 5 SEO + 4 onboarding + 2 integrations

2. **Which tables are future-only?**
   - 23 tables: 3 observability + 13 scaffolded + 7 dead code

3. **Which code paths are inactive?**
   - Legacy agent system, undeployed agents, ranking pipeline, publishing system

4. **Which migrations are actually necessary?**
   - NONE - Schema is already aligned with code

5. **Is runtime_* persistence real or theoretical?**
   - THEORETICAL - Only used for observability metrics, not execution

6. **Is agent_* already the true canonical runtime?**
   - YES - All active execution uses `agent_*` tables

7. **Can onboarding be added incrementally instead of full convergence?**
   - YES - Onboarding is already fully wired and can be used incrementally

---

## ARCHITECTURAL DECISION POINT

**The `runtime_*` tables were likely intended as a future canonical runtime, but the actual implementation used `agent_*` tables instead.**

**Two Paths Forward:**

**Path A (Recommended):** Accept `agent_*` as canonical
- Keep `agent_*` as the true runtime
- Use `runtime_*` for observability metrics only
- Remove scaffolded `runtime_*` references from code
- Document this architectural decision

**Path B (Not Recommended):** Migrate to `runtime_*`
- This would require massive code refactoring
- Would break active execution
- High risk, low value
- Only justified if `agent_*` schema is fundamentally broken

**Recommendation:** Path A - Accept `agent_*` as canonical and treat `runtime_*` as observability-only.

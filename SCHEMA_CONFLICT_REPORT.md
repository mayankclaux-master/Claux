# SCHEMA CONFLICT REPORT

**Phase:** Phase 1B Database Convergence Audit  
**Date:** 2026-05-10  
**Status:** COMPLETED

---

## EXECUTIVE SUMMARY

Critical schema conflicts identified that will cause runtime failures if not resolved. Primary issues: runtime table duality, credential fragmentation, and agent state duplication. **7 critical conflicts** requiring immediate attention before any migration.

---

## CRITICAL CONFLICTS

### CONFLICT #1: Runtime Table Duality
**Severity:** CRITICAL  
**Runtime Risk:** HIGH  
**Production Impact:** Execution failures

**Issue:** Two parallel runtime table naming conventions exist simultaneously:
- **Legacy:** `agent_executions`, `agent_tasks`, `agent_events`, `agent_logs`
- **New:** `runtime_executions`, `runtime_tasks`, `runtime_thinking_logs`

**Code References:**
- `lib/runtime/database.ts` uses `agent_*` tables
- `lib/runtime/repositories/` uses `agent_*` tables with repository pattern
- `lib/observability/execution-metrics.ts` uses `runtime_*` tables
- `app/api/tasks/route.ts` uses `runtime_tasks`
- `lib/runtime/thinking/thinking-logs.ts` uses `runtime_thinking_logs`

**Conflict Details:**
1. Runtime codebase references both conventions
2. No clear migration path from legacy to new
3. Repository pattern only implemented for legacy tables
4. New runtime tables lack repository abstraction
5. Potential for data inconsistency between dual tables

**Runtime Crash Risk:** HIGH - Code will fail if one convention is removed without migration

**Resolution Required:** Table rename mapping or runtime code refactor

---

### CONFLICT #2: Credential Table Fragmentation
**Severity:** CRITICAL  
**Runtime Risk:** MEDIUM  
**Production Impact:** Credential storage failures

**Issue:** Credentials scattered across 4 tables with inconsistent patterns:
- `gsc_credentials` (Google Search Console specific)
- `cms_credentials` (CMS specific)
- `credentials` (generic credential storage)
- `integrations` (integration-specific credentials with encryption)

**Code References:**
- `lib/onboarding/ingestion.ts` uses `gsc_credentials`
- `lib/onboarding/credentials.ts` uses `credentials`
- `actions/cms.ts` uses `cms_credentials`
- `lib/integrations/utils.ts` uses `integrations`
- `lib/integrations/token-refresh/job.ts` uses `integrations`

**Conflict Details:**
1. No unified credential storage strategy
2. Inconsistent encryption patterns across tables
3. GSC credentials isolated from general credentials
4. CMS credentials separate from integrations
5. Duplicate credential_type concept in credentials vs integrations

**Runtime Crash Risk:** MEDIUM - Credential lookups may fail depending on storage location

**Resolution Required:** Merge credential tables or establish clear separation strategy

---

### CONFLICT #3: Agent State Duplication
**Severity:** CRITICAL  
**Runtime Risk:** HIGH  
**Production Impact:** State inconsistency

**Issue:** Agent state tracked in 3 separate tables:
- `agent_states` (current state)
- `agent_activities` (activity log)
- `agent_runs` (execution history)

**Code References:**
- `lib/dashboard/index.ts` queries all 3 tables
- `app/api/v1/agent-update/route.ts` updates `agent_states`, inserts `agent_runs`
- `app/api/v1/orchestrator/trigger-agent/route.ts` updates both `agent_runs` and `agent_states`
- `app/api/dev/simulate-agent/route.ts` updates both `agent_states` and `agent_activities`

**Conflict Details:**
1. No single source of truth for agent state
2. State updates must be coordinated across 3 tables
3. Transaction consistency not guaranteed
4. Potential for state drift between tables
5. Dashboard reads from all 3 but may show inconsistent data

**Runtime Crash Risk:** HIGH - State updates may fail if one table update succeeds but another fails

**Resolution Required:** Merge state tables or establish transactional consistency

---

### CONFLICT #4: Repository Pattern Inconsistency
**Severity:** HIGH  
**Runtime Risk:** MEDIUM  
**Production Impact:** Maintenance complexity

**Issue:** Repository pattern only implemented for legacy runtime tables:
- `agent_executions` → `execution.repository.ts`
- `agent_tasks` → `task.repository.ts`
- `agent_events` → `event.repository.ts`
- `agent_logs` → `log.repository.ts`

**New runtime tables use direct Supabase calls:**
- `runtime_executions` → direct `supabase.from()`
- `runtime_tasks` → direct `supabase.from()`
- `runtime_thinking_logs` → direct `supabase.from()`

**Code References:**
- `lib/runtime/repositories/` implements repository pattern
- `lib/observability/execution-metrics.ts` uses direct calls
- `lib/runtime/thinking/thinking-logs.ts` uses direct calls
- `app/api/tasks/route.ts` uses direct calls

**Conflict Details:**
1. Inconsistent data access patterns
2. No abstraction for new runtime tables
3. Difficult to enforce consistency across runtime layer
4. Metrics repository queries legacy tables only
5. No unified error handling

**Runtime Crash Risk:** MEDIUM - Maintenance burden, potential for inconsistent behavior

**Resolution Required:** Implement repository pattern for all runtime tables or remove from legacy

---

### CONFLICT #5: Missing Foreign Key Constraints
**Severity:** HIGH  
**Runtime Risk:** MEDIUM  
**Production Impact:** Data integrity

**Issue:** Code assumes foreign key relationships that may not exist in schema:
- `sitemaps.workspace_id` → `workspaces.id`
- `pages.sitemap_id` → `sitemaps.id`
- All `tenant_id` → `tenants.id` relationships

**Code References:**
- `lib/onboarding/ingestion.ts` assumes `workspaces` exists
- `lib/onboarding/sitemap-ingestion.ts` assumes `sitemaps` → `pages` relationship
- All tenant-scoped queries assume `tenant_id` FK exists

**Conflict Details:**
1. No verification that FK constraints exist in actual schema
2. Code may fail if FK constraints missing
3. CASCADE delete behavior assumed but not verified
4. Circular dependency risks not validated

**Runtime Crash Risk:** MEDIUM - Data integrity violations may cause silent failures

**Resolution Required:** Schema audit to verify all FK constraints exist

---

### CONFLICT #6: Inconsistent Naming Conventions
**Severity:** MEDIUM  
**Runtime Risk:** LOW  
**Production Impact:** Developer confusion

**Issue:** Multiple naming conventions across codebase:
- Snake case: `agent_executions`, `tenant_id`, `created_at`
- Camel case in code: `tenantId`, `createdAt`
- Mixed in JSON: `tenant_id` vs `tenantId`

**Code References:**
- Database uses snake_case consistently
- TypeScript code uses camelCase
- JSON payloads use snake_case
- Supabase queries use snake_case

**Conflict Details:**
1. Constant translation between snake_case and camelCase
2. Potential for field name mismatches
3. Type definitions may not match actual schema
4. Increased cognitive load for developers

**Runtime Crash Risk:** LOW - Mostly developer experience issue

**Resolution Required:** Establish and enforce naming convention

---

### CONFLICT #7: Orphaned Code References
**Severity:** MEDIUM  
**Runtime Risk:** LOW  
**Production Impact:** Unused code

**Issue:** Code references tables that may not exist or are deprecated:
- `locl_audits` (LOCL agent)
- `repute_reviews` (REPUTE agent)
- `linx_backlinks` (LINX agent)
- `prism_assets` (PRISM agent)

**Code References:**
- `actions/artifacts.ts` references all 4
- `actions/audit-log.ts` references all 4
- `app/api/v1/artifacts/route.ts` references all 4
- `lib/dashboard/index.ts` references `locl_audits`

**Conflict Details:**
1. These agents may not be active or deployed
2. Tables may not exist in schema
3. Code will fail if tables missing
4. No verification of agent deployment status

**Runtime Crash Risk:** LOW - Only affects artifact retrieval for inactive agents

**Resolution Required:** Remove orphaned references or create placeholder tables

---

## NON-CRITICAL ISSUES

### ISSUE #1: Missing Indexes
**Severity:** LOW  
**Runtime Risk:** LOW  
**Production Impact:** Performance

**Issue:** Code assumes indexes that may not exist:
- Composite indexes on (tenant_id, status)
- Indexes on created_at DESC
- Indexes on keyword fields

**Resolution Required:** Verify and create missing indexes

---

### ISSUE #2: RLS Policy Gaps
**Severity:** LOW  
**Runtime Risk:** LOW  
**Production Impact:** Security

**Issue:** Code assumes RLS policies exist:
- Tenant-scoped reads
- Service role writes
- Encrypted credential protection

**Resolution Required:** Verify RLS policies match code assumptions

---

### ISSUE #3: Type Definition Mismatches
**Severity:** LOW  
**Runtime Risk:** LOW  
**Production Impact:** Type safety

**Issue:** TypeScript type definitions may not match actual schema:
- Optional vs required fields
- Enum values
- JSONB structure

**Resolution Required:** Align type definitions with actual schema

---

## RUNTIME CRASH RISK SUMMARY

| Conflict | Risk Level | Failure Mode |
|----------|------------|--------------|
| Runtime Table Duality | HIGH | Execution failures if tables renamed |
| Credential Fragmentation | MEDIUM | Credential lookup failures |
| Agent State Duplication | HIGH | State inconsistency, transaction failures |
| Repository Inconsistency | MEDIUM | Maintenance burden |
| Missing FK Constraints | MEDIUM | Data integrity violations |
| Inconsistent Naming | LOW | Developer confusion |
| Orphaned References | LOW | Artifact retrieval failures |

---

## MIGRATION BLOCKERS

**Cannot safely migrate until:**
1. Runtime table duality resolved
2. Credential storage strategy unified
3. Agent state consolidation completed
4. Repository pattern consistency achieved

**High-risk migration scenarios:**
- Renaming agent_* to runtime_* without code refactor
- Merging credential tables without data migration
- Removing agent state tables without transactional guarantee

---

## DEPENDENCY CHAIN RISKS

**Circular dependency risk:**
- `profiles` ↔ `tenants` (profiles.tenant_id nullable, but code assumes non-null)
- `sitemaps` → `workspaces` → `profiles` → `tenants`

**Cascade delete risks:**
- Deleting tenant should cascade to all tenant-scoped tables
- Code assumes CASCADE behavior but not verified

**Transaction consistency risks:**
- Multi-table updates (agent_states + agent_runs + agent_activities)
- No transaction wrapper in code

---

## CONCLUSION

**7 critical conflicts** identified that must be resolved before any schema migration. The most severe issues are:

1. **Runtime table duality** - Must choose one convention and migrate
2. **Credential fragmentation** - Must unify credential storage
3. **Agent state duplication** - Must consolidate state tracking

**Recommendation:** Do NOT execute any migrations until these conflicts are resolved. Focus on architectural convergence first.

# CLAUX FOUNDATION STABILIZATION IMPLEMENTATION PLAN (PART 1)

**Date:** January 2025  
**Plan Type:** Foundation Stabilization Blueprint (Part 1 of 2)  
**Scope:** Build repair, tenant isolation, runtime convergence, schema normalization, execution canonicalization, feature flag strategy  
**Methodology:** Surgical repair sequence, dependency-ordered execution, operational simplicity  

---

## EXECUTIVE SUMMARY

CLAUX has a SOLID EXECUTION FOUNDATION but CRITICAL FOUNDATION INSTABILITIES. The runtime scaffolding is operational, but build is failing, tenant isolation is broken, schema is fragmented, and execution systems are duplicated.

This plan defines the EXACT sequence for stabilizing CLAUX foundation before provider operationalization. The strategy is **attachment + simplification**, NOT rewrite.

**Stabilization Philosophy:** Every change must directly enable CLAUX to execute real SEO workflows. No architectural elegance, no speculative infrastructure, no abstraction experimentation.

**Key Objectives:**
1. Fix build failure
2. Fix tenant isolation (RLS)
3. Normalize tenant_id types
4. Eliminate dead execution systems
5. Converge execution systems
6. Prepare dashboard hydration
7. Prepare provider attachment

**Estimated Stabilization Timeline:** 5-7 days  
**Risk Level:** MEDIUM (surgical changes, rollback available)  
**Dependencies:** Sequential execution required for database migrations

---

## SECTION 1 — FOUNDATION STABILIZATION OBJECTIVES

### Exact Goals of Stabilization Phase

**1. Build Stability**
- Fix TypeScript build error in `lib/runtime/services/task.service.ts`
- Ensure production build succeeds
- Ensure type checking passes
- Ensure linting passes

**2. Tenant Isolation**
- Fix RLS policies to use `auth.jwt() ->> 'sub'` instead of `auth.uid()`
- Verify tenant isolation enforcement
- Verify cross-tenant data protection
- Verify repository scoping

**3. Runtime Convergence**
- Eliminate agent-specific runtime wrappers (PulseAgentRuntime, LoclAgentRuntime, etc.)
- Eliminate dead execution systems (runtime_executions, runtime_tasks, runtime_workflows)
- Eliminate duplicate execution paths
- Converge to ExecutionOrchestrator as canonical

**4. Execution Canonicalization**
- Lock ExecutionOrchestrator as canonical execution coordinator
- Lock RuntimeService as canonical facade
- Lock repository pattern as canonical data access
- Lock agent_executions/agent_tasks/agent_events/agent_logs as canonical tables

**5. Schema Normalization**
- Normalize tenant_id to UUID across all tables
- Resolve TEXT vs UUID fragmentation
- Fix FK constraints
- Ensure schema coherence

**6. Dashboard Readiness**
- Prepare real-data attachment points
- Define canonical data sources for each dashboard section
- Prepare polling/fetch model
- Remove hardcoded mocks (after data attachment ready)

**7. Provider Attachment Readiness**
- Define required environment variables
- Define required credential persistence
- Define required runtime hooks
- Define required artifact hooks
- Define required execution contracts

### What Stabilization DOES NOT Include

**NOT Included:**
- Provider adapter implementation (separate phase)
- n8n configuration (separate phase)
- Feature flag activation (separate phase)
- New orchestration systems
- New abstraction layers
- Generic AI framework expansion
- Excessive event sourcing
- Premature scaling systems
- Unnecessary microservices
- Parallel runtimes
- Duplicated execution paths

**Rationale:** Stabilization phase is about fixing foundation, not adding new capabilities. Provider operationalization is a separate phase after stabilization is complete.

---

## SECTION 2 — CANONICAL SYSTEMS (LOCKED)

### Canonical Runtime (LOCKED)

**1. RuntimeService**
- **Location:** `/apps/web/lib/runtime/services/runtime.service.ts`
- **Purpose:** Facade service composing all runtime services
- **Status:** OPERATIONAL
- **Usage:** Used by all agent execution routes
- **LOCKED:** This is the canonical runtime facade. All agents MUST use RuntimeService.

**2. ExecutionOrchestrator**
- **Location:** `/apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`
- **Purpose:** Coordinates execution lifecycle with auto event publishing and logging
- **Status:** OPERATIONAL
- **Usage:** Used by ARIA and SCRIBE routes directly
- **LOCKED:** This is the canonical execution coordinator. All agents MUST use ExecutionOrchestrator directly.

**3. ExecutionService**
- **Location:** `/apps/web/lib/runtime/services/execution.service.ts`
- **Purpose:** Execution CRUD operations
- **Status:** OPERATIONAL
- **Usage:** Used by ExecutionOrchestrator
- **LOCKED:** This is the canonical execution service.

**4. TaskService**
- **Location:** `/apps/web/lib/runtime/services/task.service.ts`
- **Purpose:** Task CRUD operations
- **Status:** OPERATIONAL (needs build fix)
- **Usage:** Used by ExecutionOrchestrator
- **LOCKED:** This is the canonical task service.

**5. EventService**
- **Location:** `/apps/web/lib/runtime/services/event.service.ts`
- **Purpose:** Event publishing
- **Status:** OPERATIONAL
- **Usage:** Used by ExecutionOrchestrator
- **LOCKED:** This is the canonical event service.

**6. LogService**
- **Location:** `/apps/web/lib/runtime/services/log.service.ts`
- **Purpose:** Log writing
- **Status:** OPERATIONAL
- **Usage:** Used by ExecutionOrchestrator
- **LOCKED:** This is the canonical log service.

**7. MetricsService**
- **Location:** `/apps/web/lib/runtime/services/metrics.service.ts`
- **Purpose:** Metrics collection
- **Status:** OPERATIONAL
- **Usage:** Used by RuntimeService
- **LOCKED:** This is the canonical metrics service.

### Canonical Persistence (LOCKED)

**1. agent_executions**
- **Purpose:** Execution tracking
- **Status:** OPERATIONAL (needs RLS fix, tenant_id normalization)
- **LOCKED:** This is the canonical execution table.

**2. agent_tasks**
- **Purpose:** Task tracking
- **Status:** OPERATIONAL (needs RLS fix)
- **LOCKED:** This is the canonical task table.

**3. agent_events**
- **Purpose:** Event logging
- **Status:** OPERATIONAL (needs RLS fix, tenant_id normalization)
- **LOCKED:** This is the canonical event table.

**4. agent_logs**
- **Purpose:** Log logging
- **Status:** OPERATIONAL (needs RLS fix)
- **LOCKED:** This is the canonical log table.

**5. seo_keywords**
- **Purpose:** Keyword artifacts (ARIA)
- **Status:** OPERATIONAL (needs tenant_id normalization)
- **LOCKED:** This is the canonical keyword artifact table.

**6. seo_content_briefs**
- **Purpose:** Content brief artifacts (ARIA)
- **Status:** OPERATIONAL (needs tenant_id normalization)
- **LOCKED:** This is the canonical content brief artifact table.

**7. seo_drafts**
- **Purpose:** Content draft artifacts (SCRIBE, AMPLI)
- **Status:** OPERATIONAL (needs tenant_id normalization)
- **LOCKED:** This is the canonical content draft artifact table.

**8. seo_reports**
- **Purpose:** Report artifacts (PRISM)
- **Status:** OPERATIONAL (needs tenant_id normalization, currently unused)
- **LOCKED:** This is the canonical report artifact table.

**9. pulse_rankings**
- **Purpose:** Ranking artifacts (PULSE)
- **Status:** OPERATIONAL (needs tenant_id normalization, currently unused)
- **LOCKED:** This is the canonical ranking artifact table.

**10. locl_audits**
- **Purpose:** GBP audit artifacts (LOCL)
- **Status:** OPERATIONAL (needs tenant_id normalization, currently unused)
- **LOCKED:** This is the canonical GBP audit artifact table.

**11. integrations**
- **Purpose:** Credential storage
- **Status:** OPERATIONAL (needs RLS fix, tenant_id normalization)
- **LOCKED:** This is the canonical credential storage table.

**12. business_profiles**
- **Purpose:** Business data
- **Status:** OPERATIONAL (needs RLS fix)
- **LOCKED:** This is the canonical business data table.

**13. tenants**
- **Purpose:** Tenant management
- **Status:** OPERATIONAL (needs RLS fix)
- **LOCKED:** This is the canonical tenant table.

**14. profiles**
- **Purpose:** User profiles (Clerk integration)
- **Status:** OPERATIONAL (needs RLS fix)
- **LOCKED:** This is the canonical user profile table.

### Canonical Execution Path (LOCKED)

**UI Action**
  ↓
**API Route** (`/api/agents/{agent}/execute`)
  ↓
**ExecutionOrchestrator** (canonical)
  ↓
**RuntimeService** (canonical facade)
  ↓
**ExecutionService.createExecution()** (canonical)
  ↓
**agent_executions** (canonical table)
  ↓
**ExecutionService.startExecution()** (canonical)
  ↓
**Task execution loop**
  ↓
**Task Implementation** (`lib/runtime/tasks/{agent}.tasks.ts`)
  ↓
**Provider Adapter** (to be implemented in separate phase)
  ↓
**Task Result**
  ↓
**TaskService.updateTask()** (canonical)
  ↓
**agent_tasks** (canonical table)
  ↓
**EventService.publishEvent()** (canonical)
  ↓
**agent_events** (canonical table)
  ↓
**Artifact Generation**
  ↓
**seo_* tables** (canonical artifact tables)
  ↓
**ExecutionService.completeExecution()** (canonical)
  ↓
**agent_executions.status = 'completed'** (canonical)
  ↓
**Dashboard Hydration** (to be implemented in separate phase)

### Systems Officially Frozen/Deprecated

**1. runtime_executions**
- **Status:** DEAD CODE
- **Action:** FREEZE - DO NOT USE, DO NOT MODIFY, REMOVE FROM CODEBASE

**2. runtime_tasks**
- **Status:** DEAD CODE
- **Action:** FREEZE - DO NOT USE, DO NOT MODIFY, REMOVE FROM CODEBASE

**3. runtime_workflows**
- **Status:** DEAD CODE
- **Action:** FREEZE - DO NOT USE, DO NOT MODIFY, REMOVE FROM CODEBASE

**4. runtime_thinking_logs**
- **Status:** DEAD CODE
- **Action:** FREEZE - DO NOT USE, DO NOT MODIFY, REMOVE FROM CODEBASE

**5. runtime_artifacts**
- **Status:** DEAD CODE
- **Action:** FREEZE - DO NOT USE, DO NOT MODIFY, REMOVE FROM CODEBASE

**6. agent_runs**
- **Status:** LEGACY
- **Action:** FREEZE - DO NOT USE, DO NOT MODIFY, REMOVE FROM CODEBASE

**7. agent_states**
- **Status:** LEGACY
- **Action:** FREEZE - DO NOT USE, DO NOT MODIFY, REMOVE FROM CODEBASE

**8. PulseAgentRuntime**
- **Status:** DUPLICATE
- **Action:** FREEZE - MIGRATE TO ExecutionOrchestrator, REMOVE FROM CODEBASE

**9. LoclAgentRuntime**
- **Status:** DUPLICATE
- **Action:** FREEZE - MIGRATE TO ExecutionOrchestrator, REMOVE FROM CODEBASE

**10. LinxAgentRuntime**
- **Status:** DUPLICATE
- **Action:** FREEZE - MIGRATE TO ExecutionOrchestrator, REMOVE FROM CODEBASE

**11. ReputeAgentRuntime**
- **Status:** DUPLICATE
- **Action:** FREEZE - MIGRATE TO ExecutionOrchestrator, REMOVE FROM CODEBASE

**12. PrismAgentRuntime**
- **Status:** DUPLICATE
- **Action:** FREEZE - MIGRATE TO ExecutionOrchestrator, REMOVE FROM CODEBASE

**13. AmpliAgentRuntime**
- **Status:** NOT FOUND (uses direct route)
- **Action:** MIGRATE TO ExecutionOrchestrator

**14. FINAL_DATABASE_PACKAGE.sql**
- **Status:** CONFLICTING
- **Action:** FREEZE - DO NOT USE, CHOOSE MIGRATIONS AS CANONICAL

**15. RUNTIME_TABLES.sql**
- **Status:** DEAD CODE
- **Action:** FREEZE - DO NOT USE, REMOVE FROM CODEBASE

**16. ONBOARDING_TABLES.sql**
- **Status:** PARTIAL
- **Action:** FREEZE - MERGE INTO MIGRATIONS, REMOVE FROM CODEBASE

---

## SECTION 3 — CRITICAL REPAIR SEQUENCE

### Exact Execution Order for Stabilization

The sequence is surgical. Order matters because:
- Database migrations must be ordered to avoid FK breakage
- RLS fixes must precede tenant_id normalization
- Runtime convergence must precede dashboard hydration
- Build fixes must precede all other work

### Phase 1: Build Repair (1-2 hours)

**Task 1.1: Fix TypeScript Build Error**
- **File:** `/apps/web/lib/runtime/services/task.service.ts`
- **Issue:** `Module '"../types"' has no exported member 'Task'`
- **Action:** Either export `Task` from types file or remove unused import
- **Risk:** LOW
- **Rollback:** Revert file change
- **Validation:** Run `npm run build` and `npm run type-check`

**Task 1.2: Verify Build Success**
- **Action:** Run full production build
- **Validation:** Build succeeds without errors
- **Risk:** LOW
- **Rollback:** N/A

**Dependency Order:** This must be FIRST. Cannot proceed until build succeeds.

### Phase 2: Tenant Isolation Repair (2-3 hours)

**Task 2.1: Fix RLS Policies for agent_executions**
- **File:** `/supabase/migrations/20250109_create_agent_executions_table.sql`
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Risk:** MEDIUM (security-critical)
- **Rollback:** Revert migration
- **Validation:** Test tenant isolation with multi-tenant data

**Task 2.2: Fix RLS Policies for agent_tasks**
- **File:** `/supabase/migrations/20250109_create_agent_tasks_table.sql`
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Risk:** MEDIUM (security-critical)
- **Rollback:** Revert migration
- **Validation:** Test tenant isolation with multi-tenant data

**Task 2.3: Fix RLS Policies for agent_events**
- **File:** `/supabase/migrations/20250109_create_agent_events_table.sql`
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Risk:** MEDIUM (security-critical)
- **Rollback:** Revert migration
- **Validation:** Test tenant isolation with multi-tenant data

**Task 2.4: Fix RLS Policies for agent_logs**
- **File:** `/supabase/migrations/20250109_create_agent_logs_table.sql`
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Risk:** MEDIUM (security-critical)
- **Rollback:** Revert migration
- **Validation:** Test tenant isolation with multi-tenant data

**Task 2.5: Fix RLS Policies for integrations**
- **File:** `/supabase/create_integrations_table.sql`
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Risk:** MEDIUM (security-critical)
- **Rollback:** Revert migration
- **Validation:** Test tenant isolation with multi-tenant data

**Task 2.6: Fix RLS Policies for pulse_rankings**
- **File:** `/supabase/create_pulse_rankings_table.sql`
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Risk:** MEDIUM (security-critical)
- **Rollback:** Revert migration
- **Validation:** Test tenant isolation with multi-tenant data

**Task 2.7: Fix RLS Policies for publish_jobs**
- **File:** `/supabase/create_publish_jobs_table.sql`
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Risk:** MEDIUM (security-critical)
- **Rollback:** Revert migration
- **Validation:** Test tenant isolation with multi-tenant data

**Task 2.8: Fix RLS Policies for locl_audits**
- **File:** `/supabase/create_locl_audits_table.sql`
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Risk:** MEDIUM (security-critical)
- **Rollback:** Revert migration
- **Validation:** Test tenant isolation with multi-tenant data

**Task 2.9: Fix RLS Policies for indexing_status**
- **File:** `/supabase/create_indexing_status_table.sql`
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Risk:** MEDIUM (security-critical)
- **Rollback:** Revert migration
- **Validation:** Test tenant isolation with multi-tenant data

**Dependency Order:** This must be SECOND. RLS fixes are security-critical and must be completed before any tenant_id normalization.

### Phase 3: tenant_id Normalization (4-6 hours)

**Task 3.1: Determine Canonical tenant_id Type**
- **Decision:** UUID is canonical type (matches Clerk user IDs)
- **Rationale:** Onboarding tables use UUID, repositories expect UUID
- **Risk:** LOW (decision only)
- **Rollback:** N/A

**Task 3.2: Create Migration to Convert TEXT to UUID for agent_executions**
- **File:** New migration file
- **Change:** `ALTER TABLE agent_executions ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data, verify FKs still work
- **Prerequisite:** RLS fixes completed

**Task 3.3: Create Migration to Convert TEXT to UUID for agent_tasks**
- **File:** New migration file
- **Change:** `ALTER TABLE agent_tasks ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data, verify FKs still work
- **Prerequisite:** agent_executions migration completed

**Task 3.4: Create Migration to Convert TEXT to UUID for agent_events**
- **File:** New migration file
- **Change:** `ALTER TABLE agent_events ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data, verify FKs still work
- **Prerequisite:** agent_executions migration completed

**Task 3.5: Create Migration to Convert TEXT to UUID for seo_keywords**
- **File:** New migration file
- **Change:** `ALTER TABLE seo_keywords ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data
- **Prerequisite:** agent_executions migration completed

**Task 3.6: Create Migration to Convert TEXT to UUID for seo_content_briefs**
- **File:** New migration file
- **Change:** `ALTER TABLE seo_content_briefs ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data
- **Prerequisite:** agent_executions migration completed

**Task 3.7: Create Migration to Convert TEXT to UUID for seo_drafts**
- **File:** New migration file
- **Change:** `ALTER TABLE seo_drafts ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data
- **Prerequisite:** agent_executions migration completed

**Task 3.8: Create Migration to Convert TEXT to UUID for seo_reports**
- **File:** New migration file
- **Change:** `ALTER TABLE seo_reports ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data
- **Prerequisite:** agent_executions migration completed

**Task 3.9: Create Migration to Convert TEXT to UUID for pulse_rankings**
- **File:** New migration file
- **Change:** `ALTER TABLE pulse_rankings ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data
- **Prerequisite:** agent_executions migration completed

**Task 3.10: Create Migration to Convert TEXT to UUID for locl_audits**
- **File:** New migration file
- **Change:** `ALTER TABLE locl_audits ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data
- **Prerequisite:** agent_executions migration completed

**Task 3.11: Create Migration to Convert TEXT to UUID for integrations**
- **File:** New migration file
- **Change:** `ALTER TABLE integrations ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data
- **Prerequisite:** agent_executions migration completed

**Task 3.12: Create Migration to Convert TEXT to UUID for publish_jobs**
- **File:** New migration file
- **Change:** `ALTER TABLE publish_jobs ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data
- **Prerequisite:** agent_executions migration completed

**Task 3.13: Create Migration to Convert TEXT to UUID for indexing_status**
- **File:** New migration file
- **Change:** `ALTER TABLE indexing_status ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid`
- **Risk:** HIGH (type conversion)
- **Rollback:** Revert migration, restore from backup
- **Validation:** Test with existing data
- **Prerequisite:** agent_executions migration completed

**Dependency Order:** This must be THIRD. RLS fixes must be completed first. Type conversions are HIGH RISK and must be done sequentially with FK dependencies in mind.

### Phase 4: Dead Runtime Elimination (2-3 hours)

**Task 4.1: Remove runtime_executions References**
- **Files:** Search for all references to runtime_executions
- **Action:** Remove all references, delete table from FINAL_DATABASE_PACKAGE.sql if present
- **Risk:** LOW (dead code)
- **Rollback:** Git revert
- **Validation:** Build succeeds, tests pass

**Task 4.2: Remove runtime_tasks References**
- **Files:** Search for all references to runtime_tasks
- **Action:** Remove all references, delete table from FINAL_DATABASE_PACKAGE.sql if present
- **Risk:** LOW (dead code)
- **Rollback:** Git revert
- **Validation:** Build succeeds, tests pass

**Task 4.3: Remove runtime_workflows References**
- **Files:** Search for all references to runtime_workflows
- **Action:** Remove all references, delete table from FINAL_DATABASE_PACKAGE.sql if present
- **Risk:** LOW (dead code)
- **Rollback:** Git revert
- **Validation:** Build succeeds, tests pass

**Task 4.4: Remove runtime_thinking_logs References**
- **Files:** Search for all references to runtime_thinking_logs
- **Action:** Remove all references, delete table from FINAL_DATABASE_PACKAGE.sql if present
- **Risk:** LOW (dead code)
- **Rollback:** Git revert
- **Validation:** Build succeeds, tests pass

**Task 4.5: Remove runtime_artifacts References**
- **Files:** Search for all references to runtime_artifacts
- **Action:** Remove all references, delete table from FINAL_DATABASE_PACKAGE.sql if present
- **Risk:** LOW (dead code)
- **Rollback:** Git revert
- **Validation:** Build succeeds, tests pass

**Task 4.6: Remove agent_runs References**
- **Files:** Search for all references to agent_runs
- **Action:** Remove all references
- **Risk:** LOW (dead code)
- **Rollback:** Git revert
- **Validation:** Build succeeds, tests pass

**Task 4.7: Remove agent_states References**
- **Files:** Search for all references to agent_states
- **Action:** Remove all references
- **Risk:** LOW (dead code)
- **Rollback:** Git revert
- **Validation:** Build succeeds, tests pass

**Task 4.8: Delete RUNTIME_TABLES.sql**
- **File:** `/supabase/RUNTIME_TABLES.sql`
- **Action:** Delete file
- **Risk:** LOW (dead code)
- **Rollback:** Git revert
- **Validation:** Build succeeds

**Dependency Order:** This must be FOURTH. tenant_id normalization must be completed first to avoid confusion with table types.

### Phase 5: Execution System Convergence (3-4 hours)

**Task 5.1: Migrate PULSE to Use ExecutionOrchestrator Directly**
- **File:** `/apps/web/app/api/agents/pulse/execute/route.ts`
- **Change:** Replace PulseAgentRuntime with ExecutionOrchestrator
- **Action:** Create PULSE_WORKFLOW definition, use ExecutionOrchestrator directly
- **Risk:** MEDIUM (runtime change)
- **Rollback:** Git revert
- **Validation:** Test PULSE execution

**Task 5.2: Migrate LOCL to Use ExecutionOrchestrator Directly**
- **File:** `/apps/web/app/api/agents/locl/execute/route.ts`
- **Change:** Replace LoclAgentRuntime with ExecutionOrchestrator
- **Action:** Create LOCL_WORKFLOW definition, use ExecutionOrchestrator directly
- **Risk:** MEDIUM (runtime change)
- **Rollback:** Git revert
- **Validation:** Test LOCL execution

**Task 5.3: Migrate LINX to Use ExecutionOrchestrator Directly**
- **File:** `/apps/web/app/api/agents/linx/execute/route.ts`
- **Change:** Replace LinxAgentRuntime with ExecutionOrchestrator
- **Action:** Create LINX_WORKFLOW definition, use ExecutionOrchestrator directly
- **Risk:** MEDIUM (runtime change)
- **Rollback:** Git revert
- **Validation:** Test LINX execution

**Task 5.4: Migrate REPUTE to Use ExecutionOrchestrator Directly**
- **File:** `/apps/web/app/api/agents/repute/execute/route.ts`
- **Change:** Replace ReputeAgentRuntime with ExecutionOrchestrator
- **Action:** Create REPUTE_WORKFLOW definition, use ExecutionOrchestrator directly
- **Risk:** MEDIUM (runtime change)
- **Rollback:** Git revert
- **Validation:** Test REPUTE execution

**Task 5.5: Migrate PRISM to Use ExecutionOrchestrator Directly**
- **File:** `/apps/web/app/api/agents/prism/execute/route.ts`
- **Change:** Replace PrismAgentRuntime with ExecutionOrchestrator
- **Action:** Create PRISM_WORKFLOW definition, use ExecutionOrchestrator directly
- **Risk:** MEDIUM (runtime change)
- **Rollback:** Git revert
- **Validation:** Test PRISM execution

**Task 5.6: Migrate AMPLI to Use ExecutionOrchestrator Directly**
- **File:** `/apps/web/app/api/agents/ampli/execute/route.ts` (create if needed)
- **Change:** Use ExecutionOrchestrator directly
- **Action:** Create AMPLI_WORKFLOW definition, use ExecutionOrchestrator directly
- **Risk:** MEDIUM (runtime change)
- **Rollback:** Git revert
- **Validation:** Test AMPLI execution

**Task 5.7: Delete PulseAgentRuntime**
- **File:** `/apps/web/lib/agents/pulse/runtime.ts`
- **Action:** Delete file
- **Risk:** LOW (dead code after migration)
- **Rollback:** Git revert
- **Validation:** Build succeeds

**Task 5.8: Delete LoclAgentRuntime**
- **File:** `/apps/web/lib/agents/locl/runtime.ts`
- **Action:** Delete file
- **Risk:** LOW (dead code after migration)
- **Rollback:** Git revert
- **Validation:** Build succeeds

**Task 5.9: Delete LinxAgentRuntime**
- **File:** `/apps/web/lib/agents/linx/runtime.ts`
- **Action:** Delete file
- **Risk:** LOW (dead code after migration)
- **Rollback:** Git revert
- **Validation:** Build succeeds

**Task 5.10: Delete ReputeAgentRuntime**
- **File:** `/apps/web/lib/agents/repute/runtime.ts`
- **Action:** Delete file
- **Risk:** LOW (dead code after migration)
- **Rollback:** Git revert
- **Validation:** Build succeeds

**Task 5.11: Delete PrismAgentRuntime**
- **File:** `/apps/web/lib/agents/prism/runtime.ts`
- **Action:** Delete file
- **Risk:** LOW (dead code after migration)
- **Rollback:** Git revert
- **Validation:** Build succeeds

**Dependency Order:** This must be FIFTH. Dead runtime elimination must be completed first to avoid confusion.

### Phase 6: Repository Convergence (1-2 hours)

**Task 6.1: Verify Repository Scoping**
- **Files:** All repository files in `/apps/web/lib/runtime/repositories/`
- **Action:** Verify all repositories use tenant_id scoping correctly
- **Risk:** LOW (verification only)
- **Rollback:** N/A
- **Validation:** Manual code review

**Task 6.2: Remove Duplicate Repository Patterns**
- **Files:** Search for duplicate repository implementations
- **Action:** Consolidate to canonical repository pattern
- **Risk:** LOW (cleanup)
- **Rollback:** Git revert
- **Validation:** Build succeeds, tests pass

**Dependency Order:** This must be SIXTH. Execution system convergence must be completed first.

### Phase 7: Feature Flag Activation Strategy (1 hour)

**Task 7.1: Define Feature Flag Activation Model**
- **File:** `/apps/web/lib/integrations/mesh/feature-flags.ts`
- **Action:** Document safe progressive activation model
- **Risk:** LOW (documentation only)
- **Rollback:** N/A
- **Validation:** Manual review

**Task 7.2: Prepare Feature Flag Environment Variables**
- **File:** `/apps/web/.env.example`
- **Action:** Add feature flag variables to .env.example
- **Risk:** LOW (documentation only)
- **Rollback:** N/A
- **Validation:** Manual review

**Dependency Order:** This must be SEVENTH. This is preparation only, no activation yet.

### Phase 8: Dashboard Hydration Preparation (2-3 hours)

**Task 8.1: Define Dashboard Data Sources**
- **File:** `/apps/web/components/dashboard/MissionControl.tsx`
- **Action:** Document canonical data sources for each dashboard section
- **Risk:** LOW (documentation only)
- **Rollback:** N/A
- **Validation:** Manual review

**Task 8.2: Prepare Agent Status API Route**
- **File:** Create `/apps/web/app/api/dashboard/agent-status/route.ts`
- **Action:** Create API route to fetch real agent status from agent_executions
- **Risk:** LOW (new API route)
- **Rollback:** Delete file
- **Validation:** Test API route

**Task 8.3: Prepare Agent Progress API Route**
- **File:** Create `/apps/web/app/api/dashboard/agent-progress/route.ts`
- **Action:** Create API route to fetch real agent progress from agent_tasks
- **Risk:** LOW (new API route)
- **Rollback:** Delete file
- **Validation:** Test API route

**Task 8.4: Prepare Task Feed API Route**
- **File:** Create `/apps/web/app/api/dashboard/task-feed/route.ts`
- **Action:** Create API route to fetch real task feed from agent_events
- **Risk:** LOW (new API route)
- **Rollback:** Delete file
- **Validation:** Test API route

**Dependency Order:** This must be EIGHTH. Execution system convergence must be completed first.

---

## SECTION 4 — DATABASE MIGRATION STRATEGY

### Exact Migration Sequence

**CRITICAL:** Database migrations must be ordered to avoid FK breakage. Type conversions are HIGH RISK and must be done with production backups.

### Migration 1: RLS Policy Fixes (Security-Critical)

**M1.1: Fix RLS for agent_executions**
```sql
-- Migration file: 20250115_fix_rls_agent_executions.sql
ALTER TABLE agent_executions DROP POLICY IF EXISTS "tenant_isolation_policy";
CREATE POLICY "tenant_isolation_policy" ON agent_executions
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**M1.2: Fix RLS for agent_tasks**
```sql
-- Migration file: 20250115_fix_rls_agent_tasks.sql
ALTER TABLE agent_tasks DROP POLICY IF EXISTS "tenant_isolation_policy";
CREATE POLICY "tenant_isolation_policy" ON agent_tasks
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**M1.3: Fix RLS for agent_events**
```sql
-- Migration file: 20250115_fix_rls_agent_events.sql
ALTER TABLE agent_events DROP POLICY IF EXISTS "tenant_isolation_policy";
CREATE POLICY "tenant_isolation_policy" ON agent_events
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**M1.4: Fix RLS for agent_logs**
```sql
-- Migration file: 20250115_fix_rls_agent_logs.sql
ALTER TABLE agent_logs DROP POLICY IF EXISTS "tenant_isolation_policy";
CREATE POLICY "tenant_isolation_policy" ON agent_logs
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**M1.5: Fix RLS for integrations**
```sql
-- Migration file: 20250115_fix_rls_integrations.sql
ALTER TABLE integrations DROP POLICY IF EXISTS "tenant_isolation_policy";
CREATE POLICY "tenant_isolation_policy" ON integrations
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**M1.6: Fix RLS for pulse_rankings**
```sql
-- Migration file: 20250115_fix_rls_pulse_rankings.sql
ALTER TABLE pulse_rankings DROP POLICY IF EXISTS "tenant_isolation_policy";
CREATE POLICY "tenant_isolation_policy" ON pulse_rankings
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**M1.7: Fix RLS for publish_jobs**
```sql
-- Migration file: 20250115_fix_rls_publish_jobs.sql
ALTER TABLE publish_jobs DROP POLICY IF EXISTS "tenant_isolation_policy";
CREATE POLICY "tenant_isolation_policy" ON publish_jobs
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**M1.8: Fix RLS for locl_audits**
```sql
-- Migration file: 20250115_fix_rls_locl_audits.sql
ALTER TABLE locl_audits DROP POLICY IF EXISTS "tenant_isolation_policy";
CREATE POLICY "tenant_isolation_policy" ON locl_audits
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**M1.9: Fix RLS for indexing_status**
```sql
-- Migration file: 20250115_fix_rls_indexing_status.sql
ALTER TABLE indexing_status DROP POLICY IF EXISTS "tenant_isolation_policy";
CREATE POLICY "tenant_isolation_policy" ON indexing_status
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**Affected Tables:** agent_executions, agent_tasks, agent_events, agent_logs, integrations, pulse_rankings, publish_jobs, locl_audits, indexing_status

**FK Break Risks:** NONE (RLS policy changes don't affect FKs)

**Type Conversion Risks:** NONE (no type changes)

**Production Safety:** HIGH (security-critical changes, but low data risk)

**Rollback Strategy:** Revert individual migrations

**Prerequisites:** Database backup before migration

### Migration 2: tenant_id Normalization (High Risk)

**M2.1: Convert agent_executions.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_agent_executions.sql
-- PREREQUISITE: RLS fixes completed
-- PREREQUISITE: Database backup
-- PREREQUISITE: Verify all tenant_id values are valid UUIDs

-- First, verify no invalid data
SELECT id, tenant_id FROM agent_executions WHERE tenant_id IS NOT NULL AND tenant_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- If no invalid data, proceed with conversion
ALTER TABLE agent_executions 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.2: Convert agent_tasks.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_agent_tasks.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE agent_tasks 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.3: Convert agent_events.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_agent_events.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE agent_events 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.4: Convert seo_keywords.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_seo_keywords.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE seo_keywords 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.5: Convert seo_content_briefs.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_seo_content_briefs.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE seo_content_briefs 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.6: Convert seo_drafts.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_seo_drafts.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE seo_drafts 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.7: Convert seo_reports.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_seo_reports.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE seo_reports 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.8: Convert pulse_rankings.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_pulse_rankings.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE pulse_rankings 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.9: Convert locl_audits.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_locl_audits.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE locl_audits 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.10: Convert integrations.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_integrations.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE integrations 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.11: Convert publish_jobs.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_publish_jobs.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE publish_jobs 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**M2.12: Convert indexing_status.tenant_id to UUID**
```sql
-- Migration file: 20250115_normalize_tenant_id_indexing_status.sql
-- PREREQUISITE: agent_executions migration completed

ALTER TABLE indexing_status 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;
```

**Affected Tables:** agent_executions, agent_tasks, agent_events, seo_keywords, seo_content_briefs, seo_drafts, seo_reports, pulse_rankings, locl_audits, integrations, publish_jobs, indexing_status

**FK Break Risks:** LOW (FKs should work after type conversion if data is valid)

**Type Conversion Risks:** HIGH (if data contains invalid UUIDs, conversion will fail)

**Production Safety:** MEDIUM (type conversion is risky, but rollback is available)

**Rollback Strategy:** Restore from database backup

**Prerequisites:** 
1. RLS fixes completed
2. Database backup
3. Verify all tenant_id values are valid UUIDs before conversion
4. Test migration on staging environment first

**Backward Compatibility:** 
- Repositories expect UUID, so this aligns with repository expectations
- Clerk user IDs are UUID, so this aligns with auth
- Onboarding tables use UUID, so this aligns with existing data

**Repository Impact:** POSITIVE - aligns with repository expectations

**Auth Impact:** POSITIVE - aligns with Clerk user IDs

**Onboarding Impact:** POSITIVE - aligns with onboarding tables

### Migration 3: Dead Table Cleanup (Low Risk)

**M3.1: Remove runtime_executions Table**
```sql
-- Migration file: 20250115_remove_runtime_executions.sql
DROP TABLE IF EXISTS runtime_executions CASCADE;
```

**M3.2: Remove runtime_tasks Table**
```sql
-- Migration file: 20250115_remove_runtime_tasks.sql
DROP TABLE IF EXISTS runtime_tasks CASCADE;
```

**M3.3: Remove runtime_workflows Table**
```sql
-- Migration file: 20250115_remove_runtime_workflows.sql
DROP TABLE IF EXISTS runtime_workflows CASCADE;
```

**M3.4: Remove runtime_thinking_logs Table**
```sql
-- Migration file: 20250115_remove_runtime_thinking_logs.sql
DROP TABLE IF EXISTS runtime_thinking_logs CASCADE;
```

**M3.5: Remove runtime_artifacts Table**
```sql
-- Migration file: 20250115_remove_runtime_artifacts.sql
DROP TABLE IF EXISTS runtime_artifacts CASCADE;
```

**M3.6: Remove agent_runs Table**
```sql
-- Migration file: 20250115_remove_agent_runs.sql
DROP TABLE IF EXISTS agent_runs CASCADE;
```

**M3.7: Remove agent_states Table**
```sql
-- Migration file: 20250115_remove_agent_states.sql
DROP TABLE IF EXISTS agent_states CASCADE;
```

**Affected Tables:** runtime_executions, runtime_tasks, runtime_workflows, runtime_thinking_logs, runtime_artifacts, agent_runs, agent_states

**FK Break Risks:** NONE (dead tables have no active FKs)

**Type Conversion Risks:** NONE

**Production Safety:** HIGH (dead table cleanup, no data loss)

**Rollback Strategy:** Revert migrations, restore from backup (if needed)

**Prerequisites:** tenant_id normalization completed

### SAFE MIGRATION ORDER

**Order:**
1. M1 (RLS fixes) - Security-critical, no data risk
2. M2 (tenant_id normalization) - High risk, but after RLS fixes
3. M3 (dead table cleanup) - Low risk, after type conversions

**Why This Order:**
- RLS fixes first because they're security-critical and don't affect data
- tenant_id normalization second because it's high risk but depends on RLS fixes being correct
- Dead table cleanup last because it's low risk and depends on type conversions being complete

**No Dangerous Migrations:** All migrations are safe if prerequisites are met and database backup is taken before type conversions.

---

## SECTION 5 — RLS & SECURITY STABILIZATION

### Exact RLS Repair Strategy

**Current Issue:** All RLS policies use `auth.uid()` instead of `auth.jwt() ->> 'sub'`. This is incompatible with Clerk authentication.

**Clerk ↔ Supabase Mapping:**
- Clerk user ID is in JWT sub claim
- Supabase auth.uid() returns Supabase auth user ID (not Clerk user ID)
- Correct mapping: `auth.jwt() ->> 'sub'` extracts Clerk user ID from JWT

### Exact Security Risks

**Risk 1: Tenant Isolation Bypass**
- **Severity:** CRITICAL
- **Impact:** Any authenticated user could access other tenants' data
- **Root Cause:** RLS policies use auth.uid() which doesn't match Clerk user IDs
- **Mitigation:** Replace auth.uid() with auth.jwt()->>'sub'

**Risk 2: Cross-Tenant Data Leakage**
- **Severity:** CRITICAL
- **Impact:** Queries could return data from wrong tenant
- **Root Cause:** Same as Risk 1
- **Mitigation:** Same as Risk 1

**Risk 3: Unauthorized Access**
- **Severity:** CRITICAL
- **Impact:** Users could access data they shouldn't see
- **Root Cause:** Same as Risk 1
- **Mitigation:** Same as Risk 1

### Exact Fixes

**Fix 1: Update RLS Policies for All Tables**
- **Tables:** agent_executions, agent_tasks, agent_events, agent_logs, integrations, pulse_rankings, publish_jobs, locl_audits, indexing_status
- **Change:** Replace `auth.uid()` with `auth.jwt() ->> 'sub'`
- **Example:**
```sql
-- BEFORE (BROKEN)
CREATE POLICY "tenant_isolation_policy" ON agent_executions
  FOR ALL
  TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- AFTER (FIXED)
CREATE POLICY "tenant_isolation_policy" ON agent_executions
  FOR ALL
  TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'sub')
  WITH CHECK (tenant_id::text = auth.jwt() ->> 'sub');
```

**Fix 2: Update Repository Scoping**
- **Files:** All repository files in `/apps/web/lib/runtime/repositories/`
- **Change:** Verify all repositories use tenant_id from Clerk JWT, not Supabase auth
- **Validation:** Manual code review

**Fix 3: Update API Route Validation**
- **Files:** All API routes
- **Change:** Verify all API routes validate tenant_id from Clerk JWT, not Supabase auth
- **Validation:** Manual code review

### Exact Validation Strategy

**Validation 1: Multi-Tenant Data Test**
- **Action:** Create test with two tenants, verify no cross-tenant data access
- **Expected:** Each tenant can only access their own data
- **Failure:** Cross-tenant data access indicates RLS fix failed

**Validation 2: Repository Scoping Test**
- **Action:** Create test for each repository, verify tenant_id scoping
- **Expected:** Each repository only returns data for correct tenant
- **Failure:** Repository returns wrong tenant data indicates scoping issue

**Validation 3: API Route Validation Test**
- **Action:** Create test for each API route, verify tenant validation
- **Expected:** Each API route validates tenant_id from Clerk JWT
- **Failure:** API route allows cross-tenant access indicates validation issue

**Priority:** HIGH - Security-critical, must be completed before any other work

---

## SECTION 6 — EXECUTION SYSTEM CONVERGENCE

### Canonical Execution Topology

**BEFORE (Fragmented):**
```
UI
  ↓
API Route
  ↓
Agent-Specific Runtime Wrapper (PulseAgentRuntime, LoclAgentRuntime, etc.)
  ↓
RuntimeService
  ↓
ExecutionOrchestrator
  ↓
ExecutionService
  ↓
agent_executions OR runtime_executions (fragmented)
```

**AFTER (Converged):**
```
UI
  ↓
API Route
  ↓
ExecutionOrchestrator (canonical)
  ↓
RuntimeService (canonical facade)
  ↓
ExecutionService (canonical)
  ↓
agent_executions (canonical)
```

### Eliminate

**1. runtime_executions System**
- **Tables:** runtime_executions, runtime_tasks, runtime_workflows, runtime_thinking_logs, runtime_artifacts
- **Files:** RUNTIME_TABLES.sql
- **Reason:** DEAD CODE - never used in codebase
- **Action:** DROP TABLES CASCADE, delete files

**2. Agent-Specific Runtime Wrappers**
- **Files:** PulseAgentRuntime, LoclAgentRuntime, LinxAgentRuntime, ReputeAgentRuntime, PrismAgentRuntime
- **Reason:** DUPLICATE - all wrap RuntimeService and ExecutionOrchestrator
- **Action:** Migrate to ExecutionOrchestrator directly, delete files

**3. Dead Orchestration Layers**
- **Files:** Any orchestration files not used by ExecutionOrchestrator
- **Reason:** DEAD CODE - never used
- **Action:** Delete files

### Preserve

**1. ExecutionOrchestrator**
- **File:** `/apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`
- **Reason:** CANONICAL - coordinates execution lifecycle
- **Action:** Keep, use for all agents

**2. RuntimeService**
- **File:** `/apps/web/lib/runtime/services/runtime.service.ts`
- **Reason:** CANONICAL - facade service
- **Action:** Keep, use for all agents

**3. Repositories**
- **Files:** ExecutionRepository, TaskRepository, EventRepository, LogRepository
- **Reason:** CANONICAL - data access layer
- **Action:** Keep, use for all agents

**4. Workflow Definitions**
- **Files:** ARIA_WORKFLOW, SCRIBE_WORKFLOW
- **Reason:** CANONICAL - define execution plans
- **Action:** Keep, create similar definitions for other agents

**5. Artifact Persistence**
- **Tables:** seo_keywords, seo_content_briefs, seo_drafts, seo_reports, pulse_rankings, locl_audits
- **Reason:** CANONICAL - artifact storage
- **Action:** Keep, use for all agents

### FINAL EXECUTION TOPOLOGY MAP

```
UI Action (Dashboard, Manual Trigger, Webhook)
  ↓
API Route (/api/agents/{agent}/execute)
  ↓
ExecutionOrchestrator (canonical)
  ├─ createExecution(plan)
  ├─ startExecution(executionId)
  ├─ completeExecution(executionId)
  ├─ failExecution(executionId)
  └─ cancelExecution(executionId)
  ↓
RuntimeService (canonical facade)
  ├─ execution: ExecutionService
  ├─ task: TaskService
  ├─ event: EventService
  ├─ log: LogService
  └─ metrics: MetricsService
  ↓
ExecutionService (canonical)
  ├─ createExecution()
  ├─ startExecution()
  ├─ completeExecution()
  ├─ failExecution()
  └─ cancelExecution()
  ↓
TaskService (canonical)
  ├─ createTask()
  ├─ startTask()
  ├─ completeTask()
  ├─ failTask()
  └─ cancelTask()
  ↓
Task Implementation (lib/runtime/tasks/{agent}.tasks.ts)
  ├─ task_fetch_*
  ├─ task_process_*
  ├─ task_store_*
  └─ task_publish_*
  ↓
Provider Adapter (to be implemented in separate phase)
  ├─ OpenAI
  ├─ DataForSEO
  ├─ GSC
  ├─ GBP
  └─ CMS
  ↓
EventService (canonical)
  ├─ publishEvent()
  └─ getEvents()
  ↓
agent_events (canonical table)
  ↓
LogService (canonical)
  ├─ writeLog()
  └─ getLogs()
  ↓
agent_logs (canonical table)
  ↓
Artifact Generation
  ├─ seo_keywords (canonical)
  ├─ seo_content_briefs (canonical)
  ├─ seo_drafts (canonical)
  ├─ seo_reports (canonical)
  ├─ pulse_rankings (canonical)
  └─ locl_audits (canonical)
  ↓
Dashboard Hydration (to be implemented in separate phase)
  ├─ Agent Status API
  ├─ Agent Progress API
  ├─ Task Feed API
  └─ Analytics API
```

---

## SECTION 7 — FEATURE FLAG ACTIVATION STRATEGY

### Current Dispatch Flags

**Flags:**
- `ENABLE_ARIA_DISPATCH_EXECUTION` (default: false)
- `ENABLE_SCRIBE_DISPATCH_EXECUTION` (default: false)
- `ENABLE_LOCL_DISPATCH_EXECUTION` (default: false)
- `ENABLE_LINX_DISPATCH_EXECUTION` (default: false)
- `ENABLE_REPUTE_DISPATCH_EXECUTION` (default: false)
- `ENABLE_AMPLI_DISPATCH_EXECUTION` (default: false)
- `ENABLE_PRISM_DISPATCH_EXECUTION` (default: false)
- `ENABLE_PULSE_DISPATCH_EXECUTION` (default: false)

### Safe Progressive Activation Model

**Phase 1: Stabilization (No Activation)**
- **Action:** Keep all flags disabled
- **Rationale:** Stabilize foundation before activating any execution
- **Validation:** All stabilization tasks complete

**Phase 2: Single Agent Activation (ARIA)**
- **Action:** Enable `ENABLE_ARIA_DISPATCH_EXECUTION=true`
- **Rationale:** ARIA is easiest to operationalize (DataForSEO adapter only)
- **Validation:** Test ARIA keyword discovery end-to-end
- **Rollback:** Disable flag if issues

**Phase 3: Second Agent Activation (SCRIBE)**
- **Action:** Enable `ENABLE_SCRIBE_DISPATCH_EXECUTION=true`
- **Rationale:** SCRIBE is second easiest (OpenAI adapter only)
- **Validation:** Test SCRIBE content generation end-to-end
- **Rollback:** Disable flag if issues

**Phase 4: Third Agent Activation (AMPLI)**
- **Action:** Enable `ENABLE_AMPLI_DISPATCH_EXECUTION=true`
- **Rationale:** AMPLI depends on SCRIBE (needs drafts)
- **Validation:** Test AMPLI publishing end-to-end
- **Rollback:** Disable flag if issues

**Phase 5: Remaining Agents (One by One)**
- **Action:** Enable remaining flags one by one
- **Rationale:** Progressive rollout, isolate issues
- **Validation:** Test each agent end-to-end
- **Rollback:** Disable flag if issues

### Provider-by-Provider Activation

**Phase 1: DataForSEO Activation**
- **Agents:** ARIA, PULSE, LINX
- **Action:** Implement DataForSEO direct adapter, enable flags for ARIA, PULSE, LINX
- **Validation:** Test DataForSEO calls
- **Rollback:** Disable flags if issues

**Phase 2: OpenAI Activation**
- **Agents:** SCRIBE, REPUTE
- **Action:** Implement OpenAI direct adapter, enable flags for SCRIBE, REPUTE
- **Validation:** Test OpenAI calls
- **Rollback:** Disable flags if issues

**Phase 3: GSC Activation**
- **Agents:** PRISM
- **Action:** Implement GSC direct adapter, enable flag for PRISM
- **Validation:** Test GSC calls
- **Rollback:** Disable flag if issues

**Phase 4: GBP Activation**
- **Agents:** LOCL, REPUTE
- **Action:** Implement GBP direct adapter, enable flags for LOCL, REPUTE
- **Validation:** Test GBP calls
- **Rollback:** Disable flags if issues

**Phase 5: CMS Activation**
- **Agents:** AMPLI
- **Action:** Implement CMS direct adapters, enable flag for AMPLI
- **Validation:** Test CMS calls
- **Rollback:** Disable flag if issues

### Execution Gating

**Gating Strategy:**
- Feature flags control execution path (dispatch vs direct adapter)
- Fallback flag controls whether to fallback to direct adapter on dispatch failure
- Callback continuation flag controls whether to use callback continuation for async operations

**Environment Branching:**
- **Development:** All flags disabled by default, enable per agent for testing
- **Staging:** All flags disabled by default, enable per agent for testing
- **Production:** All flags disabled by default, enable per agent after validation

### Rollback Safety

**Rollback Strategy:**
- Disable flag immediately if issues detected
- Feature flag changes are instant (no deployment required)
- No data impact (flags only control execution path)
- Safe to disable at any time

**Production Containment:**
- Enable flags for single tenant first
- Validate single tenant before enabling for all tenants
- Monitor metrics after each activation
- Disable flag if metrics indicate issues

---

**END OF PART 1**

**Continue to PART 2 for:**
- Section 8: Provider Attachment Preparation
- Section 9: Dashboard Hydration Strategy
- Section 10: Operational Risk Matrix
- Section 11: Implementation Dependency Graph
- Section 12: What Must Never Be Built
- Section 13: First Operational Target
- Section 14: CTO Execution Conclusion

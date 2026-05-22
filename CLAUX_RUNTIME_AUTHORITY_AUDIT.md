# CLAUX RUNTIME AUTHORITY AUDIT

**Date:** 2025-01-09
**Auditor:** Cascade AI
**Scope:** Complete mapping of runtime authority, execution entrypoints, task lifecycle, event systems, logging systems, execution state managers, and credential retrieval paths
**Phase:** Phase 1 - Architecture Purification

---

## EXECUTIVE SUMMARY

This report provides a comprehensive audit of all runtime authority components in the CLAUX codebase. The investigation reveals **CRITICAL AUTHORITY CONFLICTS** where multiple systems compete for runtime authority.

**KEY FINDINGS:**
- **CANONICAL RUNTIME:** RuntimeService + ExecutionOrchestrator (CORRECT)
- **DEPRECATED RUNTIME:** Old runtime tables + agent logger (CONFLICTING)
- **DUPLICATE ENTRYPOINTS:** 46 API routes, some canonical, some deprecated, some dangerous
- **CREDENTIAL SYSTEM:** Canonical (CORRECT) - all credentials in database, encrypted, tenant-scoped
- **EVENT SYSTEM:** Dual systems - EventService (canonical) + agent logger (deprecated)
- **LOGGING SYSTEM:** Dual systems - LogService (canonical) + agent logger (deprecated)
- **TASK LIFECYCLE:** Dual systems - TaskService (canonical) + deprecated wrappers

**AUTHORITY STATUS:** ⚠️ CONFLICTED - Canonical runtime exists but deprecated systems create authority conflicts

---

## EXECUTION ENTRYPOINTS

### CANONICAL ENTRYPOINTS (Correct)

**1. ARIA Discovery Route**
- **Path:** `apps/web/app/api/agents/aria/discovery/route.ts`
- **Authority:** RuntimeService + ExecutionOrchestrator
- **Status:** ✅ CANONICAL
- **Pattern:** Agent → API Route → Runtime → ExecutionOrchestrator → Execution

**2. SCRIBE Draft Route**
- **Path:** `apps/web/app/api/agents/scribe/draft/route.ts`
- **Authority:** RuntimeService + ExecutionOrchestrator
- **Status:** ✅ CANONICAL
- **Pattern:** Agent → API Route → Runtime → ExecutionOrchestrator → Execution

**3. Runtime Task Route**
- **Path:** `apps/web/app/api/runtime/task/route.ts`
- **Authority:** RuntimeService + TaskService
- **Status:** ✅ CANONICAL
- **Pattern:** API Route → Runtime → TaskService → Task

**4. Runtime Timeline Route**
- **Path:** `apps/web/app/api/runtime/timeline/route.ts`
- **Authority:** RuntimeService + ExecutionService
- **Status:** ✅ CANONICAL
- **Pattern:** API Route → Runtime → ExecutionService → Timeline

**5. Runtime Recovery Route**
- **Path:** `apps/web/app/api/runtime/recovery/route.ts`
- **Authority:** RuntimeService + RecoverySystem
- **Status:** ✅ CANONICAL
- **Pattern:** API Route → Runtime → RecoverySystem → Recovery

---

### DEPRECATED ENTRYPOINTS (Conflicting)

**1. LINX Execute Route**
- **Path:** `apps/web/app/api/agents/linx/execute/route.ts`
- **Authority:** Deprecated LinxAgentRuntime wrapper
- **Status:** ❌ DEPRECATED
- **Pattern:** Agent → API Route → Deprecated Runtime Wrapper → Execution
- **Conflict:** Uses deprecated runtime wrapper, bypasses canonical ExecutionOrchestrator

**2. REPUTE Execute Route**
- **Path:** `apps/web/app/api/agents/repute/execute/route.ts`
- **Authority:** Deprecated ReputeAgentRuntime wrapper
- **Status:** ❌ DEPRECATED
- **Pattern:** Agent → API Route → Deprecated Runtime Wrapper → Execution
- **Conflict:** Uses deprecated runtime wrapper, bypasses canonical ExecutionOrchestrator

**3. PRISM Execute Route**
- **Path:** `apps/web/app/api/agents/prism/execute/route.ts`
- **Authority:** Deprecated PrismAgentRuntime wrapper
- **Status:** ❌ DEPRECATED
- **Pattern:** Agent → API Route → Deprecated Runtime Wrapper → Execution
- **Conflict:** Uses deprecated runtime wrapper, bypasses canonical ExecutionOrchestrator

**4. LOCL Execute Route**
- **Path:** `apps/web/app/api/agents/locl/execute/route.ts`
- **Authority:** Deprecated LoclAgentRuntime wrapper
- **Status:** ❌ DEPRECATED
- **Pattern:** Agent → API Route → Deprecated Runtime Wrapper → Execution
- **Conflict:** Uses deprecated runtime wrapper, bypasses canonical ExecutionOrchestrator

**5. PULSE Execute Route**
- **Path:** `apps/web/app/api/agents/pulse/execute/route.ts`
- **Authority:** Deprecated PulseAgentRuntime wrapper
- **Status:** ❌ DEPRECATED
- **Pattern:** Agent → API Route → Deprecated Runtime Wrapper → Execution
- **Conflict:** Uses deprecated runtime wrapper, bypasses canonical ExecutionOrchestrator

---

### DANGEROUS ENTRYPOINTS (Violates Runtime Authority)

**1. CMS Dispatch Route**
- **Path:** `apps/web/app/api/integrations/dispatch/cms/route.ts`
- **Authority:** None (bypasses runtime)
- **Status:** ❌ DANGEROUS
- **Pattern:** API Route → Direct Provider Access (WordPress/Shopify/Custom)
- **Violation:** Bypasses runtime authority, allows direct provider access

**2. GSC Dispatch Route**
- **Path:** `apps/web/app/api/integrations/dispatch/gsc/route.ts`
- **Authority:** None (bypasses runtime)
- **Status:** ❌ DANGEROUS
- **Pattern:** API Route → Direct Provider Access (Google Search Console)
- **Violation:** Bypasses runtime authority, allows direct provider access

**3. OpenAI Dispatch Route**
- **Path:** `apps/web/app/api/integrations/dispatch/openai/route.ts`
- **Authority:** None (bypasses runtime)
- **Status:** ❌ DANGEROUS
- **Pattern:** API Route → Direct Provider Access (OpenAI)
- **Violation:** Bypasses runtime authority, allows direct provider access

**4. GBP Dispatch Route**
- **Path:** `apps/web/app/api/integrations/dispatch/gbp/route.ts`
- **Authority:** None (bypasses runtime)
- **Status:** ❌ DANGEROUS
- **Pattern:** API Route → Direct Provider Access (Google Business Profile)
- **Violation:** Bypasses runtime authority, allows direct provider access

**5. DataForSEO Dispatch Route**
- **Path:** `apps/web/app/api/integrations/dispatch/dataforseo/route.ts`
- **Authority:** None (bypasses runtime)
- **Status:** ❌ DANGEROUS
- **Pattern:** API Route → Direct Provider Access (DataForSEO)
- **Violation:** Bypasses runtime authority, allows direct provider access

---

### CALLBACK ENTRYPOINTS (Conditional)

**1. GSC Callback Route**
- **Path:** `apps/web/app/api/integrations/callback/gsc/route.ts`
- **Authority:** Integration mesh (n8n bridge)
- **Status:** ⚠️ CONDITIONAL
- **Pattern:** Webhook → API Route → Integration Mesh
- **Note:** Acceptable if used only for webhook bridges, not for orchestration

**2. OpenAI Callback Route**
- **Path:** `apps/web/app/api/integrations/callback/openai/route.ts`
- **Authority:** Integration mesh (n8n bridge)
- **Status:** ⚠️ CONDITIONAL
- **Pattern:** Webhook → API Route → Integration Mesh
- **Note:** Acceptable if used only for webhook bridges, not for orchestration

**3. CMS Callback Route**
- **Path:** `apps/web/app/api/integrations/callback/cms/route.ts`
- **Authority:** Integration mesh (n8n bridge)
- **Status:** ⚠️ CONDITIONAL
- **Pattern:** Webhook → API Route → Integration Mesh
- **Note:** Acceptable if used only for webhook bridges, not for orchestration

**4. GBP Callback Route**
- **Path:** `apps/web/app/api/integrations/callback/gbp/route.ts`
- **Authority:** Integration mesh (n8n bridge)
- **Status:** ⚠️ CONDITIONAL
- **Pattern:** Webhook → API Route → Integration Mesh
- **Note:** Acceptable if used only for webhook bridges, not for orchestration

**5. DataForSEO Callback Route**
- **Path:** `apps/web/app/api/integrations/callback/dataforseo/route.ts`
- **Authority:** Integration mesh (n8n bridge)
- **Status:** ⚠️ CONDITIONAL
- **Pattern:** Webhook → API Route → Integration Mesh
- **Note:** Acceptable if used only for webhook bridges, not for orchestration

---

### DASHBOARD ENTRYPOINTS (Old Runtime)

**1. Agent States Route**
- **Path:** `apps/web/app/api/dashboard/agent-states/route.ts`
- **Authority:** Old runtime system
- **Status:** ❌ DEPRECATED
- **Pattern:** API Route → Old Runtime Tables (agent_states)
- **Conflict:** Queries deprecated tables, should query new runtime tables

**2. Agent Activities Route**
- **Path:** `apps/web/app/api/dashboard/agent-activities/route.ts`
- **Authority:** Old runtime system
- **Status:** ❌ DEPRECATED
- **Pattern:** API Route → Old Runtime Tables (agent_activities)
- **Conflict:** Queries deprecated tables, should query new runtime tables

**3. Runtime Agent Status Route**
- **Path:** `apps/web/app/api/dashboard/runtime-agent-status/route.ts`
- **Authority:** New runtime system
- **Status:** ✅ CANONICAL
- **Pattern:** API Route → New Runtime Tables (agent_executions)
- **Note:** This is the correct pattern

---

## TASK LIFECYCLE SYSTEMS

### CANONICAL TASK LIFECYCLE (Correct)

**System:** TaskService
**File:** `apps/web/lib/runtime/services/task.service.ts`
**Authority:** RuntimeService
**Status:** ✅ CANONICAL
**Tables:** agent_tasks
**Capabilities:**
- createTask
- startTask
- completeTask
- failTask
- retryTask
- cancelTask
- getTask
- listTasks
- updateTask

**Pattern:** Runtime → TaskService → agent_tasks table

---

### DEPRECATED TASK LIFECYCLE (Conflicting)

**System:** Agent Logger
**File:** `apps/web/lib/agents/base/agent.logger.ts`
**Authority:** None (bypasses runtime)
**Status:** ❌ DEPRECATED
**Tables:** agent_runs, agent_states, agent_activities
**Capabilities:**
- updateAgentState (writes to agent_states)
- logAgentActivity (writes to agent_activities)
- updateAgentRunStatus (writes to agent_runs)
- releaseAgentLock

**Pattern:** Agent Service → Agent Logger → Old Runtime Tables
**Conflict:** Writes to deprecated tables, bypasses canonical TaskService

---

### DUPLICATE TASK LIFECYCLE (Dead)

**System:** Runtime Tasks
**Files:** 
- `apps/web/lib/runtime/tasks/aria.tasks.ts`
- `apps/web/lib/runtime/tasks/scribe.tasks.ts`
- `apps/web/lib/runtime/tasks/locl.tasks.ts`
- `apps/web/lib/runtime/tasks/linx.tasks.ts`
- `apps/web/lib/runtime/tasks/repute.tasks.ts`
- `apps/web/lib/runtime/tasks/prism.tasks.ts`
- `apps/web/lib/runtime/tasks/pulse.tasks.ts`
- `apps/web/lib/runtime/tasks/ampli.tasks.ts`

**Authority:** Runtime (canonical)
**Status:** ❌ DEAD (not used)
**Capabilities:** Task definitions for each agent
**Pattern:** Runtime Tasks → TaskService → agent_tasks table
**Conflict:** Dead code, agents use .service.ts pattern instead

---

## EVENT SYSTEMS

### CANONICAL EVENT SYSTEM (Correct)

**System:** EventService
**File:** `apps/web/lib/runtime/services/event.service.ts`
**Authority:** RuntimeService
**Status:** ✅ CANONICAL
**Tables:** agent_events
**Capabilities:**
- publishEvent
- getEvent
- listEvents
- queryEvents

**Pattern:** Runtime → EventService → agent_events table

**Event Publishing:**
- ExecutionOrchestrator automatically publishes events via EventService
- Events: EXECUTION_CREATED, EXECUTION_STARTED, EXECUTION_COMPLETED, EXECUTION_FAILED, EXECUTION_CANCELLED, EXECUTION_RETRIED
- Task events: TASK_CREATED, TASK_STARTED, TASK_COMPLETED, TASK_FAILED, TASK_RETRIED

---

### DEPRECATED EVENT SYSTEM (Conflicting)

**System:** Agent Logger
**File:** `apps/web/lib/agents/base/agent.logger.ts`
**Authority:** None (bypasses runtime)
**Status:** ❌ DEPRECATED
**Tables:** agent_activities
**Capabilities:**
- logAgentActivity (writes to agent_activities)

**Pattern:** Agent Service → Agent Logger → agent_activities table
**Conflict:** Writes to deprecated table, bypasses canonical EventService

---

### DUAL EVENT SYSTEM (Conflicting)

**Status:** ❌ CONFLICTED
**Issue:** Two event systems coexist
- Canonical: EventService → agent_events table
- Deprecated: Agent Logger → agent_activities table
**Resolution:** Remove Agent Logger, use EventService exclusively

---

## LOGGING SYSTEMS

### CANONICAL LOGGING SYSTEM (Correct)

**System:** LogService
**File:** `apps/web/lib/runtime/services/log.service.ts`
**Authority:** RuntimeService
**Status:** ✅ CANONICAL
**Tables:** agent_logs
**Capabilities:**
- publishLog
- getLog
- listLogs
- queryLogs

**Pattern:** Runtime → LogService → agent_logs table

**Log Publishing:**
- ExecutionOrchestrator automatically publishes logs via LogService
- Logs: execution lifecycle logs, task lifecycle logs, error logs, debug logs

---

### DEPRECATED LOGGING SYSTEM (Conflicting)

**System:** Agent Logger
**File:** `apps/web/lib/agents/base/agent.logger.ts`
**Authority:** None (bypasses runtime)
**Status:** ❌ DEPRECATED
**Tables:** agent_runs (via updateAgentRunStatus)
**Capabilities:**
- updateAgentRunStatus (writes to agent_runs)

**Pattern:** Agent Service → Agent Logger → agent_runs table
**Conflict:** Writes to deprecated table, bypasses canonical LogService

---

### CONSOLE LOGGING (Ad-hoc)

**System:** Console.log
**Authority:** None
**Status:** ⚠️ AD-HOC
**Usage:** Scattered throughout codebase
**Issue:** Not centralized, not queryable, not structured
**Resolution:** Should migrate to LogService for production logging

---

### DUAL LOGGING SYSTEM (Conflicting)

**Status:** ❌ CONFLICTED
**Issue:** Multiple logging systems coexist
- Canonical: LogService → agent_logs table
- Deprecated: Agent Logger → agent_runs table
- Ad-hoc: Console.log → nowhere
**Resolution:** Remove Agent Logger, migrate console.log to LogService

---

## EXECUTION STATE MANAGERS

### CANONICAL EXECUTION STATE MANAGER (Correct)

**System:** ExecutionService
**File:** `apps/web/lib/runtime/services/execution.service.ts`
**Authority:** RuntimeService
**Status:** ✅ CANONICAL
**Tables:** agent_executions
**Capabilities:**
- createExecution
- startExecution
- completeExecution
- failExecution
- cancelExecution
- retryExecution
- getExecution
- listExecutions
- updateExecution

**Pattern:** Runtime → ExecutionService → agent_executions table

**State Management:**
- ExecutionStatus: pending, running, completed, failed, cancelled, retrying
- Automatic state transitions via ExecutionOrchestrator
- Automatic event publishing on state transitions
- Automatic logging on state transitions

---

### DEPRECATED EXECUTION STATE MANAGER (Conflicting)

**System:** Agent Logger
**File:** `apps/web/lib/agents/base/agent.logger.ts`
**Authority:** None (bypasses runtime)
**Status:** ❌ DEPRECATED
**Tables:** agent_states
**Capabilities:**
- updateAgentState (writes to agent_states)

**Pattern:** Agent Service → Agent Logger → agent_states table
**Conflict:** Writes to deprecated table, bypasses canonical ExecutionService

---

### DUAL EXECUTION STATE MANAGEMENT (Conflicting)

**Status:** ❌ CONFLICTED
**Issue:** Two execution state systems coexist
- Canonical: ExecutionService → agent_executions table
- Deprecated: Agent Logger → agent_states table
**Resolution:** Remove Agent Logger, use ExecutionService exclusively

---

## CREDENTIAL RETRIEVAL PATHS

### CANONICAL CREDENTIAL SYSTEM (Correct)

**System:** Integrations Table + Utils
**File:** `apps/web/lib/integrations/utils.ts`
**Authority:** Database (Supabase)
**Status:** ✅ CANONICAL
**Tables:** integrations
**Pattern:** Database → Encrypted Credential → Decrypt → Runtime Injection

**Credential Functions:**
- `getTenantIntegrations(tenantId)` - Fetch all integrations for tenant
- `getGoogleAccessToken(tenantId)` - Decrypt and return Google access token
- `getGoogleRefreshToken(tenantId)` - Decrypt and return Google refresh token
- `getWordPressAppPassword(tenantId)` - Decrypt and return WordPress app password
- `getShopifyAccessToken(tenantId)` - Decrypt and return Shopify access token
- `getCustomApiKey(tenantId)` - Decrypt and return custom API key

**Encryption:**
- Algorithm: AES-256-GCM
- Key: INTEGRATION_ENCRYPTION_KEY (environment variable)
- Storage: Encrypted in integrations table

**Tenant Scoping:**
- All credentials are tenant-scoped via tenant_id
- No per-tenant environment variables
- No frontend credential injection
- Runtime retrieval only

**Status:** ✅ COMPLIANT WITH FINAL ARCHITECTURE

---

### CREDENTIAL USAGE PATTERNS

**CORRECT PATTERN (Canonical):**
- Pattern: Runtime → getTenantIntegrations → getGoogleAccessToken → Provider API
- Example: GMB client uses getGoogleAccessToken
- Status: ✅ CORRECT

**INCORRECT PATTERN (Direct Provider Access):**
- Pattern: Agent → Provider Client → Provider API (no runtime credential injection)
- Example: ARIA agent calls dataforseo.client directly
- Status: ❌ INCORRECT - bypasses runtime credential injection

**INCORRECT PATTERN (Mock Fallback):**
- Pattern: Provider Client → Mock Data if no credential
- Example: GMB client returns mock data if not connected
- Status: ⚠️ INCORRECT - should fail gracefully, not return mock data

---

## RUNTIME AUTHORITY SUMMARY

### CANONICAL RUNTIME COMPONENTS

| Component | File | Authority | Status | Table |
|-----------|------|-----------|--------|-------|
| RuntimeService | runtime/services/runtime.service.ts | Canonical | ✅ | N/A |
| ExecutionOrchestrator | runtime/orchestrator/execution-orchestrator.ts | Canonical | ✅ | N/A |
| ExecutionService | runtime/services/execution.service.ts | Canonical | ✅ | agent_executions |
| TaskService | runtime/services/task.service.ts | Canonical | ✅ | agent_tasks |
| EventService | runtime/services/event.service.ts | Canonical | ✅ | agent_events |
| LogService | runtime/services/log.service.ts | Canonical | ✅ | agent_logs |
| MetricsService | runtime/services/metrics.service.ts | Canonical | ✅ | N/A |
| Credential System | integrations/utils.ts | Canonical | ✅ | integrations |

### DEPRECATED RUNTIME COMPONENTS

| Component | File | Authority | Status | Table |
|-----------|------|-----------|--------|-------|
| Agent Logger | agents/base/agent.logger.ts | None | ❌ | agent_states, agent_activities, agent_runs |
| Deprecated Runtime Wrappers | agents/linx/runtime.ts, etc. | Deprecated | ❌ | N/A |
| Old Runtime Tables | Database schema | Deprecated | ❌ | agent_runs, agent_states, agent_activities |

### DANGEROUS RUNTIME COMPONENTS

| Component | File | Authority | Status | Risk |
|-----------|------|-----------|--------|------|
| Dispatch API Routes | app/api/integrations/dispatch/* | None | ❌ | HIGH |
| Direct Provider Clients | agents/shared/*.client.ts | None | ❌ | HIGH |
| CMS Connectors (Direct) | connectors/*.connector.ts | None | ❌ | HIGH |

---

## AUTHORITY CONFLICT MATRIX

| Conflict | Canonical | Deprecated | Dangerous | Resolution |
|----------|-----------|------------|-----------|------------|
| Execution State | ExecutionService | Agent Logger | None | Remove Agent Logger |
| Task Lifecycle | TaskService | Agent Logger | None | Remove Agent Logger |
| Event System | EventService | Agent Logger | None | Remove Agent Logger |
| Logging System | LogService | Agent Logger | Console.log | Remove Agent Logger, migrate console.log |
| Credential Retrieval | integrations/utils.ts | None | Direct API calls | Enforce runtime credential injection |
| Provider Access | Runtime Connectors | None | Direct provider clients | Remove direct provider clients |
| API Entry Points | Runtime API Routes | Deprecated API Routes | Dispatch API Routes | Remove deprecated and dangerous routes |

---

## RECOMMENDATIONS

### IMMEDIATE ACTIONS

1. **Remove Deprecated API Routes**
   - Remove agents/linx/execute/route.ts
   - Remove agents/repute/execute/route.ts
   - Remove agents/prism/execute/route.ts
   - Remove agents/locl/execute/route.ts
   - Remove agents/pulse/execute/route.ts

2. **Remove Dangerous Dispatch API Routes**
   - Remove integrations/dispatch/cms/route.ts
   - Remove integrations/dispatch/gsc/route.ts
   - Remove integrations/dispatch/openai/route.ts
   - Remove integrations/dispatch/gbp/route.ts
   - Remove integrations/dispatch/dataforseo/route.ts

3. **Remove Agent Logger**
   - Remove agents/base/agent.logger.ts
   - Migrate all logging to LogService
   - Update all agent services to use RuntimeService

### SHORT-TERM ACTIONS

4. **Migrate Dashboard to New Runtime**
   - Update dashboard/agent-states/route.ts to query agent_executions
   - Update dashboard/agent-activities/route.ts to query agent_events
   - Remove old runtime table queries

5. **Remove Deprecated Runtime Wrappers**
   - Remove agents/linx/runtime.ts
   - Remove agents/repute/runtime.ts
   - Remove agents/prism/runtime.ts
   - Remove agents/locl/runtime.ts
   - Remove agents/pulse/runtime.ts

### MEDIUM-TERM ACTIONS

6. **Remove Old Runtime Tables**
   - Drop agent_runs table
   - Drop agent_states table
   - Drop agent_activities table

7. **Enforce Runtime Credential Injection**
   - Remove direct provider client calls
   - Implement runtime connectors with credential injection
   - Update all agents to use runtime connectors

---

## CONCLUSION

The CLAUX runtime authority is **CONFLICTED**. A canonical runtime system exists (RuntimeService + ExecutionOrchestrator) but deprecated systems (Agent Logger, old runtime tables, deprecated API routes) create authority conflicts. Dangerous components (dispatch API routes, direct provider clients) bypass runtime authority entirely.

**AUTHORITY STATUS:** ⚠️ CONFLICTED
**CANONICAL COMPONENTS:** 8 (CORRECT)
**DEPRECATED COMPONENTS:** 3 (CONFLICTING)
**DANGEROUS COMPONENTS:** 3 (HIGH RISK)

**RESOLUTION:** Remove all deprecated and dangerous components. Enforce single canonical runtime authority through RuntimeService and ExecutionOrchestrator.

---

**END OF REPORT**

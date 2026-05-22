# CLAUX RUNTIME AUTHORITY MATRIX

**Date:** 2025-01-09
**Engineer:** Cascade AI
**Scope:** Phase 1A - Architectural Authority Purification
**Status:** Authority Classification Complete

---

## EXECUTIVE SUMMARY

This matrix provides an authoritative classification of all runtime systems in CLAUX against the FINAL BOARD-APPROVED ARCHITECTURE. The classification determines which systems are canonical, which are conflicting, and which must be removed.

**CANONICAL RUNTIME:** RuntimeService + ExecutionOrchestrator (✅ CORRECT)
**CONFLICTING RUNTIME:** Agent Runtime SDK/Database, Agent Logger, Old Runtime Tables (❌ CONFLICT)
**DEAD RUNTIME:** Deprecated wrappers, unused subsystems (❌ DEAD)

---

## AUTHORITY CLASSIFICATION LEGEND

- **CANONICAL:** Approved by FINAL ARCHITECTURE - MUST PRESERVE
- **CONFLICTING:** Violates FINAL ARCHITECTURE - MUST REMOVE OR REFACTOR
- **DANGEROUS:** Bypasses runtime authority - MUST REMOVE
- **DEAD:** Unused code - SAFE TO REMOVE
- **BLOCKED:** Required by operational systems - CANNOT REMOVE YET

---

## CANONICAL RUNTIME SYSTEMS

### System 1: RuntimeService

**FILE:** `apps/web/lib/runtime/services/runtime.service.ts`
**TYPE:** Runtime Facade
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Single entry point for runtime operations

**COMPOSITION:**
- ExecutionService
- TaskService
- EventService
- LogService
- MetricsService

**AUTHORITY SCOPE:**
- Execution lifecycle management
- Task lifecycle management
- Event publishing
- Logging
- Metrics collection

**DEPENDENCIES:** None (canonical foundation)

**USED BY:**
- ExecutionOrchestrator
- API routes (canonical)
- Agent services (should use, currently bypass)

**CLASSIFICATION:** ✅ CANONICAL - PRESERVE

---

### System 2: ExecutionOrchestrator

**FILE:** `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`
**TYPE:** Orchestration Authority
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Coordinates execution lifecycle

**CAPABILITIES:**
- createExecution()
- startExecution()
- completeExecution()
- failExecution()
- cancelExecution()
- retryExecution()

**AUTHORITY SCOPE:**
- Execution lifecycle coordination
- Automatic event publishing
- Automatic logging
- Stall detection

**DEPENDENCIES:** RuntimeService

**USED BY:**
- API routes (canonical: aria/discovery, scribe/draft)
- Deprecated runtime wrappers (conflict)

**CLASSIFICATION:** ✅ CANONICAL - PRESERVE

---

### System 3: ExecutionService

**FILE:** `apps/web/lib/runtime/services/execution.service.ts`
**TYPE:** Execution State Manager
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Manages execution state in database

**CAPABILITIES:**
- createExecution()
- startExecution()
- completeExecution()
- failExecution()
- cancelExecution()
- retryExecution()
- getExecution()
- listExecutions()

**AUTHORITY SCOPE:**
- Execution state management
- Database persistence (agent_executions table)

**DEPENDENCIES:** RuntimeService

**USED BY:**
- ExecutionOrchestrator
- RuntimeService

**CLASSIFICATION:** ✅ CANONICAL - PRESERVE

---

### System 4: TaskService

**FILE:** `apps/web/lib/runtime/services/task.service.ts`
**TYPE:** Task Lifecycle Manager
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Manages task state in database

**CAPABILITIES:**
- createTask()
- startTask()
- completeTask()
- failTask()
- retryTask()
- cancelTask()
- getTask()
- listTasks()

**AUTHORITY SCOPE:**
- Task lifecycle management
- Database persistence (agent_tasks table)

**DEPENDENCIES:** RuntimeService

**USED BY:**
- ExecutionOrchestrator
- RuntimeService

**CLASSIFICATION:** ✅ CANONICAL - PRESERVE

---

### System 5: EventService

**FILE:** `apps/web/lib/runtime/services/event.service.ts`
**TYPE:** Event Publisher
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Publishes execution events

**CAPABILITIES:**
- publishEvent()
- getEvent()
- listEvents()
- queryEvents()

**AUTHORITY SCOPE:**
- Event publishing
- Database persistence (agent_events table)

**DEPENDENCIES:** RuntimeService

**USED BY:**
- ExecutionOrchestrator
- RuntimeService

**CLASSIFICATION:** ✅ CANONICAL - PRESERVE

---

### System 6: LogService

**FILE:** `apps/web/lib/runtime/services/log.service.ts`
**TYPE:** Log Publisher
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Publishes execution logs

**CAPABILITIES:**
- publishLog()
- getLog()
- listLogs()
- queryLogs()

**AUTHORITY SCOPE:**
- Log publishing
- Database persistence (agent_logs table)

**DEPENDENCIES:** RuntimeService

**USED BY:**
- ExecutionOrchestrator
- RuntimeService

**CLASSIFICATION:** ✅ CANONICAL - PRESERVE

---

### System 7: MetricsService

**FILE:** `apps/web/lib/runtime/services/metrics.service.ts`
**TYPE:** Metrics Collector
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Collects runtime metrics

**CAPABILITIES:**
- publishMetric()
- getMetric()
- listMetrics()

**AUTHORITY SCOPE:**
- Metrics collection
- Database persistence (agent_metrics table)

**DEPENDENCIES:** RuntimeService

**USED BY:**
- ExecutionOrchestrator
- RuntimeService

**CLASSIFICATION:** ✅ CANONICAL - PRESERVE

---

### System 8: Credential System

**FILE:** `apps/web/lib/integrations/utils.ts`
**TYPE:** Credential Manager
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Manages tenant credentials

**CAPABILITIES:**
- getTenantIntegrations()
- getGoogleAccessToken()
- getGoogleRefreshToken()
- getWordPressAppPassword()
- getShopifyAccessToken()
- getCustomApiKey()

**AUTHORITY SCOPE:**
- Credential retrieval
- Runtime credential injection
- Database persistence (integrations table)

**DEPENDENCIES:** Supabase (integrations table)

**USED BY:**
- GMB client (correct)
- Should be used by all providers (currently bypassed)

**CLASSIFICATION:** ✅ CANONICAL - PRESERVE

---

## CONFLICTING RUNTIME SYSTEMS

### System 9: Agent Runtime SDK/Database

**FILES:**
- `apps/web/lib/runtime/database.ts` (AgentRuntimeDatabase)
- `apps/web/lib/runtime/sdk.ts` (AgentRuntimeSDK)
- `apps/web/lib/runtime/index.ts` (exports)

**TYPE:** Alternate Runtime Abstraction
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Alternate runtime abstraction

**VIOLATION:** Creates dual runtime authority, conflicts with canonical RuntimeService

**DEPENDENCIES:**
- events/emitter.ts (uses AgentRuntimeDatabase)
- observability/tracer.ts (uses AgentRuntimeDatabase)
- workflows/base-workflow.ts (uses AgentRuntimeSDK)

**CLASSIFICATION:** ❌ CONFLICTING - BLOCKED FOR REMOVAL

**BLOCKING REASON:** events, observability, and workflow systems depend on this

**RESOLUTION REQUIRED:** Refactor events, observability, and workflow systems to use canonical RuntimeService

---

### System 10: Agent Logger

**FILE:** `apps/web/lib/agents/base/agent.logger.ts`
**TYPE:** Alternate Logging System
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Alternate logging for agents

**VIOLATION:** Creates dual logging system, conflicts with canonical LogService

**CAPABILITIES:**
- updateAgentState() (writes to agent_states)
- logAgentActivity() (writes to agent_activities)
- updateAgentRunStatus() (writes to agent_runs)
- releaseAgentLock()

**DEPENDENCIES:**
- aria.service.ts
- scribe.service.ts
- publish.service.ts
- locl.service.ts
- pulse.service.ts

**CLASSIFICATION:** ❌ CONFLICTING - BLOCKED FOR REMOVAL

**BLOCKING REASON:** 5 operational agent services depend on this

**RESOLUTION REQUIRED:** Refactor 5 agent services to use canonical LogService

---

### System 11: Old Runtime Tables

**FILES:** (Database tables)
- `agent_runs`
- `agent_states`
- `agent_activities`

**TYPE:** Alternate Runtime Schema
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Alternate runtime state storage

**VIOLATION:** Creates dual runtime state, conflicts with canonical runtime tables

**DEPENDENCIES:**
- lib/dashboard/index.ts (queries agent_states, agent_activities)
- actions/audit-log.ts (references agent_runs, agent_states)
- actions/verify-automation.ts (queries agent_states)
- app/api/v1/agent-update/route.ts (updates agent_states, inserts agent_runs)
- app/api/v1/orchestrator/trigger-agent/route.ts (inserts agent_runs)

**CLASSIFICATION:** ❌ CONFLICTING - BLOCKED FOR REMOVAL

**BLOCKING REASON:** Dashboard, actions, and v1 API routes depend on these tables

**RESOLUTION REQUIRED:** Migrate dashboard to query canonical tables, refactor v1 API routes

---

## DANGEROUS RUNTIME SYSTEMS

### System 12: Integration Mesh Orchestration

**FILES:**
- `apps/web/lib/integrations/mesh/dispatchers/index.ts` (IntegrationDispatcher)
- `apps/web/lib/integrations/mesh/feature-flags.ts` (feature flags)
- `apps/web/lib/integrations/mesh/contracts/n8n-schemas.ts`
- `apps/web/lib/integrations/mesh/recovery/recovery-tests.ts`
- `apps/web/lib/integrations/mesh/recovery/provider-recovery-tests.ts`
- `apps/web/lib/integrations/mesh/runtime/state-machine.ts`
- `apps/web/lib/integrations/mesh/runtime/index.ts`
- `apps/web/lib/integrations/mesh/observability/index.ts`

**TYPE:** n8n Orchestration Authority
**AUTHORITY:** DANGEROUS ❌
**STATUS:** NON-OPERATIONAL (feature flags disabled)
**PURPOSE:** Orchestrate via n8n

**VIOLATION:** n8n acts as orchestration authority (FORBIDDEN by FINAL ARCHITECTURE)

**DEPENDENCIES:**
- Runtime tasks (dead code) - import feature flags
- API routes (test routes) - import RecoveryTests, CallbackContinuationValidation

**CLASSIFICATION:** ❌ DANGEROUS - SAFE TO REMOVE

**REMOVAL FEASIBILITY:** ✅ HIGH - All dependencies are dead code or test routes

**PRESERVATION REQUIREMENT:** Preserve webhook callback compatibility (not orchestration)

---

### System 13: Dispatch API Routes

**FILES:**
- `apps/web/app/api/integrations/dispatch/cms/route.ts`
- `apps/web/app/api/integrations/dispatch/gsc/route.ts`
- `apps/web/app/api/integrations/dispatch/openai/route.ts`
- `apps/web/app/api/integrations/dispatch/gbp/route.ts`
- `apps/web/app/api/integrations/dispatch/dataforseo/route.ts`

**TYPE:** Direct Provider Access Routes
**AUTHORITY:** DANGEROUS ❌
**STATUS:** NON-OPERATIONAL (not used by agents)
**PURPOSE:** Bypass runtime for direct provider access

**VIOLATION:** Bypasses runtime authority, allows direct provider access (FORBIDDEN)

**DEPENDENCIES:**
- Runtime tasks (dead code) - call dispatch routes

**CLASSIFICATION:** ❌ DANGEROUS - SAFE TO REMOVE

**REMOVAL FEASIBILITY:** ✅ HIGH - All dependencies are dead code

---

### System 14: Direct Provider Clients

**FILES:**
- `apps/web/lib/agents/shared/dataforseo.client.ts`
- `apps/web/lib/agents/shared/openai.client.ts`
- `apps/web/lib/agents/shared/serp.client.ts`
- `apps/web/lib/agents/shared/gmb.client.ts`

**TYPE:** Direct Provider Access
**AUTHORITY:** DANGEROUS ❌
**STATUS:** OPERATIONAL (used by agents)
**PURPOSE:** Direct provider API calls

**VIOLATION:** Bypasses runtime authority, called directly by agents (FORBIDDEN)

**DEPENDENCIES:**
- aria.service.ts (uses dataforseo.client)
- scribe.service.ts (uses openai.client)
- pulse.service.ts (uses serp.client)
- locl.service.ts (uses gmb.client)

**CLASSIFICATION:** ❌ DANGEROUS - BLOCKED FOR REMOVAL

**BLOCKING REASON:** 4 operational agent services depend on these

**RESOLUTION REQUIRED:** Refactor 4 agent services to use runtime connectors with credential injection

---

### System 15: CMS Connectors (Direct Calls)

**FILES:**
- `apps/web/lib/connectors/wordpress.connector.ts`
- `apps/web/lib/connectors/shopify.connector.ts`
- `apps/web/lib/connectors/custom.connector.ts`

**TYPE:** Direct Provider Access
**AUTHORITY:** DANGEROUS ❌
**STATUS:** OPERATIONAL (used by publish.service.ts)
**PURPOSE:** Direct CMS API calls

**VIOLATION:** Called directly by PUBLISH agent, bypasses runtime (FORBIDDEN)

**DEPENDENCIES:**
- publish.service.ts (uses all 3 connectors)
- ampli.tasks.ts (dead code, uses 2 connectors)

**CLASSIFICATION:** ❌ DANGEROUS - BLOCKED FOR REMOVAL

**BLOCKING REASON:** publish.service.ts (operational) depends on these

**RESOLUTION REQUIRED:** Refactor publish.service.ts to use runtime connectors with credential injection

---

## DEAD RUNTIME SYSTEMS

### System 16: Deprecated Runtime Wrappers

**FILES:**
- `apps/web/lib/agents/linx/runtime.ts`
- `apps/web/lib/agents/repute/runtime.ts`
- `apps/web/lib/agents/prism/runtime.ts`
- `apps/web/lib/agents/locl/runtime.ts`
- `apps/web/lib/agents/pulse/runtime.ts`

**TYPE:** Deprecated Runtime Abstraction
**AUTHORITY:** DEAD ❌
**STATUS:** DEPRECATED
**PURPOSE:** Deprecated agent runtime wrappers

**VIOLATION:** Creates duplicate runtime authority, superseded by ExecutionOrchestrator

**DEPENDENCIES:** None (deprecated, not used)

**CLASSIFICATION:** ❌ DEAD - SAFE TO REMOVE

---

### System 17: Canonical System Agents

**FILES:**
- `apps/web/lib/agents/system/canonical-agents.ts`
- `apps/web/lib/agents/system/types.ts`

**TYPE:** Agent Abstraction
**AUTHORITY:** DEAD ❌
**STATUS:** DEAD
**PURPOSE:** Defines 9 canonical system agents

**VIOLATION:** Architectural mismatch with 9 business agents

**DEPENDENCIES:** None (not used by business agents)

**CLASSIFICATION:** ❌ DEAD - SAFE TO REMOVE

---

### System 18: Unused Agent Subsystems

**FILES:**
- `apps/web/lib/agents/capabilities/` (3 files)
- `apps/web/lib/agents/governance/` (3 files)
- `apps/web/lib/agents/memory/` (3 files)
- `apps/web/lib/agents/planning/` (3 files)
- `apps/web/lib/agents/topology/` (3 files)
- `apps/web/lib/agents/registry/` (3 files)
- `apps/web/lib/agents/runtime/` (5 files)

**TYPE:** Agent Abstraction
**AUTHORITY:** DEAD ❌
**STATUS:** DEAD
**PURPOSE:** Various agent subsystems

**VIOLATION:** Unused abstractions, violates principle of no dead abstractions

**DEPENDENCIES:** None (not used by any agent)

**CLASSIFICATION:** ❌ DEAD - SAFE TO REMOVE

---

### System 19: Agent Thinking Subsystems

**FILES:**
- `apps/web/lib/agents/linx/thinking.ts`
- `apps/web/lib/agents/locl/thinking.ts`
- `apps/web/lib/agents/prism/thinking.ts`
- `apps/web/lib/agents/pulse/thinking.ts`

**TYPE:** Agent Abstraction
**AUTHORITY:** DEAD ❌
**STATUS:** DEAD
**PURPOSE:** Agent thinking logic

**VIOLATION:** Unused, agents use .service.ts pattern

**DEPENDENCIES:** None (not used)

**CLASSIFICATION:** ❌ DEAD - SAFE TO REMOVE

---

### System 20: Runtime Adapters

**FILES:**
- `apps/web/lib/runtime/adapters/providers/openai.adapter.ts`
- `apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts`

**TYPE:** Provider Adapter
**AUTHORITY:** DEAD ❌
**STATUS:** DEAD
**PURPOSE:** Runtime provider adapters

**VIOLATION:** Dead code, agents call provider clients directly

**DEPENDENCIES:** None (not used)

**CLASSIFICATION:** ❌ DEAD - SAFE TO REMOVE

---

### System 21: Runtime Tasks

**FILES:**
- `apps/web/lib/runtime/tasks/aria.tasks.ts`
- `apps/web/lib/runtime/tasks/scribe.tasks.ts`
- `apps/web/lib/runtime/tasks/locl.tasks.ts`
- `apps/web/lib/runtime/tasks/linx.tasks.ts`
- `apps/web/lib/runtime/tasks/repute.tasks.ts`
- `apps/web/lib/runtime/tasks/prism.tasks.ts`
- `apps/web/lib/runtime/tasks/pulse.tasks.ts`
- `apps/web/lib/runtime/tasks/ampli.tasks.ts`

**TYPE:** Task Definitions
**AUTHORITY:** DEAD ❌
**STATUS:** DEAD
**PURPOSE:** Runtime task definitions

**VIOLATION:** Dead code, agents use .service.ts pattern

**DEPENDENCIES:** None (not used by agents)

**CLASSIFICATION:** ❌ DEAD - SAFE TO REMOVE

---

### System 22: Empty Monorepo Directories

**FILES:**
- `apps/api/` (empty)
- `agents/` (empty)
- `lib/` (empty)

**TYPE:** Directory Structure
**AUTHORITY:** DEAD ❌
**STATUS:** EMPTY
**PURPOSE:** Monorepo structure

**VIOLATION:** Empty directories, monorepo not utilized

**DEPENDENCIES:** None (empty)

**CLASSIFICATION:** ❌ DEAD - SAFE TO REMOVE

---

## AUTHORITY MATRIX SUMMARY

| System | Type | Authority | Status | Dependencies | Action |
|--------|------|-----------|--------|-------------|--------|
| RuntimeService | Runtime Facade | CANONICAL ✅ | OPERATIONAL | None | PRESERVE |
| ExecutionOrchestrator | Orchestration | CANONICAL ✅ | OPERATIONAL | RuntimeService | PRESERVE |
| ExecutionService | State Manager | CANONICAL ✅ | OPERATIONAL | RuntimeService | PRESERVE |
| TaskService | Task Manager | CANONICAL ✅ | OPERATIONAL | RuntimeService | PRESERVE |
| EventService | Event Publisher | CANONICAL ✅ | OPERATIONAL | RuntimeService | PRESERVE |
| LogService | Log Publisher | CANONICAL ✅ | OPERATIONAL | RuntimeService | PRESERVE |
| MetricsService | Metrics Collector | CANONICAL ✅ | OPERATIONAL | RuntimeService | PRESERVE |
| Credential System | Credential Manager | CANONICAL ✅ | OPERATIONAL | Supabase | PRESERVE |
| Agent Runtime SDK/Database | Alternate Runtime | CONFLICTING ❌ | OPERATIONAL | events, observability, workflows | BLOCKED |
| Agent Logger | Alternate Logging | CONFLICTING ❌ | OPERATIONAL | 5 agent services | BLOCKED |
| Old Runtime Tables | Alternate Schema | CONFLICTING ❌ | OPERATIONAL | dashboard, actions, v1 API | BLOCKED |
| Integration Mesh Orchestration | n8n Orchestration | DANGEROUS ❌ | NON-OPERATIONAL | Runtime tasks (dead) | REMOVE |
| Dispatch API Routes | Direct Access | DANGEROUS ❌ | NON-OPERATIONAL | Runtime tasks (dead) | REMOVE |
| Direct Provider Clients | Direct Access | DANGEROUS ❌ | OPERATIONAL | 4 agent services | BLOCKED |
| CMS Connectors (Direct) | Direct Access | DANGEROUS ❌ | OPERATIONAL | publish.service.ts | BLOCKED |
| Deprecated Runtime Wrappers | Deprecated | DEAD ❌ | DEPRECATED | None | REMOVE |
| Canonical System Agents | Dead Abstraction | DEAD ❌ | DEAD | None | REMOVE |
| Unused Agent Subsystems | Dead Abstraction | DEAD ❌ | DEAD | None | REMOVE |
| Agent Thinking Subsystems | Dead Abstraction | DEAD ❌ | DEAD | None | REMOVE |
| Runtime Adapters | Dead Code | DEAD ❌ | DEAD | None | REMOVE |
| Runtime Tasks | Dead Code | DEAD ❌ | DEAD | None | REMOVE |
| Empty Monorepo Directories | Empty | DEAD ❌ | EMPTY | None | REMOVE |

**TOTAL SYSTEMS:** 22
**CANONICAL:** 8 ✅
**CONFLICTING:** 3 ❌ (BLOCKED)
**DANGEROUS:** 5 ❌ (2 SAFE TO REMOVE, 3 BLOCKED)
**DEAD:** 6 ❌ (SAFE TO REMOVE)

---

## AUTHORITY CONCLUSION

**CANONICAL RUNTIME AUTHORITY:** ✅ ESTABLISHED
- RuntimeService + ExecutionOrchestrator are the only canonical runtime authorities
- All other runtime systems are conflicting, dangerous, or dead

**IMMEDIATE REMOVAL (SAFE):** 9 systems
- Integration Mesh Orchestration
- Dispatch API Routes
- Deprecated Runtime Wrappers
- Canonical System Agents
- Unused Agent Subsystems
- Agent Thinking Subsystems
- Runtime Adapters
- Runtime Tasks
- Empty Monorepo Directories

**BLOCKED REMOVAL (REQUIRES REFACTORING):** 5 systems
- Agent Runtime SDK/Database (requires events/observability/workflows refactoring)
- Agent Logger (requires 5 agent services refactoring)
- Old Runtime Tables (requires dashboard migration)
- Direct Provider Clients (requires 4 agent services refactoring)
- CMS Connectors (requires publish.service.ts refactoring)

**FINAL ARCHITECTURE COMPLIANCE:** ⚠️ PARTIAL
- Canonical runtime exists and is correct
- Conflicting and dangerous systems must be removed
- Blocked systems require phased refactoring

---

**END OF MATRIX**

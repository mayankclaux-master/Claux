# CLAUX PHASE 2A RUNTIME DATABASE AUDIT

**Date:** 2025-01-09
**Engineer:** Cascade AI
**Scope:** Phase 2A - Runtime & Database Authority Consolidation
**Status:** Audit Complete

---

## EXECUTIVE SUMMARY

This audit identifies all old runtime database systems that create dual runtime authority conflicts with the canonical RuntimeService + ExecutionOrchestrator. The objective is to classify these systems and prepare migration strategies to establish single runtime authority.

**TOTAL SYSTEMS AUDITED:** 3
**CONFLICTING SYSTEMS:** 3
**BLOCKED FOR REMOVAL:** 3 (require refactoring)
**DEPENDENT SYSTEMS:** 12+ (events, observability, workflows, agents, dashboard, actions, API routes)

---

## AUDIT SCOPE

This audit covers:
- Old runtime repositories
- Old execution repositories
- Old task repositories
- Old event repositories
- Old workflow repositories
- Old orchestration repositories
- Old execution state managers
- Old runtime database wrappers

---

## SYSTEM #1: AgentRuntimeDatabase

**FILE:** `apps/web/lib/runtime/database.ts`
**LINES:** 327
**TYPE:** Alternate Database Abstraction
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Database operations for runtime system

### Capabilities

**Execution Operations:**
- createExecution()
- updateExecutionStatus()
- getExecution()
- incrementExecutionRetry()
- updateExecutionCost()

**Task Operations:**
- createTask()
- updateTaskStatus()
- getTask()
- getTasksByExecution()
- incrementTaskRetry()

**Event Operations:**
- createEvent()
- getEventsByExecution()
- getEventsByTenant()

**Log Operations:**
- createLog()
- getLogsByExecution()
- getErrorLogsByExecution()

### Canonical Conflict

**VIOLATION:** Duplicates canonical ExecutionService, TaskService, EventService, LogService functionality

**CANONICAL EQUIVALENT:**
- ExecutionService (apps/web/lib/runtime/services/execution.service.ts)
- TaskService (apps/web/lib/runtime/services/task.service.ts)
- EventService (apps/web/lib/runtime/services/event.service.ts)
- LogService (apps/web/lib/runtime/services/log.service.ts)

### Dependencies

**DIRECT DEPENDENTS:**
1. `apps/web/lib/runtime/sdk.ts` - imports AgentRuntimeDatabase
2. `apps/web/lib/events/emitter.ts` - uses AgentRuntimeDatabase
3. `apps/web/lib/observability/tracer.ts` - uses AgentRuntimeDatabase

### Classification

**TYPE:** CONFLICTING ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** 3 systems depend on this (SDK, EventEmitter, Tracer)

### Migration Strategy

**PHASE:** Phase 2A.2
**ESTIMATED EFFORT:** 3-4 days
**BREAKAGE RISK:** HIGH

**STEPS:**
1. Refactor EventEmitter to use canonical EventService
2. Refactor ExecutionTracer to use canonical RuntimeService
3. Refactor AgentRuntimeSDK to use canonical RuntimeService + ExecutionOrchestrator
4. Remove AgentRuntimeDatabase
5. Remove runtime/database.ts

---

## SYSTEM #2: AgentRuntimeSDK

**FILE:** `apps/web/lib/runtime/sdk.ts`
**LINES:** 421
**TYPE:** Alternate Runtime SDK
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Core SDK for agent execution, event emission, logging, tracking

### Capabilities

**Execution Lifecycle:**
- startExecution()
- completeExecution()
- failExecution()

**Task Management:**
- startTask()
- completeTask()
- failTask()
- getTask()

**Event Emission:**
- emitEvent()

**Logging:**
- log()

**Cost Tracking:**
- trackCost()
- persistCostTracking()

**Context Access:**
- getExecutionContext()
- getCurrentExecution()
- getCostTracking()

**Utility Methods:**
- getExecutionHistory()

### Canonical Conflict

**VIOLATION:** Duplicates canonical ExecutionOrchestrator functionality

**CANONICAL EQUIVALENT:**
- ExecutionOrchestrator (apps/web/lib/runtime/orchestrator/execution-orchestrator.ts)
- RuntimeService (apps/web/lib/runtime/services/runtime.service.ts)

### Dependencies

**DIRECT DEPENDENTS:**
1. `apps/web/lib/workflows/base-workflow.ts` - imports AgentRuntimeSDK

### Classification

**TYPE:** CONFLICTING ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** BaseWorkflow system depends on this

### Migration Strategy

**PHASE:** Phase 2A.2
**ESTIMATED EFFORT:** 2-3 days
**BREAKAGE RISK:** HIGH

**STEPS:**
1. Refactor BaseWorkflow to use canonical ExecutionOrchestrator
2. Remove AgentRuntimeSDK
3. Remove runtime/sdk.ts
4. Update runtime/index.ts exports

---

## SYSTEM #3: Agent Logger

**FILE:** `apps/web/lib/agents/base/agent.logger.ts`
**LINES:** 454
**TYPE:** Alternate Logging System
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Agent-specific logging with old runtime tables

### Capabilities

**Lock Management:**
- acquireAgentLock()
- releaseAgentLock()

**Run Management:**
- getActiveRun()
- createAgentRun()
- createAgentRunWithState()
- updateAgentRunStatus()
- recoverStaleRuns()

**State Management:**
- updateAgentState()
- getAgentState()

**Activity Logging:**
- logAgentActivity()

### Canonical Conflict

**VIOLATION:** 
1. Writes to old runtime tables (agent_runs, agent_states, agent_activities)
2. Duplicates canonical LogService functionality
3. Creates dual logging system

**CANONICAL EQUIVALENT:**
- LogService (apps/web/lib/runtime/services/log.service.ts)
- ExecutionService (apps/web/lib/runtime/services/execution.service.ts)
- TaskService (apps/web/lib/runtime/services/task.service.ts)

**OLD TABLES (DEPRECATED):**
- agent_runs
- agent_states
- agent_activities

**CANONICAL TABLES:**
- agent_executions
- agent_tasks
- agent_logs

### Dependencies

**DIRECT DEPENDENTS:**
1. `apps/web/lib/agents/aria/aria.service.ts` - imports agent.logger
2. `apps/web/lib/agents/scribe/scribe.service.ts` - imports agent.logger
3. `apps/web/lib/agents/publish/publish.service.ts` - imports agent.logger
4. `apps/web/lib/agents/locl/locl.service.ts` - imports agent.logger
5. `apps/web/lib/agents/pulse/pulse.service.ts` - imports agent.logger

**INDIRECT DEPENDENTS (old tables):**
1. `apps/web/lib/dashboard/index.ts` - queries agent_states, agent_activities
2. `apps/web/actions/audit-log.ts` - references agent_runs, agent_states
3. `apps/web/actions/verify-automation.ts` - queries agent_states
4. `apps/web/app/api/v1/agent-update/route.ts` - updates agent_states, inserts agent_runs
5. `apps/web/app/api/v1/orchestrator/trigger-agent/route.ts` - inserts agent_runs
6. `apps/web/app/api/dashboard/agent-states/route.ts` - queries agent_states
7. `apps/web/app/api/dashboard/agent-activities/route.ts` - queries agent_activities
8. `apps/web/app/api/dev/simulate-agent/route.ts` - references agent_runs

### Classification

**TYPE:** CONFLICTING ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** 
- 5 operational agent services depend on this
- Dashboard, actions, and API routes depend on old tables

### Migration Strategy

**PHASE:** Phase 2A.3
**ESTIMATED EFFORT:** 5-7 days
**BREAKAGE RISK:** HIGH

**STEPS:**
1. Refactor 5 agent services to use canonical LogService
2. Migrate dashboard to query canonical tables (agent_executions, agent_logs)
3. Refactor actions to use canonical tables
4. Refactor v1 API routes to use canonical tables
5. Remove agent.logger.ts
6. Drop old runtime tables (agent_runs, agent_states, agent_activities)

---

## DEPENDENCY GRAPH

```
AgentRuntimeDatabase (CONFLICTING)
├── AgentRuntimeSDK (CONFLICTING)
│   └── BaseWorkflow
├── EventEmitter
└── ExecutionTracer

Agent Logger (CONFLICTING)
├── aria.service.ts
├── scribe.service.ts
├── publish.service.ts
├── locl.service.ts
├── pulse.service.ts
└── Old Tables (agent_runs, agent_states, agent_activities)
    ├── dashboard/index.ts
    ├── actions/audit-log.ts
    ├── actions/verify-automation.ts
    ├── app/api/v1/agent-update/route.ts
    ├── app/api/v1/orchestrator/trigger-agent/route.ts
    ├── app/api/dashboard/agent-states/route.ts
    ├── app/api/dashboard/agent-activities/route.ts
    └── app/api/dev/simulate-agent/route.ts
```

---

## OLD RUNTIME TABLES AUDIT

### Table 1: agent_runs

**PURPOSE:** Old execution state tracking
**STATUS:** DEPRECATED ❌
**CANONICAL EQUIVALENT:** agent_executions
**DEPENDENTS:**
- agent.logger.ts (writes)
- actions/audit-log.ts (references)
- app/api/v1/agent-update/route.ts (inserts)
- app/api/v1/orchestrator/trigger-agent/route.ts (inserts)
- app/api/dev/simulate-agent/route.ts (references)

### Table 2: agent_states

**PURPOSE:** Old agent state tracking
**STATUS:** DEPRECATED ❌
**CANONICAL EQUIVALENT:** agent_executions (for execution state) + agent_tasks (for task state)
**DEPENDENTS:**
- agent.logger.ts (writes)
- dashboard/index.ts (queries)
- actions/audit-log.ts (references)
- actions/verify-automation.ts (queries)
- app/api/v1/agent-update/route.ts (updates)
- app/api/dashboard/agent-states/route.ts (queries)

### Table 3: agent_activities

**PURPOSE:** Old activity tracking
**STATUS:** DEPRECATED ❌
**CANONICAL EQUIVALENT:** agent_logs
**DEPENDENTS:**
- agent.logger.ts (writes)
- dashboard/index.ts (queries)
- app/api/dashboard/agent-activities/route.ts (queries)

---

## MIGRATION PHASING

### Phase 2A.1: Complete Audit ✅

**OBJECTIVE:** Identify all old runtime database systems and dependencies

**STATUS:** ✅ COMPLETE

---

### Phase 2A.2: Refactor Runtime SDK/Database (Week 1)

**OBJECTIVE:** Refactor AgentRuntimeDatabase and AgentRuntimeSDK to use canonical runtime

**SYSTEMS TO REFACTOR:**
1. EventEmitter → EventService
2. ExecutionTracer → RuntimeService
3. AgentRuntimeSDK → RuntimeService + ExecutionOrchestrator
4. BaseWorkflow → ExecutionOrchestrator

**EXPECTED OUTCOME:** 
- AgentRuntimeDatabase removed
- AgentRuntimeSDK removed
- All event emission through canonical EventService
- All tracing through canonical RuntimeService

**ESTIMATED EFFORT:** 5-7 days

---

### Phase 2A.3: Refactor Agent Logger (Week 2-3)

**OBJECTIVE:** Refactor Agent Logger to use canonical LogService and migrate to canonical tables

**SYSTEMS TO REFACTOR:**
1. aria.service.ts → LogService
2. scribe.service.ts → LogService
3. publish.service.ts → LogService
4. locl.service.ts → LogService
5. pulse.service.ts → LogService
6. dashboard/index.ts → canonical tables
7. actions/audit-log.ts → canonical tables
8. actions/verify-automation.ts → canonical tables
9. app/api/v1/agent-update/route.ts → canonical tables
10. app/api/v1/orchestrator/trigger-agent/route.ts → canonical tables
11. app/api/dashboard/agent-states/route.ts → canonical tables
12. app/api/dashboard/agent-activities/route.ts → canonical tables
13. app/api/dev/simulate-agent/route.ts → canonical tables

**EXPECTED OUTCOME:**
- Agent Logger removed
- Old runtime tables dropped
- All logging through canonical LogService
- All state in canonical tables

**ESTIMATED EFFORT:** 10-14 days

---

## CANONICAL RUNTIME AUTHORITY

### Canonical Components

**RUNTIME FACADE:**
- RuntimeService (apps/web/lib/runtime/services/runtime.service.ts)

**ORCHESTRATION:**
- ExecutionOrchestrator (apps/web/lib/runtime/orchestrator/execution-orchestrator.ts)

**SERVICES:**
- ExecutionService (apps/web/lib/runtime/services/execution.service.ts)
- TaskService (apps/web/lib/runtime/services/task.service.ts)
- EventService (apps/web/lib/runtime/services/event.service.ts)
- LogService (apps/web/lib/runtime/services/log.service.ts)
- MetricsService (apps/web/lib/runtime/services/metrics.service.ts)

### Canonical Tables

**RUNTIME TABLES:**
- agent_executions
- agent_tasks
- agent_events
- agent_logs
- agent_metrics

**CREDENTIAL TABLE:**
- integrations

---

## AUDIT CONCLUSION

**CONFLICTING SYSTEMS:** 3
**BLOCKED FOR REMOVAL:** 3
**DEPENDENT SYSTEMS:** 12+
**TOTAL ESTIMATED EFFORT:** 15-21 days

**CRITICAL FINDINGS:**
1. AgentRuntimeDatabase duplicates all canonical runtime services
2. AgentRuntimeSDK duplicates ExecutionOrchestrator functionality
3. Agent Logger creates dual logging system with old tables
4. Dashboard, actions, and API routes depend on old tables
5. No system can be safely removed without refactoring dependents

**NEXT STEPS:**
1. Begin Phase 2A.2: Refactor Runtime SDK/Database
2. Follow with Phase 2A.3: Refactor Agent Logger
3. Establish single runtime authority

---

**END OF AUDIT**

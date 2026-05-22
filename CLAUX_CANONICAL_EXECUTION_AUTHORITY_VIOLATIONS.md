# CLAUX CANONICAL EXECUTION AUTHORITY VIOLATIONS

**Date:** 2025-01-09
**Engineer:** Cascade AI
**Scope:** Phase 2A.2 - Establish Canonical Execution Ownership
**Status:** Violations Identified

---

## EXECUTIVE SUMMARY

This document identifies ALL violations of canonical execution ownership. The objective is to ensure that ONLY RuntimeService + ExecutionOrchestrator may:
- Create executions
- Transition execution states
- Create tasks
- Transition task states
- Publish lifecycle events
- Publish execution logs

**TOTAL VIOLATIONS:** 6 systems
**SEVERITY:** HIGH
**BLOCKING REASON:** Dual runtime authority creates inconsistent state and bypasses canonical enforcement

---

## CANONICAL AUTHORITY

**CANONICAL RUNTIME ENTRY POINTS:**
- RuntimeService (apps/web/lib/runtime/services/runtime.service.ts)
- ExecutionOrchestrator (apps/web/lib/runtime/orchestrator/execution-orchestrator.ts)

**CANONICAL SERVICES:**
- ExecutionService (apps/web/lib/runtime/services/execution.service.ts)
- TaskService (apps/web/lib/runtime/services/task.service.ts)
- EventService (apps/web/lib/runtime/services/event.service.ts)
- LogService (apps/web/lib/runtime/services/log.service.ts)

**CANONICAL TABLES:**
- agent_executions
- agent_tasks
- agent_events
- agent_logs

---

## VIOLATION #1: AgentRuntimeDatabase

**FILE:** `apps/web/lib/runtime/database.ts`
**LINES:** 327
**TYPE:** Alternate Database Abstraction
**AUTHORITY:** CONFLICTING ❌
**SEVERITY:** CRITICAL

### Violations

**DIRECT INSERT/UPDATE ON agent_executions:**
- Line 32: `.insert()` - createExecution()
- Line 60: `.update()` - updateExecutionStatus()
- Line 78: `.select()` - getExecution()
- Line 112: `.update()` - updateExecutionCost()

**DIRECT INSERT/UPDATE ON agent_tasks:**
- Line 137: `.insert()` - createTask()
- Line 163: `.update()` - updateTaskStatus()
- Line 182: `.select()` - getTask()
- Line 196: `.select()` - getTasksByExecution()

**DIRECT INSERT/SELECT ON agent_events:**
- Line 224: `.insert()` - createEvent()
- Line 247: `.select()` - getEventsByExecution()
- Line 261: `.select()` - getEventsByTenant()

**DIRECT INSERT/SELECT ON agent_logs:**
- Line 280: `.insert()` - createLog()
- Line 299: `.select()` - getLogsByExecution()
- Line 312: `.select()` - getErrorLogsByExecution()

### Canonical Conflict

**VIOLATES:**
- ExecutionService authority (execution operations)
- TaskService authority (task operations)
- EventService authority (event operations)
- LogService authority (log operations)

**CANONICAL EQUIVALENT:**
- ExecutionService.createExecution()
- ExecutionService.startExecution()
- ExecutionService.completeExecution()
- ExecutionService.failExecution()
- TaskService.createTask()
- TaskService.startTask()
- TaskService.completeTask()
- TaskService.failTask()
- EventService.publishEvent()
- LogService.writeLog()

### Dependencies

**DIRECT DEPENDENTS:**
1. `apps/web/lib/runtime/sdk.ts` - imports AgentRuntimeDatabase
2. `apps/web/lib/events/emitter.ts` - uses AgentRuntimeDatabase
3. `apps/web/lib/observability/tracer.ts` - uses AgentRuntimeDatabase

### Classification

**TYPE:** CRITICAL VIOLATION ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** 3 systems depend on this

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

## VIOLATION #2: AgentRuntimeSDK

**FILE:** `apps/web/lib/runtime/sdk.ts`
**LINES:** 421
**TYPE:** Alternate Runtime SDK
**AUTHORITY:** CONFLICTING ❌
**SEVERITY:** CRITICAL

### Violations

**EXECUTION LIFECYCLE VIOLATIONS:**
- Line 51: `this.db.createExecution()` - bypasses ExecutionOrchestrator
- Line 65: `this.db.updateExecutionStatus()` - bypasses ExecutionService
- Line 103: `this.db.updateExecutionStatus()` - bypasses ExecutionService

**TASK MANAGEMENT VIOLATIONS:**
- Line 143: `this.db.createTask()` - bypasses TaskService
- Line 149: `this.db.updateTaskStatus()` - bypasses TaskService
- Line 182: `this.db.updateTaskStatus()` - bypasses TaskService
- Line 240: `this.db.updateTaskStatus()` - bypasses TaskService
- Line 222: `this.db.incrementTaskRetry()` - bypasses TaskService

**EVENT EMISSION VIOLATION:**
- Line 307: `this.db.createEvent()` - bypasses EventService

**LOGGING VIOLATION:**
- Line 340: `this.db.createLog()` - bypasses LogService

### Canonical Conflict

**VIOLATES:**
- ExecutionOrchestrator authority (execution lifecycle)
- TaskService authority (task lifecycle)
- EventService authority (event publishing)
- LogService authority (log writing)

**CANONICAL EQUIVALENT:**
- ExecutionOrchestrator.createExecution()
- ExecutionOrchestrator.startExecution()
- ExecutionOrchestrator.completeExecution()
- ExecutionOrchestrator.failExecution()
- TaskService.createTask()
- TaskService.startTask()
- TaskService.completeTask()
- TaskService.failTask()
- EventService.publishEvent()
- LogService.writeLog()

### Dependencies

**DIRECT DEPENDENTS:**
1. `apps/web/lib/workflows/base-workflow.ts` - imports AgentRuntimeSDK

### Classification

**TYPE:** CRITICAL VIOLATION ❌
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

## VIOLATION #3: EventEmitter

**FILE:** `apps/web/lib/events/emitter.ts`
**LINES:** 77
**TYPE:** Alternate Event Publisher
**AUTHORITY:** CONFLICTING ❌
**SEVERITY:** HIGH

### Violations

**EVENT EMISSION VIOLATION:**
- Line 38: `this.db.createEvent()` - bypasses EventService

### Canonical Conflict

**VIOLATES:**
- EventService authority (event publishing)

**CANONICAL EQUIVALENT:**
- EventService.publishEvent()
- EventService.publishEventsBatch()

### Dependencies

**DIRECT DEPENDENTS:**
- Unknown (need to search for EventEmitter usage)

### Classification

**TYPE:** HIGH VIOLATION ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** Depends on AgentRuntimeDatabase

### Migration Strategy

**PHASE:** Phase 2A.3
**ESTIMATED EFFORT:** 1-2 days
**BREAKAGE RISK:** MEDIUM

**STEPS:**
1. Refactor EventEmitter to use canonical EventService
2. Update all EventEmitter dependents
3. Remove EventEmitter
4. Remove events/emitter.ts

---

## VIOLATION #4: ExecutionTracer

**FILE:** `apps/web/lib/observability/tracer.ts`
**LINES:** 291
**TYPE:** Alternate Execution Tracer
**AUTHORITY:** CONFLICTING ❌
**SEVERITY:** HIGH

### Violations

**EXECUTION QUERY VIOLATIONS:**
- Line 46: `this.db.getExecution()` - bypasses RuntimeService
- Line 47: `this.db.getTasksByExecution()` - bypasses RuntimeService
- Line 48: `this.db.getEventsByExecution()` - bypasses RuntimeService
- Line 49: `this.db.getLogsByExecution()` - bypasses RuntimeService
- Line 236: `this.db.getTasksByExecution()` - bypasses RuntimeService
- Line 238: `this.db.getErrorLogsByExecution()` - bypasses RuntimeService

### Canonical Conflict

**VIOLATES:**
- RuntimeService authority (execution queries)

**CANONICAL EQUIVALENT:**
- RuntimeService.execution.getExecution()
- RuntimeService.task.listExecutionTasks()
- RuntimeService.event.getExecutionEvents()
- RuntimeService.log.getExecutionLogs()

### Dependencies

**DIRECT DEPENDENTS:**
- Unknown (need to search for ExecutionTracer usage)

### Classification

**TYPE:** HIGH VIOLATION ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** Depends on AgentRuntimeDatabase

### Migration Strategy

**PHASE:** Phase 2A.3
**ESTIMATED EFFORT:** 1-2 days
**BREAKAGE RISK:** MEDIUM

**STEPS:**
1. Refactor ExecutionTracer to use canonical RuntimeService
2. Update all ExecutionTracer dependents
3. Remove ExecutionTracer
4. Remove observability/tracer.ts

---

## VIOLATION #5: BaseWorkflow

**FILE:** `apps/web/lib/workflows/base-workflow.ts`
**LINES:** 82
**TYPE:** Alternate Workflow Base Class
**AUTHORITY:** CONFLICTING ❌
**SEVERITY:** HIGH

### Violations

**EXECUTION LIFECYCLE VIOLATIONS:**
- Line 40: `this.sdk.startExecution()` - bypasses ExecutionOrchestrator
- Line 49: `this.sdk.completeExecution()` - bypasses ExecutionOrchestrator

**TASK MANAGEMENT VIOLATIONS:**
- Line 57: `this.sdk.startTask()` - bypasses TaskService
- Line 64: `this.sdk.completeTask()` - bypasses TaskService
- Line 67: `this.sdk.failTask()` - bypasses TaskService

**EVENT EMISSION VIOLATION:**
- Line 77: `this.eventEmitter.emitWithContext()` - bypasses EventService

### Canonical Conflict

**VIOLATES:**
- ExecutionOrchestrator authority (execution lifecycle)
- TaskService authority (task lifecycle)
- EventService authority (event publishing)

**CANONICAL EQUIVALENT:**
- ExecutionOrchestrator.createExecution()
- ExecutionOrchestrator.startExecution()
- ExecutionOrchestrator.completeExecution()
- ExecutionOrchestrator.failExecution()
- TaskService.createTask()
- TaskService.startTask()
- TaskService.completeTask()
- TaskService.failTask()
- EventService.publishEvent()

### Dependencies

**DIRECT DEPENDENTS:**
- Unknown (need to search for BaseWorkflow usage)

### Classification

**TYPE:** HIGH VIOLATION ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** Depends on AgentRuntimeSDK + EventEmitter

### Migration Strategy

**PHASE:** Phase 2A.2
**ESTIMATED EFFORT:** 2-3 days
**BREAKAGE RISK:** HIGH

**STEPS:**
1. Refactor BaseWorkflow to use canonical ExecutionOrchestrator
2. Update all BaseWorkflow dependents
3. Remove BaseWorkflow
4. Remove workflows/base-workflow.ts

---

## VIOLATION #6: Agent Logger

**FILE:** `apps/web/lib/agents/base/agent.logger.ts`
**LINES:** 454
**TYPE:** Alternate Logging System
**AUTHORITY:** CONFLICTING ❌
**SEVERITY:** CRITICAL

### Violations

**EXECUTION STATE VIOLATIONS:**
- Line 213: `supabase.from("agent_runs").insert()` - bypasses ExecutionService
- Line 316: `supabase.from("agent_states").update()` - bypasses ExecutionService
- Line 367: `supabase.from("agent_runs").update()` - bypasses ExecutionService
- Line 405: `supabase.from("agent_activities").insert()` - bypasses LogService

### Canonical Conflict

**VIOLATES:**
- ExecutionService authority (execution state)
- LogService authority (activity logging)

**CANONICAL EQUIVALENT:**
- ExecutionService.createExecution()
- ExecutionService.startExecution()
- ExecutionService.completeExecution()
- ExecutionService.failExecution()
- LogService.writeLog()
- LogService.writeError()

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

**TYPE:** CRITICAL VIOLATION ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** 
- 5 operational agent services depend on this
- Dashboard, actions, and API routes depend on old tables

### Migration Strategy

**PHASE:** Phase 2A.4
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

## VIOLATION #7: Provider Observability

**FILE:** `apps/web/lib/runtime/provider-observability.ts`
**LINES:** 187
**TYPE:** Provider Telemetry Recorder
**AUTHORITY:** CONFLICTING ❌
**SEVERITY:** MEDIUM

### Violations

**LOGGING VIOLATION:**
- Line 165: `supabase.from("agent_logs").insert()` - bypasses LogService

### Canonical Conflict

**VIOLATES:**
- LogService authority (log writing)

**CANONICAL EQUIVALENT:**
- LogService.writeLog()

### Dependencies

**DIRECT DEPENDENTS:**
- Unknown (need to search for recordProviderTelemetry usage)

### Classification

**TYPE:** MEDIUM VIOLATION ❌
**REMOVAL FEASIBILITY:** ✅ POSSIBLE
**BLOCKING REASON:** None (simple refactor)

### Migration Strategy

**PHASE:** Phase 2A.4
**ESTIMATED EFFORT:** 0.5-1 day
**BREAKAGE RISK:** LOW

**STEPS:**
1. Refactor recordProviderTelemetry to use canonical LogService
2. Update all recordProviderTelemetry dependents

---

## VIOLATION SUMMARY

| # | System | File | Severity | Type | Blocked By |
|---|--------|------|----------|------|------------|
| 1 | AgentRuntimeDatabase | lib/runtime/database.ts | CRITICAL | Database Abstraction | EventEmitter, Tracer, SDK |
| 2 | AgentRuntimeSDK | lib/runtime/sdk.ts | CRITICAL | Runtime SDK | BaseWorkflow |
| 3 | EventEmitter | lib/events/emitter.ts | HIGH | Event Publisher | AgentRuntimeDatabase |
| 4 | ExecutionTracer | lib/observability/tracer.ts | HIGH | Execution Tracer | AgentRuntimeDatabase |
| 5 | BaseWorkflow | lib/workflows/base-workflow.ts | HIGH | Workflow Base Class | AgentRuntimeSDK, EventEmitter |
| 6 | Agent Logger | lib/agents/base/agent.logger.ts | CRITICAL | Logging System | Agent services, dashboard, API |
| 7 | Provider Observability | lib/runtime/provider-observability.ts | MEDIUM | Telemetry Recorder | None |

---

## MIGRATION PHASING

### Phase 2A.2.1: Refactor AgentRuntimeSDK + BaseWorkflow (Week 1)

**OBJECTIVE:** Refactor AgentRuntimeSDK and BaseWorkflow to use canonical runtime

**SYSTEMS TO REFACTOR:**
1. BaseWorkflow → ExecutionOrchestrator
2. Remove AgentRuntimeSDK
3. Remove BaseWorkflow

**EXPECTED OUTCOME:** 
- AgentRuntimeSDK removed
- BaseWorkflow removed
- All workflow execution through canonical ExecutionOrchestrator

**ESTIMATED EFFORT:** 2-3 days

---

### Phase 2A.2.2: Refactor EventEmitter + ExecutionTracer (Week 1)

**OBJECTIVE:** Refactor EventEmitter and ExecutionTracer to use canonical services

**SYSTEMS TO REFACTOR:**
1. EventEmitter → EventService
2. ExecutionTracer → RuntimeService
3. Remove EventEmitter
4. Remove ExecutionTracer

**EXPECTED OUTCOME:**
- EventEmitter removed
- ExecutionTracer removed
- All event emission through canonical EventService
- All tracing through canonical RuntimeService

**ESTIMATED EFFORT:** 1-2 days

---

### Phase 2A.2.3: Remove AgentRuntimeDatabase (Week 1)

**OBJECTIVE:** Remove AgentRuntimeDatabase after dependents are refactored

**SYSTEMS TO REMOVE:**
1. AgentRuntimeDatabase
2. runtime/database.ts

**EXPECTED OUTCOME:**
- AgentRuntimeDatabase removed
- No direct database access to canonical tables outside canonical services

**ESTIMATED EFFORT:** 0.5-1 day

---

### Phase 2A.3: Refactor Agent Logger (Week 2-3)

**OBJECTIVE:** Refactor Agent Logger to use canonical LogService and migrate to canonical tables

**SYSTEMS TO REFACTOR:**
1. Agent services → LogService
2. Dashboard → canonical tables
3. Actions → canonical tables
4. API routes → canonical tables
5. Remove Agent Logger
6. Drop old tables

**EXPECTED OUTCOME:**
- Agent Logger removed
- Old tables dropped
- All logging through canonical LogService
- All state in canonical tables

**ESTIMATED EFFORT:** 5-7 days

---

### Phase 2A.4: Refactor Provider Observability (Week 3)

**OBJECTIVE:** Refactor Provider Observability to use canonical LogService

**SYSTEMS TO REFACTOR:**
1. recordProviderTelemetry → LogService

**EXPECTED OUTCOME:**
- All provider telemetry through canonical LogService

**ESTIMATED EFFORT:** 0.5-1 day

---

## CANONICAL ENFORCEMENT LAWS

### Law 1: Execution Creation Authority
**ONLY** ExecutionOrchestrator may create executions via `createExecution()`.

### Law 2: Execution State Transition Authority
**ONLY** ExecutionService may transition execution states via `startExecution()`, `completeExecution()`, `failExecution()`, `cancelExecution()`, `retryExecution()`.

### Law 3: Task Creation Authority
**ONLY** TaskService may create tasks via `createTask()`.

### Law 4: Task State Transition Authority
**ONLY** TaskService may transition task states via `startTask()`, `completeTask()`, `failTask()`, `cancelTask()`.

### Law 5: Event Publishing Authority
**ONLY** EventService may publish events via `publishEvent()`, `publishEventsBatch()`.

### Law 6: Log Writing Authority
**ONLY** LogService may write logs via `writeLog()`, `writeLogsBatch()`, `writeError()`, `writeFatal()`.

### Law 7: Direct Database Access Prohibition
**NO** system may directly INSERT/UPDATE canonical tables (agent_executions, agent_tasks, agent_events, agent_logs) outside canonical services.

---

## AUDIT CONCLUSION

**TOTAL VIOLATIONS:** 7
**CRITICAL VIOLATIONS:** 3
**HIGH VIOLATIONS:** 3
**MEDIUM VIOLATIONS:** 1
**TOTAL ESTIMATED EFFORT:** 9-14 days

**CRITICAL FINDINGS:**
1. AgentRuntimeDatabase duplicates all canonical runtime services
2. AgentRuntimeSDK duplicates ExecutionOrchestrator functionality
3. Agent Logger creates dual logging system with old tables
4. EventEmitter and ExecutionTracer bypass canonical services
5. BaseWorkflow bypasses ExecutionOrchestrator
6. Provider Observability bypasses LogService

**NEXT STEPS:**
1. Begin Phase 2A.2.1: Refactor AgentRuntimeSDK + BaseWorkflow
2. Follow with Phase 2A.2.2: Refactor EventEmitter + ExecutionTracer
3. Follow with Phase 2A.2.3: Remove AgentRuntimeDatabase
4. Follow with Phase 2A.3: Refactor Agent Logger
5. Follow with Phase 2A.4: Refactor Provider Observability
6. Establish single canonical execution authority

---

**END OF VIOLATIONS REPORT**

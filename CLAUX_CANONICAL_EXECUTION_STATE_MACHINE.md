# CLAUX CANONICAL EXECUTION STATE MACHINE

**Date:** 2025-01-09
**Engineer:** Cascade AI
**Scope:** Phase 2A.5 - Execution State Consolidation
**Status:** Audit Complete

---

## EXECUTIVE SUMMARY

This document defines the canonical execution state machine for CLAUX, consolidating all execution and task lifecycle states into a single, canonical authority. The objective is to eliminate conflicting state systems and establish a unified state transition model.

**TOTAL STATE SYSTEMS:** 2
**CANONICAL SYSTEMS:** 2 (Execution, Task)
**CONFLICTING SYSTEMS:** 1 (Old Agent States)
**TOTAL STATES:** 12 (6 execution, 6 task)

---

## CANONICAL EXECUTION LIFECYCLE STATES

### ExecutionStatus Enum

**FILE:** `apps/web/lib/runtime/types/execution.types.ts`
**LINES:** 14-21

**CANONICAL STATES:**

1. **PENDING** - Execution created but not started
   - Initial state for all executions
   - Represents queued execution awaiting execution
   - Transition target: RUNNING, CANCELLED

2. **RUNNING** - Execution is actively executing
   - Execution has started and is in progress
   - Represents active execution lifecycle
   - Transition target: COMPLETED, FAILED, CANCELLED

3. **COMPLETED** - Execution completed successfully
   - Terminal state (no further transitions)
   - Represents successful execution completion
   - Transition target: None

4. **FAILED** - Execution failed
   - Terminal state (no further transitions)
   - Represents execution failure
   - Transition target: RETRYING (for retry logic), CANCELLED

5. **CANCELLED** - Execution was cancelled
   - Terminal state (no further transitions)
   - Represents user/system-initiated cancellation
   - Transition target: None

6. **RETRYING** - Execution is being retried
   - Intermediate state for retry logic
   - Represents execution being retried after failure
   - Transition target: RUNNING, CANCELLED

### Execution State Transitions

**FILE:** `apps/web/lib/runtime/services/types.ts`
**LINES:** 22-28

```typescript
export const EXECUTION_TRANSITIONS: Readonly<Record<ExecutionStatus, readonly ExecutionStatus[]>> = {
  [ExecutionStatus.PENDING]: [ExecutionStatus.RUNNING, ExecutionStatus.CANCELLED],
  [ExecutionStatus.RUNNING]: [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED],
  [ExecutionStatus.FAILED]: [ExecutionStatus.RETRYING, ExecutionStatus.CANCELLED],
  [ExecutionStatus.RETRYING]: [ExecutionStatus.RUNNING, ExecutionStatus.CANCELLED],
  [ExecutionStatus.COMPLETED]: [],
  [ExecutionStatus.CANCELLED]: [],
}
```

### Execution Lifecycle Flow

```
┌─────────┐
│ PENDING │
└────┬────┘
     │
     ├──────────────► RUNNING ◄──────────────┐
     │                │                      │
     │                ├─────────┐            │
     │                │         │            │
     │                ▼         ▼            │
     │          COMPLETED   FAILED            │
     │                │         │            │
     │                │         └──► RETRYING ┘
     │                │              │
     │                │              │
     └─────────────► CANCELLED ◄────┘
```

---

## CANONICAL TASK LIFECYCLE STATES

### TaskStatus Enum

**FILE:** `apps/web/lib/runtime/types/task.types.ts`
**LINES:** 14-21

**CANONICAL STATES:**

1. **PENDING** - Task created but not started
   - Initial state for all tasks
   - Represents queued task awaiting execution
   - Transition target: RUNNING, SKIPPED

2. **RUNNING** - Task is actively executing
   - Task has started and is in progress
   - Represents active task execution
   - Transition target: COMPLETED, FAILED, SKIPPED

3. **COMPLETED** - Task completed successfully
   - Terminal state (no further transitions)
   - Represents successful task completion
   - Transition target: None

4. **FAILED** - Task failed
   - Terminal state (no further transitions)
   - Represents task failure
   - Transition target: RETRYING (for retry logic), SKIPPED

5. **SKIPPED** - Task was skipped
   - Terminal state (no further transitions)
   - Represents task skipped due to dependency or condition
   - Transition target: None

6. **RETRYING** - Task is being retried
   - Intermediate state for retry logic
   - Represents task being retried after failure
   - Transition target: RUNNING, SKIPPED

### Task State Transitions

**FILE:** `apps/web/lib/runtime/services/types.ts`
**LINES:** 34-40

```typescript
export const TASK_TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  [TaskStatus.PENDING]: [TaskStatus.RUNNING, TaskStatus.SKIPPED],
  [TaskStatus.RUNNING]: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.SKIPPED],
  [TaskStatus.FAILED]: [TaskStatus.RETRYING, TaskStatus.SKIPPED],
  [TaskStatus.RETRYING]: [TaskStatus.RUNNING, TaskStatus.SKIPPED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.SKIPPED]: [],
}
```

### Task Lifecycle Flow

```
┌─────────┐
│ PENDING │
└────┬────┘
     │
     ├──────────────► RUNNING ◄──────────────┐
     │                │                      │
     │                ├─────────┐            │
     │                │         │            │
     │                ▼         ▼            │
     │          COMPLETED   FAILED            │
     │                │         │            │
     │                │         └──► RETRYING ┘
     │                │              │
     │                │              │
     └────────────► SKIPPED ◄──────┘
```

---

## STATE TRANSITION VALIDATION

### Execution Transition Validator

**FILE:** `apps/web/lib/runtime/services/types.ts`
**FUNCTION:** `validateExecutionTransition()`
**LINES:** 47-62

**PURPOSE:** Validates execution state transitions against canonical transition rules

**VALIDATION LOGIC:**
- Checks if transition is allowed in EXECUTION_TRANSITIONS
- Returns validation result with error message if invalid
- Used by ExecutionService before state transitions

### Task Transition Validator

**FILE:** `apps/web/lib/runtime/services/types.ts`
**FUNCTION:** `validateTaskTransition()`
**LINES:** 66-82

**PURPOSE:** Validates task state transitions against canonical transition rules

**VALIDATION LOGIC:**
- Checks if transition is allowed in TASK_TRANSITIONS
- Returns validation result with error message if invalid
- Used by TaskService before state transitions

---

## CONFLICTING STATE SYSTEMS

### System #1: Old Agent States (CONFLICTING ❌)

**FILE:** `apps/web/lib/agents/base/agent.logger.ts`
**LINES:** 4
**TYPE:** Alternate Agent State System
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Old agent state tracking with deprecated state values

### Conflicting States

**OLD AGENT STATUS TYPE:**
```typescript
type AgentStatus = "queued" | "running" | "completed" | "failed" | "cancelled"
```

**CONFLICTS:**
1. **"queued"** - Not a canonical execution state
   - Should map to **PENDING**
   - Creates dual state terminology
   - Confuses state semantics

2. **"running"** - Matches canonical RUNNING
   - No conflict, but wrong table
   - Should be in agent_executions table, not agent_states

3. **"completed"** - Matches canonical COMPLETED
   - No conflict, but wrong table
   - Should be in agent_executions table, not agent_states

4. **"failed"** - Matches canonical FAILED
   - No conflict, but wrong table
   - Should be in agent_executions table, not agent_states

5. **"cancelled"** - Matches canonical CANCELLED
   - No conflict, but wrong table
   - Should be in agent_executions table, not agent_states

### Canonical Conflict

**VIOLATION:**
- Uses "queued" instead of "PENDING"
- Stores state in agent_states table instead of agent_executions
- Creates dual state system
- Bypasses canonical ExecutionService state management

**CANONICAL EQUIVALENT:**
- ExecutionStatus.PENDING (instead of "queued")
- agent_executions table (instead of agent_states)
- ExecutionService state transitions

### Dependencies

**DIRECT DEPENDENTS:**
1. `apps/web/lib/agents/aria/aria.service.ts` - uses agent.logger
2. `apps/web/lib/agents/scribe/scribe.service.ts` - uses agent.logger
3. `apps/web/lib/agents/publish/publish.service.ts` - uses agent.logger
4. `apps/web/lib/agents/locl/locl.service.ts` - uses agent.logger
5. `apps/web/lib/agents/pulse/pulse.service.ts` - uses agent.logger

**INDIRECT DEPENDENTS (old table):**
- `apps/web/lib/dashboard/index.ts` - queries agent_states
- `apps/web/actions/audit-log.ts` - references agent_states
- `apps/web/actions/verify-automation.ts` - queries agent_states
- `apps/web/app/api/v1/agent-update/route.ts` - updates agent_states
- `apps/web/app/api/dashboard/agent-states/route.ts` - queries agent_states

### Classification

**TYPE:** CONFLICTING ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** 
- 5 operational agent services depend on this
- Dashboard, actions, and API routes depend on old table

### Migration Strategy

**PHASE:** Phase 2A.6
**ESTIMATED EFFORT:** 5-7 days
**BREAKAGE RISK:** HIGH

**STEPS:**
1. Map "queued" → PENDING in all agent services
2. Refactor 5 agent services to use canonical ExecutionService
3. Migrate dashboard to query agent_executions table
4. Refactor actions to use agent_executions table
5. Refactor API routes to use agent_executions table
6. Remove agent.logger.ts
7. Drop agent_states table

---

## STATE MAPPING TABLE

| Old State | Canonical State | Mapping | Action |
|-----------|-----------------|--------|--------|
| queued | PENDING | queued → PENDING | Refactor |
| running | RUNNING | running → RUNNING | Refactor |
| completed | COMPLETED | completed → COMPLETED | Refactor |
| failed | FAILED | failed → FAILED | Refactor |
| cancelled | CANCELLED | cancelled → CANCELLED | Refactor |

---

## CANONICAL STATE ENFORCEMENT LAWS

### Law 1: Execution State Authority
**ONLY** ExecutionService may transition execution states via canonical ExecutionStatus enum.

### Law 2: Task State Authority
**ONLY** TaskService may transition task states via canonical TaskStatus enum.

### Law 3: State Transition Validation
**ALL** state transitions must be validated against EXECUTION_TRANSITIONS or TASK_TRANSITIONS before execution.

### Law 4: Canonical State Terminology
**NO** system may use non-canonical state terminology (e.g., "queued" instead of "PENDING").

### Law 5: State Storage Authority
**ONLY** agent_executions table may store execution state.
**ONLY** agent_tasks table may store task state.

### Law 6: Old State System Prohibition
**NO** system may write to or read from agent_states table for state tracking.

---

## MIGRATION PHASING

### Phase 2A.5.1: Refactor Agent Services (Week 2-3)

**OBJECTIVE:** Refactor agent services to use canonical execution states

**SYSTEMS TO REFACTOR:**
1. Map "queued" → PENDING in all agent services
2. Refactor 5 agent services to use canonical ExecutionService

**EXPECTED OUTCOME:**
- All agent services use canonical ExecutionStatus enum
- No "queued" state terminology
- All state transitions through ExecutionService

**ESTIMATED EFFORT:** 2-3 days

---

### Phase 2A.5.2: Migrate Dashboard and Actions (Week 2-3)

**OBJECTIVE:** Migrate dashboard and actions to use canonical execution table

**SYSTEMS TO MIGRATE:**
1. Dashboard → agent_executions table
2. Actions → agent_executions table
3. API routes → agent_executions table

**EXPECTED OUTCOME:**
- Dashboard queries agent_executions table
- Actions query agent_executions table
- API routes query agent_executions table

**ESTIMATED EFFORT:** 2-3 days

---

### Phase 2A.5.3: Remove Old State System (Week 3)

**OBJECTIVE:** Remove old agent state system and drop old table

**SYSTEMS TO REMOVE:**
1. Remove agent.logger.ts
2. Drop agent_states table

**EXPECTED OUTCOME:**
- Old state system removed
- Single canonical state authority

**ESTIMATED EFFORT:** 0.5-1 day

---

## AUDIT CONCLUSION

**TOTAL STATE SYSTEMS:** 2 canonical + 1 conflicting
**CANONICAL EXECUTION STATES:** 6 (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED, RETRYING)
**CANONICAL TASK STATES:** 6 (PENDING, RUNNING, COMPLETED, FAILED, SKIPPED, RETRYING)
**CONFLICTING STATES:** 5 (queued, running, completed, failed, cancelled)

**CRITICAL FINDINGS:**
1. Old agent state system uses "queued" instead of canonical "PENDING"
2. Old agent state system stores state in agent_states table instead of agent_executions
3. Creates dual state system and terminology
4. 5 agent services depend on old state system
5. Dashboard, actions, and API routes depend on old table

**NEXT STEPS:**
1. Refactor agent services to use canonical ExecutionStatus enum
2. Map "queued" → PENDING in all agent services
3. Migrate dashboard and actions to use agent_executions table
4. Remove agent.logger.ts
5. Drop agent_states table
6. Establish single canonical state machine

---

**END OF CANONICAL EXECUTION STATE MACHINE**

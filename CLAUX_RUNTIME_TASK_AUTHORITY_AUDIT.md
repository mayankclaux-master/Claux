# CLAUX Runtime Task Authority Audit

**Report Date:** 2025-01-19
**Task:** TASK I.3 - AUDIT EXISTING RUNTIME TASK SYSTEM
**Status:** COMPLETED

## Executive Summary

This report provides a comprehensive audit of the existing runtime task system. The investigation identifies the canonical task authority, duplicate task systems, old task remnants, and architectural conflicts that must be resolved before ARIA operationalization.

**RUNTIME TASK AUTHORITY AUDIT STATUS:** ✅ COMPLETED

---

## Canonical Task Authority

### Canonical Task System

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Location:** `apps/web/lib/runtime/`

**Components:**
1. `contracts/task.contract.ts` - Canonical task contract
2. `types/task.types.ts` - Database schema types
3. `repositories/task.repository.ts` - Task repository
4. `services/task.service.ts` - Task service
5. `orchestrator/task-orchestrator.ts` - Task orchestrator

**Table:** `agent_tasks`
**Ownership:** RuntimeService
**Purpose:** Canonical task lifecycle management
**Status:** NON-NEGOTIABLE - MUST BE USED

---

### Canonical Task Contract

**File:** `apps/web/lib/runtime/contracts/task.contract.ts`

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Interfaces:**
- `TaskId` - Unique identifier for tasks
- `TaskStatus` - Task status enum (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED, SKIPPED, RETRYING)
- `TaskType` - Task type
- `TaskPriority` - Task priority enum (LOW, NORMAL, HIGH, CRITICAL)
- `TaskExecutionContext` - Task execution context
- `TaskExecutionResult` - Task execution result
- `TaskError` - Task error
- `TaskMetrics` - Task metrics
- `TaskCheckpoint` - Task checkpoint
- `TaskOptions` - Task options
- `TaskProgress` - Task progress
- `TaskDefinition` - Task definition
- `RuntimeTaskExecutor` - Runtime task executor interface
- `TaskScheduler` - Task scheduler interface

**Classification:** CANONICAL (NON-NEGOTIABLE)

---

### Canonical Task Types

**File:** `apps/web/lib/runtime/types/task.types.ts`

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Interfaces:**
- `Task` - Base task interface (database row)
- `TaskInsert` - Task insert interface
- `TaskUpdate` - Task update interface
- `TaskSelect` - Task select interface
- `TaskFilter` - Task filter interface
- `TaskStats` - Task statistics interface

**Classification:** CANONICAL (NON-NEGOTIABLE)

---

### Canonical Task Repository

**File:** `apps/web/lib/runtime/repositories/task.repository.ts`

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Methods:**
- `create(data: TaskInsert)` - Create a new task
- `createBatch(data: TaskInsert[])` - Create multiple tasks in batch
- `updateStatus(id, status, metadata)` - Update task status
- `findById(id: UUID)` - Fetch task by ID
- `fetchByExecutionId(executionId, options)` - Fetch tasks by execution ID
- `fetchPendingTasks(options)` - Fetch pending tasks
- `fetchFailedTasks(options)` - Fetch failed tasks
- `fetchByTaskType(taskType, options)` - Fetch tasks by task type
- `updateDuration(id, durationMs)` - Update task duration
- `getExecutionStatistics(executionId)` - Get task statistics for an execution

**Classification:** CANONICAL (NON-NEGOTIABLE)

**Tenant Isolation:** ✅ ENFORCED (all queries scoped to tenant_id)

---

### Canonical Task Service

**File:** `apps/web/lib/runtime/services/task.service.ts`

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Methods:**
- `createTask(data)` - Create a new task
- `createTasksBatch(data)` - Create multiple tasks in batch
- `startTask(id)` - Start a task (PENDING -> RUNNING)
- `completeTask(id, outputPayload)` - Complete a task (RUNNING -> COMPLETED)
- `failTask(id, errorPayload)` - Fail a task (RUNNING -> FAILED)
- `skipTask(id)` - Skip a task (PENDING -> SKIPPED or RUNNING -> SKIPPED)
- `retryTask(id)` - Retry a task (FAILED -> RETRYING -> RUNNING)
- `getTask(id)` - Get task by ID
- `listExecutionTasks(executionId, options)` - List tasks for an execution
- `getTaskStatistics(executionId)` - Get task statistics for an execution

**Classification:** CANONICAL (NON-NEGOTIABLE)

**Tenant Isolation:** ✅ ENFORCED (all operations scoped to tenant_id)

---

### Canonical Task Orchestrator

**File:** `apps/web/lib/runtime/orchestrator/task-orchestrator.ts`

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Methods:**
- `createTask(executionId, plan)` - Create task from plan
- `createTaskBatch(executionId, plans)` - Create task batch from plans
- `startTask(taskId)` - Start task
- `completeTask(taskId, outputPayload)` - Complete task
- `failTask(taskId, errorPayload)` - Fail task
- `retryTask(taskId)` - Retry task
- `skipTask(taskId)` - Skip task
- `getTaskState(taskId)` - Get task state
- `getTaskProgress(taskId)` - Get task progress
- `validateTaskLifecycle(taskId)` - Validate task lifecycle
- `validateTaskDependencies(taskId)` - Validate task dependencies

**Classification:** CANONICAL (NON-NEGOTIABLE)

**Auto-Events:** ✅ ENABLED (publishes events via EventService)
**Auto-Logging:** ✅ ENABLED (writes logs via LogService)

---

## Extended Task Systems

### Task Dispatcher

**File:** `apps/web/lib/runtime/execution/engine/task-dispatcher.ts`

**Status:** ⚠️ PARTIAL (TODO comments indicate incomplete implementation)

**Methods:**
- `dispatch(taskStates)` - Dispatch runnable tasks (TODO: not implemented)
- `getNextTask()` - Get next task to execute
- `completeTask(taskId)` - Complete task execution
- `failTask(taskId, error)` - Fail task execution
- `getTaskRuntime(taskId)` - Get task runtime
- `createTaskRuntime(taskId, node)` - Create task runtime
- `getConcurrencyController()` - Get concurrency controller
- `getDependencyResolver()` - Get dependency resolver
- `getPriorityQueue()` - Get priority queue
- `getStatistics()` - Get dispatch statistics
- `reset()` - Reset dispatcher

**Classification:** PARTIAL (not fully implemented)

**TODO Comments:**
- Line 51-52: "TODO: Implement using RunnableSelector API - Currently RunnableSelector constructor and method signatures mismatch"
- Line 132-133: "TODO: Implement using DependencyResolver API - Currently DependencyResolver doesn't have getCriticalPath() method"

**Status:** USE WITH CAUTION - NOT FULLY IMPLEMENTED

---

### Task Runtime

**File:** `apps/web/lib/runtime/execution/runtime/task-runtime.ts`

**Status:** ⚠️ EXTENDED (use with caution)

**Methods:**
- `getContext()` - Get task context
- `getTaskId()` - Get task ID
- `getNode()` - Get DAG node
- `getStateMachine()` - Get state machine
- `getStatus()` - Get task status
- `start()` - Start task
- `complete(result)` - Complete task
- `fail(error)` - Fail task
- `cancel(reason)` - Cancel task
- `retry(reason)` - Retry task
- `skip(reason)` - Skip task
- `getResult()` - Get task result
- `getError()` - Get task error
- `getDuration()` - Get task duration
- `setMetadata(key, value)` - Set metadata
- `getMetadata(key)` - Get metadata
- `getAllMetadata()` - Get all metadata
- `on(eventType, handler)` - Register event handler
- `off(eventType)` - Unregister event handler
- `emit(event)` - Emit event
- `isComplete()` - Check if task is complete
- `isActive()` - Check if task is active
- `canCancel()` - Check if task can be cancelled
- `canSkip()` - Check if task can be skipped
- `canRetry()` - Check if task can be retried
- `getRetryCount()` - Get retry count
- `hasRetried()` - Check if task has been retried
- `toTaskExecutionState()` - Get task execution state
- `getSummary()` - Get task summary

**Classification:** EXTENDED (use with caution - not required for ARIA)

---

### Task State Machine

**File:** `apps/web/lib/runtime/execution/state/task-state-machine.ts`

**Status:** ⚠️ EXTENDED (use with caution)

**Classification:** EXTENDED (use with caution - not required for ARIA)

---

## Old Task Systems

### Workflow Task System

**File:** `apps/web/lib/runtime/workflows/types.ts`

**Status:** ⚠️ OLD (conflicts with canonical system)

**Interfaces:**
- `TaskDefinition` - Workflow task definition
- `WorkflowDefinition` - Workflow definition

**Classification:** OLD (conflicts with canonical task contract)

**Action Required:** DEPRECATE - Use canonical task contract

---

### ARIA Workflow Tasks

**File:** `apps/web/lib/runtime/workflows/aria.workflow.ts`

**Status:** ⚠️ OLD (conflicts with canonical system)

**Task Count:** 10 tasks
**Tasks:**
1. fetch_business_profile
2. fetch_keywords
3. normalize_keywords
4. classify_intent
5. quality_filter
6. cluster_keywords
7. analyze_opportunities
8. store_keywords
9. generate_briefs
10. publish_workflow

**Classification:** OLD (conflicts with canonical task system)

**Action Required:** DEPRECATE - Use canonical task contracts

---

## ARIA Task Status

### Do ARIA Tasks Already Partially Exist?

**Answer:** NO

**Evidence:**
- ❌ ARIA-specific task contracts do NOT exist
- ❌ ARIA-specific task types do NOT exist
- ❌ ARIA-specific task repository does NOT exist
- ❌ ARIA-specific task service does NOT exist
- ⚠️ ARIA workflow defines tasks (OLD - conflicts with canonical system)

**Conclusion:** ARIA tasks do NOT exist. ARIA must use canonical task contracts.

---

### Do Old Task Systems Still Exist?

**Answer:** YES

**Evidence:**
- ⚠️ Workflow task system exists (`workflows/types.ts`)
- ⚠️ ARIA workflow tasks exist (`workflows/aria.workflow.ts`)
- ⚠️ SCRIBE workflow tasks exist (`workflows/scribe.workflow.ts`)

**Conclusion:** Old task systems exist and must be deprecated.

---

### Do Duplicate Task Authorities Exist?

**Answer:** YES

**Evidence:**
- ⚠️ Canonical task authority (RuntimeService + TaskService + TaskOrchestrator)
- ⚠️ Workflow task authority (workflow system)
- ⚠️ Task dispatcher authority (execution engine)
- ⚠️ Task runtime authority (execution engine)

**Conclusion:** Duplicate task authorities exist and must be resolved.

---

## Task Authority Conflicts

### Conflict 1: Workflow Task Authority vs Canonical Task Authority

**Status:** ⚠️ CONFLICT

**Issue:**
- Workflow system defines TaskDefinition in `workflows/types.ts`
- Canonical system defines TaskDefinition in `contracts/task.contract.ts`
- Two different task authorities exist

**Impact:**
- Potential confusion about which task authority to use
- Risk of using wrong task authority
- Risk of architectural fragmentation

**Resolution Required:**
- Use canonical task authority (RuntimeService + TaskService + TaskOrchestrator)
- Deprecate workflow task authority
- Delete workflow-specific task contracts

---

### Conflict 2: Task Dispatcher vs Task Orchestrator

**Status:** ⚠️ CONFLICT

**Issue:**
- Task dispatcher defines task dispatch logic
- Task orchestrator defines task orchestration logic
- Two different task execution authorities exist

**Impact:**
- Potential confusion about task execution authority
- Risk of using wrong task execution authority
- Risk of architectural fragmentation

**Resolution Required:**
- Use canonical task authority (TaskOrchestrator)
- Deprecate task dispatcher (not fully implemented anyway)
- Use TaskOrchestrator for all task orchestration

---

### Conflict 3: Task Runtime vs Task Service

**Status:** ⚠️ CONFLICT

**Issue:**
- Task runtime defines task execution context
- Task service defines task lifecycle management
- Two different task lifecycle authorities exist

**Impact:**
- Potential confusion about task lifecycle authority
- Risk of using wrong task lifecycle authority
- Risk of architectural fragmentation

**Resolution Required:**
- Use canonical task authority (TaskService)
- Deprecate task runtime (extended system, not required)
- Use TaskService for all task lifecycle management

---

## Task Registration System

### Canonical Task Registration

**Status:** ✅ CANONICAL

**Method:** Task creation via TaskService

**Registration Flow:**
```
Agent
  → RuntimeService
  → TaskService.createTask()
  → TaskRepository.create()
  → agent_tasks table
```

**Classification:** CANONICAL (NON-NEGOTIABLE)

---

### Workflow Task Registration

**Status:** ⚠️ OLD

**Method:** Workflow definition in workflow files

**Registration Flow:**
```
Workflow definition
  → Workflow system
  → Task creation (unknown mechanism)
```

**Classification:** OLD (conflicts with canonical system)

**Action Required:** DEPRECATE

---

## Task Execution Lifecycle

### Canonical Task Lifecycle

**Status:** ✅ CANONICAL

**Lifecycle States:**
1. PENDING (initial state)
2. RUNNING (task started)
3. COMPLETED (task succeeded)
4. FAILED (task failed)
5. CANCELLED (task cancelled)
6. SKIPPED (task skipped)
7. RETRYING (task retrying)

**Lifecycle Transitions:**
- PENDING → RUNNING (startTask)
- RUNNING → COMPLETED (completeTask)
- RUNNING → FAILED (failTask)
- PENDING → SKIPPED (skipTask)
- RUNNING → SKIPPED (skipTask)
- FAILED → RETRYING → RUNNING (retryTask)
- ANY → CANCELLED (cancelTask)

**Classification:** CANONICAL (NON-NEGOTIABLE)

---

### Workflow Task Lifecycle

**Status:** ⚠️ OLD

**Lifecycle States:** Unknown (not documented)

**Lifecycle Transitions:** Unknown (not documented)

**Classification:** OLD (conflicts with canonical system)

**Action Required:** DEPRECATE

---

## Task Persistence

### Canonical Task Persistence

**Status:** ✅ CANONICAL

**Table:** `agent_tasks`

**Persistence Flow:**
```
TaskService
  → TaskRepository
  → agent_tasks table
  → Supabase database
```

**Classification:** CANONICAL (NON-NEGOTIABLE)

**Tenant Isolation:** ✅ ENFORCED (all operations scoped to tenant_id)

---

### Workflow Task Persistence

**Status:** ⚠️ OLD

**Persistence Flow:** Unknown (not documented)

**Classification:** OLD (conflicts with canonical system)

**Action Required:** DEPRECATE

---

## Task Visibility

### Canonical Task Visibility

**Status:** ✅ CANONICAL

**Visibility Methods:**
- `getTask(id)` - Get task by ID
- `listExecutionTasks(executionId, options)` - List tasks for an execution
- `fetchByTaskType(taskType, options)` - Fetch tasks by task type
- `fetchPendingTasks(options)` - Fetch pending tasks
- `fetchFailedTasks(options)` - Fetch failed tasks

**Classification:** CANONICAL (NON-NEGOTIABLE)

**Tenant Isolation:** ✅ ENFORCED (all queries scoped to tenant_id)

---

### Workflow Task Visibility

**Status:** ⚠️ OLD

**Visibility Methods:** Unknown (not documented)

**Classification:** OLD (conflicts with canonical system)

**Action Required:** DEPRECATE

---

## Task Retries

### Canonical Task Retry Logic

**Status:** ✅ CANONICAL

**Retry Authority:** TaskService

**Retry Logic:**
- `retryTask(id)` - Retry a task (FAILED → RETRYING → RUNNING)
- Max retries: 3 (configurable)
- Retry validation: Checks if retry count < max retries
- State transitions: FAILED → RETRYING → RUNNING

**Classification:** CANONICAL (NON-NEGOTIABLE)

**Ownership:** RuntimeService (NOT agent-owned)

---

### Workflow Task Retry Logic

**Status:** ⚠️ OLD

**Retry Logic:** Defined in workflow definitions (retry_policy)

**Classification:** OLD (conflicts with canonical system)

**Action Required:** DEPRECATE

---

## Task Orchestration

### Canonical Task Orchestration

**Status:** ✅ CANONICAL

**Orchestration Authority:** TaskOrchestrator

**Orchestration Methods:**
- `createTask(executionId, plan)` - Create task from plan
- `createTaskBatch(executionId, plans)` - Create task batch from plans
- `startTask(taskId)` - Start task
- `completeTask(taskId, outputPayload)` - Complete task
- `failTask(taskId, errorPayload)` - Fail task
- `retryTask(taskId)` - Retry task
- `skipTask(taskId)` - Skip task

**Auto-Events:** ✅ ENABLED (publishes events via EventService)
**Auto-Logging:** ✅ ENABLED (writes logs via LogService)

**Classification:** CANONICAL (NON-NEGOTIABLE)

**Ownership:** RuntimeService (NOT agent-owned)

---

### Workflow Task Orchestration

**Status:** ⚠️ OLD

**Orchestration Authority:** Workflow system

**Orchestration Methods:** Unknown (not documented)

**Classification:** OLD (conflicts with canonical system)

**Action Required:** DEPRECATE

---

## Task Ownership

### Canonical Task Ownership

**Status:** ✅ CANONICAL

**Owner:** RuntimeService

**Ownership Evidence:**
- TaskService requires tenantId
- TaskRepository requires tenantId
- TaskOrchestrator requires tenantId
- All operations scoped to tenant_id

**Classification:** CANONICAL (NON-NEGOTIABLE)

**Agent Ownership:** ❌ NONE (agents do NOT own tasks)

---

### Workflow Task Ownership

**Status:** ⚠️ OLD

**Owner:** Workflow system

**Classification:** OLD (conflicts with canonical system)

**Action Required:** DEPRECATE

---

## Task Authority Summary

### Canonical Task Authority

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Components:**
- TaskService (task lifecycle management)
- TaskRepository (task persistence)
- TaskOrchestrator (task orchestration)
- TaskContract (task contracts)
- TaskTypes (task types)

**Table:** `agent_tasks`

**Ownership:** RuntimeService

**Tenant Isolation:** ✅ ENFORCED

**Auto-Events:** ✅ ENABLED

**Auto-Logging:** ✅ ENABLED

**Classification:** CANONICAL (NON-NEGOTIABLE - MUST BE USED)

---

### Old Task Authority

**Status:** ⚠️ OLD (MUST DEPRECATE)

**Components:**
- Workflow task system
- ARIA workflow tasks
- SCRIBE workflow tasks

**Ownership:** Workflow system

**Classification:** OLD (conflicts with canonical system)

**Action Required:** DEPRECATE

---

### Extended Task Authority

**Status:** ⚠️ EXTENDED (USE WITH CAUTION)

**Components:**
- TaskDispatcher (not fully implemented)
- TaskRuntime (extended system)
- TaskStateMachine (extended system)

**Classification:** EXTENDED (use with caution - not required for ARIA)

**Action Required:** USE WITH CAUTION - NOT REQUIRED FOR ARIA

---

## ARIA Task Integration Requirements

### ARIA Must Use Canonical Task Authority

**Status:** ✅ REQUIRED

**Required Components:**
- TaskService (task lifecycle management)
- TaskRepository (task persistence)
- TaskOrchestrator (task orchestration)
- TaskContract (task contracts)
- TaskTypes (task types)

**Required Flow:**
```
ARIA Agent
  → RuntimeService
  → TaskService.createTask()
  → TaskOrchestrator.startTask()
  → TaskOrchestrator.completeTask()
  → agent_tasks table
  → EventService (auto-events)
  → LogService (auto-logging)
```

**Classification:** NON-NEGOTIABLE - MUST USE CANONICAL TASK AUTHORITY

---

### ARIA Must NOT Use Old Task Authority

**Status:** ⚠️ FORBIDDEN

**Forbidden Components:**
- Workflow task system
- ARIA workflow tasks
- SCRIBE workflow tasks

**Forbidden Flow:**
```
ARIA Agent
  → Workflow system
  → Workflow task creation
  → Workflow task execution
```

**Classification:** FORBIDDEN - CONFLICTS WITH CANONICAL SYSTEM

**Action Required:** DEPRECATE OLD TASK AUTHORITY

---

### ARIA Must NOT Use Extended Task Authority

**Status:** ⚠️ NOT REQUIRED

**Not Required Components:**
- TaskDispatcher (not fully implemented)
- TaskRuntime (extended system)
- TaskStateMachine (extended system)

**Classification:** NOT REQUIRED - EXTENDED SYSTEM

**Action Required:** DO NOT USE EXTENDED TASK AUTHORITY

---

## Conclusion

The runtime task authority audit has identified:
- 1 canonical task authority (NON-NEGOTIABLE - MUST BE USED)
- 1 old task authority (MUST DEPRECATE)
- 1 extended task authority (USE WITH CAUTION - NOT REQUIRED FOR ARIA)
- 3 task authority conflicts (MUST RESOLVE)
- 0 ARIA-specific task authorities (DO NOT EXIST)
- 3 TODO comments in task dispatcher (INCOMPLETE IMPLEMENTATION)

**RUNTIME TASK AUTHORITY AUDIT STATUS:** ✅ COMPLETED

**Canonical Task Authority:** ✅ FULLY IMPLEMENTED
**Old Task Authority:** ⚠️ MUST DEPRECATE
**Extended Task Authority:** ⚠️ USE WITH CAUTION
**ARIA Task Status:** ❌ MUST USE CANONICAL TASK AUTHORITY

**Next Steps:**
- TASK I.4: Discover existing execution contracts
- TASK I.5: Provider execution ownership audit
- TASK I.6: Mock execution discovery
- TASK I.7: Runtime reusability analysis
- TASK I.8: Final CTO investigation summary

---

**END OF AUDIT**

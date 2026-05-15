# REPOSITORY FILE AUDIT

**PHASE:** Z13B — STEP 1  
**DATE:** 2026-05-13  
**SCOPE:** apps/web/lib/runtime/repositories/  
**PURPOSE:** Identify all repository files, stubbed files, obsolete imports, invalid Result<T> usage, broken generic contracts, missing canonical imports, dead helper methods, broken repository inheritance

---

## FILE INVENTORY

### All Repository Files

| File | Lines | Status | Extends BaseRepository |
|------|-------|--------|------------------------|
| base.repository.ts | 136 | **STUBBED** | N/A (base class) |
| event.repository.ts | 171 | **STUBBED** | Yes |
| execution.repository.ts | 181 | **STUBBED** | Yes |
| log.repository.ts | 369 | **BROKEN (not stubbed)** | Yes |
| task.repository.ts | 361 | **BROKEN (not stubbed)** | Yes |
| metrics.repository.ts | 617 | **BROKEN (not stubbed)** | No (standalone) |
| index.ts | 36 | OK (exports only) | N/A |

---

## STUBBED FILES ANALYSIS

### base.repository.ts

**Status:** **DANGEROUS STUB** - All methods stubbed with TODO comments

**Issues:**
- All CRUD methods return `{} as Result<T>` (empty object cast)
- Pagination and sort use `unknown` type instead of proper types
- Missing methods: `logOperation`, `logError`, `getQueryConfig`, `applyFilters`
- Imports from obsolete `../types` (should be `../types/index.ts`)
- Uses `Result<T>` (1 arg) but should use `Result<T, RuntimeDatabaseError>` (2 args)

**Stubbed Methods:**
- `create()` - Returns empty object cast
- `createBatch()` - Returns empty object cast
- `findById()` - Returns empty object cast
- `findByTenant()` - Returns empty object cast, pagination/sort as unknown
- `updateById()` - Returns empty object cast
- `updateByTenant()` - Returns empty object cast
- `deleteById()` - Returns empty object cast
- `deleteByTenant()` - Returns empty object cast
- `countByTenant()` - Returns empty object cast

**Functional Methods (preserved):**
- `getAdminClient()` - Works correctly
- `getAuthClient()` - Works correctly

**Impact:** Breaks entire repository inheritance chain

---

### event.repository.ts

**Status:** **DANGEROUS STUB** - All methods stubbed with TODO comments

**Issues:**
- Uses `unknown` for all generics instead of proper types
- All methods return `{} as Result<unknown>` (empty object cast)
- Imports from obsolete `../types` (should be `../types/index.ts`)
- Missing canonical types: Event, EventInsert, EventUpdate, EventFilter, EventStats, EventCorrelation

**Stubbed Methods:**
- `create()` - Returns empty object cast
- `createBatch()` - Returns empty object cast
- `findById()` - Returns empty object cast
- `fetchByExecutionId()` - Returns empty object cast
- `fetchByCorrelationId()` - Returns empty object cast
- `fetchEventStream()` - Returns empty object cast
- `fetchByEventName()` - Returns empty object cast
- `fetchByEventSource()` - Returns empty object cast
- `getStatistics()` - Returns empty object cast
- `getCorrelationChain()` - Returns empty object cast

**Impact:** Breaks event persistence, audit trails, correlation chains

---

### execution.repository.ts

**Status:** **DANGEROUS STUB** - All methods stubbed with TODO comments

**Issues:**
- Uses `unknown` for all generics instead of proper types
- All methods return `{} as Result<unknown>` (empty object cast)
- Imports from obsolete `../types` (should be `../types/index.ts`)
- Missing canonical types: Execution, ExecutionInsert, ExecutionUpdate, ExecutionFilter, ExecutionStats

**Stubbed Methods:**
- `create()` - Returns empty object cast
- `updateStatus()` - Returns empty object cast
- `findById()` - Returns empty object cast
- `findByTenant()` - Returns empty object cast
- `fetchRunningExecutions()` - Returns empty object cast
- `fetchFailedExecutions()` - Returns empty object cast
- `fetchByAgentName()` - Returns empty object cast
- `fetchByWorkflowType()` - Returns empty object cast
- `incrementRetryCount()` - Returns empty object cast
- `updateCost()` - Returns empty object cast
- `getStatistics()` - Returns empty object cast

**Impact:** Breaks execution persistence, recovery, replay

---

## BROKEN FILES ANALYSIS (Not Stubbed)

### log.repository.ts

**Status:** **BROKEN** - Has full implementation but imports from obsolete types

**Issues:**
- Imports from obsolete `../types` (should be `../types/index.ts`)
- Uses `Result<T, RuntimeDatabaseError>` (2 args) but types.ts only has `Result<T>` (1 arg)
- Calls missing BaseRepository methods: `logOperation`, `logError`, `getQueryConfig`, `applyFilters`
- Missing canonical types: Log, LogInsert, LogUpdate, LogFilter, LogStats, LogAggregation

**Methods Present (full implementation):**
- `create()` - Full implementation, calls missing BaseRepository methods
- `createBatch()` - Full implementation, calls missing BaseRepository methods
- `findById()` - Full implementation, calls missing BaseRepository methods
- `fetchByExecutionId()` - Full implementation
- `fetchByTaskId()` - Full implementation
- `fetchErrorLogs()` - Full implementation
- `fetchFatalLogs()` - Full implementation
- `fetchByLogLevel()` - Full implementation
- `getStatistics()` - Full implementation
- `getExecutionAggregation()` - Full implementation
- `applyFilters()` - Full implementation

**Helper Functions:**
- `executeQuery()` - Requires db/executeQuery

**Impact:** Cannot compile due to type errors, breaks observability

---

### task.repository.ts

**Status:** **BROKEN** - Has full implementation but imports from obsolete types

**Issues:**
- Imports from obsolete `../types` (should be `../types/index.ts`)
- Uses `Result<T, RuntimeDatabaseError>` (2 args) but types.ts only has `Result<T>` (1 arg)
- Calls missing BaseRepository methods: `logOperation`, `logError`, `getQueryConfig`, `applyFilters`
- Missing canonical types: Task, TaskInsert, TaskUpdate, TaskFilter, TaskStats

**Methods Present (full implementation):**
- `create()` - Full implementation, calls missing BaseRepository methods
- `createBatch()` - Full implementation, calls missing BaseRepository methods
- `updateStatus()` - Full implementation
- `findById()` - Full implementation, calls missing BaseRepository methods
- `fetchByExecutionId()` - Full implementation
- `fetchPendingTasks()` - Full implementation
- `fetchFailedTasks()` - Full implementation
- `fetchByTaskType()` - Full implementation
- `updateDuration()` - Full implementation
- `getExecutionStatistics()` - Full implementation
- `applyFilters()` - Full implementation

**Helper Functions:**
- `executeUpdate()` - Requires db/executeUpdateQuery
- `executeQuery()` - Requires db/executeQuery

**Impact:** Cannot compile due to type errors, breaks task lifecycle, replay

---

### metrics.repository.ts

**Status:** **BROKEN** - Has full implementation but imports from obsolete types

**Issues:**
- Imports from obsolete `../types` (should be `../types/index.ts`)
- Uses `Result<T, RuntimeDatabaseError>` (2 args) but types.ts only has `Result<T>` (1 arg)
- Does NOT extend BaseRepository (standalone)
- Has its own getAdminClient() method

**Methods Present (full implementation):**
- `getExecutionMetrics()` - Full implementation
- `getTaskMetrics()` - Full implementation
- `getEventMetrics()` - Full implementation
- `getLogMetrics()` - Full implementation
- `getCostMetrics()` - Full implementation (has type error: cost_trend as array instead of enum)
- `getTokenMetrics()` - Full implementation
- `getFailureRateMetrics()` - Full implementation
- `getDurationMetrics()` - Full implementation

**Helper Functions:**
- `executeQuery()` - Requires db/executeQuery

**Impact:** Cannot compile due to type errors, breaks observability

---

## OBSOLETE IMPORTS ANALYSIS

### Current Import Pattern (WRONG)

All repositories import from:
```typescript
import type { UUID, Result } from '../types';
```

This resolves to:
- `apps/web/lib/runtime/types.ts` (OBSOLETE single-file)

### Canonical Import Pattern (CORRECT)

Repositories should import from:
```typescript
import type { UUID, Result, PaginationOptions, SortOptions } from '../types/index';
// OR
import type { UUID } from '../types/common.types';
import type { Result } from '../types/common.types';
import type { Execution, ExecutionInsert, ExecutionUpdate, ExecutionFilter, ExecutionStats } from '../types/execution.types';
import type { Task, TaskInsert, TaskUpdate, TaskFilter, TaskStats } from '../types/task.types';
import type { Event, EventInsert, EventUpdate, EventFilter, EventStats, EventCorrelation } from '../types/event.types';
import type { Log, LogInsert, LogUpdate, LogFilter, LogStats, LogAggregation } from '../types/log.types';
```

This resolves to:
- `apps/web/lib/runtime/types/index.ts` (CANONICAL modular system)

---

## Result<T,E> MISMATCH ANALYSIS

### Current Usage (BROKEN)

Repositories use:
```typescript
Promise<Result<T, RuntimeDatabaseError>>
```

But `types.ts` only defines:
```typescript
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: Error;
}
```

### Canonical Definition (CORRECT)

`types/common.types.ts` defines:
```typescript
export type Result<T, E = DatabaseError> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### Impact

All repository method signatures are incompatible with the imported Result type.

---

## MISSING BASE REPOSITORY METHODS

### Methods Called by Repositories but Missing from BaseRepository

| Method | Used By | Purpose | Status |
|--------|---------|---------|--------|
| `logOperation()` | log, task | Logging repository operations | MISSING (stub removed) |
| `logError()` | log, task | Logging repository errors | MISSING (stub removed) |
| `getQueryConfig()` | log, task | Getting query configuration | MISSING (stub removed) |
| `applyFilters()` | log, task | Applying query filters | MISSING (stub removed) |

---

## BROKEN GENERIC CONTRACTS

### base.repository.ts

**Current:**
```typescript
export abstract class BaseRepository<T, TInsert, TUpdate, TFilter extends BaseFilter>
```

**Issue:** Pagination and sort use `unknown`:
```typescript
protected async findByTenant(options?: {
  filter?: TFilter;
  pagination?: unknown;  // Should be PaginationOptions
  sort?: unknown;        // Should be SortOptions
}): Promise<Result<T[]>>
```

### event.repository.ts

**Current:**
```typescript
export class EventRepository extends BaseRepository<
  unknown,  // Should be Event
  unknown,  // Should be EventInsert
  unknown,  // Should be EventUpdate
  EventRepositoryFilter
>
```

### execution.repository.ts

**Current:**
```typescript
export class ExecutionRepository extends BaseRepository<
  unknown,  // Should be Execution
  unknown,  // Should be ExecutionInsert
  unknown,  // Should be ExecutionUpdate
  ExecutionRepositoryFilter
>
```

---

## DEAD HELPER METHODS

### Helper Functions in Repository Files

**log.repository.ts:**
- `executeQuery<T>()` - Requires db/executeQuery

**task.repository.ts:**
- `executeUpdate<T>()` - Requires db/executeUpdateQuery
- `executeQuery<T>()` - Requires db/executeQuery

**metrics.repository.ts:**
- `executeQuery<T>()` - Requires db/executeQuery

**Status:** These are NOT dead - they are required for the implementations. However, they should be moved to a shared location or use the db layer directly.

---

## BROKEN REPOSITORY INHERITANCE

### Inheritance Chain

```
BaseRepository (STUBBED)
    ↓
├─ EventRepository (STUBBED)
├─ ExecutionRepository (STUBBED)
├─ LogRepository (BROKEN - calls missing methods)
└─ TaskRepository (BROKEN - calls missing methods)
```

**MetricsRepository** does NOT extend BaseRepository (standalone)

### Impact

- Stubbed BaseRepository breaks inheritance chain
- Log/Task repositories call methods that don't exist on stubbed BaseRepository
- This causes runtime errors when methods are called

---

## MISSING CANONICAL IMPORTS

### Types Needed by Repositories

| Type | Canonical Location | Repository Usage |
|------|-------------------|------------------|
| UUID | types/common.types.ts | All repositories |
| Result<T, E> | types/common.types.ts | All repositories |
| PaginationOptions | types/common.types.ts | BaseRepository |
| SortOptions | types/common.types.ts | BaseRepository |
| Execution | types/execution.types.ts | ExecutionRepository |
| ExecutionInsert | types/execution.types.ts | ExecutionRepository |
| ExecutionUpdate | types/execution.types.ts | ExecutionRepository |
| ExecutionFilter | types/execution.types.ts | ExecutionRepository |
| ExecutionStats | types/execution.types.ts | ExecutionRepository |
| Task | types/task.types.ts | TaskRepository |
| TaskInsert | types/task.types.ts | TaskRepository |
| TaskUpdate | types/task.types.ts | TaskRepository |
| TaskFilter | types/task.types.ts | TaskRepository |
| TaskStats | types/task.types.ts | TaskRepository |
| Event | types/event.types.ts | EventRepository |
| EventInsert | types/event.types.ts | EventRepository |
| EventUpdate | types/event.types.ts | EventRepository |
| EventFilter | types/event.types.ts | EventRepository |
| EventStats | types/event.types.ts | EventRepository |
| EventCorrelation | types/event.types.ts | EventRepository |
| Log | types/log.types.ts | LogRepository |
| LogInsert | types/log.types.ts | LogRepository |
| LogUpdate | types/log.types.ts | LogRepository |
| LogFilter | types/log.types.ts | LogRepository |
| LogStats | types/log.types.ts | LogRepository |
| LogAggregation | types/log.types.ts | LogRepository |

---

## SUMMARY

### Stubbed Files (3)
- base.repository.ts - DANGEROUS
- event.repository.ts - DANGEROUS
- execution.repository.ts - DANGEROUS

### Broken Files (3)
- log.repository.ts - Full implementation, wrong imports
- task.repository.ts - Full implementation, wrong imports
- metrics.repository.ts - Full implementation, wrong imports

### Common Issues Across All Files
1. Import from obsolete `../types` instead of canonical `../types/index.ts`
2. Result<T,E> mismatch (use 2 args but types.ts only has 1 arg)
3. Missing canonical type imports
4. Missing BaseRepository methods (logOperation, logError, getQueryConfig, applyFilters)

### Critical Impact
- **Persistence:** BROKEN (execution, task, event, log repositories)
- **Recovery:** BROKEN (execution repository stubbed)
- **Replay:** BROKEN (task repository broken)
- **Audit Trails:** BROKEN (event repository stubbed)
- **Observability:** BROKEN (log, metrics repositories broken)
- **Tenant Isolation:** BROKEN (BaseRepository stubbed)

---

**END OF AUDIT**

# REPOSITORY CONTRACT AUDIT REPORT

**PHASE:** Z13B-1 — REPOSITORY CONTRACT CONVERGENCE AUDIT  
**DATE:** 2026-05-13  
**SCOPE:** apps/web/lib/runtime/repositories/  
**AUDIT TYPE:** Strict contract mismatch analysis (no implementation)

---

## EXECUTIVE SUMMARY

**CRITICAL FINDING:** The repository layer is importing from an OBSOLETE type file (`types.ts`) while a COMPLETE modular type system exists in `types/index.ts`. This is a type system migration that was never completed.

**IMPACT:** All repository files are broken due to importing from the wrong type file. The stubs created during error fixing are masking a fundamental architectural issue.

---

## 1. MISSING EXPORTS FROM types.ts

### 1.1 Type System Architecture Discovery

**TWO COMPETING TYPE SYSTEMS EXIST:**

| File | Status | Exports |
|------|--------|---------|
| `runtime/types.ts` | OBSOLETE/LEGACY | Single-file, limited exports |
| `runtime/types/index.ts` | CANONICAL/PROPER | Modular, complete exports from sub-files |

**SUB-FILE STRUCTURE (CANONICAL):**
- `types/execution.types.ts` - Execution, ExecutionInsert, ExecutionUpdate, ExecutionSelect, ExecutionFilter, ExecutionStats
- `types/task.types.ts` - Task, TaskInsert, TaskUpdate, TaskSelect, TaskFilter, TaskStats
- `types/event.types.ts` - Event, EventInsert, EventUpdate, EventSelect, EventFilter, EventStats, EventCorrelation
- `types/log.types.ts` - Log, LogInsert, LogUpdate, LogSelect, LogFilter, LogStats, LogAggregation
- `types/common.types.ts` - UUID, ISODateTime, JSONPayload, PaginationOptions, SortOptions, Result<T, E>

### 1.2 Missing Type Exports (Exact List)

**Repositories import from:** `../types` → resolves to `types.ts` (OBSOLETE)  
**Should import from:** `../types` → should resolve to `types/index.ts` (CANONICAL)

| Type | Exists In | Repository Usage | Status |
|------|-----------|-----------------|--------|
| Log | types/log.types.ts | log.repository.ts | MISSING from types.ts |
| LogInsert | types/log.types.ts | log.repository.ts | MISSING from types.ts |
| LogUpdate | types/log.types.ts | log.repository.ts | MISSING from types.ts |
| LogFilter | types/log.types.ts | log.repository.ts | MISSING from types.ts |
| LogStats | types/log.types.ts | log.repository.ts | MISSING from types.ts |
| LogAggregation | types/log.types.ts | log.repository.ts | MISSING from types.ts |
| Event | types/event.types.ts | event.repository.ts | MISSING from types.ts |
| EventInsert | types/event.types.ts | event.repository.ts | MISSING from types.ts |
| EventUpdate | types/event.types.ts | event.repository.ts | MISSING from types.ts |
| EventFilter | types/event.types.ts | event.repository.ts | MISSING from types.ts |
| EventStats | types/event.types.ts | event.repository.ts | MISSING from types.ts |
| EventCorrelation | types/event.types.ts | event.repository.ts | MISSING from types.ts |
| Execution | types/execution.types.ts | execution.repository.ts | MISSING from types.ts |
| ExecutionInsert | types/execution.types.ts | execution.repository.ts | MISSING from types.ts |
| ExecutionUpdate | types/execution.types.ts | execution.repository.ts | MISSING from types.ts |
| ExecutionFilter | types/execution.types.ts | execution.repository.ts | MISSING from types.ts |
| ExecutionStats | types/execution.types.ts | execution.repository.ts | MISSING from types.ts |
| Task | types/task.types.ts | task.repository.ts | MISSING from types.ts |
| TaskInsert | types/task.types.ts | task.repository.ts | MISSING from types.ts |
| TaskUpdate | types/task.types.ts | task.repository.ts | MISSING from types.ts |
| TaskFilter | types/task.types.ts | task.repository.ts | MISSING from types.ts |
| TaskStats | types/task.types.ts | task.repository.ts | MISSING from types.ts |
| PaginationOptions | types/common.types.ts | base.repository.ts | MISSING from types.ts |
| SortOptions | types/common.types.ts | base.repository.ts | MISSING from types.ts |

**Legacy Types in types.ts (INCOMPATIBLE NAMING):**
- `AgentExecution` (should be `Execution`)
- `AgentTask` (should be `Task`)
- `AgentEvent` (should be `Event`)
- `AgentLog` (should be `Log`)

---

## 2. Result<T,E> MISMATCH ANALYSIS

### 2.1 Two Competing Result Type Definitions

**OBSOLETE (types.ts):**
```typescript
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: Error;  // Optional error field
}
```

**CANONICAL (types/common.types.ts):**
```typescript
export type Result<T, E = DatabaseError> =
  | { success: true; data: T }
  | { success: false; error: E };  // Discriminated union, required error
```

### 2.2 Repository Usage Pattern

**Repositories expect:** `Result<T, RuntimeDatabaseError>` (two type arguments)  
**db/queries.ts returns:** `Result<T>` (single type argument from types.ts)  
**Canonical should be:** `Result<T, RuntimeDatabaseError>` (two type arguments from types/common.types.ts)

**Impact:** All repository method signatures are incompatible with db layer return types.

---

## 3. REPOSITORY METHOD MISMATCHES

### 3.1 BaseRepository Missing Methods

**Methods used by repositories but missing from stubbed BaseRepository:**

| Method | Usage | Status |
|--------|-------|--------|
| `logOperation()` | Logging repository operations | MISSING (stub removed) |
| `logError()` | Logging repository errors | MISSING (stub removed) |
| `getQueryConfig()` | Getting query configuration | MISSING (stub removed) |
| `applyFilters()` | Applying query filters | MISSING (stub removed) |

### 3.2 Method Signature Mismatches

**Original BaseRepository had:**
```typescript
protected getQueryConfig(): QueryConfig {
  return {
    retryCount: 3,
    retryDelayMs: 100,
    timeoutMs: 30000,
    logContext: { table: this.getTableName() },
  };
}

protected logOperation(operation: string, context?: Record<string, unknown>): void { }

protected logError(operation: string, error: unknown, context?: Record<string, unknown>): void { }

protected applyFilters(query: any, filter?: TFilter): any { }
```

**Stubbed BaseRepository:** All methods removed

---

## 4. CANONICAL DIRECTION ANALYSIS

### 4.1 Type System Hierarchy

```
CANONICAL SOURCE: types/index.ts (modular system)
    ↓ exports from
types/execution.types.ts
types/task.types.ts
types/event.types.ts
types/log.types.ts
types/common.types.ts
```

### 4.2 Recommended Canonical Fix Path

**OPTION A: Migrate imports to canonical type system (RECOMMENDED)**
- Change repository imports from `'../types'` to `'../types/index'` or `'../types'` (if types.ts is removed)
- Delete or deprecate `types.ts` (the obsolete single-file version)
- This aligns with the existing modular type architecture

**OPTION B: Re-export everything from types.ts (NOT RECOMMENDED)**
- Add all missing types to `types.ts`
- This would duplicate the modular system
- Creates maintenance burden and inconsistency

**CANONICAL DIRECTION:** Repositories should conform to `types/index.ts` (the modular system). The obsolete `types.ts` should be removed or converted to a re-export barrel.

---

## 5. STUB CLASSIFICATION

### 5.1 Stubbed Files Analysis

| File | Stub Reason | Classification | Impact |
|------|-------------|----------------|--------|
| base.repository.ts | Result<T> vs Result<T,E> mismatch, missing methods | **PRODUCTION BLOCKER** | Breaks all repository inheritance |
| event.repository.ts | Missing type exports from types.ts | **PRODUCTION BLOCKER** | Breaks event persistence, audit trails |
| execution.repository.ts | Missing type exports from types.ts | **PRODUCTION BLOCKER** | Breaks execution persistence, recovery |
| log.repository.ts | Missing type exports from types.ts | **PRODUCTION BLOCKER** | Breaks observability, debugging |
| task.repository.ts | Missing type exports from types.ts | **PRODUCTION BLOCKER** | Breaks task lifecycle, replay |

### 5.2 Non-Stubbed Files with Errors

| File | Error Status | Classification |
|------|--------------|----------------|
| metrics.repository.ts | Uses Result<T, RuntimeDatabaseError> correctly | **SAFE** (imports Result from types.ts but uses 2-arg pattern) |
| log.repository.ts | NOT stubbed, has import errors | **PRODUCTION BLOCKER** |
| task.repository.ts | NOT stubbed, has import errors | **PRODUCTION BLOCKER** |

---

## 6. DEPENDENCY GRAPH

### 6.1 Repository → Runtime Service Chain

```
BaseRepository (STUBBED)
    ↓
├─ ExecutionRepository (STUBBED)
│   └─ ExecutionService (hypothetical)
│       └─ Orchestrator
│           └─ Dashboard
│
├─ TaskRepository (STUBBED)
│   └─ TaskService (hypothetical)
│       └─ ExecutionEngine
│           └─ Orchestrator
│
├─ EventRepository (STUBBED)
│   └─ EventService (hypothetical)
│       └─ AuditTrail
│           └─ Observability
│
└─ LogRepository (NOT STUBBED, BROKEN)
    └─ LoggingService (hypothetical)
        └─ Observability
            └─ Dashboard
```

### 6.2 Metrics Repository (Independent)

```
MetricsRepository (NOT STUBBED, PARTIALLY WORKING)
    ↓
MetricsService (hypothetical)
    ↓
Dashboard
    ↓
Observability
```

---

## 7. FUNCTIONALITY IMPACT ANALYSIS

### 7.1 Broken Critical Paths

| Functionality | Status | Impact |
|---------------|--------|--------|
| **Replay** | BROKEN | TaskRepository stubbed - cannot fetch task history |
| **Recovery** | BROKEN | ExecutionRepository stubbed - cannot restore execution state |
| **Audit Trails** | BROKEN | EventRepository stubbed - cannot track event chains |
| **Observability** | BROKEN | LogRepository broken - cannot query logs |
| **Tenant Isolation** | BROKEN | BaseRepository stubbed - no tenant filtering |
| **Execution Persistence** | BROKEN | ExecutionRepository stubbed - cannot persist executions |

### 7.2 Safe Functionality

| Functionality | Status | Reason |
|---------------|--------|--------|
| **Metrics Read-Only** | PARTIALLY SAFE | MetricsRepository works independently, but data sources may be broken |

---

## 8. EXACT BROKEN INTERFACES

### 8.1 BaseRepository Interface (STUBBED)

**Original Contract:**
```typescript
export abstract class BaseRepository<T, TInsert, TUpdate, TFilter extends BaseFilter> {
  protected abstract getTableName(): string;
  protected abstract getTenantId(): UUID;
  
  protected getQueryConfig(): QueryConfig;
  protected logOperation(operation: string, context?: Record<string, unknown>): void;
  protected logError(operation: string, error: unknown, context?: Record<string, unknown>): void;
  protected applyFilters(query: any, filter?: TFilter): any;
  
  protected getAdminClient();
  protected getAuthClient();
  
  protected async create(data: TInsert): Promise<Result<T>>;
  protected async createBatch(data: TInsert[]): Promise<Result<T[]>>;
  protected async findById(id: UUID): Promise<Result<T>>;
  protected async findByTenant(options?: { filter?: TFilter; pagination?: PaginationOptions; sort?: SortOptions }): Promise<Result<T[]>>;
  protected async updateById(id: UUID, data: TUpdate): Promise<Result<T>>;
  protected async updateByTenant(data: TUpdate, filter?: TFilter): Promise<Result<T[]>>;
  protected async deleteById(id: UUID): Promise<Result<T>>;
  protected async deleteByTenant(filter?: TFilter): Promise<Result<T[]>>;
  protected async countByTenant(filter?: TFilter): Promise<Result<number>>;
}
```

**Stubbed Contract:**
```typescript
export abstract class BaseRepository<T, TInsert, TUpdate, TFilter extends BaseFilter> {
  protected abstract getTableName(): string;
  protected abstract getTenantId(): UUID;
  
  // ALL METHODS REMOVED OR STUBBED WITH TODO
  protected async create(data: TInsert): Promise<Result<T>> { return {} as Result<T>; }
  // ... all other methods stubbed
}
```

### 8.2 Repository-Specific Broken Interfaces

**ExecutionRepository (STUBBED):**
- Missing: `Execution`, `ExecutionInsert`, `ExecutionUpdate`, `ExecutionFilter`, `ExecutionStats`
- All methods return `Result<unknown>` instead of `Result<Execution>`

**TaskRepository (STUBBED):**
- Missing: `Task`, `TaskInsert`, `TaskUpdate`, `TaskFilter`, `TaskStats`
- All methods return `Result<unknown>` instead of `Result<Task>`

**EventRepository (STUBBED):**
- Missing: `Event`, `EventInsert`, `EventUpdate`, `EventFilter`, `EventStats`, `EventCorrelation`
- All methods return `Result<unknown>` instead of `Result<Event>`

**LogRepository (NOT STUBBED, BROKEN):**
- Missing: `Log`, `LogInsert`, `LogUpdate`, `LogFilter`, `LogStats`, `LogAggregation`
- Type errors prevent compilation

---

## 9. RECOMMENDED REPAIR STRATEGY

### 9.1 Phase 1: Type System Migration (CRITICAL)

**Action:** Fix import paths to use canonical type system

1. **Delete or deprecate** `runtime/types.ts` (the obsolete single-file)
2. **Ensure** `runtime/types/index.ts` is the default export for `'../types'`
3. **Update** all repository imports to use canonical types
4. **Verify** db/queries.ts imports Result from canonical location

**Risk:** LOW - The canonical type system is complete and tested

### 9.2 Phase 2: Restore BaseRepository (CRITICAL)

**Action:** Restore BaseRepository with proper implementation

1. **Restore** missing methods: `logOperation`, `logError`, `getQueryConfig`, `applyFilters`
2. **Fix** Result type to use canonical `Result<T, RuntimeDatabaseError>`
3. **Restore** pagination/sorting imports from `types/common.types.ts`
4. **Implement** proper query configuration

**Risk:** MEDIUM - Requires careful type alignment with db layer

### 9.3 Phase 3: Restore Repository Implementations (CRITICAL)

**Action:** Unstub and restore repository implementations

1. **ExecutionRepository** - Restore execution persistence
2. **TaskRepository** - Restore task lifecycle
3. **EventRepository** - Restore event tracking
4. **LogRepository** - Restore logging
5. **MetricsRepository** - Verify compatibility

**Risk:** MEDIUM - Requires database schema alignment

### 9.4 Phase 4: Dependency Validation (CRITICAL)

**Action:** Validate downstream systems

1. **Test** recovery functionality
2. **Test** replay functionality
3. **Test** audit trails
4. **Test** observability
5. **Test** tenant isolation

**Risk:** HIGH - May reveal integration issues

---

## 10. CLASSIFICATION SUMMARY

### 10.1 Stub Classification

| Stub | Classification | Reason |
|------|----------------|--------|
| base.repository.ts | **DANGEROUS STUB** | Breaks inheritance chain, removes critical methods |
| event.repository.ts | **DANGEROUS STUB** | Breaks audit trails, event persistence |
| execution.repository.ts | **DANGEROUS STUB** | Breaks execution persistence, recovery |
| log.repository.ts | **BROKEN (not stubbed)** | Import errors prevent compilation |
| task.repository.ts | **DANGEROUS STUB** | Breaks task lifecycle, replay |

### 10.2 Issue Classification

| Issue | Classification | Severity |
|-------|----------------|----------|
| Wrong type file import | **ARCHITECTURAL BLOCKER** | Root cause of all repository errors |
| Result<T,E> mismatch | **ARCHITECTURAL BLOCKER** | Type system incompatibility |
| Missing BaseRepository methods | **PRODUCTION BLOCKER** | Breaks all repository operations |
| Missing type exports | **PRODUCTION BLOCKER** | Prevents compilation |

---

## 11. CONCLUSION

**ROOT CAUSE:** The repository layer imports from an obsolete type file (`types.ts`) instead of the canonical modular type system (`types/index.ts`). This is an incomplete type system migration.

**RECOMMENDED FIX:**
1. Delete or deprecate `runtime/types.ts`
2. Ensure `runtime/types/index.ts` is the default for `'../types'` imports
3. Restore BaseRepository with proper implementation
4. Unstub all repository files
5. Validate downstream functionality

**ESTIMATED EFFORT:** 4-6 hours for complete repair

**RISK LEVEL:** HIGH - Critical production functionality (recovery, replay, audit trails) is completely broken.

**URGENCY:** CRITICAL - This is a production blocker affecting core runtime capabilities.

---

**END OF AUDIT REPORT**

# Metrics Repository Root Cause Report

**Phase:** Z13C - REPOSITORY STABILIZATION + BUILD CERTIFICATION  
**Step:** STEP 1 - METRICS REPOSITORY ANALYSIS  
**Date:** 2025-05-13  
**Status:** COMPLETED

## Executive Summary

The metrics.repository.ts has extensive interface mismatches, invalid metric contracts, and database contract mismatches that prevent TypeScript compilation. The root causes are:

1. **Interface Property Mismatches** - Code assigns to properties that don't exist in metric interfaces
2. **Readonly Property Violations** - Code attempts to assign to readonly properties
3. **Database Query Contract Mismatches** - Queries don't select fields that code attempts to access
4. **Type Mismatches** - Array types assigned to string literal types
5. **Missing Type Casts** - Unknown types from db layer not properly cast

**Total Issues Identified:** 19+ TypeScript errors

---

## Detailed Issue Analysis

### 1. LogMetrics Interface Mismatches

**File:** `apps/web/lib/runtime/repositories/metrics.repository.ts`  
**Lines:** 52-56, 349-371

**Interface Definition:**
```typescript
export interface LogMetrics {
  readonly total_logs: number;
  readonly by_log_level: Record<string, number>;
}
```

**Code Issues:**

#### Issue 1.1: Missing Properties in Interface
**Location:** Lines 352-353
```typescript
const metrics: LogMetrics = {
  total_logs: logs.length,
  by_log_level: {},
  error_rate: 0,              // ❌ Property does not exist in LogMetrics
  logs_per_execution: 0,      // ❌ Property does not exist in LogMetrics
};
```

**Error:** Property 'error_rate' does not exist in type 'LogMetrics'  
**Error:** Property 'logs_per_execution' does not exist in type 'LogMetrics'

**Root Cause:** LogMetrics interface definition is incomplete. Code expects `error_rate` and `logs_per_execution` properties but they are not defined in the interface.

#### Issue 1.2: Readonly Property Assignment
**Location:** Line 359
```typescript
metrics.by_log_level[log.log_level] = (metrics.by_log_level[log.log_level] || 0) + 1;
```

**Error:** Cannot assign to 'by_log_level' because it is a read-only property

**Root Cause:** by_log_level is defined as readonly in the interface, but code attempts to mutate it.

#### Issue 1.3: Readonly Property Assignment
**Location:** Lines 366, 370
```typescript
metrics.error_rate = errorCount / logs.length;  // ❌ Readonly
metrics.logs_per_execution = logs.length / executions.length;  // ❌ Readonly
```

**Error:** Cannot assign to 'error_rate' because it is a read-only property  
**Error:** Cannot assign to 'logs_per_execution' because it is a read-only property

**Root Cause:** Properties are defined as readonly but code attempts to assign to them.

---

### 2. CostMetrics Interface Mismatches

**File:** `apps/web/lib/runtime/repositories/metrics.repository.ts`  
**Lines:** 71-76, 409-437

**Interface Definition:**
```typescript
export interface CostMetrics {
  total_cost: number;
  avg_cost_per_execution: number;
  cost_by_agent: Record<string, number>;
  cost_trend: 'increasing' | 'decreasing' | 'stable';
}
```

**Code Issues:**

#### Issue 2.1: Missing Properties in Interface
**Location:** Lines 412, 414
```typescript
const metrics: CostMetrics = {
  total_cost: 0,
  cost_by_agent: {},
  cost_by_workflow: {},        // ❌ Property does not exist in CostMetrics
  avg_cost_per_execution: 0,
  cost_trend: [],              // ❌ Type mismatch: array vs string literal
};
```

**Error:** Property 'cost_by_workflow' does not exist in type 'CostMetrics'  
**Error:** Type '{ date: string; cost: number; }[]' is not assignable to type '"increasing" | "decreasing" | "stable"'

**Root Cause:** 
- Interface missing `cost_by_workflow` property
- Interface expects `cost_trend` to be a string literal but code assigns an array

#### Issue 2.2: Readonly Property Assignment
**Location:** Lines 421-423
```typescript
metrics.total_cost += cost;
metrics.cost_by_agent[exec.agent_name] = (metrics.cost_by_agent[exec.agent_name] || 0) + cost;
metrics.cost_by_workflow[exec.workflow_type] = (metrics.cost_by_workflow[exec.workflow_type] || 0) + cost;
```

**Error:** Cannot assign to 'total_cost' because it is a read-only property (if it were readonly)  
**Error:** Cannot assign to 'cost_by_agent' because it is a read-only property (if it were readonly)  
**Error:** Cannot assign to 'cost_by_workflow' because it is a read-only property (if it were readonly)

**Root Cause:** Code mutates properties that should be immutable.

---

### 3. TokenMetrics Interface Mismatches

**File:** `apps/web/lib/runtime/repositories/metrics.repository.ts`  
**Lines:** 82-87, 473-495

**Interface Definition:**
```typescript
export interface TokenMetrics {
  readonly total_tokens: number;
  readonly tokens_by_agent: Record<string, number>;
  readonly tokens_by_workflow: Record<string, number>;
  readonly avg_tokens_per_execution: number;
  readonly token_efficiency: number;
}
```

**Code Issues:**

#### Issue 3.1: Readonly Property Assignment
**Location:** Lines 474-478
```typescript
const metrics: TokenMetrics = {
  total_tokens: 0,              // ❌ Readonly
  tokens_by_agent: {},         // ❌ Readonly
  tokens_by_workflow: {},      // ❌ Readonly
  avg_tokens_per_execution: 0, // ❌ Readonly
  token_efficiency: 0,          // ❌ Readonly
};
```

**Error:** Cannot assign to 'total_tokens' because it is a read-only property  
**Error:** Cannot assign to 'avg_tokens_per_execution' because it is a read-only property  
**Error:** Cannot assign to 'token_efficiency' because it is a read-only property

**Root Cause:** All properties are readonly but code attempts to assign to them.

#### Issue 3.2: Missing Properties in Interface
**Location:** Lines 484-485
```typescript
metrics.tokens_by_agent[exec.agent_name] = (metrics.tokens_by_agent[exec.agent_name] || 0) + tokens;
metrics.tokens_by_workflow[exec.workflow_type] = (metrics.tokens_by_workflow[exec.workflow_type] || 0) + tokens;
```

**Note:** Properties exist in interface but are readonly.

---

### 4. TaskMetrics Database Contract Mismatch

**File:** `apps/web/lib/runtime/repositories/metrics.repository.ts`  
**Lines:** 210-265

**Database Query:**
```typescript
const query = client
  .from('agent_tasks')
  .select('status, task_type, duration_ms')  // ❌ Missing started_at, completed_at
  .eq('tenant_id', this.tenantId);
```

**Code Issues:**

#### Issue 4.1: Accessing Non-Selected Fields
**Location:** Lines 240-243
```typescript
if (task.started_at && task.completed_at) {  // ❌ Fields not selected in query
  const duration = new Date(task.completed_at).getTime() - new Date(task.started_at).getTime();
  totalDuration += duration;
}
```

**Error:** Property 'started_at' does not exist on type '{ status: string; task_type: string; duration_ms: number }'  
**Error:** Property 'completed_at' does not exist on type '{ status: string; task_type: string; duration_ms: number }'

**Root Cause:** Query doesn't select `started_at` and `completed_at` fields but code attempts to access them.

---

### 5. Unknown Type Casting Issues

**File:** `apps/web/lib/runtime/repositories/metrics.repository.ts`  
**Multiple Locations**

**Code Issues:**

#### Issue 5.1: Unknown Type Without Cast
**Location:** Line 347-348
```typescript
const executions = execResult.data;  // ❌ Type is unknown
const logs = logResult.data;        // ❌ Type is unknown
```

**Error:** 'executions' is of type 'unknown'  
**Error:** 'logs' is of type 'unknown'

**Root Cause:** Db layer returns `Result<unknown, RuntimeDatabaseError>` but code doesn't cast to `any[]`.

#### Issue 5.2: Unknown Type Without Cast
**Location:** Line 408
```typescript
const executions = result.data;  // ❌ Type is unknown
```

**Error:** 'executions' is of type 'unknown'

**Root Cause:** Same as above.

#### Issue 5.3: Unknown Type Without Cast
**Location:** Line 472
```typescript
const executions = result.data;  // ❌ Type is unknown
```

**Error:** 'executions' is of type 'unknown'

**Root Cause:** Same as above.

#### Issue 5.4: Unknown Type Without Cast
**Location:** Line 529
```typescript
const executions = result.data;  // ❌ Type is unknown
```

**Error:** 'executions' is of type 'unknown'

**Root Cause:** Same as above.

#### Issue 5.5: Unknown Type Without Cast
**Location:** Line 586
```typescript
const executions = result.data;  // ❌ Type is unknown
```

**Error:** 'executions' is of type 'unknown'

**Root Cause:** Same as above.

---

### 6. FailureRateMetrics Database Contract Mismatch

**File:** `apps/web/lib/runtime/repositories/metrics.repository.ts`  
**Lines:** 500-552

**Database Query:**
```typescript
const query = client
  .from('agent_executions')
  .select('status, agent_name, workflow_type')  // ❌ Missing task_type
  .eq('tenant_id', this.tenantId);
```

**Code Issues:**

#### Issue 6.1: Accessing Non-Selected Fields
**Location:** Line 544
```typescript
metrics.failure_by_task_type[exec.task_type] = (metrics.failure_by_task_type[exec.task_type] || 0) + 1;
```

**Error:** Property 'task_type' does not exist on type '{ status: string; agent_name: string; workflow_type: string }'

**Root Cause:** Query doesn't select `task_type` field but code attempts to access it.

---

### 7. Duplicate executeQuery Helper

**File:** `apps/web/lib/runtime/repositories/metrics.repository.ts`  
**Lines:** 632-638

**Code:**
```typescript
async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: any
): Promise<Result<T, RuntimeDatabaseError>> {
  const { executeQuery } = require('../db');
  return executeQuery(queryFn, config);
}
```

**Issue:** This is a duplicate of the executeQuery function in `db/queries.ts`. It shadows the imported function and creates unnecessary code duplication.

**Root Cause:** Metrics repository doesn't extend BaseRepository and implements its own query helper.

---

## Summary of Issues

### By Category

| Category | Count | Severity |
|----------|-------|----------|
| Interface Property Mismatches | 4 | HIGH |
| Readonly Property Violations | 8 | HIGH |
| Database Contract Mismatches | 2 | HIGH |
| Unknown Type Casting | 5 | MEDIUM |
| Type Mismatches (Array vs String) | 1 | HIGH |
| Code Duplication | 1 | LOW |

### By Method

| Method | Issues |
|--------|--------|
| getLogMetrics | 4 |
| getCostMetrics | 3 |
| getTokenMetrics | 4 |
| getTaskMetrics | 1 |
| getFailureRateMetrics | 1 |
| getEventMetrics | 0 |
| getExecutionMetrics | 0 |
| getDurationMetrics | 0 |

---

## Root Cause Analysis

### Primary Root Cause

The metrics repository was implemented without:
1. **Proper interface design** - Metric interfaces don't match actual usage
2. **Database contract validation** - Queries don't select fields code expects
3. **Type safety enforcement** - Missing type casts for unknown types
4. **Immutability discipline** - Readonly properties mutated

### Secondary Root Causes

1. **No BaseRepository extension** - Metrics repository doesn't extend BaseRepository, missing shared functionality
2. **Duplicate query helper** - Implements its own executeQuery instead of using db layer
3. **Inconsistent metric design** - Different metrics have different property patterns (some readonly, some not)

---

## Recommended Fix Strategy

### 1. Fix Metric Interfaces

**LogMetrics:**
```typescript
export interface LogMetrics {
  readonly total_logs: number;
  readonly by_log_level: Record<string, number>;
  readonly error_rate: number;
  readonly logs_per_execution: number;
}
```

**CostMetrics:**
```typescript
export interface CostMetrics {
  readonly total_cost: number;
  readonly avg_cost_per_execution: number;
  readonly cost_by_agent: Record<string, number>;
  readonly cost_by_workflow: Record<string, number>;
  readonly cost_trend: Array<{ date: string; cost: number }>;
}
```

**TokenMetrics:**
```typescript
export interface TokenMetrics {
  readonly total_tokens: number;
  readonly tokens_by_agent: Record<string, number>;
  readonly tokens_by_workflow: Record<string, number>;
  readonly avg_tokens_per_execution: number;
  readonly token_efficiency: number;
}
```

### 2. Fix Database Queries

**TaskMetrics:**
```typescript
const query = client
  .from('agent_tasks')
  .select('status, task_type, duration_ms, started_at, completed_at')  // Add missing fields
  .eq('tenant_id', this.tenantId);
```

**FailureRateMetrics:**
```typescript
const query = client
  .from('agent_executions')
  .select('status, agent_name, workflow_type, task_type')  // Add task_type
  .eq('tenant_id', this.tenantId);
```

### 3. Fix Readonly Property Assignments

Use mutable variables for calculations, then cast to readonly at object creation:

```typescript
const by_log_level: Record<string, number> = {};
let error_rate = 0;
let logs_per_execution = 0;

// Calculate...

const metrics: LogMetrics = {
  total_logs: logs.length,
  by_log_level: by_log_level as Readonly<Record<string, number>>,
  error_rate,
  logs_per_execution,
};
```

### 4. Add Type Casts for Unknown Types

```typescript
const executions = result.data as any[];
const logs = logResult.data as any[];
```

### 5. Remove Duplicate executeQuery Helper

Import and use the executeQuery from db/queries.ts directly.

---

## Impact Assessment

### Build Impact
- **TypeScript Validation:** FAILS with 19+ errors
- **Production Build:** FAILS due to TypeScript errors

### Runtime Impact
- **Metrics Repository:** UNUSABLE due to type errors
- **Observability:** DEGRADED - metrics cannot be fetched
- **Dashboard:** BROKEN - metrics display will fail

### Data Integrity Impact
- **Unknown:** Runtime behavior unclear due to type errors preventing compilation

---

## Conclusion

The metrics.repository.ts has extensive interface mismatches, database contract violations, and type safety issues that prevent compilation. The root causes are:

1. Incomplete metric interface definitions
2. Database queries not selecting required fields
3. Readonly property violations
4. Missing type casts for unknown types
5. Code duplication with query helpers

These issues require systematic fixes to metric interfaces, database queries, and type handling to achieve a clean build and functional metrics repository.

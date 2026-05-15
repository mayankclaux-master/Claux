# Z14A18 State Machine Fix Report

**Phase:** Z14A.18 — STATE MACHINE EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first blocking TypeScript error in apps/web/lib/integrations/mesh/runtime/state-machine.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The state-machine.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property (1 occurrence)
- Missing required `tenant_id` field in EventInsert (1 occurrence)
- Type mismatch: ProviderExecutionStateTransition not assignable to Record<string, unknown>

**Pattern:** Same write-side contract mismatch as previously fixed files (dataforseo, gbp, gsc, openai, callbacks, core-provider-governance, observability, ampli-safety, provider-recovery-tests, publishing-recovery-tests, recovery-tests, recovery-validation, callback-reconstruction, runtime/index)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/runtime/state-machine.ts`

## Exact Fields Changed

### 1. Event Payload Property Name (1 occurrence)
- **Line 102:** `event_data: transition` → `payload: { ... }` (transitionState)
  - **Reason:** Canonical EventInsert interface uses `payload` property, not `event_data`

### 2. Missing Required Field (1 occurrence)
- **Line 99:** Added `tenant_id: tenantId` (transitionState)
  - **Reason:** Canonical EventInsert interface requires `tenant_id` as a mandatory field

### 3. Type Compatibility Fix (1 occurrence)
- **Line 103-112:** Explicitly constructed payload object from transition fields instead of direct assignment
  - **Reason:** ProviderExecutionStateTransition lacks index signature required by JSONPayload type
  - **Approach:** Explicitly spread transition fields into payload object to ensure type compatibility without casts

## Canonical Contract Reference

**Source:** `apps/web/lib/runtime/types/event.types.ts`

**Canonical EventInsert Interface:**
```typescript
export interface EventInsert {
  readonly tenant_id: UUID;           // REQUIRED
  readonly execution_id?: UUID | null;
  readonly event_name: string;
  readonly event_source: string;
  readonly payload?: JSONPayload;     // Correct property name
  readonly event_version?: string;
  readonly correlation_id?: string | null;
  readonly causation_id?: string | null;
}
```

## Imports Validation

**Status:** ✅ NO IMPORT CHANGES REQUIRED

The file imports RuntimeService from '@/lib/runtime/services/runtime.service' which handles type imports internally. No direct EventInsert imports to fix.

## TypeScript Validation

**Build Status:** state-machine.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 13.5s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/security/multi-tenant-validation.ts:96:9
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/security/multi-tenant-validation.ts`  
**Line:** 96  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: { tenantId, testType: 'tenant_dispatch_isolation' },
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The multi-tenant-validation.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (state-machine.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 3 (1 event_data → payload, 1 tenant_id addition, 1 type compatibility fix)
- **Methods Fixed:** 1 (transitionState)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **state-machine.ts Status:** ✅ FIXED
- **Next Blocker:** multi-tenant-validation.ts:96 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

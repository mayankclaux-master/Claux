# Z14A17 Runtime Index Fix Report

**Phase:** Z14A.17 — RUNTIME INDEX EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first blocking TypeScript error in apps/web/lib/integrations/mesh/runtime/index.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The runtime/index.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property (3 occurrences)
- Missing required `tenant_id` field in EventInsert (3 occurrences)

**Pattern:** Same write-side contract mismatch as previously fixed files (dataforseo, gbp, gsc, openai, callbacks, core-provider-governance, observability, ampli-safety, provider-recovery-tests, publishing-recovery-tests, recovery-tests, recovery-validation, callback-reconstruction)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/runtime/index.ts`

## Exact Fields Changed

### 1. Event Payload Property Name (3 occurrences)
- **Line 37:** `event_data` → `payload` (emitDispatchEvent)
- **Line 56:** `event_data` → `payload` (emitCompletionEvent)
- **Line 75:** `event_data` → `payload` (emitFailureEvent)

### 2. Missing Required Field (3 occurrences)
- **Line 34:** Added `tenant_id: request.tenantId` (emitDispatchEvent)
- **Line 54:** Added `tenant_id: request.tenantId` (emitCompletionEvent)
- **Line 74:** Added `tenant_id: request.tenantId` (emitFailureEvent)

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

**Build Status:** runtime/index.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 13.0s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/runtime/state-machine.ts:102:7
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/runtime/state-machine.ts`  
**Line:** 102  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: transition,
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The state-machine.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (runtime/index.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 6 (3 event_data → payload, 3 tenant_id additions)
- **Methods Fixed:** 3 (emitDispatchEvent, emitCompletionEvent, emitFailureEvent)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **runtime/index.ts Status:** ✅ FIXED
- **Next Blocker:** state-machine.ts:102 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

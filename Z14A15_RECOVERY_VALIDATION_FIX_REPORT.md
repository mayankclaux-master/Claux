# Z14A15 Recovery Validation Fix Report

**Phase:** Z14A.15 — RECOVERY VALIDATION EVENT READ CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first blocking TypeScript error in apps/web/lib/integrations/mesh/recovery/recovery-validation.ts by restoring canonical Event contract compatibility.

## Root Cause

**Exact Root Cause:** The recovery-validation.ts was using obsolete event property names that don't match the canonical Event interface from the modular runtime type system.

**Details:**
- Read-side: Used `event_data` instead of canonical `payload` property (1 occurrence)
- Write-side: Used `event_data` instead of canonical `payload` property (1 occurrence)
- Write-side: Missing required `tenant_id` field in EventInsert (1 occurrence)

**Pattern:** Mixed read-side and write-side contract mismatch. Read-side accesses Event type, write-side uses EventInsert type.

## Files Touched

**File:** `apps/web/lib/integrations/mesh/recovery/recovery-validation.ts`

## Exact Fields Changed

### 1. Read-Side Event Property Access (1 occurrence)
- **Line 92:** `lastEvent.event_data?.state` → `lastEvent.payload?.state` (validateWorkerRestartRecovery)
  - **Reason:** Canonical Event type uses `payload` property, not `event_data`

### 2. Write-Side Event Payload Property Name (1 occurrence)
- **Line 163:** `event_data` → `payload` (executeRecovery)
  - **Reason:** Canonical EventInsert interface uses `payload` property, not `event_data`

### 3. Write-Side Missing Required Field (1 occurrence)
- **Line 158:** Added `tenantId` parameter to executeRecovery method signature
- **Line 160:** Added `tenant_id: tenantId` to event object
  - **Reason:** Canonical EventInsert interface requires `tenant_id` as a mandatory field

## Canonical Contract Reference

**Source:** `apps/web/lib/runtime/types/event.types.ts`

**Canonical Event Interface (read-side):**
```typescript
export interface Event {
  readonly id: UUID;
  readonly tenant_id: UUID;
  readonly execution_id?: UUID | null;
  readonly event_name: string;
  readonly event_source: string;
  readonly payload?: JSONPayload;     // Correct property name
  readonly event_version?: string;
  readonly correlation_id?: string | null;
  readonly causation_id?: string | null;
  readonly created_at: ISODateTime;
  readonly updated_at: ISODateTime;
}
```

**Canonical EventInsert Interface (write-side):**
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

The file imports RuntimeService from '@/lib/runtime/services/runtime.service' which handles type imports internally. No direct Event or EventInsert imports to fix.

## TypeScript Validation

**Build Status:** recovery-validation.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 12.6s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/runtime/callback-reconstruction.ts:86:7
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/runtime/callback-reconstruction.ts`  
**Line:** 86  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: {
  taskId: context.taskId,
  agentName: context.agentName,
  callbackResult,
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous write-side fixes)

**Reason:** The callback-reconstruction.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (recovery-validation.ts)
- **Root Cause:** Obsolete event property names (both read-side and write-side)
- **Fields Fixed:** 3 (1 read-side event_data → payload, 1 write-side event_data → payload, 1 tenant_id addition)
- **Methods Fixed:** 2 (validateWorkerRestartRecovery, executeRecovery)
- **Canonical Contract:** Event (read-side) and EventInsert (write-side) from types/event.types.ts
- **Import Changes:** None (not required)
- **recovery-validation.ts Status:** ✅ FIXED
- **Next Blocker:** callback-reconstruction.ts:86 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

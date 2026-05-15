# Z14A8 Callbacks Index Fix Report

**Phase:** Z14A.8 — CALLBACKS INDEX EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the next blocking TypeScript error in lib/integrations/mesh/callbacks/index.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The callbacks/index.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property
- Missing required `tenant_id` field in EventInsert

**Pattern:** Same contract mismatch as provider dispatch routes (dataforseo, gbp, gsc, openai)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/callbacks/index.ts`

## Exact Lines Changed

**Lines 125-135 (continueExecution method):**

**Before:**
```typescript
await this.runtime.event.publishEvent({
  execution_id: callback.executionId,
  event_name: 'integration_callback',
  event_source: 'integration_mesh',
  event_data: {
    provider: callback.provider,
    correlationId: callback.correlationId,
    payload: callback.payload,
  },
});
```

**After:**
```typescript
await this.runtime.event.publishEvent({
  tenant_id: callback.tenantId,
  execution_id: callback.executionId,
  event_name: 'integration_callback',
  event_source: 'integration_mesh',
  payload: {
    provider: callback.provider,
    correlationId: callback.correlationId,
    payload: callback.payload,
  },
});
```

## Fields Fixed

### 1. Event Payload Property Name
- **Line 129:** `event_data` → `payload`

### 2. Missing Required Field
- **Line 126:** Added `tenant_id: callback.tenantId`

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

The file does not directly import EventInsert or other runtime types. It uses RuntimeService which handles type imports internally.

## TypeScript Validation

**Build Status:** callbacks/index.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 11.7s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/governance/core-provider-governance.ts:48:7
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/governance/core-provider-governance.ts`  
**Line:** 48  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: {
  provider,
  cooldownUntil,
  tenantId,
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The core-provider-governance.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (callbacks/index.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 2 (event_data → payload, added tenant_id)
- **Lines Changed:** 125-135
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **callbacks/index.ts Status:** ✅ FIXED
- **Next Blocker:** core-provider-governance.ts:48 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

# Z14A7 OpenAI Route Fix Report

**Phase:** Z14A.7 — OPENAI ROUTE CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first failing build blocker in apps/web/app/api/integrations/dispatch/openai/route.ts by restoring canonical contract compatibility.

## Root Cause

**Exact Root Cause:** The openai/route.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property
- Missing required `tenant_id` field in EventInsert

**Pattern:** Same contract mismatch as dataforseo/route.ts (Z14A.4), gbp/route.ts (Z14A.5), and gsc/route.ts (Z14A.6)

## Files Touched

**File:** `apps/web/app/api/integrations/dispatch/openai/route.ts`

## Exact Fields Fixed

### 1. Event Payload Property Name

**Before (Line 117):**
```typescript
event_data: {
  provider: 'openai',
  success: result.success,
  tenantId,
}
```

**After (Line 118):**
```typescript
payload: {
  provider: 'openai',
  success: result.success,
  tenantId,
}
```

**Reason:** Canonical EventInsert interface uses `payload` (JSONPayload type), not `event_data`.

### 2. Missing Required Field

**Before (Lines 113-122):**
```typescript
await runtime.event.publishEvent({
  execution_id: executionId,
  event_name: result.success ? 'provider_dispatched' : 'provider_dispatch_failed',
  event_source: 'openai',
  event_data: { ... },
});
```

**After (Lines 113-123):**
```typescript
await runtime.event.publishEvent({
  tenant_id: tenantId,
  execution_id: executionId,
  event_name: result.success ? 'provider_dispatched' : 'provider_dispatch_failed',
  event_source: 'openai',
  payload: { ... },
});
```

**Reason:** Canonical EventInsert interface requires `tenant_id` as a mandatory field for tenant isolation.

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

## Validation

**Build Status:** openai/route.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 16.0s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/callbacks/index.ts:129:7
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/callbacks/index.ts`  
**Line:** 129  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: {
  provider: callback.provider,
  correlationId: callback.correlationId,
  payload: callback.payload,
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as provider dispatch routes)

**Reason:** The callbacks/index.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (openai/route.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 2 (event_data → payload, added tenant_id)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **openai/route.ts Status:** ✅ FIXED
- **Next Blocker:** lib/integrations/mesh/callbacks/index.ts:129 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

# Z14A4 DataForSEO Route Fix Report

**Phase:** Z14A.4 — DATAFORSEO ROUTE CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the first failing build blocker in apps/web/app/api/integrations/dispatch/dataforseo/route.ts by restoring canonical contract compatibility.

## Root Cause

**Exact Root Cause:** The dataforseo/route.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property
- Missing required `tenant_id` field in EventInsert

## Files Touched

**File:** `apps/web/app/api/integrations/dispatch/dataforseo/route.ts`

## Exact Fields Fixed

### 1. Event Payload Property Name

**Before (Line 128):**
```typescript
event_data: {
  provider: 'dataforseo',
  success: result.success,
  tenantId,
}
```

**After (Line 129):**
```typescript
payload: {
  provider: 'dataforseo',
  success: result.success,
  tenantId,
}
```

**Reason:** Canonical EventInsert interface uses `payload` (JSONPayload type), not `event_data`.

### 2. Missing Required Field

**Before (Lines 124-133):**
```typescript
await runtime.event.publishEvent({
  execution_id: executionId,
  event_name: result.success ? 'provider_dispatched' : 'provider_dispatch_failed',
  event_source: 'dataforseo',
  payload: { ... },
});
```

**After (Lines 124-134):**
```typescript
await runtime.event.publishEvent({
  tenant_id: tenantId,
  execution_id: executionId,
  event_name: result.success ? 'provider_dispatched' : 'provider_dispatch_failed',
  event_source: 'dataforseo',
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

**Build Status:** dataforseo/route.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 18.6s
Running TypeScript ...Failed to type check.

./app/api/integrations/dispatch/gbp/route.ts:128:7
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/app/api/integrations/dispatch/gbp/route.ts`  
**Line:** 128  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: {
  provider: 'gbp',
  success: result.success,
  tenantId,
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as dataforseo)

**Reason:** The gbp/route.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (dataforseo/route.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 2 (event_data → payload, added tenant_id)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **dataforseo/route.ts Status:** ✅ FIXED
- **Next Blocker:** gbp/route.ts:128 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

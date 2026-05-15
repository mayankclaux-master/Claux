# Z14A10 Observability Fix Report

**Phase:** Z14A.10 — OBSERVABILITY EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first blocking TypeScript error in apps/web/lib/integrations/mesh/observability/index.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The observability/index.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property (5 occurrences)
- Missing required `tenant_id` field in EventInsert (5 occurrences)

**Pattern:** Same contract mismatch as previously fixed files (dataforseo, gbp, gsc, openai, callbacks, core-provider-governance)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/observability/index.ts`

## Exact Fields Changed

### 1. Event Payload Property Name (5 occurrences)
- **Line 24:** `event_data` → `payload` (recordOutboundRequest)
- **Line 33:** `event_data` → `payload` (recordWebhookReceipt)
- **Line 42:** `event_data` → `payload` (recordRetry)
- **Line 51:** `event_data` → `payload` (recordProviderFailure)
- **Line 60:** `event_data` → `payload` (recordCooldown)
- **Line 78:** `event_data` → `payload` (recordExecutionContinuation)

### 2. Missing Required Field (5 occurrences)
- **Line 21:** Added `tenant_id: request.tenantId` (recordOutboundRequest)
- **Line 31:** Added `tenant_id: tenantId` (recordWebhookReceipt)
- **Line 41:** Added `tenant_id: request.tenantId` (recordRetry)
- **Line 49:** Added `tenantId` parameter to method signature and `tenant_id: tenantId` to event object (recordProviderFailure)
- **Line 59:** Added `tenantId` parameter to method signature and `tenant_id: tenantId` to event object (recordCooldown)
- **Line 80:** Added `tenant_id: tenantId` (recordExecutionContinuation)

### 3. Method Signature Changes (2 occurrences)
- **recordProviderFailure:** Added `tenantId: string` parameter
- **recordCooldown:** Added `tenantId: string` parameter

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

**Build Status:** observability/index.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 10.9s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/publishing/ampli-safety.ts:76:7
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/publishing/ampli-safety.ts`  
**Line:** 76  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: {
  platform: request.platform,
  contentId: request.contentId,
  tenantId: request.tenantId,
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The publishing/ampli-safety.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (observability/index.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 11 (5 event_data → payload, 5 tenant_id additions, 2 method signature changes)
- **Methods Fixed:** 5 (all observability event methods)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **observability/index.ts Status:** ✅ FIXED
- **Next Blocker:** publishing/ampli-safety.ts:76 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

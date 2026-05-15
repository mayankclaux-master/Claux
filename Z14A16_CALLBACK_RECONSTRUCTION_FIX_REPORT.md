# Z14A16 Callback Reconstruction Fix Report

**Phase:** Z14A.16 — CALLBACK RECONSTRUCTION EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first blocking TypeScript error in apps/web/lib/integrations/mesh/runtime/callback-reconstruction.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The callback-reconstruction.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property (2 occurrences)
- Missing required `tenant_id` field in EventInsert (2 occurrences)

**Pattern:** Same write-side contract mismatch as previously fixed files (dataforseo, gbp, gsc, openai, callbacks, core-provider-governance, observability, ampli-safety, provider-recovery-tests, publishing-recovery-tests, recovery-tests, recovery-validation)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/runtime/callback-reconstruction.ts`

## Exact Fields Changed

### 1. Event Payload Property Name (2 occurrences)
- **Line 86:** `event_data` → `payload` (resumeTaskExecution)
- **Line 120:** `event_data` → `payload` (attachArtifacts)

### 2. Missing Required Field (2 occurrences)
- **Line 83:** Added `tenant_id: context.tenantId` (resumeTaskExecution)
- **Line 118:** Added `tenant_id: context.tenantId` (attachArtifacts)

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

**Build Status:** callback-reconstruction.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 11.8s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/runtime/index.ts:37:7
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/runtime/index.ts`  
**Line:** 37  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: {
  provider: request.provider,
  action: request.action,
  correlationId: request.correlationId,
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The runtime/index.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (callback-reconstruction.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 4 (2 event_data → payload, 2 tenant_id additions)
- **Methods Fixed:** 2 (resumeTaskExecution, attachArtifacts)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **callback-reconstruction.ts Status:** ✅ FIXED
- **Next Blocker:** runtime/index.ts:37 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

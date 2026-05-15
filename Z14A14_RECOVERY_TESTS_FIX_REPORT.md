# Z14A14 Recovery Tests Fix Report

**Phase:** Z14A.14 — RECOVERY TESTS EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first blocking TypeScript error in apps/web/lib/integrations/mesh/recovery/recovery-tests.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The recovery-tests.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property (7 occurrences)
- Missing required `tenant_id` field in EventInsert (7 occurrences)

**Pattern:** Same contract mismatch as previously fixed files (dataforseo, gbp, gsc, openai, callbacks, core-provider-governance, observability, ampli-safety, provider-recovery-tests, publishing-recovery-tests)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/recovery/recovery-tests.ts`

## Exact Fields Changed

### 1. Event Payload Property Name (7 occurrences)
- **Line 56:** `event_data` → `payload` (testCallbackTimeoutRecovery)
- **Line 111:** `event_data` → `payload` (testWorkerRestartRecovery)
- **Line 166:** `event_data` → `payload` (testN8nOutageRecovery)
- **Line 221:** `event_data` → `payload` (testRetryContinuation)
- **Line 276:** `event_data` → `payload` (testReplayContinuation)
- **Line 331:** `event_data` → `payload` (testCheckpointRestoration)
- **Line 379:** `event_data` → `payload` (testDuplicateCallbackHandling)

### 2. Missing Required Field (7 occurrences)
- **Line 53:** Added `tenant_id: tenantId` (testCallbackTimeoutRecovery)
- **Line 109:** Added `tenant_id: tenantId` (testWorkerRestartRecovery)
- **Line 165:** Added `tenant_id: tenantId` (testN8nOutageRecovery)
- **Line 221:** Added `tenant_id: tenantId` (testRetryContinuation)
- **Line 277:** Added `tenant_id: tenantId` (testReplayContinuation)
- **Line 333:** Added `tenant_id: tenantId` (testCheckpointRestoration)
- **Line 382:** Added `tenant_id: tenantId` (testDuplicateCallbackHandling)

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

**Build Status:** recovery-tests.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 14.5s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/recovery/recovery-validation.ts:92:64
Type error: Property 'event_data' does not exist on type 'Event'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/recovery/recovery-validation.ts`  
**Line:** 92  
**Error:**
```
Type error: Property 'event_data' does not exist on type 'Event'.
```

**Context:**
```typescript
const isRecoverable = recoverableStates.includes(lastEvent.event_data?.state as string);
```

**Classification:** DIFFERENT PATTERN - Event type property access

**Reason:** The recovery-validation.ts is reading from an existing Event type (not EventInsert) using obsolete `event_data` property. This is a read operation, not a write operation.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (recovery-tests.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 14 (7 event_data → payload, 7 tenant_id additions)
- **Methods Fixed:** 7 (testCallbackTimeoutRecovery, testWorkerRestartRecovery, testN8nOutageRecovery, testRetryContinuation, testReplayContinuation, testCheckpointRestoration, testDuplicateCallbackHandling)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **recovery-tests.ts Status:** ✅ FIXED
- **Next Blocker:** recovery-validation.ts:92 (different pattern - reading event_data from Event type)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

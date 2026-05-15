# Z14A12 Provider Recovery Tests Fix Report

**Phase:** Z14A.12 — PROVIDER RECOVERY TESTS EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first blocking TypeScript error in apps/web/lib/integrations/mesh/recovery/provider-recovery-tests.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The provider-recovery-tests.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property (7 occurrences)
- Missing required `tenant_id` field in EventInsert (7 occurrences)

**Pattern:** Same contract mismatch as previously fixed files (dataforseo, gbp, gsc, openai, callbacks, core-provider-governance, observability, ampli-safety)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/recovery/provider-recovery-tests.ts`

## Exact Fields Changed

### 1. Event Payload Property Name (7 occurrences)
- **Line 34:** `event_data` → `payload` (testDataForSEOTimeoutRecovery)
- **Line 86:** `event_data` → `payload` (testGSCTimeoutRecovery)
- **Line 138:** `event_data` → `payload` (testGBPTImeoutRecovery)
- **Line 190:** `event_data` → `payload` (testCallbackReplayRecovery)
- **Line 242:** `event_data` → `payload` (testWorkerRestartRecovery)
- **Line 293:** `event_data` → `payload` (testN8nOutageRecovery)
- **Line 344:** `event_data` → `payload` (testExecutionContinuationRecovery)

### 2. Missing Required Field (7 occurrences)
- **Line 31:** Added `tenant_id: this.tenantId` (testDataForSEOTimeoutRecovery)
- **Line 84:** Added `tenant_id: this.tenantId` (testGSCTimeoutRecovery)
- **Line 137:** Added `tenant_id: this.tenantId` (testGBPTImeoutRecovery)
- **Line 190:** Added `tenant_id: this.tenantId` (testCallbackReplayRecovery)
- **Line 243:** Added `tenant_id: this.tenantId` (testWorkerRestartRecovery)
- **Line 295:** Added `tenant_id: this.tenantId` (testN8nOutageRecovery)
- **Line 347:** Added `tenant_id: this.tenantId` (testExecutionContinuationRecovery)

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

**Build Status:** provider-recovery-tests.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 14.1s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/recovery/publishing-recovery-tests.ts:48:11
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/recovery/publishing-recovery-tests.ts`  
**Line:** 48  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: { testType }
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The publishing-recovery-tests.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (provider-recovery-tests.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 14 (7 event_data → payload, 7 tenant_id additions)
- **Methods Fixed:** 7 (testDataForSEOTimeoutRecovery, testGSCTimeoutRecovery, testGBPTImeoutRecovery, testCallbackReplayRecovery, testWorkerRestartRecovery, testN8nOutageRecovery, testExecutionContinuationRecovery)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **provider-recovery-tests.ts Status:** ✅ FIXED
- **Next Blocker:** publishing-recovery-tests.ts:48 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

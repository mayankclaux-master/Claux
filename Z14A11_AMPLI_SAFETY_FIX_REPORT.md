# Z14A11 AMPLI Safety Fix Report

**Phase:** Z14A.11 — AMPLI SAFETY EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first blocking TypeScript error in apps/web/lib/integrations/mesh/publishing/ampli-safety.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The ampli-safety.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property (5 occurrences)
- Missing required `tenant_id` field in EventInsert (5 occurrences)

**Pattern:** Same contract mismatch as previously fixed files (dataforseo, gbp, gsc, openai, callbacks, core-provider-governance, observability)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/publishing/ampli-safety.ts`

## Exact Fields Changed

### 1. Event Payload Property Name (5 occurrences)
- **Line 76:** `event_data` → `payload` (requestApproval)
- **Line 99:** `event_data` → `payload` (approvePublish)
- **Line 122:** `event_data` → `payload` (rejectPublish)
- **Line 139:** `event_data` → `payload` (executeRollback)
- **Line 156:** `event_data` → `payload` (executePartialRecovery)

### 2. Missing Required Field (5 occurrences)
- **Line 73:** Added `tenant_id: request.tenantId` (requestApproval)
- **Line 97:** Added `tenant_id: request.tenantId` (approvePublish)
- **Line 121:** Added `tenant_id: request.tenantId` (rejectPublish)
- **Line 139:** Added `tenant_id: tenantId` (executeRollback)
- **Line 157:** Added `tenant_id: tenantId` (executePartialRecovery)

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

**Build Status:** ampli-safety.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 12.2s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/recovery/provider-recovery-tests.ts:34:9
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/recovery/provider-recovery-tests.ts`  
**Line:** 34  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: { provider: 'dataforseo', testType: 'timeout_recovery' }
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The provider-recovery-tests.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (ampli-safety.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 10 (5 event_data → payload, 5 tenant_id additions)
- **Methods Fixed:** 5 (requestApproval, approvePublish, rejectPublish, executeRollback, executePartialRecovery)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **ampli-safety.ts Status:** ✅ FIXED
- **Next Blocker:** provider-recovery-tests.ts:34 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

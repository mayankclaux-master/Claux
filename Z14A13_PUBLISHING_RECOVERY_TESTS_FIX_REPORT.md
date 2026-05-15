# Z14A13 Publishing Recovery Tests Fix Report

**Phase:** Z14A.13 — PUBLISHING RECOVERY TESTS EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix ONLY the current first blocking TypeScript error in apps/web/lib/integrations/mesh/recovery/publishing-recovery-tests.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The publishing-recovery-tests.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property (1 occurrence)
- Missing required `tenant_id` field in EventInsert (1 occurrence)

**Pattern:** Same contract mismatch as previously fixed files (dataforseo, gbp, gsc, openai, callbacks, core-provider-governance, observability, ampli-safety, provider-recovery-tests)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/recovery/publishing-recovery-tests.ts`

## Exact Fields Changed

### 1. Event Payload Property Name (1 occurrence)
- **Line 48:** `event_data` → `payload` (runAllTests method)

### 2. Missing Required Field (1 occurrence)
- **Line 45:** Added `tenant_id: this.tenantId` (runAllTests method)

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

**Build Status:** publishing-recovery-tests.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 13.2s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/recovery/recovery-tests.ts:56:9
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/recovery/recovery-tests.ts`  
**Line:** 56  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: { testType: 'callback_timeout' }
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The recovery-tests.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (publishing-recovery-tests.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 2 (1 event_data → payload, 1 tenant_id addition)
- **Methods Fixed:** 1 (runAllTests)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **publishing-recovery-tests.ts Status:** ✅ FIXED
- **Next Blocker:** recovery-tests.ts:56 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

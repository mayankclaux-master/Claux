# Z14A9 Core Provider Governance Fix Report

**Phase:** Z14A.9 — CORE PROVIDER GOVERNANCE EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Objective

Fix the next blocking TypeScript error in apps/web/lib/integrations/mesh/governance/core-provider-governance.ts by restoring canonical EventInsert contract compatibility.

## Root Cause

**Exact Root Cause:** The core-provider-governance.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

**Details:**
- Used `event_data` instead of canonical `payload` property (7 occurrences)
- Missing required `tenant_id` field in EventInsert (7 occurrences)

**Pattern:** Same contract mismatch as previously fixed files (dataforseo, gbp, gsc, openai, callbacks)

## Files Touched

**File:** `apps/web/lib/integrations/mesh/governance/core-provider-governance.ts`

## Fields Fixed

### 1. Event Payload Property Name (7 occurrences)
- **Line 48:** `event_data` → `payload` (handleProviderCooldown)
- **Line 80:** `event_data` → `payload` (handleRetryEscalation)
- **Line 102:** `event_data` → `payload` (handleProviderFailure)
- **Line 134:** `event_data` → `payload` (handleProviderQuarantine)
- **Line 158:** `event_data` → `payload` (handleDeadLetterExecution)
- **Line 182:** `event_data` → `payload` (handleAnomalyEscalation)
- **Line 206:** `event_data` → `payload` (handleSaturationIntervention)

### 2. Missing Required Field (7 occurrences)
- **Line 45:** Added `tenant_id: tenantId` (handleProviderCooldown)
- **Line 78:** Added `tenant_id: tenantId` (handleRetryEscalation)
- **Line 101:** Added `tenant_id: tenantId` (handleProviderFailure)
- **Line 134:** Added `tenant_id: tenantId` (handleProviderQuarantine)
- **Line 159:** Added `tenant_id: tenantId` (handleDeadLetterExecution)
- **Line 184:** Added `tenant_id: tenantId` (handleAnomalyEscalation)
- **Line 209:** Added `tenant_id: tenantId` (handleSaturationIntervention)

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

**Build Status:** core-provider-governance.ts no longer the build blocker

**Next Build Output:**
```
✓ Compiled successfully in 16.1s
Running TypeScript ...Failed to type check.

./lib/integrations/mesh/observability/index.ts:24:7
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

## NEXT First Blocker

**File:** `apps/web/lib/integrations/mesh/observability/index.ts`  
**Line:** 24  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: { provider: request.provider, action: request.action }
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The observability/index.ts has the same issue - using `event_data` instead of canonical `payload` property.

**Impact:** Build-time error only, not runtime critical.

## Summary

- **Files Touched:** 1 (core-provider-governance.ts)
- **Root Cause:** Obsolete event payload property names
- **Fields Fixed:** 14 (7 event_data → payload, 7 tenant_id additions)
- **Methods Fixed:** 7 (all governance event methods)
- **Canonical Contract:** EventInsert from types/event.types.ts
- **Import Changes:** None (not required)
- **core-provider-governance.ts Status:** ✅ FIXED
- **Next Blocker:** observability/index.ts:24 (same pattern - event_data → payload)

**Status:** COMPLETE - DO NOT FIX NEXT BLOCKER

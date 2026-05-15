# Z14A25 Incident System Fix Report

**Phase:** Z14A.25 — INCIDENT SYSTEM EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Root Cause

The incident-system.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

## Exact Fields Changed

### 1. Event Payload Property Name (1 occurrence)
- **Line 89:** `event_data` → `payload` (createIncident)

### 2. Missing Required Field (1 occurrence)
- **Line 86:** Added `tenant_id: 'system'` (createIncident)

## Methods Fixed Count

1 method fixed (createIncident)

## Canonical Contract Used

EventInsert from types/event.types.ts

## File Status

✅ FIXED

## Next First Blocker

**File:** `apps/web/lib/runtime/operations/operations-toolkit.ts`  
**Line:** 13  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: { executionId }
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The operations-toolkit.ts has the same issue - using `event_data` instead of canonical `payload` property.

## Report Generated

Z14A25_INCIDENT_SYSTEM_FIX_REPORT.md

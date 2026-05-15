# Z14A21 Publishing Callback Validation Fix Report

**Phase:** Z14A.21 — PUBLISHING CALLBACK VALIDATION EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Root Cause

The publishing-callback-validation.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

## Exact Fields Changed

### 1. Event Payload Property Name (7 occurrences)
- **Line 54:** `event_data` → `payload` (testCMSCallbackContinuation)
- **Line 113:** `event_data` → `payload` (testOpenAICallbackContinuation)
- **Line 172:** `event_data` → `payload` (testStaleCallbackRejection)
- **Line 216:** `event_data` → `payload` (testDuplicateCallbackRejection)
- **Line 260:** `event_data` → `payload` (testReplaySafeContinuation)
- **Line 303:** `event_data` → `payload` (testTenantSafeCallbackRestoration)
- **Line 346:** `event_data` → `payload` (testExecutionCheckpointRestoration)

### 2. Missing Required Field (7 occurrences)
- **Line 51:** Added `tenant_id: this.tenantId` (testCMSCallbackContinuation)
- **Line 111:** Added `tenant_id: this.tenantId` (testOpenAICallbackContinuation)
- **Line 171:** Added `tenant_id: this.tenantId` (testStaleCallbackRejection)
- **Line 216:** Added `tenant_id: this.tenantId` (testDuplicateCallbackRejection)
- **Line 261:** Added `tenant_id: this.tenantId` (testReplaySafeContinuation)
- **Line 305:** Added `tenant_id: this.tenantId` (testTenantSafeCallbackRestoration)
- **Line 349:** Added `tenant_id: this.tenantId` (testExecutionCheckpointRestoration)

## Methods Fixed Count

7 methods fixed (testCMSCallbackContinuation, testOpenAICallbackContinuation, testStaleCallbackRejection, testDuplicateCallbackRejection, testReplaySafeContinuation, testTenantSafeCallbackRestoration, testExecutionCheckpointRestoration)

## Canonical Contract Used

EventInsert from types/event.types.ts

## File Status

✅ FIXED

## Next First Blocker

**File:** `apps/web/lib/runtime/deployment/deployment-guard.ts`  
**Line:** 49  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: { timestamp: new Date().toISOString() },
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The deployment-guard.ts has the same issue - using `event_data` instead of canonical `payload` property.

## Report Generated

Z14A21_PUBLISHING_CALLBACK_VALIDATION_FIX_REPORT.md

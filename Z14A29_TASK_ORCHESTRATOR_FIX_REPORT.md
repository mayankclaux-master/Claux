# Z14A29 Task Orchestrator Fix Report

**Phase:** Z14A.29 — TASK ORCHESTRATOR EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Root Cause

The task-orchestrator.ts was using invalid EventInsert properties and obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

## Exact Fields Changed

### 1. Event Payload Property Name (7 occurrences)
- **Line 65:** `event_payload` → `payload` (createTask)
- **Line 121:** `event_payload` → `payload` (createTaskBatch)
- **Line 150:** `event_payload` → `payload` (startTask)
- **Line 183:** `event_payload` → `payload` (completeTask)
- **Line 226:** `event_payload` → `payload` (failTask)
- **Line 265:** `event_payload` → `payload` (retryTask)
- **Line 295:** `event_payload` → `payload` (skipTask)

### 2. Invalid Property Removed (6 occurrences)
- **Line 61:** Removed `task_id` from createTask (moved to payload as taskId)
- **Line 146:** Removed `task_id` from startTask (moved to payload as taskId)
- **Line 179:** Removed `task_id` from completeTask (moved to payload as taskId)
- **Line 222:** Removed `task_id` from failTask (moved to payload as taskId)
- **Line 261:** Removed `task_id` from retryTask (moved to payload as taskId)
- **Line 291:** Removed `task_id` from skipTask (moved to payload as taskId)

### 3. Missing Required Field (7 occurrences)
- **Line 60:** Added `tenant_id: this.config.tenantId` (createTask)
- **Line 117:** Added `tenant_id: this.config.tenantId` (createTaskBatch)
- **Line 146:** Added `tenant_id: this.config.tenantId` (startTask)
- **Line 179:** Added `tenant_id: this.config.tenantId` (completeTask)
- **Line 222:** Added `tenant_id: this.config.tenantId` (failTask)
- **Line 261:** Added `tenant_id: this.config.tenantId` (retryTask)
- **Line 291:** Added `tenant_id: this.config.tenantId` (skipTask)

### 4. Task Identity Preservation
Task IDs moved from invalid `task_id` field into canonical `payload` object to preserve operational requirements while maintaining contract compliance.

## Methods Fixed Count

7 methods fixed (createTask, createTaskBatch, startTask, completeTask, failTask, retryTask, skipTask)

## Canonical Contract Used

EventInsert from types/event.types.ts

## File Status

✅ FIXED

## Next First Blocker

**File:** `apps/web/lib/runtime/production/environment-validator.ts`  
**Line:** 48  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_data' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_data: {
  total: results.length,
  passed: results.filter(r => r.valid).length,
  failed: results.filter(r => !r.valid).length,
```

**Classification:** LOCAL TYPING MISMATCH (same pattern as previous fixes)

**Reason:** The environment-validator.ts uses `event_data` instead of canonical `payload` property.

## Report Generated

Z14A29_TASK_ORCHESTRATOR_FIX_REPORT.md

# Z14A27 Event Orchestrator Fix Report

**Phase:** Z14A.27 — EVENT ORCHESTRATOR EVENT CONTRACT FIX  
**Date:** 2025-05-13  
**Status:** COMPLETE

## Root Cause

The event-orchestrator.ts was using obsolete event payload property names that don't match the canonical EventInsert interface from the modular runtime type system.

## Exact Fields Changed

### 1. Event Payload Property Name (8 occurrences)
- **Line 70:** `event_payload` → `payload` (publishExecutionStarted)
- **Line 97:** `event_payload` → `payload` (publishExecutionCompleted)
- **Line 124:** `event_payload` → `payload` (publishExecutionFailed)
- **Line 152:** `event_payload` → `payload` (publishTaskStarted)
- **Line 181:** `event_payload` → `payload` (publishTaskCompleted)
- **Line 210:** `event_payload` → `payload` (publishTaskFailed)
- **Line 238:** `event_payload` → `payload` (publishSystemEvent)
- **Line 266:** `event_payload` → `payload` (publishRecoveryEvent)
- **Line 295:** `event_payload` → `payload` (streamExecutionTimeline - read-side access)

### 2. Missing Required Field (8 occurrences)
- **Line 66:** Added `tenant_id: this.config.tenantId` (publishExecutionStarted)
- **Line 94:** Added `tenant_id: this.config.tenantId` (publishExecutionCompleted)
- **Line 122:** Added `tenant_id: this.config.tenantId` (publishExecutionFailed)
- **Line 150:** Added `tenant_id: this.config.tenantId` (publishTaskStarted)
- **Line 179:** Added `tenant_id: this.config.tenantId` (publishTaskCompleted)
- **Line 208:** Added `tenant_id: this.config.tenantId` (publishTaskFailed)
- **Line 240:** Added `tenant_id: this.config.tenantId` (publishSystemEvent)
- **Line 269:** Added `tenant_id: this.config.tenantId` (publishRecoveryEvent)

### 3. Invalid Property Removal (3 occurrences)
- **Line 152:** Removed `task_id` from publishTaskStarted (not part of canonical EventInsert)
- **Line 181:** Removed `task_id` from publishTaskCompleted (not part of canonical EventInsert)
- **Line 210:** Removed `task_id` from publishTaskFailed (not part of canonical EventInsert)

## Methods Fixed Count

8 methods fixed (publishExecutionStarted, publishExecutionCompleted, publishExecutionFailed, publishTaskStarted, publishTaskCompleted, publishTaskFailed, publishSystemEvent, publishRecoveryEvent) + 1 read-side method (streamExecutionTimeline)

## Canonical Contract Used

EventInsert from types/event.types.ts

## File Status

✅ FIXED

## Next First Blocker

**File:** `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`  
**Line:** 61  
**Error:**
```
Type error: Object literal may only specify known properties, and 'event_payload' does not exist in type 'Omit<EventInsert, "created_at" | "updated_at"> & { correlationId?: string | undefined; causationId?: string | undefined; }'.
```

**Context:**
```typescript
event_payload: { plan }
```

**Classification:** LOCAL TYPING MISMATCH (same variant pattern - event_payload instead of payload)

**Reason:** The execution-orchestrator.ts uses `event_payload` instead of canonical `payload` property.

## Report Generated

Z14A27_EVENT_ORCHESTRATOR_FIX_REPORT.md

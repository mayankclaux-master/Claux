# CLAUX Orchestrator V1 Stub Refactoring Report

**Date:** 2026-05-23
**Phase:** Orchestrator Simplification (V1 Minimal Stubs)
**Status:** COMPLETED

## Executive Summary

Successfully refactored `ExecutionOrchestrator` and `TaskOrchestrator` classes into minimal V1 stubs, removing all over-engineered orchestration code while maintaining API compatibility. All routes and services using orchestrators have been updated to return deprecation errors, indicating that V1 agents should use `RuntimeService` directly.

## Objectives

1. Simplify `ExecutionOrchestrator` to a minimal V1 stub
2. Simplify `TaskOrchestrator` to a minimal V1 stub
3. Remove dependencies on `RuntimeService` within orchestrators
4. Add `TODO` comments indicating direct `RuntimeService` usage for V1 agents
5. Update all consuming routes and services to handle stub deprecation

## Changes Made

### 1. ExecutionOrchestrator Stub

**File:** `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`

**Changes:**
- Removed all code after line 64 (over-engineered orchestration logic)
- Removed `RuntimeService` import
- Changed constructor to accept `_runtime: unknown` instead of `RuntimeService`
- Modified `createExecution` to return mock UUID `'00000000-0000-0000-0000-000000000000'` directly
- Modified `startExecution` and `completeExecution` to be no-op methods
- Added `TODO` comments indicating direct `RuntimeService` usage for V1 agents

**Result:** 51 lines (down from 430+ lines)

### 2. TaskOrchestrator Stub

**File:** `apps/web/lib/runtime/orchestrator/task-orchestrator.ts`

**Changes:**
- Replaced entire file with minimal V1 stub
- Removed `RuntimeService` import
- Changed constructor to accept `_runtime: unknown` instead of `RuntimeService`
- Modified `createTask` to return mock UUID `'00000000-0000-0000-0000-000000000000'` directly
- Modified `startTask` and `completeTask` to be no-op methods
- Added `TODO` comments indicating direct `RuntimeService` usage for V1 agents

**Result:** 52 lines (down from 400+ lines)

### 3. Orchestrator Index Update

**File:** `apps/web/lib/runtime/orchestrator/index.ts`

**Changes:**
- Commented out exports for removed orchestrator types (`./types`)
- Commented out exports for over-engineered orchestrators (Lifecycle, Event, Recovery, Runtime facade)
- Kept only `ExecutionOrchestrator` and `TaskOrchestrator` exports (V1 stubs)

### 4. API Route Updates

All API routes using orchestrators were updated to return deprecation errors:

**Files Modified:**
- `apps/web/app/api/agents/aria/discovery/route.ts`
- `apps/web/app/api/agents/scribe/draft/route.ts`
- `apps/web/app/api/dev/simulate-agent/route.ts`
- `apps/web/app/api/v1/agent-update/route.ts`
- `apps/web/app/api/v1/orchestrator/trigger-agent/route.ts`
- `apps/web/app/api/runtime/recovery/route.ts`

**Pattern Applied:**
```typescript
// TODO: Refactor to use RuntimeService directly instead of orchestrator
// Orchestrator is a V1 minimal stub - agents should use direct execution
return NextResponse.json(
  { error: "Orchestrator usage deprecated - use RuntimeService directly" },
  { status: 501 }
);
```

### 5. Agent Service Updates

**Files Modified:**
- `apps/web/lib/agents/aria/aria.service.ts`
- `apps/web/lib/agents/scribe/scribe.service.ts`
- `apps/web/lib/agents/publish/publish.service.ts`

**Changes:**
- Removed `TaskOrchestrator` imports
- Commented out all orchestrator usage
- Added deprecation error throws
- Kept commented code for future reference

### 6. Publish Task Cleanup

**File:** `apps/web/lib/agents/publish/publish-tasks.ts`

**Changes:**
- Commented out `WordPressPublishTask` class (WordPressConnector removed in Phase 2A.1)
- Commented out `CustomAPIPublishTask` class (CustomAPIConnector removed in Phase 2A.1)
- Updated `PublishTaskExecutorFactory` to remove CMS connector properties
- Commented out CMS automation task cases in `createExecutor` and `getSupportedTaskTypes`

## Build Verification

**Status:** ✅ PASSED

```bash
npm run build
```

- Compiled successfully
- Linting passed
- Static pages generated (35/35)
- No TypeScript errors

## API Compatibility

### Maintained Signatures

**ExecutionOrchestrator:**
- `constructor(_runtime: unknown, config: OrchestratorConfig)`
- `async createExecution(_agentName: string, _inputPayload: Record<string, unknown>): Promise<UUID>`
- `async startExecution(_executionId: UUID): Promise<void>`
- `async completeExecution(_executionId: UUID): Promise<void>`

**TaskOrchestrator:**
- `constructor(_runtime: unknown, config: OrchestratorConfig)`
- `async createTask(_taskName: string, _inputPayload: Record<string, unknown>): Promise<UUID>`
- `async startTask(_taskId: UUID): Promise<void>`
- `async completeTask(_taskId: UUID): Promise<void>`

### Removed Functionality

All over-engineered features removed:
- Event publishing
- Auto-logging
- Stall detection
- Lifecycle validation
- Dependency validation
- Recovery strategies
- Retry policies
- Progress calculation

## Migration Path for V1 Agents

### Current State (Deprecated)
```typescript
const orchestrator = new ExecutionOrchestrator(runtime, { tenantId });
const executionId = await orchestrator.createExecution(agentName, payload);
await orchestrator.startExecution(executionId);
```

### Future State (Direct RuntimeService)
```typescript
const runtime = new RuntimeService({ tenantId });
const executionId = await runtime.execution.createExecution({
  agent_name: agentName,
  input_payload: payload,
});
await runtime.execution.startExecution(executionId);
```

## Files Changed Summary

| File | Lines Before | Lines After | Change |
|------|-------------|------------|--------|
| `execution-orchestrator.ts` | 430+ | 51 | -379 |
| `task-orchestrator.ts` | 400+ | 52 | -348 |
| `orchestrator/index.ts` | 49 | 45 | -4 |
| `aria/discovery/route.ts` | 119 | 125 | +6 (deprecation) |
| `scribe/draft/route.ts` | 119 | 125 | +6 (deprecation) |
| `dev/simulate-agent/route.ts` | 107 | 107 | 0 (deprecation) |
| `v1/agent-update/route.ts` | 111 | 111 | 0 (deprecation) |
| `v1/orchestrator/trigger-agent/route.ts` | 153 | 158 | +5 (deprecation) |
| `runtime/recovery/route.ts` | 121 | 127 | +6 (deprecation) |
| `aria/aria.service.ts` | 354 | 356 | +2 (deprecation) |
| `scribe/scribe.service.ts` | 266 | 269 | +3 (deprecation) |
| `publish/publish.service.ts` | 296 | 299 | +3 (deprecation) |
| `publish/publish-tasks.ts` | 843 | 854 | +11 (CMS removal) |

**Total Net Change:** ~700 lines removed

## Next Steps

1. **Refactor API Routes:** Update all deprecated routes to use `RuntimeService` directly
2. **Refactor Agent Services:** Update ARIA, SCRIBE, and PUBLISH services to use `RuntimeService` directly
3. **Remove Stubs:** Once all consumers are migrated, remove orchestrator stubs entirely
4. **Update Documentation:** Update all references to orchestrators in documentation

## Compliance

✅ **V1 Hybrid Locked Architecture Compliance:**
- NO feature improvisation
- NO future version engineering
- NO over-abstraction
- Maintained API compatibility during transition
- Clear deprecation path for consumers

## Sign-off

**Phase:** Orchestrator V1 Stub Refactoring
**Status:** COMPLETED
**Build Status:** PASSED
**Next Phase:** Direct RuntimeService Migration

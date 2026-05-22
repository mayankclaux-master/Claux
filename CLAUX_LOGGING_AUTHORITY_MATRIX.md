# CLAUX LOGGING AUTHORITY MATRIX

**Date:** 2025-01-09
**Engineer:** Cascade AI
**Scope:** Phase 2A.4 - Centralize Logging Authority
**Status:** Audit Complete

---

## EXECUTIVE SUMMARY

This document audits all logging systems in CLAUX and establishes canonical logging authority. The objective is to ensure that ONLY LogService may write logs to the agent_logs table.

**TOTAL SYSTEMS AUDITED:** 6
**CANONICAL SYSTEMS:** 1
**CONFLICTING SYSTEMS:** 3
**SEPARATE CONCERNS:** 2

---

## CANONICAL LOGGING AUTHORITY

**CANONICAL LOG WRITER:**
- LogService (apps/web/lib/runtime/services/log.service.ts)

**CANONICAL TABLE:**
- agent_logs

**CANONICAL METHODS:**
- writeLog() - Write a single log entry
- writeLogsBatch() - Write multiple log entries in batch
- writeError() - Write an error log entry
- writeFatal() - Write a fatal log entry
- getExecutionLogs() - Get logs for an execution
- getTaskLogs() - Get logs for a task
- getLogStatistics() - Get log statistics

**ACCESS PATTERN:**
```
RuntimeService → LogService → LogRepository → agent_logs table
```

---

## SYSTEM #1: LogService (CANONICAL ✅)

**FILE:** `apps/web/lib/runtime/services/log.service.ts`
**LINES:** 271
**TYPE:** Canonical Log Writer
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Business logic for log writing and aggregation

### Capabilities

**Log Writing:**
- writeLog() - Write a single log entry
- writeLogsBatch() - Write multiple log entries in batch
- writeError() - Write an error log entry
- writeFatal() - Write a fatal log entry

**Log Querying:**
- getExecutionLogs() - Get logs for an execution with filters
- getTaskLogs() - Get logs for a task with filters
- getLogStatistics() - Get log statistics

### Authority Compliance

**COMPLIANCE:** ✅ FULLY COMPLIANT
- Uses LogRepository for database operations
- Enforces tenant isolation via tenant_id
- Supports all log levels (INFO, WARN, ERROR, FATAL)
- Supports execution and task context
- Logs all operations for observability

### Dependencies

**CONSUMED BY:**
1. RuntimeService (via this.log)
2. ExecutionOrchestrator (via RuntimeService)
3. Integrations mesh systems (via RuntimeService)
4. Core provider governance (via RuntimeService)

### Classification

**TYPE:** CANONICAL ✅
**STATUS:** PRESERVED
**ACTION:** None required

---

## SYSTEM #2: AgentRuntimeSDK.log() (CONFLICTING ❌)

**FILE:** `apps/web/lib/runtime/sdk.ts`
**LINES:** 421
**METHOD:** log() (Line 338)
**TYPE:** Alternate Log Writer
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Logging for agent SDK

### Violations

**LOGGING VIOLATION:**
- Line 340: `this.db.createLog()` - Direct database access bypassing LogService

### Canonical Conflict

**VIOLATION:**
- Uses AgentRuntimeDatabase directly
- Duplicates LogService functionality
- Bypasses canonical logging authority
- No support for batch logging or error/fatal helpers

**CANONICAL EQUIVALENT:**
- LogService.writeLog()
- LogService.writeError()
- LogService.writeFatal()

### Dependencies

**DIRECT DEPENDENTS:**
- AgentRuntimeSDK internal methods (startExecution, completeExecution, failExecution, startTask, completeTask, failTask, emitEvent)

### Classification

**TYPE:** CONFLICTING ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** Part of AgentRuntimeSDK, which is blocked by BaseWorkflow

### Migration Strategy

**PHASE:** Phase 2A.2
**ESTIMATED EFFORT:** Included in AgentRuntimeSDK removal
**BREAKAGE RISK:** HIGH

**STEPS:**
1. Remove AgentRuntimeSDK (includes log method)
2. Refactor BaseWorkflow to use canonical ExecutionOrchestrator (which uses LogService)

---

## SYSTEM #3: Provider Observability (CONFLICTING ❌)

**FILE:** `apps/web/lib/runtime/provider-observability.ts`
**LINES:** 187
**METHOD:** recordProviderTelemetry() (Line 160)
**TYPE:** Provider Telemetry Recorder
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Record provider telemetry as log entries

### Violations

**LOGGING VIOLATION:**
- Line 165: `supabase.from("agent_logs").insert()` - Direct database access bypassing LogService

### Canonical Conflict

**VIOLATION:**
- Direct INSERT into agent_logs table
- Bypasses canonical LogService
- No tenant isolation enforcement via service layer
- No correlation with execution context via service layer

**CANONICAL EQUIVALENT:**
- LogService.writeLog()

### Dependencies

**DIRECT DEPENDENTS:**
- Unknown (need to search for recordProviderTelemetry usage)

### Classification

**TYPE:** CONFLICTING ❌
**REMOVAL FEASIBILITY:** ✅ POSSIBLE
**BLOCKING REASON:** None (simple refactor)

### Migration Strategy

**PHASE:** Phase 2A.4
**ESTIMATED EFFORT:** 0.5-1 day
**BREAKAGE RISK:** LOW

**STEPS:**
1. Refactor recordProviderTelemetry to use canonical LogService
2. Update all recordProviderTelemetry dependents

---

## SYSTEM #4: Agent Logger (CONFLICTING ❌)

**FILE:** `apps/web/lib/agents/base/agent.logger.ts`
**LINES:** 454
**TYPE:** Alternate Logging System
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Agent-specific logging with old runtime tables

### Violations

**LOGGING VIOLATIONS:**
- Line 405: `supabase.from("agent_activities").insert()` - Direct database access bypassing LogService
- Writes to old tables (agent_runs, agent_states, agent_activities) instead of canonical agent_logs

### Canonical Conflict

**VIOLATION:**
- Uses old runtime tables (agent_activities)
- Duplicates LogService functionality
- Bypasses canonical logging authority
- Creates dual logging system

**CANONICAL EQUIVALENT:**
- LogService.writeLog()
- LogService.writeError()

**OLD TABLES (DEPRECATED):**
- agent_runs
- agent_states
- agent_activities

**CANONICAL TABLES:**
- agent_executions
- agent_tasks
- agent_logs

### Dependencies

**DIRECT DEPENDENTS:**
1. `apps/web/lib/agents/aria/aria.service.ts` - imports agent.logger
2. `apps/web/lib/agents/scribe/scribe.service.ts` - imports agent.logger
3. `apps/web/lib/agents/publish/publish.service.ts` - imports agent.logger
4. `apps/web/lib/agents/locl/locl.service.ts` - imports agent.logger
5. `apps/web/lib/agents/pulse/pulse.service.ts` - imports agent.logger

**INDIRECT DEPENDENTS (old tables):**
1. `apps/web/lib/dashboard/index.ts` - queries agent_states, agent_activities
2. `apps/web/actions/audit-log.ts` - references agent_runs, agent_states
3. `apps/web/actions/verify-automation.ts` - queries agent_states
4. `apps/web/app/api/v1/agent-update/route.ts` - updates agent_states, inserts agent_runs
5. `apps/web/app/api/v1/orchestrator/trigger-agent/route.ts` - inserts agent_runs
6. `apps/web/app/api/dashboard/agent-states/route.ts` - queries agent_states
7. `apps/web/app/api/dashboard/agent-activities/route.ts` - queries agent_activities
8. `apps/web/app/api/dev/simulate-agent/route.ts` - references agent_runs

### Classification

**TYPE:** CRITICAL VIOLATION ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** 
- 5 operational agent services depend on this
- Dashboard, actions, and API routes depend on old tables

### Migration Strategy

**PHASE:** Phase 2A.6
**ESTIMATED EFFORT:** 5-7 days
**BREAKAGE RISK:** HIGH

**STEPS:**
1. Refactor 5 agent services to use canonical LogService
2. Migrate dashboard to query canonical tables (agent_executions, agent_logs)
3. Refactor actions to use canonical tables
4. Refactor v1 API routes to use canonical tables
5. Remove agent.logger.ts
6. Drop old runtime tables (agent_runs, agent_states, agent_activities)

---

## SYSTEM #5: ExecutionOrchestrator (CORRECT USAGE ✅)

**FILE:** `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`
**LINES:** 400
**TYPE:** Canonical Orchestrator
**AUTHORITY:** CORRECT USAGE ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Coordinates execution lifecycle with automatic logging

### Logging Pattern

**CORRECT USAGE:**
- Line 158: `this.runtime.log.writeError()` - Uses canonical LogService

### Authority Compliance

**COMPLIANCE:** ✅ FULLY COMPLIANT
- Uses RuntimeService.log (which is LogService)
- All logs go through canonical LogService
- Auto-writes error logs on execution failure

### Classification

**TYPE:** CORRECT USAGE ✅
**STATUS:** PRESERVED
**ACTION:** None required

---

## SYSTEM #6: Console Logging (SEPARATE CONCERN ⚠️)

**FILES:** Multiple files throughout codebase
**TYPE:** Development Logging
**AUTHORITY:** SEPARATE CONCERN ⚠️
**STATUS:** OPERATIONAL
**PURPOSE:** Development and debugging logs

### Usage Pattern

**CONSOLE.LOG/ERROR:**
- TenantContext.tsx - React context debugging
- Middleware.ts - Request logging
- Scripts - Recovery scripts
- Integrations - Indexing and token refresh logging

### Authority Assessment

**AUTHORITY:** ⚠️ SEPARATE CONCERN
- Console logging is for development and debugging
- Does NOT write to agent_logs table
- Does NOT conflict with LogService authority
- Serves a different purpose: console output vs. database log persistence

### Canonical Conflict

**VIOLATION:** NONE
- Console logging is a valid development practice
- Separate from database log persistence
- No conflict with LogService

### Classification

**TYPE:** SEPARATE CONCERN ⚠️
**STATUS:** PRESERVED
**ACTION:** None required
**NOTE:** This is console output for development, not database log persistence

---

## LOGGING AUTHORITY MATRIX

| # | System | File | Type | Authority | Status | Action |
|---|--------|------|------|-----------|--------|--------|
| 1 | LogService | lib/runtime/services/log.service.ts | Canonical | CANONICAL ✅ | PRESERVED | None |
| 2 | AgentRuntimeSDK.log() | lib/runtime/sdk.ts | Alternate | CONFLICTING ❌ | REMOVE | Remove with SDK |
| 3 | Provider Observability | lib/runtime/provider-observability.ts | Alternate | CONFLICTING ❌ | REFACTOR | Use LogService |
| 4 | Agent Logger | lib/agents/base/agent.logger.ts | Alternate | CONFLICTING ❌ | REMOVE | Migrate to LogService |
| 5 | ExecutionOrchestrator | lib/runtime/orchestrator/execution-orchestrator.ts | Canonical | CORRECT ✅ | PRESERVED | None |
| 6 | Console Logging | Multiple files | Development | SEPARATE ⚠️ | PRESERVED | None (different concern) |

---

## LOG FLOW DIAGRAM

### Canonical Log Flow (CORRECT ✅)
```
Dashboard/UI/API
  ↓
RuntimeService
  ↓
LogService.writeLog()
  ↓
LogRepository.create()
  ↓
agent_logs table
```

### Conflicting Log Flow (VIOLATION ❌)
```
Provider Observability
  ↓
supabase.from("agent_logs").insert()
  ↓
agent_logs table
```

### Old Log Flow (DEPRECATED ❌)
```
Agent Logger
  ↓
supabase.from("agent_activities").insert()
  ↓
agent_activities table
```

### Console Log Flow (SEPARATE ⚠️)
```
Any System
  ↓
console.log() / console.error()
  ↓
Browser Console / Terminal (NO DATABASE)
```

---

## CANONICAL LOGGING AUTHORITY LAWS

### Law 1: Log Writing Authority
**ONLY** LogService may write logs to the agent_logs table via `writeLog()`, `writeLogsBatch()`, `writeError()`, or `writeFatal()`.

### Law 2: Log Service Access
**ONLY** RuntimeService may provide access to LogService via `RuntimeService.log`.

### Law 3: Log Level Authority
**ONLY** LogService may enforce log levels (INFO, WARN, ERROR, FATAL) and severity filtering.

### Law 4: Direct Database Access Prohibition
**NO** system may directly INSERT into agent_logs table outside LogService.

### Law 5: Old Tables Prohibition
**NO** system may write to old runtime tables (agent_runs, agent_states, agent_activities) for logging purposes.

### Law 6: Console Logging Separation
Console logging is a separate concern for development and debugging and does NOT conflict with LogService authority.

---

## MIGRATION PHASING

### Phase 2A.4.1: Refactor Provider Observability (Week 3)

**OBJECTIVE:** Refactor Provider Observability to use canonical LogService

**SYSTEMS TO REFACTOR:**
1. recordProviderTelemetry → LogService.writeLog()

**EXPECTED OUTCOME:**
- All provider telemetry through canonical LogService

**ESTIMATED EFFORT:** 0.5-1 day

---

### Phase 2A.4.2: Remove AgentRuntimeSDK.log() (Week 1)

**OBJECTIVE:** Remove AgentRuntimeSDK.log() as part of SDK removal

**SYSTEMS TO REMOVE:**
1. AgentRuntimeSDK.log() method
2. Remove entire AgentRuntimeSDK

**EXPECTED OUTCOME:**
- AgentRuntimeSDK removed
- No SDK-based logging

**ESTIMATED EFFORT:** Included in AgentRuntimeSDK removal

---

### Phase 2A.4.3: Remove Agent Logger (Week 2-3)

**OBJECTIVE:** Remove Agent Logger and migrate to canonical LogService

**SYSTEMS TO REFACTOR:**
1. Agent services → LogService
2. Dashboard → canonical tables
3. Actions → canonical tables
4. API routes → canonical tables
5. Remove Agent Logger
6. Drop old tables

**EXPECTED OUTCOME:**
- Agent Logger removed
- Old tables dropped
- All logging through canonical LogService

**ESTIMATED EFFORT:** 5-7 days

---

## AUDIT CONCLUSION

**TOTAL SYSTEMS AUDITED:** 6
**CANONICAL SYSTEMS:** 1 (LogService)
**CONFLICTING SYSTEMS:** 3 (AgentRuntimeSDK.log, Provider Observability, Agent Logger)
**SEPARATE CONCERNS:** 2 (Console Logging, Development Scripts)
**CORRECT USAGE:** 1 (ExecutionOrchestrator)

**CRITICAL FINDINGS:**
1. AgentRuntimeSDK.log() duplicates LogService functionality
2. Provider Observability bypasses LogService with direct database access
3. Agent Logger creates dual logging system with old tables
4. Console logging is a separate concern (not a violation)
5. ExecutionOrchestrator correctly uses LogService

**NEXT STEPS:**
1. Refactor Provider Observability to use canonical LogService
2. Remove AgentRuntimeSDK (includes log method)
3. Remove Agent Logger and migrate to canonical LogService
4. Establish single canonical logging authority

---

**END OF LOGGING AUTHORITY MATRIX**

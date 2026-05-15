# CANONICAL AGENT MIGRATION REPORT

**Phase:** Phase 1A - Runtime Consolidation  
**Date:** 2026-05-10  
**Status:** AUDIT COMPLETE

---

## EXECUTIVE SUMMARY

The CLAUX codebase contains **TWO PARALLEL EXECUTION SYSTEMS**:

1. **Legacy Agent System** (mock execution, local state, direct API routes)
2. **Canonical Runtime System** (production-grade, orchestrator-driven, replay-safe)

These systems are **CONFLICTING** and must be consolidated.

---

## EXISTING AGENT LOGIC AUDIT

### Implemented Agents (Legacy System)

| Agent | File | Status | Issue |
|-------|------|--------|-------|
| ARIA | `agents/aria/aria.service.ts` | IMPLEMENTED | Mock execution, bypasses runtime |
| SCRIBE | `agents/scribe/scribe.service.ts` | IMPLEMENTED | Mock execution, bypasses runtime |
| PUBLISH | `agents/publish/publish.service.ts` | IMPLEMENTED | Mock execution, bypasses runtime |
| PULSE | `agents/pulse/pulse.service.ts` | IMPLEMENTED | Mock execution, bypasses runtime |
| LOCL | `agents/locl/locl.service.ts` | IMPLEMENTED | Mock execution, bypasses runtime |

### Agent Infrastructure (Legacy System)

| Component | File | Purpose | Issue |
|-----------|------|---------|-------|
| Agent Logger | `agents/base/agent.logger.ts` | State management, activity logging | Duplicate of runtime repositories |
| Agent Types | `agents/base/agent.types.ts` | Agent context types | Compatible, keep |
| DataForSEO Client | `agents/shared/dataforseo.client.ts` | Keyword research | MOCK DATA - needs real integration |
| OpenAI Client | `agents/shared/openai.client.ts` | Content generation | MOCK DATA - needs real integration |
| GMB Client | `agents/shared/gmb.client.ts` | Google My Business | MOCK DATA - needs real integration |
| SERP Client | `agents/shared/serp.client.ts` | SERP analysis | MOCK DATA - needs real integration |

### API Routes (Legacy System)

| Route | File | Purpose | Issue |
|-------|------|---------|-------|
| POST /api/agents/aria/run | `app/api/agents/aria/run/route.ts` | Trigger ARIA | Bypasses runtime orchestrator |
| POST /api/agents/scribe/run | `app/api/agents/scribe/run/route.ts` | Trigger SCRIBE | Bypasses runtime orchestrator |
| POST /api/agents/pulse/run | `app/api/agents/pulse/run/route.ts` | Trigger PULSE | Bypasses runtime orchestrator |
| POST /api/agents/locl/run | `app/api/agents/locl/run/route.ts` | Trigger LOCL | Bypasses runtime orchestrator |
| POST /api/agents/publish/run | `app/api/agents/publish/run/route.ts` | Trigger PUBLISH | Bypasses runtime orchestrator |

### Canonical Runtime (Target System)

| Component | File | Status | Note |
|-----------|------|--------|-------|
| Execution Orchestrator | `runtime/orchestrator/execution-orchestrator.ts` | IMPLEMENTED | Production-grade, event-driven |
| Execution Service | `runtime/services/execution.service.ts` | IMPLEMENTED | Execution lifecycle management |
| Task Service | `runtime/services/` | IMPLEMENTED | Task execution engine |
| Log Repository | `runtime/repositories/log.repository.ts` | IMPLEMENTED | Structured logging |
| Event Repository | `runtime/repositories/event.repository.ts` | IMPLEMENTED | Event sourcing |
| Metrics Repository | `runtime/repositories/metrics.repository.ts` | IMPLEMENTED | Telemetry collection |

---

## CONFLICTING EXECUTION SYSTEMS

### Conflict 1: Duplicate State Management

**Legacy System:**
- `agent_states` table (via agent.logger.ts)
- `agent_runs` table (via agent.logger.ts)
- `agent_activities` table (via agent.logger.ts)

**Canonical Runtime:**
- `runtime_executions` table (via execution.repository.ts)
- `runtime_tasks` table (via task.repository.ts)
- `runtime_logs` table (via log.repository.ts)
- `runtime_events` table (via event.repository.ts)

**Impact:** Two separate state machines tracking the same executions. No synchronization.

### Conflict 2: Duplicate Orchestration

**Legacy System:**
- Direct function calls (`runARIA()`, `runSCRIBE()`)
- Timeout wrappers
- Manual state transitions
- No workflow engine

**Canonical Runtime:**
- ExecutionOrchestrator with lifecycle management
- Event-driven coordination
- Automatic retry/cancellation
- Workflow task engine

**Impact:** No coordination between systems. Legacy system bypasses all runtime guarantees.

### Conflict 3: Duplicate Telemetry

**Legacy System:**
- Console.log statements (structuredLog)
- Manual progress tracking
- No replay capability

**Canonical Runtime:**
- Structured log repository
- Event sourcing for replay
- Metrics collection
- Distributed tracing

**Impact:** No unified observability. Cannot replay legacy executions.

---

## REMOVABLE LOGIC

### Must Remove

1. **Legacy Agent Services** (entire files)
   - `agents/aria/aria.service.ts`
   - `agents/scribe/scribe.service.ts`
   - `agents/publish/publish.service.ts`
   - `agents/pulse/pulse.service.ts`
   - `agents/locl/locl.service.ts`

2. **Legacy Agent Logger** (entire file)
   - `agents/base/agent.logger.ts`

3. **Legacy API Routes** (entire files)
   - `app/api/agents/aria/run/route.ts`
   - `app/api/agents/scribe/run/route.ts`
   - `app/api/agents/pulse/run/route.ts`
   - `app/api/agents/locl/run/route.ts`
   - `app/api/agents/publish/run/route.ts`

4. **Legacy Database Tables** (schema)
   - `agent_states`
   - `agent_runs`
   - `agent_activities`

5. **Mock Provider Clients** (replace with real)
   - `agents/shared/dataforseo.client.ts` (mock data)
   - `agents/shared/openai.client.ts` (mock data)
   - `agents/shared/gmb.client.ts` (mock data)
   - `agents/shared/serp.client.ts` (mock data)

---

## REUSABLE LOGIC

### Must Preserve and Migrate

1. **Agent Types** (keep)
   - `agents/base/agent.types.ts` - AgentContext interface
   - Migrate to: `runtime/types/agent.types.ts`

2. **Domain Logic** (extract and migrate)
   - Keyword normalization logic (from aria.service.ts)
   - Intent classification logic (from aria.service.ts)
   - Content validation logic (from scribe.service.ts)
   - Migrate to: `runtime/adapters/` layer

3. **Provider Client Interfaces** (keep contracts, replace implementations)
   - `fetchKeywordsForSite()` interface
   - `generateArticle()` interface
   - Migrate to: `runtime/adapters/providers/`

4. **UI Components** (keep unchanged)
   - All UI components remain
   - Only backend integration changes

5. **Schemas** (keep)
   - Database schemas for business data
   - `aria_keywords`, `scribe_content`, etc.

---

## MIGRATION PLAN

### Phase A: Remove Conflicting Execution (THIS PHASE)

1. Delete legacy agent service files
2. Delete legacy agent logger
3. Delete legacy API routes
4. Drop legacy database tables
5. Keep canonical runtime unchanged

### Phase B: Implement Provider Adapters

1. Create `runtime/adapters/providers/dataforseo.adapter.ts`
2. Create `runtime/adapters/providers/openai.adapter.ts`
3. Replace mock implementations with real API calls
4. Add proper error handling and retry logic

### Phase C: Implement Production ARIA

1. Create ARIA workflow definition
2. Create ARIA task definitions
3. Integrate with ExecutionOrchestrator
4. Implement real keyword discovery via DataForSEO
5. Implement thinking log system

### Phase D: Implement Production SCRIBE

1. Create SCRIBE workflow definition
2. Create SCRIBE task definitions
3. Integrate with ExecutionOrchestrator
4. Implement real content generation via OpenAI
5. Implement thinking log system

### Phase E: API Migration

1. Create new API routes that use canonical runtime
2. POST /api/agents/aria/discovery (runtime-integrated)
3. POST /api/agents/scribe/draft (runtime-integrated)
4. GET /api/tasks (runtime tasks)
5. GET /api/reports (runtime reports)
6. GET /api/thinking/:executionId (thinking logs)

---

## DEPRECATED FLOWS

### Flows to Deprecate

1. **Direct Agent Invocation**
   - Old: `POST /api/agents/{agent}/run` → direct function call
   - New: `POST /api/agents/{agent}/{action}` → runtime orchestrator

2. **Local State Management**
   - Old: `updateAgentState()` → direct DB writes
   - New: ExecutionOrchestrator → event-driven state transitions

3. **Mock Provider Calls**
   - Old: `fetchKeywordsForSite()` → mock data
   - New: Provider adapters → real API calls with retry logic

4. **Console Logging**
   - Old: `structuredLog()` → console.log
   - New: Log repository → structured, replay-safe logs

---

## RUNTIME BYPASS IDENTIFIED

### Bypass Points

1. **API Routes** - Directly call agent services, bypass orchestrator
2. **Agent Services** - Directly write to DB, bypass runtime state machine
3. **Provider Clients** - Return mock data, bypass real provider integration
4. **Logging** - Console output, bypass runtime log repository
5. **Telemetry** - No metrics collection, bypass runtime metrics repository

### Impact

- **No replay capability** - Cannot replay legacy executions
- **No distributed coordination** - Cannot coordinate across workers
- **No tenant isolation guarantees** - Legacy tables lack proper tenant isolation
- **No checkpoint/recovery** - Cannot recover from failures
- **No observability** - Cannot trace execution across system

---

## ARCHITECTURAL VALIDATION

### Canonical Runtime Readiness

✅ Execution Orchestrator - IMPLEMENTED  
✅ Task Engine - IMPLEMENTED  
✅ Log Repository - IMPLEMENTED  
✅ Event Repository - IMPLEMENTED  
✅ Metrics Repository - IMPLEMENTED  
✅ State Machines - IMPLEMENTED (via agents/runtime/)  
❌ Provider Adapters - NOT IMPLEMENTED  
❌ Agent Workflows - NOT IMPLEMENTED  
❌ Agent Tasks - NOT IMPLEMENTED  
❌ Thinking Logs - NOT IMPLEMENTED  

### Migration Feasibility

**HIGH FEASIBILITY** - Canonical runtime is production-ready. Only need to:
1. Implement provider adapters
2. Define agent workflows
3. Define agent tasks
4. Connect UI to runtime

---

## RECOMMENDATIONS

### Immediate Actions (Phase A)

1. **DELETE** all legacy agent service files
2. **DELETE** legacy agent logger
3. **DELETE** legacy API routes
4. **DROP** legacy database tables
5. **KEEP** canonical runtime unchanged

### Next Actions (Phase B-D)

1. Implement provider adapters with real API integration
2. Define ARIA and SCRIBE workflows
3. Define ARIA and SCRIBE tasks
4. Implement thinking log system
5. Create runtime-integrated API routes
6. Connect UI to runtime state

### Future Actions

1. Deprecate all other agents (PUBLISH, PULSE, LOCL, etc.)
2. Keep them as registry entries only
3. No execution logic for non-production agents
4. All future agents must use canonical runtime

---

## CONCLUSION

The CLAUX codebase contains **TWO CONFLICTING EXECUTION SYSTEMS**. The legacy system must be removed and all execution must route through the canonical runtime.

**Status:** AUDIT COMPLETE  
**Next Phase:** REMOVE CONFLICTING EXECUTION

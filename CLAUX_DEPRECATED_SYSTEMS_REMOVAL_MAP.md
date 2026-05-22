# CLAUX DEPRECATED SYSTEMS REMOVAL MAP

**Date:** 2025-01-09
**Engineer:** Cascade AI
**Scope:** Phase 1A - Architectural Authority Purification
**Status:** Removal Map Complete

---

## EXECUTIVE SUMMARY

This map provides a detailed removal strategy for all deprecated, dangerous, and dead systems in CLAUX. The removal is divided into three phases based on dependency safety and operational impact.

**PHASE 1A.1: IMMEDIATE REMOVAL (Safe)**
- Systems with zero dependencies
- Systems with only dead code dependencies
- Systems explicitly marked as deprecated

**PHASE 1A.2: BLOCKED REMOVAL (Requires Refactoring)**
- Systems with operational dependencies
- Systems requiring agent service refactoring
- Systems requiring dashboard migration

**PHASE 1A.3: PRESERVATION (Webhook Compatibility)**
- Systems to preserve for webhook bridge capability
- Systems to preserve for external automation helpers

---

## PHASE 1A.1: IMMEDIATE REMOVAL (Safe)

### Removal Group 1: Integration Mesh Orchestration

**SYSTEM:** n8n Orchestration Authority
**TYPE:** DANGEROUS
**DEPENDENCIES:** Dead code only
**REMOVAL FEASIBILITY:** ✅ HIGH
**BREAKAGE RISK:** NONE

**FILES TO REMOVE:**
1. `apps/web/lib/integrations/mesh/dispatchers/index.ts` (159 lines)
2. `apps/web/lib/integrations/mesh/feature-flags.ts` (157 lines)
3. `apps/web/lib/integrations/mesh/contracts/n8n-schemas.ts`
4. `apps/web/lib/integrations/mesh/recovery/recovery-tests.ts`
5. `apps/web/lib/integrations/mesh/recovery/provider-recovery-tests.ts`
6. `apps/web/lib/integrations/mesh/runtime/state-machine.ts`
7. `apps/web/lib/integrations/mesh/runtime/index.ts`
8. `apps/web/lib/integrations/mesh/observability/index.ts`

**DEPENDENCY ANALYSIS:**
- Runtime tasks (aria.tasks.ts, scribe.tasks.ts, etc.) - DEAD CODE, not used by agents
- API routes (recovery-tests, callback-continuation-validation) - TEST ROUTES only

**REMOVAL COMMANDS:**
```bash
rm apps/web/lib/integrations/mesh/dispatchers/index.ts
rm apps/web/lib/integrations/mesh/feature-flags.ts
rm apps/web/lib/integrations/mesh/contracts/n8n-schemas.ts
rm -rf apps/web/lib/integrations/mesh/recovery
rm -rf apps/web/lib/integrations/mesh/runtime
rm -rf apps/web/lib/integrations/mesh/observability
```

**VERIFICATION:**
```bash
grep -r "IntegrationDispatcher\|ENABLE_.*_DISPATCH_EXECUTION\|shouldUseIntegrationMesh" apps/web
# Should return nothing
```

**ROLLBACK:** Restore files from git

---

### Removal Group 2: Dispatch API Routes

**SYSTEM:** Direct Provider Access Routes
**TYPE:** DANGEROUS
**DEPENDENCIES:** Dead code only
**REMOVAL FEASIBILITY:** ✅ HIGH
**BREAKAGE RISK:** NONE

**FILES TO REMOVE:**
1. `apps/web/app/api/integrations/dispatch/cms/route.ts`
2. `apps/web/app/api/integrations/dispatch/gsc/route.ts`
3. `apps/web/app/api/integrations/dispatch/openai/route.ts`
4. `apps/web/app/api/integrations/dispatch/gbp/route.ts`
5. `apps/web/app/api/integrations/dispatch/dataforseo/route.ts`

**DEPENDENCY ANALYSIS:**
- Runtime tasks (aria.tasks.ts, scribe.tasks.ts, etc.) - DEAD CODE, not used by agents

**REMOVAL COMMANDS:**
```bash
rm apps/web/app/api/integrations/dispatch/cms/route.ts
rm apps/web/app/api/integrations/dispatch/gsc/route.ts
rm apps/web/app/api/integrations/dispatch/openai/route.ts
rm apps/web/app/api/integrations/dispatch/gbp/route.ts
rm apps/web/app/api/integrations/dispatch/dataforseo/route.ts
rmdir apps/web/app/api/integrations/dispatch
```

**VERIFICATION:**
```bash
grep -r "integrations/dispatch" apps/web
# Should return nothing
```

**ROLLBACK:** Restore files from git

---

### Removal Group 3: Deprecated Runtime Wrappers

**SYSTEM:** Deprecated Agent Runtime Wrappers
**TYPE:** DEPRECATED
**DEPENDENCIES:** None
**REMOVAL FEASIBILITY:** ✅ HIGH
**BREAKAGE RISK:** NONE

**FILES TO REMOVE:**
1. `apps/web/lib/agents/linx/runtime.ts` (116 lines)
2. `apps/web/lib/agents/repute/runtime.ts` (253 lines)
3. `apps/web/lib/agents/prism/runtime.ts` (233 lines)
4. `apps/web/lib/agents/locl/runtime.ts` (deprecated)
5. `apps/web/lib/agents/pulse/runtime.ts` (deprecated)

**DEPENDENCY ANALYSIS:**
- None - explicitly deprecated, not used by any agent

**REMOVAL COMMANDS:**
```bash
rm apps/web/lib/agents/linx/runtime.ts
rm apps/web/lib/agents/repute/runtime.ts
rm apps/web/lib/agents/prism/runtime.ts
rm apps/web/lib/agents/locl/runtime.ts
rm apps/web/lib/agents/pulse/runtime.ts
```

**VERIFICATION:**
```bash
grep -r "LinxAgentRuntime\|ReputeAgentRuntime\|PrismAgentRuntime\|LoclAgentRuntime\|PulseAgentRuntime" apps/web
# Should return nothing
```

**ROLLBACK:** Restore files from git

---

### Removal Group 4: Canonical System Agents

**SYSTEM:** Canonical System Agents Abstraction
**TYPE:** DEAD
**DEPENDENCIES:** None
**REMOVAL FEASIBILITY:** ✅ HIGH
**BREAKAGE RISK:** NONE

**FILES TO REMOVE:**
1. `apps/web/lib/agents/system/canonical-agents.ts` (253 lines)
2. `apps/web/lib/agents/system/types.ts`

**DEPENDENCY ANALYSIS:**
- None - not used by any business agent

**REMOVAL COMMANDS:**
```bash
rm apps/web/lib/agents/system/canonical-agents.ts
rm apps/web/lib/agents/system/types.ts
rmdir apps/web/lib/agents/system
```

**VERIFICATION:**
```bash
grep -r "canonical-agents\|PLANNER_AGENT\|EXECUTOR_AGENT\|VALIDATOR_AGENT" apps/web
# Should return nothing
```

**ROLLBACK:** Restore files from git

---

### Removal Group 5: Unused Agent Subsystems

**SYSTEM:** Unused Agent Abstractions
**TYPE:** DEAD
**DEPENDENCIES:** None
**REMOVAL FEASIBILITY:** ✅ HIGH
**BREAKAGE RISK:** NONE

**DIRECTORIES TO REMOVE:**
1. `apps/web/lib/agents/capabilities/` (3 files)
2. `apps/web/lib/agents/governance/` (3 files)
3. `apps/web/lib/agents/memory/` (3 files)
4. `apps/web/lib/agents/planning/` (3 files)
5. `apps/web/lib/agents/topology/` (3 files)
6. `apps/web/lib/agents/registry/` (3 files)
7. `apps/web/lib/agents/runtime/` (5 files)

**DEPENDENCY ANALYSIS:**
- None - not used by any agent

**REMOVAL COMMANDS:**
```bash
rm -rf apps/web/lib/agents/capabilities
rm -rf apps/web/lib/agents/governance
rm -rf apps/web/lib/agents/memory
rm -rf apps/web/lib/agents/planning
rm -rf apps/web/lib/agents/topology
rm -rf apps/web/lib/agents/registry
rm -rf apps/web/lib/agents/runtime
```

**VERIFICATION:**
```bash
grep -r "from.*capabilities\|from.*governance\|from.*memory\|from.*planning\|from.*topology\|from.*registry" apps/web/lib/agents
# Should return nothing
```

**ROLLBACK:** Restore directories from git

---

### Removal Group 6: Agent Thinking Subsystems

**SYSTEM:** Agent Thinking Logic
**TYPE:** DEAD
**DEPENDENCIES:** None
**REMOVAL FEASIBILITY:** ✅ HIGH
**BREAKAGE RISK:** NONE

**FILES TO REMOVE:**
1. `apps/web/lib/agents/linx/thinking.ts`
2. `apps/web/lib/agents/locl/thinking.ts`
3. `apps/web/lib/agents/prism/thinking.ts`
4. `apps/web/lib/agents/pulse/thinking.ts`

**DEPENDENCY ANALYSIS:**
- None - not used by any agent

**REMOVAL COMMANDS:**
```bash
rm apps/web/lib/agents/linx/thinking.ts
rm apps/web/lib/agents/locl/thinking.ts
rm apps/web/lib/agents/prism/thinking.ts
rm apps/web/lib/agents/pulse/thinking.ts
```

**VERIFICATION:**
```bash
grep -r "thinking" apps/web/lib/agents
# Should return nothing
```

**ROLLBACK:** Restore files from git

---

### Removal Group 7: Runtime Adapters

**SYSTEM:** Runtime Provider Adapters
**TYPE:** DEAD
**DEPENDENCIES:** None
**REMOVAL FEASIBILITY:** ✅ HIGH
**BREAKAGE RISK:** NONE

**FILES TO REMOVE:**
1. `apps/web/lib/runtime/adapters/providers/openai.adapter.ts`
2. `apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts`

**DEPENDENCY ANALYSIS:**
- None - dead code, not used

**REMOVAL COMMANDS:**
```bash
rm apps/web/lib/runtime/adapters/providers/openai.adapter.ts
rm apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts
rmdir apps/web/lib/runtime/adapters/providers
rmdir apps/web/lib/runtime/adapters
```

**VERIFICATION:**
```bash
grep -r "runtime/adapters" apps/web
# Should return nothing
```

**ROLLBACK:** Restore files from git

---

### Removal Group 8: Runtime Tasks

**SYSTEM:** Runtime Task Definitions
**TYPE:** DEAD
**DEPENDENCIES:** None
**REMOVAL FEASIBILITY:** ✅ HIGH
**BREAKAGE RISK:** NONE

**FILES TO REMOVE:**
1. `apps/web/lib/runtime/tasks/aria.tasks.ts`
2. `apps/web/lib/runtime/tasks/scribe.tasks.ts`
3. `apps/web/lib/runtime/tasks/locl.tasks.ts`
4. `apps/web/lib/runtime/tasks/linx.tasks.ts`
5. `apps/web/lib/runtime/tasks/repute.tasks.ts`
6. `apps/web/lib/runtime/tasks/prism.tasks.ts`
7. `apps/web/lib/runtime/tasks/pulse.tasks.ts`
8. `apps/web/lib/runtime/tasks/ampli.tasks.ts`

**DEPENDENCY ANALYSIS:**
- None - agents use .service.ts pattern instead

**REMOVAL COMMANDS:**
```bash
rm apps/web/lib/runtime/tasks/aria.tasks.ts
rm apps/web/lib/runtime/tasks/scribe.tasks.ts
rm apps/web/lib/runtime/tasks/locl.tasks.ts
rm apps/web/lib/runtime/tasks/linx.tasks.ts
rm apps/web/lib/runtime/tasks/repute.tasks.ts
rm apps/web/lib/runtime/tasks/prism.tasks.ts
rm apps/web/lib/runtime/tasks/pulse.tasks.ts
rm apps/web/lib/runtime/tasks/ampli.tasks.ts
rmdir apps/web/lib/runtime/tasks
```

**VERIFICATION:**
```bash
grep -r "runtime/tasks" apps/web
# Should return nothing
```

**ROLLBACK:** Restore files from git

---

### Removal Group 9: Empty Monorepo Directories

**SYSTEM:** Empty Monorepo Structure
**TYPE:** DEAD
**DEPENDENCIES:** None
**REMOVAL FEASIBILITY:** ✅ HIGH
**BREAKAGE RISK:** NONE

**DIRECTORIES TO REMOVE:**
1. `apps/api/` (empty)
2. `agents/` (empty)
3. `lib/` (empty)

**DEPENDENCY ANALYSIS:**
- None - empty directories

**REMOVAL COMMANDS:**
```bash
rmdir apps/api
rmdir agents
rmdir lib
```

**VERIFICATION:**
```bash
ls apps/
ls -d agents/ lib/ 2>/dev/null || echo "Directories removed successfully"
```

**ROLLBACK:** Restore directories from git

---

## PHASE 1A.2: BLOCKED REMOVAL (Requires Refactoring)

### Blocked Group 1: Agent Runtime SDK/Database

**SYSTEM:** Alternate Runtime Abstraction
**TYPE:** DANGEROUS
**DEPENDENCIES:** events, observability, workflows
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BREAKAGE RISK:** HIGH

**FILES TO REMOVE (BLOCKED):**
1. `apps/web/lib/runtime/database.ts` (AgentRuntimeDatabase)
2. `apps/web/lib/runtime/sdk.ts` (AgentRuntimeSDK)
3. `apps/web/lib/runtime/index.ts` (exports)

**DEPENDENCY ANALYSIS:**
- `apps/web/lib/events/emitter.ts` - uses AgentRuntimeDatabase
- `apps/web/lib/observability/tracer.ts` - uses AgentRuntimeDatabase
- `apps/web/lib/workflows/base-workflow.ts` - uses AgentRuntimeSDK

**BLOCKING REASON:** events, observability, and workflow systems depend on this

**REQUIRED REFACTORING:**
1. Refactor events/emitter.ts to use canonical RuntimeService
2. Refactor observability/tracer.ts to use canonical RuntimeService
3. Refactor workflows/base-workflow.ts to use canonical RuntimeService
4. Remove AgentRuntimeDatabase and AgentRuntimeSDK

**ESTIMATED EFFORT:** 2-3 days

**PHASE:** Phase 2 (after Phase 1A.1 complete)

---

### Blocked Group 2: Agent Logger

**SYSTEM:** Alternate Logging System
**TYPE:** CONFLICTING
**DEPENDENCIES:** 5 agent services
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BREAKAGE RISK:** HIGH

**FILES TO REMOVE (BLOCKED):**
1. `apps/web/lib/agents/base/agent.logger.ts`

**DEPENDENCY ANALYSIS:**
- `apps/web/lib/agents/aria/aria.service.ts` - imports agent.logger
- `apps/web/lib/agents/scribe/scribe.service.ts` - imports agent.logger
- `apps/web/lib/agents/publish/publish.service.ts` - imports agent.logger
- `apps/web/lib/agents/locl/locl.service.ts` - imports agent.logger
- `apps/web/lib/agents/pulse/pulse.service.ts` - imports agent.logger

**BLOCKING REASON:** 5 operational agent services depend on this

**REQUIRED REFACTORING:**
1. Refactor aria.service.ts to use canonical LogService
2. Refactor scribe.service.ts to use canonical LogService
3. Refactor publish.service.ts to use canonical LogService
4. Refactor locl.service.ts to use canonical LogService
5. Refactor pulse.service.ts to use canonical LogService
6. Remove agent.logger.ts

**ESTIMATED EFFORT:** 3-5 days

**PHASE:** Phase 3 (after Phase 2 complete)

---

### Blocked Group 3: Direct Provider Clients

**SYSTEM:** Direct Provider Access
**TYPE:** DANGEROUS
**DEPENDENCIES:** 4 agent services
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BREAKAGE RISK:** HIGH

**FILES TO REMOVE (BLOCKED):**
1. `apps/web/lib/agents/shared/dataforseo.client.ts`
2. `apps/web/lib/agents/shared/openai.client.ts`
3. `apps/web/lib/agents/shared/serp.client.ts`
4. `apps/web/lib/agents/shared/gmb.client.ts`

**DEPENDENCY ANALYSIS:**
- `apps/web/lib/agents/aria/aria.service.ts` - uses dataforseo.client
- `apps/web/lib/agents/scribe/scribe.service.ts` - uses openai.client
- `apps/web/lib/agents/pulse/pulse.service.ts` - uses serp.client
- `apps/web/lib/agents/locl/locl.service.ts` - uses gmb.client

**BLOCKING REASON:** 4 operational agent services depend on these

**REQUIRED REFACTORING:**
1. Create runtime connectors for all providers
2. Implement real provider APIs (replace mock data)
3. Refactor aria.service.ts to use runtime connector
4. Refactor scribe.service.ts to use runtime connector
5. Refactor pulse.service.ts to use runtime connector
6. Refactor locl.service.ts to use runtime connector
7. Remove mock provider clients

**ESTIMATED EFFORT:** 5-7 days

**PHASE:** Phase 3 (after Phase 2 complete)

---

### Blocked Group 4: CMS Connectors (Direct Calls)

**SYSTEM:** Direct CMS Access
**TYPE:** DANGEROUS
**DEPENDENCIES:** publish.service.ts
**REMOVAL FEASIBILITY:** ❌ BLOCKED (keep files, remove direct calls)
**BREAKAGE RISK:** MEDIUM

**FILES TO PRESERVE (refactor usage only):**
1. `apps/web/lib/connectors/wordpress.connector.ts` - KEEP FILE
2. `apps/web/lib/connectors/shopify.connector.ts` - KEEP FILE
3. `apps/web/lib/connectors/custom.connector.ts` - KEEP FILE

**DEPENDENCY ANALYSIS:**
- `apps/web/lib/agents/publish/publish.service.ts` - uses all 3 connectors directly
- `apps/web/lib/runtime/tasks/ampli.tasks.ts` - uses 2 connectors (dead code)

**BLOCKING REASON:** publish.service.ts (operational) calls connectors directly

**REQUIRED REFACTORING:**
1. Create runtime connectors that use these connector files internally
2. Implement runtime credential injection for CMS connectors
3. Refactor publish.service.ts to use runtime connectors
4. Remove direct connector calls from publish.service.ts

**ESTIMATED EFFORT:** 3-4 days

**PHASE:** Phase 3 (after Phase 2 complete)

---

### Blocked Group 5: Old Runtime Tables

**SYSTEM:** Alternate Runtime Schema
**TYPE:** CONFLICTING
**DEPENDENCIES:** dashboard, actions, v1 API
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BREAKAGE RISK:** HIGH

**TABLES TO DROP (BLOCKED):**
1. `agent_runs`
2. `agent_states`
3. `agent_activities`

**DEPENDENCY ANALYSIS:**
- `apps/web/lib/dashboard/index.ts` - queries agent_states, agent_activities
- `apps/web/actions/audit-log.ts` - references agent_runs, agent_states
- `apps/web/actions/verify-automation.ts` - queries agent_states
- `apps/web/app/api/v1/agent-update/route.ts` - updates agent_states, inserts agent_runs
- `apps/web/app/api/v1/orchestrator/trigger-agent/route.ts` - inserts agent_runs

**BLOCKING REASON:** Dashboard, actions, and v1 API routes depend on these tables

**REQUIRED REFACTORING:**
1. Migrate dashboard to query canonical tables (agent_executions, agent_events)
2. Refactor actions to use canonical tables
3. Refactor v1 API routes to use canonical tables
4. Drop old runtime tables

**ESTIMATED EFFORT:** 5-7 days

**PHASE:** Phase 2 (after Phase 1A.1 complete)

---

## PHASE 1A.3: PRESERVATION (Webhook Compatibility)

### Preservation Group 1: Callback API Routes

**SYSTEM:** Webhook Callback Routes
**TYPE:** PRESERVE
**PURPOSE:** Webhook bridge for external automation helpers
**AUTHORITY:** WEBHOOK-ONLY (not orchestration)

**FILES TO PRESERVE:**
1. `apps/web/app/api/integrations/callback/gsc/route.ts`
2. `apps/web/app/api/integrations/callback/openai/route.ts`
3. `apps/web/app/api/integrations/callback/cms/route.ts`
4. `apps/web/app/api/integrations/callback/gbp/route.ts`
5. `apps/web/app/api/integrations/callback/dataforseo/route.ts`

**PRESERVATION REQUIREMENT:**
- Keep webhook callback capability for external automation helpers
- Remove any orchestration logic from callbacks
- Mark as webhook-only (not for internal agent orchestration)

**MODIFICATION REQUIRED:**
- Add comments: "WEBHOOK-ONLY - Not for internal agent orchestration"
- Remove any IntegrationDispatcher references
- Remove any orchestration logic

---

### Preservation Group 2: Callback Validation Utilities

**SYSTEM:** Callback Validation
**TYPE:** PRESERVE
**PURPOSE:** Webhook validation for external automation helpers
**AUTHORITY:** WEBHOOK-ONLY (not orchestration)

**FILES TO PRESERVE:**
1. `apps/web/lib/integrations/mesh/validation/callback-continuation-validation.ts`

**PRESERVATION REQUIREMENT:**
- Keep webhook validation capability for external automation helpers
- Remove any IntegrationDispatcher references
- Remove any orchestration logic

**MODIFICATION REQUIRED:**
- Add comments: "WEBHOOK-ONLY - Not for internal agent orchestration"
- Remove any IntegrationDispatcher references
- Remove any orchestration logic

---

## REMOVAL SUMMARY

### Phase 1A.1: Immediate Removal (Safe)

| Group | System | Files | Dependencies | Risk | Status |
|-------|--------|-------|-------------|------|--------|
| 1 | Integration Mesh Orchestration | 8 files | Dead code only | NONE | READY |
| 2 | Dispatch API Routes | 5 files | Dead code only | NONE | READY |
| 3 | Deprecated Runtime Wrappers | 5 files | None | NONE | READY |
| 4 | Canonical System Agents | 2 files | None | NONE | READY |
| 5 | Unused Agent Subsystems | 7 dirs, ~20 files | None | NONE | READY |
| 6 | Agent Thinking Subsystems | 4 files | None | NONE | READY |
| 7 | Runtime Adapters | 2 files | None | NONE | READY |
| 8 | Runtime Tasks | 8 files | None | NONE | READY |
| 9 | Empty Monorepo Directories | 3 dirs | None | NONE | READY |

**TOTAL PHASE 1A.1:** 57+ files
**ESTIMATED EFFORT:** 1-2 days
**BREAKAGE RISK:** NONE

---

### Phase 1A.2: Blocked Removal (Requires Refactoring)

| Group | System | Files | Dependencies | Risk | Phase |
|-------|--------|-------|-------------|------|-------|
| 1 | Agent Runtime SDK/Database | 3 files | events, observability, workflows | HIGH | Phase 2 |
| 2 | Agent Logger | 1 file | 5 agent services | HIGH | Phase 3 |
| 3 | Direct Provider Clients | 4 files | 4 agent services | HIGH | Phase 3 |
| 4 | CMS Connectors (calls) | 3 files | publish.service.ts | MEDIUM | Phase 3 |
| 5 | Old Runtime Tables | 3 tables | dashboard, actions, v1 API | HIGH | Phase 2 |

**TOTAL PHASE 1A.2:** 14 systems
**ESTIMATED EFFORT:** 18-26 days (across Phase 2-3)
**BREAKAGE RISK:** HIGH (requires refactoring)

---

### Phase 1A.3: Preservation (Webhook Compatibility)

| Group | System | Files | Purpose | Action |
|-------|--------|-------|---------|--------|
| 1 | Callback API Routes | 5 files | Webhook bridge | PRESERVE + MODIFY |
| 2 | Callback Validation | 1 file | Webhook validation | PRESERVE + MODIFY |

**TOTAL PHASE 1A.3:** 6 files
**ESTIMATED EFFORT:** 0.5 day
**BREAKAGE RISK:** NONE

---

## REMOVAL EXECUTION ORDER

### Step 1: Remove Integration Mesh Orchestration
- Remove dispatchers, feature flags, contracts, recovery, runtime, observability
- Verify no references remain

### Step 2: Remove Dispatch API Routes
- Remove all dispatch route files
- Remove dispatch directory
- Verify no references remain

### Step 3: Remove Deprecated Runtime Wrappers
- Remove all deprecated runtime wrapper files
- Verify no references remain

### Step 4: Remove Canonical System Agents
- Remove canonical-agents.ts and types.ts
- Remove system directory
- Verify no references remain

### Step 5: Remove Unused Agent Subsystems
- Remove capabilities, governance, memory, planning, topology, registry, runtime directories
- Verify no references remain

### Step 6: Remove Agent Thinking Subsystems
- Remove all thinking.ts files
- Verify no references remain

### Step 7: Remove Runtime Adapters
- Remove openai.adapter.ts and dataforseo.adapter.ts
- Remove adapters directory
- Verify no references remain

### Step 8: Remove Runtime Tasks
- Remove all runtime task files
- Remove tasks directory
- Verify no references remain

### Step 9: Remove Empty Monorepo Directories
- Remove apps/api, agents, lib directories
- Verify directories removed

### Step 10: Modify Callback Routes (Preserve)
- Add webhook-only comments
- Remove IntegrationDispatcher references
- Remove orchestration logic

---

## FINAL VERIFICATION

After Phase 1A.1 removal, verify:

```bash
# No references to integration mesh orchestration
grep -r "IntegrationDispatcher\|ENABLE_.*_DISPATCH_EXECUTION" apps/web
# Should return nothing

# No references to dispatch routes
grep -r "integrations/dispatch" apps/web
# Should return nothing

# No references to deprecated runtime wrappers
grep -r "AgentRuntime\|LinxAgentRuntime\|ReputeAgentRuntime" apps/web
# Should return nothing

# No references to canonical system agents
grep -r "canonical-agents\|PLANNER_AGENT\|EXECUTOR_AGENT" apps/web
# Should return nothing

# No references to unused subsystems
grep -r "from.*capabilities\|from.*governance\|from.*memory\|from.*planning" apps/web/lib/agents
# Should return nothing

# No references to runtime adapters
grep -r "runtime/adapters" apps/web
# Should return nothing

# No references to runtime tasks
grep -r "runtime/tasks" apps/web
# Should return nothing
```

---

**END OF REMOVAL MAP**

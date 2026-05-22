# CLAUX DEAD SYSTEMS MAP

**Date:** 2025-01-09
**Auditor:** Cascade AI
**Scope:** Complete mapping of dead, deprecated, and unused systems in CLAUX codebase
**Phase:** Phase 1 - Architecture Purification

---

## EXECUTIVE SUMMARY

This report provides a comprehensive map of all dead, deprecated, and unused systems in the CLAUX codebase. These systems violate the principle of no dead abstractions and must be removed to achieve architectural purity.

**TOTAL DEAD SYSTEMS IDENTIFIED:** 16 major systems
**TOTAL DEAD FILES:** 60+ files
**ESTIMATED DEAD CODE LINES:** 5,000+ lines

---

## DEAD SYSTEM #1: Deprecated Runtime Wrappers

**STATUS:** DEPRECATED
**TYPE:** Runtime Abstraction
**SEVERITY:** HIGH
**FILES:** 5 files
**LINES:** ~700 lines

### Files

1. `apps/web/lib/agents/linx/runtime.ts` (116 lines)
   - **Purpose:** LINX agent runtime wrapper
   - **Status:** DEPRECATED - marked as such in file header
   - **Why Dead:** Superseded by direct ExecutionOrchestrator usage
   - **Dependencies:** RuntimeService, ExecutionOrchestrator

2. `apps/web/lib/agents/repute/runtime.ts` (253 lines)
   - **Purpose:** REPUTE agent runtime wrapper
   - **Status:** DEPRECATED - marked as such in file header
   - **Why Dead:** Superseded by direct ExecutionOrchestrator usage
   - **Dependencies:** RuntimeService, ExecutionOrchestrator

3. `apps/web/lib/agents/prism/runtime.ts` (233 lines)
   - **Purpose:** PRISM agent runtime wrapper
   - **Status:** DEPRECATED - marked as such in file header
   - **Why Dead:** Superseded by direct ExecutionOrchestrator usage
   - **Dependencies:** RuntimeService, ExecutionOrchestrator

4. `apps/web/lib/agents/locl/runtime.ts` (deprecated)
   - **Purpose:** LOCL agent runtime wrapper
   - **Status:** DEPRECATED - marked as such in file header
   - **Why Dead:** Superseded by direct ExecutionOrchestrator usage
   - **Dependencies:** RuntimeService, ExecutionOrchestrator

5. `apps/web/lib/agents/pulse/runtime.ts` (deprecated)
   - **Purpose:** PULSE agent runtime wrapper
   - **Status:** DEPRECATED - marked as such in file header
   - **Why Dead:** Superseded by direct ExecutionOrchestrator usage
   - **Dependencies:** RuntimeService, ExecutionOrchestrator

### Why This System Is Dead

- All wrappers explicitly marked as DEPRECATED in file headers
- Superseded by direct ExecutionOrchestrator usage via API routes
- Creates duplicate runtime authority
- Conflicts with principle of single canonical runtime

### Removal Impact

- **Breaking Changes:** None - these are deprecated and not used
- **Dependencies:** RuntimeService, ExecutionOrchestrator (still used elsewhere)
- **Risk:** LOW - explicitly deprecated

---

## DEAD SYSTEM #2: Canonical System Agents Abstraction

**STATUS:** DEAD
**TYPE:** Agent Abstraction
**SEVERITY:** HIGH
**FILES:** 15+ files
**LINES:** ~2,000 lines

### Files

1. `apps/web/lib/agents/system/canonical-agents.ts` (253 lines)
   - **Purpose:** Defines 9 canonical system agents (PLANNER, EXECUTOR, VALIDATOR, GOVERNOR, ANALYZER, ROUTER, SIMULATOR, RECOVERER, OBSERVER)
   - **Status:** DEAD - not used by any business agent
   - **Why Dead:** Architectural mismatch with 9 business agents (ARIA, SCRIBE, LOCL, LINX, CORE, REPUTE, AMPLI, PRISM, PULSE)
   - **Dependencies:** agents/system/types.ts

2. `apps/web/lib/agents/system/types.ts`
   - **Purpose:** Type definitions for canonical system agents
   - **Status:** DEAD - not used
   - **Why Dead:** Only used by canonical-agents.ts

3. `apps/web/lib/agents/capabilities/capability-registry.ts`
   - **Purpose:** Agent capability registry
   - **Status:** DEAD - not used by any agent
   - **Why Dead:** No agent uses capability system

4. `apps/web/lib/agents/capabilities/index.ts`
   - **Purpose:** Capability system exports
   - **Status:** DEAD - not used

5. `apps/web/lib/agents/capabilities/types.ts`
   - **Purpose:** Capability type definitions
   - **Status:** DEAD - not used

6. `apps/web/lib/agents/governance/governance-model.ts`
   - **Purpose:** Agent governance model
   - **Status:** DEAD - not used by any agent
   - **Why Dead:** No agent uses governance system

7. `apps/web/lib/agents/governance/index.ts`
   - **Purpose:** Governance system exports
   - **Status:** DEAD - not used

8. `apps/web/lib/agents/governance/types.ts`
   - **Purpose:** Governance type definitions
   - **Status:** DEAD - not used

9. `apps/web/lib/agents/memory/index.ts`
   - **Purpose:** Agent memory system
   - **Status:** DEAD - not used by any agent
   - **Why Dead:** No agent uses memory system

10. `apps/web/lib/agents/memory/memory-model.ts`
    - **Purpose:** Memory model implementation
    - **Status:** DEAD - not used

11. `apps/web/lib/agents/memory/types.ts`
    - **Purpose:** Memory type definitions
    - **Status:** DEAD - not used

12. `apps/web/lib/agents/planning/index.ts`
    - **Purpose:** Agent planning system
    - **Status:** DEAD - not used by any agent
    - **Why Dead:** No agent uses planning system

13. `apps/web/lib/agents/planning/types.ts`
    - **Purpose:** Planning type definitions
    - **Status:** DEAD - not used

14. `apps/web/lib/agents/planning/workflow-participation.ts`
    - **Purpose:** Workflow participation logic
    - **Status:** DEAD - not used

15. `apps/web/lib/agents/topology/index.ts`
    - **Purpose:** Agent topology system
    - **Status:** DEAD - not used by any agent
    - **Why Dead:** No agent uses topology system

16. `apps/web/lib/agents/topology/topology.ts`
    - **Purpose:** Topology implementation
    - **Status:** DEAD - not used

17. `apps/web/lib/agents/topology/types.ts`
    - **Purpose:** Topology type definitions
    - **Status:** DEAD - not used

### Why This System Is Dead

- Architectural mismatch: defines system agents but business agents are different
- No business agent uses any of these abstractions
- Violates principle of no dead abstractions
- Violates principle of no additional orchestration abstractions

### Removal Impact

- **Breaking Changes:** None - not used by any business agent
- **Dependencies:** None - self-contained system
- **Risk:** LOW - completely unused

---

## DEAD SYSTEM #3: Mock Provider Clients

**STATUS:** DEAD
**TYPE:** Provider Client
**SEVERITY:** CRITICAL
**FILES:** 4 files
**LINES:** ~270 lines

### Files

1. `apps/web/lib/agents/shared/dataforseo.client.ts` (55 lines)
   - **Purpose:** DataForSEO client for keyword research
   - **Status:** DEAD - returns mock data
   - **Why Dead:** Uses mock data instead of real API
   - **Used By:** aria.service.ts (direct call - violates runtime authority)

2. `apps/web/lib/agents/shared/openai.client.ts` (64 lines)
   - **Purpose:** OpenAI client for content generation
   - **Status:** DEAD - returns mock data
   - **Why Dead:** Uses mock data instead of real API
   - **Used By:** scribe.service.ts (direct call - violates runtime authority)

3. `apps/web/lib/agents/shared/serp.client.ts` (57 lines)
   - **Purpose:** SERP client for ranking tracking
   - **Status:** DEAD - returns mock data
   - **Why Dead:** Uses mock data instead of real API
   - **Used By:** pulse.service.ts (direct call - violates runtime authority)

4. `apps/web/lib/agents/shared/gmb.client.ts` (93 lines)
   - **Purpose:** GMB client for local SEO audits
   - **Status:** DEAD - has mock fallback
   - **Why Dead:** Has mock fallback instead of pure real API
   - **Used By:** locl.service.ts (direct call - violates runtime authority)

### Why This System Is Dead

- All clients use mock data or have mock fallbacks
- Violates principle of real provider execution
- Called directly by agents, violating runtime authority
- Should be replaced with runtime connectors

### Removal Impact

- **Breaking Changes:** HIGH - agents currently use these clients
- **Dependencies:** aria.service.ts, scribe.service.ts, pulse.service.ts, locl.service.ts
- **Risk:** HIGH - requires agent refactoring to use runtime connectors

---

## DEAD SYSTEM #4: Old Runtime System

**STATUS:** DEPRECATED
**TYPE:** Runtime System
**SEVERITY:** CRITICAL
**FILES:** 5+ files
**LINES:** ~500 lines

### Database Tables

1. `agent_runs` table
   - **Purpose:** Old runtime execution tracking
   - **Status:** DEPRECATED - not written to by any agent
   - **Why Dead:** Superseded by agent_executions table
   - **Used By:** Dashboard (queries this table)

2. `agent_states` table
   - **Purpose:** Old runtime state tracking
   - **Status:** DEPRECATED - not written to by any agent
   - **Why Dead:** Superseded by agent_executions table
   - **Used By:** Dashboard (queries this table)

3. `agent_activities` table
   - **Purpose:** Old runtime activity tracking
   - **Status:** DEPRECATED - not written to by any agent
   - **Why Dead:** Superseded by agent_events table
   - **Used By:** Dashboard (queries this table)

### Code Files

4. `apps/web/lib/dashboard/index.ts`
   - **Purpose:** Dashboard stats queries
   - **Status:** DEPRECATED - queries old runtime tables
   - **Why Dead:** Should query new runtime tables (agent_executions, agent_tasks, agent_events, agent_logs)

5. `apps/web/app/api/dashboard/agent-states/route.ts`
   - **Purpose:** Agent states API endpoint
   - **Status:** DEPRECATED - queries old agent_states table
   - **Why Dead:** Should query new agent_executions table

6. `apps/web/app/api/dashboard/agent-activities/route.ts`
   - **Purpose:** Agent activities API endpoint
   - **Status:** DEPRECATED - queries old agent_activities table
   - **Why Dead:** Should query new agent_events table

7. `apps/web/lib/agents/base/agent.logger.ts`
   - **Purpose:** Agent logger for old runtime
   - **Status:** DEPRECATED - writes to old runtime tables
   - **Why Dead:** Should use canonical RuntimeService (EventService, LogService)

### Why This System Is Dead

- Superseded by new runtime system (agent_executions, agent_tasks, agent_events, agent_logs)
- No agent writes to old tables
- Dashboard queries old tables, creating data inconsistency
- Violates principle of single canonical runtime

### Removal Impact

- **Breaking Changes:** HIGH - dashboard currently queries old tables
- **Dependencies:** Dashboard system, agent logger
- **Risk:** HIGH - requires dashboard migration to new runtime tables

---

## DEAD SYSTEM #5: Integration Mesh Orchestration

**STATUS:** DEAD
**TYPE:** Orchestration System
**SEVERITY:** CRITICAL
**FILES:** 8+ files
**LINES:** ~1,000 lines

### Files

1. `apps/web/lib/integrations/mesh/dispatchers/index.ts` (159 lines)
   - **Purpose:** IntegrationDispatcher for n8n orchestration
   - **Status:** DEAD - violates runtime authority
   - **Why Dead:** n8n must NEVER orchestrate agents per FINAL ARCHITECTURE
   - **Used By:** Feature flags (all disabled)

2. `apps/web/lib/integrations/mesh/feature-flags.ts` (157 lines)
   - **Purpose:** Feature flags for integration mesh
   - **Status:** DEAD - all flags disabled
   - **Why Dead:** All dispatch execution flags set to false
   - **Used By:** None (all disabled)

3. `apps/web/lib/integrations/mesh/contracts/n8n-schemas.ts`
   - **Purpose:** n8n schema contracts
   - **Status:** DEAD - not used
   - **Why Dead:** Integration mesh not used

4. `apps/web/lib/integrations/mesh/recovery/recovery-tests.ts`
   - **Purpose:** Recovery tests for integration mesh
   - **Status:** DEAD - not used
   - **Why Dead:** Integration mesh not used

5. `apps/web/lib/integrations/mesh/recovery/provider-recovery-tests.ts`
   - **Purpose:** Provider recovery tests
   - **Status:** DEAD - not used
   - **Why Dead:** Integration mesh not used

6. `apps/web/lib/integrations/mesh/runtime/state-machine.ts`
   - **Purpose:** State machine for integration mesh
   - **Status:** DEAD - not used
   - **Why Dead:** Integration mesh not used

7. `apps/web/lib/integrations/mesh/runtime/index.ts`
   - **Purpose:** Integration mesh runtime
   - **Status:** DEAD - not used
   - **Why Dead:** Integration mesh not used

8. `apps/web/lib/integrations/mesh/observability/index.ts`
   - **Purpose:** Integration mesh observability
   - **Status:** DEAD - not used
   - **Why Dead:** Integration mesh not used

### Why This System Is Dead

- Violates FINAL ARCHITECTURE: "n8n must NEVER: own executions, orchestrate agents, manage runtime state, manage execution lifecycle, act as workflow brain"
- All feature flags disabled
- No agent uses integration mesh
- n8n should only be used for webhook bridges, async utilities, external automation helpers (not orchestration)

### Removal Impact

- **Breaking Changes:** LOW - not used by any agent (all flags disabled)
- **Dependencies:** None (self-contained system)
- **Risk:** LOW - completely unused

---

## DEAD SYSTEM #6: Dispatch API Routes

**STATUS:** DEAD
**TYPE:** API Layer
**SEVERITY:** HIGH
**FILES:** 5 files
**LINES:** ~250 lines

### Files

1. `apps/web/app/api/integrations/dispatch/cms/route.ts`
   - **Purpose:** CMS dispatch API route
   - **Status:** DEAD - bypasses runtime
   - **Why Dead:** Violates runtime authority, allows direct provider access

2. `apps/web/app/api/integrations/dispatch/gsc/route.ts`
   - **Purpose:** Google Search Console dispatch API route
   - **Status:** DEAD - bypasses runtime
   - **Why Dead:** Violates runtime authority, allows direct provider access

3. `apps/web/app/api/integrations/dispatch/openai/route.ts`
   - **Purpose:** OpenAI dispatch API route
   - **Status:** DEAD - bypasses runtime
   - **Why Dead:** Violates runtime authority, allows direct provider access

4. `apps/web/app/api/integrations/dispatch/gbp/route.ts`
   - **Purpose:** Google Business Profile dispatch API route
   - **Status:** DEAD - bypasses runtime
   - **Why Dead:** Violates runtime authority, allows direct provider access

5. `apps/web/app/api/integrations/dispatch/dataforseo/route.ts`
   - **Purpose:** DataForSEO dispatch API route
   - **Status:** DEAD - bypasses runtime
   - **Why Dead:** Violates runtime authority, allows direct provider access

### Why This System Is Dead

- Violates FINAL ARCHITECTURE: "Agents MUST execute through: Runtime → Connector → Provider"
- Bypasses runtime authority
- Allows direct provider access
- Should be removed in favor of runtime task execution

### Removal Impact

- **Breaking Changes:** LOW - not used by agents (agents use direct provider calls)
- **Dependencies:** None (self-contained routes)
- **Risk:** LOW - not used

---

## DEAD SYSTEM #7: Agent Logger

**STATUS:** DEPRECATED
**TYPE:** Logging System
**SEVERITY:** HIGH
**FILES:** 1 file
**LINES:** ~100 lines

### Files

1. `apps/web/lib/agents/base/agent.logger.ts`
   - **Purpose:** Agent logger for old runtime
   - **Status:** DEPRECATED - writes to old runtime tables
   - **Why Dead:** Should use canonical RuntimeService (EventService, LogService)
   - **Used By:** aria.service.ts, scribe.service.ts, locl.service.ts, pulse.service.ts, publish.service.ts

### Why This System Is Dead

- Writes to deprecated runtime tables (agent_states, agent_activities, agent_runs)
- Should use canonical RuntimeService (EventService, LogService)
- Creates dual logging systems
- Violates principle of single canonical runtime

### Removal Impact

- **Breaking Changes:** HIGH - used by all agent services
- **Dependencies:** All agent services (.service.ts files)
- **Risk:** HIGH - requires agent refactoring to use RuntimeService

---

## DEAD SYSTEM #8: Agent Registry

**STATUS:** DEAD
**TYPE:** Agent Abstraction
**SEVERITY:** MEDIUM
**FILES:** 3 files
**LINES:** ~150 lines

### Files

1. `apps/web/lib/agents/registry/index.ts`
   - **Purpose:** Agent registry
   - **Status:** DEAD - not used by any agent
   - **Why Dead:** No agent uses registry

2. `apps/web/lib/agents/registry/observability-model.ts`
   - **Purpose:** Observability model for registry
   - **Status:** DEAD - not used

3. `apps/web/lib/agents/registry/types.ts`
   - **Purpose:** Registry type definitions
   - **Status:** DEAD - not used

### Why This System Is Dead

- No agent uses registry
- Violates principle of no dead abstractions
- Violates principle of no additional orchestration abstractions

### Removal Impact

- **Breaking Changes:** None - not used
- **Dependencies:** None (self-contained system)
- **Risk:** LOW - completely unused

---

## DEAD SYSTEM #9: Agent Runtime Subsystem

**STATUS:** DEAD
**TYPE:** Runtime Abstraction
**SEVERITY:** MEDIUM
**FILES:** 5 files
**LINES:** ~300 lines

### Files

1. `apps/web/lib/agents/runtime/execution-model.ts`
   - **Purpose:** Agent execution model
   - **Status:** DEAD - not used by any agent
   - **Why Dead:** No agent uses agent runtime subsystem

2. `apps/web/lib/agents/runtime/index.ts`
   - **Purpose:** Agent runtime exports
   - **Status:** DEAD - not used

3. `apps/web/lib/agents/runtime/state-machines.ts`
   - **Purpose:** Agent state machines
   - **Status:** DEAD - not used

4. `apps/web/lib/agents/runtime/states.ts`
   - **Purpose:** Agent state definitions
   - **Status:** DEAD - not used

5. `apps/web/lib/agents/runtime/types.ts`
   - **Purpose:** Agent runtime type definitions
   - **Status:** DEAD - not used

### Why This System Is Dead

- No agent uses agent runtime subsystem
- Canonical RuntimeService should be used instead
- Violates principle of no dead abstractions
- Violates principle of no additional orchestration abstractions

### Removal Impact

- **Breaking Changes:** None - not used
- **Dependencies:** None (self-contained system)
- **Risk:** LOW - completely unused

---

## DEAD SYSTEM #10: Agent Base Types

**STATUS:** DEAD
**TYPE:** Type System
**SEVERITY**: MEDIUM
**FILES:** 2 files
**LINES:** ~100 lines

### Files

1. `apps/web/lib/agents/base/agent.types.ts`
   - **Purpose:** Agent base types
   - **Status:** DEAD - not used by canonical runtime
   - **Why Dead:** Not used by canonical runtime

2. `apps/web/lib/agents/system/types.ts`
   - **Purpose:** System agent types
   - **Status:** DEAD - not used by business agents
   - **Why Dead:** Only used by canonical-agents.ts (which is also dead)

### Why This System Is Dead

- Not used by canonical runtime
- Not used by business agents
- Violates principle of no dead abstractions

### Removal Impact

- **Breaking Changes:** MEDIUM - used by agent services (.service.ts files)
- **Dependencies:** aria.service.ts, scribe.service.ts, locl.service.ts, pulse.service.ts, publish.service.ts
- **Risk:** MEDIUM - requires type refactoring

---

## DEAD SYSTEM #11: Runtime Adapters

**STATUS:** DEAD
**TYPE:** Provider Adapter
**SEVERITY:** MEDIUM
**FILES:** 2 files
**LINES:** ~200 lines

### Files

1. `apps/web/lib/runtime/adapters/providers/openai.adapter.ts`
   - **Purpose:** OpenAI runtime adapter
   - **Status:** DEAD - not used by any agent
   - **Why Dead:** Agents call openai.client.ts directly

2. `apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts`
   - **Purpose:** DataForSEO runtime adapter
   - **Status:** DEAD - not used by any agent
   - **Why Dead:** Agents call dataforseo.client.ts directly

### Why This System Is Dead

- Not used by any agent
- Agents call provider clients directly instead
- Violates principle of canonical execution flow
- Should either be used or removed

### Removal Impact

- **Breaking Changes:** None - not used
- **Dependencies:** None (self-contained system)
- **Risk:** LOW - completely unused

---

## DEAD SYSTEM #12: Runtime Tasks

**STATUS:** DEAD
**TYPE:** Task System
**SEVERITY:** MEDIUM
**FILES:** 8 files
**LINES:** ~800 lines

### Files

1. `apps/web/lib/runtime/tasks/aria.tasks.ts`
   - **Purpose:** ARIA runtime tasks
   - **Status:** DEAD - not used by ARIA agent
   - **Why Dead:** ARIA agent uses aria.service.ts instead

2. `apps/web/lib/runtime/tasks/scribe.tasks.ts`
   - **Purpose:** SCRIBE runtime tasks
   - **Status:** DEAD - not used by SCRIBE agent
   - **Why Dead:** SCRIBE agent uses scribe.service.ts instead

3. `apps/web/lib/runtime/tasks/locl.tasks.ts`
   - **Purpose:** LOCL runtime tasks
   - **Status:** DEAD - not used by LOCL agent
   - **Why Dead:** LOCL agent uses locl.service.ts instead

4. `apps/web/lib/runtime/tasks/linx.tasks.ts`
   - **Purpose:** LINX runtime tasks
   - **Status:** DEAD - not used by LINX agent
   - **Why Dead:** LINX agent doesn't exist

5. `apps/web/lib/runtime/tasks/repute.tasks.ts`
   - **Purpose:** REPUTE runtime tasks
   - **Status:** DEAD - not used by REPUTE agent
   - **Why Dead:** REPUTE agent doesn't exist

6. `apps/web/lib/runtime/tasks/prism.tasks.ts`
   - **Purpose:** PRISM runtime tasks
   - **Status:** DEAD - not used by PRISM agent
   - **Why Dead:** PRISM agent doesn't exist

7. `apps/web/lib/runtime/tasks/pulse.tasks.ts`
   - **Purpose:** PULSE runtime tasks
   - **Status:** DEAD - not used by PULSE agent
   - **Why Dead:** PULSE agent uses pulse.service.ts instead

8. `apps/web/lib/runtime/tasks/ampli.tasks.ts`
   - **Purpose:** AMPLI runtime tasks
   - **Status:** DEAD - not used by AMPLI agent
   - **Why Dead:** AMPLI agent uses publish.service.ts instead

### Why This System Is Dead

- Not used by any agent
- Agents use .service.ts pattern instead
- Violates principle of canonical execution flow
- Should either be used or removed

### Removal Impact

- **Breaking Changes:** None - not used
- **Dependencies:** None (self-contained system)
- **Risk:** LOW - completely unused

---

## DEAD SYSTEM #13: Agent Thinking Subsystem

**STATUS:** DEAD
**TYPE:** Agent Abstraction
**SEVERITY:** MEDIUM
**FILES:** 4 files
**LINES:** ~200 lines

### Files

1. `apps/web/lib/agents/linx/thinking.ts`
   - **Purpose:** LINX agent thinking logic
   - **Status:** DEAD - not used
   - **Why Dead:** LINX agent doesn't exist

2. `apps/web/lib/agents/locl/thinking.ts`
   - **Purpose:** LOCL agent thinking logic
   - **Status:** DEAD - not used
   - **Why Dead:** LOCL agent uses .service.ts pattern

3. `apps/web/lib/agents/prism/thinking.ts`
   - **Purpose:** PRISM agent thinking logic
   - **Status:** DEAD - not used
   - **Why Dead:** PRISM agent doesn't exist

4. `apps/web/lib/agents/pulse/thinking.ts`
   - **Purpose:** PULSE agent thinking logic
   - **Status:** DEAD - not used
   - **Why Dead:** PULSE agent uses .service.ts pattern

### Why This System Is Dead

- Not used by any agent
- Violates principle of no dead abstractions
- Violates principle of no additional orchestration abstractions

### Removal Impact

- **Breaking Changes:** None - not used
- **Dependencies:** None (self-contained system)
- **Risk:** LOW - completely unused

---

## DEAD SYSTEM #14: Integration Mesh Callback System

**STATUS:** DEAD
**TYPE:** Orchestration System
**SEVERITY:** MEDIUM
**FILES:** Unknown count
**LINES:** ~500 lines

### Files

Based on integration mesh structure, likely includes:
- `apps/web/lib/integrations/mesh/callbacks/` (if exists)
- `apps/web/lib/integrations/mesh/webhooks/` (if exists)

### Why This System Is Dead

- Integration mesh orchestration is dead (see DEAD SYSTEM #5)
- Callback system is part of integration mesh
- All feature flags disabled
- Not used by any agent

### Removal Impact

- **Breaking Changes:** LOW - not used
- **Dependencies:** Integration mesh (already dead)
- **Risk:** LOW - completely unused

---

## DEAD SYSTEM #15: Integration Mesh Validation System

**STATUS:** DEAD
**TYPE:** Validation System
**SEVERITY**: MEDIUM
**FILES:** Unknown count
**LINES**: ~200 lines

### Files

Based on integration mesh structure, likely includes:
- `apps/web/lib/integrations/mesh/validation/` (if exists)

### Why This System Is Dead

- Integration mesh orchestration is dead (see DEAD SYSTEM #5)
- Validation system is part of integration mesh
- Not used by any agent

### Removal Impact

- **Breaking Changes:** LOW - not used
- **Dependencies:** Integration mesh (already dead)
- **Risk:** LOW - completely unused

---

## DEAD SYSTEM #16: Empty Monorepo Directories

**STATUS:** DEAD
**TYPE:** Directory Structure
**SEVERITY**: LOW
**FILES:** 3 directories
**LINES**: 0 lines

### Directories

1. `apps/api/` (EMPTY)
   - **Purpose:** API app in monorepo
   - **Status:** DEAD - completely empty
   - **Why Dead:** Not used, all code in apps/web

2. `agents/` (EMPTY)
   - **Purpose:** Agents app in monorepo
   - **Status:** DEAD - completely empty
   - **Why Dead:** Not used, all agents in apps/web/lib/agents

3. `lib/` (EMPTY)
   - **Purpose:** Shared lib in monorepo
   - **Status:** DEAD - completely empty
   - **Why Dead:** Not used, all shared code in apps/web/lib

### Why This System Is Dead

- Monorepo structure not utilized
- All code in apps/web
- Violates principle of no dead abstractions

### Removal Impact

- **Breaking Changes:** None - empty directories
- **Dependencies:** None
- **Risk:** LOW - empty directories

---

## SUMMARY TABLE

| Dead System | Type | Severity | Files | Lines | Status |
|-------------|------|----------|-------|-------|--------|
| Deprecated Runtime Wrappers | Runtime Abstraction | HIGH | 5 | ~700 | DEPRECATED |
| Canonical System Agents | Agent Abstraction | HIGH | 15+ | ~2,000 | DEAD |
| Mock Provider Clients | Provider Client | CRITICAL | 4 | ~270 | DEAD |
| Old Runtime System | Runtime System | CRITICAL | 5+ | ~500 | DEPRECATED |
| Integration Mesh Orchestration | Orchestration System | CRITICAL | 8+ | ~1,000 | DEAD |
| Dispatch API Routes | API Layer | HIGH | 5 | ~250 | DEAD |
| Agent Logger | Logging System | HIGH | 1 | ~100 | DEPRECATED |
| Agent Registry | Agent Abstraction | MEDIUM | 3 | ~150 | DEAD |
| Agent Runtime Subsystem | Runtime Abstraction | MEDIUM | 5 | ~300 | DEAD |
| Agent Base Types | Type System | MEDIUM | 2 | ~100 | DEAD |
| Runtime Adapters | Provider Adapter | MEDIUM | 2 | ~200 | DEAD |
| Runtime Tasks | Task System | MEDIUM | 8 | ~800 | DEAD |
| Agent Thinking Subsystem | Agent Abstraction | MEDIUM | 4 | ~200 | DEAD |
| Integration Mesh Callback | Orchestration System | MEDIUM | Unknown | ~500 | DEAD |
| Integration Mesh Validation | Validation System | MEDIUM | Unknown | ~200 | DEAD |
| Empty Monorepo Directories | Directory Structure | LOW | 3 | 0 | DEAD |

**TOTAL DEAD SYSTEMS:** 16
**TOTAL DEAD FILES:** 60+
**TOTAL DEAD LINES:** ~5,000+

---

## REMOVAL PRIORITY

### IMMEDIATE REMOVAL (Week 1)

1. **Integration Mesh Orchestration** (CRITICAL) - Violates runtime authority
2. **Dispatch API Routes** (HIGH) - Violates runtime authority
3. **Empty Monorepo Directories** (LOW) - Easy win, no impact

### SHORT-TERM REMOVAL (Week 2)

4. **Canonical System Agents** (HIGH) - Architectural confusion
5. **Agent Registry** (MEDIUM) - Dead code
6. **Agent Runtime Subsystem** (MEDIUM) - Dead code
7. **Agent Thinking Subsystem** (MEDIUM) - Dead code
8. **Integration Mesh Callback** (MEDIUM) - Dead code
9. **Integration Mesh Validation** (MEDIUM) - Dead code
10. **Runtime Adapters** (MEDIUM) - Dead code
11. **Runtime Tasks** (MEDIUM) - Dead code
12. **Agent Capability System** (MEDIUM) - Dead code
13. **Agent Governance System** (MEDIUM) - Dead code
14. **Agent Memory System** (MEDIUM) - Dead code
15. **Agent Planning System** (MEDIUM) - Dead code
16. **Agent Topology System** (MEDIUM) - Dead code

### MEDIUM-TERM REMOVAL (Week 3-4)

17. **Deprecated Runtime Wrappers** (HIGH) - After agent migration
18. **Mock Provider Clients** (CRITICAL) - After agent migration to runtime connectors
19. **Old Runtime System** (CRITICAL) - After dashboard migration
20. **Agent Logger** (HIGH) - After agent migration to RuntimeService
21. **Agent Base Types** (MEDIUM) - After agent migration

---

## RECOMMENDATION SUMMARY

**IMMEDIATE ACTIONS:**
1. Remove integration mesh orchestration (all n8n orchestration code)
2. Remove all dispatch API routes
3. Remove empty monorepo directories

**SHORT-TERM ACTIONS:**
4. Remove canonical system agents abstraction
5. Remove all unused agent subsystems (registry, runtime, thinking, capabilities, governance, memory, planning, topology)
6. Remove integration mesh callback and validation systems
7. Remove runtime adapters and tasks (or use them)

**MEDIUM-TERM ACTIONS:**
8. Remove deprecated runtime wrappers (after agent migration)
9. Remove mock provider clients (after agent migration to runtime connectors)
10. Remove old runtime system (after dashboard migration)
11. Remove agent logger (after agent migration to RuntimeService)
12. Remove agent base types (after agent migration)

---

**END OF REPORT**

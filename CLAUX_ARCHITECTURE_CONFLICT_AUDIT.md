# CLAUX ARCHITECTURE CONFLICT AUDIT

**Date:** 2025-01-09
**Auditor:** Cascade AI
**Scope:** Complete forensic architecture conflict analysis across CLAUX codebase
**Phase:** Phase 1 - Architecture Purification

---

## EXECUTIVE SUMMARY

This report provides a comprehensive forensic architecture conflict audit of the CLAUX codebase against the FINAL CLAUX ARCHITECTURE. The investigation reveals **CRITICAL ARCHITECTURAL CONFLICTS** that violate the locked architecture principles.

**CRITICAL FINDINGS:**
- **CONFLICT #1: n8n Integration Mesh Violates Runtime Authority** - IntegrationDispatcher attempts to orchestrate via n8n, violating runtime-first principle
- **CONFLICT #2: Agents Call Provider Clients Directly** - ARIA, SCRIBE, PULSE agents bypass runtime, calling provider clients directly
- **CONFLICT #3: Deprecated Runtime Wrappers Coexist** - 5 deprecated agent runtime wrappers (LINX, REPUTE, PRISM, LOCL, PULSE) create confusion
- **CONFLICT #4: Canonical Agent Abstraction Mismatch** - 9 canonical system agents defined but 9 business agents implemented - architectural mismatch
- **CONFLICT #5: Mock Provider Clients Bypass Runtime** - 4 mock provider clients (OpenAI, DataForSEO, SERP, GMB) called directly by agents
- **CONFLICT #6: Dual Runtime Systems Coexist** - Old runtime (agent_runs, agent_states, agent_activities) and new runtime (agent_executions, agent_tasks, agent_events, agent_logs) both exist
- **CONFLICT #7: CMS Connectors Called Directly** - WordPress, Shopify, Custom connectors called directly by PUBLISH agent, bypassing runtime
- **CONFLICT #8: Integration Mesh Feature Flags Violate Authority** - Feature flags allow agents to bypass runtime and use n8n
- **CONFLICT #9: Direct API Routes Bypass Runtime** - Dispatch API routes (/api/integrations/dispatch/*) allow direct provider access
- **CONFLICT #10: Agent Service Pattern Violates Runtime** - Agent services (.service.ts) implement execution logic, should be runtime tasks

**SEVERITY:** CRITICAL - Multiple conflicts violate core architectural principles

**RISK LEVEL:** HIGH - Platform cannot scale safely with these conflicts

---

## CONFLICT #1: n8n Integration Mesh Violates Runtime Authority

**SEVERITY:** CRITICAL
**RISK LEVEL:** HIGH
**VIOLATION:** Runtime Authority

### Conflict Details

**FILE:** `apps/web/lib/integrations/mesh/dispatchers/index.ts`

**VIOLATION:**
- IntegrationDispatcher dispatches integration requests to n8n webhook
- IntegrationDispatcher manages execution receipts
- IntegrationDispatcher manages retry policy
- IntegrationDispatcher signs payloads
- This violates the principle that "Runtime is the ONLY orchestration authority"

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "n8n must NEVER: own executions, orchestrate agents, manage runtime state, manage execution lifecycle, act as workflow brain"
- IntegrationDispatcher violates this by:
  - Owning execution receipts
  - Orchestrating via n8n webhook
  - Managing retry policy
  - Acting as workflow brain

**AFFECTED SYSTEMS:**
- Integration mesh entire subsystem
- All agents with dispatch execution flags
- Feature flags system
- Callback continuation system

**FILES AFFECTED:**
- `apps/web/lib/integrations/mesh/dispatchers/index.ts` (159 lines)
- `apps/web/lib/integrations/mesh/feature-flags.ts` (157 lines)
- `apps/web/lib/integrations/mesh/contracts/n8n-schemas.ts`
- `apps/web/lib/integrations/mesh/recovery/recovery-tests.ts`
- `apps/web/lib/integrations/mesh/recovery/provider-recovery-tests.ts`
- `apps/web/lib/integrations/mesh/runtime/state-machine.ts`
- `apps/web/lib/integrations/mesh/runtime/index.ts`
- `apps/web/lib/integrations/mesh/observability/index.ts`

**RECOMMENDATION:** REMOVE n8n orchestration entirely. Keep only webhook bridge capability for external automation helpers, but never for internal agent orchestration.

---

## CONFLICT #2: Agents Call Provider Clients Directly

**SEVERITY:** CRITICAL
**RISK LEVEL:** HIGH
**VIOLATION:** Runtime Authority + Provider Access Pattern

### Conflict Details

**FILES:**
- `apps/web/lib/agents/aria/aria.service.ts` (line 9: `import { fetchKeywordsForSite, extractDomain } from "../shared/dataforseo.client";`)
- `apps/web/lib/agents/scribe/scribe.service.ts` (line 9: `import { generateArticle, estimateWordCount } from "../shared/openai.client";`)
- `apps/web/lib/agents/pulse/pulse.service.ts` (line 9: `import { fetchKeywordRank } from "../shared/serp.client";`)
- `apps/web/lib/agents/locl/locl.service.ts` (line 9: `import { fetchBusinessProfile } from "../shared/gmb.client";`)

**VIOLATION:**
- Agents call provider client functions directly
- No runtime orchestration
- No runtime credential injection
- No runtime event publishing
- No runtime logging
- Bypasses canonical execution flow: Agent → Runtime → Connector → Provider

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "Agents NEVER directly call providers"
- FINAL ARCHITECTURE states: "Agents MUST execute through: Runtime → Connector → Provider"
- FINAL ARCHITECTURE states: "Runtime credential injection is the ONLY allowed execution pattern"

**AFFECTED SYSTEMS:**
- ARIA agent execution
- SCRIBE agent execution
- PULSE agent execution
- LOCL agent execution
- Provider client layer
- Credential system

**FILES AFFECTED:**
- `apps/web/lib/agents/aria/aria.service.ts` (461 lines)
- `apps/web/lib/agents/scribe/scribe.service.ts` (468 lines)
- `apps/web/lib/agents/pulse/pulse.service.ts` (460 lines)
- `apps/web/lib/agents/locl/locl.service.ts` (440 lines)
- `apps/web/lib/agents/shared/dataforseo.client.ts` (55 lines)
- `apps/web/lib/agents/shared/openai.client.ts` (64 lines)
- `apps/web/lib/agents/shared/serp.client.ts` (57 lines)
- `apps/web/lib/agents/shared/gmb.client.ts` (93 lines)

**RECOMMENDATION:** Remove all direct provider client calls from agents. Agents must execute through runtime tasks that use runtime connectors.

---

## CONFLICT #3: Deprecated Runtime Wrappers Coexist

**SEVERITY:** HIGH
**RISK LEVEL:** MEDIUM
**VIOLATION:** Duplicate Runtime Systems

### Conflict Details

**FILES:**
- `apps/web/lib/agents/linx/runtime.ts` (116 lines)
- `apps/web/lib/agents/repute/runtime.ts` (253 lines)
- `apps/web/lib/agents/prism/runtime.ts` (233 lines)
- `apps/web/lib/agents/locl/runtime.ts` (deprecated, exists)
- `apps/web/lib/agents/pulse/runtime.ts` (deprecated, exists)

**VIOLATION:**
- Deprecated runtime wrappers coexist with canonical runtime
- Each wrapper creates its own RuntimeService instance
- Each wrapper creates its own ExecutionOrchestrator instance
- Creates confusion about which runtime to use
- Violates principle of single canonical runtime

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "The CLAUX Runtime is the ONLY orchestration authority"
- FINAL ARCHITECTURE states: "Runtime is authoritative"
- Multiple runtime wrappers create multiple authorities

**AFFECTED SYSTEMS:**
- LINX agent execution
- REPUTE agent execution
- PRISM agent execution
- LOCL agent execution
- PULSE agent execution
- Runtime system clarity

**FILES AFFECTED:**
- `apps/web/lib/agents/linx/runtime.ts` (116 lines)
- `apps/web/lib/agents/repute/runtime.ts` (253 lines)
- `apps/web/lib/agents/prism/runtime.ts` (233 lines)
- `apps/web/lib/agents/locl/runtime.ts` (deprecated)
- `apps/web/lib/agents/pulse/runtime.ts` (deprecated)

**RECOMMENDATION:** Remove all deprecated runtime wrappers. All agents must execute through canonical RuntimeService and ExecutionOrchestrator via API routes.

---

## CONFLICT #4: Canonical Agent Abstraction Mismatch

**SEVERITY:** HIGH
**RISK LEVEL:** MEDIUM
**VIOLATION:** Architectural Confusion

### Conflict Details

**FILE:** `apps/web/lib/agents/system/canonical-agents.ts` (253 lines)

**VIOLATION:**
- Defines 9 canonical system agents: PLANNER, EXECUTOR, VALIDATOR, GOVERNOR, ANALYZER, ROUTER, SIMULATOR, RECOVERER, OBSERVER
- These are abstract system agents with complex governance models
- Actual implementation has 9 business agents: ARIA, SCRIBE, LOCL, LINX, CORE, REPUTE, AMPLI, PRISM, PULSE
- Architectural mismatch between canonical system agents and business agents
- Creates confusion about agent identity and purpose

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "The 9 canonical agents are: ARIA, SCRIBE, LOCL, LINX, CORE, REPUTE, AMPLI, PRISM, PULSE"
- Canonical system agents file defines different agents
- Violates principle of single canonical agent set

**AFFECTED SYSTEMS:**
- Agent identity system
- Agent governance system
- Agent capability system
- Agent memory system
- Agent planning system

**FILES AFFECTED:**
- `apps/web/lib/agents/system/canonical-agents.ts` (253 lines)
- `apps/web/lib/agents/system/types.ts`
- `apps/web/lib/agents/capabilities/capability-registry.ts`
- `apps/web/lib/agents/capabilities/index.ts`
- `apps/web/lib/agents/capabilities/types.ts`
- `apps/web/lib/agents/governance/governance-model.ts`
- `apps/web/lib/agents/governance/index.ts`
- `apps/web/lib/agents/governance/types.ts`
- `apps/web/lib/agents/memory/index.ts`
- `apps/web/lib/agents/memory/memory-model.ts`
- `apps/web/lib/agents/memory/types.ts`
- `apps/web/lib/agents/planning/index.ts`
- `apps/web/lib/agents/planning/types.ts`
- `apps/web/lib/agents/planning/workflow-participation.ts`

**RECOMMENDATION:** Remove canonical system agents abstraction. The 9 business agents (ARIA, SCRIBE, LOCL, LINX, CORE, REPUTE, AMPLI, PRISM, PULSE) are the canonical agents.

---

## CONFLICT #5: Mock Provider Clients Bypass Runtime

**SEVERITY:** CRITICAL
**RISK LEVEL:** HIGH
**VIOLATION:** Runtime Authority + Provider Access Pattern

### Conflict Details

**FILES:**
- `apps/web/lib/agents/shared/dataforseo.client.ts` (55 lines)
- `apps/web/lib/agents/shared/openai.client.ts` (64 lines)
- `apps/web/lib/agents/shared/serp.client.ts` (57 lines)
- `apps/web/lib/agents/shared/gmb.client.ts` (93 lines)

**VIOLATION:**
- Provider clients implement mock data
- Provider clients are called directly by agents
- No runtime orchestration
- No runtime credential injection
- No runtime event publishing
- No runtime logging
- Violates canonical execution flow

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "Agents NEVER directly call providers"
- FINAL ARCHITECTURE states: "Agents MUST execute through: Runtime → Connector → Provider"
- Mock data is not a valid execution pattern for production

**AFFECTED SYSTEMS:**
- ARIA agent execution
- SCRIBE agent execution
- PULSE agent execution
- LOCL agent execution
- Provider client layer
- Credential system

**FILES AFFECTED:**
- `apps/web/lib/agents/shared/dataforseo.client.ts` (55 lines)
- `apps/web/lib/agents/shared/openai.client.ts` (64 lines)
- `apps/web/lib/agents/shared/serp.client.ts` (57 lines)
- `apps/web/lib/agents/shared/gmb.client.ts` (93 lines)

**RECOMMENDATION:** Remove all mock provider clients. Implement runtime connectors that use real provider APIs with runtime credential injection.

---

## CONFLICT #6: Dual Runtime Systems Coexist

**SEVERITY:** CRITICAL
**RISK LEVEL:** HIGH
**VIOLATION:** Duplicate Runtime Systems

### Conflict Details

**OLD RUNTIME SYSTEM (Deprecated):**
- Tables: `agent_runs`, `agent_states`, `agent_activities`
- Authentication: auth.uid() (Supabase auth)
- Tenant ID: TEXT
- Queried by: Dashboard
- Written by: Nothing (deprecated)

**NEW RUNTIME SYSTEM (Canonical):**
- Tables: `agent_executions`, `agent_tasks`, `agent_events`, `agent_logs`
- Authentication: auth.jwt() ->> 'sub' (Clerk)
- Tenant ID: UUID
- Queried by: Nothing
- Written by: Agents

**VIOLATION:**
- Two parallel runtime systems coexist
- Dashboard queries old system
- Agents write to new system
- Data inconsistency between systems
- Violates principle of single canonical runtime

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "The CLAUX Runtime is the ONLY orchestration authority"
- FINAL ARCHITECTURE states: "Runtime is authoritative"
- Dual runtime systems create dual authorities

**AFFECTED SYSTEMS:**
- Dashboard stats queries
- Agent execution tracking
- Event system
- Logging system
- Database schema

**FILES AFFECTED:**
- `apps/web/lib/dashboard/index.ts` (queries old system)
- `apps/web/app/api/dashboard/agent-states/route.ts`
- `apps/web/app/api/dashboard/agent-activities/route.ts`
- Supabase tables: agent_runs, agent_states, agent_activities
- Supabase tables: agent_executions, agent_tasks, agent_events, agent_logs

**RECOMMENDATION:** Remove old runtime system entirely. Migrate dashboard to query new runtime system. Drop old tables.

---

## CONFLICT #7: CMS Connectors Called Directly

**SEVERITY:** CRITICAL
**RISK LEVEL:** HIGH
**VIOLATION:** Runtime Authority + Provider Access Pattern

### Conflict Details

**FILES:**
- `apps/web/lib/agents/publish/publish.service.ts` (line 9-11: imports wordpress.connector, shopify.connector, custom.connector)
- `apps/web/lib/connectors/wordpress.connector.ts` (122 lines)
- `apps/web/lib/connectors/shopify.connector.ts` (115 lines)
- `apps/web/lib/connectors/custom.connector.ts` (108 lines)

**VIOLATION:**
- PUBLISH agent calls CMS connectors directly
- No runtime orchestration
- No runtime credential injection
- No runtime event publishing
- No runtime logging
- Bypasses canonical execution flow

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "Agents NEVER directly call providers"
- FINAL ARCHITECTURE states: "Agents MUST execute through: Runtime → Connector → Provider"
- CMS connectors are providers and must go through runtime

**AFFECTED SYSTEMS:**
- PUBLISH agent execution
- CMS connector layer
- Credential system
- Event system
- Logging system

**FILES AFFECTED:**
- `apps/web/lib/agents/publish/publish.service.ts` (553 lines)
- `apps/web/lib/connectors/wordpress.connector.ts` (122 lines)
- `apps/web/lib/connectors/shopify.connector.ts` (115 lines)
- `apps/web/lib/connectors/custom.connector.ts` (108 lines)

**RECOMMENDATION:** Remove direct CMS connector calls from PUBLISH agent. PUBLISH agent must execute through runtime tasks that use runtime connectors.

---

## CONFLICT #8: Integration Mesh Feature Flags Violate Authority

**SEVERITY:** CRITICAL
**RISK LEVEL:** HIGH
**VIOLATION:** Runtime Authority

### Conflict Details

**FILE:** `apps/web/lib/integrations/mesh/feature-flags.ts` (157 lines)

**VIOLATION:**
- Feature flags allow agents to bypass runtime and use n8n
- `ENABLE_*_DISPATCH_EXECUTION` flags enable n8n orchestration per agent
- `shouldUseIntegrationMesh()` function allows bypassing runtime
- `shouldFallbackToDirectProvider()` function allows direct provider access
- Violates principle that runtime is the ONLY orchestration authority

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "n8n must NEVER: own executions, orchestrate agents, manage runtime state, manage execution lifecycle, act as workflow brain"
- Feature flags allow n8n to do exactly what it must NEVER do
- Violates principle of single canonical runtime authority

**AFFECTED SYSTEMS:**
- Integration mesh entire subsystem
- All agents with dispatch execution flags
- Feature flags system
- Runtime authority

**FILES AFFECTED:**
- `apps/web/lib/integrations/mesh/feature-flags.ts` (157 lines)
- Environment variables: ENABLE_*_DISPATCH_EXECUTION

**RECOMMENDATION:** Remove all dispatch execution feature flags. Remove all integration mesh feature flags. n8n must NEVER orchestrate agents.

---

## CONFLICT #9: Direct API Routes Bypass Runtime

**SEVERITY:** HIGH
**RISK LEVEL:** MEDIUM
**VIOLATION:** Runtime Authority + Provider Access Pattern

### Conflict Details

**FILES:**
- `apps/web/app/api/integrations/dispatch/cms/route.ts`
- `apps/web/app/api/integrations/dispatch/gsc/route.ts`
- `apps/web/app/api/integrations/dispatch/openai/route.ts`
- `apps/web/app/api/integrations/dispatch/gbp/route.ts`
- `apps/web/app/api/integrations/dispatch/dataforseo/route.ts`

**VIOLATION:**
- API routes allow direct provider access
- API routes bypass runtime orchestration
- API routes bypass runtime credential injection
- API routes bypass runtime event publishing
- API routes bypass runtime logging
- Violates canonical execution flow

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "Agents MUST execute through: Runtime → Connector → Provider"
- Direct API routes allow bypassing runtime
- Violates principle of single canonical runtime authority

**AFFECTED SYSTEMS:**
- API layer
- Provider access
- Runtime authority
- Credential system

**FILES AFFECTED:**
- `apps/web/app/api/integrations/dispatch/cms/route.ts`
- `apps/web/app/api/integrations/dispatch/gsc/route.ts`
- `apps/web/app/api/integrations/dispatch/openai/route.ts`
- `apps/web/app/api/integrations/dispatch/gbp/route.ts`
- `apps/web/app/api/integrations/dispatch/dataforseo/route.ts`

**RECOMMENDATION:** Remove all dispatch API routes. All provider access must go through runtime tasks.

---

## CONFLICT #10: Agent Service Pattern Violates Runtime

**SEVERITY:** HIGH
**RISK LEVEL:** MEDIUM
**VIOLATION:** Runtime Authority

### Conflict Details

**FILES:**
- `apps/web/lib/agents/aria/aria.service.ts` (461 lines)
- `apps/web/lib/agents/scribe/scribe.service.ts` (468 lines)
- `apps/web/lib/agents/locl/locl.service.ts` (440 lines)
- `apps/web/lib/agents/pulse/pulse.service.ts` (460 lines)
- `apps/web/lib/agents/publish/publish.service.ts` (553 lines)

**VIOLATION:**
- Agent services (.service.ts) implement execution logic
- Agent services manage their own execution flow
- Agent services manage their own error handling
- Agent services manage their own logging
- Agent services manage their own database operations
- Violates principle that runtime is the ONLY orchestration authority

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "The CLAUX Runtime is the ONLY orchestration authority"
- FINAL ARCHITECTURE states: "Canonical execution flow: Agent → Runtime → Integration Adapter/Connector → Provider API → Runtime → Persistence/Event/Logging"
- Agent services implement execution logic, violating runtime authority

**AFFECTED SYSTEMS:**
- Agent execution system
- Runtime authority
- Event system
- Logging system
- Database operations

**FILES AFFECTED:**
- `apps/web/lib/agents/aria/aria.service.ts` (461 lines)
- `apps/web/lib/agents/scribe/scribe.service.ts` (468 lines)
- `apps/web/lib/agents/locl/locl.service.ts` (440 lines)
- `apps/web/lib/agents/pulse/pulse.service.ts` (460 lines)
- `apps/web/lib/agents/publish/publish.service.ts` (553 lines)

**RECOMMENDATION:** Refactor agent services to be runtime tasks. All execution logic must be in runtime tasks managed by ExecutionOrchestrator.

---

## CONFLICT #11: Agent Logger Uses Deprecated Runtime Tables

**SEVERITY:** HIGH
**RISK LEVEL:** MEDIUM
**VIOLATION:** Duplicate Runtime Systems

### Conflict Details

**FILE:** `apps/web/lib/agents/base/agent.logger.ts`

**VIOLATION:**
- Agent logger writes to deprecated runtime tables
- Functions: `updateAgentState`, `logAgentActivity`, `updateAgentRunStatus`
- Writes to agent_states, agent_activities, agent_runs
- Conflicts with new runtime system (agent_executions, agent_tasks, agent_events, agent_logs)
- Violates principle of single canonical runtime

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "The CLAUX Runtime is the ONLY orchestration authority"
- Agent logger writes to deprecated tables, creating dual runtime state
- Violates principle of single canonical runtime

**AFFECTED SYSTEMS:**
- Agent execution tracking
- Event system
- Logging system
- Database operations

**FILES AFFECTED:**
- `apps/web/lib/agents/base/agent.logger.ts`
- All agent services that use agent logger

**RECOMMENDATION:** Remove agent logger. All event publishing and logging must go through canonical RuntimeService (EventService, LogService).

---

## CONFLICT #12: Deprecated Agent Runtime Wrappers for LOCL and PULSE

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Duplicate Runtime Systems

### Conflict Details

**FILES:**
- `apps/web/lib/agents/locl/runtime.ts` (deprecated)
- `apps/web/lib/agents/pulse/runtime.ts` (deprecated)

**VIOLATION:**
- Deprecated runtime wrappers for LOCL and PULSE exist
- These agents also have .service.ts implementations
- Creates confusion about which implementation to use
- Violates principle of single canonical runtime

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "The CLAUX Runtime is the ONLY orchestration authority"
- Multiple runtime wrappers create multiple authorities
- Violates principle of single canonical runtime

**AFFECTED SYSTEMS:**
- LOCL agent execution
- PULSE agent execution
- Runtime system clarity

**FILES AFFECTED:**
- `apps/web/lib/agents/locl/runtime.ts` (deprecated)
- `apps/web/lib/agents/pulse/runtime.ts` (deprecated)

**RECOMMENDATION:** Remove deprecated runtime wrappers for LOCL and PULSE. These agents use .service.ts pattern which also violates runtime authority.

---

## CONFLICT #13: Runtime Adapters Not Used

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/runtime/adapters/providers/openai.adapter.ts`
- `apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts`

**VIOLATION:**
- Runtime adapters exist but are not used
- Agents call provider clients directly
- Adapters are dead code
- Violates principle of canonical execution flow

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "Canonical execution flow: Agent → Runtime → Integration Adapter/Connector → Provider API"
- Runtime adapters exist but agents bypass them
- Violates canonical execution flow

**AFFECTED SYSTEMS:**
- Provider access pattern
- Runtime adapter layer
- Execution flow

**FILES AFFECTED:**
- `apps/web/lib/runtime/adapters/providers/openai.adapter.ts`
- `apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts`

**RECOMMENDATION:** Either use runtime adapters or remove them. All provider access must go through runtime connectors.

---

## CONFLICT #14: Runtime Tasks Not Used by Agents

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/runtime/tasks/aria.tasks.ts`
- `apps/web/lib/runtime/tasks/scribe.tasks.ts`
- `apps/web/lib/runtime/tasks/locl.tasks.ts`
- `apps/web/lib/runtime/tasks/linx.tasks.ts`
- `apps/web/lib/runtime/tasks/repute.tasks.ts`
- `apps/web/lib/runtime/tasks/prism.tasks.ts`
- `apps/web/lib/runtime/tasks/pulse.tasks.ts`
- `apps/web/lib/runtime/tasks/ampli.tasks.ts`

**VIOLATION:**
- Runtime tasks exist but agents use .service.ts pattern
- Runtime tasks are dead code
- Violates principle of canonical execution flow

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "Canonical execution flow: Agent → Runtime → Integration Adapter/Connector → Provider API"
- Runtime tasks exist but agents bypass them
- Violates canonical execution flow

**AFFECTED SYSTEMS:**
- Agent execution system
- Runtime task system
- Execution flow

**FILES AFFECTED:**
- `apps/web/lib/runtime/tasks/aria.tasks.ts`
- `apps/web/lib/runtime/tasks/scribe.tasks.ts`
- `apps/web/lib/runtime/tasks/locl.tasks.ts`
- `apps/web/lib/runtime/tasks/linx.tasks.ts`
- `apps/web/lib/runtime/tasks/repute.tasks.ts`
- `apps/web/lib/runtime/tasks/prism.tasks.ts`
- `apps/web/lib/runtime/tasks/pulse.tasks.ts`
- `apps/web/lib/runtime/tasks/ampli.tasks.ts`

**RECOMMENDATION:** Either use runtime tasks or remove them. All agent execution must go through runtime tasks managed by ExecutionOrchestrator.

---

## CONFLICT #15: Agent Capability System Unused

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/agents/capabilities/capability-registry.ts`
- `apps/web/lib/agents/capabilities/index.ts`
- `apps/web/lib/agents/capabilities/types.ts`

**VIOLATION:**
- Agent capability system exists but is not used
- No agent uses capability registry
- Dead code
- Violates principle of no dead abstractions

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "No additional orchestration abstractions should exist"
- Capability system is an unused abstraction
- Violates principle of no dead abstractions

**AFFECTED SYSTEMS:**
- Agent capability system
- Agent governance system

**FILES AFFECTED:**
- `apps/web/lib/agents/capabilities/capability-registry.ts`
- `apps/web/lib/agents/capabilities/index.ts`
- `apps/web/lib/agents/capabilities/types.ts`

**RECOMMENDATION:** Remove agent capability system. No additional abstractions should exist.

---

## CONFLICT #16: Agent Governance System Unused

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/agents/governance/governance-model.ts`
- `apps/web/lib/agents/governance/index.ts`
- `apps/web/lib/agents/governance/types.ts`

**VIOLATION:**
- Agent governance system exists but is not used
- No agent uses governance model
- Dead code
- Violates principle of no dead abstractions

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "No additional orchestration abstractions should exist"
- Governance system is an unused abstraction
- Violates principle of no dead abstractions

**AFFECTED SYSTEMS:**
- Agent governance system
- Agent system architecture

**FILES AFFECTED:**
- `apps/web/lib/agents/governance/governance-model.ts`
- `apps/web/lib/agents/governance/index.ts`
- `apps/web/lib/agents/governance/types.ts`

**RECOMMENDATION:** Remove agent governance system. No additional abstractions should exist.

---

## CONFLICT #17: Agent Memory System Unused

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/agents/memory/index.ts`
- `apps/web/lib/agents/memory/memory-model.ts`
- `apps/web/lib/agents/memory/types.ts`

**VIOLATION:**
- Agent memory system exists but is not used
- No agent uses memory model
- Dead code
- Violates principle of no dead abstractions

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "No additional orchestration abstractions should exist"
- Memory system is an unused abstraction
- Violates principle of no dead abstractions

**AFFECTED SYSTEMS:**
- Agent memory system
- Agent system architecture

**FILES AFFECTED:**
- `apps/web/lib/agents/memory/index.ts`
- `apps/web/lib/agents/memory/memory-model.ts`
- `apps/web/lib/agents/memory/types.ts`

**RECOMMENDATION:** Remove agent memory system. No additional abstractions should exist.

---

## CONFLICT #18: Agent Planning System Unused

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/agents/planning/index.ts`
- `apps/web/lib/agents/planning/types.ts`
- `apps/web/lib/agents/planning/workflow-participation.ts`

**VIOLATION:**
- Agent planning system exists but is not used
- No agent uses planning system
- Dead code
- Violates principle of no dead abstractions

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "No additional orchestration abstractions should exist"
- Planning system is an unused abstraction
- Violates principle of no dead abstractions

**AFFECTED SYSTEMS:**
- Agent planning system
- Agent system architecture

**FILES AFFECTED:**
- `apps/web/lib/agents/planning/index.ts`
- `apps/web/lib/agents/planning/types.ts`
- `apps/web/lib/agents/planning/workflow-participation.ts`

**RECOMMENDATION:** Remove agent planning system. No additional abstractions should exist.

---

## CONFLICT #19: Agent Topology System Unused

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/agents/topology/index.ts`
- `apps/web/lib/agents/topology/topology.ts`
- `apps/web/lib/agents/topology/types.ts`

**VIOLATION:**
- Agent topology system exists but is not used
- No agent uses topology system
- Dead code
- Violates principle of no dead abstractions

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "No additional orchestration abstractions should exist"
- Topology system is an unused abstraction
- Violates principle of no dead abstractions

**AFFECTED SYSTEMS:**
- Agent topology system
- Agent system architecture

**FILES AFFECTED:**
- `apps/web/lib/agents/topology/index.ts`
- `apps/web/lib/agents/topology/topology.ts`
- `apps/web/lib/agents/topology/types.ts`

**RECOMMENDATION:** Remove agent topology system. No additional abstractions should exist.

---

## CONFLICT #20: Agent Registry Unused

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/agents/registry/index.ts`
- `apps/web/lib/agents/registry/observability-model.ts`
- `apps/web/lib/agents/registry/types.ts`

**VIOLATION:**
- Agent registry exists but is not used
- No agent uses registry
- Dead code
- Violates principle of no dead abstractions

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "No additional orchestration abstractions should exist"
- Registry is an unused abstraction
- Violates principle of no dead abstractions

**AFFECTED SYSTEMS:**
- Agent registry system
- Agent system architecture

**FILES AFFECTED:**
- `apps/web/lib/agents/registry/index.ts`
- `apps/web/lib/agents/registry/observability-model.ts`
- `apps/web/lib/agents/registry/types.ts`

**RECOMMENDATION:** Remove agent registry. No additional abstractions should exist.

---

## CONFLICT #21: Agent Runtime Subsystem Unused

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/agents/runtime/execution-model.ts`
- `apps/web/lib/agents/runtime/index.ts`
- `apps/web/lib/agents/runtime/state-machines.ts`
- `apps/web/lib/agents/runtime/states.ts`
- `apps/web/lib/agents/runtime/types.ts`

**VIOLATION:**
- Agent runtime subsystem exists but is not used
- No agent uses agent runtime subsystem
- Dead code
- Violates principle of no dead abstractions

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "No additional orchestration abstractions should exist"
- Agent runtime subsystem is an unused abstraction
- Violates principle of no dead abstractions

**AFFECTED SYSTEMS:**
- Agent runtime subsystem
- Agent system architecture

**FILES AFFECTED:**
- `apps/web/lib/agents/runtime/execution-model.ts`
- `apps/web/lib/agents/runtime/index.ts`
- `apps/web/lib/agents/runtime/state-machines.ts`
- `apps/web/lib/agents/runtime/states.ts`
- `apps/web/lib/agents/runtime/types.ts`

**RECOMMENDATION:** Remove agent runtime subsystem. No additional abstractions should exist.

---

## CONFLICT #22: Agent Base Types Unused

**SEVERITY:** MEDIUM
**RISK LEVEL:** LOW
**VIOLATION:** Dead Code

### Conflict Details

**FILES:**
- `apps/web/lib/agents/base/agent.types.ts`
- `apps/web/lib/agents/system/types.ts`

**VIOLATION:**
- Agent base types exist but are not used by canonical runtime
- Agent system types exist but are not used by business agents
- Dead code
- Violates principle of no dead abstractions

**WHY THIS VIOLATES FINAL ARCHITECTURE:**
- FINAL ARCHITECTURE states: "No additional orchestration abstractions should exist"
- Agent base types are unused abstractions
- Violates principle of no dead abstractions

**AFFECTED SYSTEMS:**
- Agent type system
- Agent system architecture

**FILES AFFECTED:**
- `apps/web/lib/agents/base/agent.types.ts`
- `apps/web/lib/agents/system/types.ts`

**RECOMMENDATION:** Remove unused agent base types. No additional abstractions should exist.

---

## SUMMARY TABLE

| Conflict # | Severity | Risk Level | Violation | Files Affected |
|------------|----------|------------|-----------|----------------|
| 1 | CRITICAL | HIGH | Runtime Authority | 10+ files |
| 2 | CRITICAL | HIGH | Runtime Authority + Provider Access | 8 files |
| 3 | HIGH | MEDIUM | Duplicate Runtime Systems | 5 files |
| 4 | HIGH | MEDIUM | Architectural Confusion | 15+ files |
| 5 | CRITICAL | HIGH | Runtime Authority + Provider Access | 4 files |
| 6 | CRITICAL | HIGH | Duplicate Runtime Systems | 5+ files |
| 7 | CRITICAL | HIGH | Runtime Authority + Provider Access | 4 files |
| 8 | CRITICAL | HIGH | Runtime Authority | 1 file + env vars |
| 9 | HIGH | MEDIUM | Runtime Authority + Provider Access | 5 files |
| 10 | HIGH | MEDIUM | Runtime Authority | 5 files |
| 11 | HIGH | MEDIUM | Duplicate Runtime Systems | 1 file |
| 12 | MEDIUM | LOW | Duplicate Runtime Systems | 2 files |
| 13 | MEDIUM | LOW | Dead Code | 2 files |
| 14 | MEDIUM | LOW | Dead Code | 8 files |
| 15 | MEDIUM | LOW | Dead Code | 3 files |
| 16 | MEDIUM | LOW | Dead Code | 3 files |
| 17 | MEDIUM | LOW | Dead Code | 3 files |
| 18 | MEDIUM | LOW | Dead Code | 3 files |
| 19 | MEDIUM | LOW | Dead Code | 3 files |
| 20 | MEDIUM | LOW | Dead Code | 3 files |
| 21 | MEDIUM | LOW | Dead Code | 5 files |
| 22 | MEDIUM | LOW | Dead Code | 2 files |

**TOTAL CONFLICTS:** 22
**CRITICAL CONFLICTS:** 8
**HIGH CONFLICTS:** 6
**MEDIUM CONFLICTS:** 8

---

## RECOMMENDATION SUMMARY

**IMMEDIATE ACTIONS (CRITICAL):**
1. Remove n8n orchestration from IntegrationDispatcher
2. Remove all direct provider client calls from agents
3. Remove all deprecated runtime wrappers
4. Remove canonical system agents abstraction
5. Remove all mock provider clients
6. Remove old runtime system entirely
7. Remove direct CMS connector calls from agents
8. Remove all integration mesh feature flags

**SHORT-TERM ACTIONS (HIGH):**
9. Remove all dispatch API routes
10. Refactor agent services to runtime tasks
11. Remove agent logger

**MEDIUM-TERM ACTIONS (MEDIUM):**
12. Remove deprecated runtime wrappers for LOCL and PULSE
13. Remove or use runtime adapters
14. Remove or use runtime tasks
15. Remove agent capability system
16. Remove agent governance system
17. Remove agent memory system
18. Remove agent planning system
19. Remove agent topology system
20. Remove agent registry
21. Remove agent runtime subsystem
22. Remove unused agent base types

---

**END OF REPORT**

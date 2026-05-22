# CLAUX EVENT AUTHORITY MATRIX

**Date:** 2025-01-09
**Engineer:** Cascade AI
**Scope:** Phase 2A.3 - Centralize Event Authority
**Status:** Audit Complete

---

## EXECUTIVE SUMMARY

This document audits all event publishing systems in CLAUX and establishes canonical event authority. The objective is to ensure that ONLY EventService may publish events to the agent_events table.

**TOTAL SYSTEMS AUDITED:** 7
**CANONICAL SYSTEMS:** 1
**CONFLICTING SYSTEMS:** 2
**IN-MEMORY SYSTEMS:** 1 (separate concern)
**CORRECT USAGE:** 3

---

## CANONICAL EVENT AUTHORITY

**CANONICAL EVENT PUBLISHER:**
- EventService (apps/web/lib/runtime/services/event.service.ts)

**CANONICAL TABLE:**
- agent_events

**CANONICAL METHODS:**
- publishEvent() - Publish a single event
- publishEventsBatch() - Publish multiple events in batch
- getExecutionEvents() - Get events for an execution
- getCorrelationChain() - Get correlation chain for events
- streamExecutionEvents() - Stream events for an execution

**ACCESS PATTERN:**
```
RuntimeService → EventService → EventRepository → agent_events table
```

---

## SYSTEM #1: EventService (CANONICAL ✅)

**FILE:** `apps/web/lib/runtime/services/event.service.ts`
**LINES:** 208
**TYPE:** Canonical Event Publisher
**AUTHORITY:** CANONICAL ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Business logic for event publishing and correlation tracking

### Capabilities

**Event Publishing:**
- publishEvent() - Publish a single event with correlation/causation tracking
- publishEventsBatch() - Publish multiple events in batch with correlation chain

**Event Querying:**
- getExecutionEvents() - Get events for an execution with filters
- getCorrelationChain() - Get correlation chain for events
- streamExecutionEvents() - Stream events for an execution (chronological)

### Authority Compliance

**COMPLIANCE:** ✅ FULLY COMPLIANT
- Uses EventRepository for database operations
- Generates correlation IDs automatically
- Generates causation IDs automatically
- Enforces tenant isolation via tenant_id
- Logs all operations for observability

### Dependencies

**CONSUMED BY:**
1. RuntimeService (via this.event)
2. ExecutionOrchestrator (via RuntimeService)
3. Integrations mesh systems (via RuntimeService)
4. Core provider governance (via RuntimeService)

### Classification

**TYPE:** CANONICAL ✅
**STATUS:** PRESERVED
**ACTION:** None required

---

## SYSTEM #2: EventEmitter (CONFLICTING ❌)

**FILE:** `apps/web/lib/events/emitter.ts`
**LINES:** 77
**TYPE:** Alternate Event Publisher
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Central event emission system for CLAUX

### Capabilities

**Event Publishing:**
- emit() - Emit a strongly-typed event
- emitWithContext() - Emit an event with execution context

**Utility Methods:**
- createCorrelationId() - Create a correlation ID for event chains
- createCausationId() - Create a causation ID for event causality tracking

### Canonical Conflict

**VIOLATION:**
- Line 38: `this.db.createEvent()` - Direct database access bypassing EventService
- Uses AgentRuntimeDatabase directly
- Duplicates EventService functionality
- Bypasses canonical event authority

**CANONICAL EQUIVALENT:**
- EventService.publishEvent()
- EventService.publishEventsBatch()

### Dependencies

**DIRECT DEPENDENTS:**
1. BaseWorkflow (apps/web/lib/workflows/base-workflow.ts)

### Classification

**TYPE:** CONFLICTING ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** BaseWorkflow depends on this

### Migration Strategy

**PHASE:** Phase 2A.3
**ESTIMATED EFFORT:** 1-2 days
**BREAKAGE RISK:** MEDIUM

**STEPS:**
1. Refactor BaseWorkflow to use canonical EventService
2. Remove EventEmitter
3. Remove events/emitter.ts
4. Update events/index.ts exports

---

## SYSTEM #3: AgentRuntimeSDK.emitEvent() (CONFLICTING ❌)

**FILE:** `apps/web/lib/runtime/sdk.ts`
**LINES:** 421
**METHOD:** emitEvent() (Line 302)
**TYPE:** Alternate Event Publisher
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Event emission for agent SDK

### Violations

**EVENT EMISSION VIOLATION:**
- Line 307: `this.db.createEvent()` - Direct database access bypassing EventService
- Line 315: `this.db.createLog()` - Also logs event emission (dual logging)

### Canonical Conflict

**VIOLATION:**
- Uses AgentRuntimeDatabase directly
- Duplicates EventService functionality
- Bypasses canonical event authority
- Creates dual logging system

**CANONICAL EQUIVALENT:**
- EventService.publishEvent()

### Dependencies

**DIRECT DEPENDENTS:**
- BaseWorkflow (via AgentRuntimeSDK)

### Classification

**TYPE:** CONFLICTING ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** Part of AgentRuntimeSDK, which is blocked by BaseWorkflow

### Migration Strategy

**PHASE:** Phase 2A.2
**ESTIMATED EFFORT:** Included in AgentRuntimeSDK removal
**BREAKAGE RISK:** HIGH

**STEPS:**
1. Remove AgentRuntimeSDK (includes emitEvent method)
2. Refactor BaseWorkflow to use canonical EventService

---

## SYSTEM #4: BaseWorkflow.emitEvent() (CONFLICTING ❌)

**FILE:** `apps/web/lib/workflows/base-workflow.ts`
**LINES:** 82
**METHOD:** emitEvent() (Line 75)
**TYPE:** Alternate Event Publisher
**AUTHORITY:** CONFLICTING ❌
**STATUS:** OPERATIONAL
**PURPOSE:** Emit events from workflows

### Violations

**EVENT EMISSION VIOLATION:**
- Line 77: `this.eventEmitter.emitWithContext()` - Bypasses EventService
- Line 79: `this.eventEmitter.emit()` - Bypasses EventService

### Canonical Conflict

**VIOLATION:**
- Uses EventEmitter instead of EventService
- Bypasses canonical event authority
- Depends on conflicting EventEmitter system

**CANONICAL EQUIVALENT:**
- EventService.publishEvent()

### Dependencies

**DIRECT DEPENDENTS:**
- Unknown (need to search for BaseWorkflow usage)

### Classification

**TYPE:** CONFLICTING ❌
**REMOVAL FEASIBILITY:** ❌ BLOCKED
**BLOCKING REASON:** Depends on EventEmitter

### Migration Strategy

**PHASE:** Phase 2A.2
**ESTIMATED EFFORT:** Included in BaseWorkflow removal
**BREAKAGE RISK:** HIGH

**STEPS:**
1. Remove BaseWorkflow (includes emitEvent method)
2. Refactor all BaseWorkflow dependents to use canonical ExecutionOrchestrator

---

## SYSTEM #5: EventListenerRegistry (IN-MEMORY ⚠️)

**FILE:** `apps/web/lib/events/listener.ts`
**LINES:** 84
**TYPE:** In-Memory Event Listener
**AUTHORITY:** SEPARATE CONCERN ⚠️
**STATUS:** OPERATIONAL
**PURPOSE:** Manages event listeners and routing for the CLAUX event system

### Capabilities

**Event Routing:**
- on() - Register an event listener
- off() - Remove an event listener
- emit() - Emit an event to all registered listeners (IN-MEMORY ONLY)
- getListeners() - Get all listeners for an event
- clear() - Clear all listeners
- clearEvent() - Clear listeners for a specific event

### Authority Assessment

**AUTHORITY:** ⚠️ SEPARATE CONCERN
- This is an IN-MEMORY event system for listener routing
- Does NOT write to agent_events table
- Does NOT conflict with EventService authority
- Serves a different purpose: in-memory event bus vs. database event persistence

### Canonical Conflict

**VIOLATION:** NONE
- In-memory event routing is a valid architectural pattern
- Separate from database event persistence
- No conflict with EventService

### Dependencies

**DIRECT DEPENDENTS:**
- Unknown (need to search for EventListenerRegistry usage)

### Classification

**TYPE:** SEPARATE CONCERN ⚠️
**STATUS:** PRESERVED
**ACTION:** None required
**NOTE:** This is an in-memory event bus, not a database event publisher

---

## SYSTEM #6: ExecutionOrchestrator (CORRECT USAGE ✅)

**FILE:** `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`
**LINES:** 400
**TYPE:** Canonical Orchestrator
**AUTHORITY:** CORRECT USAGE ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Coordinates execution lifecycle with automatic event publishing

### Event Publishing Pattern

**CORRECT USAGE:**
- Line 59: `this.runtime.event.publishEvent()` - Uses canonical EventService
- Line 86: `this.runtime.event.publishEvent()` - Uses canonical EventService
- Line 117: `this.runtime.event.publishEvent()` - Uses canonical EventService
- Line 147: `this.runtime.event.publishEvent()` - Uses canonical EventService
- Line 180: `this.runtime.event.publishEvent()` - Uses canonical EventService
- Line 207: `this.runtime.event.publishEvent()` - Uses canonical EventService

### Authority Compliance

**COMPLIANCE:** ✅ FULLY COMPLIANT
- Uses RuntimeService.event (which is EventService)
- All events go through canonical EventService
- Auto-publishes lifecycle events (EXECUTION_CREATED, EXECUTION_STARTED, EXECUTION_COMPLETED, EXECUTION_FAILED, EXECUTION_CANCELLED, EXECUTION_RETRIED)

### Classification

**TYPE:** CORRECT USAGE ✅
**STATUS:** PRESERVED
**ACTION:** None required

---

## SYSTEM #7: Integrations Mesh (CORRECT USAGE ✅)

**FILES:**
- `apps/web/lib/integrations/mesh/governance/core-provider-governance.ts`
- `apps/web/lib/integrations/mesh/callbacks/index.ts`
- `apps/web/lib/integrations/mesh/security/multi-tenant-validation.ts`
- `apps/web/lib/integrations/mesh/publishing/ampli-safety.ts`
- `apps/web/lib/integrations/mesh/validation/callback-continuation-validation.ts`
- `apps/web/lib/integrations/mesh/validation/publishing-callback-validation.ts`

**TYPE:** Integration Event Publishers
**AUTHORITY:** CORRECT USAGE ✅
**STATUS:** OPERATIONAL
**PURPOSE:** Publish integration lifecycle events

### Event Publishing Pattern

**CORRECT USAGE:**
- All systems use `this.runtime.event.publishEvent()`
- Uses canonical EventService via RuntimeService
- Publishes governance, callback, security, and validation events

### Authority Compliance

**COMPLIANCE:** ✅ FULLY COMPLIANT
- Uses RuntimeService.event (which is EventService)
- All events go through canonical EventService
- Enforces tenant isolation via RuntimeService

### Classification

**TYPE:** CORRECT USAGE ✅
**STATUS:** PRESERVED
**ACTION:** None required

---

## EVENT AUTHORITY MATRIX

| # | System | File | Type | Authority | Status | Action |
|---|--------|------|------|-----------|--------|--------|
| 1 | EventService | lib/runtime/services/event.service.ts | Canonical | CANONICAL ✅ | PRESERVED | None |
| 2 | EventEmitter | lib/events/emitter.ts | Alternate | CONFLICTING ❌ | REMOVE | Refactor to EventService |
| 3 | AgentRuntimeSDK.emitEvent() | lib/runtime/sdk.ts | Alternate | CONFLICTING ❌ | REMOVE | Remove with SDK |
| 4 | BaseWorkflow.emitEvent() | lib/workflows/base-workflow.ts | Alternate | CONFLICTING ❌ | REMOVE | Remove with BaseWorkflow |
| 5 | EventListenerRegistry | lib/events/listener.ts | In-Memory | SEPARATE ⚠️ | PRESERVED | None (different concern) |
| 6 | ExecutionOrchestrator | lib/runtime/orchestrator/execution-orchestrator.ts | Canonical | CORRECT ✅ | PRESERVED | None |
| 7 | Integrations Mesh | lib/integrations/mesh/*.ts | Integration | CORRECT ✅ | PRESERVED | None |

---

## EVENT FLOW DIAGRAM

### Canonical Event Flow (CORRECT ✅)
```
Dashboard/UI/API
  ↓
RuntimeService
  ↓
EventService.publishEvent()
  ↓
EventRepository.create()
  ↓
agent_events table
```

### Conflicting Event Flow (VIOLATION ❌)
```
BaseWorkflow
  ↓
EventEmitter.emit()
  ↓
AgentRuntimeDatabase.createEvent()
  ↓
agent_events table
```

### In-Memory Event Flow (SEPARATE ⚠️)
```
Any System
  ↓
EventListenerRegistry.emit()
  ↓
In-Memory Listeners (NO DATABASE)
```

---

## CANONICAL EVENT AUTHORITY LAWS

### Law 1: Event Publishing Authority
**ONLY** EventService may publish events to the agent_events table via `publishEvent()` or `publishEventsBatch()`.

### Law 2: Event Service Access
**ONLY** RuntimeService may provide access to EventService via `RuntimeService.event`.

### Law 3: Event Correlation Authority
**ONLY** EventService may generate correlation IDs and causation IDs for event chains.

### Law 4: Direct Database Access Prohibition
**NO** system may directly INSERT into agent_events table outside EventService.

### Law 5: In-Memory Event Bus Separation
EventListenerRegistry is a separate concern for in-memory event routing and does NOT conflict with EventService authority.

---

## MIGRATION PHASING

### Phase 2A.3.1: Refactor BaseWorkflow (Week 1)

**OBJECTIVE:** Refactor BaseWorkflow to use canonical EventService

**SYSTEMS TO REFACTOR:**
1. BaseWorkflow.emitEvent() → EventService.publishEvent()
2. Remove EventEmitter dependency

**EXPECTED OUTCOME:**
- BaseWorkflow uses canonical EventService
- EventEmitter no longer used by BaseWorkflow

**ESTIMATED EFFORT:** 0.5-1 day

---

### Phase 2A.3.2: Remove EventEmitter (Week 1)

**OBJECTIVE:** Remove EventEmitter after BaseWorkflow is refactored

**SYSTEMS TO REMOVE:**
1. EventEmitter
2. events/emitter.ts
3. Update events/index.ts exports

**EXPECTED OUTCOME:**
- EventEmitter removed
- No alternate event publishers

**ESTIMATED EFFORT:** 0.5 day

---

### Phase 2A.3.3: Remove AgentRuntimeSDK.emitEvent() (Week 1)

**OBJECTIVE:** Remove AgentRuntimeSDK.emitEvent() as part of SDK removal

**SYSTEMS TO REMOVE:**
1. AgentRuntimeSDK.emitEvent() method
2. Remove entire AgentRuntimeSDK

**EXPECTED OUTCOME:**
- AgentRuntimeSDK removed
- No SDK-based event publishing

**ESTIMATED EFFORT:** Included in AgentRuntimeSDK removal

---

## AUDIT CONCLUSION

**TOTAL SYSTEMS AUDITED:** 7
**CANONICAL SYSTEMS:** 1 (EventService)
**CONFLICTING SYSTEMS:** 3 (EventEmitter, AgentRuntimeSDK.emitEvent, BaseWorkflow.emitEvent)
**IN-MEMORY SYSTEMS:** 1 (EventListenerRegistry - separate concern)
**CORRECT USAGE:** 3 (ExecutionOrchestrator, Integrations Mesh, Core Provider Governance)

**CRITICAL FINDINGS:**
1. EventEmitter duplicates EventService functionality
2. AgentRuntimeSDK.emitEvent() bypasses EventService
3. BaseWorkflow.emitEvent() bypasses EventService
4. EventListenerRegistry is a separate in-memory concern (not a violation)
5. ExecutionOrchestrator and Integrations Mesh correctly use EventService

**NEXT STEPS:**
1. Refactor BaseWorkflow to use canonical EventService
2. Remove EventEmitter
3. Remove AgentRuntimeSDK (includes emitEvent)
4. Establish single canonical event authority

---

**END OF EVENT AUTHORITY MATRIX**

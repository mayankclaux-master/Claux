# CLAUX ARIA Contract Discovery Report

**Report Date:** 2025-01-19
**Task:** TASK I.1 - DISCOVER ALL EXISTING CONTRACT SYSTEMS
**Status:** COMPLETED

## Executive Summary

This report provides a comprehensive discovery of all existing contract systems in the CLAUX codebase. The investigation identifies canonical contracts, deprecated contracts, duplicate systems, and architectural conflicts that must be resolved before ARIA operationalization.

**CONTRACT DISCOVERY STATUS:** ✅ COMPLETED

---

## Contract Systems Inventory

### Canonical Runtime Contracts

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Location:** `apps/web/lib/runtime/contracts/`

**Files:**
1. `task.contract.ts` - Canonical runtime task contract
2. `execution.contract.ts` - Canonical execution contract
3. `provider-response.contract.ts` - Canonical provider response contract
4. `provider-error.contract.ts` - Canonical provider error contract
5. `execution-result.contract.ts` - Canonical execution result contract

**Ownership:** RuntimeService
**Purpose:** Define canonical interfaces for runtime execution
**Status:** NON-NEGOTIABLE - MUST BE USED

---

### Extended Runtime Contracts

**Status:** ⚠️ EXTENDED (USE WITH CAUTION)

**Location:** `apps/web/lib/runtime/contracts/`

**Files:**
6. `recovery.contract.ts` - Recovery state machine contract
7. `checkpoint.contract.ts` - Checkpoint contract
8. `state-machine.contract.ts` - State machine contract
9. `resource.contract.ts` - Resource contract
10. `worker.contract.ts` - Worker contract
11. `event.contract.ts` - Event contract
12. `determinism.contract.ts` - Determinism contract
13. `runtime-identity.contract.ts` - Runtime identity contract
14. `stream.contract.ts` - Stream contract
15. `runtime-errors.contract.ts` - Runtime errors contract
16. `capability.contract.ts` - Capability contract
17. `coordination.contract.ts` - Coordination contract
18. `scheduling.contract.ts` - Scheduling contract
19. `version.contract.ts` - Version contract

**Ownership:** Runtime distributed systems
**Purpose:** Extended runtime capabilities (distributed, temporal, scaling)
**Status:** USE WITH CAUTION - NOT REQUIRED FOR ARIA

---

### Cross-System Contracts

**Status:** ⚠️ CROSS-SYSTEM (USE WITH CAUTION)

**Location:** Various directories

**Files:**
20. `apps/web/lib/runtime/governance/policy-contracts.ts` - Policy contracts
21. `apps/web/lib/runtime/integration/contract-conformance.ts` - Contract conformance
22. `apps/web/lib/runtime/persistence/persistence-contracts.ts` - Persistence contracts
23. `apps/web/lib/runtime/sdk/sdk-contracts.ts` - SDK contracts
24. `apps/web/lib/runtime/telemetry/telemetry-contracts.ts` - Telemetry contracts
25. `apps/web/lib/runtime/testing/chaos-contracts.ts` - Chaos contracts

**Ownership:** Various runtime subsystems
**Purpose:** Cross-system integration contracts
**Status:** USE WITH CAUTION - NOT REQUIRED FOR ARIA

---

## Type Systems Inventory

### Runtime Type Systems

**Status:** ✅ CANONICAL

**Location:** `apps/web/lib/runtime/types/`

**Files:**
1. `common.types.ts` - Common runtime types (UUID, ISODateTime, Result)
2. `task.types.ts` - Task types (Task, TaskInsert, TaskUpdate, TaskFilter, TaskStats)
3. `execution.types.ts` - Execution types (Execution, ExecutionInsert, ExecutionUpdate, ExecutionFilter, ExecutionStats)
4. `event.types.ts` - Event types
5. `log.types.ts` - Log types

**Ownership:** RuntimeService
**Purpose:** Define canonical type definitions for runtime tables
**Status:** NON-NEGOTIABLE - MUST BE USED

---

### Agent Type Systems

**Status:** ✅ CANONICAL

**Location:** `apps/web/lib/agents/base/`

**Files:**
1. `agent.types.ts` - Agent types (AgentName, AgentContext)

**Ownership:** Agent layer
**Purpose:** Define agent-specific type definitions
**Status:** NON-NEGOTIABLE - MUST BE USED

---

### Workflow Type Systems

**Status:** ⚠️ WORKFLOW-SPECIFIC (USE WITH CAUTION)

**Location:** `apps/web/lib/runtime/workflows/`

**Files:**
1. `types.ts` - Workflow types (TaskDefinition, WorkflowDefinition)

**Ownership:** Workflow system
**Purpose:** Define workflow-specific type definitions
**Status:** USE WITH CAUTION - MAY CONFLICT WITH RUNTIME TASK CONTRACTS

---

## Task Systems Inventory

### Canonical Task System

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Location:** `apps/web/lib/runtime/`

**Files:**
1. `contracts/task.contract.ts` - Canonical task contract
2. `types/task.types.ts` - Database schema types
3. `repositories/task.repository.ts` - Task repository
4. `services/task.service.ts` - Task service

**Table:** `agent_tasks`
**Ownership:** RuntimeService
**Purpose:** Canonical task lifecycle management
**Status:** NON-NEGOTIABLE - MUST BE USED

---

### Workflow Task System

**Status:** ⚠️ WORKFLOW-SPECIFIC (POTENTIAL CONFLICT)

**Location:** `apps/web/lib/runtime/workflows/`

**Files:**
1. `types.ts` - Workflow task definitions
2. `aria.workflow.ts` - ARIA workflow definition
3. `scribe.workflow.ts` - SCRIBE workflow definition

**Ownership:** Workflow system
**Purpose:** Define workflow-specific task definitions
**Status:** POTENTIAL CONFLICT - MAY DUPLICATE CANONICAL TASK CONTRACTS

---

## Execution Systems Inventory

### Canonical Execution System

**Status:** ✅ CANONICAL (NON-NEGOTIABLE)

**Location:** `apps/web/lib/runtime/`

**Files:**
1. `contracts/execution.contract.ts` - Canonical execution contract
2. `types/execution.types.ts` - Execution types
3. `repositories/execution.repository.ts` - Execution repository
4. `services/execution.service.ts` - Execution service
5. `orchestrator/execution-orchestrator.ts` - Execution orchestrator

**Table:** `agent_executions`
**Ownership:** RuntimeService
**Purpose:** Canonical execution lifecycle management
**Status:** NON-NEGOTIABLE - MUST BE USED

---

### Extended Execution Systems

**Status:** ⚠️ EXTENDED (USE WITH CAUTION)

**Location:** `apps/web/lib/runtime/execution/`

**Files:**
1. `execution.facade.ts` - Execution facade
2. `engine/execution-loop.ts` - Execution loop
3. `engine/task-dispatcher.ts` - Task dispatcher
4. `runtime/execution-runtime.ts` - Execution runtime
5. `scheduler/execution-window.ts` - Execution window
6. `state/execution-state-machine.ts` - Execution state machine
7. `state/task-state-machine.ts` - Task state machine
8. `timeline.ts` - Execution timeline

**Ownership:** Extended runtime systems
**Purpose:** Extended execution capabilities (temporal, distributed, scaling)
**Status:** USE WITH CAUTION - NOT REQUIRED FOR ARIA

---

## ARIA-Specific Systems

### ARIA Workflow Definition

**Status:** ⚠️ WORKFLOW-SPECIFIC (POTENTIAL CONFLICT)

**Location:** `apps/web/lib/runtime/workflows/aria.workflow.ts`

**Content:**
- Workflow definition with 10 tasks
- Task dependencies and retry policies
- Input/output schemas
- Execution configuration

**Ownership:** Workflow system
**Purpose:** Define ARIA workflow
**Status:** POTENTIAL CONFLICT - MAY DUPLICATE CANONICAL TASK CONTRACTS

---

### ARIA Service Implementation

**Status:** ⚠️ PARTIAL (MOCKED EXECUTION)

**Location:** `apps/web/lib/agents/aria/aria.service.ts`

**Content:**
- Agent execution logic
- Intelligence functions (classifyIntent, normalizeKeyword, isValidKeyword)
- Quality filtering
- Mock keyword research (empty array)
- Direct provider call removed (TODO comment)

**Ownership:** Agent layer
**Purpose:** ARIA agent implementation
**Status:** PARTIAL - MOCKED EXECUTION, NEEDS RUNTIME SERVICE INTEGRATION

---

## Architectural Conflict Analysis

### Conflict 1: Workflow Task Contracts vs Canonical Task Contracts

**Status:** ⚠️ POTENTIAL CONFLICT

**Issue:**
- Workflow system defines TaskDefinition in `workflows/types.ts`
- Canonical system defines TaskDefinition in `contracts/task.contract.ts`
- Two different task contract systems exist

**Impact:**
- Potential confusion about which task contract to use
- Risk of using wrong task contract
- Risk of architectural fragmentation

**Resolution:**
- Use canonical task contract from `contracts/task.contract.ts`
- Workflow system should use canonical task contract
- Deprecate workflow-specific task contract if it conflicts

---

### Conflict 2: Workflow Execution vs Canonical Execution

**Status:** ⚠️ POTENTIAL CONFLICT

**Issue:**
- Workflow system defines execution flow in workflow definitions
- Canonical system defines execution flow in ExecutionOrchestrator
- Two different execution authorities exist

**Impact:**
- Potential confusion about execution authority
- Risk of using wrong execution flow
- Risk of architectural fragmentation

**Resolution:**
- Use canonical execution flow from ExecutionOrchestrator
- Workflow system should be replaced by canonical execution
- Deprecate workflow execution system if it conflicts

---

### Conflict 3: ARIA Workflow vs ARIA Service

**Status:** ⚠️ POTENTIAL CONFLICT

**Issue:**
- ARIA workflow defines 10 tasks in `aria.workflow.ts`
- ARIA service defines execution logic in `aria.service.ts`
- Two different execution definitions exist for ARIA

**Impact:**
- Potential confusion about ARIA execution definition
- Risk of using wrong execution definition
- Risk of architectural fragmentation

**Resolution:**
- Use canonical task contracts from `contracts/task.contract.ts`
- ARIA service should create canonical tasks via RuntimeService
- Deprecate ARIA workflow if it conflicts with canonical execution

---

## Dependency Mapping

### Canonical Contract Dependencies

```
task.contract.ts
  → depends on: common.types.ts
  → used by: task.types.ts, task.repository.ts, task.service.ts

execution.contract.ts
  → depends on: common.types.ts
  → used by: execution.types.ts, execution.repository.ts, execution.service.ts

provider-response.contract.ts
  → depends on: common.types.ts
  → used by: connectors (all), runtime services

provider-error.contract.ts
  → depends on: common.types.ts
  → used by: connectors (all), runtime services

execution-result.contract.ts
  → depends on: provider-response.contract.ts, provider-error.contract.ts
  → used by: runtime services
```

---

### Workflow Contract Dependencies

```
workflows/types.ts
  → depends on: none
  → used by: aria.workflow.ts, scribe.workflow.ts

aria.workflow.ts
  → depends on: workflows/types.ts
  → used by: unknown (possibly deprecated)

scribe.workflow.ts
  → depends on: workflows/types.ts
  → used by: unknown (possibly deprecated)
```

---

### ARIA Service Dependencies

```
aria.service.ts
  → depends on: agent.types.ts, supabase admin client
  → used by: agent execution system
  → imports: dataforseo.client (deprecated, TODO comment)
```

---

## Ownership Classification

### Canonical Ownership

**Owner:** RuntimeService

**Systems:**
- Canonical task contract (task.contract.ts)
- Canonical execution contract (execution.contract.ts)
- Canonical provider response contract (provider-response.contract.ts)
- Canonical provider error contract (provider-error.contract.ts)
- Canonical execution result contract (execution-result.contract.ts)
- Canonical task repository (task.repository.ts)
- Canonical task service (task.service.ts)
- Canonical execution repository (execution.repository.ts)
- Canonical execution service (execution.service.ts)

**Status:** NON-NEGOTIABLE - MUST BE USED

---

### Workflow System Ownership

**Owner:** Workflow System (DEPRECATED?)

**Systems:**
- Workflow task contract (workflows/types.ts)
- ARIA workflow (aria.workflow.ts)
- SCRIBE workflow (scribe.workflow.ts)

**Status:** USE WITH CAUTION - MAY CONFLICT WITH CANONICAL SYSTEMS

---

### Agent Layer Ownership

**Owner:** Agent Layer

**Systems:**
- Agent types (agent.types.ts)
- ARIA service (aria.service.ts)
- SCRIBE service (scribe.service.ts)
- LOCL service (locl.service.ts)
- PUBLISH service (publish.service.ts)
- PULSE service (pulse.service.ts)

**Status:** NON-NEGOTIABLE - MUST BE USED (INTELLIGENCE LAYER ONLY)

---

### Extended Runtime Ownership

**Owner:** Extended Runtime Systems

**Systems:**
- Recovery contracts
- Checkpoint contracts
- State machine contracts
- Resource contracts
- Worker contracts
- Event contracts
- Determinism contracts
- Runtime identity contracts
- Stream contracts
- Runtime error contracts
- Capability contracts
- Coordination contracts
- Scheduling contracts
- Version contracts

**Status:** USE WITH CAUTION - NOT REQUIRED FOR ARIA

---

## ARIA Contract Status

### Do ARIA Contracts Already Exist?

**Answer:** PARTIALLY

**Evidence:**
- ✅ ARIA workflow definition exists (`aria.workflow.ts`)
- ✅ ARIA service implementation exists (`aria.service.ts`)
- ❌ ARIA-specific task contracts do NOT exist
- ❌ ARIA-specific execution contracts do NOT exist
- ❌ ARIA-specific provider contracts do NOT exist

**Conclusion:** ARIA uses canonical runtime contracts, not ARIA-specific contracts.

---

### Do Runtime Task Contracts Already Exist?

**Answer:** YES

**Evidence:**
- ✅ Canonical task contract exists (`contracts/task.contract.ts`)
- ✅ Canonical task types exist (`types/task.types.ts`)
- ✅ Canonical task repository exists (`repositories/task.repository.ts`)
- ✅ Canonical task service exists (`services/task.service.ts`)

**Conclusion:** Runtime task contracts are fully implemented and canonical.

---

### Are There Duplicate Contract Systems?

**Answer:** YES

**Evidence:**
- ⚠️ Workflow task contract (`workflows/types.ts`) vs Canonical task contract (`contracts/task.contract.ts`)
- ⚠️ Workflow execution vs Canonical execution (ExecutionOrchestrator)
- ⚠️ ARIA workflow vs ARIA service

**Conclusion:** Duplicate contract systems exist and must be resolved.

---

### Are There Conflicting Execution Systems?

**Answer:** YES

**Evidence:**
- ⚠️ Workflow execution system vs Canonical execution system (ExecutionOrchestrator)
- ⚠️ ARIA workflow execution vs ARIA service execution

**Conclusion:** Conflicting execution systems exist and must be resolved.

---

## Dangerous Legacy Systems

### Legacy System 1: Workflow Execution

**Status:** ⚠️ DANGEROUS

**Location:** `apps/web/lib/runtime/workflows/`

**Issue:**
- Workflow execution system defines its own task contracts
- Workflow execution system defines its own execution flow
- Conflicts with canonical task contracts
- Conflicts with canonical execution flow

**Risk:**
- Architectural fragmentation
- Execution authority confusion
- Runtime sovereignty violation

**Action Required:**
- Deprecate workflow execution system
- Use canonical task contracts
- Use canonical execution flow

---

### Legacy System 2: ARIA Workflow

**Status:** ⚠️ DANGEROUS

**Location:** `apps/web/lib/runtime/workflows/aria.workflow.ts`

**Issue:**
- ARIA workflow defines 10 tasks outside canonical system
- ARIA workflow defines execution flow outside ExecutionOrchestrator
- Conflicts with canonical task contracts
- Conflicts with canonical execution flow

**Risk:**
- Architectural fragmentation
- Execution authority confusion
- Runtime sovereignty violation

**Action Required:**
- Deprecate ARIA workflow
- Use canonical task contracts
- Use canonical execution flow

---

### Legacy System 3: Hardened DataForSEO Provider

**Status:** ⚠️ DANGEROUS

**Location:** `apps/web/lib/providers/hardened-dataforseo.ts`

**Issue:**
- Hardened provider defines its own retry logic
- Hardened provider defines its own rate limiting
- Conflicts with canonical error authority
- Conflicts with canonical retry logic

**Risk:**
- Retry logic duplication
- Rate limiting duplication
- Architectural fragmentation

**Action Required:**
- Deprecate hardened provider
- Use canonical DataForSEO connector
- Use canonical error authority

---

## Reusable Canonical Assets

### Reusable Contracts

**Status:** ✅ REUSABLE

**Contracts:**
1. `task.contract.ts` - Canonical task contract (REUSABLE)
2. `execution.contract.ts` - Canonical execution contract (REUSABLE)
3. `provider-response.contract.ts` - Canonical provider response contract (REUSABLE)
4. `provider-error.contract.ts` - Canonical provider error contract (REUSABLE)
5. `execution-result.contract.ts` - Canonical execution result contract (REUSABLE)

**Action Required:** Use these contracts for ARIA operationalization.

---

### Reusable Types

**Status:** ✅ REUSABLE

**Types:**
1. `common.types.ts` - Common runtime types (REUSABLE)
2. `task.types.ts` - Task types (REUSABLE)
3. `execution.types.ts` - Execution types (REUSABLE)
4. `agent.types.ts` - Agent types (REUSABLE)

**Action Required:** Use these types for ARIA operationalization.

---

### Reusable Repositories

**Status:** ✅ REUSABLE

**Repositories:**
1. `task.repository.ts` - Task repository (REUSABLE)
2. `execution.repository.ts` - Execution repository (REUSABLE)

**Action Required:** Use these repositories for ARIA operationalization.

---

### Reusable Services

**Status:** ✅ REUSABLE

**Services:**
1. `task.service.ts` - Task service (REUSABLE)
2. `execution.service.ts` - Execution service (REUSABLE)

**Action Required:** Use these services for ARIA operationalization.

---

### Reusable Connectors

**Status:** ✅ REUSABLE

**Connectors:**
1. `dataforseo.connector.ts` - DataForSEO connector (REUSABLE)

**Action Required:** Use this connector for ARIA keyword research.

---

### Reusable Authority

**Status:** ✅ REUSABLE

**Authority:**
1. `error-authority.ts` - Error authority (REUSABLE)
2. `credential-injection-authority.ts` - Credential injection authority (REUSABLE)

**Action Required:** Use these authorities for ARIA operationalization.

---

## Must Delete Before Implementation

### Delete: ARIA Workflow

**Status:** ⚠️ MUST DELETE

**Location:** `apps/web/lib/runtime/workflows/aria.workflow.ts`

**Reason:**
- Conflicts with canonical task contracts
- Conflicts with canonical execution flow
- Duplicates canonical system
- Violates runtime sovereignty

**Action Required:** Delete before ARIA operationalization.

---

### Delete: Workflow Task Contract

**Status:** ⚠️ MUST DELETE

**Location:** `apps/web/lib/runtime/workflows/types.ts`

**Reason:**
- Conflicts with canonical task contract
- Duplicates canonical system
- Violates runtime sovereignty

**Action Required:** Delete before ARIA operationalization.

---

### Delete: Hardened DataForSEO Provider

**Status:** ⚠️ MUST DELETE

**Location:** `apps/web/lib/providers/hardened-dataforseo.ts`

**Reason:**
- Conflicts with canonical DataForSEO connector
- Duplicates retry logic
- Duplicates rate limiting
- Violates runtime sovereignty

**Action Required:** Delete before ARIA operationalization.

---

## Conclusion

The contract discovery investigation has identified:
- 25 contract-related files
- 5 canonical runtime contracts (NON-NEGOTIABLE)
- 14 extended runtime contracts (USE WITH CAUTION)
- 5 cross-system contracts (USE WITH CAUTION)
- 5 canonical type systems (NON-NEGOTIABLE)
- 1 workflow type system (POTENTIAL CONFLICT)
- 1 canonical task system (NON-NEGOTIABLE)
- 1 workflow task system (POTENTIAL CONFLICT)
- 1 canonical execution system (NON-NEGOTIABLE)
- 1 extended execution system (USE WITH CAUTION)
- 1 ARIA workflow (DANGEROUS - MUST DELETE)
- 1 ARIA service (PARTIAL - NEEDS RUNTIME INTEGRATION)
- 1 hardened DataForSEO provider (DANGEROUS - MUST DELETE)

**CONTRACT DISCOVERY STATUS:** ✅ COMPLETED

**Next Steps:**
- TASK I.2: Audit existing ARIA logic
- TASK I.3: Audit existing runtime task system
- TASK I.4: Discover existing execution contracts
- TASK I.5: Provider execution ownership audit
- TASK I.6: Mock execution discovery
- TASK I.7: Runtime reusability analysis
- TASK I.8: Final CTO investigation summary

---

**END OF DISCOVERY REPORT**

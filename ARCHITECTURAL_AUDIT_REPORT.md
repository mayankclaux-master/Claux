# CLAUX Runtime Architecture Audit Report

**Date:** 2026-05-09
**Auditor:** Cascade AI
**Scope:** Runtime contracts, adapters, services, orchestrators, repositories

---

## Executive Summary

The CLAUX Runtime Architecture demonstrates strong adherence to clean architecture principles with proper layer separation and minimal implementation leakage. However, several architectural violations were identified that require remediation to preserve semantic purity and maintain strict layer boundaries.

**Overall Assessment:** ✅ **GOOD** with 4 critical violations requiring remediation

---

## Audit Methodology

The audit systematically examined:
1. Implementation leakage in contracts/adapters layers
2. Provider leakage in adapters layer
3. Invalid dependency directions (upper layers importing lower implementation layers)
4. Semantic duplication across layers
5. Vocabulary drift from canonical runtime vocabulary
6. Orchestration leakage into contracts/adapters
7. Framework/infrastructure coupling in contracts/adapters

---

## Critical Violations

### 1. Orchestration Leakage into Adapters Layer

**Severity:** 🔴 **CRITICAL**
**Location:** `apps/web/lib/runtime/adapters/factory/factory.contract.ts:628`

**Issue:**
```typescript
export interface RuntimeBootstrapOrchestrator {
  readonly orchestratorId: string;
  bootstrapRuntime(config: RuntimeBootstrapConfig): Promise<RuntimeBootstrapResult>;
  getBootstrapProgress(): BootstrapProgress;
  cancelBootstrap(): Promise<void>;
  getRuntimeStatus(): RuntimeStatus;
}
```

**Violation:** The adapters layer contains orchestration concepts (`Orchestrator`), which violates the architectural hierarchy. Orchestration is a separate layer above adapters.

**Architectural Rule Violated:**
- Upper layers (orchestrators) must not leak into lower layers (adapters)
- Adapters should define infrastructure abstraction boundaries, not orchestration logic

**Remediation:**
1. Rename `RuntimeBootstrapOrchestrator` to `RuntimeBootstrapManager` or `AdapterFactoryBootstrap`
2. Move orchestration-specific semantics to the orchestrators layer
3. Keep only adapter initialization/lifecycle semantics in adapters layer

---

### 2. Service Terminology in Adapters Layer

**Severity:** 🔴 **CRITICAL**
**Locations:** 
- `apps/web/lib/runtime/adapters/tracing/tracing.contract.ts:392`
- `apps/web/lib/runtime/adapters/checkpoints/checkpoint-storage.contract.ts:374`

**Issues:**
```typescript
// tracing.contract.ts
export interface ServiceConfig {
  readonly serviceName: string;
  readonly serviceVersion?: string;
  readonly serviceAttributes?: SpanAttributes;
}

// checkpoint-storage.contract.ts
readonly keyManagementService?: string;
```

**Violation:** The adapters layer contains service terminology (`ServiceConfig`, `keyManagementService`), which violates the architectural hierarchy. Services are a separate layer above adapters.

**Architectural Rule Violated:**
- Upper layers (services) must not leak into lower layers (adapters)
- Adapters should define provider-neutral interfaces, not service abstractions

**Remediation:**
1. Rename `ServiceConfig` to `AdapterServiceConfig` or `ProviderServiceConfig`
2. Rename `keyManagementService` to `keyManagementProvider` or `encryptionProvider`
3. Clarify that these are provider configuration options, not service abstractions

---

### 3. Repository Terminology in Adapters Layer

**Severity:** 🟡 **MEDIUM**
**Location:** `apps/web/lib/runtime/adapters/registry/registry.contract.ts:191,296`

**Issue:**
```typescript
export interface AdapterMetadata {
  readonly repository?: string;  // Line 191
}

export interface ProviderMetadata {
  readonly repository?: string;  // Line 296
}
```

**Violation:** The adapters layer contains repository terminology (`repository`), which could be confused with the repositories layer. While this is just a string property for metadata, it creates semantic ambiguity.

**Architectural Rule Violated:**
- Terminology from implementation layers (repositories) should not appear in abstraction layers (adapters)
- Creates potential confusion with the actual repositories layer

**Remediation:**
1. Rename `repository` to `sourceRepository` or `codeRepository` to clarify this is metadata about where the adapter/provider code lives
2. Or rename to `repositoryUrl` to be more specific
3. Add documentation clarifying this is metadata, not a reference to the repositories layer

---

### 4. Semantic Duplication: Config/Options/Result Patterns

**Severity:** 🟡 **MEDIUM**
**Locations:** Across all layers

**Issue:** The patterns `*Config`, `*Options`, `*Result` are duplicated across all layers without clear semantic boundaries:

- Contracts layer: `ExecutionOptions`, `TaskOptions`, `RecoveryOptions`, etc.
- Adapters layer: `QueueAdapterConfig`, `EventConnectionOptions`, `QueuePublishResult`, etc.
- Services layer: `ExecutionServiceConfig`, `TaskServiceConfig`, etc.
- Orchestrators layer: `OrchestratorConfig`, `OrchestratorResult`, etc.

**Violation:** Semantic ambiguity about which layer owns which configuration/options/result semantics.

**Architectural Rule Violated:**
- Semantic concepts should have clear ownership boundaries
- Duplicated patterns without clear separation create confusion

**Remediation:**
1. **Contracts layer:** Owns semantic runtime configuration (what the runtime needs)
   - Rename to `*ContractConfig` or keep as `*Options` for semantic runtime options
2. **Adapters layer:** Owns provider configuration (what providers need)
   - Rename to `*AdapterConfig` or `*ProviderConfig`
3. **Services layer:** Owns service configuration (what services need)
   - Keep as `*ServiceConfig`
4. **Orchestrators layer:** Owns orchestration configuration (what orchestration needs)
   - Keep as `*OrchestratorConfig`

---

## Positive Findings

### ✅ No Implementation Leakage in Contracts Layer

**Finding:** The contracts layer contains no imports from implementation layers, no forbidden dependencies, and only pure interfaces.

**Evidence:**
- No imports found in contract files (only in README.md documentation)
- No forbidden dependencies (Supabase, BullMQ, Kafka, etc.) in actual contract code
- Only interface definitions, no implementation classes or functions

**Assessment:** ✅ **EXCELLENT** - Contracts layer is properly isolated

---

### ✅ No Provider Leakage in Adapters Layer

**Finding:** The adapters layer has no actual provider imports, only type imports from `../types`.

**Evidence:**
- All imports are `import type { ... } from '../types'` (type-only imports)
- Forbidden keywords (BULLMQ, REDIS, KAFKA, etc.) appear only in:
  - Enum values in `ProviderType` (correct - these are type identifiers)
  - Comments explicitly stating "No X dependencies" (correct - documentation)

**Assessment:** ✅ **EXCELLENT** - Adapters layer is properly isolated from providers

---

### ✅ Correct Dependency Directions

**Finding:** No upper layers importing lower implementation layers.

**Evidence:**
- No imports from `contracts/` or `adapters/` in services, orchestrators, or repositories
- Services import from `../types`, `../repositories`, `../db` (correct direction)
- Orchestrators import from `../types`, `../services` (correct direction)
- Repositories import from `../types`, `../db` (correct direction)

**Assessment:** ✅ **EXCELLENT** - Dependency directions are correct

---

### ✅ No Framework/Infrastructure Coupling in Contracts/Adapters

**Finding:** No actual framework or infrastructure coupling in contracts/adapters layers.

**Evidence:**
- No React/Next.js imports
- No Supabase/PostgreSQL imports
- No BullMQ/Redis/Kafka imports
- No OpenTelemetry imports
- Only pure type definitions and interfaces

**Assessment:** ✅ **EXCELLENT** - Contracts/adapters are properly decoupled

---

## Semantic Duplication Analysis

### Lifecycle Semantics

**Locations:**
- `contracts/state-machine.contract.ts` (execution/task lifecycle)
- `adapters/factory/factory.contract.ts` (adapter lifecycle)
- `adapters/types.ts` (adapter lifecycle)
- `adapters/workers/worker-runtime.contract.ts` (worker lifecycle)
- `orchestrator/types.ts` (execution/task lifecycle state)
- `services/` (execution/task lifecycle management)

**Analysis:** The term "Lifecycle" appears across multiple layers with different semantics:
- Contracts: State machine lifecycle (semantic runtime concept)
- Adapters: Adapter initialization/lifecycle (infrastructure concept)
- Orchestrators: Execution/task lifecycle state (coordination concept)
- Services: Business logic lifecycle management (coordination concept)

**Assessment:** ⚠️ **ACCEPTABLE** - Different semantics in different layers, but could be clearer

**Recommendation:** Consider prefixing to clarify ownership:
- `StateMachineLifecycle` (contracts)
- `AdapterLifecycle` (adapters)
- `ExecutionLifecycleState` (orchestrators)
- Keep as-is in services (already clear context)

---

### Recovery Strategy Semantics

**Locations:**
- `contracts/recovery.contract.ts` (canonical recovery strategy enum)
- `orchestrator/types.ts` (recovery strategy enum)

**Analysis:** `RecoveryStrategy` is defined in both contracts and orchestrators layers with potentially different semantics.

**Assessment:** 🟡 **MEDIUM VIOLATION** - Semantic duplication across layers

**Recommendation:**
1. Keep canonical `RecoveryStrategy` in contracts layer
2. Orchestrators should import from contracts, not redefine
3. Remove duplicate enum from orchestrator/types.ts

---

## Vocabulary Drift Analysis

### Canonical Runtime Vocabulary

**Defined Canonical Terms:**
- Execution
- Task
- Worker
- Lease
- Capability
- Coordination
- Ownership
- Checkpoint
- Recovery
- Replay
- Stream
- Trace
- Schedule
- Resource
- Determinism
- Lifecycle

### Vocabulary Drift Findings

**Non-Canonical Terms Found:**
1. **Orchestrator** (in adapters layer) - ❌ Violation
2. **Service** (in adapters layer) - ❌ Violation
3. **Repository** (in adapters layer) - ⚠️ Ambiguous
4. **Bootstrap** (in adapters layer) - ⚠️ Potentially non-canonical
5. **Factory** (in adapters layer) - ✅ Acceptable (adapter factory is a valid pattern)

**Assessment:** 3 vocabulary violations requiring remediation

---

## Recommendations

### Priority 1: Critical Violations (Must Fix)

1. **Remove orchestration from adapters layer**
   - Rename `RuntimeBootstrapOrchestrator` to `RuntimeBootstrapManager`
   - Move orchestration semantics to orchestrators layer
   - Keep only adapter initialization semantics in adapters

2. **Remove service terminology from adapters layer**
   - Rename `ServiceConfig` to `AdapterServiceConfig` or `ProviderServiceConfig`
   - Rename `keyManagementService` to `keyManagementProvider`
   - Clarify these are provider configurations, not service abstractions

### Priority 2: Medium Violations (Should Fix)

3. **Clarify repository terminology in adapters layer**
   - Rename `repository` to `sourceRepository` or `repositoryUrl`
   - Add documentation clarifying this is metadata, not a repositories layer reference

4. **Resolve semantic duplication of Config/Options/Result patterns**
   - Establish clear naming conventions per layer
   - Contracts: `*ContractConfig` or `*Options` (semantic runtime)
   - Adapters: `*AdapterConfig` or `*ProviderConfig` (provider-specific)
   - Services: `*ServiceConfig` (service-specific)
   - Orchestrators: `*OrchestratorConfig` (orchestration-specific)

5. **Remove duplicate RecoveryStrategy enum**
   - Keep canonical definition in contracts layer
   - Remove duplicate from orchestrator/types.ts
   - Import from contracts instead

### Priority 3: Improvements (Nice to Have)

6. **Clarify lifecycle semantics across layers**
   - Consider prefixing to clarify ownership
   - Add documentation explaining lifecycle semantics per layer

7. **Review bootstrap terminology**
   - Consider if "bootstrap" is canonical or should be "initialization"
   - Ensure consistency across layers

---

## Architectural Compliance Score

| Category | Score | Notes |
|----------|-------|-------|
| Implementation Leakage | ✅ 10/10 | No leakage in contracts/adapters |
| Provider Leakage | ✅ 10/10 | No provider imports in adapters |
| Dependency Directions | ✅ 10/10 | Correct layer hierarchy |
| Semantic Duplication | ⚠️ 6/10 | Config/Options/Result patterns duplicated |
| Vocabulary Drift | ⚠️ 7/10 | 3 violations found |
| Orchestration Leakage | ❌ 5/10 | Orchestration in adapters layer |
| Framework Coupling | ✅ 10/10 | No framework coupling |
| **Overall Score** | **⚠️ 8.3/10** | **Good with remediations needed** |

---

## Conclusion

The CLAUX Runtime Architecture demonstrates strong adherence to clean architecture principles with proper layer separation and minimal implementation leakage. The contracts and adapters layers are well-isolated with no forbidden dependencies.

However, 4 critical violations were identified that require remediation:
1. Orchestration leakage into adapters layer
2. Service terminology in adapters layer
3. Repository terminology in adapters layer
4. Semantic duplication of configuration patterns

These violations should be addressed to preserve semantic purity and maintain strict layer boundaries as specified in the architectural hierarchy.

**Recommendation:** Address Priority 1 violations immediately, then proceed to Priority 2 violations to strengthen the architecture.

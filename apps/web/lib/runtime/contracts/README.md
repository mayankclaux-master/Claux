# CLAUX Runtime Contracts Layer

## Canonical Runtime Protocol Specification

This layer defines the canonical runtime protocol for all future execution systems including workflow engines, distributed workers, AI agent runtimes, DAG systems, queue systems, streaming runtimes, recovery engines, schedulers, observability systems, and tracing systems.

---

## Architectural Philosophy

### Pure Semantic Abstractions

The contracts layer is a **pure semantic abstraction layer**. It defines interfaces and types that describe WHAT runtime operations should do, not HOW they should be implemented.

**Key Principles:**
- No implementation logic
- No infrastructure coupling
- No framework dependencies
- No database assumptions
- No queue system assumptions
- No AI provider assumptions

### Clean Architecture Boundaries

The contracts layer sits at the top of the clean architecture stack:

```
┌─────────────────────────────────────┐
│   Runtime Contracts Layer (Phase 6)  │  ← Pure semantics
├─────────────────────────────────────┤
│   Runtime Orchestrator Layer (Phase 5)│  ← Coordination
├─────────────────────────────────────┤
│   Runtime Services Layer (Phase 4)    │  ← Business logic
├─────────────────────────────────────┤
│   Repository Layer (Phase 3)         │  ← Data access
├─────────────────────────────────────┤
│   DB Layer (Phase 2)                │  ← Database operations
├─────────────────────────────────────┤
│   Types Layer (Phase 1)             │  ← Core types
└─────────────────────────────────────┘
```

**Boundary Rules:**
- Contracts depend ONLY on Types (Phase 1)
- Contracts MUST NOT depend on any other layer
- No circular dependencies
- Strict separation of concerns

---

## Layering Rules

### Allowed Dependencies

Contracts MAY import from:
- **Phase 1: Types** (`../types/`) - Core type definitions only

### Prohibited Dependencies

Contracts MUST NOT import from:
- **Phase 2: DB Layer** - No database operations
- **Phase 3: Repository Layer** - No data access
- **Phase 4: Services Layer** - No business logic
- **Phase 5: Orchestrator Layer** - No orchestration
- **Supabase** - No database client
- **Inngest** - No queue system
- **BullMQ** - No queue system
- **React** - No UI framework
- **Next.js** - No web framework
- **OpenAI SDKs** - No AI provider SDKs
- **Any other implementation-specific library**

### Dependency Direction

```
Contracts (Phase 6)
    ↓ imports
Types (Phase 1)
```

**No upward dependencies allowed.**

---

## Dependency Rules

### Module Dependencies

Each contract file must be self-contained or only depend on:
- Other contract files (for type composition)
- The types layer (Phase 1)

### Contract Composition

When composing contracts:
- Prefer composition over inheritance
- Use explicit interfaces
- Avoid tight coupling
- Use generic types where appropriate

### Example: Correct Usage

```typescript
// ✅ Correct: Uses only types from Phase 1
import type { UUID } from '../types';

export interface MyContract {
  readonly id: UUID;
  readonly name: string;
}
```

### Example: Incorrect Usage

```typescript
// ❌ Incorrect: Imports from implementation layer
import { ExecutionRepository } from '../repositories';

export interface MyContract {
  readonly repository: ExecutionRepository; // Violates boundary
}
```

---

## Versioning Rules

### Semantic Versioning

All contracts MUST support semantic versioning via `VersionedContract` interface:

```typescript
export interface VersionedContract {
  readonly contractMetadata: ContractMetadata;
  readonly contractId: string;
  readonly contractType: ContractType;
}
```

### Version Compatibility

- **Major version changes:** Breaking changes, requires migration
- **Minor version changes:** Additive features, backward compatible
- **Patch version changes:** Bug fixes, fully backward compatible

### Deprecation Process

1. Mark contract as deprecated with deprecation metadata
2. Provide migration guide
3. Set removal schedule
4. Maintain backward compatibility until removal

### Evolution Strategy

**Additive Evolution Only:**
- Prefer adding new interfaces over modifying existing ones
- Prefer adding optional fields over required fields
- Use union types for backward compatibility
- Provide default values where possible

---

## Extension Rules

### Extending Contracts

When extending existing contracts:

1. **Additive extensions preferred:**
   ```typescript
   // ✅ Preferred: Add new interface
   export interface ExtendedContract extends BaseContract {
     readonly newField: string;
   }
   ```

2. **Avoid breaking changes:**
   ```typescript
   // ❌ Avoid: Change field type
   export interface BaseContract {
     readonly field: string; // Was number, breaking change
   }
   ```

3. **Use optional fields:**
   ```typescript
   // ✅ Preferred: Add optional field
   export interface BaseContract {
     readonly existingField: string;
     readonly newField?: string; // Backward compatible
   }
   ```

### Custom Contracts

When creating custom contracts:
- Follow the same structure as core contracts
- Include version metadata
- Document compatibility requirements
- Provide migration guides for breaking changes

---

## Additive Evolution Strategy

### Principles

1. **Never remove fields from existing interfaces**
2. **Never change field types to incompatible types**
3. **Never make optional fields required**
4. **Always document deprecation before removal**
5. **Provide migration paths for breaking changes**

### Example: Additive Evolution

```typescript
// Version 1.0
export interface ExecutionContract {
  readonly id: string;
  readonly status: string;
}

// Version 1.1 (Additive)
export interface ExecutionContract {
  readonly id: string;
  readonly status: string;
  readonly metadata?: Record<string, unknown>; // Added optional field
}

// Version 2.0 (Breaking, requires migration)
export interface ExecutionContractV2 {
  readonly id: string;
  readonly status: ExecutionStatus; // Changed from string to enum
  readonly metadata?: Record<string, unknown>;
}
```

---

## Prohibited Dependencies

### Explicitly Prohibited

The following dependencies are **STRICTLY PROHIBITED** in the contracts layer:

- **Database clients:** Supabase, PostgreSQL, MySQL, MongoDB, etc.
- **Queue systems:** Inngest, BullMQ, RabbitMQ, Kafka, etc.
- **Web frameworks:** Next.js, Express, Fastify, etc.
- **UI frameworks:** React, Vue, Angular, etc.
- **AI SDKs:** OpenAI, Anthropic, Cohere, etc.
- **Infrastructure:** AWS SDK, GCP SDK, Azure SDK, etc.
- **Testing frameworks:** Jest, Vitest, Playwright, etc.
- **Logging libraries:** Winston, Pino, etc.
- **Monitoring:** Datadog, New Relic, Sentry, etc.

### Implementation Leakage

Contracts MUST NOT leak implementation details:

```typescript
// ❌ Incorrect: Leaks implementation details
export interface Contract {
  readonly supabaseClient: SupabaseClient; // Leaks database
  readonly inngestClient: Inngest; // Leaks queue system
}

// ✅ Correct: Pure semantics
export interface Contract {
  readonly id: string;
  readonly status: string;
}
```

---

## Examples of Correct vs Incorrect Usage

### Correct Usage

```typescript
// ✅ Correct: Pure semantic abstraction
export interface TaskExecutor {
  execute(context: TaskExecutionContext): Promise<TaskExecutionResult>;
}

export interface TaskExecutionContext {
  readonly taskId: string;
  readonly input: Record<string, unknown>;
  readonly signal?: AbortSignal;
}

export interface TaskExecutionResult {
  readonly success: boolean;
  readonly output?: Record<string, unknown>;
  readonly error?: TaskError;
}
```

### Incorrect Usage

```typescript
// ❌ Incorrect: Implementation leakage
export interface TaskExecutor {
  execute(context: TaskExecutionContext): Promise<TaskExecutionResult>;
  readonly repository: TaskRepository; // Leaks repository
  readonly supabase: SupabaseClient; // Leaks database
}

export interface TaskExecutionContext {
  readonly taskId: string;
  readonly input: Record<string, unknown>;
  readonly signal?: AbortSignal;
  readonly dbConnection: Connection; // Leaks database
}
```

---

## Contract Files Overview

### Core Contracts

1. **execution.contract.ts** - Execution lifecycle and workflow execution
2. **task.contract.ts** - Task execution and task executors
3. **worker.contract.ts** - Worker lifecycle and worker pools
4. **event.contract.ts** - Event propagation and distributed tracing
5. **recovery.contract.ts** - Recovery workflows and failure handling
6. **checkpoint.contract.ts** - Checkpointing and resumability
7. **runtime-errors.contract.ts** - Error handling and error reporting

### Extended Contracts

8. **version.contract.ts** - Contract versioning and compatibility
9. **capability.contract.ts** - Runtime capability discovery and negotiation
10. **stream.contract.ts** - Streaming runtime execution
11. **determinism.contract.ts** - Deterministic execution and replay
12. **resource.contract.ts** - Resource limits and quotas
13. **scheduling.contract.ts** - Task scheduling and execution ordering
14. **state-machine.contract.ts** - State machine semantics

---

## Future-Proofing Goals

The contracts layer is designed to support:

- ✅ Workflow engines
- ✅ Distributed workers
- ✅ Durable execution
- ✅ AI agent runtimes
- ✅ DAG systems
- ✅ Queue systems
- ✅ Streaming runtimes
- ✅ Recovery engines
- ✅ Schedulers
- ✅ Observability systems
- ✅ Tracing systems
- ✅ Future execution infrastructure

**WITHOUT major rewrites.**

---

## Maintenance Guidelines

### Adding New Contracts

1. Define contract in appropriate file
2. Include version metadata
3. Document compatibility requirements
4. Add to index.ts exports
5. Update this README

### Modifying Existing Contracts

1. Follow additive evolution strategy
2. Update version metadata
3. Document breaking changes
4. Provide migration guide
5. Update this README

### Deprecating Contracts

1. Mark with deprecation metadata
2. Set removal schedule
3. Provide migration path
4. Document in this README
5. Communicate to stakeholders

---

## Validation Checklist

Before committing changes to the contracts layer, validate:

- [ ] No implementation logic
- [ ] No infrastructure coupling
- [ ] No framework dependencies
- [ ] No database assumptions
- [ ] No queue system assumptions
- [ ] No AI provider assumptions
- [ ] Only depends on Types (Phase 1)
- [ ] No circular dependencies
- [ ] Version metadata included
- [ ] Backward compatibility maintained
- [ ] Documented breaking changes
- [ ] Migration guide provided (if breaking)

---

## Adapter Philosophy

### Anti-Corruption Layer

The Runtime Adapters Layer (Phase 7) serves as the **anti-corruption boundary** between:
- Runtime semantics (Contracts Layer, Phase 6)
- Infrastructure implementations (Queue systems, databases, event buses, etc.)

**Key Principles:**
- Adapters translate between runtime contracts and infrastructure APIs
- No implementation logic leaks into contracts
- Adapters are pluggable and replaceable
- Vendor lock-in is prevented through adapter abstraction

### Adapter Contracts

Each adapter domain defines:
- Canonical adapter interfaces
- Provider interfaces
- Capability descriptors
- Configuration schemas
- Lifecycle contracts

**No implementations** - only pure abstractions.

---

## Infrastructure Isolation

### Provider Abstraction

The adapters layer isolates infrastructure through provider abstractions:

```typescript
// ✅ Correct: Provider abstraction
export interface QueueProvider {
  readonly providerId: string;
  createAdapter(config: QueueAdapterConfig): QueueAdapter;
  getCapabilities(): QueueCapabilities;
}

// ❌ Incorrect: Direct infrastructure coupling
export interface QueueAdapter {
  readonly bullMQ: BullMQ; // Leaks implementation
}
```

### Infrastructure Boundaries

The adapters layer enforces strict boundaries:

| Domain | Isolated From |
|--------|-------------|
| Queue Adapters | BullMQ, Redis, Kafka, SQS |
| Event Bus Adapters | Kafka, NATS, Redis Streams, EventBridge |
| Tracing Adapters | OpenTelemetry, Jaeger, Zipkin |
| Checkpoint Adapters | S3, Postgres, Redis, Azure Blob |
| Streaming Adapters | WebSocket, SSE, gRPC |
| Worker Adapters | Kubernetes, Docker, serverless |
| Scheduling Adapters | Cron, Temporal, Airflow |
| Metrics Adapters | Prometheus, OpenTelemetry, Datadog |

---

## Provider Boundaries

### Provider Interface Contract

All providers MUST implement the provider interface contract:

```typescript
export interface Provider {
  readonly providerId: string;
  readonly providerType: string;
  readonly version: string;
  createAdapter(config: AdapterConfig): Adapter;
  validateConfig(config: AdapterConfig): Promise<ValidationResult>;
  getCapabilities(): Capabilities;
  getMetadata(): ProviderMetadata;
}
```

### Capability Negotiation

Providers MUST support capability negotiation:

```typescript
export interface CapabilityResolver {
  resolveCapabilities(
    adapterId: string,
    requiredCapabilities: readonly string[]
  ): CapabilityResolutionResult;
}
```

### Version Compatibility

Providers MUST support version compatibility checks:

```typescript
export interface AdapterRegistry {
  validateVersionCompatibility(
    adapterId: string,
    requiredVersion: string
  ): VersionCompatibilityResult;
}
```

---

## Anti-Corruption Layers

### Translation Layer

Adapters act as translation layers between runtime semantics and infrastructure APIs:

```
Runtime Contracts (Phase 6)
    ↓
Adapter Contracts (Phase 7)
    ↓
Provider Implementations (Phase 8+)
```

**Translation Rules:**
- Runtime semantics are invariant
- Provider implementations vary
- Adapters bridge the gap
- No semantic leakage in either direction

### Example: Queue Translation

```typescript
// Runtime contract (invariant)
export interface QueueAdapter {
  publish(queueName: string, payload: unknown): Promise<void>;
}

// Provider implementation (variable)
class BullMQProvider implements QueueProvider {
  createAdapter(config: QueueAdapterConfig): QueueAdapter {
    return new BullMQAdapter(config); // Translates to BullMQ API
  }
}
```

---

## Vendor Isolation Strategy

### Vendor Lock-In Prevention

The adapters layer prevents vendor lock-in through:

1. **Canonical interfaces** - Single source of truth for runtime operations
2. **Provider abstraction** - Swappable implementations
3. **Capability negotiation** - Runtime can choose best provider
4. **Fallback resolution** - Graceful degradation when providers fail
5. **Version compatibility** - Safe evolution without breaking changes

### Provider Swapping

Providers can be swapped without changing runtime code:

```typescript
// Swap from BullMQ to Kafka
const bullMQProvider = registry.resolveProvider('queue', { providerType: 'bullmq' });
const kafkaProvider = registry.resolveProvider('queue', { providerType: 'kafka' });

// Runtime code unchanged
await adapter.publish('queue-name', payload);
```

---

## Distributed Runtime Evolution

### Distributed Ownership

The runtime identity contracts support distributed ownership:

```typescript
export interface DistributedOwnership {
  readonly ownershipId: string;
  readonly resourceId: string;
  readonly ownerId: string;
  transferOwnership(newOwnerId: string): Promise<OwnershipTransferResult>;
  validateOwnership(): OwnershipValidationResult;
}
```

**Supports:**
- Execution leasing
- Worker ownership
- Failover semantics
- Replay ownership
- Execution affinity

### Distributed Coordination

The coordination contracts support distributed coordination:

```typescript
export interface CoordinationProvider {
  createLock(lockId: string): DistributedLock;
  createLeaseManager(leaseId: string): LeaseManager;
  createHeartbeatCoordinator(coordinatorId: string): HeartbeatCoordinator;
  createConsensusContext(contextId: string): ConsensusContext;
}
```

**Supports:**
- Distributed locking
- Lease management
- Heartbeat coordination
- Leader election
- Consensus protocols

### Failover Coordination

The coordination contracts support failover:

```typescript
export interface FailoverCoordination {
  initiateFailover(resourceId: string, reason: FailoverReason): Promise<FailoverResult>;
  getFailoverCandidates(resourceId: string): readonly FailoverCandidate;
}
```

**Supports:**
- Node failure
- Worker failure
- Network partition
- High latency
- Maintenance

---

## Deterministic Replay Philosophy

### Replay-Aware Tracing

The tracing contracts support deterministic replay:

```typescript
export interface ReplayAwareTracing {
  markForReplay(trace: RuntimeTrace, replayMode: ReplayMode): DeterministicReplayMarker;
  createReplayTrace(originalTrace: RuntimeTrace, replayMode: ReplayMode): RuntimeTrace;
  validateReplayConsistency(originalTrace: RuntimeTrace, replayTrace: RuntimeTrace): ReplayConsistencyResult;
}
```

**Supports:**
- Replay markers
- Deterministic seeds
- Divergence detection
- Consistency validation

### Replay Ownership

The identity contracts support replay ownership:

```typescript
export interface ReplayOwnership {
  acquireReplayOwnership(executionId: string, ownerId: string): Promise<ReplayOwnershipAcquisitionResult>;
  validateReplayOwnership(executionId: string, ownerId: string): ReplayOwnershipValidationResult;
}
```

**Supports:**
- Exclusive replay ownership
- Replay leasing
- Replay affinity
- Replay isolation

### Deterministic Execution

The determinism contracts support deterministic execution:

```typescript
export interface DeterministicExecutionEngine {
  executeWithSeed(context: DeterministicExecutionContext, seed: ExecutionSeed): Promise<DeterministicExecutionResult>;
  replayExecution(replayContext: ReplayContext): Promise<ReplayResult>;
  detectDivergence(original: ExecutionSnapshot, replay: ExecutionSnapshot): DivergenceReport;
}
```

**Supports:**
- Seeded execution
- Audit replay
- Divergence detection
- Deterministic validation

---

## Runtime Portability Rules

### Portability Principles

The runtime platform must be portable across:

1. **Infrastructure providers**
   - Cloud vs on-premise
   - Different cloud providers (AWS, GCP, Azure)
   - Self-hosted vs managed services

2. **Execution environments**
   - Kubernetes clusters
   - Serverless platforms
   - Edge computing
   - Local development

3. **Queue systems**
   - BullMQ, Redis, Kafka, SQS, Pub/Sub
   - Event buses, message brokers

4. **Storage systems**
   - S3, Azure Blob, GCP Storage
   - Postgres, Redis, filesystems

### Portability Validation

Before committing changes, validate portability:

- [ ] Works across multiple queue providers
- [ ] Works across multiple storage providers
- [ ] Works across multiple tracing providers
- [ ] Works across multiple metrics providers
- [ ] No provider-specific assumptions in contracts
- [ ] No infrastructure-specific constants
- [ ] No hardcoded endpoints or URLs
- [ ] No provider-specific error handling

---

## Adapter Registry Layer

### Runtime Adapter Discovery

The adapter registry enables runtime adapter discovery:

```typescript
export interface AdapterRegistry {
  registerAdapter(descriptor: AdapterDescriptor): Promise<void>;
  resolveAdapter(adapterType: AdapterType, requirements: AdapterRequirements): AdapterResolutionResult;
  checkCapabilityCompatibility(adapterId: string, requiredCapabilities: readonly string[]): CapabilityCompatibilityResult;
  getFallbackAdapter(adapterId: string, reason: FallbackReason): AdapterDescriptor | null;
}
```

**Supports:**
- Runtime adapter registration
- Capability-based resolution
- Fallback resolution
- Version compatibility

### Provider Registry

The provider registry enables provider discovery:

```typescript
export interface ProviderRegistry {
  registerProvider(descriptor: ProviderDescriptor): Promise<void>;
  resolveProvider(adapterType: AdapterType, requirements: ProviderRequirements): ProviderResolutionResult;
  validateProviderCompatibility(providerId: string, adapterType: AdapterType): CompatibilityValidationResult;
}
```

**Supports:**
- Provider registration
- Provider resolution
- Compatibility validation
- Dependency management

---

## Adapter Factory Layer

### Runtime Initialization

The adapter factory enables runtime initialization:

```typescript
export interface AdapterFactory {
  createAdapter(adapterType: AdapterType, config: AdapterFactoryConfig): Promise<AdapterFactoryResult>;
  createAdapterBatch(configs: readonly AdapterFactoryConfig[]): Promise<readonly AdapterFactoryResult[]>;
  validateConfig(adapterType: AdapterType, config: Record<string, unknown>): ConfigValidationResult;
}
```

**Supports:**
- Adapter creation
- Batch initialization
- Configuration validation
- Dependency wiring

### Lifecycle Management

The lifecycle manager enables adapter lifecycle management:

```typescript
export interface AdapterLifecycleManager {
  initialize(adapterId: string, config: Record<string, unknown>): Promise<LifecycleResult>;
  start(adapterId: string): Promise<LifecycleResult>;
  stop(adapterId: string): Promise<LifecycleResult>;
  shutdown(adapterId: string): Promise<LifecycleResult>;
  getLifecycleState(adapterId: string): LifecycleState;
}
```

**Supports:**
- Lifecycle transitions
- State management
- Event subscription
- History tracking

### Runtime Bootstrap

The bootstrap orchestrator enables runtime bootstrap:

```typescript
export interface RuntimeBootstrapManager {
  bootstrapRuntime(config: RuntimeBootstrapConfig): Promise<RuntimeBootstrapResult>;
  getBootstrapProgress(): BootstrapProgress;
  cancelBootstrap(): Promise<void>;
  getRuntimeStatus(): RuntimeStatus;
}
```

**Supports:**
- Ordered bootstrap
- Parallel initialization
- Progress tracking
- Cancellation

---

## Summary

The CLAUX Runtime Contracts Layer is a **long-term stable runtime protocol** that provides pure semantic abstractions for execution systems. The Runtime Adapters Layer serves as the **anti-corruption boundary** between runtime semantics and infrastructure implementations.

By adhering to these architectural principles and rules, we ensure:

- **Framework agnostic** - No framework dependencies
- **Database agnostic** - No database assumptions
- **Queue agnostic** - No queue system assumptions
- **AI provider agnostic** - No AI provider assumptions
- **Infrastructure agnostic** - No infrastructure coupling
- **Vendor isolated** - Provider abstraction prevents lock-in
- **Runtime portable** - Works across environments and providers
- **Distributed ready** - Supports distributed ownership and coordination
- **Replay capable** - Supports deterministic replay and divergence detection

This enables future execution infrastructure to implement these contracts without requiring major rewrites of the contracts layer itself.

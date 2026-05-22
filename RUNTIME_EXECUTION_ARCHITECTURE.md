# CLAUX Runtime Execution Architecture

## Overview

This document describes the **actual** execution architecture used by CLAUX for agent task execution. It explicitly distinguishes between the canonical execution path and removed speculative infrastructure.

---

## Canonical Execution Path

The real execution path is:

```
API Route
  → Agent Service (runARIA/runSCRIBE)
  → RuntimeService
  → ExecutionOrchestrator
  → TaskOrchestrator
  → TaskExecutorFactory
  → RuntimeTaskExecutor
  → Connector (DataForSEOConnector/OpenAIConnector)
  → External API
```

### Components in Canonical Path

#### 1. API Routes
- **Location:** `apps/web/app/api/agents/aria/discovery/route.ts`, `apps/web/app/api/agents/scribe/draft/route.ts`
- **Purpose:** HTTP endpoints that trigger agent execution
- **Responsibilities:**
  - Authentication via Clerk
  - Tenant/workspace resolution
  - Initialize RuntimeService
  - Initialize ExecutionOrchestrator
  - Create execution record
  - Start execution
  - Call agent service for actual execution

#### 2. Agent Services
- **Location:** `apps/web/lib/agents/aria/aria.service.ts`, `apps/web/lib/agents/scribe/scribe.service.ts`
- **Purpose:** Orchestrate agent-specific execution logic
- **Responsibilities:**
  - Initialize RuntimeService
  - Initialize ExecutionOrchestrator
  - Initialize TaskOrchestrator
  - Create execution record
  - Create task records via TaskOrchestrator
  - Instantiate TaskExecutorFactory
  - Execute tasks via TaskExecutor
  - Complete execution
  - Publish events and logs

#### 3. RuntimeService
- **Location:** `apps/web/lib/runtime/services/runtime.service.ts`
- **Purpose:** Facade for all runtime services
- **Responsibilities:**
  - Compose ExecutionService, TaskService, EventService, LogService, MetricsService
  - Provide single entry point for runtime operations
  - Initialize services with shared configuration

#### 4. ExecutionOrchestrator
- **Location:** `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`
- **Purpose:** Coordinate execution lifecycle
- **Responsibilities:**
  - Create executions
  - Start executions
  - Complete executions
  - Fail executions
  - Cancel executions
  - Retry executions
  - Retrieve execution state and progress

#### 5. TaskOrchestrator
- **Location:** `apps/web/lib/runtime/orchestrator/task-orchestrator.ts`
- **Purpose:** Coordinate task lifecycle
- **Responsibilities:**
  - Create tasks
  - Start tasks
  - Complete tasks
  - Fail tasks
  - Retry tasks
  - Skip tasks
  - Validate task dependencies
  - Publish events and logs

#### 6. TaskExecutorFactory
- **Location:** `apps/web/lib/agents/aria/aria-tasks.ts`, `apps/web/lib/agents/scribe/scribe-tasks.ts`
- **Purpose:** Factory pattern for creating task executors
- **Responsibilities:**
  - Map task types to executor implementations
  - Instantiate task executors with proper configuration
  - Provide list of supported task types

#### 7. RuntimeTaskExecutor Implementations
- **Location:** `apps/web/lib/agents/aria/aria-tasks.ts`, `apps/web/lib/agents/scribe/scribe-tasks.ts`
- **Purpose:** Execute specific tasks
- **ARIA Tasks:**
  - `KeywordResearchTask` - Keyword discovery via DataForSEO
  - `SERPAnalysisTask` - SERP analysis via DataForSEO
  - `KeywordClusteringTask` - Internal clustering logic
  - `CompetitorGapAnalysisTask` - Competitor analysis via DataForSEO
  - `SearchIntentMappingTask` - Internal intent classification
- **SCRIBE Tasks:**
  - `ArticleGenerationTask` - Article generation via OpenAI
  - `MetadataGenerationTask` - Metadata generation via OpenAI
  - `InternalLinkGenerationTask` - Internal link generation via OpenAI
  - `SemanticOptimizationTask` - Content optimization via OpenAI
  - `GEOContentStructuringTask` - GEO content structuring via OpenAI
  - `ContentRefreshTask` - Content refresh via OpenAI
  - `FAQGenerationTask` - FAQ generation via OpenAI
  - `SchemaContentGenerationTask` - Schema generation via OpenAI

#### 8. Connectors
- **Location:** `apps/web/lib/runtime/connectors/`
- **Purpose:** Interface with external APIs
- **Responsibilities:**
  - Handle authentication
  - Prepare requests
  - Parse responses
  - Handle errors
  - Implement retry logic
- **Implementations:**
  - `DataForSEOConnector` - DataForSEO API
  - `OpenAIConnector` - OpenAI API

#### 9. Runtime Services (Supporting)
- **ExecutionService:** Execution lifecycle management
- **TaskService:** Task lifecycle management
- **EventService:** Event publishing
- **LogService:** Logging
- **MetricsService:** Metrics collection

---

## Removed Speculative Infrastructure

The following components were **speculative enterprise abstractions** that were never integrated into the actual execution path. They have been removed to simplify the codebase.

### Deleted Directories

#### 1. `apps/web/lib/runtime/execution/engine/`
- **Status:** DELETED
- **Reason:** Speculative workflow orchestration engine, never used by actual execution path
- **Contained:**
  - `WorkflowEngine` - Main orchestration engine (had TODO markers, incomplete)
  - `ExecutionLoop` - Main execution loop (threw error, not implemented)
  - `TaskDispatcher` - Task dispatcher (had TODO markers, incomplete)
  - `RetryEngine` - Retry logic
  - `CancellationEngine` - Cancellation logic
  - `CheckpointEngine` - Checkpoint logic
  - `DAGEngine` - DAG execution
  - `ReplayEngine` - Replay logic

#### 2. `apps/web/lib/runtime/execution/scheduler/`
- **Status:** DELETED
- **Reason:** Speculative scheduling infrastructure, never used by actual execution path
- **Contained:**
  - `DependencyResolver` - Dependency resolution
  - `RunnableSelector` - Runnable task selection
  - `PriorityQueue` - Priority queue
  - `ConcurrencyController` - Concurrency control
  - `ExecutionWindow` - Execution window management

#### 3. `apps/web/lib/runtime/execution/graph/`
- **Status:** DELETED
- **Reason:** Speculative DAG infrastructure, never used by actual execution path
- **Contained:**
  - `DAGBuilder` - DAG construction
  - `DAGValidator` - DAG validation
  - `TopologicalSort` - Topological sorting
  - `CycleDetector` - Cycle detection
  - `GraphStateManager` - Graph state management

#### 4. `apps/web/lib/runtime/execution/runtime/`
- **Status:** DELETED
- **Reason:** Speculative runtime infrastructure, never used by actual execution path
- **Contained:**
  - `TaskRuntime` - Task runtime context
  - `ExecutionRuntime` - Execution runtime context
  - `ReplayRuntime` - Replay runtime
  - `WorkerRuntime` - Worker runtime

#### 5. `apps/web/lib/runtime/execution/execution.facade.ts`
- **Status:** DELETED
- **Reason:** Speculative facade for deleted WorkflowEngine, never used by actual execution path

#### 6. `apps/web/lib/runtime/workflows/aria.workflow.ts`
- **Status:** DELETED
- **Reason:** Workflow definition not used by actual execution path (agent services create tasks directly)

#### 7. `apps/web/lib/runtime/workflows/scribe.workflow.ts`
- **Status:** DELETED
- **Reason:** Workflow definition not used by actual execution path (agent services create tasks directly)

---

## Remaining Execution Infrastructure

The following components remain in `apps/web/lib/runtime/execution/` but are **not used** by the canonical execution path. They are kept for type definitions and utilities only.

### Remaining Files

- `constants.ts` - Execution constants
- `errors.ts` - Execution error types
- `types.ts` - Execution type definitions
- `metrics.ts` - Metrics collection utilities
- `validation.ts` - Validation utilities
- `state/` - State machine implementations (used by actual execution path)
- `index.ts` - Barrel exports (cleaned to remove deleted components)

---

## Execution Characteristics

### Current Architecture

- **Execution Model:** In-process synchronous execution
- **Concurrency:** Single-process (no distributed execution)
- **Persistence:** Database-only (Supabase)
- **Queue:** None (direct execution)
- **Workers:** None (in-process execution)
- **Checkpointing:** None (not implemented)
- **Event Bus:** Database events only
- **Scalability:** Single-instance deployment

### Scalability Implications

The current architecture is suitable for:
- Single-instance deployments
- Low to moderate execution volume
- Development and testing environments
- MVP and early-stage production

The current architecture is NOT suitable for:
- High-volume execution
- Multi-instance deployments
- Distributed execution
- Long-running workflows
- Complex retry/replay scenarios

---

## Future Considerations

If scaling is required in the future, the following would need to be re-implemented:

1. **Distributed Execution:** Add Redis/BullMQ for queue-based execution
2. **Worker Processes:** Separate worker processes for task execution
3. **Checkpointing:** Add checkpoint persistence for long-running workflows
4. **Event Bus:** Add event-driven architecture for async communication
5. **Workflow Engine:** Re-implement WorkflowEngine with proper state management
6. **Retry/Replay:** Add robust retry and replay capabilities

**Note:** These should only be implemented when there is a clear business need. The current architecture is production-ready for single-instance deployments.

---

## Summary

- **Canonical Path:** API Route → Agent Service → RuntimeService → ExecutionOrchestrator → TaskOrchestrator → TaskExecutorFactory → RuntimeTaskExecutor → Connector
- **Removed:** Speculative WorkflowEngine, ExecutionLoop, TaskDispatcher, GraphStateManager, DependencyResolver, RunnableSelector, and related infrastructure
- **Remaining:** Type definitions, utilities, and state machines
- **Execution Model:** In-process synchronous execution
- **Deployment:** Single-instance suitable for MVP and early-stage production

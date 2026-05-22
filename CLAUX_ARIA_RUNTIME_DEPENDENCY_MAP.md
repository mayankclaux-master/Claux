# CLAUX ARIA Runtime Dependency Map

**Task**: TASK 4A.1 - ARIA Service Audit  
**Status**: ✅ COMPLETED  
**Date**: 2026-05-20  
**Authority**: CLAUX ARIA Operationalization

---

## Executive Summary

This document maps all runtime dependencies required for ARIA operationalization. ARIA currently has no runtime dependencies and must integrate with 7 canonical runtime components to become a functional autonomous SEO intelligence agent.

## Current ARIA Dependencies

### External Dependencies
```typescript
import type { AgentContext } from "../base/agent.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
```

### Current Dependency Analysis

| Dependency | Type | Usage | Status |
|-----------|------|-------|--------|
| AgentContext | Type | Agent execution context | ✅ CORRECT |
| createSupabaseAdminClient | Function | Direct database access | ⚠️ NON-CANONICAL |

### Missing Dependencies
- ❌ RuntimeService
- ❌ ExecutionOrchestrator
- ❌ TaskOrchestrator
- ❌ DataForSEOConnector
- ❌ CredentialInjectionAuthority
- ❌ ErrorAuthority
- ❌ LogService
- ❌ EventService

## Required Runtime Dependencies

### 1. RuntimeService

**Location**: `apps/web/lib/runtime/services/runtime.service.ts`  
**Purpose**: Facade service composing all runtime services  
**Dependency Level**: CRITICAL (required for all operations)

#### Import Path
```typescript
import { RuntimeService, RuntimeServiceConfig } from '@/lib/runtime/services/runtime.service';
```

#### Initialization
```typescript
const runtimeService = new RuntimeService({
  tenantId: context.tenantId,
  logOperations: true,
  enableMetrics: true,
  maxExecutionRetries: 3,
  maxTaskRetries: 3,
});
```

#### Required Methods
- `runtimeService.execution.createExecution()`
- `runtimeService.execution.startExecution()`
- `runtimeService.execution.completeExecution()`
- `runtimeService.execution.failExecution()`
- `runtimeService.task.createTask()`
- `runtimeService.task.startTask()`
- `runtimeService.task.completeTask()`
- `runtimeService.task.failTask()`
- `runtimeService.event.publishEvent()`
- `runtimeService.log.writeLog()`
- `runtimeService.metrics.recordMetric()`

#### Dependency Chain
```
RuntimeService
  ↓
  ├── ExecutionService
  ├── TaskService
  ├── EventService
  ├── LogService
  └── MetricsService
```

### 2. ExecutionOrchestrator

**Location**: `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`  
**Purpose**: Coordinates execution lifecycle with automatic event publishing and logging  
**Dependency Level**: CRITICAL (required for execution management)

#### Import Path
```typescript
import { ExecutionOrchestrator, OrchestratorConfig } from '@/lib/runtime/orchestrator/execution-orchestrator';
```

#### Initialization
```typescript
const executionOrchestrator = new ExecutionOrchestrator(runtimeService, {
  tenantId: context.tenantId,
  enableAutoLogging: true,
  enableAutoEvents: true,
});
```

#### Required Methods
- `executionOrchestrator.createExecution(plan)`
- `executionOrchestrator.startExecution(executionId)`
- `executionOrchestrator.completeExecution(executionId, output)`
- `executionOrchestrator.failExecution(executionId, error)`
- `executionOrchestrator.getExecutionState(executionId)`
- `executionOrchestrator.cancelExecution(executionId)`
- `executionOrchestrator.retryExecution(executionId)`

#### Dependency Chain
```
ExecutionOrchestrator
  ↓
RuntimeService
  ↓
  ├── ExecutionService
  ├── EventService
  └── LogService
```

### 3. TaskOrchestrator

**Location**: `apps/web/lib/runtime/orchestrator/task-orchestrator.ts`  
**Purpose**: Coordinates task lifecycle with automatic event publishing and logging  
**Dependency Level**: CRITICAL (required for task management)

#### Import Path
```typescript
import { TaskOrchestrator, OrchestratorConfig } from '@/lib/runtime/orchestrator/task-orchestrator';
```

#### Initialization
```typescript
const taskOrchestrator = new TaskOrchestrator(runtimeService, {
  tenantId: context.tenantId,
  enableAutoLogging: true,
  enableAutoEvents: true,
});
```

#### Required Methods
- `taskOrchestrator.createTask(executionId, plan)`
- `taskOrchestrator.createTaskBatch(executionId, plans)`
- `taskOrchestrator.startTask(taskId)`
- `taskOrchestrator.completeTask(taskId, output)`
- `taskOrchestrator.failTask(taskId, error)`
- `taskOrchestrator.retryTask(taskId)`
- `taskOrchestrator.skipTask(taskId)`
- `taskOrchestrator.getTaskState(taskId)`
- `taskOrchestrator.listExecutionTasks(executionId)`

#### Dependency Chain
```
TaskOrchestrator
  ↓
RuntimeService
  ↓
  ├── TaskService
  ├── EventService
  └── LogService
```

### 4. DataForSEOConnector

**Location**: `apps/web/lib/runtime/connectors/dataforseo.connector.ts`  
**Purpose**: Canonical connector for DataForSEO API execution  
**Dependency Level**: CRITICAL (required for keyword research)

#### Import Path
```typescript
import { DataForSEOConnector, DataForSEOConnectorConfig } from '@/lib/runtime/connectors/dataforseo.connector';
```

#### Initialization
```typescript
const credentialInjectionAuthority = new CredentialInjectionAuthority();

const dataforseoConnector = new DataForSEOConnector({
  tenantId: context.tenantId,
  credentialInjectionAuthority,
  locationName: 'United States',
  languageName: 'English',
});
```

#### Required Methods
- `dataforseoConnector.execute(operation, payload, credentials)`
- `dataforseoConnector.getKeywordResearch(domain, location, language)`
- `dataforseoConnector.getSERPAnalysis(keywords, location, language)`
- `dataforseoConnector.getCompetitorAnalysis(domain, competitors)`

#### Dependency Chain
```
DataForSEOConnector
  ↓
BaseConnector
  ↓
CredentialInjectionAuthority
```

### 5. CredentialInjectionAuthority

**Location**: `apps/web/lib/runtime/authority/credential-injection-authority.ts`  
**Purpose**: Sole authority for securely injecting provider credentials  
**Dependency Level**: HIGH (required for connector authentication)

#### Import Path
```typescript
import { CredentialInjectionAuthority } from '@/lib/runtime/authority/credential-injection-authority';
```

#### Initialization
```typescript
const credentialInjectionAuthority = new CredentialInjectionAuthority();
```

#### Required Methods
- `credentialInjectionAuthority.getCredentials(tenantId, provider)`
- `credentialInjectionAuthority.decryptCredentials(encryptedCredentials)`
- `credentialInjectionAuthority.sanitizeCredentials(credentials)`
- `credentialInjectionAuthority.validateCredentials(credentials)`

#### Dependency Chain
```
CredentialInjectionAuthority
  ↓
  ├── Runtime Database (credential storage)
  └── Encryption Service (credential decryption)
```

### 6. ErrorAuthority

**Location**: `apps/web/lib/runtime/authority/error-authority.ts`  
**Purpose**: Sole authority for error classification and retry logic  
**Dependency Level**: MEDIUM (required for error handling, retry managed by orchestrators)

#### Import Path
```typescript
import { ErrorAuthority, ProviderErrorCode } from '@/lib/runtime/authority/error-authority';
```

#### Initialization
```typescript
const errorAuthority = new ErrorAuthority();
```

#### Required Methods
- `errorAuthority.classifyError(error)`
- `errorAuthority.isRetryableError(error)`
- `errorAuthority.getRetryDelay(error, attempt)`
- `errorAuthority.shouldRetry(error, attempt)`

#### Dependency Chain
```
ErrorAuthority
  ↓
  ├── Provider Error Contracts
  └── Retry Policy Engine
```

### 7. LogService

**Location**: `apps/web/lib/runtime/services/log.service.ts` (accessed via RuntimeService)  
**Purpose**: Canonical logging service for execution and task logs  
**Dependency Level**: MEDIUM (orchestrators auto-log, custom logging via LogService)

#### Access Pattern
```typescript
// Accessed via RuntimeService
await runtimeService.log.writeLog({
  execution_id: executionId,
  task_id: taskId,
  log_level: 'info',
  message: 'Log message',
  context: {},
});
```

#### Required Methods
- `runtimeService.log.writeLog(log)`
- `runtimeService.log.getExecutionLogs(executionId)`
- `runtimeService.log.getTaskLogs(taskId)`

#### Dependency Chain
```
LogService
  ↓
Runtime Database (log storage)
```

### 8. EventService

**Location**: `apps/web/lib/runtime/services/event.service.ts` (accessed via RuntimeService)  
**Purpose**: Canonical event service for execution and task events  
**Dependency Level**: MEDIUM (orchestrators auto-publish, custom events via EventService)

#### Access Pattern
```typescript
// Accessed via RuntimeService
await runtimeService.event.publishEvent({
  tenant_id: tenantId,
  execution_id: executionId,
  event_name: 'CUSTOM_EVENT',
  event_source: 'aria',
  event_version: '1.0',
  payload: {},
});
```

#### Required Methods
- `runtimeService.event.publishEvent(event)`
- `runtimeService.event.getExecutionEvents(executionId)`
- `runtimeService.event.subscribeToEvents(pattern, handler)`

#### Dependency Chain
```
EventService
  ↓
Runtime Database (event storage)
```

## Dependency Initialization Order

### Required Initialization Sequence
```typescript
// Step 1: Initialize RuntimeService (foundation)
const runtimeService = new RuntimeService({
  tenantId: context.tenantId,
  logOperations: true,
  enableMetrics: true,
});

// Step 2: Initialize CredentialInjectionAuthority (for connectors)
const credentialInjectionAuthority = new CredentialInjectionAuthority();

// Step 3: Initialize Connectors (depend on CredentialInjectionAuthority)
const dataforseoConnector = new DataForSEOConnector({
  tenantId: context.tenantId,
  credentialInjectionAuthority,
});

// Step 4: Initialize ErrorAuthority (for error handling)
const errorAuthority = new ErrorAuthority();

// Step 5: Initialize Orchestrators (depend on RuntimeService)
const executionOrchestrator = new ExecutionOrchestrator(runtimeService, {
  tenantId: context.tenantId,
  enableAutoLogging: true,
  enableAutoEvents: true,
});

const taskOrchestrator = new TaskOrchestrator(runtimeService, {
  tenantId: context.tenantId,
  enableAutoLogging: true,
  enableAutoEvents: true,
});
```

## Dependency Graph

```
RuntimeService (Foundation)
  ↓
  ├── ExecutionService
  ├── TaskService
  ├── EventService
  ├── LogService
  └── MetricsService
      ↓
      ExecutionOrchestrator (depends on RuntimeService)
      ↓
      TaskOrchestrator (depends on RuntimeService)
      
CredentialInjectionAuthority (Independent)
  ↓
  DataForSEOConnector (depends on CredentialInjectionAuthority)
  
ErrorAuthority (Independent)
  ↓
  (Used by orchestrators for error classification)
```

## Tenant Isolation Enforcement

### Dependency-Level Tenant Isolation

| Dependency | Tenant Isolation | Mechanism |
|------------|------------------|-----------|
| RuntimeService | ✅ FULL | Initialized with tenantId, passed to all services |
| ExecutionOrchestrator | ✅ FULL | Inherits tenantId from RuntimeService |
| TaskOrchestrator | ✅ FULL | Inherits tenantId from RuntimeService |
| DataForSEOConnector | ✅ FULL | Initialized with tenantId, BaseConnector enforces isolation |
| CredentialInjectionAuthority | ✅ FULL | Injects credentials only for specific tenant |
| ErrorAuthority | ⚠️ CONTEXT | Classifies errors, tenant context from caller |
| LogService | ✅ FULL | Logs scoped to tenantId via RuntimeService |
| EventService | ✅ FULL | Events scoped to tenantId via RuntimeService |

## Type Dependencies

### Required Type Imports

```typescript
// Runtime Types
import type { UUID, ISODateTime, Result } from '@/lib/runtime/types/common.types';

// Execution Types
import type {
  Execution,
  ExecutionInsert,
  ExecutionStatus,
} from '@/lib/runtime/types/execution.types';

// Task Types
import type {
  Task,
  TaskInsert,
  TaskStatus,
} from '@/lib/runtime/types/task.types';

// Orchestrator Types
import type {
  OrchestratorConfig,
  ExecutionPlan,
  TaskPlan,
  OrchestratorResult,
} from '@/lib/runtime/orchestrator/types';

// Connector Types
import type {
  BaseConnectorConfig,
  ConnectorResult,
} from '@/lib/runtime/connectors/base.connector';

// Provider Response Types
import type {
  DataForSEOResponseData,
  KeywordResearchResponse,
} from '@/lib/runtime/contracts/provider-response.contract';

// Provider Error Types
import type {
  ProviderError,
  AuthenticationError,
  RateLimitError,
} from '@/lib/runtime/contracts/provider-error.contract';
```

## Database Dependencies

### Current Database Access (NON-CANONICAL)
```typescript
const supabase = createSupabaseAdminClient();

const { data: businessProfile } = await supabase
  .from("business_profiles")
  .select("website_url, category")
  .eq("tenant_id", tenantId)
  .maybeSingle();
```

### Required Database Access (CANONICAL)
```typescript
// Option 1: Use Runtime Repositories
const businessProfile = await runtimeService.execution.getBusinessProfile(tenantId);

// Option 2: Store as Task Artifacts
await taskOrchestrator.completeTask(taskId, {
  business_profile: {
    website_url: extractedDomain,
    category: businessProfile.category,
  },
});

// Option 3: Use Execution Metadata
await executionOrchestrator.createExecution({
  agentName: 'ARIA',
  workflowType: 'keyword_intelligence',
  metadata: {
    business_profile: {
      website_url: extractedDomain,
      category: businessProfile.category,
    },
  },
});
```

## External API Dependencies

### Current External API Access
- **Status**: NONE (purged in TASK 4A.0)

### Required External API Access
- **DataForSEO API** - Via DataForSEOConnector (canonical)
- **No direct API calls** - All API calls must go through connectors

## Dependency Removal Requirements

### Dependencies to Remove
1. ❌ `createSupabaseAdminClient` - Replace with runtime repositories or task artifacts
2. ❌ Direct database queries - Replace with runtime services
3. ❌ console.log - Replace with LogService

### Dependencies to Add
1. ✅ RuntimeService
2. ✅ ExecutionOrchestrator
3. ✅ TaskOrchestrator
4. ✅ DataForSEOConnector
5. ✅ CredentialInjectionAuthority
6. ✅ ErrorAuthority
7. ✅ LogService (via RuntimeService)
8. ✅ EventService (via RuntimeService)

## Dependency Complexity Assessment

### Complexity Level: HIGH

**Reasons**:
- 8 new runtime dependencies required
- Complex initialization order
- Tight coupling between dependencies
- Type dependencies across multiple modules
- Tenant isolation enforcement at multiple layers

**Estimated Integration Effort**: Major refactoring required

## Dependency Testing Requirements

### Unit Tests Required
- RuntimeService initialization
- ExecutionOrchestrator integration
- TaskOrchestrator integration
- DataForSEOConnector integration
- CredentialInjectionAuthority integration

### Integration Tests Required
- Full execution flow
- Task creation and execution
- Connector execution
- Event publishing
- Log persistence

### Tenant Isolation Tests Required
- Cross-tenant credential leakage
- Cross-tenant execution leakage
- Cross-tenant task leakage
- Cross-tenant event leakage

## Certification Statement

**I hereby certify that the ARIA runtime dependency map has been completed.**

**Current Dependencies**: 2 (AgentContext, createSupabaseAdminClient)  
**Required Dependencies**: 8 (RuntimeService, ExecutionOrchestrator, TaskOrchestrator, DataForSEOConnector, CredentialInjectionAuthority, ErrorAuthority, LogService, EventService)  
**Dependency Gap**: 6 critical dependencies missing

**The following conditions have been identified:**
1. ✅ Current dependencies documented
2. ✅ Required dependencies documented
3. ✅ Initialization order documented
4. ✅ Dependency graph documented
5. ✅ Tenant isolation enforcement documented
6. ✅ Type dependencies documented
7. ✅ Database dependencies documented
8. ✅ External API dependencies documented
9. ✅ Dependency removal requirements documented
10. ✅ Dependency testing requirements documented

**ARIA requires complete dependency reconstruction through canonical runtime integration.**

---

**Mapped By**: CLAUX ARIA Operationalization  
**Task Reference**: TASK 4A.1  
**Next Task**: TASK 4A.2 (Canonical ARIA Task Implementation)

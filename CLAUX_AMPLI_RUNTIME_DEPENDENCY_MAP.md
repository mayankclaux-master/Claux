# CLAUX AMPLI Runtime Dependency Map

**Task**: TASK 4C.2 - Runtime Dependency Map  
**Status**: ✅ COMPLETED  
**Date**: 2026-05-21  
**Authority**: CLAUX AMPLI Operationalization

---

## Executive Summary

This document maps all runtime dependencies required for AMPLI operationalization. AMPLI requires integration with canonical runtime services, runtime connectors, and authority systems to become CLAUX's third canonical autonomous publishing execution agent.

**DEPENDENCY MAP STATUS**: ✅ COMPLETED  
**TOTAL DEPENDENCIES**: 15

---

## Runtime Service Dependencies

### 1. RuntimeService

**Location**: `apps/web/lib/runtime/services/runtime.service.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: Single entry point for runtime operations  
**Integration Required**: YES

**Composition**:
- ExecutionService
- TaskService
- EventService
- LogService
- MetricsService

**Integration Points**:
- Create executions via ExecutionService
- Create tasks via TaskService
- Publish events via EventService
- Publish logs via LogService
- Collect metrics via MetricsService

**Current AMPLI Integration**: ❌ NONE

---

### 2. ExecutionService

**Location**: `apps/web/lib/runtime/services/execution.service.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES (via RuntimeService)  
**Purpose**: Execution state management  
**Integration Required**: YES (via RuntimeService)

**Capabilities**:
- Create execution
- Update execution state
- Get execution by ID
- Get executions by tenant
- Delete execution

**Current AMPLI Integration**: ❌ NONE

---

### 3. TaskService

**Location**: `apps/web/lib/runtime/services/task.service.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES (via RuntimeService)  
**Purpose**: Task state management  
**Integration Required**: YES (via RuntimeService)

**Capabilities**:
- Create task
- Update task state
- Get task by ID
- Get tasks by execution
- Delete task

**Current AMPLI Integration**: ❌ NONE

---

## Orchestrator Dependencies

### 4. ExecutionOrchestrator

**Location**: `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: Coordinates execution lifecycle  
**Integration Required**: YES

**Capabilities**:
- createExecution()
- startExecution()
- completeExecution()
- failExecution()
- cancelExecution()
- retryExecution()

**Integration Points**:
- Create execution for publishing workflow
- Start execution
- Complete execution on success
- Fail execution on error
- Automatic event publishing
- Automatic logging

**Current AMPLI Integration**: ❌ NONE

---

### 5. TaskOrchestrator

**Location**: `apps/web/lib/runtime/orchestrator/task-orchestrator.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: Coordinates task lifecycle  
**Integration Required**: YES

**Capabilities**:
- createTask()
- createTaskBatch()
- startTask()
- completeTask()
- failTask()
- cancelTask()

**Integration Points**:
- Create publishing tasks
- Start publishing tasks
- Complete publishing tasks
- Fail publishing tasks
- Automatic event publishing
- Automatic logging

**Current AMPLI Integration**: ❌ NONE

---

## Connector Dependencies

### 6. WordPressConnector

**Location**: `apps/web/lib/runtime/connectors/wordpress.connector.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: WordPress REST API execution  
**Integration Required**: YES

**Operations**:
- publish_post
- update_post
- delete_post
- get_post

**Authentication**: Basic Auth (username/password)

**Current AMPLI Integration**: ❌ NONE

---

### 7. CustomAPIConnector

**Location**: `apps/web/lib/runtime/connectors/custom-api.connector.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: Custom API execution  
**Integration Required**: YES

**Operations**:
- GET
- POST
- PUT
- DELETE
- PATCH

**Authentication**: Bearer token

**Current AMPLI Integration**: ❌ NONE

---

### 8. ShopifyConnector

**Location**: DOES NOT EXIST  
**Status**: MISSING  
**Required**: YES  
**Purpose**: Shopify API execution  
**Integration Required**: YES (after implementation)

**Operations Required**:
- publish_product
- update_product
- delete_product

**Authentication**: API key / OAuth

**Current AMPLI Integration**: ❌ NONE (connector missing)

---

### 9. WebflowConnector

**Location**: DOES NOT EXIST  
**Status**: MISSING  
**Required**: YES  
**Purpose**: Webflow API execution  
**Integration Required**: YES (after implementation)

**Operations Required**:
- publish_item
- update_item
- delete_item

**Authentication**: API token

**Current AMPLI Integration**: ❌ NONE (connector missing)

---

### 10. GhostConnector

**Location**: DOES NOT EXIST  
**Status**: MISSING  
**Required**: YES  
**Purpose**: Ghost API execution  
**Integration Required**: YES (after implementation)

**Operations Required**:
- publish_post
- update_post
- delete_post

**Authentication**: Admin API key

**Current AMPLI Integration**: ❌ NONE (connector missing)

---

## Authority Dependencies

### 11. CredentialInjectionAuthority

**Location**: `apps/web/lib/runtime/authority/credential-injection-authority.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: Tenant-scoped credential injection  
**Integration Required**: YES (via connectors)

**Capabilities**:
- injectCredentials(provider, tenantId)
- Credential decryption
- Credential sanitization

**Integration Points**:
- Connectors use CredentialInjectionAuthority for credential injection
- Tenant-scoped credential retrieval
- No direct credential access in agents

**Current AMPLI Integration**: ❌ NONE (direct database access)

---

### 12. ErrorAuthority

**Location**: `apps/web/lib/runtime/authority/error-authority.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: Error decision making  
**Integration Required**: YES (via RuntimeService)

**Capabilities**:
- makeDecision(error, retryCount)
- Error classification
- Retry decision logic

**Integration Points**:
- RuntimeService uses ErrorAuthority for retry decisions
- No retry logic in agents
- No retry logic in tasks

**Current AMPLI Integration**: ❌ NONE

---

## Service Dependencies

### 13. LogService

**Location**: `apps/web/lib/runtime/services/log.service.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: Canonical logging  
**Integration Required**: YES (via RuntimeService)

**Capabilities**:
- publishLog(log)
- Get logs by tenant
- Get logs by execution
- Get logs by task

**Integration Points**:
- RuntimeService uses LogService for logging
- Orchestrators use LogService automatically
- No direct logging in agents

**Current AMPLI Integration**: ❌ NONE (console.log used)

---

### 14. EventService

**Location**: `apps/web/lib/runtime/services/event.service.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: Canonical event publishing  
**Integration Required**: YES (via RuntimeService)

**Capabilities**:
- publishEvent(event)
- Get events by tenant
- Get events by execution
- Get events by task

**Integration Points**:
- RuntimeService uses EventService for events
- Orchestrators use EventService automatically
- No direct event publishing in agents

**Current AMPLI Integration**: ❌ NONE

---

### 15. MetricsService

**Location**: `apps/web/lib/runtime/services/metrics.service.ts`  
**Status**: EXISTS, OPERATIONAL  
**Required**: YES  
**Purpose**: Metrics collection  
**Integration Required**: YES (via RuntimeService)

**Capabilities**:
- collectMetric(metric)
- Get metrics by tenant
- Get metrics by execution
- Get metrics by task

**Integration Points**:
- RuntimeService uses MetricsService for metrics
- Connectors return metrics in ProviderResponse
- No direct metrics collection in agents

**Current AMPLI Integration**: ❌ NONE

---

## Dependency Status Summary

| Dependency | Status | Exists | Required | Current Integration |
|------------|--------|--------|----------|---------------------|
| RuntimeService | ✅ OPERATIONAL | YES | YES | ❌ NONE |
| ExecutionService | ✅ OPERATIONAL | YES | YES (via RuntimeService) | ❌ NONE |
| TaskService | ✅ OPERATIONAL | YES | YES (via RuntimeService) | ❌ NONE |
| ExecutionOrchestrator | ✅ OPERATIONAL | YES | YES | ❌ NONE |
| TaskOrchestrator | ✅ OPERATIONAL | YES | YES | ❌ NONE |
| WordPressConnector | ✅ OPERATIONAL | YES | YES | ❌ NONE |
| CustomAPIConnector | ✅ OPERATIONAL | YES | YES | ❌ NONE |
| ShopifyConnector | ❌ MISSING | NO | YES | ❌ NONE |
| WebflowConnector | ❌ MISSING | NO | YES | ❌ NONE |
| GhostConnector | ❌ MISSING | NO | YES | ❌ NONE |
| CredentialInjectionAuthority | ✅ OPERATIONAL | YES | YES | ❌ NONE |
| ErrorAuthority | ✅ OPERATIONAL | YES | YES | ❌ NONE |
| LogService | ✅ OPERATIONAL | YES | YES | ❌ NONE |
| EventService | ✅ OPERATIONAL | YES | YES | ❌ NONE |
| MetricsService | ✅ OPERATIONAL | YES | YES | ❌ NONE |

---

## Integration Priority

### High Priority (Required for Operationalization)

1. **RuntimeService** - Core execution authority
2. **ExecutionOrchestrator** - Execution lifecycle
3. **TaskOrchestrator** - Task lifecycle
4. **WordPressConnector** - WordPress publishing
5. **CustomAPIConnector** - Custom API publishing
6. **CredentialInjectionAuthority** - Credential injection
7. **LogService** - Canonical logging
8. **EventService** - Canonical events

### Medium Priority (Required for Full CMS Support)

9. **ShopifyConnector** - Shopify publishing (needs implementation)
10. **WebflowConnector** - Webflow publishing (needs implementation)
11. **GhostConnector** - Ghost publishing (needs implementation)

### Low Priority (Automatically via RuntimeService)

12. **ExecutionService** - Via RuntimeService
13. **TaskService** - Via RuntimeService
14. **ErrorAuthority** - Via RuntimeService
15. **MetricsService** - Via RuntimeService

---

## Integration Order

### Phase 1: Core Runtime Integration

1. Integrate RuntimeService
2. Integrate ExecutionOrchestrator
3. Integrate TaskOrchestrator

### Phase 2: Connector Integration

4. Integrate WordPressConnector
5. Integrate CustomAPIConnector

### Phase 3: Authority Integration

6. Integrate CredentialInjectionAuthority (via connectors)
7. Integrate ErrorAuthority (via RuntimeService)
8. Integrate LogService (via RuntimeService)
9. Integrate EventService (via RuntimeService)

### Phase 4: Missing Connector Implementation

10. Implement ShopifyConnector
11. Implement WebflowConnector
12. Implement GhostConnector

### Phase 5: Full Integration

13. Integrate all new connectors
14. Test closed loop execution
15. Validate operational readiness

---

## Certification Statement

**I hereby certify that all runtime dependencies for AMPLI operationalization have been mapped.**

**The following conditions have been met:**
1. ✅ All runtime services mapped
2. ✅ All orchestrators mapped
3. ✅ All existing connectors mapped
4. ✅ All missing connectors identified
5. ✅ All authority systems mapped
6. ✅ All service dependencies mapped
7. ✅ Integration priorities defined
8. ✅ Integration order defined
9. ✅ Current integration status documented
10. ✅ Gap analysis completed

**AMPLI requires integration with 15 runtime dependencies to become fully operational.**

**12 dependencies exist and are operational.**
**3 dependencies (ShopifyConnector, WebflowConnector, GhostConnector) are missing and require implementation.**

---

**TASK 4C.2 - Runtime Dependency Map**: ✅ COMPLETED  
**Next Task**: TASK 4C.3 - Execution Flow Map

---

**END OF MAP**

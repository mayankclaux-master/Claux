# CLAUX AMPLI Execution Flow Map

**Task**: TASK 4C.3 - Execution Flow Map  
**Status**: ✅ COMPLETED  
**Date**: 2026-05-21  
**Authority**: CLAUX AMPLI Operationalization

---

## Executive Summary

This document maps the current and target execution flows for AMPLI. The current flow is non-canonical with direct database access and no runtime integration. The target flow is canonical with full runtime integration and proper authority delegation.

**EXECUTION FLOW STATUS**: ✅ COMPLETED  
**CURRENT FLOW**: NON-CANONICAL  
**TARGET FLOW**: CANONICAL

---

## Current Execution Flow (NON-CANONICAL)

### Current Flow Diagram

```
runPUBLISH(context)
  ↓
executePUBLISH(context, executionId)
  ↓
[DIRECT DATABASE ACCESS] createSupabaseAdminClient()
  ↓
[DIRECT DATABASE QUERY] Fetch CMS config from cms_credentials table
  ↓
[DIRECT DATABASE QUERY] Fetch draft content from scribe_content table
  ↓
Loop through draft content:
  ↓
  [DIRECT DATABASE UPDATE] Update content status to publishing
  ↓
  [DIRECT DATABASE INSERT] Create publish job in publish_jobs table
  ↓
  [DIRECT DATABASE UPDATE] Update job to publishing
  ↓
  [SANITIZATION] Sanitize HTML
  ↓
  [SLUG GENERATION] Generate slug
  ↓
  [THROWS ERROR] RuntimeService integration required
  ↓
  [DEAD CODE] All publishing code removed
```

### Current Flow Analysis

**Non-Canonical Components**:
1. Direct database access (createSupabaseAdminClient)
2. Direct database queries (cms_credentials, scribe_content, publish_jobs)
3. Direct database updates (content status, job status)
4. Direct database inserts (publish jobs)
5. No RuntimeService integration
6. No ExecutionOrchestrator integration
7. No TaskOrchestrator integration
8. No connector integration
9. No canonical event publishing
10. No canonical logging

**Canonical Components**:
1. Structured logging (console.log - non-canonical but functional)
2. HTML sanitization (good security practice)
3. Slug generation (good for publishing)
4. Duplicate prevention (good for data integrity)

---

## Target Execution Flow (CANONICAL)

### Target Flow Diagram

```
runPUBLISH(context)
  ↓
executePUBLISH(context, executionId)
  ↓
[INITIALIZE] RuntimeService with tenantId
  ↓
[INITIALIZE] ExecutionOrchestrator with RuntimeService
  ↓
[INITIALIZE] TaskOrchestrator with RuntimeService
  ↓
[CREATE EXECUTION] ExecutionOrchestrator.createExecution()
  ↓
  → EventService: Publish EXECUTION_CREATED event
  → LogService: Publish execution creation log
  ↓
[START EXECUTION] ExecutionOrchestrator.startExecution()
  ↓
  → EventService: Publish EXECUTION_STARTED event
  → LogService: Publish execution start log
  ↓
[FETCH CMS CONFIG] RuntimeService: Fetch from runtime persistence
  ↓
[FETCH DRAFT CONTENT] RuntimeService: Fetch from runtime persistence
  ↓
Loop through draft content:
  ↓
  [CREATE TASK] TaskOrchestrator.createTask()
  ↓
    → EventService: Publish TASK_CREATED event
    → LogService: Publish task creation log
  ↓
  [START TASK] TaskOrchestrator.startTask()
  ↓
    → EventService: Publish TASK_STARTED event
    → LogService: Publish task start log
  ↓
  [EXECUTE TASK] ScribeTaskExecutorFactory.createExecutor()
  ↓
  [EXECUTE] TaskExecutor.execute()
  ↓
    [CONNECTOR] WordPressConnector.execute() or CustomAPIConnector.execute()
  ↓
      [CREDENTIAL INJECTION] CredentialInjectionAuthority.injectCredentials()
  ↓
      [PROVIDER CALL] WordPress REST API or Custom API
  ↓
      [RESPONSE] ProviderResponse with canonical structure
  ↓
    [RESULT] TaskExecutionResult with canonical structure
  ↓
  [COMPLETE TASK] TaskOrchestrator.completeTask()
  ↓
    → EventService: Publish TASK_COMPLETED event
    → LogService: Publish task completion log
    → RuntimeService: Persist task result
  ↓
[COMPLETE EXECUTION] ExecutionOrchestrator.completeExecution()
  ↓
  → EventService: Publish EXECUTION_COMPLETED event
  → LogService: Publish execution completion log
  → RuntimeService: Persist execution result
```

### Target Flow Analysis

**Canonical Components**:
1. RuntimeService integration (sole execution authority)
2. ExecutionOrchestrator integration (sole orchestration authority)
3. TaskOrchestrator integration (sole task authority)
4. Canonical task execution (via ScribeTaskExecutorFactory)
5. Canonical connector execution (via WordPressConnector, CustomAPIConnector)
6. Canonical credential injection (via CredentialInjectionAuthority)
7. Canonical event publishing (via EventService)
8. Canonical logging (via LogService)
9. Canonical persistence (via RuntimeService)
10. Canonical error handling (via ErrorAuthority)

**Non-Canonical Components**:
1. None (target flow is fully canonical)

---

## Closed Loop Execution Flow

### Closed Loop Diagram

```
ARIA (Keyword Intelligence)
  ↓
[KEYWORD RESEARCH] DataForSEOConnector.execute()
  ↓
[KEYWORD DATA] Persisted to runtime_tasks
  ↓
SCRIBE (Content Generation)
  ↓
[ARTICLE GENERATION] OpenAIConnector.execute()
  ↓
[CONTENT DATA] Persisted to scribe_content
  ↓
AMPLI (Publishing)
  ↓
[CMS PUBLISHING] WordPressConnector.execute() or CustomAPIConnector.execute()
  ↓
[PUBLISHING DATA] Persisted to publish_jobs
  ↓
[CLOSED LOOP COMPLETE]
```

### Closed Loop Analysis

**Current Status**:
- ARIA: ✅ OPERATIONAL (5 canonical tasks, runtime integrated)
- SCRIBE: ✅ OPERATIONAL (8 canonical tasks, runtime integrated)
- AMPLI: ❌ NON-OPERATIONAL (no canonical tasks, no runtime integration)

**Closed Loop Gaps**:
1. AMPLI has no canonical task implementations
2. AMPLI has no runtime integration
3. AMPLI has no connector integration
4. AMPLI has no artifact passing from SCRIBE
5. AMPLI has no closed loop orchestration

---

## Task Execution Flow

### WordPress Publish Task Flow

```
WordPressPublishTask.execute()
  ↓
[INPUT VALIDATION] Validate title, content, siteUrl
  ↓
[CONNECTOR EXECUTION] WordPressConnector.execute('publish_post', {...})
  ↓
  [CREDENTIAL INJECTION] CredentialInjectionAuthority.injectCredentials('wordpress', tenantId)
  ↓
  [REQUEST PREPARATION] Prepare WordPress REST API request
  ↓
  [PROVIDER CALL] WordPress REST API POST /wp-json/wp/v2/posts
  ↓
  [RESPONSE PARSING] Parse WordPress response
  ↓
  [RESULT CONSTRUCTION] Construct TaskExecutionResult
  ↓
[RETURN] TaskExecutionResult with cms_post_id, status, metrics
```

### Custom API Publish Task Flow

```
CustomAPIPublishTask.execute()
  ↓
[INPUT VALIDATION] Validate apiUrl, apiKey, method, body
  ↓
[CONNECTOR EXECUTION] CustomAPIConnector.execute('custom_api_call', {...})
  ↓
  [CREDENTIAL INJECTION] CredentialInjectionAuthority.injectCredentials('custom-api', tenantId)
  ↓
  [REQUEST PREPARATION] Prepare Custom API request
  ↓
  [PROVIDER CALL] Custom API (GET/POST/PUT/DELETE/PATCH)
  ↓
  [RESPONSE PARSING] Parse Custom API response
  ↓
  [RESULT CONSTRUCTION] Construct TaskExecutionResult
  ↓
[RETURN] TaskExecutionResult with response_data, status, metrics
```

---

## Error Handling Flow

### Canonical Error Handling Flow

```
TaskExecutor.execute()
  ↓
[ERROR OCCURS] ProviderError from connector
  ↓
[ERROR AUTHORITY] ErrorAuthority.makeDecision(error, retryCount)
  ↓
  [DECISION] RETRY / FAIL / ABORT
  ↓
[IF RETRY]
  ↓
  [RETRY LOGIC] RuntimeService handles retry
  ↓
  [INCREMENT RETRY COUNT]
  ↓
  [EXPONENTIAL BACKOFF]
  ↓
  [RE-EXECUTE TASK]
  ↓
[IF FAIL]
  ↓
  [TASK ORCHESTRATOR] TaskOrchestrator.failTask()
  ↓
    → EventService: Publish TASK_FAILED event
    → LogService: Publish task failure log
  ↓
[IF ABORT]
  ↓
  [EXECUTION ORCHESTRATOR] ExecutionOrchestrator.failExecution()
  ↓
    → EventService: Publish EXECUTION_ABORTED event
    → LogService: Publish execution abort log
```

### Current Error Handling Flow

```
TaskExecutor.execute()
  ↓
[ERROR OCCURS]
  ↓
[THROW ERROR] Direct throw
  ↓
[CATCH ERROR] Try-catch in executePUBLISH
  ↓
[LOG ERROR] structuredLog("error", {...})
  ↓
[CONTINUE] Continue with next content item
```

---

## Event Publishing Flow

### Canonical Event Publishing Flow

```
ExecutionOrchestrator.createExecution()
  ↓
[EVENT SERVICE] EventService.publishEvent({
  event_name: EXECUTION_CREATED,
  tenant_id,
  execution_id,
  payload: {...}
})
  ↓
[PERSIST] RuntimeService persists event
  ↓
[NOTIFY] Subscribers notified

TaskOrchestrator.createTask()
  ↓
[EVENT SERVICE] EventService.publishEvent({
  event_name: TASK_CREATED,
  tenant_id,
  execution_id,
  task_id,
  payload: {...}
})
  ↓
[PERSIST] RuntimeService persists event
  ↓
[NOTIFY] Subscribers notified
```

### Current Event Publishing Flow

```
[NO EVENT PUBLISHING]
```

---

## Logging Flow

### Canonical Logging Flow

```
ExecutionOrchestrator (enableAutoLogging: true)
  ↓
[LOG SERVICE] LogService.publishLog({
  tenant_id,
  execution_id,
  level: INFO,
  message: "Execution created",
  metadata: {...}
})
  ↓
[PERSIST] RuntimeService persists log
  ↓
[QUERY] Logs queryable by tenant, execution, task

TaskOrchestrator (enableAutoLogging: true)
  ↓
[LOG SERVICE] LogService.publishLog({
  tenant_id,
  execution_id,
  task_id,
  level: INFO,
  message: "Task created",
  metadata: {...}
})
  ↓
[PERSIST] RuntimeService persists log
  ↓
[QUERY] Logs queryable by tenant, execution, task
```

### Current Logging Flow

```
structuredLog(level, data)
  ↓
[CONSOLE.LOG] console.log(JSON.stringify({...}))
  ↓
[NO PERSISTENCE] Logs not persisted
  ↓
[NO QUERY] Logs not queryable
```

---

## Persistence Flow

### Canonical Persistence Flow

```
RuntimeService
  ↓
[EXECUTION PERSISTENCE] runtime_executions table
  ↓
[TASK PERSISTENCE] runtime_tasks table
  ↓
[EVENT PERSISTENCE] runtime_events table
  ↓
[LOG PERSISTENCE] runtime_logs table
  ↓
[METRICS PERSISTENCE] runtime_metrics table
  ↓
[ARTIFACT PERSISTENCE] scribe_content, publish_jobs tables (via runtime)
```

### Current Persistence Flow

```
Direct Database Access
  ↓
[SUPABASE CLIENT] createSupabaseAdminClient()
  ↓
[DIRECT QUERY] cms_credentials table
  ↓
[DIRECT QUERY] scribe_content table
  ↓
[DIRECT INSERT] publish_jobs table
  ↓
[DIRECT UPDATE] scribe_content table
  ↓
[DIRECT UPDATE] publish_jobs table
```

---

## Certification Statement

**I hereby certify that the AMPLI execution flow has been mapped.**

**The following conditions have been met:**
1. ✅ Current execution flow documented
2. ✅ Target execution flow documented
3. ✅ Closed loop execution flow documented
4. ✅ Task execution flows documented
5. ✅ Error handling flow documented
6. ✅ Event publishing flow documented
7. ✅ Logging flow documented
8. ✅ Persistence flow documented
9. ✅ Canonical vs non-canonical components identified
10. ✅ Integration requirements defined

**Current flow is NON-CANONICAL with direct database access and no runtime integration.**

**Target flow is CANONICAL with full runtime integration and proper authority delegation.**

---

**TASK 4C.3 - Execution Flow Map**: ✅ COMPLETED  
**Next Task**: TASK 4C.4 - Provider Execution Audit

---

**END OF MAP**

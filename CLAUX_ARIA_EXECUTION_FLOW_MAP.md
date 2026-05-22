# CLAUX ARIA Execution Flow Map

**Task**: TASK 4A.1 - ARIA Service Audit  
**Status**: ✅ COMPLETED  
**Date**: 2026-05-20  
**Authority**: CLAUX ARIA Operationalization

---

## Executive Summary

This document maps the current ARIA execution flow versus the required canonical execution flow. The current flow is broken (throws error), while the required flow integrates ARIA with all canonical runtime authorities.

## Current ARIA Execution Flow (BROKEN)

```
Dashboard/UI
  ↓
runARIA(context)
  ↓
executeARIA(context, executionId)
  ↓
Fetch business profile from database
  ↓
Extract domain
  ↓
[THROWS ERROR] RuntimeService integration required for keyword research
  ↓
[DEAD CODE] All subsequent code unreachable
```

### Current Flow Characteristics
- **Status**: NON-FUNCTIONAL
- **Runtime Integration**: NONE
- **Orchestrator Integration**: NONE
- **Connector Integration**: NONE
- **Logging**: Non-canonical (console.log)
- **Event Publishing**: NONE
- **Error Handling**: Basic try/catch only
- **Credential Injection**: NONE
- **Tenant Isolation**: Partial (via database queries only)

## Required Canonical ARIA Execution Flow

```
Dashboard/UI
  ↓
RuntimeService (initialize with tenantId)
  ↓
ExecutionOrchestrator (create execution)
  ↓
TaskOrchestrator (create tasks)
  ↓
ARIA Task Generation (5 canonical tasks)
  ↓
DataForSEOConnector (execute via connector)
  ↓
CredentialInjectionAuthority (inject credentials)
  ↓
Provider API (DataForSEO)
  ↓
Canonical Provider Response Contracts
  ↓
Task Artifacts (store results)
  ↓
Execution Persistence (via repositories)
  ↓
EventService (publish events)
  ↓
LogService (canonical logging)
  ↓
ErrorAuthority (error handling and retry)
```

### Required Flow Characteristics
- **Status**: TO BE IMPLEMENTED
- **Runtime Integration**: FULL
- **Orchestrator Integration**: FULL
- **Connector Integration**: FULL
- **Logging**: Canonical (LogService)
- **Event Publishing**: FULL (EventService)
- **Error Handling**: Canonical (ErrorAuthority)
- **Credential Injection**: Canonical (CredentialInjectionAuthority)
- **Tenant Isolation**: FULL (enforced at all layers)

## Detailed Flow Breakdown

### Phase 1: Initialization

#### Current State
```typescript
// NO INITIALIZATION
// ARIA has no runtime integration
```

#### Required State
```typescript
const runtimeService = new RuntimeService({
  tenantId: context.tenantId,
  logOperations: true,
  enableMetrics: true,
});

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

const credentialInjectionAuthority = new CredentialInjectionAuthority();

const dataforseoConnector = new DataForSEOConnector({
  tenantId: context.tenantId,
  credentialInjectionAuthority,
});
```

### Phase 2: Execution Creation

#### Current State
```typescript
// NO EXECUTION CREATION
// ARIA has no ExecutionOrchestrator integration
```

#### Required State
```typescript
const executionPlan = {
  agentName: 'ARIA',
  workflowType: 'keyword_intelligence',
  inputPayload: {
    domain: extractedDomain,
    category: businessProfile.category,
  },
};

const executionResult = await executionOrchestrator.createExecution(executionPlan);
if (!executionResult.success) {
  throw new Error(`Failed to create execution: ${executionResult.error}`);
}

const executionId = executionResult.data;

const startResult = await executionOrchestrator.startExecution(executionId);
if (!startResult.success) {
  throw new Error(`Failed to start execution: ${startResult.error}`);
}
```

### Phase 3: Task Generation

#### Current State
```typescript
// NO TASK GENERATION
// ARIA has no TaskOrchestrator integration
```

#### Required State
```typescript
// Task 1: Keyword Research
const keywordResearchTask = {
  taskName: 'task_keyword_research',
  taskType: 'keyword_research',
  stepOrder: 1,
  inputPayload: {
    domain: extractedDomain,
    location: 'us',
    language: 'en',
  },
};

const task1Result = await taskOrchestrator.createTask(executionId, keywordResearchTask);
if (!task1Result.success) {
  throw new Error(`Failed to create keyword research task: ${task1Result.error}`);
}

// Task 2: SERP Analysis (dependent on Task 1)
const serpAnalysisTask = {
  taskName: 'task_serp_analysis',
  taskType: 'serp_analysis',
  stepOrder: 2,
  dependsOn: [task1Result.data], // Dependency on keyword research
  inputPayload: {
    keywords: [], // Will be populated from Task 1 results
    location: 'us',
    language: 'en',
  },
};

// Task 3: Keyword Clustering (dependent on Task 1)
const clusteringTask = {
  taskName: 'task_keyword_clustering',
  taskType: 'keyword_clustering',
  stepOrder: 3,
  dependsOn: [task1Result.data],
  inputPayload: {
    keywords: [], // Will be populated from Task 1 results
  },
};

// Task 4: Competitor Gap Analysis (dependent on Task 1)
const competitorGapTask = {
  taskName: 'task_competitor_gap_analysis',
  taskType: 'competitor_gap_analysis',
  stepOrder: 4,
  dependsOn: [task1Result.data],
  inputPayload: {
    domain: extractedDomain,
    competitorDomains: [], // Will be populated from Task 1 results
  },
};

// Task 5: Search Intent Mapping (dependent on Task 1)
const intentMappingTask = {
  taskName: 'task_search_intent_mapping',
  taskType: 'search_intent_mapping',
  stepOrder: 5,
  dependsOn: [task1Result.data],
  inputPayload: {
    keywords: [], // Will be populated from Task 1 results
  },
};
```

### Phase 4: Task Execution

#### Current State
```typescript
// NO TASK EXECUTION
// ARIA throws error before execution
```

#### Required State
```typescript
// Execute Task 1: Keyword Research via DataForSEOConnector
const keywordResearchResult = await dataforseoConnector.execute({
  operation: 'keyword_research',
  payload: {
    domain: extractedDomain,
    location: 'us',
    language: 'en',
  },
});

// Store task result
await taskOrchestrator.completeTask(task1Result.data, {
  keywords: keywordResearchResult.data,
  total: keywordResearchResult.data.length,
});

// Execute Task 2: SERP Analysis (using keywords from Task 1)
const serpAnalysisResult = await dataforseoConnector.execute({
  operation: 'serp_analysis',
  payload: {
    keywords: keywordResearchResult.data.slice(0, 10), // Top 10 keywords
    location: 'us',
    language: 'en',
  },
});

// Execute Task 3: Keyword Clustering (internal logic)
const clusteringResult = await performKeywordClustering(keywordResearchResult.data);

// Execute Task 4: Competitor Gap Analysis
const competitorGapResult = await dataforseoConnector.execute({
  operation: 'competitor_analysis',
  payload: {
    domain: extractedDomain,
    competitorDomains: extractCompetitorDomains(serpAnalysisResult.data),
  },
});

// Execute Task 5: Search Intent Mapping (internal logic)
const intentMappingResult = await performIntentMapping(keywordResearchResult.data);
```

### Phase 5: Result Processing

#### Current State
```typescript
// NO RESULT PROCESSING
// All code below error throw is dead
```

#### Required State
```typescript
// Process keyword research results
const processedKeywords = keywordResearchResult.data
  .filter(kw => isValidKeyword(kw.keyword))
  .map(kw => ({
    keyword: normalizeKeyword(kw.keyword),
    search_volume: kw.volume,
    difficulty: kw.difficulty,
    intent: classifyIntent(kw.keyword),
    cpc: kw.cpc || 0,
  }));

// Quality filter
const qualityKeywords = processedKeywords.filter(kw => 
  kw.search_volume > 50 && kw.difficulty < 80
);

// Data limit
const finalKeywords = qualityKeywords.slice(0, 100);

// Store in task artifacts
await runtimeService.task.updateTask(task1Result.data, {
  output_payload: {
    keywords: finalKeywords,
    total_processed: processedKeywords.length,
    total_filtered: qualityKeywords.length,
    total_final: finalKeywords.length,
  },
});
```

### Phase 6: Persistence

#### Current State
```typescript
// DIRECT DATABASE ACCESS (bypasses runtime)
const { data: businessProfile } = await supabase
  .from("business_profiles")
  .select("website_url, category")
  .eq("tenant_id", tenantId)
  .maybeSingle();
```

#### Required State
```typescript
// Use canonical runtime repositories
// Or store as task artifacts
await executionOrchestrator.completeExecution(executionId, {
  output_payload: {
    keywords: finalKeywords,
    serp_data: serpAnalysisResult.data,
    clusters: clusteringResult.data,
    competitor_gaps: competitorGapResult.data,
    intent_mapping: intentMappingResult.data,
  },
});

// Results are persisted via ExecutionService and TaskService
// Tenant isolation enforced at repository layer
```

### Phase 7: Event Publishing

#### Current State
```typescript
// NO EVENT PUBLISHING
```

#### Required State
```typescript
// Events are automatically published by orchestrators
// ExecutionOrchestrator publishes:
// - EXECUTION_CREATED
// - EXECUTION_STARTED
// - EXECUTION_COMPLETED
// - EXECUTION_FAILED

// TaskOrchestrator publishes:
// - TASK_CREATED
// - TASK_STARTED
// - TASK_COMPLETED
// - TASK_FAILED

// Custom events can be published via EventService
await runtimeService.event.publishEvent({
  tenant_id: context.tenantId,
  execution_id: executionId,
  event_name: 'ARIA_KEYWORD_RESEARCH_COMPLETED',
  event_source: 'aria',
  event_version: '1.0',
  payload: {
    keyword_count: finalKeywords.length,
    domain: extractedDomain,
  },
});
```

### Phase 8: Logging

#### Current State
```typescript
function structuredLog(level: "info" | "error" | "warn", data: Record<string, unknown>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...data
  }));
}
```

#### Required State
```typescript
// Use canonical LogService
await runtimeService.log.writeLog({
  execution_id: executionId,
  task_id: task1Result.data,
  log_level: 'info',
  message: 'Keyword research completed',
  context: {
    keyword_count: finalKeywords.length,
    domain: extractedDomain,
  },
});

// Orchestrators automatically log lifecycle transitions
// Additional logging via LogService for custom events
```

### Phase 9: Error Handling

#### Current State
```typescript
try {
  await Promise.race([
    executeARIA(context, executionId),
    timeoutPromise
  ]);
} catch (error) {
  structuredLog("error", {
    error: error instanceof Error ? error.message : "Unknown error"
  });
}
```

#### Required State
```typescript
try {
  // ... execution logic
} catch (error) {
  // Use ErrorAuthority for error classification
  const errorType = ErrorAuthority.classifyError(error);
  
  // Log via LogService
  await runtimeService.log.writeLog({
    execution_id: executionId,
    log_level: 'error',
    message: error.message,
    context: { error_type: errorType },
  });
  
  // ExecutionOrchestrator handles retry logic
  // No agent-owned retry logic
  await executionOrchestrator.failExecution(executionId, error.message);
}
```

## Flow Comparison Summary

| Phase | Current State | Required State | Gap |
|-------|--------------|----------------|-----|
| Initialization | NONE | RuntimeService + Orchestrators + Connectors | CRITICAL |
| Execution Creation | NONE | ExecutionOrchestrator.createExecution | CRITICAL |
| Task Generation | NONE | TaskOrchestrator.createTask (5 tasks) | CRITICAL |
| Task Execution | ERROR | DataForSEOConnector.execute | CRITICAL |
| Result Processing | DEAD CODE | Intelligence functions + task artifacts | CRITICAL |
| Persistence | Direct DB | Runtime repositories + task artifacts | HIGH |
| Event Publishing | NONE | EventService + orchestrator auto-events | MEDIUM |
| Logging | console.log | LogService + orchestrator auto-logging | MEDIUM |
| Error Handling | Basic try/catch | ErrorAuthority + orchestrator retry | MEDIUM |
| Credential Injection | NONE | CredentialInjectionAuthority | HIGH |

## Tenant Isolation Enforcement

### Current State
- **Database Queries**: `eq("tenant_id", tenantId)` - PARTIAL
- **Execution Context**: No tenant context in runtime - NONE
- **Connector Execution**: No tenant isolation - NONE
- **Credential Injection**: No credential injection - NONE

### Required State
- **Database Queries**: Runtime repositories enforce tenant isolation - FULL
- **Execution Context**: RuntimeService initialized with tenantId - FULL
- **Connector Execution**: BaseConnector enforces tenant isolation - FULL
- **Credential Injection**: CredentialInjectionAuthority enforces tenant isolation - FULL

## Authority Boundaries

### Current State (BROKEN)
```
ARIA Agent
  ↓
[ERROR] RuntimeService integration required
  ↓
[DEAD CODE]
```

### Required State (CANONICAL)
```
Dashboard/UI (submit request only)
  ↓
RuntimeService (entry point, tenant context)
  ↓
ExecutionOrchestrator (execution lifecycle, retry)
  ↓
TaskOrchestrator (task lifecycle)
  ↓
ARIA Agent (intelligence + task generation only)
  ↓
DataForSEOConnector (provider execution, tenant isolation)
  ↓
CredentialInjectionAuthority (credential injection, tenant isolation)
  ↓
ErrorAuthority (error handling, retry)
  ↓
LogService (canonical logging)
  ↓
EventService (event publishing)
  ↓
Runtime Repositories (persistence, tenant isolation)
```

## Certification Statement

**I hereby certify that the ARIA execution flow has been mapped.**

**Current Flow**: BROKEN (throws error, no runtime integration)  
**Required Flow**: Canonical execution flow with full runtime integration  
**Gap Assessment**: 9/10 phases require complete implementation

**The following conditions have been identified:**
1. ✅ Current flow is documented
2. ✅ Required flow is documented
3. ✅ Gap analysis completed
4. ✅ Tenant isolation requirements documented
5. ✅ Authority boundaries documented

**ARIA requires complete flow reconstruction through canonical runtime integration.**

---

**Mapped By**: CLAUX ARIA Operationalization  
**Task Reference**: TASK 4A.1  
**Next Task**: TASK 4A.2 (Canonical ARIA Task Implementation)

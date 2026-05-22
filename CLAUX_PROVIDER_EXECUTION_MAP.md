# CLAUX Provider Execution Map

**Report Date:** 2025-01-19
**Phase:** Phase 3A - Provider Execution Sovereignty Migration
**Status:** EXECUTION TOPOLOGY DEFINED

## Executive Summary

This document provides a complete provider execution topology map for CLAUX. The map documents the canonical execution flow from agents through RuntimeService, ExecutionOrchestrator, Runtime Connectors, to providers. All execution must flow through this canonical path with runtime credential injection, event publishing, and logging.

**EXECUTION TOPOLOGY STATUS:** DEFINED AND LOCKED

---

## Canonical Execution Flow

### High-Level Flow

```
Agent (Business Logic)
    ↓ (declare execution intent)
RuntimeService (Tenant-Scoped Context)
    ↓ (credential injection)
ExecutionOrchestrator (Execution Lifecycle)
    ↓ (task creation)
TaskService (agent_tasks table)
    ↓ (task execution)
Runtime Connector (Provider Abstraction)
    ↓ (provider execution)
Provider API (External Provider)
    ↓ (response handling)
Runtime Connector (Response Normalization)
    ↓ (event publishing)
EventService (agent_events table)
    ↓ (log publishing)
LogService (agent_logs table)
    ↓ (execution completion)
ExecutionService (agent_executions table)
```

---

## Component Responsibilities

### Agent (Business Logic)

**Responsibilities:**
- Declare execution intent
- Provide business logic parameters
- Consume normalized provider responses
- NO direct provider calls
- NO credential management
- NO execution state management

**Forbidden:**
- ❌ Direct provider calls
- ❌ Credential retrieval
- ❌ Retry logic
- ❌ Logging authority
- ❌ Event publishing authority
- ❌ Execution state management

---

### RuntimeService (Sole Execution Authority)

**Responsibilities:**
- Tenant-scoped execution context
- Credential injection
- Rate limiting
- Quota tracking
- Cost tracking
- Telemetry collection
- Execution orchestration

**Configuration:**
```typescript
{
  tenantId: UUID,
  maxExecutionRetries: number,
  maxTaskRetries: number,
  logOperations: boolean,
  enableMetrics: boolean
}
```

**Forbidden:**
- ❌ Direct provider calls
- ❌ Business logic execution
- ❌ Agent-specific logic

---

### ExecutionOrchestrator (Execution Lifecycle)

**Responsibilities:**
- Execution state transitions
- Task orchestration
- Retry logic (sole authority)
- Backoff strategy
- Failure handling
- Escalation logic

**State Machine:**
```
PENDING → RUNNING → COMPLETED
    ↓         ↓
  FAILED   RETRYING
```

**Forbidden:**
- ❌ Direct provider calls
- ❌ Credential management
- ❌ Business logic

---

### Runtime Connector (Provider Abstraction)

**Responsibilities:**
- Request transformation (CLAUX format → Provider format)
- Provider execution (single request-response)
- Response normalization (Provider format → CLAUX format)
- Error normalization (Provider format → CLAUX format)
- Metadata extraction (rate limits, quotas, timing)

**Allowed:**
- ✅ Transform requests
- ✅ Execute provider API
- ✅ Normalize responses
- ✅ Normalize errors
- ✅ Extract metadata

**Forbidden:**
- ❌ Execution ownership
- ❌ Retry logic
- ❌ Backoff logic
- ❌ Rate limiting
- ❌ Logging authority
- ❌ Telemetry systems
- ❌ Credential retrieval
- ❌ State management
- ❌ Async state management
- ❌ Polling
- ❌ Callbacks
- ❌ Webhooks

---

### Provider API (External Provider)

**Responsibilities:**
- Execute provider-specific logic
- Return provider-specific responses

**Examples:**
- DataForSEO API
- OpenAI API
- SERP API
- Google My Business API
- WordPress REST API
- Shopify REST Admin API
- Custom REST API

---

### EventService (Sole Event Authority)

**Responsibilities:**
- Event publishing
- Event storage (agent_events table)
- Event querying
- Event streaming

**Event Types:**
- execution_started
- execution_completed
- execution_failed
- task_started
- task_completed
- task_failed
- provider_call_started
- provider_call_completed
- provider_call_failed

**Forbidden:**
- ❌ Business logic
- ❌ Execution decisions
- ❌ Provider calls

---

### LogService (Sole Logging Authority)

**Responsibilities:**
- Log publishing
- Log storage (agent_logs table)
- Log querying
- Log aggregation

**Log Levels:**
- info
- warn
- error
- debug

**Forbidden:**
- ❌ Business logic
- ❌ Execution decisions
- ❌ Provider calls

---

### MetricsService (Sole Telemetry Authority)

**Responsibilities:**
- Metrics collection
- Metrics aggregation
- Metrics storage
- Metrics querying

**Metric Types:**
- Execution count
- Execution duration
- Provider call count
- Provider call duration
- Error count
- Retry count
- Cost tracking
- Quota tracking

**Forbidden:**
- ❌ Business logic
- ❌ Execution decisions
- ❌ Provider calls

---

## Provider-Specific Execution Maps

### DataForSEO Execution Map

**Current State:** Direct call removed, awaiting RuntimeService integration

**Canonical Flow:**
```
ARIA Agent
    ↓ (declare keyword research intent)
RuntimeService (tenant-scoped context)
    ↓ (credential injection: DataForSEO API key)
ExecutionOrchestrator (execution lifecycle)
    ↓ (task creation)
TaskService (agent_tasks table)
    ↓ (task execution)
DataForSEO Runtime Connector
    ↓ (request transformation)
DataForSEO API
    ↓ (response: keyword data)
DataForSEO Runtime Connector
    ↓ (response normalization)
EventService (provider_call_completed event)
LogService (provider call log)
ExecutionService (execution completion)
    ↓ (normalized keyword data)
ARIA Agent (consumes keyword data)
```

**Request Transformation:**
```typescript
// CLAUX format
{
  target: string;
  keyword?: string;
  location_name?: string;
  language_name?: string;
}

// Provider format (DataForSEO)
[{
  target: string;
  keyword: string;
  location_name: string;
  language_name: string;
  depth: number;
  priority: number;
  se_domain: string;
}]
```

**Response Normalization:**
```typescript
// Provider format (DataForSEO)
{
  tasks: [{
    result: [{
      keyword_data: {
        keyword: string;
        search_volume: number;
        keyword_difficulty: number;
        cpc: number;
      }
    }]
  }]
}

// CLAUX format
{
  keyword: string;
  volume: number;
  difficulty: number;
  cpc?: number;
  intent?: string;
}
```

**Credential Injection:**
- Source: integrations table (encrypted)
- Field: dataforseo_api_key
- Injection: RuntimeService → DataForSEO Runtime Connector
- Storage: Never stored in adapter

---

### OpenAI Execution Map

**Current State:** Direct call removed, awaiting RuntimeService integration

**Canonical Flow:**
```
SCRIBE Agent
    ↓ (declare content generation intent)
RuntimeService (tenant-scoped context)
    ↓ (credential injection: OpenAI API key)
ExecutionOrchestrator (execution lifecycle)
    ↓ (task creation)
TaskService (agent_tasks table)
    ↓ (task execution)
OpenAI Runtime Connector
    ↓ (request transformation)
OpenAI API
    ↓ (response: generated content)
OpenAI Runtime Connector
    ↓ (response normalization)
EventService (provider_call_completed event)
LogService (provider call log)
ExecutionService (execution completion)
    ↓ (normalized content)
SCRIBE Agent (consumes content)
```

**Request Transformation:**
```typescript
// CLAUX format
{
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

// Provider format (OpenAI)
{
  model: string;
  messages: [{
    role: string;
    content: string;
  }];
  max_tokens: number;
  temperature: number;
}
```

**Response Normalization:**
```typescript
// Provider format (OpenAI)
{
  id: string;
  choices: [{
    message: {
      content: string;
    }
  }];
  usage: {
    total_tokens: number;
  };
}

// CLAUX format
{
  title: string;
  content: string;
  tokensUsed: number;
}
```

**Credential Injection:**
- Source: integrations table (encrypted)
- Field: openai_api_key
- Injection: RuntimeService → OpenAI Runtime Connector
- Storage: Never stored in adapter

---

### SERP Execution Map

**Current State:** Direct call removed, awaiting RuntimeService integration

**Canonical Flow:**
```
PULSE Agent
    ↓ (declare ranking check intent)
RuntimeService (tenant-scoped context)
    ↓ (credential injection: SERP API key)
ExecutionOrchestrator (execution lifecycle)
    ↓ (task creation)
TaskService (agent_tasks table)
    ↓ (task execution)
SERP Runtime Connector
    ↓ (request transformation)
SERP API
    ↓ (response: ranking data)
SERP Runtime Connector
    ↓ (response normalization)
EventService (provider_call_completed event)
LogService (provider call log)
ExecutionService (execution completion)
    ↓ (normalized ranking data)
PULSE Agent (consumes ranking data)
```

**Request Transformation:**
```typescript
// CLAUX format
{
  keyword: string;
  domain: string;
  location?: string;
  language?: string;
}

// Provider format (SERP)
{
  q: string;
  domain: string;
  location: string;
  hl: string;
  gl: string;
}
```

**Response Normalization:**
```typescript
// Provider format (SERP)
{
  organic_results: [{
    link: string;
    position: number;
  }]
}

// CLAUX format
{
  rank: number | null;
  url: string;
  position?: number;
  change?: number;
}
```

**Credential Injection:**
- Source: integrations table (encrypted)
- Field: serp_api_key
- Injection: RuntimeService → SERP Runtime Connector
- Storage: Never stored in adapter

---

### GMB Execution Map

**Current State:** Direct call removed, awaiting RuntimeService integration

**Canonical Flow:**
```
LOCL Agent
    ↓ (declare GMB audit intent)
RuntimeService (tenant-scoped context)
    ↓ (credential injection: Google access token)
ExecutionOrchestrator (execution lifecycle)
    ↓ (task creation)
TaskService (agent_tasks table)
    ↓ (task execution)
GMB Runtime Connector
    ↓ (request transformation)
Google My Business API
    ↓ (response: business profile)
GMB Runtime Connector
    ↓ (response normalization)
EventService (provider_call_completed event)
LogService (provider call log)
ExecutionService (execution completion)
    ↓ (normalized profile data)
LOCL Agent (consumes profile data)
```

**Request Transformation:**
```typescript
// CLAUX format
{
  locationId: string;
  fields?: string[];
}

// Provider format (GMB)
{
  name: string;
  readMask: string;
}
```

**Response Normalization:**
```typescript
// Provider format (GMB)
{
  title: string;
  primaryCategory: {
    displayName: string;
  };
  reviewCount: number;
  averageRating: number;
  photosCount: number;
  postsCount: number;
}

// CLAUX format
{
  gmb_name: string;
  primary_category: string;
  review_count: number;
  average_rating: number;
  photos_count: number;
  posts_count: number;
}
```

**Credential Injection:**
- Source: integrations table (encrypted)
- Field: google_access_token (fetched via getGoogleAccessToken)
- Injection: RuntimeService → GMB Runtime Connector
- Storage: Never stored in adapter

---

### WordPress Execution Map

**Current State:** Direct call removed, awaiting RuntimeService integration

**Canonical Flow:**
```
PUBLISH Agent
    ↓ (declare publish intent)
RuntimeService (tenant-scoped context)
    ↓ (credential injection: WordPress credentials)
ExecutionOrchestrator (execution lifecycle)
    ↓ (task creation)
TaskService (agent_tasks table)
    ↓ (task execution)
WordPress Runtime Connector
    ↓ (request transformation)
WordPress REST API
    ↓ (response: published post)
WordPress Runtime Connector
    ↓ (response normalization)
EventService (provider_call_completed event)
LogService (provider call log)
ExecutionService (execution completion)
    ↓ (normalized response)
PUBLISH Agent (consumes response)
```

**Request Transformation:**
```typescript
// CLAUX format
{
  title: string;
  content: string;
  slug?: string;
  status?: 'draft' | 'publish' | 'pending';
  categories?: number[];
}

// Provider format (WordPress)
{
  title: string;
  content: string;
  slug: string;
  status: string;
  categories: number[];
}
```

**Response Normalization:**
```typescript
// Provider format (WordPress)
{
  id: number;
  link: string;
  status: string;
  date: string;
}

// CLAUX format
{
  id: number;
  url: string;
  status: string;
  date: string;
}
```

**Credential Injection:**
- Source: integrations table (encrypted)
- Fields: wordpress_username, wordpress_application_password
- Injection: RuntimeService → WordPress Runtime Connector
- Storage: Never stored in adapter

---

### Shopify Execution Map

**Current State:** Direct call removed, awaiting RuntimeService integration

**Canonical Flow:**
```
PUBLISH Agent
    ↓ (declare publish intent)
RuntimeService (tenant-scoped context)
    ↓ (credential injection: Shopify access token)
ExecutionOrchestrator (execution lifecycle)
    ↓ (task creation)
TaskService (agent_tasks table)
    ↓ (task execution)
Shopify Runtime Connector
    ↓ (request transformation)
Shopify REST Admin API
    ↓ (response: published article)
Shopify Runtime Connector
    ↓ (response normalization)
EventService (provider_call_completed event)
LogService (provider call log)
ExecutionService (execution completion)
    ↓ (normalized response)
PUBLISH Agent (consumes response)
```

**Request Transformation:**
```typescript
// CLAUX format
{
  title: string;
  content: string;
  handle?: string;
  published?: boolean;
  tags?: string;
  blogId: string;
}

// Provider format (Shopify)
{
  article: {
    title: string;
    body_html: string;
    handle: string;
    published: boolean;
    tags: string;
  }
}
```

**Response Normalization:**
```typescript
// Provider format (Shopify)
{
  article: {
    id: number;
    admin_graphql_api_id: string;
    handle: string;
    published_at: string;
  }
}

// CLAUX format
{
  id: number;
  admin_graphql_api_id: string;
  handle: string;
  published_at: string;
}
```

**Credential Injection:**
- Source: integrations table (encrypted)
- Fields: shopify_access_token, shopify_blog_id
- Injection: RuntimeService → Shopify Runtime Connector
- Storage: Never stored in adapter

---

### Custom API Execution Map

**Current State:** Direct call removed, awaiting RuntimeService integration

**Canonical Flow:**
```
PUBLISH Agent
    ↓ (declare publish intent)
RuntimeService (tenant-scoped context)
    ↓ (credential injection: Custom API credentials)
ExecutionOrchestrator (execution lifecycle)
    ↓ (task creation)
TaskService (agent_tasks table)
    ↓ (task execution)
Custom API Runtime Connector
    ↓ (request transformation)
Custom REST API
    ↓ (response: published content)
Custom API Runtime Connector
    ↓ (response normalization)
EventService (provider_call_completed event)
LogService (provider call log)
ExecutionService (execution completion)
    ↓ (normalized response)
PUBLISH Agent (consumes response)
```

**Request Transformation:**
```typescript
// CLAUX format
{
  title: string;
  content: string;
  slug?: string;
  status?: 'draft' | 'published';
  [key: string]: unknown; // Flexible for custom APIs
}

// Provider format (Custom API)
{
  title: string;
  content: string;
  html: string;
  slug: string;
  status: string;
  [key: string]: unknown; // Flexible for custom APIs
}
```

**Response Normalization:**
```typescript
// Provider format (Custom API)
{
  id?: string;
  url?: string;
  status?: string;
  [key: string]: unknown; // Flexible for custom APIs
}

// CLAUX format
{
  id?: string;
  url?: string;
  status?: string;
  [key: string]: unknown; // Flexible for custom APIs
}
```

**Credential Injection:**
- Source: integrations table (encrypted)
- Fields: custom_api_url, custom_api_key
- Injection: RuntimeService → Custom API Runtime Connector
- Storage: Never stored in adapter

---

## Credential Injection Architecture

### Credential Storage

**Location:** integrations table (encrypted)

**Fields:**
- dataforseo_api_key (encrypted)
- openai_api_key (encrypted)
- serp_api_key (encrypted)
- google_access_token (encrypted, fetched via OAuth)
- wordpress_username (encrypted)
- wordpress_application_password (encrypted)
- shopify_access_token (encrypted)
- shopify_blog_id (encrypted)
- custom_api_url (encrypted)
- custom_api_key (encrypted)

### Credential Retrieval

**RuntimeService Responsibility:**
1. Query integrations table by tenant_id
2. Decrypt credentials
3. Pass credentials to Runtime Connector as parameters
4. Never store credentials in adapter
5. Never log credentials

**Example:**
```typescript
// RuntimeService
const credentials = await getTenantIntegrations(tenantId);

// Pass to adapter
const response = await dataForSEOAdapter(request, {
  apiKey: credentials.dataforseo_api_key
});
```

---

## Event Publishing Flow

### Event Types

**Execution Events:**
- execution_started
- execution_completed
- execution_failed
- execution_retried

**Task Events:**
- task_started
- task_completed
- task_failed
- task_retried

**Provider Events:**
- provider_call_started
- provider_call_completed
- provider_call_failed
- provider_call_retried

### Event Publishing

**EventService Responsibility:**
1. Receive event from RuntimeService
2. Store event in agent_events table
3. Filter by tenant_id
4. Provide event querying API

**Event Schema:**
```typescript
{
  id: UUID;
  tenant_id: UUID;
  execution_id: UUID;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: ISODateTime;
}
```

---

## Log Publishing Flow

### Log Types

**Log Levels:**
- info
- warn
- error
- debug

**Log Categories:**
- execution
- task
- provider
- system

### Log Publishing

**LogService Responsibility:**
1. Receive log from RuntimeService
2. Store log in agent_logs table
3. Filter by tenant_id
4. Provide log querying API

**Log Schema:**
```typescript
{
  id: UUID;
  tenant_id: UUID;
  execution_id: UUID;
  level: string;
  category: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: ISODateTime;
}
```

---

## Execution Persistence Flow

### Execution Storage

**Table:** agent_executions

**Fields:**
- id: UUID
- tenant_id: UUID (REQUIRED, indexed)
- agent_name: string
- workflow_type: string
- execution_source: ExecutionSource
- inngest_run_id: string
- status: ExecutionStatus
- started_at: ISODateTime
- completed_at: ISODateTime
- failed_at: ISODateTime
- retry_count: number
- total_cost: number
- total_tokens: number
- metadata: Record<string, unknown>
- created_at: ISODateTime
- updated_at: ISODateTime

### Task Storage

**Table:** agent_tasks

**Fields:**
- id: UUID
- tenant_id: UUID (REQUIRED, indexed)
- execution_id: UUID (foreign key)
- task_type: string
- status: TaskStatus
- started_at: ISODateTime
- completed_at: ISODateTime
- failed_at: ISODateTime
- retry_count: number
- metadata: Record<string, unknown>
- created_at: ISODateTime
- updated_at: ISODateTime

---

## Current Implementation Status

### Completed Components

- ✅ RuntimeService (facade service)
- ✅ ExecutionService (execution lifecycle)
- ✅ TaskService (task lifecycle)
- ✅ EventService (event publishing)
- ✅ LogService (log publishing)
- ✅ MetricsService (telemetry)
- ✅ ExecutionRepository (data access)
- ✅ BaseRepository (base patterns)
- ✅ ExecutionOrchestrator (orchestration)

### Missing Components

- ❌ Runtime Connectors (not implemented)
- ❌ Provider Adapters (not implemented)
- ❌ Credential Injection (not implemented)
- ❌ Runtime Connector → Provider Integration (not implemented)
- ❌ Agent → RuntimeService Integration (not implemented)

### Agent Status

- ✅ ARIA - Direct provider call removed, awaiting RuntimeService integration
- ✅ SCRIBE - Direct provider call removed, awaiting RuntimeService integration
- ✅ PULSE - Direct provider call removed, awaiting RuntimeService integration
- ✅ LOCL - Direct provider call removed, awaiting RuntimeService integration
- ✅ PUBLISH - Direct provider call removed, awaiting RuntimeService integration

---

## Implementation Roadmap

### Phase 1: Create Runtime Connectors

1. Create `apps/web/lib/runtime/adapters/types.ts`
2. Create DataForSEO Runtime Connector
3. Create OpenAI Runtime Connector
4. Create SERP Runtime Connector
5. Create GMB Runtime Connector
6. Create WordPress Runtime Connector
7. Create Shopify Runtime Connector
8. Create Custom API Runtime Connector

### Phase 2: Implement Credential Injection

1. Add credential retrieval to RuntimeService
2. Add credential decryption to RuntimeService
3. Add credential passing to Runtime Connectors
4. Test credential injection for all providers

### Phase 3: Integrate Agents with RuntimeService

1. Update ARIA to use RuntimeService → DataForSEO Runtime Connector
2. Update SCRIBE to use RuntimeService → OpenAI Runtime Connector
3. Update PULSE to use RuntimeService → SERP Runtime Connector
4. Update LOCL to use RuntimeService → GMB Runtime Connector
5. Update PUBLISH to use RuntimeService → CMS Runtime Connectors

### Phase 4: Test End-to-End

1. Test DataForSEO execution flow
2. Test OpenAI execution flow
3. Test SERP execution flow
4. Test GMB execution flow
5. Test WordPress execution flow
6. Test Shopify execution flow
7. Test Custom API execution flow

---

## Conclusion

The provider execution map is now defined and locked. All execution must flow through the canonical path: Agent → RuntimeService → ExecutionOrchestrator → Runtime Connector → Provider. All components have clearly defined responsibilities, and forbidden operations are explicitly documented.

**Execution Topology Status:** DEFINED AND LOCKED

**Next Steps:**
1. Implement TASK 3A.8: Certify architectural compliance
2. Create Runtime Connectors
3. Implement credential injection
4. Integrate agents with RuntimeService

---

**END OF REPORT**

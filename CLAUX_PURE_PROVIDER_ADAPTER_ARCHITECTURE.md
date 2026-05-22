# CLAUX Pure Provider Adapter Architecture

**Report Date:** 2025-01-19
**Phase:** Phase 3A - Provider Execution Sovereignty Migration
**Status:** ARCHITECTURE DEFINED

## Executive Summary

This document defines the pure provider adapter architecture for CLAUX. Provider adapters are execution adapters ONLY - they transform requests, execute provider API calls, normalize responses, and normalize errors. All execution ownership, orchestration, retries, logging, telemetry, rate limiting, and credential retrieval are owned by RuntimeService.

**ARCHITECTURAL PRINCIPLE:** Providers are pure functions with no side effects, no state, no lifecycle ownership, and no runtime authority.

---

## Pure Adapter Pattern Definition

### What is a Pure Provider Adapter?

A pure provider adapter is a stateless function or class that:

1. **Accepts credentials as parameters** (injected by RuntimeService)
2. **Transforms requests** from CLAUX format to provider format
3. **Executes provider API calls** (single request-response cycle)
4. **Normalizes responses** from provider format to CLAUX format
5. **Normalizes errors** from provider format to CLAUX format
6. **Returns immediately** (no async state, no lifecycle management)

### What a Pure Adapter MUST NOT Do

1. **NO execution ownership** - adapters don't decide when to execute
2. **NO orchestration** - adapters don't manage workflow or task sequences
3. **NO retries** - RuntimeService owns retry logic
4. **NO logging authority** - RuntimeService owns logging via LogService
5. **NO persistence** - adapters don't write to database
6. **NO credential retrieval** - RuntimeService owns credential injection
7. **NO tenant authority** - adapters don't validate tenant context
8. **NO state management** - adapters don't maintain execution state
9. **NO telemetry systems** - RuntimeService owns metrics via MetricsService
10. **NO rate limiting** - RuntimeService owns rate limiting
11. **NO custom event systems** - RuntimeService owns events via EventService

---

## Canonical Adapter Interface

### ProviderAdapter Interface

```typescript
/**
 * Pure provider adapter interface
 * All providers must implement this pattern
 */
export interface ProviderAdapter<Request, Response> {
  /**
   * Execute provider request
   * 
   * @param request - Transformed request in provider format
   * @param credentials - Provider credentials injected by RuntimeService
   * @returns Normalized response in CLAUX format
   * @throws Normalized error in CLAUX format
   */
  execute(request: Request, credentials: ProviderCredentials): Promise<ProviderResponse<Response>>;
}

/**
 * Provider credentials interface
 * All credentials are injected by RuntimeService
 */
export interface ProviderCredentials {
  [key: string]: string | number | boolean;
}

/**
 * Provider response interface
 * Standardized response format for all providers
 */
export interface ProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: ProviderError;
  metadata?: ProviderMetadata;
}

/**
 * Provider error interface
 * Standardized error format for all providers
 */
export interface ProviderError {
  code: string;
  message: string;
  retryable: boolean;
  type: 'auth' | 'rate_limit' | 'validation' | 'timeout' | 'quota' | 'outage' | 'malformed' | 'unknown';
  providerCode?: string;
}

/**
 * Provider metadata interface
 * Standardized metadata for all providers
 */
export interface ProviderMetadata {
  executionTimeMs: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  quotaRemaining?: number;
  quotaReset?: number;
  requestId?: string;
}
```

---

## Pure Adapter Implementation Pattern

### Example: DataForSEO Adapter

```typescript
/**
 * DataForSEO Pure Provider Adapter
 * Stateless function with no side effects
 */

// Request transformation (CLAUX format → Provider format)
interface DataForSEORequest {
  target: string;
  keyword?: string;
  location_name?: string;
  language_name?: string;
}

// Response normalization (Provider format → CLAUX format)
interface DataForSEOResponse {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc?: number;
}

// Error normalization (Provider format → CLAUX format)
function normalizeDataForSEOError(error: any): ProviderError {
  if (error.status === 401) {
    return {
      code: 'AUTH_FAILED',
      message: 'DataForSEO authentication failed',
      retryable: false,
      type: 'auth',
      providerCode: error.status.toString()
    };
  }
  if (error.status === 429) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'DataForSEO rate limit exceeded',
      retryable: true,
      type: 'rate_limit',
      providerCode: error.status.toString()
    };
  }
  if (error.status === 400) {
    return {
      code: 'VALIDATION_FAILED',
      message: 'DataForSEO validation failed',
      retryable: false,
      type: 'validation',
      providerCode: error.status.toString()
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'Unknown DataForSEO error',
    retryable: true,
    type: 'unknown',
    providerCode: error.status?.toString()
  };
}

// Pure adapter function (stateless, no side effects)
export async function dataForSEOAdapter(
  request: DataForSEORequest,
  credentials: { apiKey: string }
): Promise<ProviderResponse<DataForSEOResponse[]>> {
  const startTime = Date.now();
  
  try {
    // Execute provider API call
    const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(credentials.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([request])
    });
    
    const executionTimeMs = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: normalizeDataForSEOError(error),
        metadata: { executionTimeMs }
      };
    }
    
    const data = await response.json();
    
    // Normalize response
    const normalizedData: DataForSEOResponse[] = data.map((item: any) => ({
      keyword: item.keyword_data.keyword,
      volume: item.keyword_data.search_volume,
      difficulty: item.keyword_data.keyword_difficulty,
      cpc: item.keyword_data.cpc
    }));
    
    // Extract metadata from headers
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    
    return {
      success: true,
      data: normalizedData,
      metadata: {
        executionTimeMs,
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined,
        rateLimitReset: rateLimitReset ? parseInt(rateLimitReset) : undefined
      }
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    return {
      success: false,
      error: normalizeDataForSEOError(error),
      metadata: { executionTimeMs }
    };
  }
}
```

---

## Adapter Violation Analysis

### Current Provider Clients (Violations)

#### DataForSEO Client (dataforseo.client.ts)
**Violations:**
- ❌ Returns mock data instead of real API calls
- ❌ No request transformation
- ❌ No response normalization
- ❌ No error normalization
- ❌ No credentials parameter (no credential injection)
- ❌ Simulates API delay (side effect)
- ❌ Hardcoded mock data (state)

**Required Changes:**
- Remove mock data
- Add real API integration
- Implement request transformation
- Implement response normalization
- Implement error normalization
- Add credentials parameter
- Remove API delay simulation
- Remove hardcoded data

---

#### OpenAI Client (openai.client.ts)
**Violations:**
- ❌ Returns template content instead of AI-generated content
- ❌ No request transformation
- ❌ No response normalization
- ❌ No error normalization
- ❌ No credentials parameter (no credential injection)
- ❌ Simulates API delay (side effect)
- ❌ Hardcoded template (state)

**Required Changes:**
- Remove template content
- Add real OpenAI API integration
- Implement request transformation
- Implement response normalization
- Implement error normalization
- Add credentials parameter
- Remove API delay simulation
- Remove hardcoded template

---

#### SERP Client (serp.client.ts)
**Violations:**
- ❌ Returns deterministic mock rankings instead of real SERP data
- ❌ No request transformation
- ❌ No response normalization
- ❌ No error normalization
- ❌ No credentials parameter (no credential injection)
- ❌ Simulates API delay (side effect)
- ❌ Deterministic hash function (state)

**Required Changes:**
- Remove deterministic mock rankings
- Add real SERP API integration
- Implement request transformation
- Implement response normalization
- Implement error normalization
- Add credentials parameter
- Remove API delay simulation
- Remove hash function

---

#### GMB Client (gmb.client.ts)
**Violations:**
- ❌ Has mock fallback (should fail gracefully)
- ❌ No request transformation
- ❌ No response normalization
- ❌ No error normalization
- ✅ Uses runtime credential injection (CORRECT)
- ❌ Uses console.error (logging violation)
- ❌ Returns mock data on error (should throw)

**Required Changes:**
- Remove mock fallback
- Implement request transformation
- Implement response normalization
- Implement error normalization
- Remove console.error
- Throw error instead of returning mock data

---

### Current CMS Connectors (Violations)

#### WordPress Connector (wordpress.connector.ts)
**Violations:**
- ❌ Credentials passed directly (should be injected by RuntimeService)
- ❌ No request transformation
- ❌ No response normalization
- ❌ No error normalization
- ❌ No standardized response format (partial: success/url/error)
- ❌ No metadata (execution timing, rate limits)
- ❌ Implements timeout (side effect, should be RuntimeService)

**Required Changes:**
- Change credentials parameter to be injected
- Implement request transformation
- Implement response normalization
- Implement error normalization
- Add standardized response format
- Add metadata
- Remove timeout (RuntimeService should handle)

---

#### Shopify Connector (shopify.connector.ts)
**Violations:**
- ❌ Credentials passed directly (should be injected by RuntimeService)
- ❌ No request transformation
- ❌ No response normalization
- ❌ No error normalization
- ❌ No standardized response format (partial: success/url/error)
- ❌ No metadata (execution timing, rate limits)
- ❌ Implements timeout (side effect, should be RuntimeService)

**Required Changes:**
- Change credentials parameter to be injected
- Implement request transformation
- Implement response normalization
- Implement error normalization
- Add standardized response format
- Add metadata
- Remove timeout (RuntimeService should handle)

---

#### Custom Connector (custom.connector.ts)
**Violations:**
- ❌ Credentials passed directly (should be injected by RuntimeService)
- ❌ No request transformation
- ❌ No response normalization
- ❌ No error normalization
- ❌ No standardized response format (partial: success/url/error)
- ❌ No metadata (execution timing, rate limits)
- ❌ Implements timeout (side effect, should be RuntimeService)

**Required Changes:**
- Change credentials parameter to be injected
- Implement request transformation
- Implement response normalization
- Implement error normalization
- Add standardized response format
- Add metadata
- Remove timeout (RuntimeService should handle)

---

### Hardened Provider (Critical Violations)

#### Hardened OpenAI Adapter (hardened-openai.ts)
**Violations:**
- ❌ Implements retry logic (RuntimeService should own retries)
- ❌ Implements rate limiting (RuntimeService should own rate limiting)
- ❌ Tracks request counts (RuntimeService should own telemetry)
- ❌ Tracks token counts (RuntimeService should own cost tracking)
- ❌ Maintains state (requestCount, tokenCount, lastRequestTime)
- ❌ Not used by any agent (dead code)

**Required Changes:**
- DELETE - This file should be removed entirely
- Retry logic moved to RuntimeService
- Rate limiting moved to RuntimeService
- Telemetry moved to MetricsService
- Cost tracking moved to RuntimeService

---

## Pure Adapter Implementation Rules

### Rule 1: Stateless

**Requirement:** Adapters must be stateless functions or classes

**Implementation:**
- No instance variables
- No state between calls
- No caching
- No counters
- No timers

**Example:**
```typescript
// ❌ WRONG - Stateful adapter
class BadAdapter {
  private requestCount = 0; // State
  async execute(request, credentials) {
    this.requestCount++; // State mutation
    // ...
  }
}

// ✅ CORRECT - Stateless adapter
async function goodAdapter(request, credentials) {
  // No state, pure function
  // ...
}
```

---

### Rule 2: Pure Function

**Requirement:** Adapters must be pure functions with no side effects

**Implementation:**
- No console.log / console.error
- No file I/O
- No database writes
- No network calls except to provider API
- No external state mutation

**Example:**
```typescript
// ❌ WRONG - Side effects
async function badAdapter(request, credentials) {
  console.log('Executing request'); // Side effect
  await fetch('https://api.provider.com/endpoint');
  // ...
}

// ✅ CORRECT - Pure function
async function goodAdapter(request, credentials) {
  await fetch('https://api.provider.com/endpoint');
  // No side effects
}
```

---

### Rule 3: Credentials as Parameters

**Requirement:** Adapters must accept credentials as parameters (injected by RuntimeService)

**Implementation:**
- Credentials passed as function parameter
- No credential retrieval in adapter
- No credential storage in adapter
- No environment variable access in adapter

**Example:**
```typescript
// ❌ WRONG - Credentials from environment
async function badAdapter(request) {
  const apiKey = process.env.PROVIDER_API_KEY; // Environment variable
  // ...
}

// ❌ WRONG - Credential retrieval in adapter
async function badAdapter(request, tenantId) {
  const credentials = await getCredentials(tenantId); // Credential retrieval
  // ...
}

// ✅ CORRECT - Credentials as parameter
async function goodAdapter(request, credentials) {
  // Credentials injected by RuntimeService
  // ...
}
```

---

### Rule 4: Single Request-Response Cycle

**Requirement:** Adapters must execute single request-response cycle and return immediately

**Implementation:**
- No async state management
- No polling
- No long-running operations
- No callbacks
- No webhooks
- Return immediately after provider response

**Example:**
```typescript
// ❌ WRONG - Long-running operation
async function badAdapter(request, credentials) {
  await longRunningOperation(); // Long-running
  return response;
}

// ❌ WRONG - Polling
async function badAdapter(request, credentials) {
  while (!complete) {
    await poll(); // Polling
  }
  return response;
}

// ✅ CORRECT - Single request-response
async function goodAdapter(request, credentials) {
  const response = await fetch('https://api.provider.com/endpoint');
  return response; // Return immediately
}
```

---

### Rule 5: No Execution Ownership

**Requirement:** Adapters must not own execution lifecycle (start, complete, fail, retry)

**Implementation:**
- No retry logic
- No backoff logic
- No timeout logic
- No cancellation logic
- No execution state management

**Example:**
```typescript
// ❌ WRONG - Retry logic
async function badAdapter(request, credentials) {
  for (let i = 0; i < 3; i++) { // Retry logic
    try {
      return await fetch(...);
    } catch (error) {
      await backoff(i); // Backoff logic
    }
  }
}

// ❌ WRONG - Timeout logic
async function badAdapter(request, credentials) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10000); // Timeout logic
  return await fetch(..., { signal: controller.signal });
}

// ✅ CORRECT - No execution ownership
async function goodAdapter(request, credentials) {
  return await fetch(...); // RuntimeService owns retries, timeouts
}
```

---

### Rule 6: No Telemetry

**Requirement:** Adapters must not implement telemetry (metrics, counters, logging)

**Implementation:**
- No request counting
- No token counting
- No cost tracking
- No performance tracking
- No logging

**Example:**
```typescript
// ❌ WRONG - Telemetry
class BadAdapter {
  private requestCount = 0; // Counter
  private tokenCount = 0; // Counter
  
  async execute(request, credentials) {
    this.requestCount++; // Counter increment
    this.tokenCount += estimateTokens(request); // Counter increment
    // ...
  }
}

// ✅ CORRECT - No telemetry
async function goodAdapter(request, credentials) {
  // MetricsService owns telemetry
  return await fetch(...);
}
```

---

### Rule 7: No Rate Limiting

**Requirement:** Adapters must not implement rate limiting

**Implementation:**
- No rate limit checking
- No request throttling
- No backoff for rate limits
- No queue management

**Example:**
```typescript
// ❌ WRONG - Rate limiting
class BadAdapter {
  private lastRequestTime = 0;
  private minInterval = 200;
  
  async execute(request, credentials) {
    await this.rateLimit(); // Rate limiting
    return await fetch(...);
  }
  
  private async rateLimit() {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}

// ✅ CORRECT - No rate limiting
async function goodAdapter(request, credentials) {
  // RuntimeService owns rate limiting
  return await fetch(...);
}
```

---

## Canonical Adapter Directory Structure

### Required Directory Structure

```
apps/web/lib/runtime/adapters/
├── providers/
│   ├── dataforseo.adapter.ts      # DataForSEO pure adapter
│   ├── openai.adapter.ts          # OpenAI pure adapter
│   ├── serp.adapter.ts            # SERP pure adapter
│   ├── gmb.adapter.ts             # Google My Business pure adapter
│   ├── wordpress.adapter.ts       # WordPress pure adapter
│   ├── shopify.adapter.ts         # Shopify pure adapter
│   └── custom.adapter.ts          # Custom API pure adapter
├── types.ts                       # Adapter type definitions
└── index.ts                       # Adapter exports
```

### Adapter Type Definitions

```typescript
// apps/web/lib/runtime/adapters/types.ts

/**
 * Base adapter interface
 * All adapters must implement this
 */
export interface ProviderAdapter<Request, Response> {
  execute(request: Request, credentials: ProviderCredentials): Promise<ProviderResponse<Response>>;
}

/**
 * Provider credentials
 * All credentials are injected by RuntimeService
 */
export interface ProviderCredentials {
  [key: string]: string | number | boolean;
}

/**
 * Standardized provider response
 */
export interface ProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: ProviderError;
  metadata?: ProviderMetadata;
}

/**
 * Standardized provider error
 */
export interface ProviderError {
  code: string;
  message: string;
  retryable: boolean;
  type: ErrorType;
  providerCode?: string;
}

/**
 * Error type enum
 */
export type ErrorType = 
  | 'auth' 
  | 'rate_limit' 
  | 'validation' 
  | 'timeout' 
  | 'quota' 
  | 'outage' 
  | 'malformed' 
  | 'unknown';

/**
 * Provider metadata
 */
export interface ProviderMetadata {
  executionTimeMs: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  quotaRemaining?: number;
  quotaReset?: number;
  requestId?: string;
}
```

---

## Migration Plan

### Phase 1: Delete Violating Code
1. Delete `apps/web/lib/providers/hardened-openai.ts` (dead code with violations)
2. Delete `apps/web/lib/agents/shared/dataforseo.client.ts` (mock data)
3. Delete `apps/web/lib/agents/shared/openai.client.ts` (mock data)
4. Delete `apps/web/lib/agents/shared/serp.client.ts` (mock data)
5. Refactor `apps/web/lib/agents/shared/gmb.client.ts` (remove mock fallback)
6. Refactor `apps/web/lib/connectors/wordpress.connector.ts` (pure adapter pattern)
7. Refactor `apps/web/lib/connectors/shopify.connector.ts` (pure adapter pattern)
8. Refactor `apps/web/lib/connectors/custom.connector.ts` (pure adapter pattern)

### Phase 2: Create Pure Adapters
1. Create `apps/web/lib/runtime/adapters/types.ts`
2. Create `apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts`
3. Create `apps/web/lib/runtime/adapters/providers/openai.adapter.ts`
4. Create `apps/web/lib/runtime/adapters/providers/serp.adapter.ts`
5. Create `apps/web/lib/runtime/adapters/providers/gmb.adapter.ts`
6. Create `apps/web/lib/runtime/adapters/providers/wordpress.adapter.ts`
7. Create `apps/web/lib/runtime/adapters/providers/shopify.adapter.ts`
8. Create `apps/web/lib/runtime/adapters/providers/custom.adapter.ts`
9. Create `apps/web/lib/runtime/adapters/index.ts`

### Phase 3: Integrate with RuntimeService
1. Update RuntimeService to use pure adapters
2. Implement credential injection in RuntimeService
3. Implement retry logic in ExecutionOrchestrator
4. Implement rate limiting in RuntimeService
5. Implement telemetry in MetricsService
6. Implement logging in LogService

---

## Compliance Checklist

### Adapter Implementation Checklist

- [ ] Adapter is stateless (no instance variables)
- [ ] Adapter is pure function (no side effects)
- [ ] Credentials accepted as parameter
- [ ] No credential retrieval in adapter
- [ ] No environment variable access
- [ ] Single request-response cycle
- [ ] No async state management
- [ ] No polling
- [ ] No long-running operations
- [ ] No callbacks
- [ ] No webhooks
- [ ] No retry logic
- [ ] No backoff logic
- [ ] No timeout logic
- [ ] No cancellation logic
- [ ] No execution state management
- [ ] No request counting
- [ ] No token counting
- [ ] No cost tracking
- [ ] No performance tracking
- [ ] No logging
- [ ] No console.log / console.error
- [ ] No rate limit checking
- [ ] No request throttling
- [ ] No backoff for rate limits
- [ ] No queue management
- [ ] Request transformation implemented
- [ ] Response normalization implemented
- [ ] Error normalization implemented
- [ ] Standardized response format
- [ ] Standardized error format
- * [ ] Metadata included (execution time, rate limits, quotas)

---

## Conclusion

The pure provider adapter architecture defines strict boundaries for provider adapters. Adapters are execution adapters ONLY - they transform requests, execute provider API calls, normalize responses, and normalize errors. All execution ownership, orchestration, retries, logging, telemetry, rate limiting, and credential retrieval are owned by RuntimeService.

**Pure Adapter Architecture Status:** DEFINED

**Next Steps:**
1. Delete violating code (hardened-openai.ts, mock clients)
2. Create pure adapters following the defined pattern
3. Integrate with RuntimeService for credential injection and execution orchestration

---

**END OF ARCHITECTURE DOCUMENT**

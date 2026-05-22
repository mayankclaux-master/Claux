# CLAUX Provider Response Standardization Report

**Report Date:** 2025-01-19
**Phase:** Phase 3A - Provider Execution Sovereignty Migration
**Status:** STANDARDIZED

## Executive Summary

This report defines the canonical provider response contract for all CLAUX provider adapters. All providers must return standardized responses with consistent fields for success, failure, retryability, normalized payload, normalized metadata, execution timing, and quota/rate metadata. This ensures RuntimeService can make uniform decisions about retry, fail, abort, and escalation across all providers.

**STANDARDIZATION STATUS:** DEFINED AND LOCKED

---

## Canonical Provider Response Contract

### Base ProviderResponse Interface

```typescript
/**
 * Canonical provider response interface
 * All providers MUST return this format
 */
export interface ProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: ProviderError;
  metadata: ProviderMetadata;
}
```

### ProviderResponse Fields

#### success: boolean
- **Required:** Yes
- **Description:** Indicates whether the provider request succeeded
- **Values:** `true` (success), `false` (failure)
- **Usage:** RuntimeService uses this to determine execution outcome

#### data?: T
- **Required:** Yes if success is true
- **Description:** Normalized provider payload in CLAUX format
- **Type:** Generic type T, provider-specific data structure
- **Usage:** Agent consumes normalized data for business logic

#### error?: ProviderError
- **Required:** Yes if success is false
- **Description:** Normalized error information
- **Type:** ProviderError interface (defined below)
- **Usage:** RuntimeService uses this to determine retry/fail/escalate logic

#### metadata: ProviderMetadata
- **Required:** Yes
- **Description:** Execution metadata for observability and governance
- **Type:** ProviderMetadata interface (defined below)
- **Usage:** RuntimeService uses for rate limiting, quota tracking, cost tracking

---

## Canonical Provider Error Contract

### ProviderError Interface

```typescript
/**
 * Canonical provider error interface
 * All providers MUST return errors in this format
 */
export interface ProviderError {
  code: string;
  message: string;
  retryable: boolean;
  type: ErrorType;
  providerCode?: string;
  details?: Record<string, unknown>;
}
```

### ProviderError Fields

#### code: string
- **Required:** Yes
- **Description:** Canonical error code for RuntimeService decision logic
- **Format:** UPPER_SNAKE_CASE
- **Values:** See Error Codes section below
- **Usage:** RuntimeService uses for programmatic error handling

#### message: string
- **Required:** Yes
- **Description:** Human-readable error message
- **Format:** Plain text, no provider-specific jargon
- **Usage:** Displayed to users, logged for debugging

#### retryable: boolean
- **Required:** Yes
- **Description:** Whether RuntimeService should retry this error
- **Values:** `true` (retryable), `false` (non-retryable)
- **Usage:** RuntimeService uses for retry logic decision

#### type: ErrorType
- **Required:** Yes
- **Description:** Error category for RuntimeService decision logic
- **Type:** ErrorType enum (defined below)
- **Usage:** RuntimeService uses for error classification and handling

#### providerCode?: string
- **Required:** No
- **Description:** Original provider error code for debugging
- **Format:** Provider-specific format
- **Usage:** Logged for debugging and provider-specific troubleshooting

#### details?: Record<string, unknown>
- **Required:** No
- **Description:** Additional error details
- **Format:** Key-value pairs
- **Usage:** Logged for debugging, may include provider-specific context

---

## Canonical Error Type Enum

### ErrorType Definition

```typescript
/**
 * Canonical error type enum
 * All provider errors MUST be classified into these types
 */
export type ErrorType = 
  | 'auth'           // Authentication failure
  | 'rate_limit'     // Rate limit exceeded
  | 'validation'     // Request validation failure
  | 'timeout'        // Request timeout
  | 'quota'          // Quota exceeded
  | 'outage'         // Provider outage
  | 'malformed'      // Malformed response from provider
  | 'unknown';       // Unknown error
```

### Error Type Descriptions

#### auth
- **Description:** Authentication or authorization failure
- **Retryable:** No (credentials need to be fixed)
- **RuntimeService Action:** Fail execution, alert user to check credentials
- **Examples:** Invalid API key, expired token, insufficient permissions

#### rate_limit
- **Description:** Provider rate limit exceeded
- **Retryable:** Yes (with exponential backoff)
- **RuntimeService Action:** Retry with exponential backoff
- **Examples:** Too many requests per minute, requests per second exceeded

#### validation
- **Description:** Request validation failure
- **Retryable:** No (request needs to be fixed)
- **RuntimeService Action:** Fail execution, alert user to fix request
- **Examples:** Invalid parameters, missing required fields, invalid format

#### timeout
- **Description:** Request timeout
- **Retryable:** Yes (with exponential backoff)
- **RuntimeService Action:** Retry with exponential backoff
- **Examples:** Provider API did not respond within timeout

#### quota
- **Description:** Provider quota exceeded
- **Retryable:** No (quota needs to be increased or wait for reset)
- **RuntimeService Action:** Fail execution, alert user about quota
- **Examples:** Monthly API limit exceeded, daily token limit exceeded

#### outage
- **Description:** Provider outage or service degradation
- **Retryable:** Yes (with exponential backoff, longer intervals)
- **RuntimeService Action:** Retry with exponential backoff, alert on persistent failures
- **Examples:** Provider API down, service unavailable, 5xx errors

#### malformed
- **Description:** Malformed response from provider
- **Retryable:** No (response parsing failed)
- **RuntimeService Action:** Fail execution, log for debugging
- **Examples:** Invalid JSON, missing required fields, unexpected format

#### unknown
- **Description:** Unknown error type
- **Retryable:** Yes (conservative default)
- **RuntimeService Action:** Retry with exponential backoff, log for investigation
- **Examples:** Unexpected error, unclassified error

---

## Canonical Error Codes

### Error Code Definitions

```typescript
/**
 * Canonical error codes
 * All provider errors MUST use these codes
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_INSUFFICIENT: 'AUTH_INSUFFICIENT',

  // Rate limit errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_DAILY: 'RATE_LIMIT_DAILY',
  RATE_LIMIT_HOURLY: 'RATE_LIMIT_HOURLY',
  RATE_LIMIT_MINUTE: 'RATE_LIMIT_MINUTE',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_MISSING_REQUIRED: 'VALIDATION_MISSING_REQUIRED',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',

  // Timeout errors
  TIMEOUT: 'TIMEOUT',
  TIMEOUT_CONNECTION: 'TIMEOUT_CONNECTION',
  TIMEOUT_READ: 'TIMEOUT_READ',
  TIMEOUT_WRITE: 'TIMEOUT_WRITE',

  // Quota errors
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  QUOTA_DAILY: 'QUOTA_DAILY',
  QUOTA_MONTHLY: 'QUOTA_MONTHLY',
  QUOTA_TOKENS: 'QUOTA_TOKENS',

  // Outage errors
  OUTAGE: 'OUTAGE',
  OUTAGE_MAINTENANCE: 'OUTAGE_MAINTENANCE',
  OUTAGE_DEGRADED: 'OUTAGE_DEGRADED',
  OUTAGE_UNAVAILABLE: 'OUTAGE_UNAVAILABLE',

  // Malformed errors
  MALFORMED_RESPONSE: 'MALFORMED_RESPONSE',
  MALFORMED_JSON: 'MALFORMED_JSON',
  MALFORMED_MISSING_FIELDS: 'MALFORMED_MISSING_FIELDS',
  MALFORMED_UNEXPECTED_FORMAT: 'MALFORMED_UNEXPECTED_FORMAT',

  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR'
} as const;
```

---

## Canonical Provider Metadata Contract

### ProviderMetadata Interface

```typescript
/**
 * Canonical provider metadata interface
 * All providers MUST return metadata in this format
 */
export interface ProviderMetadata {
  executionTimeMs: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  quotaRemaining?: number;
  quotaReset?: number;
  requestId?: string;
  timestamp: string;
  provider: string;
}
```

### ProviderMetadata Fields

#### executionTimeMs: number
- **Required:** Yes
- **Description:** Execution time in milliseconds
- **Format:** Number (milliseconds)
- **Usage:** MetricsService tracks performance, RuntimeService monitors for anomalies

#### rateLimitRemaining?: number
- **Required:** No
- **Description:** Remaining rate limit requests
- **Format:** Number (requests)
- **Usage:** RuntimeService uses for rate limiting decisions

#### rateLimitReset?: number
- **Required:** No
- **Description:** Unix timestamp when rate limit resets
- **Format:** Number (Unix timestamp in seconds)
- **Usage:** RuntimeService uses for rate limiting decisions

#### quotaRemaining?: number
- **Required:** No
- **Description:** Remaining quota (tokens, requests, etc.)
- **Format:** Number (units depend on provider)
- **Usage:** RuntimeService uses for quota tracking and enforcement

#### quotaReset?: number
- **Required:** No
- **Description:** Unix timestamp when quota resets
- **Format:** Number (Unix timestamp in seconds)
- **Usage:** RuntimeService uses for quota tracking and enforcement

#### requestId?: string
- **Description:** Provider request ID for tracing
- **Format:** String (provider-specific format)
- **Usage:** Logged for debugging and provider support

#### timestamp: string
- **Required:** Yes
- **Description:** ISO 8601 timestamp of response
- **Format:** ISO 8601 string
- **Usage:** Logged for debugging and audit trail

#### provider: string
- **Required:** Yes
- **Description:** Provider identifier
- **Format:** String (provider name, e.g., 'dataforseo', 'openai', 'serp', 'gmb', 'wordpress', 'shopify', 'custom')
- **Usage:** Logged for debugging and provider-specific routing

---

## Provider-Specific Response Contracts

### DataForSEO Response Contract

```typescript
/**
 * DataForSEO request interface
 */
export interface DataForSEORequest {
  target: string;
  keyword?: string;
  location_name?: string;
  language_name?: string;
}

/**
 * DataForSEO response data interface
 */
export interface DataForSEOResponse {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc?: number;
  intent?: string;
}

/**
 * DataForSEO provider response
 */
export type DataForSEOProviderResponse = ProviderResponse<DataForSEOResponse[]>;
```

### OpenAI Response Contract

```typescript
/**
 * OpenAI request interface
 */
export interface OpenAIRequest {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * OpenAI response data interface
 */
export interface OpenAIResponse {
  title: string;
  content: string;
  tokensUsed: number;
}

/**
 * OpenAI provider response
 */
export type OpenAIProviderResponse = ProviderResponse<OpenAIResponse>;
```

### SERP Response Contract

```typescript
/**
 * SERP request interface
 */
export interface SERPRequest {
  keyword: string;
  domain: string;
  location?: string;
  language?: string;
}

/**
 * SERP response data interface
 */
export interface SERPResponse {
  rank: number | null;
  url: string;
  position?: number;
  change?: number;
}

/**
 * SERP provider response
 */
export type SERPProviderResponse = ProviderResponse<SERPResponse>;
```

### GMB Response Contract

```typescript
/**
 * GMB request interface
 */
export interface GMBRequest {
  locationId: string;
  fields?: string[];
}

/**
 * GMB response data interface
 */
export interface GMBResponse {
  gmb_name: string;
  primary_category: string;
  review_count: number;
  average_rating: number;
  photos_count: number;
  posts_count: number;
}

/**
 * GMB provider response
 */
export type GMBProviderResponse = ProviderResponse<GMBResponse>;
```

### WordPress Response Contract

```typescript
/**
 * WordPress request interface
 */
export interface WordPressRequest {
  title: string;
  content: string;
  slug?: string;
  status?: 'draft' | 'publish' | 'pending';
  categories?: number[];
}

/**
 * WordPress response data interface
 */
export interface WordPressResponse {
  id: number;
  url: string;
  status: string;
  date: string;
}

/**
 * WordPress provider response
 */
export type WordPressProviderResponse = ProviderResponse<WordPressResponse>;
```

### Shopify Response Contract

```typescript
/**
 * Shopify request interface
 */
export interface ShopifyRequest {
  title: string;
  content: string;
  handle?: string;
  published?: boolean;
  tags?: string;
  blogId: string;
}

/**
 * Shopify response data interface
 */
export interface ShopifyResponse {
  id: number;
  admin_graphql_api_id: string;
  handle: string;
  published_at: string;
}

/**
 * Shopify provider response
 */
export type ShopifyProviderResponse = ProviderResponse<ShopifyResponse>;
```

### Custom API Response Contract

```typescript
/**
 * Custom API request interface
 */
export interface CustomAPIRequest {
  title: string;
  content: string;
  slug?: string;
  status?: 'draft' | 'published';
  [key: string]: unknown; // Flexible for custom APIs
}

/**
 * Custom API response data interface
 */
export interface CustomAPIResponse {
  id?: string;
  url?: string;
  status?: string;
  [key: string]: unknown; // Flexible for custom APIs
}

/**
 * Custom API provider response
 */
export type CustomAPIProviderResponse = ProviderResponse<CustomAPIResponse>;
```

---

## RuntimeService Decision Logic

### Retry Decision Logic

```typescript
/**
 * RuntimeService retry decision logic
 * Based on canonical provider error contract
 */
function shouldRetry(error: ProviderError, retryCount: number): boolean {
  // Non-retryable errors
  if (!error.retryable) {
    return false;
  }

  // Auth errors - never retry (credentials need to be fixed)
  if (error.type === 'auth') {
    return false;
  }

  // Validation errors - never retry (request needs to be fixed)
  if (error.type === 'validation') {
    return false;
  }

  // Quota errors - never retry (quota needs to be increased or wait for reset)
  if (error.type === 'quota') {
    return false;
  }

  // Malformed errors - never retry (response parsing failed)
  if (error.type === 'malformed') {
    return false;
  }

  // Rate limit errors - retry with backoff
  if (error.type === 'rate_limit') {
    return retryCount < 3; // Max 3 retries
  }

  // Timeout errors - retry with backoff
  if (error.type === 'timeout') {
    return retryCount < 3; // Max 3 retries
  }

  // Outage errors - retry with longer backoff
  if (error.type === 'outage') {
    return retryCount < 5; // Max 5 retries
  }

  // Unknown errors - conservative retry
  if (error.type === 'unknown') {
    return retryCount < 2; // Max 2 retries
  }

  return false;
}
```

### Backoff Strategy

```typescript
/**
 * RuntimeService backoff strategy
 * Based on canonical provider error contract
 */
function getBackoffDelay(error: ProviderError, retryCount: number): number {
  const baseDelay = 1000; // 1 second base delay

  // Rate limit errors - exponential backoff
  if (error.type === 'rate_limit') {
    return baseDelay * Math.pow(2, retryCount);
  }

  // Timeout errors - exponential backoff
  if (error.type === 'timeout') {
    return baseDelay * Math.pow(2, retryCount);
  }

  // Outage errors - longer exponential backoff
  if (error.type === 'outage') {
    return baseDelay * Math.pow(3, retryCount);
  }

  // Unknown errors - conservative backoff
  if (error.type === 'unknown') {
    return baseDelay * Math.pow(2, retryCount);
  }

  return baseDelay;
}
```

### Fail Decision Logic

```typescript
/**
 * RuntimeService fail decision logic
 * Based on canonical provider error contract
 */
function shouldFail(error: ProviderError, retryCount: number): boolean {
  // If max retries exceeded, fail
  if (retryCount >= getMaxRetries(error.type)) {
    return true;
  }

  // Non-retryable errors, fail immediately
  if (!error.retryable) {
    return true;
  }

  return false;
}

function getMaxRetries(errorType: ErrorType): number {
  switch (errorType) {
    case 'rate_limit':
    case 'timeout':
      return 3;
    case 'outage':
      return 5;
    case 'unknown':
      return 2;
    default:
      return 0; // Auth, validation, quota, malformed - never retry
  }
}
```

---

## Compliance Checklist

### Provider Response Compliance

- [ ] Response implements ProviderResponse<T> interface
- [ ] success field is boolean
- [ ] data field is present when success is true
- [ ] error field is present when success is false
- [ ] metadata field is always present
- [ ] error implements ProviderError interface
- [ ] error.code is canonical error code
- [ ] error.message is human-readable
- [ ] error.retryable is boolean
- [ ] error.type is ErrorType enum value
- [ ] error.providerCode is present for provider-specific codes
- [ ] metadata.executionTimeMs is present
- [ ] metadata.timestamp is ISO 8601 format
- [ ] metadata.provider is provider identifier
- [ ] metadata.rateLimitRemaining is present if provider supports it
- [ ] metadata.rateLimitReset is present if provider supports it
- [ ] metadata.quotaRemaining is present if provider supports it
- [ ] metadata.quotaReset is present if provider supports it
- [ ] metadata.requestId is present if provider supports it

### Error Normalization Compliance

- [ ] All provider errors are normalized to ProviderError
- [ ] All error types are canonical ErrorType enum values
- [ ] All error codes are canonical ERROR_CODES values
- [ ] Auth errors are marked as non-retryable
- [ ] Validation errors are marked as non-retryable
- [ ] Quota errors are marked as non-retryable
- [ ] Malformed errors are marked as non-retryable
- [ ] Rate limit errors are marked as retryable
- [ ] Timeout errors are marked as retryable
- [ ] Outage errors are marked as retryable
- [ ] Unknown errors are marked as retryable (conservative)

### Metadata Compliance

- [ ] executionTimeMs is measured in milliseconds
- [ ] timestamp is ISO 8601 format
- [ ] provider is lowercase provider identifier
- [ ] rateLimitRemaining is extracted from response headers if available
- [ ] rateLimitReset is extracted from response headers if available
- [ ] quotaRemaining is extracted from response headers if available
- [ ] quotaReset is extracted from response headers if available
- [ ] requestId is extracted from response headers if available

---

## Implementation Examples

### DataForSEO Adapter Example

```typescript
export async function dataForSEOAdapter(
  request: DataForSEORequest,
  credentials: { apiKey: string }
): Promise<DataForSEOProviderResponse> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
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
      const normalizedError = normalizeDataForSEOError(error);
      
      return {
        success: false,
        error: normalizedError,
        metadata: {
          executionTimeMs,
          timestamp,
          provider: 'dataforseo',
          requestId: error.id
        }
      };
    }

    const data = await response.json();
    const normalizedData = data.map((item: any) => ({
      keyword: item.keyword_data.keyword,
      volume: item.keyword_data.search_volume,
      difficulty: item.keyword_data.keyword_difficulty,
      cpc: item.keyword_data.cpc,
      intent: classifyIntent(item.keyword_data.keyword)
    }));

    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');

    return {
      success: true,
      data: normalizedData,
      metadata: {
        executionTimeMs,
        timestamp,
        provider: 'dataforseo',
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined,
        rateLimitReset: rateLimitReset ? parseInt(rateLimitReset) : undefined
      }
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const normalizedError = normalizeDataForSEOError(error);
    
    return {
      success: false,
      error: normalizedError,
      metadata: {
        executionTimeMs,
        timestamp,
        provider: 'dataforseo'
      }
    };
  }
}

function normalizeDataForSEOError(error: any): ProviderError {
  if (error.status === 401) {
    return {
      code: ERROR_CODES.AUTH_FAILED,
      message: 'DataForSEO authentication failed',
      retryable: false,
      type: 'auth',
      providerCode: error.status.toString()
    };
  }
  if (error.status === 429) {
    return {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'DataForSEO rate limit exceeded',
      retryable: true,
      type: 'rate_limit',
      providerCode: error.status.toString()
    };
  }
  if (error.status === 400) {
    return {
      code: ERROR_CODES.VALIDATION_FAILED,
      message: 'DataForSEO validation failed',
      retryable: false,
      type: 'validation',
      providerCode: error.status.toString()
    };
  }
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: error.message || 'Unknown DataForSEO error',
    retryable: true,
    type: 'unknown',
    providerCode: error.status?.toString()
  };
}
```

---

## Conclusion

The canonical provider response contract is now standardized and locked. All providers MUST return responses in the ProviderResponse<T> format with standardized error handling and metadata. RuntimeService uses this contract to make uniform decisions about retry, fail, abort, and escalation across all providers.

**Standardization Status:** DEFINED AND LOCKED

**Next Steps:**
1. Implement TASK 3A.5: Standardize provider error system
2. Implement TASK 3A.6: Verify tenant execution isolation
3. Implement TASK 3A.7: Create provider execution map
4. Implement TASK 3A.8: Certify architectural compliance

---

**END OF REPORT**

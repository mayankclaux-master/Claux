# CLAUX Canonical Connector Standard

**Version:** 1.0
**Architecture:** CLAUX V1 HYBRID
**Status:** LOCKED

---

## PURPOSE

This document defines the canonical connector standard for CLAUX V1. All connectors MUST follow these rules to ensure:
- Tenant isolation
- Credential security
- Deterministic execution
- No hidden orchestration
- No queues or distributed systems
- Simple, direct API execution

---

## CORE PRINCIPLES

### 1. One Connector Per Provider
- Each external API provider has exactly ONE connector
- No duplicate connectors for the same provider
- No provider-specific abstractions
- Connectors are thin wrappers around provider APIs

### 2. Tenant Credential Injection Only
- Connectors MUST retrieve credentials via CredentialInjectionAuthority
- Connectors MUST NOT access credentials directly
- Connectors MUST NOT store credentials
- Credentials are injected at runtime per tenant

### 3. No Hidden Retries
- Connectors MUST NOT implement automatic retries
- Connectors MUST NOT implement exponential backoff
- Connectors MUST NOT implement retry queues
- Errors are returned immediately to caller

### 4. No Background Queues
- Connectors MUST NOT queue requests
- Connectors MUST NOT implement background processing
- Connectors MUST NOT use job queues
- All execution is synchronous and direct

### 5. Direct Execution Only
- Connectors MUST execute API calls directly
- Connectors MUST NOT use intermediate services
- Connectors MUST NOT use proxy layers
- Connectors MUST NOT use orchestration layers

### 6. Deterministic Responses Only
- Connectors MUST return typed responses
- Connectors MUST NOT return random or probabilistic data
- Connectors MUST NOT implement caching
- Connectors MUST NOT implement state

### 7. Typed Outputs Only
- Connectors MUST define response types
- Connectors MUST validate responses
- Connectors MUST parse responses into typed objects
- Connectors MUST NOT return raw JSON

---

## CONNECTOR STRUCTURE

### Base Class
All connectors MUST extend `BaseConnector`:

```typescript
import { BaseConnector, BaseConnectorConfig } from './base.connector';

export class ProviderConnector extends BaseConnector {
  constructor(config: BaseConnectorConfig) {
    super(config, 'provider-name');
  }

  protected prepareRequest(
    operation: string,
    payload: Record<string, unknown>,
    credentials: Record<string, unknown>
  ): Record<string, unknown> {
    // Implement request preparation
  }

  protected async executeProvider(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Implement API execution
  }

  protected parseResponse<T>(response: Record<string, unknown>): T {
    // Implement response parsing
  }

  protected handleError(error: unknown, operation: string): ProviderError {
    // Implement error handling
  }
}
```

### Required Methods
- `prepareRequest()` - Prepare API request with credentials
- `executeProvider()` - Execute API call with timeout
- `parseResponse()` - Parse and validate response
- `handleError()` - Convert errors to ProviderError

### Optional Methods
- `extractRateLimit()` - Extract rate limit info from response
- `extractQuota()` - Extract quota info from response
- `extractCost()` - Extract cost info from response
- `extractTokens()` - Extract token usage from response

---

## CREDENTIAL INJECTION

### Credential Flow
1. Connector calls `this.injectCredentials()` (inherited from BaseConnector)
2. BaseConnector calls `CredentialInjectionAuthority.injectCredentials()`
3. Authority retrieves tenant integrations
4. Authority decrypts credentials
5. Authority returns credentials to connector
6. Connector uses credentials for API execution

### Credential Types
- `apiKey` - API key authentication
- `accessToken` - OAuth2 access token
- `username` + `password` - Basic authentication
- Custom fields as needed

### Credential Security
- Credentials are encrypted at rest
- Credentials are decrypted at runtime
- Credentials are never logged in plaintext
- Credentials are masked in error messages

---

## ERROR HANDLING

### Error Types
Connectors MUST use canonical error types:

- `AuthenticationError` - Authentication/authorization failed
- `RateLimitError` - Rate limit exceeded
- `ExecutionTimeoutError` - Request timed out
- `NetworkError` - Network failure
- `ProviderError` - Generic provider error
- `CredentialInjectionError` - Credential injection failed

### Error Handling Pattern
```typescript
protected handleError(error: unknown, operation: string): ProviderError {
  if (error instanceof ProviderError) {
    return error;
  }

  if (error instanceof Error) {
    return new ProviderError(
      ProviderErrorCode.PROVIDER_ERROR,
      error.message,
      this.tenantId,
      this.executionId,
      this.taskId,
      this.provider,
      operation,
      { originalError: error.name }
    );
  }

  return new ProviderError(
    ProviderErrorCode.PROVIDER_ERROR,
    'Unknown error',
    this.tenantId,
    this.executionId,
    this.taskId,
    this.provider,
    operation,
    { error: String(error) }
  );
}
```

---

## TIMEOUT GUARDS

### Default Timeout
- Default timeout: 30 seconds
- Configurable per connector
- Configurable per operation

### Timeout Implementation
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ... other options
  });
  clearTimeout(timeoutId);
  // ... process response
} catch (error) {
  clearTimeout(timeoutId);
  if (error instanceof Error && error.name === 'AbortError') {
    throw new ExecutionTimeoutError(
      'Request timed out',
      this.tenantId,
      this.executionId,
      this.taskId,
      this.provider,
      'executeProvider'
    );
  }
  // ... handle other errors
}
```

---

## RESPONSE VALIDATION

### Validation Pattern
```typescript
protected parseResponse<T>(response: Record<string, unknown>): T {
  // Validate response structure
  if (!response.requiredField) {
    throw new ProviderError(
      ProviderErrorCode.INVALID_RESPONSE,
      'Invalid response: missing required field',
      this.tenantId,
      this.executionId,
      this.taskId,
      this.provider,
      'parseResponse',
      { response }
    );
  }

  // Parse and type response
  const data: ProviderResponseData = {
    field1: response.field1 as string,
    field2: response.field2 as number,
  };

  return data as T;
}
```

### Validation Rules
- Validate required fields exist
- Validate field types match expected types
- Validate array structures
- Validate nested objects
- Throw ProviderError on validation failure

---

## METADATA EXTRACTION

### Required Metadata
- `provider` - Provider name
- `operation` - Operation name
- `executionTimeMs` - Execution duration
- `timestamp` - ISO timestamp

### Optional Metadata
- `rateLimit` - Rate limit info
- `quota` - Quota usage info
- `cost` - Cost info
- `tokens` - Token usage info

### Extraction Pattern
```typescript
protected extractRateLimit(response: Record<string, unknown> | null) {
  if (!response) return undefined;
  
  const remaining = response.headers?.['x-ratelimit-remaining'] as number;
  const resetAt = response.headers?.['x-ratelimit-reset'] as string;
  
  if (remaining === undefined || resetAt === undefined) return undefined;
  
  return {
    remaining,
    resetAt,
  };
}
```

---

## PROVIDER-SPECIFIC RULES

### DataForSEO
- Use Basic Auth with API key
- Support Search Volume, SERP, Backlinks, Local SERP APIs
- Track cost per task
- Handle rate limits properly

### SerpAPI
- Use API key authentication
- Support SERP snapshots, ranking verification
- Track cost per request
- Handle rate limits properly

### Google APIs (Analytics, Search Console, Business Profile)
- Use OAuth2 access token
- Support date range queries
- Handle token refresh (via CredentialInjectionAuthority)
- Track quota usage

### OpenAI
- Use API key authentication
- Support chat completions
- Track token usage
- Track cost per request
- Handle rate limits properly

### Screaming Frog
- Use API key authentication
- Support crawl exports
- Handle large file downloads
- Track cost per crawl

---

## FORBIDDEN PATTERNS

### DO NOT
- Implement automatic retries
- Implement exponential backoff
- Implement request queuing
- Implement background processing
- Implement caching
- Implement state management
- Access credentials directly
- Store credentials
- Log credentials in plaintext
- Use proxy layers
- Use orchestration layers
- Implement distributed execution
- Implement hidden retries
- Implement speculative features

### DO
- Extend BaseConnector
- Use CredentialInjectionAuthority
- Implement timeout guards
- Validate responses
- Handle errors properly
- Return typed responses
- Execute requests directly
- Fail fast on errors
- Log metadata properly
- Mask credentials in logs

---

## TESTING

### Unit Tests
- Test request preparation
- Test response parsing
- Test error handling
- Test credential injection (mocked)
- Test timeout guards

### Integration Tests
- Test real API calls (with test credentials)
- Test rate limit handling
- Test error scenarios
- Test credential flow

---

## DOCUMENTATION

### Required Documentation
- Provider API documentation link
- Supported operations
- Required credentials
- Rate limits
- Cost structure
- Error codes

### Code Documentation
- JSDoc comments on all public methods
- Inline comments for complex logic
- Type definitions for all responses

---

## COMPLIANCE CHECKLIST

### Connector Must
- [ ] Extend BaseConnector
- [ ] Use CredentialInjectionAuthority
- [ ] Implement prepareRequest()
- [ ] Implement executeProvider()
- [ ] Implement parseResponse()
- [ ] Implement handleError()
- [ ] Implement timeout guards
- [ ] Validate responses
- [ ] Return typed responses
- [ ] Handle errors properly
- [ ] Extract metadata
- [ ] Mask credentials in logs

### Connector Must Not
- [ ] Implement automatic retries
- [ ] Implement request queuing
- [ ] Implement background processing
- [ ] Implement caching
- [ ] Implement state management
- [ ] Access credentials directly
- [ ] Store credentials
- [ ] Log credentials in plaintext
- [ ] Use proxy layers
- [ ] Use orchestration layers

---

## VERSION HISTORY

### v1.0 (2026-05-23)
- Initial canonical connector standard
- Based on Phase 5B connector audit
- Locked for CLAUX V1 architecture

---

**Status:** LOCKED
**Last Updated:** 2026-05-23

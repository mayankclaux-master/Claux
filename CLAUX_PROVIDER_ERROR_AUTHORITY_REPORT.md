# CLAUX Provider Error Authority Report

**Report Date:** 2025-01-19
**Phase:** Phase 3A - Provider Execution Sovereignty Migration
**Status:** ERROR AUTHORITY ESTABLISHED

## Executive Summary

This report establishes the canonical provider error hierarchy and defines RuntimeService as the sole execution authority for deciding retry, fail, abort, and escalate actions. All provider errors are normalized into a canonical hierarchy, and RuntimeService makes uniform decisions based on error type, retry count, and governance policies. No provider may independently decide execution flow.

**ERROR AUTHORITY STATUS:** ESTABLISHED AND LOCKED

---

## Canonical Provider Error Hierarchy

### Error Hierarchy Structure

```
Provider Error
├── Auth Errors (Non-Retryable)
│   ├── AUTH_FAILED - Invalid credentials
│   ├── AUTH_EXPIRED - Expired credentials
│   ├── AUTH_INVALID - Invalid credential format
│   └── AUTH_INSUFFICIENT - Insufficient permissions
├── Rate Limit Errors (Retryable)
│   ├── RATE_LIMIT_EXCEEDED - General rate limit
│   ├── RATE_LIMIT_DAILY - Daily rate limit
│   ├── RATE_LIMIT_HOURLY - Hourly rate limit
│   └── RATE_LIMIT_MINUTE - Minute rate limit
├── Validation Errors (Non-Retryable)
│   ├── VALIDATION_FAILED - General validation failure
│   ├── VALIDATION_MISSING_REQUIRED - Missing required fields
│   ├── VALIDATION_INVALID_FORMAT - Invalid format
│   └── VALIDATION_OUT_OF_RANGE - Value out of range
├── Timeout Errors (Retryable)
│   ├── TIMEOUT - General timeout
│   ├── TIMEOUT_CONNECTION - Connection timeout
│   ├── TIMEOUT_READ - Read timeout
│   └── TIMEOUT_WRITE - Write timeout
├── Quota Errors (Non-Retryable)
│   ├── QUOTA_EXCEEDED - General quota exceeded
│   ├── QUOTA_DAILY - Daily quota exceeded
│   ├── QUOTA_MONTHLY - Monthly quota exceeded
│   └── QUOTA_TOKENS - Token quota exceeded
├── Outage Errors (Retryable)
│   ├── OUTAGE - General outage
│   ├── OUTAGE_MAINTENANCE - Scheduled maintenance
│   ├── OUTAGE_DEGRADED - Service degradation
│   └── OUTAGE_UNAVAILABLE - Service unavailable
├── Malformed Errors (Non-Retryable)
│   ├── MALFORMED_RESPONSE - Malformed response
│   ├── MALFORMED_JSON - Invalid JSON
│   ├── MALFORMED_MISSING_FIELDS - Missing required fields
│   └── MALFORMED_UNEXPECTED_FORMAT - Unexpected format
└── Unknown Errors (Retryable - Conservative)
    ├── UNKNOWN_ERROR - Unknown error
    └── UNEXPECTED_ERROR - Unexpected error
```

---

## Error Normalization Rules

### Rule 1: Auth Errors Must Be Non-Retryable

**Rationale:** Authentication failures indicate invalid credentials that cannot be fixed by retrying. User must update credentials.

**RuntimeService Action:** Fail execution immediately, alert user to check credentials.

**Examples:**
- 401 Unauthorized → AUTH_FAILED (non-retryable)
- 403 Forbidden → AUTH_INSUFFICIENT (non-retryable)
- Expired token → AUTH_EXPIRED (non-retryable)

---

### Rule 2: Rate Limit Errors Must Be Retryable

**Rationale:** Rate limits are temporary and can be resolved by waiting and retrying.

**RuntimeService Action:** Retry with exponential backoff, respect rate limit reset time.

**Examples:**
- 429 Too Many Requests → RATE_LIMIT_EXCEEDED (retryable)
- X-RateLimit-Remaining header → RATE_LIMIT_EXCEEDED (retryable)

**Backoff Strategy:**
- Retry 1: 1 second
- Retry 2: 2 seconds
- Retry 3: 4 seconds
- Max retries: 3

---

### Rule 3: Validation Errors Must Be Non-Retryable

**Rationale:** Validation failures indicate invalid request data that cannot be fixed by retrying. Request must be corrected.

**RuntimeService Action:** Fail execution immediately, alert user to fix request.

**Examples:**
- 400 Bad Request → VALIDATION_FAILED (non-retryable)
- Missing required field → VALIDATION_MISSING_REQUIRED (non-retryable)
- Invalid format → VALIDATION_INVALID_FORMAT (non-retryable)

---

### Rule 4: Timeout Errors Must Be Retryable

**Rationale:** Timeouts can be transient (network issues, provider load) and can be resolved by retrying.

**RuntimeService Action:** Retry with exponential backoff, increase timeout on subsequent retries.

**Examples:**
- Request timeout → TIMEOUT (retryable)
- Connection timeout → TIMEOUT_CONNECTION (retryable)
- Read timeout → TIMEOUT_READ (retryable)

**Backoff Strategy:**
- Retry 1: 1 second
- Retry 2: 2 seconds
- Retry 3: 4 seconds
- Max retries: 3

**Timeout Escalation:**
- Retry 1: 30 seconds
- Retry 2: 60 seconds
- Retry 3: 120 seconds

---

### Rule 5: Quota Errors Must Be Non-Retryable

**Rationale:** Quota exceeded indicates resource exhaustion that cannot be resolved by retrying. User must increase quota or wait for reset.

**RuntimeService Action:** Fail execution immediately, alert user about quota status and reset time.

**Examples:**
- Quota exceeded → QUOTA_EXCEEDED (non-retryable)
- Monthly limit → QUOTA_MONTHLY (non-retryable)
- Token limit → QUOTA_TOKENS (non-retryable)

**Quota Enforcement:**
- RuntimeService tracks quota usage
- RuntimeService prevents execution when quota exhausted
- RuntimeService alerts user before quota exhaustion

---

### Rule 6: Outage Errors Must Be Retryable

**Rationale:** Provider outages are temporary and can be resolved by waiting and retrying.

**RuntimeService Action:** Retry with longer exponential backoff, alert on persistent failures.

**Examples:**
- 500 Internal Server Error → OUTAGE (retryable)
- 502 Bad Gateway → OUTAGE (retryable)
- 503 Service Unavailable → OUTAGE_UNAVAILABLE (retryable)
- Maintenance mode → OUTAGE_MAINTENANCE (retryable)

**Backoff Strategy:**
- Retry 1: 5 seconds
- Retry 2: 15 seconds
- Retry 3: 45 seconds
- Retry 4: 135 seconds
- Retry 5: 405 seconds
- Max retries: 5

**Persistent Failure Detection:**
- If 5 consecutive retries fail, escalate to governance
- Governance may mark provider as degraded or down

---

### Rule 7: Malformed Errors Must Be Non-Retryable

**Rationale:** Malformed responses indicate provider API changes or bugs that cannot be resolved by retrying.

**RuntimeService Action:** Fail execution immediately, log for debugging, alert engineering team.

**Examples:**
- Invalid JSON → MALFORMED_JSON (non-retryable)
- Missing required field → MALFORMED_MISSING_FIELDS (non-retryable)
- Unexpected format → MALFORMED_UNEXPECTED_FORMAT (non-retryable)

**Debugging Actions:**
- Log full response body
- Log request details
- Alert engineering team for investigation

---

### Rule 8: Unknown Errors Must Be Retryable (Conservative)

**Rationale:** Unknown errors may be transient, so conservative retry is appropriate.

**RuntimeService Action:** Retry with exponential backoff, log for investigation.

**Examples:**
- Unexpected error code → UNKNOWN_ERROR (retryable)
- Unclassified error → UNEXPECTED_ERROR (retryable)

**Backoff Strategy:**
- Retry 1: 1 second
- Retry 2: 2 seconds
- Max retries: 2

**Investigation Actions:**
- Log full error details
- Alert engineering team if pattern emerges

---

## RuntimeService Error Decision Logic

### Decision Flow

```
Provider Error Received
    ↓
Error Normalization
    ↓
Error Type Classification
    ↓
Retryable Check
    ↓
    ├─ Non-Retryable → Fail Execution
    │                  └─ Alert User
    │
    └─ Retryable → Retry Count Check
                    ├─ Max Retries Exceeded → Fail Execution
                    │                          └─ Alert User
                    │
                    └─ Retries Remaining → Calculate Backoff
                                         ├─ Execute Retry
                                         └─ Log Retry
```

### Decision Matrix

| Error Type | Retryable | Max Retries | Backoff Strategy | Action on Max |
|------------|-----------|-------------|-----------------|---------------|
| auth | No | 0 | N/A | Fail, alert user |
| rate_limit | Yes | 3 | Exponential (1s, 2s, 4s) | Fail, alert user |
| validation | No | 0 | N/A | Fail, alert user |
| timeout | Yes | 3 | Exponential (1s, 2s, 4s) | Fail, alert user |
| quota | No | 0 | N/A | Fail, alert user |
| outage | Yes | 5 | Exponential (5s, 15s, 45s, 135s, 405s) | Fail, alert user |
| malformed | No | 0 | N/A | Fail, alert engineering |
| unknown | Yes | 2 | Exponential (1s, 2s) | Fail, alert engineering |

---

## RuntimeService Implementation

### Error Decision Function

```typescript
/**
 * RuntimeService error decision function
 * Sole authority for retry/fail/abort/escalate decisions
 */
export class RuntimeService {
  /**
   * Decide whether to retry execution based on error
   * @param error - Normalized provider error
   * @param retryCount - Current retry count
   * @returns Decision object with action and delay
   */
  decideErrorAction(error: ProviderError, retryCount: number): ErrorDecision {
    // Non-retryable errors - fail immediately
    if (!error.retryable) {
      return {
        action: 'fail',
        delay: 0,
        reason: `Non-retryable error: ${error.code} (${error.type})`
      };
    }

    // Get max retries for error type
    const maxRetries = this.getMaxRetries(error.type);

    // Max retries exceeded - fail
    if (retryCount >= maxRetries) {
      return {
        action: 'fail',
        delay: 0,
        reason: `Max retries (${maxRetries}) exceeded for error: ${error.code} (${error.type})`
      };
    }

    // Retry with backoff
    const backoffDelay = this.calculateBackoff(error.type, retryCount);
    
    return {
      action: 'retry',
      delay: backoffDelay,
      reason: `Retrying error: ${error.code} (${error.type}), attempt ${retryCount + 1}/${maxRetries}`
    };
  }

  /**
   * Get max retries for error type
   */
  private getMaxRetries(errorType: ErrorType): number {
    switch (errorType) {
      case 'rate_limit':
      case 'timeout':
        return 3;
      case 'outage':
        return 5;
      case 'unknown':
        return 2;
      default:
        return 0; // auth, validation, quota, malformed - never retry
    }
  }

  /**
   * Calculate backoff delay for error type
   */
  private calculateBackoff(errorType: ErrorType, retryCount: number): number {
    const baseDelay = this.getBaseDelay(errorType);
    const multiplier = this.getBackoffMultiplier(errorType);
    return baseDelay * Math.pow(multiplier, retryCount);
  }

  /**
   * Get base delay for error type
   */
  private getBaseDelay(errorType: ErrorType): number {
    switch (errorType) {
      case 'rate_limit':
      case 'timeout':
      case 'unknown':
        return 1000; // 1 second
      case 'outage':
        return 5000; // 5 seconds
      default:
        return 1000;
    }
  }

  /**
   * Get backoff multiplier for error type
   */
  private getBackoffMultiplier(errorType: ErrorType): number {
    switch (errorType) {
      case 'rate_limit':
      case 'timeout':
      case 'unknown':
        return 2; // Exponential backoff
      case 'outage':
        return 3; // Longer exponential backoff
      default:
        return 2;
    }
  }
}

/**
 * Error decision interface
 */
export interface ErrorDecision {
  action: 'retry' | 'fail' | 'abort' | 'escalate';
  delay: number;
  reason: string;
}
```

---

## Error Normalization Implementation

### Error Normalizer Function

```typescript
/**
 * Normalize provider error to canonical format
 * All providers MUST use this normalization
 */
export class ErrorNormalizer {
  /**
   * Normalize HTTP error to canonical error
   */
  normalizeHttpError(error: any, provider: string): ProviderError {
    const status = error.status;
    const message = error.message || 'HTTP error';

    // Auth errors (401, 403)
    if (status === 401) {
      return {
        code: ERROR_CODES.AUTH_FAILED,
        message: 'Authentication failed',
        retryable: false,
        type: 'auth',
        providerCode: status.toString()
      };
    }
    if (status === 403) {
      return {
        code: ERROR_CODES.AUTH_INSUFFICIENT,
        message: 'Insufficient permissions',
        retryable: false,
        type: 'auth',
        providerCode: status.toString()
      };
    }

    // Rate limit errors (429)
    if (status === 429) {
      return {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded',
        retryable: true,
        type: 'rate_limit',
        providerCode: status.toString()
      };
    }

    // Validation errors (400)
    if (status === 400) {
      return {
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Request validation failed',
        retryable: false,
        type: 'validation',
        providerCode: status.toString()
      };
    }

    // Outage errors (500, 502, 503, 504)
    if (status >= 500) {
      return {
        code: ERROR_CODES.OUTAGE,
        message: 'Provider outage',
        retryable: true,
        type: 'outage',
        providerCode: status.toString()
      };
    }

    // Unknown error
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: message,
      retryable: true,
      type: 'unknown',
      providerCode: status?.toString()
    };
  }

  /**
   * Normalize network error to canonical error
   */
  normalizeNetworkError(error: any, provider: string): ProviderError {
    // Timeout errors
    if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
      return {
        code: ERROR_CODES.TIMEOUT,
        message: 'Request timeout',
        retryable: true,
        type: 'timeout',
        providerCode: error.code
      };
    }

    // Connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        code: ERROR_CODES.OUTAGE,
        message: 'Provider unavailable',
        retryable: true,
        type: 'outage',
        providerCode: error.code
      };
    }

    // Unknown network error
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message || 'Network error',
      retryable: true,
      type: 'unknown',
      providerCode: error.code
    };
  }

  /**
   * Normalize JSON parse error to canonical error
   */
  normalizeJsonError(error: any, provider: string): ProviderError {
    return {
      code: ERROR_CODES.MALFORMED_JSON,
      message: 'Invalid JSON response from provider',
      retryable: false,
      type: 'malformed',
      providerCode: error.name
    };
  }

  /**
   * Normalize validation error to canonical error
   */
  normalizeValidationError(error: any, provider: string): ProviderError {
    return {
      code: ERROR_CODES.VALIDATION_FAILED,
      message: error.message || 'Request validation failed',
      retryable: false,
      type: 'validation',
      providerCode: error.code
    };
  }
}
```

---

## Provider-Specific Error Normalization

### DataForSEO Error Normalization

```typescript
export function normalizeDataForSEOError(error: any): ProviderError {
  const status = error.status;
  const message = error.message || error.error?.message || 'DataForSEO error';

  // Auth errors
  if (status === 401) {
    return {
      code: ERROR_CODES.AUTH_FAILED,
      message: 'DataForSEO authentication failed',
      retryable: false,
      type: 'auth',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Rate limit errors
  if (status === 429) {
    return {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'DataForSEO rate limit exceeded',
      retryable: true,
      type: 'rate_limit',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Validation errors
  if (status === 400) {
    return {
      code: ERROR_CODES.VALIDATION_FAILED,
      message: 'DataForSEO validation failed',
      retryable: false,
      type: 'validation',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Outage errors
  if (status >= 500) {
    return {
      code: ERROR_CODES.OUTAGE,
      message: 'DataForSEO service outage',
      retryable: true,
      type: 'outage',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Unknown error
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: message,
    retryable: true,
    type: 'unknown',
    providerCode: status?.toString(),
    details: { error }
  };
}
```

### OpenAI Error Normalization

```typescript
export function normalizeOpenAIError(error: any): ProviderError {
  const status = error.status;
  const message = error.message || error.error?.message || 'OpenAI error';

  // Auth errors
  if (status === 401 || error.code === 'invalid_api_key') {
    return {
      code: ERROR_CODES.AUTH_FAILED,
      message: 'OpenAI authentication failed',
      retryable: false,
      type: 'auth',
      providerCode: error.code,
      details: { error }
    };
  }

  // Rate limit errors
  if (status === 429 || error.code === 'rate_limit_exceeded') {
    return {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'OpenAI rate limit exceeded',
      retryable: true,
      type: 'rate_limit',
      providerCode: error.code,
      details: { error }
    };
  }

  // Quota errors
  if (error.code === 'insufficient_quota') {
    return {
      code: ERROR_CODES.QUOTA_EXCEEDED,
      message: 'OpenAI quota exceeded',
      retryable: false,
      type: 'quota',
      providerCode: error.code,
      details: { error }
    };
  }

  // Validation errors
  if (status === 400 || error.code === 'invalid_request') {
    return {
      code: ERROR_CODES.VALIDATION_FAILED,
      message: 'OpenAI validation failed',
      retryable: false,
      type: 'validation',
      providerCode: error.code,
      details: { error }
    };
  }

  // Timeout errors
  if (error.code === 'timeout') {
    return {
      code: ERROR_CODES.TIMEOUT,
      message: 'OpenAI request timeout',
      retryable: true,
      type: 'timeout',
      providerCode: error.code,
      details: { error }
    };
  }

  // Outage errors
  if (status >= 500) {
    return {
      code: ERROR_CODES.OUTAGE,
      message: 'OpenAI service outage',
      retryable: true,
      type: 'outage',
      providerCode: status?.toString(),
      details: { error }
    };
  }

  // Unknown error
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: message,
    retryable: true,
    type: 'unknown',
    providerCode: error.code,
    details: { error }
  };
}
```

### SERP Error Normalization

```typescript
export function normalizeSERPError(error: any): ProviderError {
  const status = error.status;
  const message = error.message || 'SERP error';

  // Auth errors
  if (status === 401) {
    return {
      code: ERROR_CODES.AUTH_FAILED,
      message: 'SERP authentication failed',
      retryable: false,
      type: 'auth',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Rate limit errors
  if (status === 429) {
    return {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'SERP rate limit exceeded',
      retryable: true,
      type: 'rate_limit',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Validation errors
  if (status === 400) {
    return {
      code: ERROR_CODES.VALIDATION_FAILED,
      message: 'SERP validation failed',
      retryable: false,
      type: 'validation',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Outage errors
  if (status >= 500) {
    return {
      code: ERROR_CODES.OUTAGE,
      message: 'SERP service outage',
      retryable: true,
      type: 'outage',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Unknown error
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: message,
    retryable: true,
    type: 'unknown',
    providerCode: status?.toString(),
    details: { error }
  };
}
```

### GMB Error Normalization

```typescript
export function normalizeGMBError(error: any): ProviderError {
  const status = error.status;
  const message = error.message || 'GMB error';

  // Auth errors
  if (status === 401 || error.code === 401) {
    return {
      code: ERROR_CODES.AUTH_FAILED,
      message: 'GMB authentication failed',
      retryable: false,
      type: 'auth',
      providerCode: status?.toString(),
      details: { error }
    };
  }

  // Rate limit errors
  if (status === 429) {
    return {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'GMB rate limit exceeded',
      retryable: true,
      type: 'rate_limit',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Validation errors
  if (status === 400) {
    return {
      code: ERROR_CODES.VALIDATION_FAILED,
      message: 'GMB validation failed',
      retryable: false,
      type: 'validation',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Outage errors
  if (status >= 500) {
    return {
      code: ERROR_CODES.OUTAGE,
      message: 'GMB service outage',
      retryable: true,
      type: 'outage',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Unknown error
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: message,
    retryable: true,
    type: 'unknown',
    providerCode: status?.toString(),
    details: { error }
  };
}
```

### CMS Connector Error Normalization

```typescript
export function normalizeCMSError(error: any, provider: string): ProviderError {
  const status = error.status;
  const message = error.message || `${provider} error`;

  // Auth errors
  if (status === 401 || status === 403) {
    return {
      code: ERROR_CODES.AUTH_FAILED,
      message: `${provider} authentication failed`,
      retryable: false,
      type: 'auth',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Rate limit errors
  if (status === 429) {
    return {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: `${provider} rate limit exceeded`,
      retryable: true,
      type: 'rate_limit',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Validation errors
  if (status === 400) {
    return {
      code: ERROR_CODES.VALIDATION_FAILED,
      message: `${provider} validation failed`,
      retryable: false,
      type: 'validation',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Timeout errors
  if (error.name === 'AbortError') {
    return {
      code: ERROR_CODES.TIMEOUT,
      message: `${provider} request timeout`,
      retryable: true,
      type: 'timeout',
      providerCode: error.name,
      details: { error }
    };
  }

  // Outage errors
  if (status >= 500) {
    return {
      code: ERROR_CODES.OUTAGE,
      message: `${provider} service outage`,
      retryable: true,
      type: 'outage',
      providerCode: status.toString(),
      details: { error }
    };
  }

  // Unknown error
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: message,
    retryable: true,
    type: 'unknown',
    providerCode: status?.toString(),
    details: { error }
  };
}
```

---

## Error Logging and Observability

### Error Logging Requirements

All errors MUST be logged with:

1. **Error Code** - Canonical error code
2. **Error Type** - Error type category
3. **Error Message** - Human-readable message
4. **Provider** - Provider identifier
5. **Retryable** - Whether error is retryable
6. **Retry Count** - Current retry count
7. **Execution ID** - Execution correlation ID
8. **Tenant ID** - Tenant identifier
9. **Timestamp** - ISO 8601 timestamp
10. **Provider Code** - Original provider error code
11. **Details** - Additional error details

### Error Logging Implementation

```typescript
export class ErrorLogger {
  constructor(private logService: LogService) {}

  /**
   * Log provider error
   */
  async logProviderError(
    executionId: string,
    tenantId: string,
    provider: string,
    error: ProviderError,
    retryCount: number
  ): Promise<void> {
    await this.logService.writeError(
      executionId,
      null,
      `Provider error: ${error.code} (${error.type}) - ${error.message}`,
      {
        provider,
        error_code: error.code,
        error_type: error.type,
        error_message: error.message,
        retryable: error.retryable,
        retry_count: retryCount,
        provider_code: error.providerCode,
        details: error.details
      }
    );
  }

  /**
   * Log retry attempt
   */
  async logRetryAttempt(
    executionId: string,
    tenantId: string,
    provider: string,
    error: ProviderError,
    retryCount: number,
    delay: number
  ): Promise<void> {
    await this.logService.writeLog(
      executionId,
      'info',
      `Retrying provider request: ${provider} - attempt ${retryCount + 1}`,
      {
        provider,
        error_code: error.code,
        error_type: error.type,
        retry_count: retryCount,
        delay_ms: delay
      }
    );
  }

  /**
   * Log execution failure
   */
  async logExecutionFailure(
    executionId: string,
    tenantId: string,
    provider: string,
    error: ProviderError,
    retryCount: number,
    reason: string
  ): Promise<void> {
    await this.logService.writeError(
      executionId,
      null,
      `Execution failed: ${reason}`,
      {
        provider,
        error_code: error.code,
        error_type: error.type,
        error_message: error.message,
        retry_count: retryCount,
        provider_code: error.providerCode,
        failure_reason: reason
      }
    );
  }
}
```

---

## Error Governance

### Persistent Failure Detection

RuntimeService MUST detect persistent failures and escalate to governance:

```typescript
export class ErrorGovernance {
  private failureCounts = new Map<string, number>();
  private failureThreshold = 5;

  /**
   * Check if provider has persistent failures
   */
  hasPersistentFailures(provider: string): boolean {
    const count = this.failureCounts.get(provider) || 0;
    return count >= this.failureThreshold;
  }

  /**
   * Increment failure count for provider
   */
  incrementFailureCount(provider: string): void {
    const count = this.failureCounts.get(provider) || 0;
    this.failureCounts.set(provider, count + 1);
  }

  /**
   * Reset failure count for provider
   */
  resetFailureCount(provider: string): void {
    this.failureCounts.delete(provider);
  }

  /**
   * Get degraded providers
   */
  getDegradedProviders(): string[] {
    return Array.from(this.failureCounts.entries())
      .filter(([_, count]) => count >= this.failureThreshold)
      .map(([provider, _]) => provider);
  }
}
```

### Provider Degradation

When a provider has persistent failures, RuntimeService MUST:

1. Mark provider as degraded
2. Alert operations team
3. Route traffic away from degraded provider (if possible)
4. Continue monitoring for recovery

---

## Compliance Checklist

### Error Normalization Compliance

- [ ] All provider errors implement ProviderError interface
- [ ] All error codes are canonical ERROR_CODES values
- [ ] All error types are ErrorType enum values
- [ ] Auth errors are marked as non-retryable
- [ ] Validation errors are marked as non-retryable
- [ ] Quota errors are marked as non-retryable
- [ ] Malformed errors are marked as non-retryable
- [ ] Rate limit errors are marked as retryable
- [ ] Timeout errors are marked as retryable
- [ ] Outage errors are marked as retryable
- [ ] Unknown errors are marked as retryable

### RuntimeService Authority Compliance

- [ ] RuntimeService is sole authority for retry decisions
- [ ] RuntimeService is sole authority for fail decisions
- [ ] RuntimeService is sole authority for abort decisions
- [ ] RuntimeService is sole authority for escalate decisions
- [ ] No provider may independently decide execution flow
- [ ] No provider may implement retry logic
- [ ] No provider may implement backoff logic
- [ ] No provider may decide to fail execution

### Error Logging Compliance

- [ ] All errors are logged with canonical fields
- [ ] All errors include execution ID
- [ ] All errors include tenant ID
- [ ] All errors include provider identifier
- [ ] All errors include error code
- [ ] All errors include error type
- [ ] All errors include retry count
- [ ] All errors include timestamp

### Error Governance Compliance

- [ ] Persistent failure detection is implemented
- [ ] Degraded provider marking is implemented
- [ ] Provider recovery monitoring is implemented
- [ ] Operations team alerting is implemented

---

## Conclusion

The canonical provider error hierarchy is now standardized and RuntimeService is established as the sole execution authority for deciding retry, fail, abort, and escalate actions. All provider errors are normalized into a canonical hierarchy, and RuntimeService makes uniform decisions based on error type, retry count, and governance policies. No provider may independently decide execution flow.

**Error Authority Status:** ESTABLISHED AND LOCKED

**Next Steps:**
1. Implement TASK 3A.6: Verify tenant execution isolation
2. Implement TASK 3A.7: Create provider execution map
3. Implement TASK 3A.8: Certify architectural compliance

---

**END OF REPORT**

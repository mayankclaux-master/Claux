/**
 * Canonical Error Authority
 * 
 * This is the sole authority for error decision making in CLAUX.
 * RuntimeService uses this authority to determine retry, fail, or abort decisions
 * based on provider errors returned by runtime connectors.
 * 
 * CRITICAL: No other component may make error decisions.
 * RuntimeService is the ONLY error decision authority.
 */

import { ProviderError, ProviderErrorCode } from '../contracts/provider-error.contract';
import { ProviderExecutionStatus } from '../contracts/provider-response.contract';

/**
 * Error decision
 * The decision made by the error authority
 */
export enum ErrorDecision {
  RETRY = 'retry',
  FAIL = 'fail',
  ABORT = 'abort',
}

/**
 * Error decision result
 */
export interface ErrorDecisionResult {
  readonly decision: ErrorDecision;
  readonly retryAfterMs?: number;
  readonly maxRetries?: number;
}

/**
 * Canonical Error Authority
 * Sole authority for error decision making
 */
export class ErrorAuthority {
  /**
   * Make error decision based on provider error
   * CRITICAL: This is the ONLY method that makes error decisions
   */
  makeDecision(error: ProviderError, currentRetryCount: number, maxRetries: number): ErrorDecisionResult {
    // Check if max retries exceeded
    if (currentRetryCount >= maxRetries) {
      return {
        decision: ErrorDecision.FAIL,
      };
    }

    // Check if error is retryable
    if (!error.retryable) {
      return {
        decision: ErrorDecision.FAIL,
      };
    }

    // Check error severity
    if (error.severity === 'critical') {
      return {
        decision: ErrorDecision.ABORT,
      };
    }

    // Make decision based on error code
    const decision = this.getDecisionByErrorCode(error.code);

    if (decision === ErrorDecision.RETRY) {
      return {
        decision: ErrorDecision.RETRY,
        retryAfterMs: this.getRetryDelayMs(error.code, currentRetryCount),
        maxRetries,
      };
    }

    return {
      decision,
    };
  }

  /**
   * Get decision by error code
   */
  private getDecisionByErrorCode(code: ProviderErrorCode): ErrorDecision {
    switch (code) {
      // Retryable errors
      case ProviderErrorCode.RATE_LIMIT_EXCEEDED:
      case ProviderErrorCode.EXECUTION_TIMEOUT:
      case ProviderErrorCode.NETWORK_ERROR:
      case ProviderErrorCode.CONNECTION_REFUSED:
      case ProviderErrorCode.CONNECTION_TIMEOUT:
      case ProviderErrorCode.PROVIDER_UNAVAILABLE:
      case ProviderErrorCode.PROVIDER_MAINTENANCE:
        return ErrorDecision.RETRY;

      // Abort errors
      case ProviderErrorCode.TENANT_ISOLATION_VIOLATION:
      case ProviderErrorCode.CROSS_TENANT_ACCESS:
      case ProviderErrorCode.CREDENTIAL_INJECTION_FAILED:
      case ProviderErrorCode.CREDENTIAL_DECRYPTION_FAILED:
        return ErrorDecision.ABORT;

      // Fail errors
      case ProviderErrorCode.AUTHENTICATION_FAILED:
      case ProviderErrorCode.INVALID_CREDENTIALS:
      case ProviderErrorCode.CREDENTIALS_EXPIRED:
      case ProviderErrorCode.CREDENTIALS_REVOKED:
      case ProviderErrorCode.QUOTA_EXCEEDED:
      case ProviderErrorCode.EXECUTION_FAILED:
      case ProviderErrorCode.INVALID_REQUEST:
      case ProviderErrorCode.INVALID_RESPONSE:
      case ProviderErrorCode.PROVIDER_ERROR:
      case ProviderErrorCode.VALIDATION_ERROR:
      case ProviderErrorCode.MISSING_REQUIRED_FIELD:
      case ProviderErrorCode.INVALID_FIELD_VALUE:
      case ProviderErrorCode.CREDENTIAL_NOT_FOUND:
        return ErrorDecision.FAIL;

      default:
        return ErrorDecision.FAIL;
    }
  }

  /**
   * Get retry delay in milliseconds
   * Implements exponential backoff
   */
  private getRetryDelayMs(code: ProviderErrorCode, currentRetryCount: number): number {
    // Rate limit errors use provider-provided retry-after if available
    if (code === ProviderErrorCode.RATE_LIMIT_EXCEEDED) {
      // Base delay with exponential backoff
      const baseDelay = 1000; // 1 second
      return baseDelay * Math.pow(2, currentRetryCount);
    }

    // Network errors use exponential backoff
    if (
      code === ProviderErrorCode.NETWORK_ERROR ||
      code === ProviderErrorCode.CONNECTION_REFUSED ||
      code === ProviderErrorCode.CONNECTION_TIMEOUT
    ) {
      const baseDelay = 2000; // 2 seconds
      return baseDelay * Math.pow(2, currentRetryCount);
    }

    // Timeout errors use exponential backoff
    if (code === ProviderErrorCode.EXECUTION_TIMEOUT) {
      const baseDelay = 5000; // 5 seconds
      return baseDelay * Math.pow(2, currentRetryCount);
    }

    // Provider unavailability uses exponential backoff
    if (
      code === ProviderErrorCode.PROVIDER_UNAVAILABLE ||
      code === ProviderErrorCode.PROVIDER_MAINTENANCE
    ) {
      const baseDelay = 10000; // 10 seconds
      return baseDelay * Math.pow(2, currentRetryCount);
    }

    // Default retry delay
    return 1000 * Math.pow(2, currentRetryCount);
  }

  /**
   * Normalize provider error to canonical format
   * This ensures all errors follow the canonical error contract
   */
  normalizeError(
    error: unknown,
    tenantId: string,
    executionId: string,
    taskId: string,
    provider: string,
    operation: string
  ): ProviderError {
    // If error is already a ProviderError, return it
    if (error instanceof ProviderError) {
      return error;
    }

    // If error is a standard Error, convert to ProviderError
    if (error instanceof Error) {
      return new ProviderError(
        ProviderErrorCode.PROVIDER_ERROR,
        error.message,
        tenantId,
        executionId,
        taskId,
        provider,
        operation,
        { originalError: error.name }
      );
    }

    // If error is a string, convert to ProviderError
    if (typeof error === 'string') {
      return new ProviderError(
        ProviderErrorCode.PROVIDER_ERROR,
        error,
        tenantId,
        executionId,
        taskId,
        provider,
        operation
      );
    }

    // If error is an object, convert to ProviderError
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      return new ProviderError(
        ProviderErrorCode.PROVIDER_ERROR,
        errorObj.message?.toString() || 'Unknown provider error',
        tenantId,
        executionId,
        taskId,
        provider,
        operation,
        errorObj
      );
    }

    // Default case
    return new ProviderError(
      ProviderErrorCode.PROVIDER_ERROR,
      'Unknown provider error',
      tenantId,
      executionId,
      taskId,
      provider,
      operation
    );
  }

  /**
   * Determine if error is retryable
   */
  isRetryable(error: ProviderError): boolean {
    return error.retryable;
  }

  /**
   * Determine if error is critical
   */
  isCritical(error: ProviderError): boolean {
    return error.severity === 'critical';
  }

  /**
   * Determine if error is tenant isolation violation
   */
  isTenantIsolationViolation(error: ProviderError): boolean {
    return (
      error.code === ProviderErrorCode.TENANT_ISOLATION_VIOLATION ||
      error.code === ProviderErrorCode.CROSS_TENANT_ACCESS
    );
  }

  /**
   * Determine if error is credential error
   */
  isCredentialError(error: ProviderError): boolean {
    return (
      error.code === ProviderErrorCode.AUTHENTICATION_FAILED ||
      error.code === ProviderErrorCode.INVALID_CREDENTIALS ||
      error.code === ProviderErrorCode.CREDENTIALS_EXPIRED ||
      error.code === ProviderErrorCode.CREDENTIALS_REVOKED ||
      error.code === ProviderErrorCode.CREDENTIAL_INJECTION_FAILED ||
      error.code === ProviderErrorCode.CREDENTIAL_NOT_FOUND ||
      error.code === ProviderErrorCode.CREDENTIAL_DECRYPTION_FAILED
    );
  }

  /**
   * Determine if error is rate limit error
   */
  isRateLimitError(error: ProviderError): boolean {
    return error.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED;
  }

  /**
   * Determine if error is quota error
   */
  isQuotaError(error: ProviderError): boolean {
    return error.code === ProviderErrorCode.QUOTA_EXCEEDED;
  }
}

/**
 * Singleton instance of ErrorAuthority
 * CRITICAL: There is only ONE error authority in CLAUX
 */
export const errorAuthority = new ErrorAuthority();

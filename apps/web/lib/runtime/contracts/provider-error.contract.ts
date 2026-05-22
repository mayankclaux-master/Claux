/**
 * Canonical Provider Error Contract
 * 
 * This contract defines the standardized error format for all provider errors.
 * All runtime connectors MUST throw errors in this format.
 * 
 * CRITICAL: This is the ONLY error format allowed to flow from connectors to RuntimeService.
 */

import type { UUID } from '../types/common.types';

/**
 * Provider error codes
 * Canonical error codes for all provider errors
 */
export enum ProviderErrorCode {
  // Authentication errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  CREDENTIALS_EXPIRED = 'CREDENTIALS_EXPIRED',
  CREDENTIALS_REVOKED = 'CREDENTIALS_REVOKED',
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Execution errors
  EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  
  // Provider errors
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  PROVIDER_MAINTENANCE = 'PROVIDER_MAINTENANCE',
  
  // Tenant isolation errors
  TENANT_ISOLATION_VIOLATION = 'TENANT_ISOLATION_VIOLATION',
  CROSS_TENANT_ACCESS = 'CROSS_TENANT_ACCESS',
  
  // Credential injection errors
  CREDENTIAL_INJECTION_FAILED = 'CREDENTIAL_INJECTION_FAILED',
  CREDENTIAL_NOT_FOUND = 'CREDENTIAL_NOT_FOUND',
  CREDENTIAL_DECRYPTION_FAILED = 'CREDENTIAL_DECRYPTION_FAILED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
}

/**
 * Provider error severity
 */
export enum ProviderErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Canonical provider error
 * All connectors MUST throw errors in this format
 */
export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly severity: ProviderErrorSeverity;
  readonly retryable: boolean;
  readonly tenantId: UUID;
  readonly executionId: UUID;
  readonly taskId: UUID;
  readonly provider: string;
  readonly operation: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;

  constructor(
    code: ProviderErrorCode,
    message: string,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    provider: string,
    operation: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.severity = this.determineSeverity(code);
    this.retryable = this.determineRetryability(code);
    this.tenantId = tenantId;
    this.executionId = executionId;
    this.taskId = taskId;
    this.provider = provider;
    this.operation = operation;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  private determineSeverity(code: ProviderErrorCode): ProviderErrorSeverity {
    switch (code) {
      case ProviderErrorCode.TENANT_ISOLATION_VIOLATION:
      case ProviderErrorCode.CROSS_TENANT_ACCESS:
      case ProviderErrorCode.CREDENTIAL_INJECTION_FAILED:
      case ProviderErrorCode.CREDENTIAL_DECRYPTION_FAILED:
        return ProviderErrorSeverity.CRITICAL;
      case ProviderErrorCode.AUTHENTICATION_FAILED:
      case ProviderErrorCode.INVALID_CREDENTIALS:
      case ProviderErrorCode.CREDENTIALS_REVOKED:
      case ProviderErrorCode.QUOTA_EXCEEDED:
        return ProviderErrorSeverity.HIGH;
      case ProviderErrorCode.RATE_LIMIT_EXCEEDED:
      case ProviderErrorCode.EXECUTION_TIMEOUT:
      case ProviderErrorCode.PROVIDER_UNAVAILABLE:
        return ProviderErrorSeverity.MEDIUM;
      default:
        return ProviderErrorSeverity.LOW;
    }
  }

  private determineRetryability(code: ProviderErrorCode): boolean {
    switch (code) {
      case ProviderErrorCode.RATE_LIMIT_EXCEEDED:
      case ProviderErrorCode.EXECUTION_TIMEOUT:
      case ProviderErrorCode.NETWORK_ERROR:
      case ProviderErrorCode.CONNECTION_REFUSED:
      case ProviderErrorCode.CONNECTION_TIMEOUT:
      case ProviderErrorCode.PROVIDER_UNAVAILABLE:
      case ProviderErrorCode.PROVIDER_MAINTENANCE:
        return true;
      default:
        return false;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      retryable: this.retryable,
      tenantId: this.tenantId,
      executionId: this.executionId,
      taskId: this.taskId,
      provider: this.provider,
      operation: this.operation,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends ProviderError {
  constructor(
    message: string,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    provider: string,
    operation: string,
    details?: Record<string, unknown>
  ) {
    super(
      ProviderErrorCode.AUTHENTICATION_FAILED,
      message,
      tenantId,
      executionId,
      taskId,
      provider,
      operation,
      details
    );
    this.name = 'AuthenticationError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends ProviderError {
  readonly retryAfter?: number;

  constructor(
    message: string,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    provider: string,
    operation: string,
    retryAfter?: number,
    details?: Record<string, unknown>
  ) {
    super(
      ProviderErrorCode.RATE_LIMIT_EXCEEDED,
      message,
      tenantId,
      executionId,
      taskId,
      provider,
      operation,
      details
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Tenant isolation violation error
 */
export class TenantIsolationViolationError extends ProviderError {
  constructor(
    message: string,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    provider: string,
    operation: string,
    details?: Record<string, unknown>
  ) {
    super(
      ProviderErrorCode.TENANT_ISOLATION_VIOLATION,
      message,
      tenantId,
      executionId,
      taskId,
      provider,
      operation,
      details
    );
    this.name = 'TenantIsolationViolationError';
  }
}

/**
 * Credential injection error
 */
export class CredentialInjectionError extends ProviderError {
  constructor(
    message: string,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    provider: string,
    operation: string,
    details?: Record<string, unknown>
  ) {
    super(
      ProviderErrorCode.CREDENTIAL_INJECTION_FAILED,
      message,
      tenantId,
      executionId,
      taskId,
      provider,
      operation,
      details
    );
    this.name = 'CredentialInjectionError';
  }
}

/**
 * Execution timeout error
 */
export class ExecutionTimeoutError extends ProviderError {
  constructor(
    message: string,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    provider: string,
    operation: string,
    details?: Record<string, unknown>
  ) {
    super(
      ProviderErrorCode.EXECUTION_TIMEOUT,
      message,
      tenantId,
      executionId,
      taskId,
      provider,
      operation,
      details
    );
    this.name = 'ExecutionTimeoutError';
  }
}

/**
 * Network error
 */
export class NetworkError extends ProviderError {
  constructor(
    message: string,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    provider: string,
    operation: string,
    details?: Record<string, unknown>
  ) {
    super(
      ProviderErrorCode.NETWORK_ERROR,
      message,
      tenantId,
      executionId,
      taskId,
      provider,
      operation,
      details
    );
    this.name = 'NetworkError';
  }
}

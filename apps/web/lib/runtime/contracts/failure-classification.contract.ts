/**
 * Canonical Runtime Failure Classification Contract
 * 
 * This contract defines the standardized failure classification system for CLAUX.
 * All runtime failures MUST be classified using this system.
 * 
 * CRITICAL: This is the ONLY failure classification system allowed in CLAUX.
 */

import type { UUID } from '../types/common.types';

/**
 * Canonical failure classification types
 */
export enum FailureClassification {
  // Provider failures
  PROVIDER_FAILURE = 'provider_failure',
  
  // Connector failures
  CONNECTOR_FAILURE = 'connector_failure',
  
  // Orchestration failures
  ORCHESTRATION_FAILURE = 'orchestration_failure',
  
  // Credential failures
  CREDENTIAL_FAILURE = 'credential_failure',
  
  // Runtime failures
  RUNTIME_FAILURE = 'runtime_failure',
  
  // Validation failures
  VALIDATION_FAILURE = 'validation_failure',
}

/**
 * Failure severity levels
 */
export enum FailureSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Failure status
 */
export enum FailureStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  MITIGATED = 'mitigated',
  ESCALATED = 'escalated',
}

/**
 * Canonical failure metadata
 */
export interface FailureMetadata {
  readonly classification: FailureClassification;
  readonly severity: FailureSeverity;
  readonly status: FailureStatus;
  readonly tenantId: UUID;
  readonly executionId: UUID | null;
  readonly taskId: UUID | null;
  readonly agent?: string;
  readonly provider?: string;
  readonly connector?: string;
  readonly errorCode?: string;
  readonly errorMessage: string;
  readonly errorDetails?: Record<string, unknown>;
  readonly timestamp: string;
  readonly resolvedAt?: string;
  readonly resolution?: string;
  readonly retryable: boolean;
  readonly retryCount?: number;
  readonly context?: Record<string, unknown>;
}

/**
 * Failure insert interface
 */
export interface FailureInsert {
  readonly tenant_id: UUID;
  readonly execution_id?: UUID | null;
  readonly task_id?: UUID | null;
  readonly classification: FailureClassification;
  readonly severity: FailureSeverity;
  readonly status: FailureStatus;
  readonly error_code?: string;
  readonly error_message: string;
  readonly error_details?: Record<string, unknown>;
  readonly agent?: string;
  readonly provider?: string;
  readonly connector?: string;
  readonly retryable: boolean;
  readonly retry_count?: number;
  readonly context?: Record<string, unknown>;
}

/**
 * Canonical runtime failure
 */
export class RuntimeFailure {
  readonly classification: FailureClassification;
  readonly severity: FailureSeverity;
  readonly status: FailureStatus;
  readonly tenantId: UUID;
  readonly executionId: UUID | null;
  readonly taskId: UUID | null;
  readonly agent?: string;
  readonly provider?: string;
  readonly connector?: string;
  readonly errorCode?: string;
  readonly errorMessage: string;
  readonly errorDetails?: Record<string, unknown>;
  readonly timestamp: string;
  readonly resolvedAt?: string;
  readonly resolution?: string;
  readonly retryable: boolean;
  readonly retryCount?: number;
  readonly context?: Record<string, unknown>;

  constructor(metadata: FailureMetadata) {
    this.classification = metadata.classification;
    this.severity = metadata.severity;
    this.status = metadata.status;
    this.tenantId = metadata.tenantId;
    this.executionId = metadata.executionId;
    this.taskId = metadata.taskId;
    this.agent = metadata.agent;
    this.provider = metadata.provider;
    this.connector = metadata.connector;
    this.errorCode = metadata.errorCode;
    this.errorMessage = metadata.errorMessage;
    this.errorDetails = metadata.errorDetails;
    this.timestamp = metadata.timestamp;
    this.resolvedAt = metadata.resolvedAt;
    this.resolution = metadata.resolution;
    this.retryable = metadata.retryable;
    this.retryCount = metadata.retryCount;
    this.context = metadata.context;
  }

  /**
   * Convert to database insert format
   */
  toInsert(): FailureInsert {
    return {
      tenant_id: this.tenantId,
      execution_id: this.executionId,
      task_id: this.taskId,
      classification: this.classification,
      severity: this.severity,
      status: this.status,
      error_code: this.errorCode,
      error_message: this.errorMessage,
      error_details: this.errorDetails,
      agent: this.agent,
      provider: this.provider,
      connector: this.connector,
      retryable: this.retryable,
      retry_count: this.retryCount,
      context: this.context,
    };
  }

  /**
   * Mark as resolved
   */
  resolve(resolution: string): RuntimeFailure {
    return new RuntimeFailure({
      ...this,
      status: FailureStatus.RESOLVED,
      resolvedAt: new Date().toISOString(),
      resolution,
    });
  }

  /**
   * Mark as mitigated
   */
  mitigate(resolution: string): RuntimeFailure {
    return new RuntimeFailure({
      ...this,
      status: FailureStatus.MITIGATED,
      resolvedAt: new Date().toISOString(),
      resolution,
    });
  }

  /**
   * Mark as escalated
   */
  escalate(resolution: string): RuntimeFailure {
    return new RuntimeFailure({
      ...this,
      status: FailureStatus.ESCALATED,
      resolvedAt: new Date().toISOString(),
      resolution,
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      classification: this.classification,
      severity: this.severity,
      status: this.status,
      tenantId: this.tenantId,
      executionId: this.executionId,
      taskId: this.taskId,
      agent: this.agent,
      provider: this.provider,
      connector: this.connector,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      errorDetails: this.errorDetails,
      timestamp: this.timestamp,
      resolvedAt: this.resolvedAt,
      resolution: this.resolution,
      retryable: this.retryable,
      retryCount: this.retryCount,
      context: this.context,
    };
  }
}

/**
 * Failure classification helper
 */
export class FailureClassifier {
  /**
   * Classify a provider error as a runtime failure
   */
  static classifyProviderError(
    tenantId: UUID,
    executionId: UUID | null,
    taskId: UUID | null,
    provider: string,
    errorCode: string,
    errorMessage: string,
    agent?: string,
    errorDetails?: Record<string, unknown>
  ): RuntimeFailure {
    return new RuntimeFailure({
      classification: FailureClassification.PROVIDER_FAILURE,
      severity: FailureClassifier.determineSeverity(errorCode),
      status: FailureStatus.ACTIVE,
      tenantId,
      executionId,
      taskId,
      agent,
      provider,
      errorCode,
      errorMessage,
      errorDetails,
      timestamp: new Date().toISOString(),
      retryable: FailureClassifier.isRetryable(errorCode),
    });
  }

  /**
   * Classify a connector error as a runtime failure
   */
  static classifyConnectorError(
    tenantId: UUID,
    executionId: UUID | null,
    taskId: UUID | null,
    connector: string,
    errorCode: string,
    errorMessage: string,
    agent?: string,
    errorDetails?: Record<string, unknown>
  ): RuntimeFailure {
    return new RuntimeFailure({
      classification: FailureClassification.CONNECTOR_FAILURE,
      severity: FailureClassifier.determineSeverity(errorCode),
      status: FailureStatus.ACTIVE,
      tenantId,
      executionId,
      taskId,
      agent,
      connector,
      errorCode,
      errorMessage,
      errorDetails,
      timestamp: new Date().toISOString(),
      retryable: FailureClassifier.isRetryable(errorCode),
    });
  }

  /**
   * Classify an orchestration error as a runtime failure
   */
  static classifyOrchestrationError(
    tenantId: UUID,
    executionId: UUID | null,
    taskId: UUID | null,
    errorCode: string,
    errorMessage: string,
    agent?: string,
    errorDetails?: Record<string, unknown>
  ): RuntimeFailure {
    return new RuntimeFailure({
      classification: FailureClassification.ORCHESTRATION_FAILURE,
      severity: FailureClassifier.determineSeverity(errorCode),
      status: FailureStatus.ACTIVE,
      tenantId,
      executionId,
      taskId,
      agent,
      errorCode,
      errorMessage,
      errorDetails,
      timestamp: new Date().toISOString(),
      retryable: false,
    });
  }

  /**
   * Classify a credential error as a runtime failure
   */
  static classifyCredentialError(
    tenantId: UUID,
    executionId: UUID | null,
    taskId: UUID | null,
    errorCode: string,
    errorMessage: string,
    agent?: string,
    provider?: string,
    errorDetails?: Record<string, unknown>
  ): RuntimeFailure {
    return new RuntimeFailure({
      classification: FailureClassification.CREDENTIAL_FAILURE,
      severity: FailureSeverity.CRITICAL,
      status: FailureStatus.ACTIVE,
      tenantId,
      executionId,
      taskId,
      agent,
      provider,
      errorCode,
      errorMessage,
      errorDetails,
      timestamp: new Date().toISOString(),
      retryable: false,
    });
  }

  /**
   * Classify a runtime error as a runtime failure
   */
  static classifyRuntimeError(
    tenantId: UUID,
    executionId: UUID | null,
    taskId: UUID | null,
    errorCode: string,
    errorMessage: string,
    agent?: string,
    errorDetails?: Record<string, unknown>
  ): RuntimeFailure {
    return new RuntimeFailure({
      classification: FailureClassification.RUNTIME_FAILURE,
      severity: FailureClassifier.determineSeverity(errorCode),
      status: FailureStatus.ACTIVE,
      tenantId,
      executionId,
      taskId,
      agent,
      errorCode,
      errorMessage,
      errorDetails,
      timestamp: new Date().toISOString(),
      retryable: false,
    });
  }

  /**
   * Classify a validation error as a runtime failure
   */
  static classifyValidationError(
    tenantId: UUID,
    executionId: UUID | null,
    taskId: UUID | null,
    errorCode: string,
    errorMessage: string,
    agent?: string,
    errorDetails?: Record<string, unknown>
  ): RuntimeFailure {
    return new RuntimeFailure({
      classification: FailureClassification.VALIDATION_FAILURE,
      severity: FailureSeverity.MEDIUM,
      status: FailureStatus.ACTIVE,
      tenantId,
      executionId,
      taskId,
      agent,
      errorCode,
      errorMessage,
      errorDetails,
      timestamp: new Date().toISOString(),
      retryable: false,
    });
  }

  /**
   * Determine severity from error code
   */
  private static determineSeverity(errorCode: string): FailureSeverity {
    if (errorCode.includes('CRITICAL') || errorCode.includes('VIOLATION') || errorCode.includes('SECURITY')) {
      return FailureSeverity.CRITICAL;
    }
    if (errorCode.includes('FAILED') || errorCode.includes('ERROR') || errorCode.includes('TIMEOUT')) {
      return FailureSeverity.HIGH;
    }
    if (errorCode.includes('WARN') || errorCode.includes('RETRY')) {
      return FailureSeverity.MEDIUM;
    }
    return FailureSeverity.LOW;
  }

  /**
   * Determine if error is retryable
   */
  private static isRetryable(errorCode: string): boolean {
    return errorCode.includes('TIMEOUT') || 
           errorCode.includes('NETWORK') || 
           errorCode.includes('RATE_LIMIT') || 
           errorCode.includes('RETRY');
  }
}

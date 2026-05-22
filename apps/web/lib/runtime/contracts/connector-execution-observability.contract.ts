/**
 * Canonical Connector Execution Observability Contract
 * 
 * This contract defines the standardized connector execution observability for CLAUX.
 * All connector execution tracking MUST follow this contract.
 * 
 * CRITICAL: This is the ONLY connector execution observability system allowed in CLAUX.
 */

import type { UUID } from '../types/common.types';

/**
 * Connector execution status
 */
export enum ConnectorExecutionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

/**
 * Connector request metadata
 */
export interface ConnectorRequestMetadata {
  readonly requestId: UUID;
  readonly connector: string;
  readonly provider: string;
  readonly operation: string;
  readonly tenantId: UUID;
  readonly executionId: UUID | null;
  readonly taskId: UUID | null;
  readonly agent?: string;
  readonly requestPayload: Record<string, unknown>;
  readonly requestHeaders?: Record<string, string>;
  readonly requestTimestamp: string;
  readonly estimatedDurationMs?: number;
}

/**
 * Connector response metadata
 */
export interface ConnectorResponseMetadata {
  readonly requestId: UUID;
  readonly connector: string;
  readonly provider: string;
  readonly operation: string;
  readonly tenantId: UUID;
  readonly executionId: UUID | null;
  readonly taskId: UUID | null;
  readonly agent?: string;
  readonly status: ConnectorExecutionStatus;
  readonly responsePayload?: Record<string, unknown>;
  readonly responseHeaders?: Record<string, string>;
  readonly responseTimestamp: string;
  readonly durationMs: number;
  readonly errorMessage?: string;
  readonly errorCode?: string;
  readonly retryCount?: number;
}

/**
 * Connector execution metadata
 */
export interface ConnectorExecutionMetadata {
  readonly requestId: UUID;
  readonly connector: string;
  readonly provider: string;
  readonly operation: string;
  readonly tenantId: UUID;
  readonly executionId: UUID | null;
  readonly taskId: UUID | null;
  readonly agent?: string;
  readonly status: ConnectorExecutionStatus;
  readonly requestTimestamp: string;
  readonly responseTimestamp?: string;
  readonly durationMs?: number;
  readonly errorMessage?: string;
  readonly errorCode?: string;
  readonly retryCount?: number;
  readonly requestPayload?: Record<string, unknown>;
  readonly responsePayload?: Record<string, unknown>;
  readonly requestHeaders?: Record<string, string>;
  readonly responseHeaders?: Record<string, string>;
  readonly rateLimitInfo?: {
    readonly remaining: number;
    readonly resetAt: string;
  };
  readonly quotaInfo?: {
    readonly used: number;
    readonly limit: number;
  };
  readonly costInfo?: {
    readonly currency: string;
    readonly amount: number;
  };
  readonly tokenInfo?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

/**
 * Connector execution insert interface
 */
export interface ConnectorExecutionInsert {
  readonly tenant_id: UUID;
  readonly execution_id?: UUID | null;
  readonly task_id?: UUID | null;
  readonly connector: string;
  readonly provider: string;
  readonly operation: string;
  readonly status: ConnectorExecutionStatus;
  readonly request_timestamp: string;
  readonly response_timestamp?: string;
  readonly duration_ms?: number;
  readonly error_message?: string;
  readonly error_code?: string;
  readonly retry_count?: number;
  readonly request_payload?: Record<string, unknown>;
  readonly response_payload?: Record<string, unknown>;
  readonly request_headers?: Record<string, string>;
  readonly response_headers?: Record<string, string>;
  readonly rate_limit_info?: Record<string, unknown>;
  readonly quota_info?: Record<string, unknown>;
  readonly cost_info?: Record<string, unknown>;
  readonly token_info?: Record<string, unknown>;
  readonly agent?: string;
}

/**
 * Canonical connector execution observability contract
 */
export class ConnectorExecutionObservability {
  /**
   * Track connector request
   */
  static trackRequest(metadata: ConnectorRequestMetadata): void {
    // This is a placeholder for request tracking
    // In production, this would persist the request metadata
    console.log(`Connector request tracked: ${metadata.connector} - ${metadata.operation}`);
  }

  /**
   * Track connector response
   */
  static trackResponse(metadata: ConnectorResponseMetadata): void {
    // This is a placeholder for response tracking
    // In production, this would persist the response metadata
    console.log(`Connector response tracked: ${metadata.connector} - ${metadata.operation} - ${metadata.status}`);
  }

  /**
   * Create connector execution metadata
   */
  static createExecutionMetadata(
    requestMetadata: ConnectorRequestMetadata,
    responseMetadata?: ConnectorResponseMetadata
  ): ConnectorExecutionMetadata {
    const durationMs = responseMetadata
      ? responseMetadata.durationMs
      : undefined;

    return {
      requestId: requestMetadata.requestId,
      connector: requestMetadata.connector,
      provider: requestMetadata.provider,
      operation: requestMetadata.operation,
      tenantId: requestMetadata.tenantId,
      executionId: requestMetadata.executionId,
      taskId: requestMetadata.taskId,
      agent: requestMetadata.agent,
      status: responseMetadata?.status || ConnectorExecutionStatus.IN_PROGRESS,
      requestTimestamp: requestMetadata.requestTimestamp,
      responseTimestamp: responseMetadata?.responseTimestamp,
      durationMs,
      errorMessage: responseMetadata?.errorMessage,
      errorCode: responseMetadata?.errorCode,
      retryCount: responseMetadata?.retryCount,
      requestPayload: requestMetadata.requestPayload,
      responsePayload: responseMetadata?.responsePayload,
      requestHeaders: requestMetadata.requestHeaders,
      responseHeaders: responseMetadata?.responseHeaders,
    };
  }

  /**
   * Convert to database insert format
   */
  static toInsert(metadata: ConnectorExecutionMetadata): ConnectorExecutionInsert {
    return {
      tenant_id: metadata.tenantId,
      execution_id: metadata.executionId,
      task_id: metadata.taskId,
      connector: metadata.connector,
      provider: metadata.provider,
      operation: metadata.operation,
      status: metadata.status,
      request_timestamp: metadata.requestTimestamp,
      response_timestamp: metadata.responseTimestamp,
      duration_ms: metadata.durationMs,
      error_message: metadata.errorMessage,
      error_code: metadata.errorCode,
      retry_count: metadata.retryCount,
      request_payload: metadata.requestPayload,
      response_payload: metadata.responsePayload,
      request_headers: metadata.requestHeaders,
      response_headers: metadata.responseHeaders,
      rate_limit_info: metadata.rateLimitInfo,
      quota_info: metadata.quotaInfo,
      cost_info: metadata.costInfo,
      token_info: metadata.tokenInfo,
      agent: metadata.agent,
    };
  }

  /**
   * Calculate execution duration
   */
  static calculateDuration(requestTimestamp: string, responseTimestamp: string): number {
    const request = new Date(requestTimestamp).getTime();
    const response = new Date(responseTimestamp).getTime();
    return response - request;
  }

  /**
   * Determine execution status from error
   */
  static determineStatus(error?: Error): ConnectorExecutionStatus {
    if (!error) return ConnectorExecutionStatus.COMPLETED;
    
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('timeout')) return ConnectorExecutionStatus.TIMEOUT;
    return ConnectorExecutionStatus.FAILED;
  }
}

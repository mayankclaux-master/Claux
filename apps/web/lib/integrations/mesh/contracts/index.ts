/**
 * Integration Execution Contracts
 * 
 * Canonical contracts for:
 * - outbound integration execution
 * - webhook callbacks
 * - async completion
 * - retry semantics
 * - idempotency
 * - correlation IDs
 * - tenant isolation
 * - provider health
 * - execution receipts
 */

import { RuntimeService } from '@/lib/runtime/services/runtime.service';

export interface IntegrationRequest {
  executionId: string;
  tenantId: string;
  agentName: string;
  provider: string;
  action: string;
  payload: Record<string, unknown>;
  correlationId: string;
  replayId?: string;
  timestamp: string;
  signature?: string;
}

export interface IntegrationResponse {
  executionId: string;
  tenantId: string;
  correlationId: string;
  provider: string;
  status: 'pending' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
  timestamp: string;
  signature?: string;
}

export interface WebhookCallback {
  executionId: string;
  tenantId: string;
  correlationId: string;
  provider: string;
  payload: Record<string, unknown>;
  timestamp: string;
  signature?: string;
  replayToken?: string;
}

export interface ExecutionReceipt {
  executionId: string;
  tenantId: string;
  correlationId: string;
  provider: string;
  action: string;
  status: 'dispatched' | 'completed' | 'failed' | 'timeout';
  dispatchedAt: string;
  completedAt?: string;
  retryCount: number;
  result?: Record<string, unknown>;
  error?: string;
  providerHealth?: ProviderHealth;
}

export interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  lastSuccess: string;
  lastFailure?: string;
  consecutiveFailures: number;
  cooldownUntil?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  exponentialBackoff: boolean;
  jitterMs: number;
}

export interface IdempotencyKey {
  tenantId: string;
  action: string;
  payloadHash: string;
}

export class IntegrationContract {
  /**
   * Validate integration request
   */
  static validateRequest(request: IntegrationRequest): boolean {
    return !!(
      request.executionId &&
      request.tenantId &&
      request.agentName &&
      request.provider &&
      request.action &&
      request.correlationId
    );
  }

  /**
   * Generate correlation ID
   */
  static generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate replay ID
   */
  static generateReplayId(executionId: string): string {
    return `replay_${executionId}_${Date.now()}`;
  }

  /**
   * Generate idempotency key
   */
  static generateIdempotencyKey(key: IdempotencyKey): string {
    return `${key.tenantId}:${key.action}:${key.payloadHash}`;
  }

  /**
   * Create execution receipt
   */
  static createReceipt(request: IntegrationRequest): ExecutionReceipt {
    return {
      executionId: request.executionId,
      tenantId: request.tenantId,
      correlationId: request.correlationId,
      provider: request.provider,
      action: request.action,
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
      retryCount: 0,
    };
  }
}

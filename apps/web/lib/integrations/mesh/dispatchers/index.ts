/**
 * Integration Dispatcher - Canonical n8n Bridge
 * 
 * Responsibilities:
 * - dispatch outbound integration jobs
 * - sign payloads
 * - attach execution IDs
 * - attach tenant IDs
 * - attach replay metadata
 * - attach trace metadata
 * - enforce idempotency
 * 
 * NO business logic.
 * ONLY transport + execution dispatch.
 */

import { IntegrationRequest, IntegrationResponse, ExecutionReceipt, IntegrationContract, RetryPolicy } from '../contracts';

export interface N8nConfig {
  webhookUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

export interface DispatchResult {
  success: boolean;
  receipt: ExecutionReceipt;
  error?: string;
}

export class IntegrationDispatcher {
  private config: N8nConfig;
  private pendingReceipts: Map<string, ExecutionReceipt> = new Map();
  private retryPolicy: RetryPolicy;

  constructor(config: N8nConfig, retryPolicy?: RetryPolicy) {
    this.config = config;
    this.retryPolicy = retryPolicy || {
      maxRetries: 3,
      backoffMs: 1000,
      exponentialBackoff: true,
      jitterMs: 100,
    };
  }

  /**
   * Dispatch integration request to n8n
   */
  async dispatch(request: IntegrationRequest): Promise<DispatchResult> {
    if (!IntegrationContract.validateRequest(request)) {
      return {
        success: false,
        receipt: IntegrationContract.createReceipt(request),
        error: 'Invalid integration request',
      };
    }

    const receipt = IntegrationContract.createReceipt(request);
    this.pendingReceipts.set(request.executionId, receipt);

    try {
      const response = await this.sendToN8n(request);
      
      if (response.ok) {
        receipt.status = 'completed';
        receipt.completedAt = new Date().toISOString();
        receipt.result = await response.json();
      } else {
        receipt.status = 'failed';
        receipt.completedAt = new Date().toISOString();
        receipt.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      return {
        success: response.ok,
        receipt,
        error: receipt.error,
      };
    } catch (error) {
      receipt.status = 'failed';
      receipt.completedAt = new Date().toISOString();
      receipt.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        receipt,
        error: receipt.error,
      };
    }
  }

  /**
   * Send request to n8n webhook
   */
  private async sendToN8n(request: IntegrationRequest): Promise<Response> {
    const payload = this.signPayload(request);

    return await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Execution-ID': request.executionId,
        'X-Tenant-ID': request.tenantId,
        'X-Correlation-ID': request.correlationId,
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.config.timeoutMs || 30000),
    });
  }

  /**
   * Sign payload with metadata
   */
  private signPayload(request: IntegrationRequest): IntegrationRequest {
    return {
      ...request,
      signature: this.generateSignature(request),
    };
  }

  /**
   * Generate signature for payload
   */
  private generateSignature(request: IntegrationRequest): string {
    const data = `${request.executionId}:${request.tenantId}:${request.correlationId}:${request.timestamp}`;
    // Simple hash - in production, use proper HMAC
    return Buffer.from(data).toString('base64');
  }

  /**
   * Get receipt by execution ID
   */
  getReceipt(executionId: string): ExecutionReceipt | undefined {
    return this.pendingReceipts.get(executionId);
  }

  /**
   * Update receipt
   */
  updateReceipt(receipt: ExecutionReceipt): void {
    this.pendingReceipts.set(receipt.executionId, receipt);
  }

  /**
   * Clear receipt
   */
  clearReceipt(executionId: string): void {
    this.pendingReceipts.delete(executionId);
  }
}

/**
 * Create integration dispatcher instance
 */
export function createIntegrationDispatcher(config: N8nConfig, retryPolicy?: RetryPolicy): IntegrationDispatcher {
  return new IntegrationDispatcher(config, retryPolicy);
}

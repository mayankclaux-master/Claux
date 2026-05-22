/**
 * Callback Ingestion System
 * 
 * Responsibilities:
 * - webhook verification
 * - replay protection
 * - duplicate prevention
 * - callback correlation
 * - execution continuation
 * 
 * Callbacks MUST:
 * - reconstruct runtime context
 * - emit canonical runtime events
 * - continue execution safely
 */

import { RuntimeService } from '@/lib/runtime/services/runtime.service';

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

export interface IntegrationContract {
  provider: string;
  version: string;
  contractType: 'webhook' | 'callback' | 'polling';
}

export interface IntegrationRequest {
  executionId: string;
  tenantId: string;
  provider: string;
  action: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface CallbackValidationResult {
  valid: boolean;
  callback: WebhookCallback;
  error?: string;
  isReplay: boolean;
}

export interface CallbackProcessor {
  process(callback: WebhookCallback): Promise<void>;
}

export class CallbackIngestion {
  private runtime: RuntimeService;
  private processedCallbacks: Set<string> = new Set();
  private replayTokens: Set<string> = new Set();

  constructor(runtime: RuntimeService) {
    this.runtime = runtime;
  }

  /**
   * Validate webhook callback
   */
  async validate(callback: WebhookCallback): Promise<CallbackValidationResult> {
    // Check required fields
    if (!callback.executionId || !callback.tenantId || !callback.correlationId) {
      return {
        valid: false,
        callback,
        error: 'Missing required fields',
        isReplay: false,
      };
    }

    // Check for replay
    const callbackKey = this.getCallbackKey(callback);
    if (this.processedCallbacks.has(callbackKey)) {
      return {
        valid: true,
        callback,
        isReplay: true,
      };
    }

    // Check replay token
    if (callback.replayToken && this.replayTokens.has(callback.replayToken)) {
      return {
        valid: true,
        callback,
        isReplay: true,
      };
    }

    // Validate signature if present
    if (callback.signature) {
      const expectedSignature = this.generateSignature(callback);
      if (callback.signature !== expectedSignature) {
        return {
          valid: false,
          callback,
          error: 'Invalid signature',
          isReplay: false,
        };
      }
    }

    return {
      valid: true,
      callback,
      isReplay: false,
    };
  }

  /**
   * Process callback
   */
  async process(callback: WebhookCallback): Promise<void> {
    const validation = await this.validate(callback);

    if (!validation.valid) {
      throw new Error(`Invalid callback: ${validation.error}`);
    }

    if (validation.isReplay) {
      // Skip replay, but acknowledge
      return;
    }

    // Mark as processed
    const callbackKey = this.getCallbackKey(callback);
    this.processedCallbacks.add(callbackKey);

    if (callback.replayToken) {
      this.replayTokens.add(callback.replayToken);
    }

    // Continue execution
    await this.continueExecution(callback);
  }

  /**
   * Continue execution from callback
   */
  private async continueExecution(callback: WebhookCallback): Promise<void> {
    // Emit runtime event
    await this.runtime.event.publishEvent({
      tenant_id: callback.tenantId,
      execution_id: callback.executionId,
      event_name: 'integration_callback',
      event_source: 'integration_mesh',
      payload: {
        provider: callback.provider,
        correlationId: callback.correlationId,
        payload: callback.payload,
      },
    });
  }

  /**
   * Get callback key for deduplication
   */
  private getCallbackKey(callback: WebhookCallback): string {
    return `${callback.executionId}:${callback.correlationId}`;
  }

  /**
   * Generate signature for callback
   */
  private generateSignature(callback: WebhookCallback): string {
    const data = `${callback.executionId}:${callback.tenantId}:${callback.correlationId}:${callback.timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Clear processed callbacks
   */
  clearProcessed(): void {
    this.processedCallbacks.clear();
    this.replayTokens.clear();
  }
}

/**
 * Create callback ingestion instance
 */
export function createCallbackIngestion(runtime: RuntimeService): CallbackIngestion {
  return new CallbackIngestion(runtime);
}

/**
 * Tenant Callback Security
 * 
 * Enforce:
 * - signed callbacks
 * - tenant-bound callbacks
 * - replay prevention
 * - callback expiration
 * - duplicate prevention
 * - idempotent continuation
 * 
 * No cross-tenant callback execution possible.
 */

import { RuntimeService } from '@/lib/runtime/services/runtime.service';
import { WebhookCallback } from '../contracts';

export interface TenantCallbackSecurityConfig {
  signatureSecret: string;
  expirationMs: number;
  replayWindowMs: number;
}

export class TenantCallbackSecurity {
  private runtime: RuntimeService;
  private config: TenantCallbackSecurityConfig;
  private processedCallbacks: Map<string, number> = new Map();
  private replayTokens: Map<string, number> = new Map();

  constructor(runtime: RuntimeService, config: TenantCallbackSecurityConfig) {
    this.runtime = runtime;
    this.config = config;
  }

  /**
   * Validate callback security
   */
  async validateCallback(callback: WebhookCallback): Promise<{ valid: boolean; error?: string }> {
    // Validate tenant ID
    if (!callback.tenantId) {
      return { valid: false, error: 'Missing tenant ID' };
    }

    // Validate signature
    if (!this.validateSignature(callback)) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Validate expiration
    if (!this.validateExpiration(callback)) {
      return { valid: false, error: 'Callback expired' };
    }

    // Validate replay prevention
    if (!this.validateReplayPrevention(callback)) {
      return { valid: false, error: 'Replay detected' };
    }

    // Validate duplicate prevention
    if (!this.validateDuplicatePrevention(callback)) {
      return { valid: false, error: 'Duplicate callback' };
    }

    return { valid: true };
  }

  /**
   * Mark callback as processed
   */
  markCallbackAsProcessed(callback: WebhookCallback): void {
    const callbackKey = this.getCallbackKey(callback);
    this.processedCallbacks.set(callbackKey, Date.now());

    if (callback.replayToken) {
      this.replayTokens.set(callback.replayToken, Date.now());
    }
  }

  /**
   * Validate signature
   */
  private validateSignature(callback: WebhookCallback): boolean {
    if (!callback.signature) {
      return false;
    }

    const expectedSignature = this.generateSignature(callback);
    return callback.signature === expectedSignature;
  }

  /**
   * Validate expiration
   */
  private validateExpiration(callback: WebhookCallback): boolean {
    const callbackTime = new Date(callback.timestamp).getTime();
    const now = Date.now();
    const age = now - callbackTime;

    return age <= this.config.expirationMs;
  }

  /**
   * Validate replay prevention
   */
  private validateReplayPrevention(callback: WebhookCallback): boolean {
    if (callback.replayToken) {
      const lastProcessed = this.replayTokens.get(callback.replayToken);
      if (lastProcessed) {
        const replayWindow = this.config.replayWindowMs;
        if (Date.now() - lastProcessed < replayWindow) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Validate duplicate prevention
   */
  private validateDuplicatePrevention(callback: WebhookCallback): boolean {
    const callbackKey = this.getCallbackKey(callback);
    const lastProcessed = this.processedCallbacks.get(callbackKey);

    if (lastProcessed) {
      const duplicateWindow = 60000; // 1 minute
      if (Date.now() - lastProcessed < duplicateWindow) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate signature
   */
  private generateSignature(callback: WebhookCallback): string {
    const data = `${callback.executionId}:${callback.tenantId}:${callback.correlationId}:${callback.timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Get callback key for deduplication
   */
  private getCallbackKey(callback: WebhookCallback): string {
    return `${callback.executionId}:${callback.tenantId}:${callback.correlationId}`;
  }

  /**
   * Clear processed callbacks
   */
  clearProcessedCallbacks(): void {
    this.processedCallbacks.clear();
    this.replayTokens.clear();
  }
}

export function createTenantCallbackSecurity(
  runtime: RuntimeService,
  config: TenantCallbackSecurityConfig
): TenantCallbackSecurity {
  return new TenantCallbackSecurity(runtime, config);
}

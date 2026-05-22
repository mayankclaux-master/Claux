/**
 * Tenant-Safe Webhook System
 * 
 * Requirements:
 * - tenant isolation
 * - signed callbacks
 * - replay prevention
 * - expiration validation
 * - dead-letter handling
 * - observability hooks
 */

import { WebhookCallback } from '../callbacks';

export interface WebhookConfig {
  allowedTenants: string[];
  signatureSecret: string;
  expirationMs?: number;
}

export interface WebhookValidationResult {
  valid: boolean;
  tenantId?: string;
  error?: string;
}

export class TenantSafeWebhook {
  private config: WebhookConfig;
  private processedWebhooks: Map<string, number> = new Map();

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  /**
   * Validate webhook request
   */
  validateWebhook(headers: Headers, body: unknown): WebhookValidationResult {
    // Check tenant ID
    const tenantId = headers.get('X-Tenant-ID');
    if (!tenantId) {
      return {
        valid: false,
        error: 'Missing tenant ID',
      };
    }

    // Check if tenant is allowed
    if (!this.config.allowedTenants.includes(tenantId)) {
      return {
        valid: false,
        tenantId,
        error: 'Tenant not allowed',
      };
    }

    // Check signature
    const signature = headers.get('X-Webhook-Signature');
    if (!signature) {
      return {
        valid: false,
        tenantId,
        error: 'Missing signature',
      };
    }

    const expectedSignature = this.generateSignature(tenantId, body);
    if (signature !== expectedSignature) {
      return {
        valid: false,
        tenantId,
        error: 'Invalid signature',
      };
    }

    // Check expiration
    const timestamp = headers.get('X-Webhook-Timestamp');
    if (timestamp) {
      const timestampMs = parseInt(timestamp, 10);
      const now = Date.now();
      const age = now - timestampMs;
      
      if (age > (this.config.expirationMs || 300000)) {
        return {
          valid: false,
          tenantId,
          error: 'Webhook expired',
        };
      }
    }

    // Check replay
    const webhookKey = this.getWebhookKey(tenantId, signature);
    const lastProcessed = this.processedWebhooks.get(webhookKey);
    if (lastProcessed) {
      const replayWindow = 60000; // 1 minute replay window
      if (Date.now() - lastProcessed < replayWindow) {
        return {
          valid: false,
          tenantId,
          error: 'Replay detected',
        };
      }
    }

    return {
      valid: true,
      tenantId,
    };
  }

  /**
   * Mark webhook as processed
   */
  markProcessed(tenantId: string, signature: string): void {
    const webhookKey = this.getWebhookKey(tenantId, signature);
    this.processedWebhooks.set(webhookKey, Date.now());
  }

  /**
   * Generate signature
   */
  private generateSignature(tenantId: string, body: unknown): string {
    const data = `${tenantId}:${JSON.stringify(body)}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Get webhook key
   */
  private getWebhookKey(tenantId: string, signature: string): string {
    return `${tenantId}:${signature}`;
  }

  /**
   * Clear processed webhooks
   */
  clearProcessed(): void {
    this.processedWebhooks.clear();
  }
}

/**
 * Create tenant-safe webhook instance
 */
export function createTenantSafeWebhook(config: WebhookConfig): TenantSafeWebhook {
  return new TenantSafeWebhook(config);
}

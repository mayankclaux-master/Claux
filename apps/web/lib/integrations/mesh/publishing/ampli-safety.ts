/**
 * AMPLI Publishing Safety
 * 
 * AMPLI publishing MUST support:
 * - rollback
 * - preview
 * - approval gates
 * - duplicate prevention
 * - execution recovery
 * - partial publish recovery
 * 
 * Through integration dispatcher ONLY.
 */

import { RuntimeService } from '@/lib/runtime/services/runtime.service';

export interface PublishingSafetyConfig {
  requireApproval: boolean;
  enablePreview: boolean;
  enableRollback: boolean;
  duplicatePrevention: boolean;
  partialRecovery: boolean;
}

export interface PublishRequest {
  platform: 'wordpress' | 'shopify' | 'webflow' | 'ghost';
  contentId: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  publishType: 'immediate' | 'scheduled';
  scheduledAt?: string;
  approvalRequired?: boolean;
  previewRequested?: boolean;
  metadata?: Record<string, unknown>;
}

export class AmplitudePublishingSafety {
  private runtime: RuntimeService;
  private config: PublishingSafetyConfig;
  private pendingApprovals: Map<string, PublishRequest> = new Map();
  private publishedContent: Map<string, string> = new Map(); // contentId -> hash

  constructor(runtime: RuntimeService, config: PublishingSafetyConfig) {
    this.runtime = runtime;
    this.config = config;
  }

  /**
   * Validate publish request
   */
  async validatePublishRequest(request: PublishRequest): Promise<{ valid: boolean; error?: string }> {
    // Check approval requirement
    if (this.config.requireApproval && request.approvalRequired) {
      return { valid: false, error: 'Approval required' };
    }

    // Check duplicate prevention
    if (this.config.duplicatePrevention && this.isDuplicatePublish(request.contentId)) {
      return { valid: false, error: 'Duplicate publish detected' };
    }

    return { valid: true };
  }

  /**
   * Request approval
   */
  async requestApproval(request: PublishRequest): Promise<void> {
    this.pendingApprovals.set(request.executionId, request);

    await this.runtime.event.publishEvent({
      tenant_id: request.tenantId,
      execution_id: request.executionId,
      event_name: 'publish_approval_requested',
      event_source: 'ampli_safety',
      payload: {
        platform: request.platform,
        contentId: request.contentId,
        tenantId: request.tenantId,
      },
    });
  }

  /**
   * Approve publish
   */
  async approvePublish(executionId: string): Promise<void> {
    const request = this.pendingApprovals.get(executionId);
    if (!request) {
      throw new Error('No pending approval found');
    }

    this.pendingApprovals.delete(executionId);

    await this.runtime.event.publishEvent({
      tenant_id: request.tenantId,
      execution_id: executionId,
      event_name: 'publish_approved',
      event_source: 'ampli_safety',
      payload: {
        platform: request.platform,
        contentId: request.contentId,
        tenantId: request.tenantId,
      },
    });
  }

  /**
   * Reject publish
   */
  async rejectPublish(executionId: string, reason: string): Promise<void> {
    const request = this.pendingApprovals.get(executionId);
    if (!request) {
      throw new Error('No pending approval found');
    }

    this.pendingApprovals.delete(executionId);

    await this.runtime.event.publishEvent({
      tenant_id: request.tenantId,
      execution_id: executionId,
      event_name: 'publish_rejected',
      event_source: 'ampli_safety',
      payload: {
        platform: request.platform,
        contentId: request.contentId,
        tenantId: request.tenantId,
        reason,
      },
    });
  }

  /**
   * Execute rollback
   */
  async executeRollback(platform: string, contentId: string, rollbackToVersion: string, executionId: string, tenantId: string): Promise<void> {
    await this.runtime.event.publishEvent({
      tenant_id: tenantId,
      execution_id: executionId,
      event_name: 'publish_rollback',
      event_source: 'ampli_safety',
      payload: {
        platform,
        contentId,
        rollbackToVersion,
        tenantId,
      },
    });
  }

  /**
   * Execute partial recovery
   */
  async executePartialRecovery(platform: string, contentId: string, executionId: string, tenantId: string): Promise<void> {
    await this.runtime.event.publishEvent({
      tenant_id: tenantId,
      execution_id: executionId,
      event_name: 'partial_publish_recovery',
      event_source: 'ampli_safety',
      payload: {
        platform,
        contentId,
        tenantId,
      },
    });
  }

  /**
   * Check if duplicate publish
   */
  private isDuplicatePublish(contentId: string): boolean {
    return this.publishedContent.has(contentId);
  }

  /**
   * Mark content as published
   */
  markContentAsPublished(contentId: string, hash: string): void {
    this.publishedContent.set(contentId, hash);
  }

  /**
   * Clear published content
   */
  clearPublishedContent(contentId: string): void {
    this.publishedContent.delete(contentId);
  }
}

export function createAmplitudePublishingSafety(
  runtime: RuntimeService,
  config: PublishingSafetyConfig
): AmplitudePublishingSafety {
  return new AmplitudePublishingSafety(runtime, config);
}

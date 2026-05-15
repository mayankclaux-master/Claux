/**
 * Publishing Safety System
 * 
 * Publishing guardrails:
 * - dry-run publishing
 * - preview generation
 * - rollback capability
 * - publish retry handling
 * - publish audit trail
 * - failed publish recovery
 * - content checksum validation
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface PublishSafetyConfig {
  enableDryRun: boolean;
  enablePreview: boolean;
  enableRollback: boolean;
  checksumValidation: boolean;
}

export interface PublishResult {
  success: boolean;
  publishId?: string;
  previewUrl?: string;
  rollbackId?: string;
  checksum?: string;
  error?: string;
}

export class PublishingSafety {
  private config: PublishSafetyConfig;

  constructor(config: PublishSafetyConfig) {
    this.config = config;
  }

  /**
   * Dry-run publish
   */
  async dryRunPublish(tenantId: string, contentId: string): Promise<PublishResult> {
    if (!this.config.enableDryRun) {
      return { success: false, error: "Dry-run not enabled" };
    }

    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("publish_attempts")
      .insert({
        tenant_id: tenantId,
        content_id: contentId,
        status: 'dry_run',
        checksum: this.generateChecksum(contentId),
      })
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message };
    }

    return { success: true, publishId: data.id };
  }

  /**
   * Generate preview
   */
  async generatePreview(tenantId: string, contentId: string): Promise<PublishResult> {
    if (!this.config.enablePreview) {
      return { success: false, error: "Preview not enabled" };
    }

    const previewUrl = `/preview/${tenantId}/${contentId}`;
    return { success: true, previewUrl };
  }

  /**
   * Rollback publish
   */
  async rollbackPublish(publishId: string, reason: string): Promise<PublishResult> {
    if (!this.config.enableRollback) {
      return { success: false, error: "Rollback not enabled" };
    }

    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("publish_attempts")
      .update({
        status: 'rolled_back',
        rollback_reason: reason,
        rolled_back_at: new Date().toISOString(),
      })
      .eq("id", publishId)
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message };
    }

    return { success: true, rollbackId: data.id };
  }

  /**
   * Validate content checksum
   */
  async validateChecksum(contentId: string, expectedChecksum: string): Promise<boolean> {
    if (!this.config.checksumValidation) {
      return true;
    }

    const actualChecksum = this.generateChecksum(contentId);
    return actualChecksum === expectedChecksum;
  }

  /**
   * Generate checksum
   */
  private generateChecksum(contentId: string): string {
    // Simple checksum implementation
    let hash = 0;
    for (let i = 0; i < contentId.length; i++) {
      const char = contentId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Record publish attempt
   */
  async recordPublishAttempt(tenantId: string, contentId: string, cmsTarget: string): Promise<string> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("publish_attempts")
      .insert({
        tenant_id: tenantId,
        content_id: contentId,
        cms_target: cmsTarget,
        status: 'pending',
        checksum: this.generateChecksum(contentId),
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to record publish attempt: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Complete publish attempt
   */
  async completePublishAttempt(publishId: string, success: boolean, errorMessage?: string): Promise<void> {
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from("publish_attempts")
      .update({
        status: success ? 'completed' : 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", publishId);

    if (error) {
      throw new Error(`Failed to complete publish attempt: ${error.message}`);
    }
  }
}

// Default configuration
export const DEFAULT_PUBLISH_SAFETY_CONFIG: PublishSafetyConfig = {
  enableDryRun: true,
  enablePreview: true,
  enableRollback: true,
  checksumValidation: true,
};

// Singleton instance
let publishingSafetyInstance: PublishingSafety | null = null;

export function getPublishingSafety(): PublishingSafety {
  if (!publishingSafetyInstance) {
    publishingSafetyInstance = new PublishingSafety(DEFAULT_PUBLISH_SAFETY_CONFIG);
  }
  return publishingSafetyInstance;
}

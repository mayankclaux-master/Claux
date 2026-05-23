/**
 * Reconnect Required System
 * 
 * Canonical reconnect required system for CLAUX V1.
 * If token revoked, refresh expired, OAuth invalid, or scopes missing: mark connector unhealthy, generate command centre task, show reconnect warning in dashboard, preserve execution history.
 * NO silent failures.
 * 
 * CRITICAL: This is the ONLY reconnect required system in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { TaskGenerationService } from '../command-center/task-generation.service';

/**
 * Reconnect required state
 */
export interface ReconnectRequiredState {
  tenantId: UUID;
  provider: string;
  reason: string;
  requiresReconnect: boolean;
  detectedAt: string;
}

/**
 * Reconnect required service
 */
export class ReconnectRequiredService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Mark connector as requiring reconnect
   */
  async markReconnectRequired(
    tenantId: UUID,
    provider: string,
    reason: string,
    token: string
  ): Promise<void> {
    this.logger.warn('Marking connector as requiring reconnect', { tenantId, provider, reason });

    const supabase = createClerkSupabaseClient(token);

    // Store reconnect state
    const { error } = await supabase
      .from('connector_reconnect_states')
      .upsert({
        tenant_id: tenantId,
        provider,
        requires_reconnect: true,
        reason,
        detected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,provider',
      });

    if (error) {
      this.logger.error('Failed to mark reconnect required', { error, tenantId, provider });
      throw new Error(`Failed to mark reconnect required: ${error.message}`);
    }

    // Generate Command Centre task
    await this.generateReconnectTask(tenantId, provider, reason, token);

    this.logger.info('Connector marked as requiring reconnect', { tenantId, provider });
  }

  /**
   * Clear reconnect required state
   */
  async clearReconnectRequired(tenantId: UUID, provider: string, token: string): Promise<void> {
    this.logger.info('Clearing reconnect required state', { tenantId, provider });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('connector_reconnect_states')
      .update({
        requires_reconnect: false,
        reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('provider', provider);

    if (error) {
      this.logger.error('Failed to clear reconnect required', { error, tenantId, provider });
      throw new Error(`Failed to clear reconnect required: ${error.message}`);
    }

    this.logger.info('Reconnect required state cleared', { tenantId, provider });
  }

  /**
   * Check if reconnect is required
   */
  async isReconnectRequired(tenantId: UUID, provider: string, token: string): Promise<boolean> {
    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('connector_reconnect_states')
      .select('requires_reconnect')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to check reconnect required', { error, tenantId, provider });
      return false;
    }

    return (data as { requires_reconnect: boolean })?.requires_reconnect || false;
  }

  /**
   * Get reconnect required state
   */
  async getReconnectState(tenantId: UUID, provider: string, token: string): Promise<ReconnectRequiredState | null> {
    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('connector_reconnect_states')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to get reconnect state', { error, tenantId, provider });
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      tenantId: data.tenant_id,
      provider: data.provider,
      reason: data.reason as string,
      requiresReconnect: data.requires_reconnect,
      detectedAt: data.detected_at,
    };
  }

  /**
   * Get all reconnect states for tenant
   */
  async getTenantReconnectStates(tenantId: UUID, token: string): Promise<ReconnectRequiredState[]> {
    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('connector_reconnect_states')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('requires_reconnect', true);

    if (error) {
      this.logger.error('Failed to get tenant reconnect states', { error, tenantId });
      return [];
    }

    return (data || []).map((d: unknown) => ({
      tenantId: (d as { tenant_id: UUID }).tenant_id,
      provider: (d as { provider: string }).provider,
      reason: (d as { reason: string | null }).reason || 'Unknown',
      requiresReconnect: (d as { requires_reconnect: boolean }).requires_reconnect,
      detectedAt: (d as { detected_at: string }).detected_at,
    }));
  }

  /**
   * Generate reconnect task
   */
  private async generateReconnectTask(
    tenantId: UUID,
    provider: string,
    reason: string,
    token: string
  ): Promise<void> {
    this.logger.info('Generating reconnect task', { tenantId, provider, reason });

    const taskGenerationService = new TaskGenerationService();

    const providerNames: Record<string, string> = {
      'google_analytics': 'Google Analytics',
      'google_search_console': 'Google Search Console',
      'google_business_profile': 'Google Business Profile',
    };

    const providerName = providerNames[provider] || provider;

    await taskGenerationService.createTask({
      tenant_id: tenantId,
      task_type: 'connector_reconnect' as any,
      title: `Reconnect ${providerName}`,
      description: `Connector requires reconnection: ${reason}. Please re-authenticate to restore functionality.`,
      priority: 'high' as any,
      agent_name: 'SYSTEM',
      metadata: {
        provider,
        reason,
        reconnectUrl: `/dashboard/settings/integrations?provider=${provider}`,
      },
    });

    this.logger.info('Reconnect task generated successfully', { tenantId, provider });
  }

  /**
   * Handle auth failure
   */
  async handleAuthFailure(
    tenantId: UUID,
    provider: string,
    error: string,
    token: string
  ): Promise<void> {
    this.logger.error('Handling auth failure', { tenantId, provider, error });

    // Determine if reconnect is required
    const requiresReconnect = this.isReconnectRequiredError(error);

    if (requiresReconnect) {
      await this.markReconnectRequired(tenantId, provider, error, token);
    }
  }

  /**
   * Check if error requires reconnect
   */
  private isReconnectRequiredError(error: string): boolean {
    const reconnectErrors = [
      'token revoked',
      'refresh expired',
      'invalid token',
      'invalid_grant',
      'invalid_client',
      'access_denied',
      'unauthorized',
      'forbidden',
      'scopes missing',
      'insufficient permissions',
    ];

    const lowerError = error.toLowerCase();
    return reconnectErrors.some((err) => lowerError.includes(err));
  }

  /**
   * Preserve execution history during reconnect
   */
  async preserveExecutionHistory(
    tenantId: UUID,
    provider: string,
    token: string
  ): Promise<void> {
    this.logger.info('Preserving execution history during reconnect', { tenantId, provider });

    // Execution history is already preserved in execution_audit table
    // This is a placeholder for any additional preservation logic

    this.logger.info('Execution history preserved', { tenantId, provider });
  }
}

/**
 * Singleton instance
 */
export const reconnectRequiredService = new ReconnectRequiredService();

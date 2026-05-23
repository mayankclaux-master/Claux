/**
 * Connector Health Service
 * 
 * Canonical connector health service for CLAUX V1.
 * Tracks last successful auth, last refresh, refresh failures, invalid token count, connector uptime, connector reliability.
 * Dashboard-ready.
 * 
 * CRITICAL: This is the ONLY connector health service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Connector health metrics
 */
export interface ConnectorHealthMetrics {
  tenantId: UUID;
  provider: string;
  lastSuccessfulAuth?: string;
  lastRefresh?: string;
  refreshFailures: number;
  invalidTokenCount: number;
  connectorUptime: number; // percentage
  connectorReliability: number; // percentage
  healthy: boolean;
}

/**
 * Connector health service
 */
export class ConnectorHealthService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Record successful auth
   */
  async recordSuccessfulAuth(tenantId: UUID, provider: string, token: string): Promise<void> {
    this.logger.info('Recording successful auth', { tenantId, provider });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('connector_health')
      .upsert({
        tenant_id: tenantId,
        provider,
        last_successful_auth: new Date().toISOString(),
        refresh_failures: 0,
        invalid_token_count: 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,provider',
      });

    if (error) {
      this.logger.error('Failed to record successful auth', { error, tenantId, provider });
      throw new Error(`Failed to record successful auth: ${error.message}`);
    }

    this.logger.info('Successful auth recorded', { tenantId, provider });
  }

  /**
   * Record refresh
   */
  async recordRefresh(tenantId: UUID, provider: string, success: boolean, token: string): Promise<void> {
    this.logger.info('Recording refresh', { tenantId, provider, success });

    const supabase = createClerkSupabaseClient(token);

    if (success) {
      const { error } = await supabase
        .from('connector_health')
        .update({
          last_refresh: new Date().toISOString(),
          refresh_failures: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .eq('provider', provider);

      if (error) {
        this.logger.error('Failed to record successful refresh', { error, tenantId, provider });
      }
    } else {
      const { error } = await supabase
        .from('connector_health')
        .update({
          last_refresh: new Date().toISOString(),
          refresh_failures: (await this.getHealthMetrics(tenantId, provider, token)).refreshFailures + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .eq('provider', provider);

      if (error) {
        this.logger.error('Failed to record failed refresh', { error, tenantId, provider });
      }
    }

    this.logger.info('Refresh recorded', { tenantId, provider, success });
  }

  /**
   * Record invalid token
   */
  async recordInvalidToken(tenantId: UUID, provider: string, token: string): Promise<void> {
    this.logger.warn('Recording invalid token', { tenantId, provider });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('connector_health')
      .update({
        invalid_token_count: (await this.getHealthMetrics(tenantId, provider, token)).invalidTokenCount + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('provider', provider);

    if (error) {
      this.logger.error('Failed to record invalid token', { error, tenantId, provider });
    }

    this.logger.info('Invalid token recorded', { tenantId, provider });
  }

  /**
   * Get health metrics
   */
  async getHealthMetrics(tenantId: UUID, provider: string, token: string): Promise<ConnectorHealthMetrics> {
    this.logger.info('Getting connector health metrics', { tenantId, provider });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('connector_health')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to get health metrics', { error, tenantId, provider });
      throw new Error(`Failed to get health metrics: ${error.message}`);
    }

    if (!data) {
      return {
        tenantId,
        provider,
        refreshFailures: 0,
        invalidTokenCount: 0,
        connectorUptime: 0,
        connectorReliability: 0,
        healthy: false,
      };
    }

    const metrics: ConnectorHealthMetrics = {
      tenantId: data.tenant_id,
      provider: data.provider,
      lastSuccessfulAuth: data.last_successful_auth,
      lastRefresh: data.last_refresh,
      refreshFailures: data.refresh_failures,
      invalidTokenCount: data.invalid_token_count,
      connectorUptime: this.calculateUptime(data.last_successful_auth),
      connectorReliability: this.calculateReliability(data.refresh_failures, data.invalid_token_count),
      healthy: this.isHealthy(data.refresh_failures, data.invalid_token_count),
    };

    this.logger.info('Health metrics retrieved', { tenantId, provider, metrics });
    return metrics;
  }

  /**
   * Get all health metrics for tenant
   */
  async getTenantHealthMetrics(tenantId: UUID, token: string): Promise<ConnectorHealthMetrics[]> {
    this.logger.info('Getting tenant health metrics', { tenantId });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('connector_health')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      this.logger.error('Failed to get tenant health metrics', { error, tenantId });
      return [];
    }

    return (data || []).map((d: unknown) => ({
      tenantId: (d as { tenant_id: UUID }).tenant_id,
      provider: (d as { provider: string }).provider,
      lastSuccessfulAuth: (d as { last_successful_auth: string | null }).last_successful_auth || undefined,
      lastRefresh: (d as { last_refresh: string | null }).last_refresh || undefined,
      refreshFailures: (d as { refresh_failures: number }).refresh_failures,
      invalidTokenCount: (d as { invalid_token_count: number }).invalid_token_count,
      connectorUptime: this.calculateUptime((d as { last_successful_auth: string | null }).last_successful_auth || undefined),
      connectorReliability: this.calculateReliability(
        (d as { refresh_failures: number }).refresh_failures,
        (d as { invalid_token_count: number }).invalid_token_count
      ),
      healthy: this.isHealthy(
        (d as { refresh_failures: number }).refresh_failures,
        (d as { invalid_token_count: number }).invalid_token_count
      ),
    }));
  }

  /**
   * Calculate uptime percentage
   */
  private calculateUptime(lastSuccessfulAuth?: string): number {
    if (!lastSuccessfulAuth) {
      return 0;
    }

    const lastAuth = new Date(lastSuccessfulAuth);
    const now = Date.now();
    const daysSinceAuth = (now - lastAuth.getTime()) / (1000 * 60 * 60 * 24);

    // Uptime decreases over time if no successful auth
    if (daysSinceAuth > 30) {
      return 0;
    }

    return Math.max(0, 100 - (daysSinceAuth / 30) * 100);
  }

  /**
   * Calculate reliability percentage
   */
  private calculateReliability(refreshFailures: number, invalidTokenCount: number): number {
    const totalFailures = refreshFailures + invalidTokenCount;
    
    if (totalFailures === 0) {
      return 100;
    }

    // Reliability decreases with failures
    return Math.max(0, 100 - (totalFailures * 10));
  }

  /**
   * Check if connector is healthy
   */
  private isHealthy(refreshFailures: number, invalidTokenCount: number): boolean {
    // Healthy if no recent failures
    return refreshFailures < 5 && invalidTokenCount < 3;
  }

  /**
   * Reset health metrics
   */
  async resetHealthMetrics(tenantId: UUID, provider: string, token: string): Promise<void> {
    this.logger.info('Resetting health metrics', { tenantId, provider });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('connector_health')
      .update({
        refresh_failures: 0,
        invalid_token_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('provider', provider);

    if (error) {
      this.logger.error('Failed to reset health metrics', { error, tenantId, provider });
      throw new Error(`Failed to reset health metrics: ${error.message}`);
    }

    this.logger.info('Health metrics reset', { tenantId, provider });
  }

  /**
   * Get dashboard-ready health summary
   */
  async getDashboardHealthSummary(tenantId: UUID, token: string): Promise<{
    totalConnectors: number;
    healthyConnectors: number;
    unhealthyConnectors: number;
    overallHealth: number;
  }> {
    this.logger.info('Getting dashboard health summary', { tenantId });

    const metrics = await this.getTenantHealthMetrics(tenantId, token);

    const totalConnectors = metrics.length;
    const healthyConnectors = metrics.filter((m) => m.healthy).length;
    const unhealthyConnectors = totalConnectors - healthyConnectors;
    const overallHealth = totalConnectors > 0 ? (healthyConnectors / totalConnectors) * 100 : 0;

    this.logger.info('Dashboard health summary retrieved', { tenantId, overallHealth });
    return {
      totalConnectors,
      healthyConnectors,
      unhealthyConnectors,
      overallHealth,
    };
  }
}

/**
 * Singleton instance
 */
export const connectorHealthService = new ConnectorHealthService();

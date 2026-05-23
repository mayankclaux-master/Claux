/**
 * Dashboard Consistency Service
 * 
 * Canonical dashboard consistency service for CLAUX V1 platform edge hardening.
 * Prevents stale charts, prevents partially updated dashboards, atomic dashboard refresh states, execution-aware cache invalidation, trend consistency validation.
 * 
 * CRITICAL: This is the ONLY dashboard consistency service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { cacheControlService } from './cache-control.service';

/**
 * Dashboard refresh state
 */
export type DashboardRefreshState = 'idle' | 'refreshing' | 'complete' | 'failed';

/**
 * Dashboard consistency status
 */
export interface DashboardConsistencyStatus {
  state: DashboardRefreshState;
  lastRefreshAt: number;
  lastExecutionId?: UUID;
  stale: boolean;
  warnings: string[];
}

/**
 * Dashboard consistency service
 */
export class DashboardConsistencyService {
  private logger: Logger;
  private refreshStates: Map<UUID, DashboardConsistencyStatus>;
  private readonly STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.logger = createLogger();
    this.refreshStates = new Map();
  }

  /**
   * Start dashboard refresh
   */
  startRefresh(tenantId: UUID, executionId: UUID): void {
    const status: DashboardConsistencyStatus = {
      state: 'refreshing',
      lastRefreshAt: Date.now(),
      lastExecutionId: executionId,
      stale: false,
      warnings: [],
    };

    this.refreshStates.set(tenantId, status);
    this.logger.info('Dashboard refresh started', { tenantId, executionId });
  }

  /**
   * Complete dashboard refresh
   */
  completeRefresh(tenantId: UUID, executionId: UUID): void {
    const status = this.refreshStates.get(tenantId);
    if (!status) {
      this.logger.warn('No active refresh found', { tenantId, executionId });
      return;
    }

    status.state = 'complete';
    status.lastRefreshAt = Date.now();
    status.lastExecutionId = executionId;
    status.stale = false;
    status.warnings = [];

    this.refreshStates.set(tenantId, status);
    this.logger.info('Dashboard refresh completed', { tenantId, executionId });

    // Invalidate cache
    cacheControlService.invalidateDashboardCache(tenantId);
  }

  /**
   * Fail dashboard refresh
   */
  failRefresh(tenantId: UUID, executionId: UUID, reason: string): void {
    const status = this.refreshStates.get(tenantId);
    if (!status) {
      this.logger.warn('No active refresh found', { tenantId, executionId });
      return;
    }

    status.state = 'failed';
    status.warnings.push(reason);
    status.stale = true;

    this.refreshStates.set(tenantId, status);
    this.logger.warn('Dashboard refresh failed', { tenantId, executionId, reason });
  }

  /**
   * Get dashboard consistency status
   */
  getStatus(tenantId: UUID): DashboardConsistencyStatus {
    const status = this.refreshStates.get(tenantId);
    if (!status) {
      return {
        state: 'idle',
        lastRefreshAt: 0,
        stale: true,
        warnings: ['No refresh history'],
      };
    }

    // Check if stale
    const now = Date.now();
    if (now - status.lastRefreshAt > this.STALE_THRESHOLD_MS) {
      status.stale = true;
      status.warnings.push('Dashboard data is stale');
    }

    return status;
  }

  /**
   * Invalidate dashboard on execution
   */
  invalidateOnExecution(tenantId: UUID, executionId: UUID): void {
    this.logger.info('Dashboard invalidated on execution', { tenantId, executionId });
    cacheControlService.invalidateDashboardCache(tenantId);
    cacheControlService.invalidateTrendCache(tenantId);
  }

  /**
   * Validate trend consistency
   */
  async validateTrendConsistency(tenantId: UUID, token: string): Promise<{ consistent: boolean; warnings: string[] }> {
    const supabase = createClerkSupabaseClient(token);
    const warnings: string[] = [];

    // Check if trends exist
    const { data: trends } = await supabase
      .from('trends')
      .select('id, updated_at')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!trends) {
      warnings.push('No trend data found');
      return { consistent: false, warnings };
    }

    // Check if trends are stale
    const trendAge = Date.now() - new Date(trends.updated_at).getTime();
    if (trendAge > this.STALE_THRESHOLD_MS) {
      warnings.push('Trend data is stale');
    }

    return {
      consistent: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Force dashboard refresh
   */
  forceRefresh(tenantId: UUID): void {
    const status: DashboardConsistencyStatus = {
      state: 'idle',
      lastRefreshAt: 0,
      stale: true,
      warnings: ['Force refresh required'],
    };

    this.refreshStates.set(tenantId, status);
    this.logger.info('Dashboard force refresh triggered', { tenantId });
  }

  /**
   * Get all refresh states
   */
  getAllRefreshStates(): Map<UUID, DashboardConsistencyStatus> {
    return new Map(this.refreshStates);
  }

  /**
   * Clean up stale states
   */
  cleanupStaleStates(): void {
    const now = Date.now();
    const keysToDelete: UUID[] = [];

    for (const [tenantId, status] of this.refreshStates.entries()) {
      if (now - status.lastRefreshAt > 24 * 60 * 60 * 1000) { // 24 hours
        keysToDelete.push(tenantId);
      }
    }

    for (const tenantId of keysToDelete) {
      this.refreshStates.delete(tenantId);
    }

    if (keysToDelete.length > 0) {
      this.logger.debug('Stale refresh states cleaned', { count: keysToDelete.length });
    }
  }

  /**
   * Get dashboard freshness metrics
   */
  getFreshnessMetrics(): {
    totalDashboards: number;
    freshDashboards: number;
    staleDashboards: number;
    refreshingDashboards: number;
    failedDashboards: number;
  } {
    let fresh = 0;
    let stale = 0;
    let refreshing = 0;
    let failed = 0;

    for (const status of this.refreshStates.values()) {
      switch (status.state) {
        case 'idle':
        case 'complete':
          if (status.stale) {
            stale++;
          } else {
            fresh++;
          }
          break;
        case 'refreshing':
          refreshing++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return {
      totalDashboards: this.refreshStates.size,
      freshDashboards: fresh,
      staleDashboards: stale,
      refreshingDashboards: refreshing,
      failedDashboards: failed,
    };
  }
}

/**
 * Singleton instance
 */
export const dashboardConsistencyService = new DashboardConsistencyService();

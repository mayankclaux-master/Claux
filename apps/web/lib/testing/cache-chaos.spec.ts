/**
 * Cache Chaos Testing
 * 
 * Simulate rapid execution updates, concurrent dashboard refreshes, onboarding completion races, cache invalidation storms, stale trend recalculations.
 * Verify dashboard consistency, trend consistency, no stale execution state, no stale onboarding state, no cache poisoning.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';
import { cacheControlService } from '../platform/cache-control.service';
import { dashboardConsistencyService } from '../platform/dashboard-consistency.service';

/**
 * Cache chaos test result
 */
export interface CacheChaosTestResult {
  testName: string;
  passed: boolean;
  details: string;
  duration: number;
}

/**
 * Cache chaos test suite
 */
export class CacheChaosSpec {
  private logger: Logger;
  private results: CacheChaosTestResult[] = [];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Run all cache chaos tests
   */
  async runAllTests(): Promise<CacheChaosTestResult[]> {
    this.logger.info('Starting cache chaos tests');

    this.results = [];

    await this.testRapidExecutionUpdates();
    await this.testConcurrentDashboardRefreshes();
    await this.testOnboardingCompletionRaces();
    await this.testCacheInvalidationStorms();
    await this.testStaleTrendRecalculations();

    this.logger.info('Cache chaos tests complete', { 
      passed: this.results.filter(r => r.passed).length,
      total: this.results.length 
    });

    return this.results;
  }

  /**
   * Test rapid execution updates
   */
  private async testRapidExecutionUpdates(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;
    const executionId = crypto.randomUUID() as UUID;

    // Simulate rapid execution state updates
    const states = ['pending', 'running', 'processing', 'completing', 'completed'];
    
    for (const state of states) {
      cacheControlService.set(tenantId, `execution:${executionId}`, { state }, 1000);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Verify final state is correct
    const finalState = cacheControlService.get<{ state: string }>(tenantId, `execution:${executionId}`);
    const passed = finalState?.state === 'completed';

    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'Rapid Execution Updates',
      passed,
      details: passed 
        ? 'Execution state updates handled correctly' 
        : 'Stale execution state detected',
      duration,
    });

    // Cleanup
    cacheControlService.invalidate(tenantId, `execution:${executionId}`);
  }

  /**
   * Test concurrent dashboard refreshes
   */
  private async testConcurrentDashboardRefreshes(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;
    const executionId = crypto.randomUUID() as UUID;

    // Start dashboard refresh
    dashboardConsistencyService.startRefresh(tenantId, executionId);

    // Simulate concurrent refresh attempts
    const refreshPromises = Array.from({ length: 10 }, () => 
      new Promise<void>((resolve) => {
        dashboardConsistencyService.startRefresh(tenantId, crypto.randomUUID() as UUID);
        setTimeout(resolve, 10);
      })
    );

    await Promise.all(refreshPromises);

    // Complete refresh
    dashboardConsistencyService.completeRefresh(tenantId, executionId);

    // Verify consistency
    const status = dashboardConsistencyService.getStatus(tenantId);
    const passed = status.state === 'complete' && !status.stale;

    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'Concurrent Dashboard Refreshes',
      passed,
      details: passed 
        ? 'Concurrent refreshes handled correctly' 
        : 'Dashboard inconsistency detected',
      duration,
    });
  }

  /**
   * Test onboarding completion races
   */
  private async testOnboardingCompletionRaces(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;

    // Set onboarding cache
    cacheControlService.set(tenantId, 'onboarding:status', { stage: 'connector-setup' }, 60000);

    // Simulate concurrent completion attempts
    const completionPromises = Array.from({ length: 5 }, (_, i) => 
      new Promise<void>((resolve) => {
        cacheControlService.set(tenantId, 'onboarding:status', { stage: 'completed', attempt: i }, 60000);
        setTimeout(resolve, 10);
      })
    );

    await Promise.all(completionPromises);

    // Verify final state
    const finalStatus = cacheControlService.get<{ stage: string }>(tenantId, 'onboarding:status');
    const passed = finalStatus?.stage === 'completed';

    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'Onboarding Completion Races',
      passed,
      details: passed 
        ? 'Onboarding completion races handled correctly' 
        : 'Stale onboarding state detected',
      duration,
    });

    // Cleanup
    cacheControlService.invalidate(tenantId, 'onboarding:status');
  }

  /**
   * Test cache invalidation storms
   */
  private async testCacheInvalidationStorms(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;

    // Set multiple cache entries
    const keys = ['rankings', 'traffic', 'reports', 'tasks', 'agents'];
    keys.forEach(key => {
      cacheControlService.set(tenantId, `dashboard:${key}`, { data: `data-${key}` }, 60000);
    });

    // Simulate invalidation storm
    const invalidationPromises = keys.map(key => 
      new Promise<void>((resolve) => {
        cacheControlService.invalidate(tenantId, `dashboard:${key}`);
        setTimeout(resolve, 5);
      })
    );

    await Promise.all(invalidationPromises);

    // Verify all caches invalidated
    const allInvalidated = keys.every(key => 
      cacheControlService.get(tenantId, `dashboard:${key}`) === null
    );

    const passed = allInvalidated;
    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'Cache Invalidation Storms',
      passed,
      details: passed 
        ? 'Cache invalidation storm handled correctly' 
        : 'Cache poisoning detected',
      duration,
    });
  }

  /**
   * Test stale trend recalculations
   */
  private async testStaleTrendRecalculations(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;

    // Set initial trend cache
    cacheControlService.set(tenantId, 'trends:ranking', { version: 1, data: 'old-trends' }, 60000);
    cacheControlService.set(tenantId, 'trends:traffic', { version: 1, data: 'old-trends' }, 60000);

    // Simulate trend recalculation
    await new Promise(resolve => setTimeout(resolve, 10));
    cacheControlService.invalidateTrendCache(tenantId);

    // Set new trend data
    cacheControlService.set(tenantId, 'trends:ranking', { version: 2, data: 'new-trends' }, 60000);
    cacheControlService.set(tenantId, 'trends:traffic', { version: 2, data: 'new-trends' }, 60000);

    // Verify no stale data
    const rankingTrend = cacheControlService.get<{ version: number }>(tenantId, 'trends:ranking');
    const trafficTrend = cacheControlService.get<{ version: number }>(tenantId, 'trends:traffic');

    const passed = rankingTrend?.version === 2 && trafficTrend?.version === 2;
    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'Stale Trend Recalculations',
      passed,
      details: passed 
        ? 'Trend recalculation handled correctly' 
        : 'Stale trend data detected',
      duration,
    });

    // Cleanup
    cacheControlService.invalidateTrendCache(tenantId);
  }

  /**
   * Get test results
   */
  getResults(): CacheChaosTestResult[] {
    return this.results;
  }

  /**
   * Get test summary
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
    };
  }
}

/**
 * Singleton instance
 */
export const cacheChaosSpec = new CacheChaosSpec();

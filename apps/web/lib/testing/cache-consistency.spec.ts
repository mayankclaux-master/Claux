/**
 * Cache Invalidation Tests
 * 
 * Verify dashboard refresh correctness, trend recalculation correctness, execution invalidation correctness, onboarding invalidation correctness, no stale dashboard data.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';
import { cacheControlService } from '../platform/cache-control.service';
import { dashboardConsistencyService } from '../platform/dashboard-consistency.service';

/**
 * Cache test result
 */
export interface CacheTestResult {
  testName: string;
  passed: boolean;
  details: string;
  duration: number;
}

/**
 * Cache consistency test suite
 */
export class CacheConsistencySpec {
  private logger: Logger;
  private results: CacheTestResult[] = [];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Run all cache consistency tests
   */
  async runAllTests(): Promise<CacheTestResult[]> {
    this.logger.info('Starting cache consistency tests');

    this.results = [];

    await this.testDashboardRefreshCorrectness();
    await this.testTrendRecalculationCorrectness();
    await this.testExecutionInvalidationCorrectness();
    await this.testOnboardingInvalidationCorrectness();
    await this.testNoStaleDashboardData();

    this.logger.info('Cache consistency tests complete', { 
      passed: this.results.filter(r => r.passed).length,
      total: this.results.length 
    });

    return this.results;
  }

  /**
   * Test dashboard refresh correctness
   */
  private async testDashboardRefreshCorrectness(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;
    const executionId = crypto.randomUUID() as UUID;

    // Set initial dashboard cache
    cacheControlService.set(tenantId, 'dashboard:rankings', { version: 1 }, 60000);

    // Start dashboard refresh
    dashboardConsistencyService.startRefresh(tenantId, executionId);

    // Update dashboard data
    cacheControlService.set(tenantId, 'dashboard:rankings', { version: 2 }, 60000);

    // Complete refresh
    dashboardConsistencyService.completeRefresh(tenantId, executionId);

    // Verify cache was invalidated
    const cachedData = cacheControlService.get(tenantId, 'dashboard:rankings');
    const status = dashboardConsistencyService.getStatus(tenantId);

    const passed = status.state === 'complete' && cachedData === null;
    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'Dashboard Refresh Correctness',
      passed,
      details: passed 
        ? 'Dashboard cache invalidated correctly on refresh' 
        : 'Dashboard cache not invalidated',
      duration,
    });

    // Cleanup
    cacheControlService.invalidate(tenantId, 'dashboard:rankings');
  }

  /**
   * Test trend recalculation correctness
   */
  private async testTrendRecalculationCorrectness(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;

    // Set initial trend cache
    cacheControlService.set(tenantId, 'trends:ranking', { data: 'old-trends' }, 60000);

    // Invalidate trend cache
    cacheControlService.invalidateTrendCache(tenantId);

    // Verify cache was invalidated
    const cachedData = cacheControlService.get(tenantId, 'trends:ranking');

    const passed = cachedData === null;
    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'Trend Recalculation Correctness',
      passed,
      details: passed 
        ? 'Trend cache invalidated correctly' 
        : 'Trend cache not invalidated',
      duration,
    });
  }

  /**
   * Test execution invalidation correctness
   */
  private async testExecutionInvalidationCorrectness(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;
    const executionId = crypto.randomUUID() as UUID;

    // Set execution cache
    cacheControlService.set(tenantId, `execution:${executionId}`, { status: 'running' }, 60000);
    cacheControlService.set(tenantId, `execution:${executionId}:result`, { data: 'result' }, 60000);

    // Invalidate execution cache
    cacheControlService.invalidateExecutionCache(tenantId, executionId);

    // Verify cache was invalidated
    const executionCache = cacheControlService.get(tenantId, `execution:${executionId}`);
    const resultCache = cacheControlService.get(tenantId, `execution:${executionId}:result`);

    const passed = executionCache === null && resultCache === null;
    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'Execution Invalidation Correctness',
      passed,
      details: passed 
        ? 'Execution cache invalidated correctly' 
        : 'Execution cache not invalidated',
      duration,
    });
  }

  /**
   * Test onboarding invalidation correctness
   */
  private async testOnboardingInvalidationCorrectness(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;

    // Set onboarding cache
    cacheControlService.set(tenantId, 'onboarding:status', { stage: 'in-progress' }, 60000);
    cacheControlService.set(tenantId, 'onboarding:progress', { percent: 50 }, 60000);

    // Invalidate onboarding cache
    cacheControlService.invalidateOnboardingCache(tenantId);

    // Verify cache was invalidated
    const statusCache = cacheControlService.get(tenantId, 'onboarding:status');
    const progressCache = cacheControlService.get(tenantId, 'onboarding:progress');

    const passed = statusCache === null && progressCache === null;
    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'Onboarding Invalidation Correctness',
      passed,
      details: passed 
        ? 'Onboarding cache invalidated correctly' 
        : 'Onboarding cache not invalidated',
      duration,
    });
  }

  /**
   * Test no stale dashboard data
   */
  private async testNoStaleDashboardData(): Promise<void> {
    const startTime = Date.now();
    const tenantId = crypto.randomUUID() as UUID;
    const executionId = crypto.randomUUID() as UUID;

    // Set dashboard cache with old data
    cacheControlService.set(tenantId, 'dashboard:rankings', { timestamp: Date.now() - 100000 }, 60000);

    // Simulate execution completion
    dashboardConsistencyService.invalidateOnExecution(tenantId, executionId);

    // Verify dashboard cache was invalidated
    const cachedData = cacheControlService.get(tenantId, 'dashboard:rankings');

    const passed = cachedData === null;
    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'No Stale Dashboard Data',
      passed,
      details: passed 
        ? 'Dashboard cache invalidated on execution' 
        : 'Stale dashboard data detected',
      duration,
    });
  }

  /**
   * Get test results
   */
  getResults(): CacheTestResult[] {
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
export const cacheConsistencySpec = new CacheConsistencySpec();

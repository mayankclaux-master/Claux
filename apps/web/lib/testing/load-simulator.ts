/**
 * Load Test Simulator
 * 
 * Simulate 100 tenants, recurring schedules, dashboard traffic, concurrent executions, connector spikes, retry storms.
 * Collect execution duration, memory usage, timeout frequency, lock contention, dashboard freshness, query performance.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';
import { executionSimulator, AgentType } from './execution-simulator';
import { cacheControlService } from '../platform/cache-control.service';
import { executionLoadSheddingService } from '../platform/execution-load-shedding.service';

/**
 * Load simulation config
 */
export interface LoadSimulationConfig {
  tenantCount: number;
  executionCount: number;
  concurrentExecutions: number;
  dashboardRequests: number;
  connectorSpikeRate: number;
  retryStormRate: number;
}

/**
 * Load simulation metrics
 */
export interface LoadSimulationMetrics {
  executionDuration: number[];
  memoryUsage: number[];
  timeoutFrequency: number;
  lockContention: number;
  dashboardFreshness: number;
  queryPerformance: number[];
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
}

/**
 * Load test simulator
 */
export class LoadSimulator {
  private logger: Logger;
  private config: LoadSimulationConfig;
  private metrics: LoadSimulationMetrics;

  constructor(config: Partial<LoadSimulationConfig> = {}) {
    this.logger = createLogger();
    this.config = {
      tenantCount: 100,
      executionCount: 1000,
      concurrentExecutions: 20,
      dashboardRequests: 500,
      connectorSpikeRate: 0.1,
      retryStormRate: 0.05,
      ...config,
    };
    this.metrics = {
      executionDuration: [],
      memoryUsage: [],
      timeoutFrequency: 0,
      lockContention: 0,
      dashboardFreshness: 0,
      queryPerformance: [],
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    };
  }

  /**
   * Run load simulation
   */
  async runSimulation(): Promise<LoadSimulationMetrics> {
    this.logger.info('Starting load simulation', { config: this.config });

    // Update execution simulator config for load test
    executionSimulator.updateConfig({
      tenantCount: this.config.tenantCount,
      executionCount: this.config.executionCount,
      parallelExecutions: this.config.concurrentExecutions,
      failureRate: this.config.connectorSpikeRate,
    });

    // Run execution simulation
    const startTime = Date.now();
    const { results, statistics } = await executionSimulator.runSimulation();
    const duration = Date.now() - startTime;

    // Collect metrics
    this.collectExecutionMetrics(results, duration);
    await this.simulateDashboardTraffic();
    await this.simulateConnectorSpikes();
    await this.simulateRetryStorms();

    this.logger.info('Load simulation complete', { metrics: this.metrics });

    return this.metrics;
  }

  /**
   * Collect execution metrics
   */
  private collectExecutionMetrics(results: any[], duration: number): void {
    this.metrics.totalExecutions = results.length;
    this.metrics.successfulExecutions = results.filter((r: any) => r.success).length;
    this.metrics.failedExecutions = results.filter((r: any) => !r.success).length;
    this.metrics.executionDuration = results.map((r: any) => r.duration);
    this.metrics.timeoutFrequency = results.filter((r: any) => r.error?.includes('timeout')).length / results.length;
    
    // Simulate memory usage
    this.metrics.memoryUsage = results.map(() => Math.random() * 100 + 50);
  }

  /**
   * Simulate dashboard traffic
   */
  private async simulateDashboardTraffic(): Promise<void> {
    const tenantIds = Array.from({ length: this.config.tenantCount }, () => crypto.randomUUID() as UUID);

    for (let i = 0; i < this.config.dashboardRequests; i++) {
      const tenantId = tenantIds[i % tenantIds.length];
      
      // Simulate dashboard cache hit/miss
      const cached = cacheControlService.get(tenantId, 'dashboard:rankings');
      if (!cached) {
        cacheControlService.set(tenantId, 'dashboard:rankings', { data: 'mock-data' }, 60000);
      }

      // Simulate query performance
      this.metrics.queryPerformance.push(Math.random() * 100 + 10);
    }

    // Calculate dashboard freshness
    const freshDashboards = tenantIds.filter(t => cacheControlService.get(t, 'dashboard:rankings') !== null).length;
    this.metrics.dashboardFreshness = (freshDashboards / tenantIds.length) * 100;
  }

  /**
   * Simulate connector spikes
   */
  private async simulateConnectorSpikes(): Promise<void> {
    const spikeCount = Math.floor(this.config.executionCount * this.config.connectorSpikeRate);
    
    for (let i = 0; i < spikeCount; i++) {
      const tenantId = crypto.randomUUID() as UUID;
      const executionId = crypto.randomUUID() as UUID;

      // Request execution slot during spike
      const slotRequest = executionLoadSheddingService.requestExecution(tenantId, executionId);
      
      if (!slotRequest.allowed) {
        this.metrics.lockContention++;
      }

      // Release after simulated work
      await new Promise(resolve => setTimeout(resolve, 10));
      executionLoadSheddingService.releaseExecution(tenantId, executionId);
    }
  }

  /**
   * Simulate retry storms
   */
  private async simulateRetryStorms(): Promise<void> {
    const stormCount = Math.floor(this.config.executionCount * this.config.retryStormRate);

    for (let i = 0; i < stormCount; i++) {
      const tenantId = crypto.randomUUID() as UUID;
      const agentType = Object.values(AgentType)[i % Object.values(AgentType).length];

      // Simulate retry storm
      let retries = 0;
      for (let attempt = 0; attempt < 5; attempt++) {
        retries++;
        if (Math.random() > 0.5) break;
      }

      this.metrics.failedExecutions += retries > 3 ? 1 : 0;
    }
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    averageExecutionDuration: number;
    maxExecutionDuration: number;
    minExecutionDuration: number;
    averageMemoryUsage: number;
    maxMemoryUsage: number;
    successRate: number;
    timeoutRate: number;
    lockContentionRate: number;
    dashboardFreshness: number;
    averageQueryPerformance: number;
  } {
    const avgDuration = this.metrics.executionDuration.length > 0
      ? this.metrics.executionDuration.reduce((a, b) => a + b, 0) / this.metrics.executionDuration.length
      : 0;
    const maxDuration = this.metrics.executionDuration.length > 0
      ? Math.max(...this.metrics.executionDuration)
      : 0;
    const minDuration = this.metrics.executionDuration.length > 0
      ? Math.min(...this.metrics.executionDuration)
      : 0;

    const avgMemory = this.metrics.memoryUsage.length > 0
      ? this.metrics.memoryUsage.reduce((a, b) => a + b, 0) / this.metrics.memoryUsage.length
      : 0;
    const maxMemory = this.metrics.memoryUsage.length > 0
      ? Math.max(...this.metrics.memoryUsage)
      : 0;

    const successRate = this.metrics.totalExecutions > 0
      ? (this.metrics.successfulExecutions / this.metrics.totalExecutions) * 100
      : 0;

    const avgQuery = this.metrics.queryPerformance.length > 0
      ? this.metrics.queryPerformance.reduce((a, b) => a + b, 0) / this.metrics.queryPerformance.length
      : 0;

    return {
      averageExecutionDuration: avgDuration,
      maxExecutionDuration: maxDuration,
      minExecutionDuration: minDuration,
      averageMemoryUsage: avgMemory,
      maxMemoryUsage: maxMemory,
      successRate,
      timeoutRate: this.metrics.timeoutFrequency * 100,
      lockContentionRate: (this.metrics.lockContention / this.config.executionCount) * 100,
      dashboardFreshness: this.metrics.dashboardFreshness,
      averageQueryPerformance: avgQuery,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      executionDuration: [],
      memoryUsage: [],
      timeoutFrequency: 0,
      lockContention: 0,
      dashboardFreshness: 0,
      queryPerformance: [],
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    };
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<LoadSimulationConfig>): void {
    Object.assign(this.config, config);
  }
}

/**
 * Singleton instance
 */
export const loadSimulator = new LoadSimulator();

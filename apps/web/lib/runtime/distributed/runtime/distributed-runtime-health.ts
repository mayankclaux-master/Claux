/**
 * CLAUX Runtime Distributed Layer - Distributed Runtime Health
 * 
 * Monitors distributed runtime health.
 * No external dependencies - pure health semantics.
 */

import type { ClusterId } from '../types';

/**
 * Distributed Runtime Health Status
 */
enum RuntimeHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  CRITICAL = 'critical',
}

/**
 * Distributed Runtime Health Monitor
 * 
 * Monitors distributed runtime health.
 */
export class DistributedRuntimeHealthMonitor {
  private clusterId: ClusterId;
  private healthStatus: RuntimeHealthStatus = RuntimeHealthStatus.HEALTHY;
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private lastHealthCheck: Date;

  constructor(clusterId: ClusterId) {
    this.clusterId = clusterId;
    this.lastHealthCheck = new Date();
  }

  /**
   * Perform health check
   */
  async performHealthCheck(checkName: string, checkFn: () => Promise<boolean>): Promise<void> {
    let result: HealthCheckResult = {
      checkName,
      passed: false,
      timestamp: new Date(),
      error: undefined,
    };

    try {
      result = {
        ...result,
        passed: await checkFn(),
      };
    } catch (error) {
      result = {
        ...result,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    this.healthChecks.set(checkName, result);
    this.updateOverallHealth();
    this.lastHealthCheck = new Date();
  }

  /**
   * Update overall health status
   */
  private updateOverallHealth(): void {
    const results = Array.from(this.healthChecks.values());
    const passedChecks = results.filter(r => r.passed).length;
    const totalChecks = results.length;

    if (totalChecks === 0) {
      this.healthStatus = RuntimeHealthStatus.HEALTHY;
      return;
    }

    const passRatio = passedChecks / totalChecks;

    if (passRatio >= 0.9) {
      this.healthStatus = RuntimeHealthStatus.HEALTHY;
    } else if (passRatio >= 0.7) {
      this.healthStatus = RuntimeHealthStatus.DEGRADED;
    } else if (passRatio >= 0.5) {
      this.healthStatus = RuntimeHealthStatus.UNHEALTHY;
    } else {
      this.healthStatus = RuntimeHealthStatus.CRITICAL;
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): RuntimeHealthStatus {
    return this.healthStatus;
  }

  /**
   * Get health check result
   */
  getHealthCheckResult(checkName: string): HealthCheckResult | undefined {
    return this.healthChecks.get(checkName);
  }

  /**
   * Get all health check results
   */
  getAllHealthCheckResults(): readonly HealthCheckResult[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get last health check time
   */
  getLastHealthCheckTime(): Date {
    return this.lastHealthCheck;
  }

  /**
   * Check if runtime is healthy
   */
  isHealthy(): boolean {
    return this.healthStatus === RuntimeHealthStatus.HEALTHY;
  }

  /**
   * Check if runtime is degraded
   */
  isDegraded(): boolean {
    return this.healthStatus === RuntimeHealthStatus.DEGRADED;
  }

  /**
   * Check if runtime is unhealthy
   */
  isUnhealthy(): boolean {
    return this.healthStatus === RuntimeHealthStatus.UNHEALTHY;
  }

  /**
   * Check if runtime is in critical state
   */
  isCritical(): boolean {
    return this.healthStatus === RuntimeHealthStatus.CRITICAL;
  }

  /**
   * Get health summary
   */
  getHealthSummary(): HealthSummary {
    const results = Array.from(this.healthChecks.values());
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return {
      clusterId: this.clusterId,
      overallStatus: this.healthStatus,
      totalChecks: results.length,
      passedChecks: passed,
      failedChecks: failed,
      lastCheckTime: this.lastHealthCheck,
    };
  }

  /**
   * Clear health checks
   */
  clearHealthChecks(): void {
    this.healthChecks.clear();
    this.healthStatus = RuntimeHealthStatus.HEALTHY;
    this.lastHealthCheck = new Date();
  }
}

/**
 * Health Check Result
 */
interface HealthCheckResult {
  readonly checkName: string;
  readonly passed: boolean;
  readonly timestamp: Date;
  readonly error?: string;
}

/**
 * Health Summary
 */
interface HealthSummary {
  readonly clusterId: ClusterId;
  readonly overallStatus: RuntimeHealthStatus;
  readonly totalChecks: number;
  readonly passedChecks: number;
  readonly failedChecks: number;
  readonly lastCheckTime: Date;
}

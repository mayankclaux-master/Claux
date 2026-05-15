/**
 * CLAUX Runtime Temporal Layer - Temporal Runtime Health
 * 
 * Health monitoring for temporal runtime.
 * No external dependencies - pure health semantics.
 */

import type { TemporalTimestamp } from '../types';

/**
 * Health Status
 */
enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Temporal Runtime Health Monitor
 * 
 * Health monitoring for temporal runtime.
 */
export class TemporalRuntimeHealthMonitor {
  private healthStatus: HealthStatus = HealthStatus.HEALTHY;
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private lastHealthCheck: TemporalTimestamp;

  constructor() {
    this.lastHealthCheck = Date.now() as TemporalTimestamp;
  }

  /**
   * Perform health check
   */
  async performHealthCheck(checkName: string, checkFn: () => Promise<boolean>): Promise<void> {
    let passed = false;
    let error: string | undefined = undefined;

    try {
      passed = await checkFn();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const result: HealthCheckResult = {
      checkName,
      passed,
      timestamp: Date.now() as TemporalTimestamp,
      error,
    };

    this.healthChecks.set(checkName, result);
    this.updateOverallHealth();
    this.lastHealthCheck = Date.now() as TemporalTimestamp;
  }

  /**
   * Update overall health status
   */
  private updateOverallHealth(): void {
    const results = Array.from(this.healthChecks.values());
    const passedChecks = results.filter(r => r.passed).length;
    const totalChecks = results.length;

    if (totalChecks === 0) {
      this.healthStatus = HealthStatus.HEALTHY;
      return;
    }

    const passRatio = passedChecks / totalChecks;

    if (passRatio >= 0.9) {
      this.healthStatus = HealthStatus.HEALTHY;
    } else if (passRatio >= 0.7) {
      this.healthStatus = HealthStatus.DEGRADED;
    } else {
      this.healthStatus = HealthStatus.UNHEALTHY;
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): HealthStatus {
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
  getLastHealthCheckTime(): TemporalTimestamp {
    return this.lastHealthCheck;
  }

  /**
   * Is healthy
   */
  isHealthy(): boolean {
    return this.healthStatus === HealthStatus.HEALTHY;
  }

  /**
   * Clear health checks
   */
  clearHealthChecks(): void {
    this.healthChecks.clear();
    this.healthStatus = HealthStatus.HEALTHY;
    this.lastHealthCheck = Date.now() as TemporalTimestamp;
  }
}

/**
 * Health Check Result
 */
interface HealthCheckResult {
  readonly checkName: string;
  readonly passed: boolean;
  readonly timestamp: TemporalTimestamp;
  readonly error?: string;
}

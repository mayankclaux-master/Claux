/**
 * CLAUX Runtime Bootstrap Layer - Health Initialization
 */

/**
 * Health Initialization Manager
 */
export class HealthInitializationManager {
  private healthChecks: Map<string, () => boolean> = new Map();
  private healthStatus: Map<string, boolean> = new Map();

  /**
   * Add health check
   */
  addHealthCheck(name: string, check: () => boolean): void {
    this.healthChecks.set(name, check);
  }

  /**
   * Run health checks
   */
  runHealthChecks(): { healthy: boolean; unhealthy: string[] } {
    const unhealthy: string[] = [];

    for (const [name, check] of this.healthChecks) {
      const healthy = check();
      this.healthStatus.set(name, healthy);

      if (!healthy) {
        unhealthy.push(name);
      }
    }

    return { healthy: unhealthy.length === 0, unhealthy };
  }

  /**
   * Get health status
   */
  getHealthStatus(): readonly { name: string; healthy: boolean }[] {
    return Array.from(this.healthStatus.entries()).map(([name, healthy]) => ({
      name,
      healthy,
    }));
  }

  /**
   * Clear
   */
  clear(): void {
    this.healthChecks.clear();
    this.healthStatus.clear();
  }
}

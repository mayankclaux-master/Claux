/**
 * CLAUX Runtime Scaling Layer - Dynamic Concurrency
 */

/**
 * Dynamic Concurrency Manager
 */
export class DynamicConcurrencyManager {
  private currentConcurrency: number = 1;
  private history: number[] = [];

  /**
   * Update concurrency
   */
  update(metrics: { latency: number; errorRate: number }): number {
    this.history.push(metrics.latency);
    if (this.history.length > 50) this.history.shift();

    const avgLatency = this.history.reduce((a, b) => a + b, 0) / this.history.length;

    if (avgLatency > 1000 || metrics.errorRate > 0.05) {
      this.currentConcurrency = Math.max(1, this.currentConcurrency - 1);
    } else if (avgLatency < 100 && metrics.errorRate < 0.01) {
      this.currentConcurrency = Math.min(16, this.currentConcurrency + 1);
    }

    return this.currentConcurrency;
  }

  /**
   * Get current concurrency
   */
  getCurrent(): number {
    return this.currentConcurrency;
  }

  /**
   * Clear
   */
  clear(): void {
    this.currentConcurrency = 1;
    this.history = [];
  }
}

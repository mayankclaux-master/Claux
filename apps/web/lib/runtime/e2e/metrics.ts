/**
 * CLAUX Runtime E2E Layer - Metrics
 */

/**
 * E2E Metrics Collector
 */
export class E2EMetricsCollector {
  private counters: Map<string, number> = new Map();

  /**
   * Increment counter
   */
  increment(name: string): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + 1);
  }

  /**
   * Get counter
   */
  get(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * Clear
   */
  clear(): void {
    this.counters.clear();
  }
}

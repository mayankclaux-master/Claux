/**
 * CLAUX Runtime Distributed Layer - Metrics
 * 
 * Collects and reports distributed runtime metrics.
 * No external dependencies - pure metrics semantics.
 */

/**
 * Distributed Runtime Metrics Collector
 * 
 * Collects and reports distributed runtime metrics.
 */
export class DistributedRuntimeMetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment counter
   */
  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Get counter
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * Set gauge
   */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Get gauge
   */
  getGauge(name: string): number {
    return this.gauges.get(name) || 0;
  }

  /**
   * Record histogram value
   */
  recordHistogram(name: string, value: number): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    this.histograms.set(name, values);
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string): HistogramStats | undefined {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) return undefined;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avg = sum / sorted.length;

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): MetricsSnapshot {
    const histogramStats = new Map<string, HistogramStats>();
    for (const [name] of this.histograms) {
      const stats = this.getHistogramStats(name);
      if (stats) {
        histogramStats.set(name, stats);
      }
    }

    return {
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histogramStats,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

/**
 * Histogram Statistics
 */
interface HistogramStats {
  readonly count: number;
  readonly min: number;
  readonly max: number;
  readonly avg: number;
  readonly p50: number;
  readonly p95: number;
  readonly p99: number;
}

/**
 * Metrics Snapshot
 */
interface MetricsSnapshot {
  readonly counters: Map<string, number>;
  readonly gauges: Map<string, number>;
  readonly histogramStats: Map<string, HistogramStats>;
}

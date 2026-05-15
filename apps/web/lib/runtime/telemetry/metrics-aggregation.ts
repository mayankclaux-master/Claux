/**
 * CLAUX Runtime Telemetry Layer - Metrics Aggregation
 */

import type { Metric, MetricId } from './types';
import { MetricError } from './errors';
import { DEFAULT_METRIC_WINDOW } from './constants';

/**
 * Metrics Aggregation Manager
 */
export class MetricsAggregationManager {
  private metrics: Map<MetricId, Metric[]> = new Map();

  /**
   * Add metric
   */
  addMetric(metric: Metric): void {
    const existing = this.metrics.get(metric.metricId) || [];
    existing.push(metric);

    // Keep only metrics within window
    const cutoff = Date.now() - DEFAULT_METRIC_WINDOW;
    const filtered = existing.filter(m => m.timestamp > cutoff);

    this.metrics.set(metric.metricId, filtered);
  }

  /**
   * Get aggregated metrics
   */
  getAggregated(metricId: MetricId): AggregatedMetrics | undefined {
    const metrics = this.metrics.get(metricId);
    if (!metrics || metrics.length === 0) return undefined;

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: values.length,
      sum,
      avg,
      min,
      max,
    };
  }

  /**
   * Clear
   */
  clear(): void {
    this.metrics.clear();
  }
}

/**
 * Aggregated Metrics
 */
interface AggregatedMetrics {
  readonly count: number;
  readonly sum: number;
  readonly avg: number;
  readonly min: number;
  readonly max: number;
}

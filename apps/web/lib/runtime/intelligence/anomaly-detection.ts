/**
 * CLAUX Runtime Intelligence Layer - Anomaly Detection
 * 
 * Anomaly detection intelligence.
 * No ML providers - pure semantic intelligence.
 */

import type { AnomalyDetectionResult, IntelligenceContext } from './types';
import { AnomalyDetectionError } from './errors';
import { ANOMALY_THRESHOLDS } from './constants';

/**
 * Anomaly Detection Manager
 */
export class AnomalyDetectionManager {
  private anomalies: Map<string, AnomalyDetectionResult> = new Map();
  private baselineMetrics: Map<string, BaselineMetrics> = new Map();

  /**
   * Detect anomalies
   */
  detectAnomalies(context: IntelligenceContext, currentMetrics: Record<string, number>): readonly AnomalyDetectionResult[] {
    const results: AnomalyDetectionResult[] = [];
    const baseline = this.baselineMetrics.get(context.executionId) || this.defaultBaseline();

    // Check latency anomaly
    const latencyAnomaly = this.detectLatencyAnomaly(currentMetrics.latency || 0, baseline);
    if (latencyAnomaly) {
      results.push(latencyAnomaly);
    }

    // Check error rate anomaly
    const errorRateAnomaly = this.detectErrorRateAnomaly(currentMetrics.errorRate || 0, baseline);
    if (errorRateAnomaly) {
      results.push(errorRateAnomaly);
    }

    // Check resource utilization anomaly
    const resourceAnomaly = this.detectResourceAnomaly(currentMetrics.resourceUtilization || 0, baseline);
    if (resourceAnomaly) {
      results.push(resourceAnomaly);
    }

    // Check throughput anomaly
    const throughputAnomaly = this.detectThroughputAnomaly(currentMetrics.throughput || 0, baseline);
    if (throughputAnomaly) {
      results.push(throughputAnomaly);
    }

    // Store detected anomalies
    for (const result of results) {
      this.anomalies.set(result.anomalyId, result);
    }

    return results;
  }

  /**
   * Detect latency anomaly
   */
  private detectLatencyAnomaly(current: number, baseline: BaselineMetrics): AnomalyDetectionResult | null {
    const deviation = Math.abs(current - baseline.avgLatency) / baseline.stdDevLatency;
    if (deviation > ANOMALY_THRESHOLDS.LATENCY_DEVIATION) {
      return {
        anomalyId: `anomaly_latency_${Date.now()}`,
        anomalyType: 'latency_spike',
        severity: this.calculateSeverity(deviation),
        detectedAt: Date.now(),
        context: {} as IntelligenceContext,
        metrics: { current, baseline: baseline.avgLatency, deviation },
      };
    }
    return null;
  }

  /**
   * Detect error rate anomaly
   */
  private detectErrorRateAnomaly(current: number, baseline: BaselineMetrics): AnomalyDetectionResult | null {
    if (current > ANOMALY_THRESHOLDS.ERROR_RATE_THRESHOLD) {
      return {
        anomalyId: `anomaly_error_${Date.now()}`,
        anomalyType: 'error_spike',
        severity: current > 0.2 ? 'critical' : 'high',
        detectedAt: Date.now(),
        context: {} as IntelligenceContext,
        metrics: { current, baseline: baseline.avgErrorRate },
      };
    }
    return null;
  }

  /**
   * Detect resource anomaly
   */
  private detectResourceAnomaly(current: number, baseline: BaselineMetrics): AnomalyDetectionResult | null {
    if (current > ANOMALY_THRESHOLDS.RESOURCE_UTILIZATION_THRESHOLD) {
      return {
        anomalyId: `anomaly_resource_${Date.now()}`,
        anomalyType: 'resource_exhaustion',
        severity: current > 0.95 ? 'critical' : 'high',
        detectedAt: Date.now(),
        context: {} as IntelligenceContext,
        metrics: { current, baseline: baseline.avgResourceUtilization },
      };
    }
    return null;
  }

  /**
   * Detect throughput anomaly
   */
  private detectThroughputAnomaly(current: number, baseline: BaselineMetrics): AnomalyDetectionResult | null {
    const deviation = Math.abs(current - baseline.avgThroughput) / baseline.stdDevThroughput;
    if (deviation > ANOMALY_THRESHOLDS.THROUGHPUT_DEVIATION) {
      return {
        anomalyId: `anomaly_throughput_${Date.now()}`,
        anomalyType: 'throughput_anomaly',
        severity: this.calculateSeverity(deviation),
        detectedAt: Date.now(),
        context: {} as IntelligenceContext,
        metrics: { current, baseline: baseline.avgThroughput, deviation },
      };
    }
    return null;
  }

  /**
   * Calculate severity
   */
  private calculateSeverity(deviation: number): 'low' | 'medium' | 'high' | 'critical' {
    if (deviation < 3) return 'low';
    if (deviation < 5) return 'medium';
    if (deviation < 8) return 'high';
    return 'critical';
  }

  /**
   * Update baseline
   */
  updateBaseline(executionId: string, metrics: Record<string, number>): void {
    const currentBaseline = this.baselineMetrics.get(executionId) || this.defaultBaseline();
    const updatedBaseline = this.calculateBaseline(currentBaseline, metrics);
    this.baselineMetrics.set(executionId, updatedBaseline);
  }

  /**
   * Calculate baseline
   */
  private calculateBaseline(current: BaselineMetrics, newMetrics: Record<string, number>): BaselineMetrics {
    const alpha = 0.1; // Smoothing factor

    return {
      avgLatency: current.avgLatency * (1 - alpha) + (newMetrics.latency || 0) * alpha,
      stdDevLatency: Math.abs((newMetrics.latency || 0) - current.avgLatency),
      avgErrorRate: current.avgErrorRate * (1 - alpha) + (newMetrics.errorRate || 0) * alpha,
      avgResourceUtilization: current.avgResourceUtilization * (1 - alpha) + (newMetrics.resourceUtilization || 0) * alpha,
      avgThroughput: current.avgThroughput * (1 - alpha) + (newMetrics.throughput || 0) * alpha,
      stdDevThroughput: Math.abs((newMetrics.throughput || 0) - current.avgThroughput),
    };
  }

  /**
   * Default baseline
   */
  private defaultBaseline(): BaselineMetrics {
    return {
      avgLatency: 100,
      stdDevLatency: 50,
      avgErrorRate: 0.01,
      avgResourceUtilization: 0.5,
      avgThroughput: 100,
      stdDevThroughput: 20,
    };
  }

  /**
   * Get anomaly
   */
  getAnomaly(anomalyId: string): AnomalyDetectionResult | undefined {
    return this.anomalies.get(anomalyId);
  }

  /**
   * Clear anomaly
   */
  clearAnomaly(anomalyId: string): void {
    this.anomalies.delete(anomalyId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.anomalies.clear();
    this.baselineMetrics.clear();
  }
}

/**
 * Baseline Metrics
 */
interface BaselineMetrics {
  readonly avgLatency: number;
  readonly stdDevLatency: number;
  readonly avgErrorRate: number;
  readonly avgResourceUtilization: number;
  readonly avgThroughput: number;
  readonly stdDevThroughput: number;
}

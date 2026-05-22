/**
 * Canonical Execution Health Metrics Contract
 * 
 * This contract defines the standardized execution health metrics for CLAUX.
 * All execution health tracking MUST follow this contract.
 * 
 * CRITICAL: This is the ONLY execution health metrics system allowed in CLAUX.
 */

import type { UUID } from '../types/common.types';

/**
 * Metric aggregation period
 */
export enum MetricAggregationPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Success rate metric
 */
export interface SuccessRateMetric {
  readonly period: MetricAggregationPeriod;
  readonly tenantId: UUID;
  readonly executionId?: UUID | null;
  readonly taskId?: UUID | null;
  readonly agent?: string;
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly successRate: number; // Percentage (0-100)
  readonly failureRate: number; // Percentage (0-100)
  readonly timestamp: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

/**
 * Latency metric
 */
export interface LatencyMetric {
  readonly period: MetricAggregationPeriod;
  readonly tenantId: UUID;
  readonly executionId?: UUID | null;
  readonly taskId?: UUID | null;
  readonly agent?: string;
  readonly connector?: string;
  readonly provider?: string;
  readonly minLatencyMs: number;
  readonly maxLatencyMs: number;
  readonly avgLatencyMs: number;
  readonly medianLatencyMs: number;
  readonly p50LatencyMs: number;
  readonly p90LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly timestamp: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

/**
 * Volume metric
 */
export interface VolumeMetric {
  readonly period: MetricAggregationPeriod;
  readonly tenantId: UUID;
  readonly executionId?: UUID | null;
  readonly taskId?: UUID | null;
  readonly agent?: string;
  readonly totalExecutions: number;
  readonly totalTasks: number;
  readonly totalConnectorCalls: number;
  readonly totalProviderCalls: number;
  readonly timestamp: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

/**
 * Health metric summary
 */
export interface HealthMetricSummary {
  readonly tenantId: UUID;
  readonly period: MetricAggregationPeriod;
  readonly successRate: number;
  readonly avgLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly totalExecutions: number;
  readonly totalTasks: number;
  readonly totalConnectorCalls: number;
  readonly totalProviderCalls: number;
  readonly healthScore: number; // 0-100
  readonly timestamp: string;
}

/**
 * Canonical execution health metrics contract
 */
export class ExecutionHealthMetrics {
  /**
   * Calculate success rate
   */
  static calculateSuccessRate(
    totalExecutions: number,
    successfulExecutions: number
  ): number {
    if (totalExecutions === 0) return 100;
    return (successfulExecutions / totalExecutions) * 100;
  }

  /**
   * Calculate failure rate
   */
  static calculateFailureRate(
    totalExecutions: number,
    failedExecutions: number
  ): number {
    if (totalExecutions === 0) return 0;
    return (failedExecutions / totalExecutions) * 100;
  }

  /**
   * Calculate average latency
   */
  static calculateAverageLatency(latencies: ReadonlyArray<number>): number {
    if (latencies.length === 0) return 0;
    const sum = latencies.reduce((acc, val) => acc + val, 0);
    return sum / latencies.length;
  }

  /**
   * Calculate median latency
   */
  static calculateMedianLatency(latencies: ReadonlyArray<number>): number {
    if (latencies.length === 0) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate percentile latency
   */
  static calculatePercentileLatency(latencies: ReadonlyArray<number>, percentile: number): number {
    if (latencies.length === 0) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Calculate health score
   */
  static calculateHealthScore(
    successRate: number,
    avgLatencyMs: number,
    targetLatencyMs: number = 5000
  ): number {
    // Success rate contributes 70% to health score
    const successScore = successRate * 0.7;
    
    // Latency contributes 30% to health score
    // Latency score decreases as latency increases beyond target
    const latencyRatio = Math.min(avgLatencyMs / targetLatencyMs, 2);
    const latencyScore = (1 - (latencyRatio / 2)) * 30;
    
    return Math.round(successScore + latencyScore);
  }

  /**
   * Create success rate metric
   */
  static createSuccessRateMetric(
    period: MetricAggregationPeriod,
    tenantId: UUID,
    totalExecutions: number,
    successfulExecutions: number,
    failedExecutions: number,
    periodStart: string,
    periodEnd: string,
    executionId?: UUID | null,
    taskId?: UUID | null,
    agent?: string
  ): SuccessRateMetric {
    return {
      period,
      tenantId,
      executionId,
      taskId,
      agent,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: this.calculateSuccessRate(totalExecutions, successfulExecutions),
      failureRate: this.calculateFailureRate(totalExecutions, failedExecutions),
      timestamp: new Date().toISOString(),
      periodStart,
      periodEnd,
    };
  }

  /**
   * Create latency metric
   */
  static createLatencyMetric(
    period: MetricAggregationPeriod,
    tenantId: UUID,
    latencies: ReadonlyArray<number>,
    periodStart: string,
    periodEnd: string,
    executionId?: UUID | null,
    taskId?: UUID | null,
    agent?: string,
    connector?: string,
    provider?: string
  ): LatencyMetric {
    const sorted = [...latencies].sort((a, b) => a - b);
    
    return {
      period,
      tenantId,
      executionId,
      taskId,
      agent,
      connector,
      provider,
      minLatencyMs: sorted[0] || 0,
      maxLatencyMs: sorted[sorted.length - 1] || 0,
      avgLatencyMs: this.calculateAverageLatency(latencies),
      medianLatencyMs: this.calculateMedianLatency(latencies),
      p50LatencyMs: this.calculatePercentileLatency(latencies, 50),
      p90LatencyMs: this.calculatePercentileLatency(latencies, 90),
      p95LatencyMs: this.calculatePercentileLatency(latencies, 95),
      p99LatencyMs: this.calculatePercentileLatency(latencies, 99),
      timestamp: new Date().toISOString(),
      periodStart,
      periodEnd,
    };
  }

  /**
   * Create volume metric
   */
  static createVolumeMetric(
    period: MetricAggregationPeriod,
    tenantId: UUID,
    totalExecutions: number,
    totalTasks: number,
    totalConnectorCalls: number,
    totalProviderCalls: number,
    periodStart: string,
    periodEnd: string,
    executionId?: UUID | null,
    taskId?: UUID | null,
    agent?: string
  ): VolumeMetric {
    return {
      period,
      tenantId,
      executionId,
      taskId,
      agent,
      totalExecutions,
      totalTasks,
      totalConnectorCalls,
      totalProviderCalls,
      timestamp: new Date().toISOString(),
      periodStart,
      periodEnd,
    };
  }

  /**
   * Create health metric summary
   */
  static createHealthMetricSummary(
    successRateMetric: SuccessRateMetric,
    latencyMetric: LatencyMetric,
    volumeMetric: VolumeMetric
  ): HealthMetricSummary {
    return {
      tenantId: successRateMetric.tenantId,
      period: successRateMetric.period,
      successRate: successRateMetric.successRate,
      avgLatencyMs: latencyMetric.avgLatencyMs,
      p95LatencyMs: latencyMetric.p95LatencyMs,
      totalExecutions: volumeMetric.totalExecutions,
      totalTasks: volumeMetric.totalTasks,
      totalConnectorCalls: volumeMetric.totalConnectorCalls,
      totalProviderCalls: volumeMetric.totalProviderCalls,
      healthScore: this.calculateHealthScore(
        successRateMetric.successRate,
        latencyMetric.avgLatencyMs
      ),
      timestamp: new Date().toISOString(),
    };
  }
}

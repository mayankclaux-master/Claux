/**
 * CLAUX Runtime Intelligence Layer - Failure Prediction
 * 
 * Failure prediction intelligence.
 * No ML providers - pure semantic intelligence.
 */

import type { FailurePrediction } from './types';
import { FailurePredictionError } from './errors';

/**
 * Failure Prediction Manager
 */
export class FailurePredictionManager {
  private failureHistory: Map<string, FailureHistoryEntry[]> = new Map();
  private riskFactors: Map<string, number> = new Map();

  /**
   * Predict failure probability
   */
  predictFailure(executionId: string, executionType: string, currentMetrics: Record<string, number>): FailurePrediction {
    const baseProbability = this.calculateBaseProbability(executionType);
    const riskFactor = this.calculateRiskFactor(currentMetrics);
    const adjustedProbability = Math.min(baseProbability + riskFactor, 1.0);

    const predictedFailureType = this.predictFailureType(currentMetrics);
    const recommendedMitigation = this.recommendMitigation(predictedFailureType, currentMetrics);
    const confidence = this.calculateConfidence(executionType, currentMetrics);

    return {
      executionId,
      failureProbability: adjustedProbability,
      predictedFailureType,
      recommendedMitigation,
      confidence,
    };
  }

  /**
   * Calculate base probability
   */
  private calculateBaseProbability(executionType: string): number {
    const history = this.failureHistory.get(executionType) || [];
    if (history.length === 0) return 0.05;

    const failures = history.filter(h => h.failed).length;
    return failures / history.length;
  }

  /**
   * Calculate risk factor
   */
  private calculateRiskFactor(metrics: Record<string, number>): number {
    let risk = 0;

    // High latency increases risk
    if (metrics.latency > 5000) risk += 0.2;
    else if (metrics.latency > 1000) risk += 0.1;

    // High error rate increases risk
    if (metrics.errorRate > 0.1) risk += 0.3;
    else if (metrics.errorRate > 0.05) risk += 0.15;

    // High resource utilization increases risk
    if (metrics.resourceUtilization > 0.9) risk += 0.2;
    else if (metrics.resourceUtilization > 0.8) risk += 0.1;

    return Math.min(risk, 0.8);
  }

  /**
   * Predict failure type
   */
  private predictFailureType(metrics: Record<string, number>): string {
    if (metrics.errorRate > 0.1) return 'timeout';
    if (metrics.resourceUtilization > 0.9) return 'resource_exhaustion';
    if (metrics.latency > 5000) return 'performance';
    return 'unknown';
  }

  /**
   * Recommend mitigation
   */
  private recommendMitigation(failureType: string, metrics: Record<string, number>): string {
    switch (failureType) {
      case 'timeout':
        return 'increase_timeout';
      case 'resource_exhaustion':
        return 'scale_resources';
      case 'performance':
        return 'optimize_execution';
      default:
        return 'monitor_closely';
    }
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(executionType: string, metrics: Record<string, number>): number {
    const history = this.failureHistory.get(executionType) || [];
    if (history.length < 5) return 0.4;
    if (history.length < 20) return 0.6;
    return 0.8;
  }

  /**
   * Record execution outcome
   */
  recordOutcome(executionType: string, failed: boolean, metrics: Record<string, number>): void {
    const history = this.failureHistory.get(executionType) || [];
    history.push({ failed, timestamp: Date.now(), metrics });

    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }

    this.failureHistory.set(executionType, history);
  }

  /**
   * Get failure history
   */
  getFailureHistory(executionType: string): readonly FailureHistoryEntry[] {
    return this.failureHistory.get(executionType) || [];
  }

  /**
   * Clear history
   */
  clearHistory(executionType: string): void {
    this.failureHistory.delete(executionType);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.failureHistory.clear();
    this.riskFactors.clear();
  }
}

/**
 * Failure History Entry
 */
interface FailureHistoryEntry {
  readonly failed: boolean;
  readonly timestamp: number;
  readonly metrics: Record<string, number>;
}

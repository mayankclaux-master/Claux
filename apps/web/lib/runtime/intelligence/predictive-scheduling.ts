/**
 * CLAUX Runtime Intelligence Layer - Predictive Scheduling
 * 
 * Predictive scheduling intelligence.
 * No ML providers - pure semantic intelligence.
 */

import type { SchedulingPrediction, ResourceAllocation } from './types';
import { PredictiveSchedulingError } from './errors';
import { PREDICTION_HORIZONS } from './constants';

/**
 * Predictive Scheduling Manager
 */
export class PredictiveSchedulingManager {
  private executionHistory: Map<string, ExecutionHistoryEntry[]> = new Map();
  private resourceHistory: Map<string, ResourceAllocation[]> = new Map();

  /**
   * Predict execution duration
   */
  predictDuration(executionId: string, executionType: string): number {
    const history = this.executionHistory.get(executionType) || [];
    if (history.length === 0) return 30000; // Default 30 seconds

    const avgDuration = history.reduce((sum, h) => sum + h.duration, 0) / history.length;
    return avgDuration;
  }

  /**
   * Predict resource usage
   */
  predictResourceUsage(executionId: string, executionType: string): ResourceAllocation {
    const history = this.resourceHistory.get(executionType) || [];
    if (history.length === 0) {
      return { cpu: 1.0, memory: 4.0, concurrency: 4, bandwidth: 100 };
    }

    const avgCpu = history.reduce((sum, h) => sum + h.cpu, 0) / history.length;
    const avgMemory = history.reduce((sum, h) => sum + h.memory, 0) / history.length;
    const avgConcurrency = Math.round(history.reduce((sum, h) => sum + h.concurrency, 0) / history.length);
    const avgBandwidth = history.reduce((sum, h) => sum + h.bandwidth, 0) / history.length;

    return {
      cpu: avgCpu,
      memory: avgMemory,
      concurrency: avgConcurrency,
      bandwidth: avgBandwidth,
    };
  }

  /**
   * Generate scheduling prediction
   */
  generatePrediction(executionId: string, executionType: string, availableWorkers: readonly string[]): SchedulingPrediction {
    const predictedDuration = this.predictDuration(executionId, executionType);
    const predictedResourceUsage = this.predictResourceUsage(executionId, executionType);
    const confidence = this.calculateConfidence(executionType);
    const recommendedWorker = this.selectBestWorker(predictedResourceUsage, availableWorkers);

    return {
      executionId,
      predictedDuration,
      predictedResourceUsage,
      confidence,
      recommendedWorker,
    };
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(executionType: string): number {
    const history = this.executionHistory.get(executionType) || [];
    if (history.length === 0) return 0.3;
    if (history.length < 5) return 0.5;
    if (history.length < 20) return 0.7;
    return 0.9;
  }

  /**
   * Select best worker
   */
  private selectBestWorker(resourceUsage: ResourceAllocation, availableWorkers: readonly string[]): string {
    // Simple round-robin for now - would use actual worker metrics in production
    return availableWorkers[0] || 'default-worker';
  }

  /**
   * Record execution history
   */
  recordExecution(executionType: string, duration: number, resourceUsage: ResourceAllocation): void {
    const history = this.executionHistory.get(executionType) || [];
    history.push({ duration, timestamp: Date.now() });

    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }

    this.executionHistory.set(executionType, history);

    const resourceHistory = this.resourceHistory.get(executionType) || [];
    resourceHistory.push(resourceUsage);

    if (resourceHistory.length > 100) {
      resourceHistory.shift();
    }

    this.resourceHistory.set(executionType, resourceHistory);
  }

  /**
   * Get execution history
   */
  getExecutionHistory(executionType: string): readonly ExecutionHistoryEntry[] {
    return this.executionHistory.get(executionType) || [];
  }

  /**
   * Clear history
   */
  clearHistory(executionType: string): void {
    this.executionHistory.delete(executionType);
    this.resourceHistory.delete(executionType);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.executionHistory.clear();
    this.resourceHistory.clear();
  }
}

/**
 * Execution History Entry
 */
interface ExecutionHistoryEntry {
  readonly duration: number;
  readonly timestamp: number;
}

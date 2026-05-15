/**
 * CLAUX Runtime Intelligence Layer - Resource Optimization
 * 
 * Resource optimization intelligence.
 * No ML providers - pure semantic intelligence.
 */

import type { ResourceOptimization, ResourceAllocation } from './types';
import { ResourceOptimizationError } from './errors';

/**
 * Resource Optimization Manager
 */
export class ResourceOptimizationManager {
  private optimizationHistory: Map<string, ResourceOptimization[]> = new Map();

  /**
   * Generate optimization recommendation
   */
  generateOptimization(currentAllocation: ResourceAllocation, currentMetrics: Record<string, number>): ResourceOptimization {
    const recommendedAllocation = this.calculateOptimalAllocation(currentAllocation, currentMetrics);
    const expectedImprovement = this.calculateExpectedImprovement(currentAllocation, recommendedAllocation, currentMetrics);
    const confidence = this.calculateConfidence(currentMetrics);

    return {
      currentAllocation,
      recommendedAllocation,
      expectedImprovement,
      confidence,
    };
  }

  /**
   * Calculate optimal allocation
   */
  private calculateOptimalAllocation(current: ResourceAllocation, metrics: Record<string, number>): ResourceAllocation {
    const utilization = metrics.resourceUtilization || 0.5;
    const latency = metrics.latency || 100;

    // Scale up if high utilization or high latency
    if (utilization > 0.8 || latency > 1000) {
      return {
        cpu: Math.min(current.cpu * 1.5, 4.0),
        memory: Math.min(current.memory * 1.5, 16.0),
        concurrency: Math.min(Math.floor(current.concurrency * 1.5), 16),
        bandwidth: Math.min(current.bandwidth * 1.5, 1000),
      };
    }

    // Scale down if low utilization
    if (utilization < 0.3) {
      return {
        cpu: Math.max(current.cpu * 0.7, 0.5),
        memory: Math.max(current.memory * 0.7, 1.0),
        concurrency: Math.max(Math.floor(current.concurrency * 0.7), 1),
        bandwidth: Math.max(current.bandwidth * 0.7, 10),
      };
    }

    return { ...current };
  }

  /**
   * Calculate expected improvement
   */
  private calculateExpectedImprovement(current: ResourceAllocation, recommended: ResourceAllocation, metrics: Record<string, number>): number {
    const utilizationImprovement = (metrics.resourceUtilization || 0.5) - (metrics.resourceUtilization || 0.5) * 0.2;
    const latencyImprovement = (metrics.latency || 100) * 0.15;
    return (utilizationImprovement + latencyImprovement) / 100;
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(metrics: Record<string, number>): number {
    const utilization = metrics.resourceUtilization || 0.5;
    const latency = metrics.latency || 100;

    // Higher confidence for clear optimization opportunities
    if (utilization > 0.8 || utilization < 0.3) return 0.8;
    if (latency > 1000) return 0.7;
    return 0.5;
  }

  /**
   * Record optimization
   */
  recordOptimization(executionId: string, optimization: ResourceOptimization): void {
    const history = this.optimizationHistory.get(executionId) || [];
    history.push(optimization);

    // Keep only last 50 entries
    if (history.length > 50) {
      history.shift();
    }

    this.optimizationHistory.set(executionId, history);
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(executionId: string): readonly ResourceOptimization[] {
    return this.optimizationHistory.get(executionId) || [];
  }

  /**
   * Clear history
   */
  clearHistory(executionId: string): void {
    this.optimizationHistory.delete(executionId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.optimizationHistory.clear();
  }
}

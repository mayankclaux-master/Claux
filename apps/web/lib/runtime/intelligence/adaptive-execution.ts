/**
 * CLAUX Runtime Intelligence Layer - Adaptive Execution
 * 
 * Adaptive execution optimization.
 * No ML providers - pure semantic intelligence.
 */

import type { AdaptiveExecutionState, IntelligenceContext, ResourceAllocation, PerformanceMetrics } from './types';
import { AdaptiveExecutionError } from './errors';
import { DEFAULT_ADAPTIVE_STRATEGY, OPTIMIZATION_LEVELS } from './constants';

/**
 * Adaptive Execution Manager
 */
export class AdaptiveExecutionManager {
  private states: Map<string, AdaptiveExecutionState> = new Map();

  /**
   * Initialize adaptive execution
   */
  initializeAdaptiveExecution(executionId: string, strategy: string = DEFAULT_ADAPTIVE_STRATEGY): AdaptiveExecutionState {
    const state: AdaptiveExecutionState = {
      executionId,
      adaptiveStrategy: strategy,
      optimizationLevel: OPTIMIZATION_LEVELS.BALANCED,
      resourceAllocation: this.defaultResourceAllocation(),
      performanceMetrics: this.defaultPerformanceMetrics(),
    };

    this.states.set(executionId, state);
    return state;
  }

  /**
   * Get adaptive execution state
   */
  getAdaptiveState(executionId: string): AdaptiveExecutionState | undefined {
    return this.states.get(executionId);
  }

  /**
   * Adjust optimization level
   */
  adjustOptimizationLevel(executionId: string, newLevel: number): void {
    const state = this.states.get(executionId);
    if (!state) {
      throw new AdaptiveExecutionError(`Execution ${executionId} not found`);
    }

    const updatedState: AdaptiveExecutionState = {
      ...state,
      optimizationLevel: newLevel,
      resourceAllocation: this.adjustResourcesForLevel(newLevel),
    };

    this.states.set(executionId, updatedState);
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(executionId: string, metrics: PerformanceMetrics): void {
    const state = this.states.get(executionId);
    if (!state) return;

    const updatedState: AdaptiveExecutionState = {
      ...state,
      performanceMetrics: metrics,
    };

    this.states.set(executionId, updatedState);
  }

  /**
   * Optimize based on metrics
   */
  optimizeBasedOnMetrics(executionId: string): AdaptiveExecutionState | undefined {
    const state = this.states.get(executionId);
    if (!state) return undefined;

    const newLevel = this.calculateOptimizationLevel(state.performanceMetrics);
    this.adjustOptimizationLevel(executionId, newLevel);

    return this.states.get(executionId);
  }

  /**
   * Calculate optimization level
   */
  private calculateOptimizationLevel(metrics: PerformanceMetrics): number {
    if (metrics.errorRate > 0.1) return OPTIMIZATION_LEVELS.CONSERVATIVE;
    if (metrics.latency < 100 && metrics.resourceUtilization < 0.5) return OPTIMIZATION_LEVELS.AGGRESSIVE;
    if (metrics.latency < 500 && metrics.resourceUtilization < 0.7) return OPTIMIZATION_LEVELS.BALANCED;
    return OPTIMIZATION_LEVELS.MINIMAL;
  }

  /**
   * Adjust resources for level
   */
  private adjustResourcesForLevel(level: number): ResourceAllocation {
    const multiplier = level / OPTIMIZATION_LEVELS.BALANCED;
    const base = this.defaultResourceAllocation();

    return {
      cpu: Math.min(base.cpu * multiplier, 4.0),
      memory: Math.min(base.memory * multiplier, 16.0),
      concurrency: Math.floor(base.concurrency * multiplier),
      bandwidth: Math.min(base.bandwidth * multiplier, 1000),
    };
  }

  /**
   * Default resource allocation
   */
  private defaultResourceAllocation(): ResourceAllocation {
    return {
      cpu: 1.0,
      memory: 4.0,
      concurrency: 4,
      bandwidth: 100,
    };
  }

  /**
   * Default performance metrics
   */
  private defaultPerformanceMetrics(): PerformanceMetrics {
    return {
      latency: 0,
      throughput: 0,
      errorRate: 0,
      resourceUtilization: 0,
    };
  }

  /**
   * Clear state
   */
  clearState(executionId: string): void {
    this.states.delete(executionId);
  }

  /**
   * Clear all states
   */
  clear(): void {
    this.states.clear();
  }
}

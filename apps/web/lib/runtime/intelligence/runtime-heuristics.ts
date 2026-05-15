/**
 * CLAUX Runtime Intelligence Layer - Runtime Heuristics
 * 
 * Runtime heuristic evaluation.
 * No ML providers - pure semantic intelligence.
 */

import type { RuntimeHeuristic, HeuristicCondition, HeuristicAction, IntelligenceContext } from './types';
import { HeuristicEvaluationError } from './errors';
import { HEURISTIC_WEIGHTS } from './constants';

/**
 * Runtime Heuristic Manager
 */
export class RuntimeHeuristicManager {
  private heuristics: Map<string, RuntimeHeuristic> = new Map();
  private metrics: Map<string, number> = new Map();

  /**
   * Register heuristic
   */
  registerHeuristic(heuristic: RuntimeHeuristic): void {
    this.heuristics.set(heuristic.heuristicId, heuristic);
  }

  /**
   * Evaluate heuristics
   */
  evaluateHeuristics(context: IntelligenceContext): readonly HeuristicAction[] {
    const actions: HeuristicAction[] = [];

    for (const heuristic of this.heuristics.values()) {
      if (this.evaluateHeuristic(heuristic, context)) {
        actions.push(...heuristic.actions);
      }
    }

    return this.sortActionsByWeight(actions);
  }

  /**
   * Evaluate single heuristic
   */
  private evaluateHeuristic(heuristic: RuntimeHeuristic, context: IntelligenceContext): boolean {
    for (const condition of heuristic.conditions) {
      if (!this.evaluateCondition(condition)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: HeuristicCondition): boolean {
    const value = this.metrics.get(condition.metric);
    if (value === undefined) return false;

    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold;
      case 'lt':
        return value < condition.threshold;
      case 'eq':
        return value === condition.threshold;
      case 'gte':
        return value >= condition.threshold;
      case 'lte':
        return value <= condition.threshold;
      default:
        return false;
    }
  }

  /**
   * Sort actions by weight
   */
  private sortActionsByWeight(actions: readonly HeuristicAction[]): HeuristicAction[] {
    return [...actions].sort((a, b) => {
      const weightA = this.getActionWeight(a);
      const weightB = this.getActionWeight(b);
      return weightB - weightA;
    });
  }

  /**
   * Get action weight
   */
  private getActionWeight(action: HeuristicAction): number {
    switch (action.type) {
      case 'optimize':
        return HEURISTIC_WEIGHTS.PERFORMANCE;
      case 'allocate':
        return HEURISTIC_WEIGHTS.RESOURCE;
      case 'stabilize':
        return HEURISTIC_WEIGHTS.STABILITY;
      case 'reduce_cost':
        return HEURISTIC_WEIGHTS.COST;
      default:
        return 0.5;
    }
  }

  /**
   * Update metric
   */
  updateMetric(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }

  /**
   * Get metric
   */
  getMetric(metric: string): number | undefined {
    return this.metrics.get(metric);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Clear heuristics
   */
  clearHeuristics(): void {
    this.heuristics.clear();
  }
}

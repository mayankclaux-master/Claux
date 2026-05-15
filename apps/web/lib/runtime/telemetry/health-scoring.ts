/**
 * CLAUX Runtime Telemetry Layer - Health Scoring
 */

import type { HealthScore, HealthFactor } from './types';
import { HEALTH_SCORE_THRESHOLDS } from './constants';

/**
 * Health Scoring Manager
 */
export class HealthScoringManager {
  private factors: Map<string, HealthFactor> = new Map();

  /**
   * Update factor
   */
  updateFactor(name: string, weight: number, value: number): void {
    const factor: HealthFactor = { name, weight, value };
    this.factors.set(name, factor);
  }

  /**
   * Calculate health score
   */
  calculateHealthScore(): HealthScore {
    const factors = Array.from(this.factors.values());
    if (factors.length === 0) {
      return {
        score: 1,
        status: 'healthy',
        factors: [],
      };
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const factor of factors) {
      weightedSum += factor.value * factor.weight;
      totalWeight += factor.weight;
    }

    const score = totalWeight > 0 ? weightedSum / totalWeight : 1;
    const status = this.determineStatus(score);

    return {
      score,
      status,
      factors,
    };
  }

  /**
   * Determine status
   */
  private determineStatus(score: number): 'healthy' | 'degraded' | 'unhealthy' {
    if (score >= HEALTH_SCORE_THRESHOLDS.HEALTHY) return 'healthy';
    if (score >= HEALTH_SCORE_THRESHOLDS.DEGRADED) return 'degraded';
    return 'unhealthy';
  }

  /**
   * Clear
   */
  clear(): void {
    this.factors.clear();
  }
}

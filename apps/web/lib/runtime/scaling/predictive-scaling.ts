/**
 * CLAUX Runtime Scaling Layer - Predictive Scaling
 */

import type { ScalePrediction, ScaleDecision } from './types';
import { PredictiveScalingError } from './errors';
import { DEFAULT_SCALE_UP_THRESHOLD, DEFAULT_SCALE_DOWN_THRESHOLD, DEFAULT_PREDICTION_HORIZON } from './constants';

/**
 * Predictive Scaling Manager
 */
export class PredictiveScalingManager {
  private history: number[] = [];

  /**
   * Predict scale
   */
  predict(currentLoad: number): ScalePrediction {
    this.history.push(currentLoad);
    if (this.history.length > 100) this.history.shift();

    const avgLoad = this.history.reduce((a, b) => a + b, 0) / this.history.length;
    const trend = this.calculateTrend();
    const predictedLoad = avgLoad + trend;
    const recommendedWorkers = Math.ceil(predictedLoad * 2);
    const confidence = this.calculateConfidence();

    return {
      predictedLoad,
      recommendedWorkers,
      confidence,
      horizon: DEFAULT_PREDICTION_HORIZON,
    };
  }

  /**
   * Make scale decision
   */
  makeDecision(currentLoad: number, currentWorkers: number): ScaleDecision {
    if (currentLoad > DEFAULT_SCALE_UP_THRESHOLD) {
      return {
        action: 'scale_up',
        targetWorkers: Math.min(currentWorkers + 2, 16),
        reason: 'Load above threshold',
      };
    }

    if (currentLoad < DEFAULT_SCALE_DOWN_THRESHOLD && currentWorkers > 1) {
      return {
        action: 'scale_down',
        targetWorkers: Math.max(currentWorkers - 1, 1),
        reason: 'Load below threshold',
      };
    }

    return {
      action: 'no_change',
      targetWorkers: currentWorkers,
      reason: 'Load within normal range',
    };
  }

  /**
   * Calculate trend
   */
  private calculateTrend(): number {
    if (this.history.length < 2) return 0;

    const recent = this.history.slice(-10);
    const older = this.history.slice(-20, -10);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return recentAvg - olderAvg;
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(): number {
    if (this.history.length < 10) return 0.3;
    if (this.history.length < 50) return 0.6;
    return 0.8;
  }

  /**
   * Clear
   */
  clear(): void {
    this.history = [];
  }
}

/**
 * CLAUX Runtime Scaling Layer - Queue Scaling
 */

import type { ScaleDecision } from './types';

/**
 * Queue Scaling Manager
 */
export class QueueScalingManager {
  private queueDepth: number = 0;
  private processingRate: number = 0;

  /**
   * Update queue metrics
   */
  updateMetrics(depth: number, rate: number): void {
    this.queueDepth = depth;
    this.processingRate = rate;
  }

  /**
   * Calculate scale decision
   */
  calculateDecision(currentWorkers: number): ScaleDecision {
    const depthPerWorker = this.queueDepth / currentWorkers;

    if (depthPerWorker > 10) {
      return {
        action: 'scale_up',
        targetWorkers: Math.min(currentWorkers + 2, 16),
        reason: 'Queue depth per worker too high',
      };
    }

    if (depthPerWorker < 2 && currentWorkers > 1) {
      return {
        action: 'scale_down',
        targetWorkers: Math.max(currentWorkers - 1, 1),
        reason: 'Queue depth per worker low',
      };
    }

    return {
      action: 'no_change',
      targetWorkers: currentWorkers,
      reason: 'Queue depth normal',
    };
  }

  /**
   * Clear
   */
  clear(): void {
    this.queueDepth = 0;
    this.processingRate = 0;
  }
}

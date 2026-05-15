/**
 * CLAUX Runtime Scaling Layer - Scale Stabilization
 */

import type { ScaleDecision } from './types';
import { DEFAULT_STABILIZATION_WINDOW } from './constants';

/**
 * Scale Stabilization Manager
 */
export class ScaleStabilizationManager {
  private decisions: ScaleDecision[] = [];
  private lastScaleTime: number = 0;

  /**
   * Stabilize decision
   */
  stabilize(decision: ScaleDecision): ScaleDecision {
    const now = Date.now();
    const timeSinceLastScale = now - this.lastScaleTime;

    if (timeSinceLastScale < DEFAULT_STABILIZATION_WINDOW) {
      // Return last decision if within stabilization window
      if (this.decisions.length > 0) {
        return this.decisions[this.decisions.length - 1];
      }
    }

    this.decisions.push(decision);
    this.lastScaleTime = now;

    // Keep only last 10 decisions
    if (this.decisions.length > 10) {
      this.decisions.shift();
    }

    return decision;
  }

  /**
   * Get recent decisions
   */
  getRecentDecisions(count: number = 5): readonly ScaleDecision[] {
    return this.decisions.slice(-count);
  }

  /**
   * Clear
   */
  clear(): void {
    this.decisions = [];
    this.lastScaleTime = 0;
  }
}

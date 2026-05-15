/**
 * CLAUX Runtime Scaling Layer - Backpressure Propagation
 */

import type { WorkerId } from './types';
import { BackpressureError } from './errors';

/**
 * Backpressure Signal
 */
export interface BackpressureSignal {
  readonly workerId: WorkerId;
  readonly pressure: number;
  readonly timestamp: number;
}

/**
 * Backpressure Propagation Manager
 */
export class BackpressurePropagationManager {
  private signals: Map<WorkerId, BackpressureSignal> = new Map();
  private threshold: number = 0.8;

  /**
   * Set threshold
   */
  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  /**
   * Report signal
   */
  report(workerId: WorkerId, pressure: number): void {
    const signal: BackpressureSignal = {
      workerId,
      pressure,
      timestamp: Date.now(),
    };
    this.signals.set(workerId, signal);
  }

  /**
   * Check backpressure
   */
  check(workerId: WorkerId): boolean {
    const signal = this.signals.get(workerId);
    if (!signal) return false;
    return signal.pressure > this.threshold;
  }

  /**
   * Get aggregate pressure
   */
  getAggregatePressure(): number {
    const signals = Array.from(this.signals.values());
    if (signals.length === 0) return 0;
    return signals.reduce((sum, s) => sum + s.pressure, 0) / signals.length;
  }

  /**
   * Clear
   */
  clear(): void {
    this.signals.clear();
  }
}

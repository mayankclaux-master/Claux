/**
 * CLAUX Runtime Simulation Layer - Time Travel
 */

import { DEFAULT_TIME_TRAVEL_STEP } from './constants';

/**
 * Time Travel Manager
 */
export class TimeTravelManager {
  private currentTime: number = Date.now();
  private checkpoints: Map<number, Record<string, unknown>> = new Map();

  /**
   * Travel to time
   */
  travelTo(timestamp: number): void {
    this.currentTime = timestamp;
  }

  /**
   * Step forward
   */
  stepForward(): void {
    this.currentTime += DEFAULT_TIME_TRAVEL_STEP;
  }

  /**
   * Step backward
   */
  stepBackward(): void {
    this.currentTime -= DEFAULT_TIME_TRAVEL_STEP;
  }

  /**
   * Create checkpoint
   */
  createCheckpoint(state: Record<string, unknown>): void {
    this.checkpoints.set(this.currentTime, state);
  }

  /**
   * Restore checkpoint
   */
  restoreCheckpoint(timestamp: number): Record<string, unknown> | undefined {
    return this.checkpoints.get(timestamp);
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Clear
   */
  clear(): void {
    this.currentTime = Date.now();
    this.checkpoints.clear();
  }
}

/**
 * CLAUX Runtime Testing Layer - Worker Crash
 */

import type { ChaosTestResult, ChaosTestId } from './types';

/**
 * Worker Crash Manager
 */
export class WorkerCrashManager {
  private crashedWorkers: Map<string, number> = new Map();

  /**
   * Crash worker
   */
  crash(workerId: string): ChaosTestId {
    const testId = `crash_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.crashedWorkers.set(workerId, Date.now());
    return testId;
  }

  /**
   * Recover worker
   */
  recover(workerId: string): boolean {
    const crashTime = this.crashedWorkers.get(workerId);
    if (!crashTime) return false;

    this.crashedWorkers.delete(workerId);
    return true;
  }

  /**
   * Is crashed
   */
  isCrashed(workerId: string): boolean {
    return this.crashedWorkers.has(workerId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.crashedWorkers.clear();
  }
}

/**
 * CLAUX Runtime Hardening Layer - Stalled Execution
 */

import type { HardeningCheckResult, HardeningId } from './types';

/**
 * Stalled Execution Detection Manager
 */
export class StalledExecutionManager {
  private checks: Map<string, HardeningCheckResult> = new Map();
  private executionTimestamps: Map<string, number> = new Map();

  /**
   * Detect stalled execution
   */
  detect(executionId: string, timeoutMs: number): HardeningCheckResult {
    const hardeningId = this.generateHardeningId();

    // Track execution
    const now = Date.now();
    const startTime = this.executionTimestamps.get(executionId) || now;
    this.executionTimestamps.set(executionId, startTime);

    // Simulate stall detection
    const elapsed = now - startTime;
    const stalled = elapsed > timeoutMs;
    const details = stalled ? ['Execution stalled'] : [`Execution running (${elapsed}ms)`];

    const result: HardeningCheckResult = {
      hardeningId,
      checkType: 'stalled-execution',
      passed: !stalled,
      details,
      timestamp: Date.now(),
    };

    this.checks.set(hardeningId, result);
    return result;
  }

  /**
   * Get check
   */
  getCheck(hardeningId: string): HardeningCheckResult | undefined {
    return this.checks.get(hardeningId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.checks.clear();
    this.executionTimestamps.clear();
  }

  /**
   * Generate hardening ID
   */
  private generateHardeningId(): HardeningId {
    return `hardening_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

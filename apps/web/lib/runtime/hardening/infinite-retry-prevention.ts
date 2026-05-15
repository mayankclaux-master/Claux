/**
 * CLAUX Runtime Hardening Layer - Infinite Retry Prevention
 */

import type { HardeningCheckResult, HardeningId } from './types';

/**
 * Infinite Retry Prevention Manager
 */
export class InfiniteRetryPreventionManager {
  private checks: Map<string, HardeningCheckResult> = new Map();
  private retryCounters: Map<string, number> = new Map();

  /**
   * Prevent infinite retry
   */
  check(operationId: string, maxRetries: number): HardeningCheckResult {
    const hardeningId = this.generateHardeningId();

    // Track retry count
    const count = (this.retryCounters.get(operationId) || 0) + 1;
    this.retryCounters.set(operationId, count);

    // Simulate infinite retry prevention
    const infinite = count > maxRetries;
    const details = infinite ? ['Infinite retry prevented'] : [`Retry ${count}/${maxRetries}`];

    const result: HardeningCheckResult = {
      hardeningId,
      checkType: 'infinite-retry',
      passed: !infinite,
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
    this.retryCounters.clear();
  }

  /**
   * Generate hardening ID
   */
  private generateHardeningId(): HardeningId {
    return `hardening_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

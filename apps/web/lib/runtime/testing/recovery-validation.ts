/**
 * CLAUX Runtime Testing Layer - Recovery Validation
 */

import type { ChaosTestResult } from './types';
import { RecoveryValidationError } from './errors';
import { DEFAULT_RECOVERY_TIMEOUT } from './constants';

/**
 * Recovery Validation Manager
 */
export class RecoveryValidationManager {
  private results: Map<string, ChaosTestResult> = new Map();

  /**
   * Record result
   */
  record(result: ChaosTestResult): void {
    this.results.set(result.testId, result);
  }

  /**
   * Validate recovery
   */
  validate(testId: string): boolean {
    const result = this.results.get(testId);
    if (!result) return false;

    // Validate recovery time
    if (result.recoveryTime > DEFAULT_RECOVERY_TIMEOUT) {
      return false;
    }

    // Validate success
    return result.success;
  }

  /**
   * Get result
   */
  getResult(testId: string): ChaosTestResult | undefined {
    return this.results.get(testId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.results.clear();
  }
}

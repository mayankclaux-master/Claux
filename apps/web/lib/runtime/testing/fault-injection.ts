/**
 * CLAUX Runtime Testing Layer - Fault Injection
 */

import type { FaultScenario, ChaosTestId } from './types';
import { ChaosTestError } from './errors';
import { DEFAULT_FAULT_DURATION } from './constants';

/**
 * Fault Injection Manager
 */
export class FaultInjectionManager {
  private activeFaults: Map<ChaosTestId, FaultScenario> = new Map();

  /**
   * Inject fault
   */
  inject(scenario: FaultScenario): ChaosTestId {
    const testId = this.generateTestId();
    this.activeFaults.set(testId, scenario);
    return testId;
  }

  /**
   * Resolve fault
   */
  resolve(testId: ChaosTestId): void {
    this.activeFaults.delete(testId);
  }

  /**
   * Get active fault
   */
  getActive(testId: ChaosTestId): FaultScenario | undefined {
    return this.activeFaults.get(testId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.activeFaults.clear();
  }

  /**
   * Generate test ID
   */
  private generateTestId(): ChaosTestId {
    return `chaos_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

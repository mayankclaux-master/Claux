/**
 * CLAUX Runtime Testing Layer - Chaos Contracts
 */

import type { ChaosTestResult, FaultScenario } from './types';

/**
 * Chaos Test Contract
 */
export interface ChaosTestContract {
  readonly execute: (scenario: FaultScenario) => Promise<ChaosTestResult>;
  readonly validate: (result: ChaosTestResult) => boolean;
}

/**
 * Recovery Contract
 */
export interface RecoveryContract {
  readonly recover: (testId: string) => Promise<boolean>;
  readonly validate: (testId: string) => boolean;
}

/**
 * CLAUX Runtime Testing Layer - Types
 */

export type TestId = string;
export type ChaosTestId = string;

/**
 * Chaos Test Result
 */
export interface ChaosTestResult {
  readonly testId: ChaosTestId;
  readonly timestamp: number;
  readonly success: boolean;
  readonly recoveryTime: number;
  readonly metrics: Record<string, number>;
}

/**
 * Fault Scenario
 */
export interface FaultScenario {
  readonly scenarioId: string;
  readonly type: 'worker_crash' | 'network_partition' | 'delayed_events' | 'corruption';
  readonly severity: 'low' | 'medium' | 'high';
}

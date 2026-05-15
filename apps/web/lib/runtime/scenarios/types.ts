/**
 * CLAUX Runtime Scenarios Layer - Types
 */

export type ScenarioId = string;
export type ExecutionId = string;

/**
 * Scenario Result
 */
export interface ScenarioResult {
  readonly scenarioId: ScenarioId;
  readonly executionId: ExecutionId;
  readonly success: boolean;
  readonly duration: number;
  readonly telemetry: Record<string, unknown>;
  readonly checkpoints: readonly string[];
  readonly replayHistory: readonly string[];
  readonly timestamp: number;
}

/**
 * Scenario Definition
 */
export interface ScenarioDefinition {
  readonly scenarioId: ScenarioId;
  readonly name: string;
  readonly description: string;
  readonly type: 'sequential' | 'parallel' | 'fan-out-fan-in' | 'retry' | 'recovery' | 'checkpoint-restore' | 'distributed-worker' | 'long-running' | 'event-driven' | 'multi-tenant' | 'high-concurrency' | 'failure-cascade' | 'replay-validation' | 'governance-rejection' | 'chaos-recovery';
}

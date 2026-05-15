/**
 * CLAUX Runtime Simulation Layer - Types
 */

export type SimulationId = string;
export type ScenarioId = string;

/**
 * Simulation Result
 */
export interface SimulationResult {
  readonly simulationId: SimulationId;
  readonly timestamp: number;
  readonly success: boolean;
  readonly metrics: Record<string, number>;
}

/**
 * Dry Run Result
 */
export interface DryRunResult {
  readonly executionId: string;
  readonly predictedDuration: number;
  readonly predictedResourceUsage: number;
  readonly warnings: readonly string[];
}

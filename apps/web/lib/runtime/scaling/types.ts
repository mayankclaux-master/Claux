/**
 * CLAUX Runtime Scaling Layer - Types
 */

export type WorkerId = string;
export type ScalePolicyId = string;

/**
 * Scale Prediction
 */
export interface ScalePrediction {
  readonly predictedLoad: number;
  readonly recommendedWorkers: number;
  readonly confidence: number;
  readonly horizon: number;
}

/**
 * Scale Decision
 */
export interface ScaleDecision {
  readonly action: 'scale_up' | 'scale_down' | 'no_change';
  readonly targetWorkers: number;
  readonly reason: string;
}

/**
 * Worker Affinity
 */
export interface WorkerAffinity {
  readonly workerId: WorkerId;
  readonly affinity: Map<string, number>;
}

/**
 * Workload Distribution
 */
export interface WorkloadDistribution {
  readonly workerId: WorkerId;
  readonly load: number;
  readonly capacity: number;
}

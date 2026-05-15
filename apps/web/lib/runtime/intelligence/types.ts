/**
 * CLAUX Runtime Intelligence Layer - Types
 * 
 * Type definitions for runtime intelligence.
 */

export type IntelligenceId = string;
export type HeuristicId = string;
export type PatternId = string;
export type RecommendationId = string;
export type AnomalyId = string;

/**
 * Intelligence Context
 */
export interface IntelligenceContext {
  readonly executionId: string;
  readonly timestamp: number;
  readonly resourceId?: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Adaptive Execution State
 */
export interface AdaptiveExecutionState {
  readonly executionId: string;
  readonly adaptiveStrategy: string;
  readonly optimizationLevel: number;
  readonly resourceAllocation: ResourceAllocation;
  readonly performanceMetrics: PerformanceMetrics;
}

/**
 * Resource Allocation
 */
export interface ResourceAllocation {
  readonly cpu: number;
  readonly memory: number;
  readonly concurrency: number;
  readonly bandwidth: number;
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  readonly latency: number;
  readonly throughput: number;
  readonly errorRate: number;
  readonly resourceUtilization: number;
}

/**
 * Runtime Heuristic
 */
export interface RuntimeHeuristic {
  readonly heuristicId: HeuristicId;
  readonly name: string;
  readonly description: string;
  readonly weight: number;
  readonly conditions: HeuristicCondition[];
  readonly actions: HeuristicAction[];
}

/**
 * Heuristic Condition
 */
export interface HeuristicCondition {
  readonly metric: string;
  readonly operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  readonly threshold: number;
}

/**
 * Heuristic Action
 */
export interface HeuristicAction {
  readonly type: string;
  readonly parameters: Record<string, unknown>;
}

/**
 * Dynamic Retry Configuration
 */
export interface DynamicRetryConfiguration {
  readonly baseDelay: number;
  readonly maxDelay: number;
  readonly backoffMultiplier: number;
  readonly jitterEnabled: boolean;
  readonly adaptiveDelay: boolean;
}

/**
 * Predictive Scheduling Prediction
 */
export interface SchedulingPrediction {
  readonly executionId: string;
  readonly predictedDuration: number;
  readonly predictedResourceUsage: ResourceAllocation;
  readonly confidence: number;
  readonly recommendedWorker: string;
}

/**
 * Failure Prediction
 */
export interface FailurePrediction {
  readonly executionId: string;
  readonly failureProbability: number;
  readonly predictedFailureType: string;
  readonly recommendedMitigation: string;
  readonly confidence: number;
}

/**
 * Anomaly Detection Result
 */
export interface AnomalyDetectionResult {
  readonly anomalyId: AnomalyId;
  readonly anomalyType: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly detectedAt: number;
  readonly context: IntelligenceContext;
  readonly metrics: Record<string, number>;
}

/**
 * Resource Optimization Recommendation
 */
export interface ResourceOptimization {
  readonly currentAllocation: ResourceAllocation;
  readonly recommendedAllocation: ResourceAllocation;
  readonly expectedImprovement: number;
  readonly confidence: number;
}

/**
 * Hot Path Detection Result
 */
export interface HotPathDetectionResult {
  readonly pathId: string;
  readonly frequency: number;
  readonly avgDuration: number;
  readonly optimizationPotential: number;
}

/**
 * Execution Pattern
 */
export interface ExecutionPattern {
  readonly patternId: PatternId;
  readonly patternType: string;
  readonly characteristics: Record<string, unknown>;
  readonly frequency: number;
  readonly lastSeen: number;
}

/**
 * Recommendation
 */
export interface Recommendation {
  readonly recommendationId: RecommendationId;
  readonly type: string;
  readonly priority: 'low' | 'medium' | 'high';
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly estimatedImpact: number;
  readonly confidence: number;
}

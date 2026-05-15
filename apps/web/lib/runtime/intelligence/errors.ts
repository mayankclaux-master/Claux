/**
 * CLAUX Runtime Intelligence Layer - Errors
 * 
 * Custom error classes for intelligence operations.
 */

/**
 * Base Intelligence Error
 */
export class IntelligenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntelligenceError';
  }
}

/**
 * Adaptive Execution Error
 */
export class AdaptiveExecutionError extends IntelligenceError {
  constructor(message: string) {
    super(message);
    this.name = 'AdaptiveExecutionError';
  }
}

/**
 * Heuristic Evaluation Error
 */
export class HeuristicEvaluationError extends IntelligenceError {
  constructor(message: string) {
    super(message);
    this.name = 'HeuristicEvaluationError';
  }
}

/**
 * Dynamic Retry Error
 */
export class DynamicRetryError extends IntelligenceError {
  constructor(message: string) {
    super(message);
    this.name = 'DynamicRetryError';
  }
}

/**
 * Predictive Scheduling Error
 */
export class PredictiveSchedulingError extends IntelligenceError {
  constructor(message: string) {
    super(message);
    this.name = 'PredictiveSchedulingError';
  }
}

/**
 * Failure Prediction Error
 */
export class FailurePredictionError extends IntelligenceError {
  constructor(message: string) {
    super(message);
    this.name = 'FailurePredictionError';
  }
}

/**
 * Anomaly Detection Error
 */
export class AnomalyDetectionError extends IntelligenceError {
  constructor(message: string) {
    super(message);
    this.name = 'AnomalyDetectionError';
  }
}

/**
 * Resource Optimization Error
 */
export class ResourceOptimizationError extends IntelligenceError {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceOptimizationError';
  }
}

/**
 * Pattern Analysis Error
 */
export class PatternAnalysisError extends IntelligenceError {
  constructor(message: string) {
    super(message);
    this.name = 'PatternAnalysisError';
  }
}

/**
 * Recommendation Engine Error
 */
export class RecommendationEngineError extends IntelligenceError {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendationEngineError';
  }
}

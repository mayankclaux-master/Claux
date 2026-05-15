/**
 * CLAUX Runtime Intelligence Layer - Constants
 * 
 * Constants for runtime intelligence.
 */

/**
 * Default Adaptive Strategy
 */
export const DEFAULT_ADAPTIVE_STRATEGY = 'balanced';

/**
 * Default Optimization Levels
 */
export const OPTIMIZATION_LEVELS = {
  MINIMAL: 0,
  CONSERVATIVE: 1,
  BALANCED: 2,
  AGGRESSIVE: 3,
  MAXIMUM: 4,
} as const;

/**
 * Default Retry Configuration
 */
export const DEFAULT_RETRY_CONFIG = {
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 60000,
  BACKOFF_MULTIPLIER: 2,
  JITTER_ENABLED: true,
  ADAPTIVE_DELAY: true,
} as const;

/**
 * Anomaly Detection Thresholds
 */
export const ANOMALY_THRESHOLDS = {
  LATENCY_DEVIATION: 3.0,
  ERROR_RATE_THRESHOLD: 0.05,
  RESOURCE_UTILIZATION_THRESHOLD: 0.9,
  THROUGHPUT_DEVIATION: 2.5,
} as const;

/**
 * Pattern Detection Windows
 */
export const PATTERN_DETECTION_WINDOWS = {
  SHORT_TERM_MS: 60000, // 1 minute
  MEDIUM_TERM_MS: 300000, // 5 minutes
  LONG_TERM_MS: 3600000, // 1 hour
} as const;

/**
 * Heuristic Weights
 */
export const HEURISTIC_WEIGHTS = {
  PERFORMANCE: 0.4,
  RESOURCE: 0.3,
  STABILITY: 0.2,
  COST: 0.1,
} as const;

/**
 * Recommendation Confidence Thresholds
 */
export const RECOMMENDATION_CONFIDENCE = {
  MINIMUM: 0.5,
  GOOD: 0.7,
  EXCELLENT: 0.9,
} as const;

/**
 * Hot Path Thresholds
 */
export const HOT_PATH_THRESHOLDS = {
  MIN_FREQUENCY: 10,
  MIN_DURATION_MS: 100,
  OPTIMIZATION_POTENTIAL_THRESHOLD: 0.2,
} as const;

/**
 * Prediction Horizons
 */
export const PREDICTION_HORIZONS = {
  SHORT_TERM_MS: 60000,
  MEDIUM_TERM_MS: 300000,
  LONG_TERM_MS: 3600000,
} as const;

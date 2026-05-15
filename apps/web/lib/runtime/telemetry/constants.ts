/**
 * CLAUX Runtime Telemetry Layer - Constants
 */

/**
 * Default Health Score Thresholds
 */
export const HEALTH_SCORE_THRESHOLDS = {
  HEALTHY: 0.8,
  DEGRADED: 0.5,
} as const;

/**
 * Default Metric Window
 */
export const DEFAULT_METRIC_WINDOW = 60000;

/**
 * Default Trace Timeout
 */
export const DEFAULT_TRACE_TIMEOUT = 30000;

/**
 * Bottleneck Thresholds
 */
export const BOTTLENECK_THRESHOLDS = {
  LATENCY_MS: 1000,
  ERROR_RATE: 0.05,
  UTILIZATION: 0.8,
} as const;

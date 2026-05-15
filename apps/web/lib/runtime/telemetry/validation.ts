/**
 * CLAUX Runtime Telemetry Layer - Validation
 */

import type { Span, Metric } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Telemetry Validator
 */
export class TelemetryValidator {
  /**
   * Validate span
   */
  validateSpan(span: Span): ValidationResult {
    const errors: string[] = [];

    if (!span.spanId) errors.push('Missing spanId');
    if (!span.traceId) errors.push('Missing traceId');
    if (!span.name) errors.push('Missing name');
    if (span.startTime <= 0) errors.push('Invalid startTime');
    if (span.endTime <= 0 && span.endTime !== 0) errors.push('Invalid endTime');
    if (span.endTime > 0 && span.endTime < span.startTime) errors.push('endTime before startTime');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate metric
   */
  validateMetric(metric: Metric): ValidationResult {
    const errors: string[] = [];

    if (!metric.metricId) errors.push('Missing metricId');
    if (!metric.name) errors.push('Missing name');
    if (metric.timestamp <= 0) errors.push('Invalid timestamp');

    return { valid: errors.length === 0, errors };
  }
}

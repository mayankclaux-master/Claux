/**
 * CLAUX Runtime Intelligence Layer - Validation
 */

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Intelligence Validator
 */
export class IntelligenceValidator {
  /**
   * Validate execution context
   */
  validateExecutionContext(context: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!context.executionId) errors.push('Missing executionId');
    if (!context.timestamp) errors.push('Missing timestamp');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate metrics
   */
  validateMetrics(metrics: Record<string, number>): ValidationResult {
    const errors: string[] = [];

    if (metrics.latency < 0) errors.push('Invalid latency');
    if (metrics.errorRate < 0 || metrics.errorRate > 1) errors.push('Invalid error rate');
    if (metrics.resourceUtilization < 0 || metrics.resourceUtilization > 1) errors.push('Invalid utilization');

    return { valid: errors.length === 0, errors };
  }
}

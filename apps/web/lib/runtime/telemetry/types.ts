/**
 * CLAUX Runtime Telemetry Layer - Types
 */

export type SpanId = string;
export type TraceId = string;
export type MetricId = string;

/**
 * Span
 */
export interface Span {
  readonly spanId: SpanId;
  readonly traceId: TraceId;
  readonly parentSpanId?: SpanId;
  readonly name: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly attributes: Record<string, unknown>;
  readonly status: 'ok' | 'error';
}

/**
 * Metric
 */
export interface Metric {
  readonly metricId: MetricId;
  readonly name: string;
  readonly value: number;
  readonly timestamp: number;
  readonly labels: Record<string, string>;
}

/**
 * Health Score
 */
export interface HealthScore {
  readonly score: number;
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly factors: readonly HealthFactor[];
}

/**
 * Health Factor
 */
export interface HealthFactor {
  readonly name: string;
  readonly weight: number;
  readonly value: number;
}

/**
 * Bottleneck
 */
export interface Bottleneck {
  readonly component: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly description: string;
  readonly metrics: Record<string, number>;
}

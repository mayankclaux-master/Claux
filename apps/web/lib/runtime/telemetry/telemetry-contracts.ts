/**
 * CLAUX Runtime Telemetry Layer - Contracts
 */

import type { Span, Metric } from './types';

/**
 * Telemetry Contract
 */
export interface TelemetryContract {
  readonly emitSpan: (span: Span) => void;
  readonly emitMetric: (metric: Metric) => void;
}

/**
 * Span Processor Contract
 */
export interface SpanProcessorContract {
  readonly process: (span: Span) => void;
  readonly flush: () => void;
}

/**
 * Metric Processor Contract
 */
export interface MetricProcessorContract {
  readonly process: (metric: Metric) => void;
  readonly flush: () => void;
}

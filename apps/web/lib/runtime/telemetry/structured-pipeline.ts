/**
 * CLAUX Runtime Telemetry Layer - Structured Pipeline
 */

import type { Span, Metric } from './types';

/**
 * Pipeline Stage
 */
interface PipelineStage {
  readonly name: string;
  readonly process: (data: Span | Metric) => void;
}

/**
 * Structured Pipeline Manager
 */
export class StructuredPipelineManager {
  private stages: PipelineStage[] = [];

  /**
   * Add stage
   */
  addStage(name: string, process: (data: Span | Metric) => void): void {
    this.stages.push({ name, process });
  }

  /**
   * Process span
   */
  processSpan(span: Span): void {
    for (const stage of this.stages) {
      stage.process(span);
    }
  }

  /**
   * Process metric
   */
  processMetric(metric: Metric): void {
    for (const stage of this.stages) {
      stage.process(metric);
    }
  }

  /**
   * Clear
   */
  clear(): void {
    this.stages = [];
  }
}

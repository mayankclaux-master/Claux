/**
 * CLAUX Runtime Telemetry Layer - Facade
 */

import { RuntimeSpanManager } from './runtime-spans';
import { MetricsAggregationManager } from './metrics-aggregation';
import { EventCorrelationManager } from './event-correlation';
import { RuntimeDiagnosticsManager } from './runtime-diagnostics';
import { HealthScoringManager } from './health-scoring';
import { BottleneckDetectionManager } from './bottleneck-detection';
import { FlamegraphSemanticsManager } from './flamegraph-semantics';
import { TracePropagationManager } from './trace-propagation';
import { StructuredPipelineManager } from './structured-pipeline';

/**
 * Telemetry Facade
 */
export class TelemetryFacade {
  readonly spans: RuntimeSpanManager;
  readonly metrics: MetricsAggregationManager;
  readonly correlation: EventCorrelationManager;
  readonly diagnostics: RuntimeDiagnosticsManager;
  readonly health: HealthScoringManager;
  readonly bottlenecks: BottleneckDetectionManager;
  readonly flamegraph: FlamegraphSemanticsManager;
  readonly tracePropagation: TracePropagationManager;
  readonly pipeline: StructuredPipelineManager;

  constructor() {
    this.spans = new RuntimeSpanManager();
    this.metrics = new MetricsAggregationManager();
    this.correlation = new EventCorrelationManager();
    this.diagnostics = new RuntimeDiagnosticsManager();
    this.health = new HealthScoringManager();
    this.bottlenecks = new BottleneckDetectionManager();
    this.flamegraph = new FlamegraphSemanticsManager();
    this.tracePropagation = new TracePropagationManager();
    this.pipeline = new StructuredPipelineManager();
  }
}

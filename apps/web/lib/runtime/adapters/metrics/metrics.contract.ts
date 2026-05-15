/**
 * Metrics Adapter Contracts
 * 
 * Pure abstractions for metrics systems
 * No Prometheus/OpenTelemetry dependencies
 */

import type { AdapterId, ProviderId } from '../types';

/**
 * Metrics adapter
 * Canonical interface for metrics operations
 */
export interface MetricsAdapter {
  readonly adapterId: AdapterId;
  readonly providerType: string;
  readonly capabilities: MetricsCapabilities;

  /**
   * Initialize adapter
   */
  initialize(config: MetricsAdapterConfig): Promise<void>;

  /**
   * Create counter
   */
  createCounter(name: string, options?: CounterOptions): RuntimeCounter;

  /**
   * Create gauge
   */
  createGauge(name: string, options?: GaugeOptions): RuntimeGauge;

  /**
   * Create histogram
   */
  createHistogram(name: string, options?: HistogramOptions): RuntimeHistogram;

  /**
   * Get metric
   */
  getMetric(name: string): RuntimeMetric | null;

  /**
   * List metrics
   */
  listMetrics(filter?: MetricFilter): Promise<readonly RuntimeMetric[]>;

  /**
   * Delete metric
   */
  deleteMetric(name: string): Promise<void>;

  /**
   * Record metric
   */
  recordMetric(metric: MetricRecord): Promise<void>;

  /**
   * Record batch
   */
  recordBatch(records: readonly MetricRecord[]): Promise<void>;

  /**
   * Get aggregation
   */
  getAggregation(
    metricName: string,
    options?: AggregationOptions
  ): Promise<MetricAggregation>;

  /**
   * Export metrics
   */
  exportMetrics(options?: ExportOptions): Promise<MetricsExportResult>;

  /**
   * Health check
   */
  healthCheck(): Promise<MetricsHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Runtime metric
 */
export interface RuntimeMetric {
  readonly name: string;
  readonly type: MetricType;
  readonly description?: string;
  readonly labels: MetricLabels;
  readonly createdAt: Date;
}

/**
 * Metric type
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Metric labels
 */
export interface MetricLabels {
  readonly [key: string]: string;
}

/**
 * Runtime counter
 */
export interface RuntimeCounter extends RuntimeMetric {
  readonly type: MetricType.COUNTER;

  /**
   * Increment
   */
  increment(value?: number, labels?: MetricLabels): void;

  /**
   * Get value
   */
  getValue(labels?: MetricLabels): number;
}

/**
 * Counter options
 */
export interface CounterOptions {
  readonly description?: string;
  readonly labelNames?: readonly string[];
}

/**
 * Runtime gauge
 */
export interface RuntimeGauge extends RuntimeMetric {
  readonly type: MetricType.GAUGE;

  /**
   * Set value
   */
  set(value: number, labels?: MetricLabels): void;

  /**
   * Increment
   */
  increment(value?: number, labels?: MetricLabels): void;

  /**
   * Decrement
   */
  decrement(value?: number, labels?: MetricLabels): void;

  /**
   * Get value
   */
  getValue(labels?: MetricLabels): number;
}

/**
 * Gauge options
 */
export interface GaugeOptions {
  readonly description?: string;
  readonly labelNames?: readonly string[];
}

/**
 * Runtime histogram
 */
export interface RuntimeHistogram extends RuntimeMetric {
  readonly type: MetricType.HISTOGRAM;

  /**
   * Record value
   */
  record(value: number, labels?: MetricLabels): void;

  /**
   * Get count
   */
  getCount(labels?: MetricLabels): number;

  /**
   * Get sum
   */
  getSum(labels?: MetricLabels): number;

  /**
   * Get percentiles
   */
  getPercentiles(percentiles: readonly number[], labels?: MetricLabels): Record<number, number>;
}

/**
 * Histogram options
 */
export interface HistogramOptions {
  readonly description?: string;
  readonly labelNames?: readonly string[];
  readonly buckets?: readonly number[];
}

/**
 * Metric record
 */
export interface MetricRecord {
  readonly metricName: string;
  readonly metricType: MetricType;
  readonly value: number;
  readonly labels?: MetricLabels;
  readonly timestamp: Date;
}

/**
 * Metric aggregation
 */
export interface MetricAggregation {
  readonly metricName: string;
  readonly aggregationType: AggregationType;
  readonly value: number;
  readonly labels?: MetricLabels;
  readonly timeRange: TimeRange;
}

/**
 * Aggregation type
 */
export enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  RATE = 'rate',
  PERCENTILE = 'percentile',
}

/**
 * Time range
 */
export interface TimeRange {
  readonly start: Date;
  readonly end: Date;
}

/**
 * Aggregation options
 */
export interface AggregationOptions {
  readonly aggregationType: AggregationType;
  readonly timeRange: TimeRange;
  readonly labels?: MetricLabels;
  readonly percentiles?: readonly number[];
}

/**
 * Export options
 */
export interface ExportOptions {
  readonly format: ExportFormat;
  readonly labels?: MetricLabels;
  readonly timeRange?: TimeRange;
}

/**
 * Export format
 */
export enum ExportFormat {
  PROMETHEUS = 'prometheus',
  JSON = 'json',
  INFLUX = 'influx',
  CUSTOM = 'custom',
}

/**
 * Metrics export result
 */
export interface MetricsExportResult {
  readonly format: ExportFormat;
  readonly data: string;
  readonly exportedAt: Date;
  readonly metricCount: number;
}

/**
 * Metric filter
 */
export interface MetricFilter {
  readonly metricType?: MetricType;
  readonly labels?: MetricLabels;
  readonly namePattern?: string;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Metrics capabilities
 */
export interface MetricsCapabilities {
  readonly supportedMetricTypes: readonly MetricType[];
  readonly supportedAggregationTypes: readonly AggregationType[];
  readonly supportedExportFormats: readonly ExportFormat[];
  readonly supportsLabels: boolean;
  readonly supportsHistograms: boolean;
  readonly supportsSummaries: boolean;
  readonly supportsPercentiles: boolean;
  readonly supportsRate: boolean;
  readonly maxLabelsPerMetric?: number;
  readonly maxMetricCount?: number;
}

/**
 * Metrics adapter config
 */
export interface MetricsAdapterConfig {
  readonly backendConfig: BackendConfig;
  readonly aggregationConfig: AggregationConfig;
  readonly exportConfig: ExportConfig;
  readonly labelingConfig: LabelingConfig;
}

/**
 * Backend config
 */
export interface BackendConfig {
  readonly backendType: MetricsBackendType;
  readonly endpoint?: string;
  readonly timeoutMs?: number;
  readonly batchSize?: number;
  readonly batchTimeoutMs?: number;
}

/**
 * Metrics backend type
 */
export enum MetricsBackendType {
  PROMETHEUS = 'prometheus',
  OPENTELEMETRY = 'opentelemetry',
  DATADOG = 'datadog',
  CLOUDWATCH = 'cloudwatch',
  INFLUXDB = 'influxdb',
  CUSTOM = 'custom',
}

/**
 * Aggregation config
 */
export interface AggregationConfig {
  readonly defaultAggregationType: AggregationType;
  readonly aggregationIntervalMs?: number;
  readonly retentionMs?: number;
}

/**
 * Export config
 */
export interface ExportConfig {
  readonly defaultExportFormat: ExportFormat;
  readonly exportIntervalMs?: number;
  readonly autoExport?: boolean;
}

/**
 * Labeling config
 */
export interface LabelingConfig {
  readonly defaultLabels?: MetricLabels;
  readonly labelCardinalityLimit?: number;
}

/**
 * Metrics health status
 */
export interface MetricsHealthStatus {
  readonly healthy: boolean;
  readonly connected: boolean;
  readonly totalMetrics: number;
  readonly recordsPerMinute: number;
  readonly errorCount: number;
  readonly lastError?: MetricsError;
}

/**
 * Metrics error
 */
export interface MetricsError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Metrics backend
 * Canonical interface for metrics backend
 */
export interface MetricsBackend {
  readonly backendId: string;
  readonly backendType: MetricsBackendType;

  /**
   * Connect
   */
  connect(): Promise<void>;

  /**
   * Disconnect
   */
  disconnect(): Promise<void>;

  /**
   * Is connected
   */
  isConnected(): boolean;

  /**
   * Get connection status
   */
  getConnectionStatus(): Promise<ConnectionStatus>;
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Metrics provider
 * Canonical interface for metrics provider implementation
 */
export interface MetricsProvider {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;

  /**
   * Create adapter
   */
  createAdapter(config: MetricsAdapterConfig): MetricsAdapter;

  /**
   * Validate config
   */
  validateConfig(config: MetricsAdapterConfig): Promise<MetricsConfigValidationResult>;

  /**
   * Get capabilities
   */
  getCapabilities(): MetricsCapabilities;

  /**
   * Get provider metadata
   */
  getMetadata(): MetricsProviderMetadata;
}

/**
 * Metrics config validation result
 */
export interface MetricsConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Metrics provider metadata
 */
export interface MetricsProviderMetadata {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Metrics exporter
 * Canonical interface for metrics export
 */
export interface MetricsExporter {
  readonly exporterId: string;
  readonly format: ExportFormat;

  /**
   * Export metrics
   */
  export(metrics: readonly RuntimeMetric[]): Promise<MetricsExportResult>;

  /**
   * Force flush
   */
  forceFlush(): Promise<void>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Traces-to-metrics linkage
 * Canonical interface for linking traces to metrics
 */
export interface TracesToMetricsLinkage {
  /**
   * Create metric from trace
   */
  createMetricFromTrace(
    traceId: string,
    metricName: string,
    metricType: MetricType
  ): Promise<RuntimeMetric>;

  /**
   * Link metric to trace
   */
  linkMetricToTrace(
    metricName: string,
    traceId: string
  ): Promise<void>;

  /**
   * Get trace metrics
   */
  getTraceMetrics(traceId: string): Promise<readonly RuntimeMetric[]>;

  /**
   * Get metric traces
   */
  getMetricTraces(metricName: string): Promise<readonly string[]>;
}

/**
 * Execution metrics
 * Canonical interface for execution metrics
 */
export interface ExecutionMetrics {
  /**
   * Record execution start
   */
  recordExecutionStart(executionId: string): void;

  /**
   * Record execution end
   */
  recordExecutionEnd(
    executionId: string,
    status: ExecutionStatus
  ): void;

  /**
   * Record task execution
   */
  recordTaskExecution(
    executionId: string,
    taskId: string,
    durationMs: number,
    status: ExecutionStatus
  ): void;

  /**
   * Get execution metrics
   */
  getExecutionMetrics(executionId: string): ExecutionMetricSummary;
}

/**
 * Execution status
 */
export enum ExecutionStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELLED = 'cancelled',
}

/**
 * Execution metric summary
 */
export interface ExecutionMetricSummary {
  readonly executionId: string;
  readonly totalDurationMs: number;
  readonly taskCount: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly cancelledCount: number;
}

/**
 * Worker metrics
 * Canonical interface for worker metrics
 */
export interface WorkerMetrics {
  /**
   * Record worker start
   */
  recordWorkerStart(workerId: string): void;

  /**
   * Record worker end
   */
  recordWorkerEnd(workerId: string, status: WorkerStatus): void;

  /**
   * Record worker heartbeat
   */
  recordWorkerHeartbeat(workerId: string): void;

  /**
   * Record worker lease
   */
  recordWorkerLease(workerId: string, leaseDurationMs: number): void;

  /**
   * Get worker metrics
   */
  getWorkerMetrics(workerId: string): WorkerMetricSummary;
}

/**
 * Worker status
 */
export enum WorkerStatus {
  READY = 'ready',
  BUSY = 'busy',
  ERROR = 'error',
}

/**
 * Worker metric summary
 */
export interface WorkerMetricSummary {
  readonly workerId: string;
  readonly uptimeMs: number;
  readonly heartbeatCount: number;
  readonly leaseCount: number;
  readonly totalLeaseDurationMs: number;
}

/**
 * Streaming metrics
 * Canonical interface for streaming metrics
 */
export interface StreamingMetrics {
  /**
   * Record stream start
   */
  recordStreamStart(streamId: string): void;

  /**
   * Record stream end
   */
  recordStreamEnd(streamId: string, status: StreamStatus): void;

  /**
   * Record chunk
   */
  recordChunk(
    streamId: string,
    chunkSize: number,
    latencyMs: number
  ): void;

  /**
   * Get streaming metrics
   */
  getStreamingMetrics(streamId: string): StreamingMetricSummary;
}

/**
 * Stream status
 */
export enum StreamStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELLED = 'cancelled',
}

/**
 * Streaming metric summary
 */
export interface StreamingMetricSummary {
  readonly streamId: string;
  readonly durationMs: number;
  readonly chunkCount: number;
  readonly totalBytes: number;
  readonly averageLatencyMs: number;
}

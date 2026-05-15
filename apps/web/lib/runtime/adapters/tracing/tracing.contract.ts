/**
 * Tracing Adapter Contracts
 * 
 * Pure abstractions for distributed tracing
 * No OpenTelemetry dependency leakage
 */

import type { AdapterId, ProviderId } from '../types';

/**
 * Tracing adapter
 * Canonical interface for tracing operations
 */
export interface TracingAdapter {
  readonly adapterId: AdapterId;
  readonly providerType: string;
  readonly capabilities: TracingCapabilities;

  /**
   * Initialize adapter
   */
  initialize(config: TracingAdapterConfig): Promise<void>;

  /**
   * Create trace
   */
  createTrace(options?: TraceOptions): RuntimeTrace;

  /**
   * Get current trace
   */
  getCurrentTrace(): RuntimeTrace | null;

  /**
   * Set current trace
   */
  setCurrentTrace(trace: RuntimeTrace): void;

  /**
   * Clear current trace
   */
  clearCurrentTrace(): void;

  /**
   * Create span
   */
  createSpan(
    parentSpan: RuntimeSpan | null,
    name: string,
    options?: SpanOptions
  ): RuntimeSpan;

  /**
   * Start span
   */
  startSpan(span: RuntimeSpan): void;

  /**
   * End span
   */
  endSpan(span: RuntimeSpan): void;

  /**
   * Record exception
   */
  recordException(
    span: RuntimeSpan,
    exception: Exception
  ): void;

  /**
   * Add event
   */
  addEvent(
    span: RuntimeSpan,
    event: SpanEvent
  ): void;

  /**
   * Inject context
   */
  injectContext(
    trace: RuntimeTrace,
    carrier: unknown,
    format: ContextFormat
  ): void;

  /**
   * Extract context
   */
  extractContext(
    carrier: unknown,
    format: ContextFormat
  ): RuntimeTrace | null;

  /**
   * Propagate trace
   */
  propagateTrace(
    trace: RuntimeTrace,
    strategy: TracePropagationStrategy
  ): void;

  /**
   * Health check
   */
  healthCheck(): Promise<TracingHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Runtime trace
 */
export interface RuntimeTrace {
  readonly traceId: string;
  readonly parentTraceId?: string;
  readonly traceState: TraceState;
  readonly baggage: TraceBaggage;
  readonly startedAt: Date;
}

/**
 * Trace state
 */
export interface TraceState {
  readonly vendor?: string;
  readonly state: Record<string, string>;
}

/**
 * Trace baggage
 */
export interface TraceBaggage {
  readonly entries: Record<string, string>;
}

/**
 * Runtime span
 */
export interface RuntimeSpan {
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly traceId: string;
  readonly name: string;
  readonly kind: SpanKind;
  readonly status: SpanStatus;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly attributes: SpanAttributes;
  readonly events: readonly SpanEvent[];
  readonly links: readonly SpanLink[];
  readonly resource: SpanResource;
}

/**
 * Span kind
 */
export enum SpanKind {
  INTERNAL = 'internal',
  SERVER = 'server',
  CLIENT = 'client',
  PRODUCER = 'producer',
  CONSUMER = 'consumer',
}

/**
 * Span status
 */
export interface SpanStatus {
  readonly code: SpanStatusCode;
  readonly message?: string;
}

/**
 * Span status code
 */
export enum SpanStatusCode {
  UNSET = 'unset',
  OK = 'ok',
  ERROR = 'error',
}

/**
 * Span attributes
 */
export interface SpanAttributes {
  readonly [key: string]: string | number | boolean | string[] | number[] | undefined;
}

/**
 * Span event
 */
export interface SpanEvent {
  readonly name: string;
  readonly timestamp: Date;
  readonly attributes?: SpanAttributes;
}

/**
 * Span link
 */
export interface SpanLink {
  readonly traceId: string;
  readonly spanId: string;
  readonly attributes?: SpanAttributes;
}

/**
 * Span resource
 */
export interface SpanResource {
  readonly attributes: SpanAttributes;
}

/**
 * Trace provider
 * Canonical interface for trace provider implementation
 */
export interface TraceProvider {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;

  /**
   * Create adapter
   */
  createAdapter(config: TracingAdapterConfig): TracingAdapter;

  /**
   * Validate config
   */
  validateConfig(config: TracingAdapterConfig): Promise<TraceConfigValidationResult>;

  /**
   * Get capabilities
   */
  getCapabilities(): TracingCapabilities;

  /**
   * Get provider metadata
   */
  getMetadata(): TraceProviderMetadata;
}

/**
 * Trace config validation result
 */
export interface TraceConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Trace provider metadata
 */
export interface TraceProviderMetadata {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Span exporter
 * Canonical interface for span export
 */
export interface SpanExporter {
  readonly exporterId: string;

  /**
   * Export spans
   */
  export(spans: readonly RuntimeSpan[]): Promise<SpanExportResult>;

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
 * Span export result
 */
export interface SpanExportResult {
  readonly success: boolean;
  readonly exportedCount: number;
  readonly failedCount: number;
  readonly error?: TraceError;
}

/**
 * Trace error
 */
export interface TraceError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Trace propagation strategy
 */
export enum TracePropagationStrategy {
  B3 = 'b3',
  B3_MULTI = 'b3_multi',
  JAEGER = 'jaeger',
  W3C = 'w3c',
  AWS_XRAY = 'aws_xray',
  OTTRACE = 'ottrace',
  CUSTOM = 'custom',
}

/**
 * Context format
 */
export enum ContextFormat {
  HTTP_HEADERS = 'http_headers',
  TEXT_MAP = 'text_map',
  BINARY = 'binary',
  CUSTOM = 'custom',
}

/**
 * Trace options
 */
export interface TraceOptions {
  readonly parentTraceId?: string;
  readonly baggage?: TraceBaggage;
  readonly traceState?: TraceState;
}

/**
 * Span options
 */
export interface SpanOptions {
  readonly kind?: SpanKind;
  readonly attributes?: SpanAttributes;
  readonly links?: readonly SpanLink[];
  readonly startTime?: Date;
}

/**
 * Exception
 */
export interface Exception {
  readonly type: string;
  readonly message: string;
  readonly stackTrace?: string;
  readonly occurredAt: Date;
}

/**
 * Tracing capabilities
 */
export interface TracingCapabilities {
  readonly supportedPropagationStrategies: readonly TracePropagationStrategy[];
  readonly supportedContextFormats: readonly ContextFormat[];
  readonly supportsBaggage: boolean;
  readonly supportsTraceState: boolean;
  readonly supportsSpanLinks: boolean;
  readonly supportsResourceAttributes: boolean;
  readonly maxSpanAttributes?: number;
  readonly maxSpanEvents?: number;
  readonly maxSpanLinks?: number;
}

/**
 * Adapter service config
 * Configuration for service-level tracing in adapter context
 */
export interface AdapterServiceConfig {
  readonly serviceName: string;
  readonly serviceVersion?: string;
  readonly serviceAttributes?: SpanAttributes;
}

/**
 * Service config
 * @deprecated Use AdapterServiceConfig instead
 */
export type ServiceConfig = AdapterServiceConfig;

/**
 * Tracing adapter config
 */
export interface TracingAdapterConfig {
  readonly serviceConfig: AdapterServiceConfig;
  readonly exporterConfig: ExporterConfig;
  readonly samplerConfig: SamplerConfig;
  readonly propagationConfig: PropagationConfig;
}

/**
 * Exporter config
 */
export interface ExporterConfig {
  readonly exporterType: ExporterType;
  readonly endpoint?: string;
  readonly headers?: Record<string, string>;
  readonly timeoutMs?: number;
  readonly batchSize?: number;
  readonly batchTimeoutMs?: number;
}

/**
 * Exporter type
 */
export enum ExporterType {
  JAEGER = 'jaeger',
  ZIPKIN = 'zipkin',
  OTLP = 'otlp',
  CONSOLE = 'console',
  CUSTOM = 'custom',
}

/**
 * Sampler config
 */
export interface SamplerConfig {
  readonly samplerType: SamplerType;
  readonly samplingRate?: number;
  readonly parentBased?: boolean;
}

/**
 * Sampler type
 */
export enum SamplerType {
  ALWAYS_ON = 'always_on',
  ALWAYS_OFF = 'always_off',
  TRACE_ID_RATIO = 'trace_id_ratio',
  PARENT_BASED = 'parent_based',
  CUSTOM = 'custom',
}

/**
 * Propagation config
 */
export interface PropagationConfig {
  readonly strategies: readonly TracePropagationStrategy[];
  readonly baggagePropagation?: boolean;
  readonly traceStatePropagation?: boolean;
}

/**
 * Tracing health status
 */
export interface TracingHealthStatus {
  readonly healthy: boolean;
  readonly connected: boolean;
  readonly spansExported: number;
  readonly spansExportedPerMinute: number;
  readonly errorCount: number;
  readonly lastError?: TraceError;
}

/**
 * Deterministic replay marker
 * Marker for deterministic replay in tracing
 */
export interface DeterministicReplayMarker {
  readonly replayId: string;
  readonly originalTraceId: string;
  readonly replayTraceId: string;
  readonly replayMode: ReplayMode;
  readonly deterministicSeed?: string;
}

/**
 * Replay mode
 */
export enum ReplayMode {
  FULL_REPLAY = 'full_replay',
  DETERMINISTIC_REPLAY = 'deterministic_replay',
  STEP_THROUGH = 'step_through',
  DRY_RUN = 'dry_run',
}

/**
 * Replay-aware tracing
 * Canonical interface for replay-aware tracing
 */
export interface ReplayAwareTracing {
  /**
   * Mark trace for replay
   */
  markForReplay(
    trace: RuntimeTrace,
    replayMode: ReplayMode
  ): DeterministicReplayMarker;

  /**
   * Create replay trace
   */
  createReplayTrace(
    originalTrace: RuntimeTrace,
    replayMode: ReplayMode,
    deterministicSeed?: string
  ): RuntimeTrace;

  /**
   * Get replay context
   */
  getReplayContext(trace: RuntimeTrace): DeterministicReplayMarker | null;

  /**
   * Validate replay consistency
   */
  validateReplayConsistency(
    originalTrace: RuntimeTrace,
    replayTrace: RuntimeTrace
  ): ReplayConsistencyResult;
}

/**
 * Replay consistency result
 */
export interface ReplayConsistencyResult {
  readonly consistent: boolean;
  readonly divergencePoints: readonly DivergencePoint[];
  readonly divergenceScore: number; // 0-100
}

/**
 * Divergence point
 */
export interface DivergencePoint {
  readonly spanId: string;
  readonly originalValue: unknown;
  readonly replayValue: unknown;
  readonly divergenceReason: string;
}

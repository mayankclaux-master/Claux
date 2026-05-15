/**
 * Runtime Event Contract
 * 
 * Canonical interfaces for event propagation and distributed tracing
 * Framework-agnostic, database-agnostic, queue-agnostic abstractions
 */

/**
 * Unique identifier for events
 */
export type EventId = string;

/**
 * Event type
 */
export type EventType = string;

/**
 * Event source
 */
export type EventSource = string;

/**
 * Event version
 */
export type EventVersion = string;

/**
 * Correlation ID for event chains
 */
export type CorrelationId = string;

/**
 * Causation ID for event lineage
 */
export type CausationId = string;

/**
 * Trace ID for distributed tracing
 */
export type TraceId = string;

/**
 * Span ID for distributed tracing
 */
export type SpanId = string;

/**
 * Runtime event
 * Canonical interface for runtime events
 */
export interface RuntimeEvent {
  readonly eventId: EventId;
  readonly eventType: EventType;
  readonly eventSource: EventSource;
  readonly eventVersion: EventVersion;
  readonly timestamp: Date;
  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;
  readonly traceId?: TraceId;
  readonly spanId?: SpanId;
  readonly executionId?: string;
  readonly taskId?: string;
  readonly payload: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event envelope
 * Wraps event with additional metadata
 */
export interface EventEnvelope {
  readonly event: RuntimeEvent;
  readonly headers: EventHeaders;
  readonly signature?: string;
}

/**
 * Event headers
 */
export interface EventHeaders {
  readonly contentType: string;
  readonly contentEncoding?: string;
  readonly messageId: string;
  readonly timestamp: string;
  readonly traceId?: TraceId;
  readonly spanId?: SpanId;
  readonly customHeaders?: Record<string, string>;
}

/**
 * Event filter
 */
export interface EventFilter {
  readonly eventType?: EventType;
  readonly eventSource?: EventSource;
  readonly executionId?: string;
  readonly taskId?: string;
  readonly correlationId?: CorrelationId;
  readonly traceId?: TraceId;
  readonly after?: Date;
  readonly before?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Event publisher
 * Canonical interface for publishing events
 */
export interface EventPublisher {
  /**
   * Publish a single event
   */
  publish(event: RuntimeEvent): Promise<EventPublishResult>;

  /**
   * Publish multiple events in a batch
   */
  publishBatch(events: readonly RuntimeEvent[]): Promise<readonly EventPublishResult[]>;

  /**
   * Publish event with envelope
   */
  publishEnvelope(envelope: EventEnvelope): Promise<EventPublishResult>;
}

/**
 * Event publish result
 */
export interface EventPublishResult {
  readonly eventId: EventId;
  readonly success: boolean;
  readonly error?: EventPublishError;
  readonly publishedAt?: Date;
}

/**
 * Event publish error
 */
export interface EventPublishError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly retryable: boolean;
}

/**
 * Event subscriber
 * Canonical interface for subscribing to events
 */
export interface EventSubscriber {
  /**
   * Subscribe to events matching filter
   */
  subscribe(
    filter: EventFilter,
    handler: EventHandler
  ): Promise<SubscriptionId>;

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: SubscriptionId): Promise<void>;

  /**
   * Get active subscriptions
   */
  getSubscriptions(): readonly Subscription[];
}

/**
 * Event handler
 * Handler function for processing events
 */
export type EventHandler = (event: RuntimeEvent) => Promise<EventHandleResult>;

/**
 * Event handle result
 */
export interface EventHandleResult {
  readonly success: boolean;
  readonly error?: EventHandleError;
  readonly shouldAcknowledge: boolean;
}

/**
 * Event handle error
 */
export interface EventHandleError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Subscription ID
 */
export type SubscriptionId = string;

/**
 * Subscription
 */
export interface Subscription {
  readonly subscriptionId: SubscriptionId;
  readonly filter: EventFilter;
  readonly createdAt: Date;
  readonly active: boolean;
}

/**
 * Event stream
 * Canonical interface for streaming events
 */
export interface EventStream {
  /**
   * Stream events matching filter
   */
  stream(
    filter: EventFilter,
    signal?: AbortSignal
  ): AsyncIterable<RuntimeEvent>;

  /**
   * Stream events as envelopes
   */
  streamEnvelopes(
    filter: EventFilter,
    signal?: AbortSignal
  ): AsyncIterable<EventEnvelope>;

  /**
   * Close stream
   */
  close(): Promise<void>;
}

/**
 * Event store
 * Canonical interface for event storage and retrieval
 */
export interface EventStore {
  /**
   * Store event
   */
  store(event: RuntimeEvent): Promise<EventStoreResult>;

  /**
   * Store events in batch
   */
  storeBatch(events: readonly RuntimeEvent[]): Promise<readonly EventStoreResult[]>;

  /**
   * Retrieve event by ID
   */
  retrieve(eventId: EventId): Promise<RuntimeEvent | null>;

  /**
   * Query events by filter
   */
  query(filter: EventFilter): Promise<readonly RuntimeEvent[]>;

  /**
   * Get event count by filter
   */
  count(filter: EventFilter): Promise<number>;

  /**
   * Delete event by ID
   */
  delete(eventId: EventId): Promise<void>;

  /**
   * Delete events by filter
   */
  deleteBatch(filter: EventFilter): Promise<number>;
}

/**
 * Event store result
 */
export interface EventStoreResult {
  readonly eventId: EventId;
  readonly success: boolean;
  readonly error?: EventStoreError;
  readonly storedAt?: Date;
}

/**
 * Event store error
 */
export interface EventStoreError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Event tracer
 * Canonical interface for distributed tracing
 */
export interface EventTracer {
  /**
   * Start trace
   */
  startTrace(
    traceId: TraceId,
    operationName: string,
    parentSpanId?: SpanId
  ): SpanContext;

  /**
   * Get active span context
   */
  getActiveSpanContext(): SpanContext | null;

  /**
   * Extract trace context from event
   */
  extractTraceContext(event: RuntimeEvent): TraceContext;

  /**
   * Inject trace context into event
   */
  injectTraceContext(
    event: RuntimeEvent,
    traceContext: TraceContext
  ): RuntimeEvent;

  /**
   * Get trace by ID
   */
  getTrace(traceId: TraceId): Promise<Trace | null>;

  /**
   * Get spans for trace
   */
  getTraceSpans(traceId: TraceId): Promise<readonly Span[]>;
}

/**
 * Span context
 */
export interface SpanContext {
  readonly traceId: TraceId;
  readonly spanId: SpanId;
  readonly parentSpanId?: SpanId;
}

/**
 * Trace context
 */
export interface TraceContext {
  readonly traceId: TraceId;
  readonly spanId: SpanId;
  readonly sampled?: boolean;
}

/**
 * Trace
 */
export interface Trace {
  readonly traceId: TraceId;
  readonly operationName: string;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly durationMs?: number;
  readonly spanCount: number;
}

/**
 * Span
 */
export interface Span {
  readonly spanId: SpanId;
  readonly traceId: TraceId;
  readonly parentSpanId?: SpanId;
  readonly operationName: string;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly durationMs?: number;
  readonly tags?: Record<string, string>;
  readonly logs?: readonly SpanLog[];
}

/**
 * Span log
 */
export interface SpanLog {
  readonly timestamp: Date;
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly message: string;
  readonly fields?: Record<string, unknown>;
}

/**
 * Event correlation
 * Canonical interface for event correlation and causation
 */
export interface EventCorrelation {
  /**
   * Get correlation chain
   */
  getCorrelationChain(correlationId: CorrelationId): Promise<readonly RuntimeEvent[]>;

  /**
   * Get causation chain
   */
  getCausationChain(eventId: EventId): Promise<readonly RuntimeEvent[]>;

  /**
   * Get event timeline
   */
  getEventTimeline(executionId: string): Promise<readonly RuntimeEvent[]>;

  /**
   * Generate correlation ID
   */
  generateCorrelationId(): CorrelationId;

  /**
   * Generate causation ID
   */
  generateCausationId(parentEventId: EventId): CausationId;
}

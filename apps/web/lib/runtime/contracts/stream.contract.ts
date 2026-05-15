/**
 * Runtime Streaming Contracts
 * 
 * Canonical interfaces for streaming runtime execution
 * Transport-agnostic streaming semantics with cancellation, resumption, and backpressure
 */

/**
 * Stream type
 */
export enum StreamType {
  TOKEN = 'token',
  PROGRESS = 'progress',
  EVENT = 'event',
  LOG = 'log',
  OUTPUT = 'output',
  METRIC = 'metric',
  CUSTOM = 'custom',
}

/**
 * Stream event type
 */
export enum StreamEventType {
  START = 'start',
  DATA = 'data',
  ERROR = 'error',
  END = 'end',
  PAUSE = 'pause',
  RESUME = 'resume',
  CANCEL = 'cancel',
  BACKPRESSURE = 'backpressure',
}

/**
 * Stream chunk
 * Canonical interface for stream data chunks
 */
export interface RuntimeStreamChunk {
  readonly chunkId: string;
  readonly streamId: string;
  readonly type: StreamType;
  readonly eventType: StreamEventType;
  readonly data: unknown;
  readonly metadata: StreamChunkMetadata;
  readonly timestamp: Date;
}

/**
 * Stream chunk metadata
 */
export interface StreamChunkMetadata {
  readonly sequence: number;
  readonly offset?: number;
  readonly sizeBytes?: number;
  readonly encoding?: string;
  readonly compression?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Token stream chunk
 */
export interface TokenStreamChunk extends RuntimeStreamChunk {
  readonly type: StreamType.TOKEN;
  readonly data: {
    readonly token: string;
    readonly isEnd: boolean;
    readonly isStart: boolean;
  };
}

/**
 * Progress stream chunk
 */
export interface ProgressStreamChunk extends RuntimeStreamChunk {
  readonly type: StreamType.PROGRESS;
  readonly data: {
    readonly percentage: number;
    readonly currentStep: string;
    readonly estimatedRemainingMs?: number;
  };
}

/**
 * Event stream chunk
 */
export interface EventStreamChunk extends RuntimeStreamChunk {
  readonly type: StreamType.EVENT;
  readonly data: {
    readonly eventType: string;
    readonly eventData: Record<string, unknown>;
  };
}

/**
 * Log stream chunk
 */
export interface LogStreamChunk extends RuntimeStreamChunk {
  readonly type: StreamType.LOG;
  readonly data: {
    readonly level: 'debug' | 'info' | 'warn' | 'error';
    readonly message: string;
    readonly context?: Record<string, unknown>;
  };
}

/**
 * Output stream chunk
 */
export interface OutputStreamChunk extends RuntimeStreamChunk {
  readonly type: StreamType.OUTPUT;
  readonly data: {
    readonly content: string;
    readonly format: 'text' | 'json' | 'binary';
    readonly isFinal: boolean;
  };
}

/**
 * Runtime stream
 * Canonical interface for runtime streaming
 */
export interface RuntimeStream {
  readonly streamId: string;
  readonly streamType: StreamType;
  readonly status: StreamStatus;
  readonly metadata: StreamMetadata;
  readonly createdAt: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
}

/**
 * Stream status
 */
export enum StreamStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

/**
 * Stream metadata
 */
export interface StreamMetadata {
  readonly sourceId: string; // executionId, taskId, etc.
  readonly sourceType: string;
  readonly traceId?: string;
  readonly parentStreamId?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Stream controller
 * Canonical interface for stream control
 */
export interface RuntimeStreamController {
  readonly streamId: string;

  /**
   * Start stream
   */
  start(): Promise<void>;

  /**
   * Pause stream
   */
  pause(): Promise<void>;

  /**
   * Resume stream
   */
  resume(): Promise<void>;

  /**
   * Cancel stream
   */
  cancel(): Promise<void>;

  /**
   * Get stream status
   */
  getStatus(): Promise<StreamStatus>;

  /**
   * Get stream metadata
   */
  getMetadata(): Promise<StreamMetadata>;

  /**
   * Write chunk
   */
  writeChunk(chunk: RuntimeStreamChunk): Promise<void>;

  /**
   * Write chunks batch
   */
  writeChunksBatch(chunks: readonly RuntimeStreamChunk[]): Promise<void>;

  /**
   * Signal backpressure
   */
  signalBackpressure(availableCapacity: number): Promise<void>;

  /**
   * Get backpressure status
   */
  getBackpressureStatus(): Promise<BackpressureStatus>;

  /**
   * Close stream
   */
  close(): Promise<void>;
}

/**
 * Backpressure status
 */
export interface BackpressureStatus {
  readonly underBackpressure: boolean;
  readonly availableCapacity: number;
  readonly bufferSize: number;
  readonly bufferUtilization: number; // 0-100
}

/**
 * Stream reader
 * Canonical interface for stream consumption
 */
export interface StreamReader {
  readonly streamId: string;

  /**
   * Read next chunk
   */
  read(): Promise<RuntimeStreamChunk | null>;

  /**
   * Read multiple chunks
   */
  readBatch(count: number): Promise<readonly RuntimeStreamChunk[]>;

  /**
   * Read all chunks
   */
  readAll(): Promise<readonly RuntimeStreamChunk[]>;

  /**
   * Subscribe to stream
   */
  subscribe(
    handler: StreamChunkHandler,
    options?: StreamSubscriptionOptions
  ): Promise<StreamSubscription>;

  /**
   * Unsubscribe from stream
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Seek to position
   */
  seek(position: number): Promise<void>;

  /**
   * Get current position
   */
  getPosition(): Promise<number>;

  /**
   * Get stream length
   */
  getLength(): Promise<number>;
}

/**
 * Stream chunk handler
 */
export type StreamChunkHandler = (chunk: RuntimeStreamChunk) => Promise<void>;

/**
 * Stream subscription options
 */
export interface StreamSubscriptionOptions {
  readonly fromBeginning?: boolean;
  readonly fromPosition?: number;
  readonly filter?: StreamChunkFilter;
  readonly signal?: AbortSignal;
}

/**
 * Stream chunk filter
 */
export interface StreamChunkFilter {
  readonly types?: readonly StreamType[];
  readonly eventTypes?: readonly StreamEventType[];
  readonly after?: Date;
  readonly before?: Date;
  readonly customFilter?: (chunk: RuntimeStreamChunk) => boolean;
}

/**
 * Stream subscription
 */
export interface StreamSubscription {
  readonly subscriptionId: string;
  readonly streamId: string;
  readonly subscribedAt: Date;
  readonly active: boolean;
}

/**
 * Stream factory
 * Canonical interface for stream creation
 */
export interface StreamFactory {
  /**
   * Create stream
   */
  createStream(
    streamType: StreamType,
    metadata: StreamMetadata
  ): Promise<RuntimeStream>;

  /**
   * Create stream controller
   */
  createController(streamId: string): Promise<RuntimeStreamController>;

  /**
   * Create stream reader
   */
  createReader(streamId: string): Promise<StreamReader>;

  /**
   * Get stream by ID
   */
  getStream(streamId: string): Promise<RuntimeStream | null>;

  /**
   * List streams
   */
  listStreams(filter?: StreamFilter): Promise<readonly RuntimeStream[]>;

  /**
   * Delete stream
   */
  deleteStream(streamId: string): Promise<void>;
}

/**
 * Stream filter
 */
export interface StreamFilter {
  readonly streamType?: StreamType;
  readonly status?: StreamStatus;
  readonly sourceId?: string;
  readonly sourceType?: string;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Stream resumption
 * Canonical interface for stream resumption
 */
export interface StreamResumption {
  /**
   * Create resumption checkpoint
   */
  createCheckpoint(streamId: string): Promise<StreamCheckpoint>;

  /**
   * Resume from checkpoint
   */
  resumeFromCheckpoint(checkpointId: string): Promise<void>;

  /**
   * Get resumption capability
   */
  getResumptionCapability(streamId: string): Promise<ResumptionCapability>;

  /**
   * Validate resumption
   */
  validateResumption(streamId: string): Promise<ResumptionValidationResult>;
}

/**
 * Stream checkpoint
 */
export interface StreamCheckpoint {
  readonly checkpointId: string;
  readonly streamId: string;
  readonly position: number;
  readonly timestamp: Date;
  readonly state: Record<string, unknown>;
}

/**
 * Resumption capability
 */
export interface ResumptionCapability {
  readonly resumable: boolean;
  readonly maxRetentionMs: number;
  readonly supportsPartialResumption: boolean;
  readonly requiresFullReplay: boolean;
}

/**
 * Resumption validation result
 */
export interface ResumptionValidationResult {
  readonly valid: boolean;
  readonly reason: string;
  readonly availablePosition?: number;
  readonly warnings: readonly string[];
}

/**
 * Stream metrics
 * Canonical interface for stream metrics collection
 */
export interface StreamMetrics {
  readonly streamId: string;
  readonly chunksProduced: number;
  readonly chunksConsumed: number;
  readonly bytesTransferred: number;
  readonly durationMs: number;
  readonly throughputBytesPerSecond: number;
  readonly backpressureEvents: number;
  readonly errorCount: number;
  readonly customMetrics?: Record<string, number>;
}

/**
 * Stream metrics collector
 */
export interface StreamMetricsCollector {
  /**
   * Get stream metrics
   */
  getMetrics(streamId: string): Promise<StreamMetrics>;

  /**
   * Get aggregate metrics
   */
  getAggregateMetrics(filter?: StreamFilter): Promise<AggregateStreamMetrics>;

  /**
   * Reset metrics
   */
  resetMetrics(streamId: string): Promise<void>;
}

/**
 * Aggregate stream metrics
 */
export interface AggregateStreamMetrics {
  readonly totalStreams: number;
  readonly activeStreams: number;
  readonly totalChunks: number;
  readonly totalBytesTransferred: number;
  readonly averageThroughputBytesPerSecond: number;
  readonly totalBackpressureEvents: number;
  readonly totalErrors: number;
}

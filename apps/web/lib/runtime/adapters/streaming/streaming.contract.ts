/**
 * Streaming Adapter Contracts
 * 
 * Pure abstractions for streaming transports
 * No WebSocket/SSE implementation coupling
 */

import type { AdapterId, ProviderId } from '../types';

/**
 * Streaming adapter
 * Canonical interface for streaming operations
 */
export interface StreamingAdapter {
  readonly adapterId: AdapterId;
  readonly providerType: string;
  readonly capabilities: StreamingCapabilities;

  /**
   * Initialize adapter
   */
  initialize(config: StreamingAdapterConfig): Promise<void>;

  /**
   * Create stream
   */
  createStream(streamId: string, options?: StreamOptions): Promise<StreamSession>;

  /**
   * Get stream
   */
  getStream(streamId: string): Promise<StreamSession | null>;

  /**
   * List streams
   */
  listStreams(filter?: StreamFilter): Promise<readonly StreamSession[]>;

  /**
   * Delete stream
   */
  deleteStream(streamId: string): Promise<void>;

  /**
   * Publish to stream
   */
  publish(
    streamId: string,
    chunk: StreamChunk,
    options?: PublishOptions
  ): Promise<PublishResult>;

  /**
   * Publish batch
   */
  publishBatch(
    streamId: string,
    chunks: readonly StreamChunk[],
    options?: PublishOptions
  ): Promise<readonly PublishResult[]>;

  /**
   * Subscribe to stream
   */
  subscribe(
    streamId: string,
    handler: ChunkHandler,
    options?: SubscribeOptions
  ): Promise<StreamSubscription>;

  /**
   * Unsubscribe
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Health check
   */
  healthCheck(): Promise<StreamingHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Stream session
 */
export interface StreamSession {
  readonly streamId: string;
  readonly streamType: StreamType;
  readonly createdAt: Date;
  readonly status: StreamStatus;
  readonly metadata: StreamMetadata;
  readonly options: StreamOptions;
}

/**
 * Stream type
 */
export enum StreamType {
  TOKEN = 'token',
  STRUCTURED_OUTPUT = 'structured_output',
  EVENT = 'event',
  LOG = 'log',
  CUSTOM = 'custom',
}

/**
 * Stream status
 */
export enum StreamStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  ERROR = 'error',
}

/**
 * Stream metadata
 */
export interface StreamMetadata {
  readonly source?: string;
  readonly executionId?: string;
  readonly taskId?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Stream options
 */
export interface StreamOptions {
  readonly retentionMs?: number;
  readonly maxChunks?: number;
  readonly maxSizeBytes?: number;
  readonly backpressureEnabled?: boolean;
  readonly backpressureStrategy?: BackpressureStrategy;
}

/**
 * Stream chunk
 */
export interface StreamChunk {
  readonly chunkId: string;
  readonly streamId: string;
  readonly chunkType: ChunkType;
  readonly data: unknown;
  readonly headers: ChunkHeaders;
  readonly metadata: ChunkMetadata;
  readonly timestamp: Date;
  readonly sequence: number;
}

/**
 * Chunk type
 */
export enum ChunkType {
  TOKEN = 'token',
  PROGRESS = 'progress',
  EVENT = 'event',
  LOG = 'log',
  ERROR = 'error',
  CONTROL = 'control',
  CUSTOM = 'custom',
}

/**
 * Chunk headers
 */
export interface ChunkHeaders {
  readonly contentType?: string;
  readonly contentEncoding?: string;
  readonly correlationId?: string;
  readonly customHeaders?: Record<string, unknown>;
}

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  readonly position?: number;
  readonly totalSize?: number;
  readonly chunkSize?: number;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Stream subscription
 */
export interface StreamSubscription {
  readonly subscriptionId: string;
  readonly streamId: string;
  readonly subscribedAt: Date;
  readonly status: SubscriptionStatus;
  readonly options: SubscribeOptions;
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  ERROR = 'error',
}

/**
 * Subscribe options
 */
export interface SubscribeOptions {
  readonly fromBeginning?: boolean;
  readonly fromSequence?: number;
  readonly filter?: ChunkFilter;
  readonly backpressureEnabled?: boolean;
  readonly backpressureStrategy?: BackpressureStrategy;
}

/**
 * Chunk filter
 */
export interface ChunkFilter {
  readonly chunkTypes?: readonly ChunkType[];
  readonly after?: Date;
  readonly before?: Date;
  readonly afterSequence?: number;
  readonly beforeSequence?: number;
}

/**
 * Chunk handler
 */
export type ChunkHandler = (chunk: StreamChunk) => Promise<void>;

/**
 * Publish options
 */
export interface PublishOptions {
  readonly headers?: ChunkHeaders;
  readonly metadata?: ChunkMetadata;
  readonly ttlMs?: number;
}

/**
 * Publish result
 */
export interface PublishResult {
  readonly chunkId: string;
  readonly success: boolean;
  readonly publishedAt: Date;
  readonly sequence: number;
  readonly error?: StreamingError;
}

/**
 * Streaming error
 */
export interface StreamingError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Backpressure strategy
 */
export enum BackpressureStrategy {
  DROP_NEWEST = 'drop_newest',
  DROP_OLDEST = 'drop_oldest',
  BUFFER = 'buffer',
  SIGNAL = 'signal',
  PAUSE_PRODUCER = 'pause_producer',
  CUSTOM = 'custom',
}

/**
 * Stream transport
 * Canonical interface for stream transport
 */
export interface StreamTransport {
  readonly transportId: string;
  readonly transportType: StreamTransportType;

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
 * Stream transport type
 */
export enum StreamTransportType {
  WEBSOCKET = 'websocket',
  SSE = 'sse',
  GRPC = 'grpc',
  HTTP_STREAMING = 'http_streaming',
  CUSTOM = 'custom',
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Streaming capabilities
 */
export interface StreamingCapabilities {
  readonly supportedStreamTypes: readonly StreamType[];
  readonly supportedChunkTypes: readonly ChunkType[];
  readonly supportedBackpressureStrategies: readonly BackpressureStrategy[];
  readonly supportedTransportTypes: readonly StreamTransportType[];
  readonly supportsResumption: boolean;
  readonly supportsMultiplexing: boolean;
  readonly supportsCompression: boolean;
  readonly supportsEncryption: boolean;
  readonly supportsOrderedDelivery: boolean;
  readonly maxStreamCount?: number;
  readonly maxChunkSizeBytes?: number;
  readonly maxRetentionMs?: number;
}

/**
 * Streaming adapter config
 */
export interface StreamingAdapterConfig {
  readonly transportOptions: TransportOptions;
  readonly streamOptions: StreamOptions;
  readonly backpressureOptions: BackpressureOptions;
  readonly securityOptions: SecurityOptions;
}

/**
 * Transport options
 */
export interface TransportOptions {
  readonly transportType: StreamTransportType;
  readonly connectionString?: string;
  readonly endpoint?: string;
  readonly timeoutMs?: number;
  readonly keepAlive?: boolean;
  readonly maxConnections?: number;
}

/**
 * Backpressure options
 */
export interface BackpressureOptions {
  readonly enabled: boolean;
  readonly strategy: BackpressureStrategy;
  readonly bufferSize?: number;
  readonly highWatermark?: number;
  readonly lowWatermark?: number;
}

/**
 * Security options
 */
export interface SecurityOptions {
  readonly authentication?: AuthenticationConfig;
  readonly encryption?: EncryptionConfig;
  readonly tls?: TLSConfig;
}

/**
 * Authentication config
 */
export interface AuthenticationConfig {
  readonly type: 'basic' | 'token' | 'oauth' | 'custom';
  readonly credentials?: Record<string, unknown>;
}

/**
 * Encryption config
 */
export interface EncryptionConfig {
  readonly enabled: boolean;
  readonly algorithm?: string;
  readonly keyId?: string;
}

/**
 * TLS config
 */
export interface TLSConfig {
  readonly enabled: boolean;
  readonly certPath?: string;
  readonly keyPath?: string;
  readonly caPath?: string;
}

/**
 * Stream filter
 */
export interface StreamFilter {
  readonly streamType?: StreamType;
  readonly executionId?: string;
  readonly taskId?: string;
  readonly after?: Date;
  readonly before?: Date;
  readonly status?: StreamStatus;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Streaming health status
 */
export interface StreamingHealthStatus {
  readonly healthy: boolean;
  readonly connected: boolean;
  readonly activeStreams: number;
  readonly activeSubscriptions: number;
  readonly chunksPerMinute: number;
  readonly errorCount: number;
  readonly lastError?: StreamingError;
}

/**
 * Stream provider
 * Canonical interface for stream provider implementation
 */
export interface StreamProvider {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;

  /**
   * Create adapter
   */
  createAdapter(config: StreamingAdapterConfig): StreamingAdapter;

  /**
   * Validate config
   */
  validateConfig(config: StreamingAdapterConfig): Promise<StreamConfigValidationResult>;

  /**
   * Get capabilities
   */
  getCapabilities(): StreamingCapabilities;

  /**
   * Get provider metadata
   */
  getMetadata(): StreamProviderMetadata;
}

/**
 * Stream config validation result
 */
export interface StreamConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Stream provider metadata
 */
export interface StreamProviderMetadata {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Resumable stream
 * Canonical interface for resumable streams
 */
export interface ResumableStream {
  readonly streamId: string;
  readonly resumeToken: string;

  /**
   * Pause stream
   */
  pause(): Promise<void>;

  /**
   * Resume stream
   */
  resume(resumeToken?: string): Promise<void>;

  /**
   * Get resume token
   */
  getResumeToken(): string;

  /**
   * Validate resume token
   */
  validateResumeToken(resumeToken: string): Promise<boolean>;
}

/**
 * Multiplexed stream
 * Canonical interface for multiplexed streams
 */
export interface MultiplexedStream {
  readonly streamId: string;
  readonly subStreams: readonly SubStream[];

  /**
   * Create sub-stream
   */
  createSubStream(subStreamId: string, options?: SubStreamOptions): Promise<SubStream>;

  /**
   * Get sub-stream
   */
  getSubStream(subStreamId: string): Promise<SubStream | null>;

  /**
   * Close sub-stream
   */
  closeSubStream(subStreamId: string): Promise<void>;

  /**
   * List sub-streams
   */
  listSubStreams(): readonly SubStream[];
}

/**
 * Sub stream
 */
export interface SubStream {
  readonly subStreamId: string;
  readonly streamId: string;
  readonly createdAt: Date;
  readonly status: StreamStatus;
}

/**
 * Sub stream options
 */
export interface SubStreamOptions {
  readonly metadata?: StreamMetadata;
  readonly backpressureEnabled?: boolean;
}

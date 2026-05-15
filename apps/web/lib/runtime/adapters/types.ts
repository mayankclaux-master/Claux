/**
 * Runtime Adapters Layer Types
 * 
 * Shared types for adapter layer
 * Provides common abstractions across all adapter domains
 */

/**
 * Adapter identifier
 */
export type AdapterId = string;

/**
 * Provider identifier
 */
export type ProviderId = string;

/**
 * Adapter type
 */
export enum AdapterType {
  QUEUE = 'queue',
  EVENTS = 'events',
  TRACING = 'tracing',
  CHECKPOINTS = 'checkpoints',
  STREAMING = 'streaming',
  WORKERS = 'workers',
  SCHEDULING = 'scheduling',
  METRICS = 'metrics',
}

/**
 * Provider type
 */
export enum ProviderType {
  // Queue providers
  BULLMQ = 'bullmq',
  REDIS = 'redis',
  AWS_SQS = 'aws_sqs',
  GOOGLE_PUBSUB = 'google_pubsub',
  AZURE_SERVICE_BUS = 'azure_service_bus',
  KAFKA = 'kafka',
  RABBITMQ = 'rabbitmq',
  
  // Event bus providers
  KAFKA_EVENTS = 'kafka_events',
  NATS = 'nats',
  REDIS_STREAMS = 'redis_streams',
  AWS_EVENTBRIDGE = 'aws_eventbridge',
  
  // Tracing providers
  OPENTELEMETRY = 'opentelemetry',
  JAEGER = 'jaeger',
  ZIPKIN = 'zipkin',
  DATADOG = 'datadog',
  
  // Checkpoint storage providers
  S3 = 's3',
  POSTGRES = 'postgres',
  REDIS_CHECKPOINTS = 'redis_checkpoints',
  AZURE_BLOB = 'azure_blob',
  GCP_STORAGE = 'gcp_storage',
  
  // Streaming providers
  WEBSOCKET = 'websocket',
  SSE = 'sse',
  GRPC = 'grpc',
  
  // Worker runtime providers
  KUBERNETES = 'kubernetes',
  DOCKER = 'docker',
  SERVERLESS = 'serverless',
  LOCAL = 'local',
  
  // Scheduling providers
  CRON = 'cron',
  TEMPORAL = 'temporal',
  AIRFLOW = 'airflow',
  
  // Metrics providers
  PROMETHEUS = 'prometheus',
  OPENTELEMETRY_METRICS = 'opentelemetry_metrics',
  DATADOG_METRICS = 'datadog_metrics',
  CLOUDWATCH = 'cloudwatch',
}

/**
 * Adapter status
 */
export enum AdapterStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  SHUTTING_DOWN = 'shutting_down',
  SHUTDOWN = 'shutdown',
}

/**
 * Adapter health
 */
export interface AdapterHealth {
  readonly adapterId: AdapterId;
  readonly adapterType: AdapterType;
  readonly status: AdapterStatus;
  readonly healthy: boolean;
  readonly lastHealthCheck: Date;
  readonly uptimeMs: number;
  readonly errorCount: number;
  readonly lastError?: AdapterError;
}

/**
 * Adapter error
 */
export interface AdapterError {
  readonly code: string;
  readonly message: string;
  readonly adapterId: AdapterId;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Adapter configuration
 */
export interface AdapterConfiguration {
  readonly adapterId: AdapterId;
  readonly adapterType: AdapterType;
  readonly providerType: ProviderType;
  readonly enabled: boolean;
  readonly config: Record<string, unknown>;
  readonly capabilities: AdapterCapabilities;
}

/**
 * Adapter capabilities
 */
export interface AdapterCapabilities {
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly AdapterLimitation[];
  readonly requirements: readonly AdapterRequirement[];
}

/**
 * Adapter limitation
 */
export interface AdapterLimitation {
  readonly limitation: string;
  readonly impact: 'low' | 'medium' | 'high';
  readonly description: string;
}

/**
 * Adapter requirement
 */
export interface AdapterRequirement {
  readonly requirement: string;
  readonly type: 'required' | 'optional';
  readonly description: string;
}

/**
 * Adapter lifecycle
 */
export interface AdapterLifecycle {
  readonly adapterId: AdapterId;
  readonly status: AdapterStatus;
  readonly createdAt: Date;
  readonly initializedAt?: Date;
  readonly readyAt?: Date;
  readonly shutdownAt?: Date;
}

/**
 * Connection options
 */
export interface ConnectionOptions {
  readonly timeoutMs?: number;
  readonly retryAttempts?: number;
  readonly retryDelayMs?: number;
  readonly maxConnections?: number;
  readonly keepAlive?: boolean;
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
 * Retry options
 */
export interface RetryOptions {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
  readonly jitter: boolean;
}

/**
 * Timeout options
 */
export interface TimeoutOptions {
  readonly connectionTimeoutMs?: number;
  readonly operationTimeoutMs?: number;
  readonly idleTimeoutMs?: number;
}

/**
 * Serialization options
 */
export interface SerializationOptions {
  readonly format: 'json' | 'protobuf' | 'avro' | 'custom';
  readonly compression?: 'gzip' | 'snappy' | 'lz4' | 'none';
}

/**
 * Provider metadata
 */
export interface ProviderMetadata {
  readonly providerId: ProviderId;
  readonly providerType: ProviderType;
  readonly version: string;
  readonly capabilities: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Event Bus Adapter Contracts
 * 
 * Pure abstractions for event bus systems
 * No Kafka/NATS/Redis dependencies
 */

import type { SecurityOptions } from '../types';

/**
 * Event bus adapter
 * Canonical interface for event bus operations
 */
export interface EventBusAdapter {
  readonly adapterId: string;
  readonly providerType: string;
  readonly capabilities: EventBusCapabilities;

  /**
   * Initialize adapter
   */
  initialize(config: EventBusAdapterConfig): Promise<void>;

  /**
   * Publish event
   */
  publish(
    topic: string,
    event: RuntimeEvent,
    options?: EventPublishOptions
  ): Promise<EventPublishResult>;

  /**
   * Publish batch
   */
  publishBatch(
    topic: string,
    events: readonly RuntimeEvent[],
    options?: EventPublishOptions
  ): Promise<readonly EventPublishResult[]>;

  /**
   * Subscribe to topic
   */
  subscribe(
    topic: string,
    subscriptionId: string,
    handler: EventHandler,
    options?: EventSubscriptionOptions
  ): Promise<EventSubscription>;

  /**
   * Unsubscribe
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Create topic
   */
  createTopic(topic: string, options?: TopicOptions): Promise<void>;

  /**
   * Delete topic
   */
  deleteTopic(topic: string): Promise<void>;

  /**
   * Get topic info
   */
  getTopicInfo(topic: string): Promise<TopicInfo>;

  /**
   * List topics
   */
  listTopics(filter?: TopicFilter): Promise<readonly TopicInfo[]>;

  /**
   * Health check
   */
  healthCheck(): Promise<EventBusHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Runtime event
 */
export interface RuntimeEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly topic: string;
  readonly payload: unknown;
  readonly headers: EventHeaders;
  readonly metadata: EventMetadata;
  readonly timestamp: Date;
}

/**
 * Event headers
 */
export interface EventHeaders {
  readonly contentType?: string;
  readonly contentEncoding?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly messageId?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly customHeaders?: Record<string, unknown>;
}

/**
 * Event metadata
 */
export interface EventMetadata {
  readonly source?: string;
  readonly version?: string;
  readonly schema?: string;
  readonly ttlMs?: number;
  readonly partitionKey?: string;
  readonly routingKey?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Event transport
 * Canonical interface for event transport
 */
export interface EventTransport {
  readonly transportId: string;
  readonly transportType: EventTransportType;

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
 * Event transport type
 */
export enum EventTransportType {
  KAFKA = 'kafka',
  NATS = 'nats',
  REDIS_STREAMS = 'redis_streams',
  AWS_EVENTBRIDGE = 'aws_eventbridge',
  GOOGLE_PUBSUB = 'google_pubsub',
  AZURE_EVENT_HUBS = 'azure_event_hubs',
  RABBITMQ = 'rabbitmq',
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
 * Event subscription
 */
export interface EventSubscription {
  readonly subscriptionId: string;
  readonly topic: string;
  readonly subscribedAt: Date;
  readonly status: SubscriptionStatus;
  readonly options: EventSubscriptionOptions;
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
 * Event channel
 * Canonical interface for event channels
 */
export interface EventChannel {
  readonly channelId: string;
  readonly channelType: ChannelType;

  /**
   * Publish to channel
   */
  publish(event: RuntimeEvent): Promise<void>;

  /**
   * Subscribe to channel
   */
  subscribe(handler: EventHandler): Promise<void>;

  /**
   * Unsubscribe from channel
   */
  unsubscribe(handlerId: string): Promise<void>;

  /**
   * Close channel
   */
  close(): Promise<void>;
}

/**
 * Channel type
 */
export enum ChannelType {
  TOPIC = 'topic',
  QUEUE = 'queue',
  STREAM = 'stream',
  DIRECT = 'direct',
  FANOUT = 'fanout',
  TOPIC_FANOUT = 'topic_fanout',
}

/**
 * Event routing strategy
 */
export enum EventRoutingStrategy {
  DIRECT = 'direct',
  TOPIC = 'topic',
  FANOUT = 'fanout',
  HEADER = 'header',
  CONSISTENT_HASH = 'consistent_hash',
  ROUND_ROBIN = 'round_robin',
  CUSTOM = 'custom',
}

/**
 * Event delivery guarantee
 */
export enum EventDeliveryGuarantee {
  AT_LEAST_ONCE = 'at_least_once',
  AT_MOST_ONCE = 'at_most_once',
  EXACTLY_ONCE = 'exactly_once',
}

/**
 * Event ordering guarantee
 */
export enum EventOrderingGuarantee {
  UNORDERED = 'unordered',
  PER_PARTITION = 'per_partition',
  PER_KEY = 'per_key',
  GLOBAL = 'global',
}

/**
 * Event bus capabilities
 */
export interface EventBusCapabilities {
  readonly deliveryGuarantees: readonly EventDeliveryGuarantee[];
  readonly orderingGuarantees: readonly EventOrderingGuarantee[];
  readonly routingStrategies: readonly EventRoutingStrategy[];
  readonly channelTypes: readonly ChannelType[];
  readonly supportsFanout: boolean;
  readonly supportsTopicRouting: boolean;
  readonly supportsPartitioning: boolean;
  readonly supportsReplay: boolean;
  readonly supportsCompaction: boolean;
  readonly supportsRetention: boolean;
  readonly supportsTTL: boolean;
  readonly maxMessageSizeBytes?: number;
  readonly maxRetentionMs?: number;
}

/**
 * Event adapter config
 */
export interface EventBusAdapterConfig {
  readonly connectionOptions: EventConnectionOptions;
  readonly topicOptions: TopicOptions;
  readonly subscriptionOptions: SubscriptionOptions;
  readonly publisherOptions: PublisherOptions;
}

/**
 * Event connection options
 */
export interface EventConnectionOptions {
  readonly connectionString?: string;
  readonly brokers?: readonly string[];
  readonly clientId?: string;
  readonly groupId?: string;
  readonly timeoutMs?: number;
  readonly keepAlive?: boolean;
  readonly security?: SecurityOptions;
}

/**
 * Topic options
 */
export interface TopicOptions {
  readonly partitions?: number;
  readonly replicationFactor?: number;
  readonly retentionMs?: number;
  readonly compactionEnabled?: boolean;
  readonly ttlMs?: number;
  readonly maxSizeBytes?: number;
}

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  readonly durable?: boolean;
  readonly fromBeginning?: boolean;
  readonly consumerGroup?: string;
  readonly autoCommit?: boolean;
  readonly commitIntervalMs?: number;
  readonly prefetchCount?: number;
}

/**
 * Publisher options
 */
export interface PublisherOptions {
  readonly ackEnabled?: boolean;
  readonly timeoutMs?: number;
  readonly retries?: number;
  readonly compression?: EventCompression;
}

/**
 * Event compression
 */
export enum EventCompression {
  NONE = 'none',
  GZIP = 'gzip',
  SNAPPY = 'snappy',
  LZ4 = 'lz4',
  ZSTD = 'zstd',
}

/**
 * Event publish options
 */
export interface EventPublishOptions {
  readonly headers?: EventHeaders;
  readonly metadata?: EventMetadata;
  readonly partitionKey?: string;
  readonly routingKey?: string;
  readonly ttlMs?: number;
  readonly compression?: EventCompression;
  readonly guarantee?: EventDeliveryGuarantee;
}

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  readonly fromBeginning?: boolean;
  readonly filter?: EventFilter;
  readonly consumerGroup?: string;
  readonly autoCommit?: boolean;
  readonly commitIntervalMs?: number;
  readonly prefetchCount?: number;
}

/**
 * Event filter
 */
export interface EventFilter {
  readonly eventType?: string;
  readonly headers?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly after?: Date;
  readonly before?: Date;
}

/**
 * Event handler
 */
export type EventHandler = (event: RuntimeEvent) => Promise<void>;

/**
 * Event publish result
 */
export interface EventPublishResult {
  readonly eventId: string;
  readonly success: boolean;
  readonly publishedAt: Date;
  readonly partition?: number;
  readonly offset?: number;
  readonly error?: EventError;
}

/**
 * Event error
 */
export interface EventError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Topic info
 */
export interface TopicInfo {
  readonly topic: string;
  readonly partitions: number;
  readonly replicationFactor?: number;
  readonly retentionMs?: number;
  readonly compactionEnabled?: boolean;
  readonly createdAt?: Date;
  readonly messageCount?: number;
}

/**
 * Topic filter
 */
export interface TopicFilter {
  readonly pattern?: string;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Event bus health status
 */
export interface EventBusHealthStatus {
  readonly healthy: boolean;
  readonly connected: boolean;
  readonly topicCount: number;
  readonly subscriptionCount: number;
  readonly messageRate: {
    readonly publishedPerMinute: number;
    readonly consumedPerMinute: number;
  };
  readonly errorCount: number;
  readonly lastError?: EventError;
}

/**
 * Event provider
 * Canonical interface for event provider implementation
 */
export interface EventProvider {
  readonly providerId: string;
  readonly providerType: string;
  readonly version: string;

  /**
   * Create adapter
   */
  createAdapter(config: EventBusAdapterConfig): EventBusAdapter;

  /**
   * Validate config
   */
  validateConfig(config: EventBusAdapterConfig): Promise<EventConfigValidationResult>;

  /**
   * Get capabilities
   */
  getCapabilities(): EventBusCapabilities;

  /**
   * Get provider metadata
   */
  getMetadata(): EventProviderMetadata;
}

/**
 * Event config validation result
 */
export interface EventConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Event provider metadata
 */
export interface EventProviderMetadata {
  readonly providerId: string;
  readonly providerType: string;
  readonly version: string;
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Event consumer
 * Canonical interface for event consumption
 */
export interface EventConsumer {
  readonly consumerId: string;
  readonly subscriptionId: string;

  /**
   * Start consuming
   */
  start(): Promise<void>;

  /**
   * Stop consuming
   */
  stop(): Promise<void>;

  /**
   * Pause consuming
   */
  pause(): Promise<void>;

  /**
   * Resume consuming
   */
  resume(): Promise<void>;

  /**
   * Commit offsets
   */
  commitOffsets(): Promise<void>;

  /**
   * Get status
   */
  getStatus(): Promise<EventConsumerStatus>;

  /**
   * Get statistics
   */
  getStatistics(): Promise<EventConsumerStatistics>;
}

/**
 * Event consumer status
 */
export enum EventConsumerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  REBALANCING = 'rebalancing',
  ERROR = 'error',
}

/**
 * Event consumer statistics
 */
export interface EventConsumerStatistics {
  readonly eventsConsumed: number;
  readonly eventsProcessed: number;
  readonly eventsFailed: number;
  readonly averageProcessingTimeMs: number;
  readonly currentOffset?: number;
  readonly currentLag?: number;
  readonly lastEventAt?: Date;
}

/**
 * Event publisher
 * Canonical interface for event publishing
 */
export interface EventPublisher {
  readonly publisherId: string;

  /**
   * Publish event
   */
  publish(
    topic: string,
    event: RuntimeEvent,
    options?: EventPublishOptions
  ): Promise<EventPublishResult>;

  /**
   * Publish batch
   */
  publishBatch(
    topic: string,
    events: readonly RuntimeEvent[],
    options?: EventPublishOptions
  ): Promise<readonly EventPublishResult[]>;

  /**
   * Get statistics
   */
  getStatistics(): Promise<EventPublisherStatistics>;
}

/**
 * Event publisher statistics
 */
export interface EventPublisherStatistics {
  readonly eventsPublished: number;
  readonly eventsFailed: number;
  readonly averagePublishTimeMs: number;
  readonly lastPublishAt?: Date;
}

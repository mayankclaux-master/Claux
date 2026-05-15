/**
 * Queue Adapter Contracts
 * 
 * Pure abstractions for queue systems
 * No BullMQ, Redis, or queue implementation logic
 */

/**
 * Queue message
 */
export interface QueueMessage {
  readonly messageId: string;
  readonly queueName: string;
  readonly payload: unknown;
  readonly headers: QueueMessageHeaders;
  readonly metadata: QueueMessageMetadata;
  readonly deliveryCount: number;
  readonly enqueuedAt: Date;
  readonly scheduledAt?: Date;
}

/**
 * Queue message headers
 */
export interface QueueMessageHeaders {
  readonly contentType?: string;
  readonly contentEncoding?: string;
  readonly correlationId?: string;
  readonly replyTo?: string;
  readonly messageId?: string;
  readonly timestamp?: Date;
  readonly customHeaders?: Record<string, unknown>;
}

/**
 * Queue message metadata
 */
export interface QueueMessageMetadata {
  readonly priority?: number;
  readonly delayMs?: number;
  readonly ttlMs?: number;
  readonly retryCount?: number;
  readonly maxRetries?: number;
  readonly deadLetterQueue?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Queue lease
 */
export interface QueueLease {
  readonly leaseId: string;
  readonly messageId: string;
  readonly queueName: string;
  readonly leasedAt: Date;
  readonly leaseExpiresAt: Date;
  readonly visibilityTimeoutMs: number;
  readonly leaseCount: number;
}

/**
 * Queue delivery semantics
 */
export enum QueueDeliverySemantics {
  AT_LEAST_ONCE = 'at_least_once',
  AT_MOST_ONCE = 'at_most_once',
  EXACTLY_ONCE = 'exactly_once',
}

/**
 * Queue acknowledgment semantics
 */
export enum QueueAcknowledgmentSemantics {
  AUTO = 'auto',
  MANUAL = 'manual',
  TRANSACTIONAL = 'transactional',
}

/**
 * Queue ordering
 */
export enum QueueOrdering {
  FIFO = 'fifo',
  LIFO = 'lifo',
  PRIORITY = 'priority',
  UNORDERED = 'unordered',
}

/**
 * Queue capabilities
 */
export interface QueueCapabilities {
  readonly deliverySemantics: readonly QueueDeliverySemantics[];
  readonly acknowledgmentSemantics: readonly QueueAcknowledgmentSemantics[];
  readonly ordering: readonly QueueOrdering[];
  readonly supportsDeadLetter: boolean;
  readonly supportsDelayedDelivery: boolean;
  readonly supportsPriority: boolean;
  readonly supportsVisibilityTimeout: boolean;
  readonly supportsBatching: boolean;
  readonly supportsTransactions: boolean;
  readonly supportsLeasing: boolean;
  readonly maxMessageSizeBytes?: number;
  readonly maxRetentionMs?: number;
}

/**
 * Queue adapter
 * Canonical interface for queue operations
 */
export interface QueueAdapter {
  readonly adapterId: string;
  readonly providerType: string;
  readonly capabilities: QueueCapabilities;

  /**
   * Initialize adapter
   */
  initialize(config: QueueAdapterConfig): Promise<void>;

  /**
   * Publish message
   */
  publish(
    queueName: string,
    payload: unknown,
    options?: QueuePublishOptions
  ): Promise<QueuePublishResult>;

  /**
   * Publish batch
   */
  publishBatch(
    queueName: string,
    messages: readonly unknown[],
    options?: QueuePublishOptions
  ): Promise<readonly QueuePublishResult[]>;

  /**
   * Consume message
   */
  consume(
    queueName: string,
    options?: QueueConsumeOptions
  ): Promise<QueueMessage | null>;

  /**
   * Consume batch
   */
  consumeBatch(
    queueName: string,
    batchSize: number,
    options?: QueueConsumeOptions
  ): Promise<readonly QueueMessage[]>;

  /**
   * Acknowledge message
   */
  acknowledge(
    messageId: string,
    queueName: string
  ): Promise<void>;

  /**
   * Negative acknowledge (reject)
   */
  negativeAcknowledge(
    messageId: string,
    queueName: string,
    options?: QueueRejectOptions
  ): Promise<void>;

  /**
   * Extend lease
   */
  extendLease(
    leaseId: string,
    additionalTimeMs: number
  ): Promise<QueueLease>;

  /**
   * Release lease
   */
  releaseLease(leaseId: string): Promise<void>;

  /**
   * Get queue depth
   */
  getQueueDepth(queueName: string): Promise<number>;

  /**
   * Purge queue
   */
  purgeQueue(queueName: string): Promise<void>;

  /**
   * Delete message
   */
  deleteMessage(
    messageId: string,
    queueName: string
  ): Promise<void>;

  /**
   * Get message
   */
  getMessage(
    messageId: string,
    queueName: string
  ): Promise<QueueMessage | null>;

  /**
   * Move to dead letter
   */
  moveToDeadLetter(
    messageId: string,
    queueName: string,
    reason: string
  ): Promise<void>;

  /**
   * Health check
   */
  healthCheck(): Promise<QueueHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Queue adapter config
 */
export interface QueueAdapterConfig {
  readonly connectionOptions: QueueConnectionOptions;
  readonly queueOptions: QueueOptions;
  readonly consumerOptions: QueueConsumerOptions;
  readonly producerOptions: QueueProducerOptions;
}

/**
 * Queue connection options
 */
export interface QueueConnectionOptions {
  readonly connectionString?: string;
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly timeoutMs?: number;
  readonly maxConnections?: number;
  readonly keepAlive?: boolean;
}

/**
 * Queue options
 */
export interface QueueOptions {
  readonly defaultVisibilityTimeoutMs?: number;
  readonly defaultTtlMs?: number;
  readonly defaultMaxRetries?: number;
  readonly deadLetterEnabled?: boolean;
  readonly deadLetterQueue?: string;
  readonly durable?: boolean;
}

/**
 * Queue consumer options
 */
export interface QueueConsumerOptions {
  readonly prefetchCount?: number;
  readonly acknowledgmentTimeoutMs?: number;
  readonly autoAcknowledge?: boolean;
  readonly retryOnFailure?: boolean;
  readonly visibilityTimeoutMs?: number;
}

/**
 * Queue producer options
 */
export interface QueueProducerOptions {
  readonly persistent?: boolean;
  readonly compression?: boolean;
  readonly batchEnabled?: boolean;
  readonly batchSize?: number;
  readonly batchTimeoutMs?: number;
}

/**
 * Queue publish options
 */
export interface QueuePublishOptions {
  readonly headers?: QueueMessageHeaders;
  readonly metadata?: QueueMessageMetadata;
  readonly delayMs?: number;
  readonly priority?: number;
  readonly ttlMs?: number;
  readonly transactionId?: string;
}

/**
 * Queue consume options
 */
export interface QueueConsumeOptions {
  readonly visibilityTimeoutMs?: number;
  readonly waitTimeMs?: number;
  readonly maxMessages?: number;
  readonly filter?: QueueMessageFilter;
}

/**
 * Queue message filter
 */
export interface QueueMessageFilter {
  readonly headers?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly priority?: {
    readonly min?: number;
    readonly max?: number;
  };
}

/**
 * Queue reject options
 */
export interface QueueRejectOptions {
  readonly requeue?: boolean;
  readonly delayMs?: number;
  readonly reason?: string;
}

/**
 * Queue publish result
 */
export interface QueuePublishResult {
  readonly messageId: string;
  readonly success: boolean;
  readonly enqueuedAt: Date;
  readonly error?: QueueError;
}

/**
 * Queue error
 */
export interface QueueError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Queue health status
 */
export interface QueueHealthStatus {
  readonly healthy: boolean;
  readonly connected: boolean;
  readonly queueDepths: Record<string, number>;
  readonly messageRate: {
    readonly publishedPerMinute: number;
    readonly consumedPerMinute: number;
  };
  readonly errorCount: number;
  readonly lastError?: QueueError;
}

/**
 * Queue provider
 * Canonical interface for queue provider implementation
 */
export interface QueueProvider {
  readonly providerId: string;
  readonly providerType: string;
  readonly version: string;

  /**
   * Create adapter
   */
  createAdapter(config: QueueAdapterConfig): QueueAdapter;

  /**
   * Validate config
   */
  validateConfig(config: QueueAdapterConfig): Promise<QueueConfigValidationResult>;

  /**
   * Get capabilities
   */
  getCapabilities(): QueueCapabilities;

  /**
   * Get provider metadata
   */
  getMetadata(): QueueProviderMetadata;
}

/**
 * Queue config validation result
 */
export interface QueueConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Queue provider metadata
 */
export interface QueueProviderMetadata {
  readonly providerId: string;
  readonly providerType: string;
  readonly version: string;
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Queue consumer
 * Canonical interface for queue consumption
 */
export interface QueueConsumer {
  readonly consumerId: string;
  readonly queueName: string;

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
   * Get status
   */
  getStatus(): Promise<QueueConsumerStatus>;

  /**
   * Get statistics
   */
  getStatistics(): Promise<QueueConsumerStatistics>;
}

/**
 * Queue consumer status
 */
export enum QueueConsumerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Queue consumer statistics
 */
export interface QueueConsumerStatistics {
  readonly messagesConsumed: number;
  readonly messagesAcknowledged: number;
  readonly messagesRejected: number;
  readonly messagesFailed: number;
  readonly averageProcessingTimeMs: number;
  readonly lastMessageAt?: Date;
}

/**
 * Queue publisher
 * Canonical interface for queue publishing
 */
export interface QueuePublisher {
  readonly publisherId: string;

  /**
   * Publish message
   */
  publish(
    queueName: string,
    payload: unknown,
    options?: QueuePublishOptions
  ): Promise<QueuePublishResult>;

  /**
   * Publish batch
   */
  publishBatch(
    queueName: string,
    messages: readonly unknown[],
    options?: QueuePublishOptions
  ): Promise<readonly QueuePublishResult[]>;

  /**
   * Get statistics
   */
  getStatistics(): Promise<QueuePublisherStatistics>;
}

/**
 * Queue publisher statistics
 */
export interface QueuePublisherStatistics {
  readonly messagesPublished: number;
  readonly messagesFailed: number;
  readonly averagePublishTimeMs: number;
  readonly lastPublishAt?: Date;
}

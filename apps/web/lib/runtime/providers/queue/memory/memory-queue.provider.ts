/**
 * Memory Queue Provider
 * 
 * Reference implementation of QueueAdapter for in-memory queue semantics.
 * Validates queue adapter contracts and runtime queue semantics.
 * 
 * This is a semantic validation provider, NOT production-ready.
 * For production, use BullMQ, Redis, Kafka, or SQS.
 * 
 * Implements:
 * - enqueue
 * - dequeue
 * - leasing
 * - retries
 * - visibility timeout
 * - acknowledgements
 * - dead-letter handling
 */

import type {
  QueueAdapter,
  QueueAdapterConfig,
  QueuePublishOptions,
  QueueConsumeOptions,
  QueueRejectOptions,
  QueuePublishResult,
  QueueMessage,
  QueueLease,
  QueueHealthStatus,
  QueueError,
  QueueCapabilities,
} from '../../../adapters';
import {
  QueueDeliverySemantics,
  QueueAcknowledgmentSemantics,
  QueueOrdering,
} from '../../../adapters';

export interface MemoryQueueProviderConfig extends QueueAdapterConfig {
  readonly maxQueueSize?: number;
  readonly defaultMaxRetries?: number;
  readonly defaultVisibilityTimeoutMs?: number;
}

export class MemoryQueueProvider implements QueueAdapter {
  readonly adapterId: string;
  readonly providerType: string = 'memory';
  readonly capabilities: QueueCapabilities;

  private initialized: boolean = false;
  private queues: Map<string, Map<string, QueueMessage>> = new Map();
  private deadLetterQueues: Map<string, Map<string, QueueMessage>> = new Map();
  private leases: Map<string, QueueLease> = new Map();
  private messageIdCounter: number = 0;
  private leaseIdCounter: number = 0;
  private config: QueueAdapterConfig;

  constructor(config: QueueAdapterConfig) {
    this.adapterId = `memory-queue-${Date.now()}`;
    this.config = config;
    this.capabilities = {
      deliverySemantics: [QueueDeliverySemantics.AT_LEAST_ONCE],
      acknowledgmentSemantics: [QueueAcknowledgmentSemantics.MANUAL],
      ordering: [QueueOrdering.FIFO],
      supportsDeadLetter: true,
      supportsDelayedDelivery: false,
      supportsPriority: true,
      supportsVisibilityTimeout: true,
      supportsBatching: true,
      supportsTransactions: false,
      supportsLeasing: true,
    };
  }

  // =====================================================
  // QueueAdapter Implementation
  // =====================================================

  async initialize(config: QueueAdapterConfig): Promise<void> {
    this.config = config;
    this.initialized = true;
  }

  async publish(
    queueName: string,
    payload: unknown,
    options?: QueuePublishOptions
  ): Promise<QueuePublishResult> {
    if (!this.initialized) {
      throw new Error('Queue provider not initialized');
    }

    const queue = this.getOrCreateQueue(queueName);
    const maxQueueSize = this.config.queueOptions?.defaultMaxRetries ?? 1000;

    if (queue.size >= maxQueueSize) {
      return {
        messageId: '',
        success: false,
        enqueuedAt: new Date(),
        error: {
          code: 'QUEUE_FULL',
          message: 'Queue is full',
        },
      };
    }

    const messageId = `msg-${++this.messageIdCounter}`;
    const message: QueueMessage = {
      messageId,
      queueName,
      payload,
      headers: options?.headers ?? {},
      metadata: {
        ...options?.metadata,
        retryCount: 0,
        maxRetries: this.config.queueOptions?.defaultMaxRetries ?? 3,
      },
      deliveryCount: 0,
      enqueuedAt: new Date(),
    };

    queue.set(messageId, message);

    return {
      messageId,
      success: true,
      enqueuedAt: message.enqueuedAt,
    };
  }

  async publishBatch(
    queueName: string,
    messages: readonly unknown[],
    options?: QueuePublishOptions
  ): Promise<readonly QueuePublishResult[]> {
    const results: QueuePublishResult[] = [];
    for (const payload of messages) {
      const result = await this.publish(queueName, payload, options);
      results.push(result);
    }
    return results;
  }

  async consume(
    queueName: string,
    options?: QueueConsumeOptions
  ): Promise<QueueMessage | null> {
    if (!this.initialized) {
      throw new Error('Queue provider not initialized');
    }

    const queue = this.queues.get(queueName);
    if (!queue || queue.size === 0) {
      return null;
    }

    // Find first non-leased message
    for (const [messageId, message] of queue.entries()) {
      if (!this.leases.has(messageId)) {
        // Acquire lease
        const leaseId = `lease-${++this.leaseIdCounter}`;
        const visibilityTimeoutMs = options?.visibilityTimeoutMs ?? 
          this.config.queueOptions?.defaultVisibilityTimeoutMs ?? 30000;

        const lease: QueueLease = {
          leaseId,
          messageId,
          queueName,
          leasedAt: new Date(),
          leaseExpiresAt: new Date(Date.now() + visibilityTimeoutMs),
          visibilityTimeoutMs,
          leaseCount: (message.metadata?.retryCount ?? 0) + 1,
        };

        this.leases.set(messageId, lease);

        // Update delivery count
        const updatedMessage: QueueMessage = {
          ...message,
          deliveryCount: message.deliveryCount + 1,
        };
        queue.set(messageId, updatedMessage);

        return updatedMessage;
      }
    }

    return null;
  }

  async consumeBatch(
    queueName: string,
    batchSize: number,
    options?: QueueConsumeOptions
  ): Promise<readonly QueueMessage[]> {
    const messages: QueueMessage[] = [];
    for (let i = 0; i < batchSize; i++) {
      const message = await this.consume(queueName, options);
      if (message) {
        messages.push(message);
      } else {
        break;
      }
    }
    return messages;
  }

  async acknowledge(messageId: string, queueName: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Queue provider not initialized');
    }

    const queue = this.queues.get(queueName);
    if (queue) {
      queue.delete(messageId);
    }
    this.leases.delete(messageId);
  }

  async negativeAcknowledge(
    messageId: string,
    queueName: string,
    options?: QueueRejectOptions
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Queue provider not initialized');
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      return;
    }

    const message = queue.get(messageId);
    if (!message) {
      return;
    }

    this.leases.delete(messageId);

    const retryCount = (message.metadata?.retryCount ?? 0) + 1;
    const maxRetries = message.metadata?.maxRetries ?? 3;

    if (retryCount >= maxRetries) {
      // Move to dead letter queue
      queue.delete(messageId);
      const deadLetterQueue = this.getOrCreateDeadLetterQueue(queueName);
      deadLetterQueue.set(messageId, message);
    } else {
      // Requeue with incremented retry count
      const updatedMessage: QueueMessage = {
        ...message,
        metadata: {
          ...message.metadata,
          retryCount,
        },
      };
      queue.set(messageId, updatedMessage);
    }
  }

  async extendLease(leaseId: string, additionalTimeMs: number): Promise<QueueLease> {
    if (!this.initialized) {
      throw new Error('Queue provider not initialized');
    }

    for (const [messageId, lease] of this.leases.entries()) {
      if (lease.leaseId === leaseId) {
        const updatedLease: QueueLease = {
          ...lease,
          leaseExpiresAt: new Date(lease.leaseExpiresAt.getTime() + additionalTimeMs),
          leaseCount: lease.leaseCount + 1,
        };
        this.leases.set(messageId, updatedLease);
        return updatedLease;
      }
    }

    throw new Error('Lease not found');
  }

  async releaseLease(leaseId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Queue provider not initialized');
    }

    for (const [messageId, lease] of this.leases.entries()) {
      if (lease.leaseId === leaseId) {
        this.leases.delete(messageId);
        return;
      }
    }

    throw new Error('Lease not found');
  }

  async getQueueDepth(queueName: string): Promise<number> {
    const queue = this.queues.get(queueName);
    return queue ? queue.size : 0;
  }

  async purgeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.clear();
    }
    this.deadLetterQueues.delete(queueName);
  }

  async deleteMessage(messageId: string, queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.delete(messageId);
    }
    this.leases.delete(messageId);
  }

  async getMessage(messageId: string, queueName: string): Promise<QueueMessage | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }
    return queue.get(messageId) ?? null;
  }

  async moveToDeadLetter(messageId: string, queueName: string, reason: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return;
    }

    const message = queue.get(messageId);
    if (!message) {
      return;
    }

    queue.delete(messageId);
    this.leases.delete(messageId);

    const deadLetterQueue = this.getOrCreateDeadLetterQueue(queueName);
    deadLetterQueue.set(messageId, message);
  }

  async healthCheck(): Promise<QueueHealthStatus> {
    return {
      connected: this.initialized,
      healthy: this.initialized,
      queueDepths: {},
      messageRate: {
        publishedPerMinute: 0,
        consumedPerMinute: 0,
      },
      errorCount: 0,
    };
  }

  async shutdown(): Promise<void> {
    this.queues.clear();
    this.deadLetterQueues.clear();
    this.leases.clear();
    this.initialized = false;
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private getOrCreateQueue(queueName: string): Map<string, QueueMessage> {
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = new Map();
      this.queues.set(queueName, queue);
    }
    return queue;
  }

  private getOrCreateDeadLetterQueue(queueName: string): Map<string, QueueMessage> {
    let deadLetterQueue = this.deadLetterQueues.get(queueName);
    if (!deadLetterQueue) {
      deadLetterQueue = new Map();
      this.deadLetterQueues.set(queueName, deadLetterQueue);
    }
    return deadLetterQueue;
  }
}

export function createMemoryQueueProvider(config: QueueAdapterConfig): MemoryQueueProvider {
  return new MemoryQueueProvider(config);
}

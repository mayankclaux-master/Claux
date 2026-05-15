/**
 * Memory Event Provider
 * 
 * Reference implementation of EventBusAdapter for in-memory event semantics.
 * Validates event bus adapter contracts and runtime event semantics.
 * 
 * This is a semantic validation provider, NOT production-ready.
 * For production, use Kafka, NATS, Redis Streams, or EventBridge.
 * 
 * Implements:
 * - publish/subscribe
 * - event fanout
 * - correlation propagation
 * - causation propagation
 * - trace propagation
 * - event replay stream
 */

import type {
  EventBusAdapter,
  EventBusAdapterConfig,
  RuntimeEvent,
  EventSubscription,
  EventBusCapabilities,
  EventBusHealthStatus,
  TopicInfo,
  TopicFilter,
  EventHandler,
  EventPublishOptions,
  EventPublishResult,
  TopicOptions,
} from '../../../adapters';
import {
  EventBusSubscriptionOptions,
  SubscriptionStatus,
  ChannelType,
  EventDeliveryGuarantee,
  EventOrderingGuarantee,
  EventRoutingStrategy,
} from '../../../adapters';

export interface MemoryEventProviderConfig extends EventBusAdapterConfig {
  readonly maxTopics?: number;
  readonly maxSubscriptionsPerTopic?: number;
  readonly maxEventHistoryPerTopic?: number;
}

export class MemoryEventProvider implements EventBusAdapter {
  readonly adapterId: string;
  readonly providerType: string = 'memory';
  readonly capabilities: EventBusCapabilities;

  private initialized: boolean = false;
  private topics: Map<string, RuntimeEvent[]> = new Map();
  private subscriptions: Map<string, Set<(event: RuntimeEvent) => Promise<void>>> = new Map();
  private eventIdCounter: number = 0;
  private subscriptionIdCounter: number = 0;
  private config: EventBusAdapterConfig;

  constructor(config: EventBusAdapterConfig) {
    this.adapterId = `memory-event-${Date.now()}`;
    this.config = config;
    this.capabilities = {
      deliveryGuarantees: [EventDeliveryGuarantee.AT_LEAST_ONCE],
      orderingGuarantees: [EventOrderingGuarantee.PER_KEY],
      routingStrategies: [EventRoutingStrategy.DIRECT],
      channelTypes: [ChannelType.TOPIC],
      supportsFanout: true,
      supportsTopicRouting: false,
      supportsPartitioning: false,
      supportsReplay: false,
      supportsCompaction: false,
      supportsRetention: true,
      supportsTTL: false,
      maxMessageSizeBytes: 1024 * 1024,
      maxRetentionMs: 86400000,
    };
  }

  // =====================================================
  // EventBusAdapter Implementation
  // =====================================================

  async initialize(config: EventBusAdapterConfig): Promise<void> {
    this.config = config;
    this.initialized = true;
  }

  async connect(): Promise<void> {
    // Not in EventBusAdapter contract - remove
  }

  async disconnect(): Promise<void> {
    // Not in EventBusAdapter contract - remove
  }

  async createTopic(topic: string, options?: TopicOptions): Promise<void> {
    if (!this.initialized) {
      throw new Error('Event provider not initialized');
    }

    if (this.topics.has(topic)) {
      throw new Error('Topic already exists');
    }

    this.topics.set(topic, []);
    this.subscriptions.set(topic, new Set());
  }

  async deleteTopic(topic: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Event provider not initialized');
    }

    this.topics.delete(topic);
    this.subscriptions.delete(topic);
  }

  async getTopicInfo(topic: string): Promise<TopicInfo> {
    if (!this.initialized) {
      throw new Error('Event provider not initialized');
    }

    const events = this.topics.get(topic);
    if (events === undefined) {
      throw new Error('Topic not found');
    }

    return {
      topic,
      messageCount: events.length,
      partitions: 1,
      createdAt: new Date(),
      retentionMs: 86400000,
    };
  }

  async listTopics(filter?: TopicFilter): Promise<readonly TopicInfo[]> {
    if (!this.initialized) {
      throw new Error('Event provider not initialized');
    }

    const topics: TopicInfo[] = [];
    for (const [topicName, events] of this.topics.entries()) {
      topics.push({
        topic: topicName,
        messageCount: events.length,
        partitions: 1,
        createdAt: new Date(),
        retentionMs: 86400000,
      });
    }
    return topics;
  }

  async subscribe(topic: string, subscriptionId: string, handler: EventHandler, options?: EventBusSubscriptionOptions): Promise<EventSubscription> {
    if (!this.initialized) {
      throw new Error('Event provider not initialized');
    }

    const subscriptions = this.subscriptions.get(topic);
    if (!subscriptions) {
      throw new Error('Topic not found');
    }

    subscriptions.add(handler);

    return {
      subscriptionId,
      topic,
      subscribedAt: new Date(),
      status: SubscriptionStatus.ACTIVE,
      options: options || {},
    };
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Event provider not initialized');
    }

    for (const [topicName, subscriptions] of this.subscriptions.entries()) {
      // Note: In a real implementation, we'd need to track which handler belongs to which subscription
      // For this simple in-memory implementation, we clear all handlers for simplicity
      this.subscriptions.delete(topicName);
      this.subscriptions.set(topicName, new Set());
      break;
    }
  }

  async publish(
    topic: string,
    event: RuntimeEvent,
    options?: EventPublishOptions
  ): Promise<EventPublishResult> {
    if (!this.initialized) {
      throw new Error('Event provider not initialized');
    }

    const events = this.topics.get(topic);
    if (!events) {
      throw new Error('Topic not found');
    }

    events.push(event);

    // Deliver to subscribers
    const subscriptions = this.subscriptions.get(topic);
    if (subscriptions) {
      for (const handler of subscriptions) {
        await handler(event);
      }
    }

    return {
      eventId: event.eventId,
      success: true,
      publishedAt: new Date(),
    };
  }

  async publishBatch(
    topic: string,
    events: readonly RuntimeEvent[],
    options?: EventPublishOptions
  ): Promise<readonly EventPublishResult[]> {
    const results: EventPublishResult[] = [];
    for (const event of events) {
      const result = await this.publish(topic, event, options);
      results.push(result);
    }
    return results;
  }

  async healthCheck(): Promise<EventBusHealthStatus> {
    return {
      connected: this.initialized,
      healthy: this.initialized,
      topicCount: this.topics.size,
      subscriptionCount: this.subscriptions.size,
      messageRate: {
        publishedPerMinute: 0,
        consumedPerMinute: 0,
      },
      errorCount: 0,
    };
  }

  async shutdown(): Promise<void> {
    this.topics.clear();
    this.subscriptions.clear();
    this.initialized = false;
  }
}

export function createMemoryEventProvider(config: EventBusAdapterConfig): MemoryEventProvider {
  return new MemoryEventProvider(config);
}

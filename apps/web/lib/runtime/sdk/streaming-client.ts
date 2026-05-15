/**
 * CLAUX Runtime SDK Layer - Streaming Client
 */

import type { Subscription, SubscriptionId } from './types';
import { StreamingError } from './errors';

/**
 * Streaming Client Manager
 */
export class StreamingClientManager {
  private subscriptions: Map<SubscriptionId, Subscription> = new Map();
  private messages: Map<string, unknown[]> = new Map();

  /**
   * Subscribe
   */
  subscribe(topic: string): Subscription {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: Subscription = {
      subscriptionId,
      topic,
      active: true,
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Unsubscribe
   */
  unsubscribe(subscriptionId: SubscriptionId): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Publish
   */
  publish(topic: string, data: unknown): void {
    const messages = this.messages.get(topic) || [];
    messages.push(data);
    this.messages.set(topic, messages);
  }

  /**
   * Receive
   */
  receive(topic: string): readonly unknown[] {
    return this.messages.get(topic) || [];
  }

  /**
   * Clear
   */
  clear(): void {
    this.subscriptions.clear();
    this.messages.clear();
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): SubscriptionId {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

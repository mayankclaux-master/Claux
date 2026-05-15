/**
 * CLAUX Runtime SDK Layer - Subscription Semantics
 */

import type { Subscription, SubscriptionId } from './types';
import { DEFAULT_SUBSCRIPTION_TTL } from './constants';

/**
 * Subscription Semantics Manager
 */
export class SubscriptionSemanticsManager {
  private subscriptions: Map<SubscriptionId, Subscription> = new Map();

  /**
   * Create subscription
   */
  create(topic: string): Subscription {
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
   * Validate subscription
   */
  validate(subscriptionId: SubscriptionId): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    const age = Date.now() - subscription.createdAt;
    return age < DEFAULT_SUBSCRIPTION_TTL;
  }

  /**
   * Deactivate
   */
  deactivate(subscriptionId: SubscriptionId): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    const updated: Subscription = {
      ...subscription,
      active: false,
    };

    this.subscriptions.set(subscriptionId, updated);
  }

  /**
   * Clear
   */
  clear(): void {
    this.subscriptions.clear();
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): SubscriptionId {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

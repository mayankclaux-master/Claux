/**
 * CLAUX Runtime SDK Layer - Types
 */

export type SessionId = string;
export type SubscriptionId = string;
export type StreamId = string;

/**
 * Session
 */
export interface Session {
  readonly sessionId: SessionId;
  readonly createdAt: number;
  readonly tenantId?: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Subscription
 */
export interface Subscription {
  readonly subscriptionId: SubscriptionId;
  readonly topic: string;
  readonly active: boolean;
  readonly createdAt: number;
}

/**
 * Stream
 */
export interface Stream {
  readonly streamId: StreamId;
  readonly type: 'execution' | 'replay' | 'telemetry';
  readonly active: boolean;
}

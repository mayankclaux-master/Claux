/**
 * CLAUX Runtime SDK Layer - SDK Contracts
 */

import type { Session, Subscription } from './types';

/**
 * Runtime Client Contract
 */
export interface RuntimeClientContract {
  readonly connect: () => Promise<Session>;
  readonly disconnect: (sessionId: string) => Promise<void>;
  readonly execute: (sessionId: string, graph: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Streaming Contract
 */
export interface StreamingContract {
  readonly subscribe: (topic: string) => Promise<Subscription>;
  readonly unsubscribe: (subscriptionId: string) => Promise<void>;
  readonly publish: (topic: string, data: unknown) => Promise<void>;
}

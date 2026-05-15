/**
 * CLAUX Runtime Security Layer - Secure Replay
 */

import type { IdentityId } from './types';

/**
 * Replay Security Context
 */
export interface ReplaySecurityContext {
  readonly replayId: string;
  readonly identityId: IdentityId;
  readonly timestamp: number;
  readonly signature?: string;
}

/**
 * Secure Replay Manager
 */
export class SecureReplayManager {
  private contexts: Map<string, ReplaySecurityContext> = new Map();

  /**
   * Create replay context
   */
  createContext(replayId: string, identityId: IdentityId): ReplaySecurityContext {
    const context: ReplaySecurityContext = {
      replayId,
      identityId,
      timestamp: Date.now(),
    };

    this.contexts.set(replayId, context);
    return context;
  }

  /**
   * Validate replay
   */
  validateReplay(replayId: string, identityId: IdentityId): boolean {
    const context = this.contexts.get(replayId);
    if (!context) return false;

    return context.identityId === identityId;
  }

  /**
   * Sign replay
   */
  signReplay(replayId: string, signature: string): void {
    const context = this.contexts.get(replayId);
    if (!context) return;

    const updated: ReplaySecurityContext = {
      ...context,
      signature,
    };

    this.contexts.set(replayId, updated);
  }

  /**
   * Get context
   */
  getContext(replayId: string): ReplaySecurityContext | undefined {
    return this.contexts.get(replayId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.contexts.clear();
  }
}

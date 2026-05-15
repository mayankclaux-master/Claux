/**
 * CLAUX Runtime Security Layer - Secure Context
 */

import type { IdentityId } from './types';

/**
 * Secure Context
 */
export interface SecureContext {
  readonly identityId: IdentityId;
  readonly tenantId?: string;
  readonly timestamp: number;
  readonly metadata: Record<string, unknown>;
}

/**
 * Secure Context Manager
 */
export class SecureContextManager {
  private contexts: Map<string, SecureContext> = new Map();

  /**
   * Create context
   */
  createContext(identityId: IdentityId, tenantId?: string, metadata: Record<string, unknown> = {}): SecureContext {
    const contextId = this.generateContextId();
    const context: SecureContext = {
      identityId,
      tenantId,
      timestamp: Date.now(),
      metadata,
    };

    this.contexts.set(contextId, context);
    return context;
  }

  /**
   * Get context
   */
  getContext(contextId: string): SecureContext | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Validate context
   */
  validateContext(contextId: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) return false;

    const age = Date.now() - context.timestamp;
    return age < 3600000; // 1 hour TTL
  }

  /**
   * Clear
   */
  clear(): void {
    this.contexts.clear();
  }

  /**
   * Generate context ID
   */
  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * CLAUX Runtime Isolation Layer - Scheduling Fairness
 */

import type { TenantId } from './types';
import { DEFAULT_FAIRNESS_WEIGHT } from './constants';

/**
 * Fairness Token
 */
export interface FairnessToken {
  readonly tenantId: TenantId;
  readonly weight: number;
  readonly tokens: number;
}

/**
 * Scheduling Fairness Manager
 */
export class SchedulingFairnessManager {
  private tokens: Map<TenantId, FairnessToken> = new Map();

  /**
   * Register tenant
   */
  register(tenantId: TenantId, weight: number = DEFAULT_FAIRNESS_WEIGHT): void {
    const token: FairnessToken = {
      tenantId,
      weight,
      tokens: weight * 100,
    };
    this.tokens.set(tenantId, token);
  }

  /**
   * Acquire token
   */
  acquire(tenantId: TenantId): boolean {
    const token = this.tokens.get(tenantId);
    if (!token) return false;

    if (token.tokens > 0) {
      const updated: FairnessToken = {
        ...token,
        tokens: token.tokens - 1,
      };
      this.tokens.set(tenantId, updated);
      return true;
    }

    return false;
  }

  /**
   * Release token
   */
  release(tenantId: TenantId): void {
    const token = this.tokens.get(tenantId);
    if (!token) return;

    const updated: FairnessToken = {
      ...token,
      tokens: Math.min(token.tokens + 1, token.weight * 100),
    };
    this.tokens.set(tenantId, updated);
  }

  /**
   * Get tokens
   */
  getTokens(tenantId: TenantId): number {
    const token = this.tokens.get(tenantId);
    return token?.tokens || 0;
  }

  /**
   * Clear
   */
  clear(): void {
    this.tokens.clear();
  }
}

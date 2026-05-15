/**
 * CLAUX Runtime Isolation Layer - Tenant Replay
 */

import type { TenantId } from './types';

/**
 * Replay Context
 */
export interface ReplayContext {
  readonly replayId: string;
  readonly tenantId: TenantId;
  readonly timestamp: number;
  readonly state: Record<string, unknown>;
}

/**
 * Tenant Replay Manager
 */
export class TenantReplayManager {
  private contexts: Map<string, ReplayContext> = new Map();
  private tenantReplays: Map<TenantId, string[]> = new Map();

  /**
   * Create replay context
   */
  create(tenantId: TenantId, state: Record<string, unknown>): ReplayContext {
    const replayId = this.generateReplayId();
    const context: ReplayContext = {
      replayId,
      tenantId,
      timestamp: Date.now(),
      state,
    };

    this.contexts.set(replayId, context);

    const replays = this.tenantReplays.get(tenantId) || [];
    replays.push(replayId);
    this.tenantReplays.set(tenantId, replays);

    return context;
  }

  /**
   * Get context
   */
  get(replayId: string): ReplayContext | undefined {
    return this.contexts.get(replayId);
  }

  /**
   * Get tenant replays
   */
  getTenantReplays(tenantId: TenantId): readonly ReplayContext[] {
    const replayIds = this.tenantReplays.get(tenantId) || [];
    return replayIds.map(id => this.contexts.get(id)).filter((c): c is ReplayContext => c !== undefined);
  }

  /**
   * Clear
   */
  clear(): void {
    this.contexts.clear();
    this.tenantReplays.clear();
  }

  /**
   * Generate replay ID
   */
  private generateReplayId(): string {
    return `replay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

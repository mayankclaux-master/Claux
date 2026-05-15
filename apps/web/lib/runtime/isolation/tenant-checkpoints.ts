/**
 * CLAUX Runtime Isolation Layer - Tenant Checkpoints
 */

import type { TenantCheckpoint, TenantId } from './types';
import { CHECKPOINT_TTL } from './constants';

/**
 * Tenant Checkpoint Manager
 */
export class TenantCheckpointManager {
  private checkpoints: Map<string, TenantCheckpoint> = new Map();
  private tenantCheckpoints: Map<TenantId, string[]> = new Map();

  /**
   * Create checkpoint
   */
  create(tenantId: TenantId, state: Record<string, unknown>): TenantCheckpoint {
    const checkpointId = this.generateCheckpointId();
    const checkpoint: TenantCheckpoint = {
      checkpointId,
      tenantId,
      timestamp: Date.now(),
      state,
    };

    this.checkpoints.set(checkpointId, checkpoint);

    const cps = this.tenantCheckpoints.get(tenantId) || [];
    cps.push(checkpointId);
    this.tenantCheckpoints.set(tenantId, cps);

    return checkpoint;
  }

  /**
   * Get checkpoint
   */
  get(checkpointId: string): TenantCheckpoint | undefined {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return undefined;

    // Check TTL
    if (Date.now() - checkpoint.timestamp > CHECKPOINT_TTL) {
      this.checkpoints.delete(checkpointId);
      return undefined;
    }

    return checkpoint;
  }

  /**
   * Get tenant checkpoints
   */
  getTenantCheckpoints(tenantId: TenantId): readonly TenantCheckpoint[] {
    const cpIds = this.tenantCheckpoints.get(tenantId) || [];
    return cpIds.map(id => this.get(id)).filter((c): c is TenantCheckpoint => c !== undefined);
  }

  /**
   * Delete checkpoint
   */
  delete(checkpointId: string): void {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return;

    this.checkpoints.delete(checkpointId);

    const cps = this.tenantCheckpoints.get(checkpoint.tenantId) || [];
    const filtered = cps.filter(id => id !== checkpointId);
    this.tenantCheckpoints.set(checkpoint.tenantId, filtered);
  }

  /**
   * Clear
   */
  clear(): void {
    this.checkpoints.clear();
    this.tenantCheckpoints.clear();
  }

  /**
   * Generate checkpoint ID
   */
  private generateCheckpointId(): string {
    return `checkpoint_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

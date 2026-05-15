/**
 * CLAUX Runtime Distributed Layer - Ownership Coordinator
 * 
 * Coordinates resource ownership and transfers.
 * No external dependencies - pure coordination semantics.
 */

import type { WorkerId, LeaseId, LeaseResourceType, OwnershipInfo, OwnershipMetadata, OwnershipEpoch, LeaseInfo, LeaseResource } from '../types';
import { LeaseResourceType as LeaseResourceTypeEnum, LeaseState } from '../types';
import { OWNERSHIP_TRANSFER_TIMEOUT_MS, INITIAL_EPOCH, EPOCH_INCREMENT } from '../constants';
import { OwnershipConflictError, OwnershipNotFoundError, LeaseTransferError } from '../errors';

/**
 * Ownership Coordinator Configuration
 */
export interface OwnershipCoordinatorConfig {
  readonly transferTimeoutMs: number;
  readonly initialEpoch: number;
  readonly epochIncrement: number;
}

/**
 * Ownership Coordinator
 * 
 * Coordinates resource ownership and transfers across workers.
 */
export class OwnershipCoordinator {
  private config: OwnershipCoordinatorConfig;
  private ownershipMap: Map<string, OwnershipInfo> = new Map();
  private leaseMap: Map<LeaseId, LeaseInfo> = new Map();
  private currentEpoch: number;

  constructor(config: Partial<OwnershipCoordinatorConfig> = {}) {
    this.config = {
      transferTimeoutMs: config.transferTimeoutMs || OWNERSHIP_TRANSFER_TIMEOUT_MS,
      initialEpoch: config.initialEpoch || INITIAL_EPOCH,
      epochIncrement: config.epochIncrement || EPOCH_INCREMENT,
    };

    this.currentEpoch = this.config.initialEpoch;
  }

  /**
   * Acquire ownership of resource
   */
  async acquireOwnership(
    resourceId: string,
    resourceType: LeaseResourceType,
    workerId: WorkerId,
    leaseId: LeaseId
  ): Promise<OwnershipInfo> {
    // Check if resource already owned
    const existing = this.ownershipMap.get(resourceId);
    if (existing && existing.metadata.owner !== workerId) {
      throw new OwnershipConflictError(
        `Resource ${resourceId} is already owned by ${existing.metadata.owner}`,
        resourceId,
        existing.metadata.owner,
        workerId
      );
    }

    // Create ownership metadata
    const epoch = this.currentEpoch;
    const metadata: OwnershipMetadata = {
      resourceId,
      resourceType,
      owner: workerId,
      epoch,
      leaseId,
      acquiredAt: new Date(),
      history: [
        {
          epoch,
          owner: workerId,
          timestamp: new Date(),
          reason: 'initial_acquisition',
        },
      ],
    };

    // Create lease info
    const leaseInfo: LeaseInfo = {
      metadata: {
        leaseId,
        workerId,
        clusterId: 'default',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
        epoch,
      },
      state: LeaseState.ACTIVE,
      resource: {
        type: resourceType,
        resourceId,
        metadata: {},
      },
      renewals: 0,
      lastRenewed: new Date(),
    };

    // Create ownership info
    const ownershipInfo: OwnershipInfo = {
      metadata,
      leaseInfo,
      transferable: true,
      replaySafe: true,
    };

    this.ownershipMap.set(resourceId, ownershipInfo);
    this.leaseMap.set(leaseId, leaseInfo);
    this.currentEpoch += this.config.epochIncrement;

    return ownershipInfo;
  }

  /**
   * Transfer ownership to another worker
   */
  async transferOwnership(
    resourceId: string,
    fromWorker: WorkerId,
    toWorker: WorkerId
  ): Promise<OwnershipInfo> {
    const ownership = this.ownershipMap.get(resourceId);
    if (!ownership) {
      throw new OwnershipNotFoundError(`Resource ${resourceId} not found`, resourceId);
    }

    if (ownership.metadata.owner !== fromWorker) {
      throw new OwnershipConflictError(
        `Resource ${resourceId} is not owned by ${fromWorker}`,
        resourceId,
        ownership.metadata.owner,
        fromWorker
      );
    }

    if (!ownership.transferable) {
      throw new LeaseTransferError(
        `Resource ${resourceId} ownership is not transferable`,
        ownership.metadata.leaseId,
        fromWorker,
        toWorker
      );
    }

    // Create new lease
    const newLeaseId = this.generateLeaseId();
    const epoch = this.currentEpoch;
    const newLeaseInfo: LeaseInfo = {
      metadata: {
        leaseId: newLeaseId,
        workerId: toWorker,
        clusterId: 'default',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
        epoch,
      },
      state: LeaseState.ACTIVE,
      resource: ownership.leaseInfo.resource,
      renewals: 0,
      lastRenewed: new Date(),
    };

    // Update ownership metadata
    const newMetadata: OwnershipMetadata = {
      ...ownership.metadata,
      owner: toWorker,
      epoch,
      leaseId: newLeaseId,
      history: [
        ...ownership.metadata.history,
        {
          epoch,
          owner: toWorker,
          timestamp: new Date(),
          reason: 'ownership_transfer',
        },
      ],
    };

    const newOwnershipInfo: OwnershipInfo = {
      metadata: newMetadata,
      leaseInfo: newLeaseInfo,
      transferable: true,
      replaySafe: ownership.replaySafe,
    };

    this.ownershipMap.set(resourceId, newOwnershipInfo);
    this.leaseMap.delete(ownership.metadata.leaseId);
    this.leaseMap.set(newLeaseId, newLeaseInfo);
    this.currentEpoch += this.config.epochIncrement;

    return newOwnershipInfo;
  }

  /**
   * Release ownership
   */
  async releaseOwnership(resourceId: string, workerId: WorkerId): Promise<void> {
    const ownership = this.ownershipMap.get(resourceId);
    if (!ownership) {
      throw new OwnershipNotFoundError(`Resource ${resourceId} not found`, resourceId);
    }

    if (ownership.metadata.owner !== workerId) {
      throw new OwnershipConflictError(
        `Resource ${resourceId} is not owned by ${workerId}`,
        resourceId,
        ownership.metadata.owner,
        workerId
      );
    }

    this.leaseMap.delete(ownership.metadata.leaseId);
    this.ownershipMap.delete(resourceId);
  }

  /**
   * Get ownership info
   */
  getOwnership(resourceId: string): OwnershipInfo | undefined {
    const ownership = this.ownershipMap.get(resourceId);
    return ownership ? { ...ownership } : undefined;
  }

  /**
   * Get lease info
   */
  getLease(leaseId: LeaseId): LeaseInfo | undefined {
    const lease = this.leaseMap.get(leaseId);
    return lease ? { ...lease } : undefined;
  }

  /**
   * Check if worker owns resource
   */
  isOwner(resourceId: string, workerId: WorkerId): boolean {
    const ownership = this.ownershipMap.get(resourceId);
    return ownership?.metadata.owner === workerId;
  }

  /**
   * Get all resources owned by worker
   */
  getOwnedResources(workerId: WorkerId): readonly string[] {
    const owned: string[] = [];
    for (const [resourceId, ownership] of this.ownershipMap) {
      if (ownership.metadata.owner === workerId) {
        owned.push(resourceId);
      }
    }
    return owned;
  }

  /**
   * Validate ownership transfer
   */
  validateTransfer(resourceId: string, fromWorker: WorkerId, toWorker: WorkerId): boolean {
    const ownership = this.ownershipMap.get(resourceId);
    if (!ownership) return false;

    if (ownership.metadata.owner !== fromWorker) return false;

    if (!ownership.transferable) return false;

    return true;
  }

  /**
   * Get ownership statistics
   */
  getStatistics(): {
    totalOwnerships: number;
    totalLeases: number;
    ownershipByWorker: Map<WorkerId, number>;
    currentEpoch: number;
  } {
    const ownershipByWorker = new Map<WorkerId, number>();

    for (const ownership of this.ownershipMap.values()) {
      const count = ownershipByWorker.get(ownership.metadata.owner) || 0;
      ownershipByWorker.set(ownership.metadata.owner, count + 1);
    }

    return {
      totalOwnerships: this.ownershipMap.size,
      totalLeases: this.leaseMap.size,
      ownershipByWorker,
      currentEpoch: this.currentEpoch,
    };
  }

  /**
   * Generate lease ID
   */
  private generateLeaseId(): LeaseId {
    return `lease_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` as LeaseId;
  }

  /**
   * Reset coordinator
   */
  reset(): void {
    this.ownershipMap.clear();
    this.leaseMap.clear();
    this.currentEpoch = this.config.initialEpoch;
  }

  /**
   * Get configuration
   */
  getConfig(): OwnershipCoordinatorConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<OwnershipCoordinatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

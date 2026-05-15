/**
 * CLAUX Runtime Distributed Layer - Execution Ownership
 * 
 * Manages execution ownership and transfer.
 * No external dependencies - pure ownership semantics.
 */

import type { WorkerId, ExecutionId, OwnershipInfo, OwnershipMetadata, OwnershipEpoch, LeaseResourceType, LeaseState } from '../types';
import { LeaseResourceType as LeaseResourceTypeEnum, LeaseState as LeaseStateEnum } from '../types';
import { OwnershipConflictError, OwnershipNotFoundError } from '../errors';

/**
 * Execution Ownership Manager
 * 
 * Manages execution ownership and transfer.
 */
export class ExecutionOwnershipManager {
  private ownershipMap: Map<ExecutionId, OwnershipInfo> = new Map();
  private workerOwnership: Map<WorkerId, Set<ExecutionId>> = new Map();
  private currentEpoch: number = 0;

  constructor() {
    this.currentEpoch = 1;
  }

  /**
   * Acquire ownership of execution
   */
  async acquireOwnership(executionId: ExecutionId, workerId: WorkerId): Promise<OwnershipInfo> {
    // Check if execution already owned
    const existing = this.ownershipMap.get(executionId);
    if (existing && existing.metadata.owner !== workerId) {
      throw new OwnershipConflictError(
        `Execution ${executionId} is already owned by ${existing.metadata.owner}`,
        executionId,
        existing.metadata.owner,
        workerId
      );
    }

    const epoch = this.currentEpoch;
    const metadata: OwnershipMetadata = {
      resourceId: executionId,
      resourceType: LeaseResourceTypeEnum.EXECUTION,
      owner: workerId,
      epoch,
      leaseId: `lease_${executionId}_${Date.now()}`,
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

    const ownershipInfo: OwnershipInfo = {
      metadata,
      leaseInfo: {
        metadata: {
          leaseId: metadata.leaseId,
          workerId,
          clusterId: 'default',
          issuedAt: metadata.acquiredAt,
          expiresAt: new Date(Date.now() + 30000),
          epoch,
        },
        state: LeaseStateEnum.ACTIVE,
        resource: {
          type: LeaseResourceTypeEnum.EXECUTION,
          resourceId: executionId,
          metadata: {},
        },
        renewals: 0,
        lastRenewed: metadata.acquiredAt,
      },
      transferable: true,
      replaySafe: true,
    };

    this.ownershipMap.set(executionId, ownershipInfo);
    this.currentEpoch++;

    // Update worker ownership
    const workerExecs = this.workerOwnership.get(workerId) || new Set();
    workerExecs.add(executionId);
    this.workerOwnership.set(workerId, workerExecs);

    return ownershipInfo;
  }

  /**
   * Transfer ownership to another worker
   */
  async transferOwnership(executionId: ExecutionId, fromWorker: WorkerId, toWorker: WorkerId): Promise<OwnershipInfo> {
    const ownership = this.ownershipMap.get(executionId);
    if (!ownership) {
      throw new OwnershipNotFoundError(`Execution ${executionId} not found`, executionId);
    }

    if (ownership.metadata.owner !== fromWorker) {
      throw new OwnershipConflictError(
        `Execution ${executionId} is not owned by ${fromWorker}`,
        executionId,
        ownership.metadata.owner,
        fromWorker
      );
    }

    if (!ownership.transferable) {
      throw new OwnershipConflictError(
        `Execution ${executionId} ownership is not transferable`,
        executionId,
        fromWorker,
        toWorker
      );
    }

    // Create new ownership
    const epoch = this.currentEpoch;
    const newMetadata: OwnershipMetadata = {
      ...ownership.metadata,
      owner: toWorker,
      epoch,
      leaseId: `lease_${executionId}_${Date.now()}`,
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
      leaseInfo: {
        metadata: {
          leaseId: newMetadata.leaseId,
          workerId: toWorker,
          clusterId: 'default',
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 30000),
          epoch,
        },
        state: LeaseStateEnum.ACTIVE,
        resource: ownership.leaseInfo.resource,
        renewals: 0,
        lastRenewed: new Date(),
      },
      transferable: true,
      replaySafe: ownership.replaySafe,
    };

    this.ownershipMap.set(executionId, newOwnershipInfo);
    this.currentEpoch++;

    // Update worker ownership maps
    const fromWorkerExecs = this.workerOwnership.get(fromWorker);
    if (fromWorkerExecs) {
      fromWorkerExecs.delete(executionId);
      this.workerOwnership.set(fromWorker, fromWorkerExecs);
    }

    const toWorkerExecs = this.workerOwnership.get(toWorker) || new Set();
    toWorkerExecs.add(executionId);
    this.workerOwnership.set(toWorker, toWorkerExecs);

    return newOwnershipInfo;
  }

  /**
   * Release ownership
   */
  async releaseOwnership(executionId: ExecutionId, workerId: WorkerId): Promise<void> {
    const ownership = this.ownershipMap.get(executionId);
    if (!ownership) {
      throw new OwnershipNotFoundError(`Execution ${executionId} not found`, executionId);
    }

    if (ownership.metadata.owner !== workerId) {
      throw new OwnershipConflictError(
        `Execution ${executionId} is not owned by ${workerId}`,
        executionId,
        ownership.metadata.owner,
        workerId
      );
    }

    // Remove from worker ownership
    const workerExecs = this.workerOwnership.get(workerId);
    if (workerExecs) {
      workerExecs.delete(executionId);
      this.workerOwnership.set(workerId, workerExecs);
    }

    this.ownershipMap.delete(executionId);
  }

  /**
   * Get ownership info
   */
  getOwnership(executionId: ExecutionId): OwnershipInfo | undefined {
    const ownership = this.ownershipMap.get(executionId);
    return ownership ? { ...ownership } : undefined;
  }

  /**
   * Get owner for execution
   */
  getOwner(executionId: ExecutionId): WorkerId | undefined {
    const ownership = this.ownershipMap.get(executionId);
    return ownership?.metadata.owner;
  }

  /**
   * Get executions owned by worker
   */
  getOwnedExecutions(workerId: WorkerId): readonly ExecutionId[] {
    const executions = this.workerOwnership.get(workerId);
    return executions ? Array.from(executions) : [];
  }

  /**
   * Check if worker owns execution
   */
  isOwner(executionId: ExecutionId, workerId: WorkerId): boolean {
    const ownership = this.ownershipMap.get(executionId);
    return ownership?.metadata.owner === workerId;
  }

  /**
   * Get ownership statistics
   */
  getStatistics(): {
    totalOwnerships: number;
    ownerWorkerCount: number;
    averageExecutionsPerOwner: number;
    currentEpoch: number;
  } {
    const ownerCount = this.workerOwnership.size;
    const totalExecs = Array.from(this.workerOwnership.values())
      .reduce((sum, set) => sum + set.size, 0);

    const avgPerOwner = ownerCount > 0 ? totalExecs / ownerCount : 0;

    return {
      totalOwnerships: this.ownershipMap.size,
      ownerWorkerCount: ownerCount,
      averageExecutionsPerOwner: avgPerOwner,
      currentEpoch: this.currentEpoch,
    };
  }

  /**
   * Clear all ownership
   */
  clear(): void {
    this.ownershipMap.clear();
    this.workerOwnership.clear();
    this.currentEpoch = 1;
  }

  /**
   * Get current epoch
   */
  getCurrentEpoch(): number {
    return this.currentEpoch;
  }
}

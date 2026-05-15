/**
 * CLAUX Runtime Distributed Layer - Lease Coordinator
 * 
 * Coordinates lease acquisition, renewal, and expiration.
 * No external dependencies - pure coordination semantics.
 */

import type { WorkerId, LeaseId, LeaseInfo, LeaseMetadata, LeaseResource, LeaseResourceType, LeaseState } from '../types';
import { LeaseResourceType as LeaseResourceTypeEnum, LeaseState as LeaseStateEnum } from '../types';
import { DEFAULT_LEASE_DURATION_MS, DEFAULT_LEASE_RENEWAL_INTERVAL_MS, DEFAULT_LEASE_GRACE_PERIOD_MS, MAX_LEASE_RENEWALS } from '../constants';
import { LeaseAcquisitionError, LeaseRenewalError, LeaseExpirationError, LeaseTransferError } from '../errors';

/**
 * Lease Coordinator Configuration
 */
export interface LeaseCoordinatorConfig {
  readonly leaseDurationMs: number;
  readonly renewalIntervalMs: number;
  readonly gracePeriodMs: number;
  readonly maxRenewals: number;
}

/**
 * Lease Coordinator
 * 
 * Coordinates lease acquisition, renewal, and expiration across workers.
 */
export class LeaseCoordinator {
  private config: LeaseCoordinatorConfig;
  private leases: Map<LeaseId, LeaseInfo> = new Map();
  private workerLeases: Map<WorkerId, Set<LeaseId>> = new Map();
  private resourceLeases: Map<string, LeaseId> = new Map();

  constructor(config: Partial<LeaseCoordinatorConfig> = {}) {
    this.config = {
      leaseDurationMs: config.leaseDurationMs || DEFAULT_LEASE_DURATION_MS,
      renewalIntervalMs: config.renewalIntervalMs || DEFAULT_LEASE_RENEWAL_INTERVAL_MS,
      gracePeriodMs: config.gracePeriodMs || DEFAULT_LEASE_GRACE_PERIOD_MS,
      maxRenewals: config.maxRenewals || MAX_LEASE_RENEWALS,
    };
  }

  /**
   * Acquire lease for resource
   */
  async acquireLease(
    workerId: WorkerId,
    resourceType: LeaseResourceType,
    resourceId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<LeaseInfo> {
    // Check if resource already leased
    const existingLeaseId = this.resourceLeases.get(resourceId);
    if (existingLeaseId) {
      const existingLease = this.leases.get(existingLeaseId);
      if (existingLease && existingLease.metadata.workerId !== workerId) {
        throw new LeaseAcquisitionError(
          `Resource ${resourceId} is already leased to ${existingLease.metadata.workerId}`,
          existingLeaseId,
          workerId
        );
      }
    }

    const leaseId = this.generateLeaseId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.leaseDurationMs);

    const leaseMetadata: LeaseMetadata = {
      leaseId,
      workerId,
      clusterId: 'default',
      issuedAt: now,
      expiresAt,
      epoch: 0,
    };

    const leaseResource: LeaseResource = {
      type: resourceType,
      resourceId,
      metadata,
    };

    const leaseInfo: LeaseInfo = {
      metadata: leaseMetadata,
      state: LeaseStateEnum.ACTIVE,
      resource: leaseResource,
      renewals: 0,
      lastRenewed: now,
    };

    this.leases.set(leaseId, leaseInfo);
    this.resourceLeases.set(resourceId, leaseId);

    const workerLeaseSet = this.workerLeases.get(workerId) || new Set();
    workerLeaseSet.add(leaseId);
    this.workerLeases.set(workerId, workerLeaseSet);

    return leaseInfo;
  }

  /**
   * Renew lease
   */
  async renewLease(leaseId: LeaseId): Promise<LeaseInfo> {
    const lease = this.leases.get(leaseId);
    if (!lease) {
      throw new Error(`Lease ${leaseId} not found`);
    }

    if (lease.renewals >= this.config.maxRenewals) {
      throw new LeaseRenewalError(
        `Lease ${leaseId} has reached maximum renewals`,
        leaseId,
        lease.metadata.workerId
      );
    }

    if (lease.state !== LeaseStateEnum.ACTIVE) {
      throw new LeaseRenewalError(
        `Lease ${leaseId} is not in active state`,
        leaseId,
        lease.metadata.workerId
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.leaseDurationMs);

    lease.metadata.expiresAt = expiresAt;
    lease.renewals++;
    lease.lastRenewed = now;

    return { ...lease };
  }

  /**
   * Release lease
   */
  async releaseLease(leaseId: LeaseId, workerId: WorkerId): Promise<void> {
    const lease = this.leases.get(leaseId);
    if (!lease) {
      throw new Error(`Lease ${leaseId} not found`);
    }

    if (lease.metadata.workerId !== workerId) {
      throw new LeaseRenewalError(
        `Lease ${leaseId} is not owned by ${workerId}`,
        leaseId,
        workerId
      );
    }

    lease.state = LeaseStateEnum.RELEASED;
    this.resourceLeases.delete(lease.resource.resourceId);

    const workerLeaseSet = this.workerLeases.get(workerId);
    if (workerLeaseSet) {
      workerLeaseSet.delete(leaseId);
      this.workerLeases.set(workerId, workerLeaseSet);
    }

    this.leases.delete(leaseId);
  }

  /**
   * Transfer lease to another worker
   */
  async transferLease(leaseId: LeaseId, fromWorker: WorkerId, toWorker: WorkerId): Promise<LeaseInfo> {
    let lease = this.leases.get(leaseId);
    if (!lease) {
      throw new Error(`Lease ${leaseId} not found`);
    }

    if (lease.metadata.workerId !== fromWorker) {
      throw new LeaseTransferError(
        `Lease ${leaseId} is not owned by ${fromWorker}`,
        leaseId,
        fromWorker,
        toWorker
      );
    }

    // Remove from old worker
    const fromWorkerLeases = this.workerLeases.get(fromWorker);
    if (fromWorkerLeases) {
      fromWorkerLeases.delete(leaseId);
      this.workerLeases.set(fromWorker, fromWorkerLeases);
    }

    // Update lease metadata
    lease = {
      ...lease,
      metadata: {
        ...lease.metadata,
        workerId: toWorker,
      },
      state: LeaseStateEnum.TRANSFERRED,
      renewals: 0,
      lastRenewed: new Date(),
    };
    this.leases.set(leaseId, lease);

    // Add to new worker
    const toWorkerLeases = this.workerLeases.get(toWorker) || new Set();
    toWorkerLeases.add(leaseId);
    this.workerLeases.set(toWorker, toWorkerLeases);

    // Reactivate lease
    lease = {
      ...lease,
      state: LeaseStateEnum.ACTIVE,
      metadata: {
        ...lease.metadata,
        expiresAt: new Date(Date.now() + this.config.leaseDurationMs),
      },
    };
    this.leases.set(leaseId, lease);

    return { ...lease };
  }

  /**
   * Get lease info
   */
  getLease(leaseId: LeaseId): LeaseInfo | undefined {
    const lease = this.leases.get(leaseId);
    return lease ? { ...lease } : undefined;
  }

  /**
   * Get leases for worker
   */
  getLeasesForWorker(workerId: WorkerId): readonly LeaseId[] {
    const workerLeases = this.workerLeases.get(workerId);
    return workerLeases ? Array.from(workerLeases) : [];
  }

  /**
   * Get lease for resource
   */
  getLeaseForResource(resourceId: string): LeaseId | undefined {
    return this.resourceLeases.get(resourceId);
  }

  /**
   * Check if lease is expired
   */
  isExpired(leaseId: LeaseId): boolean {
    const lease = this.leases.get(leaseId);
    if (!lease) return true;

    return new Date() > lease.metadata.expiresAt;
  }

  /**
   * Check if lease is expiring soon
   */
  isExpiringSoon(leaseId: LeaseId): boolean {
    const lease = this.leases.get(leaseId);
    if (!lease) return true;

    const timeUntilExpiration = lease.metadata.expiresAt.getTime() - Date.now();
    return timeUntilExpiration < this.config.renewalIntervalMs;
  }

  /**
   * Expire lease
   */
  expireLease(leaseId: LeaseId): void {
    const lease = this.leases.get(leaseId);
    if (!lease) return;

    lease.state = LeaseStateEnum.EXPIRED;
    this.resourceLeases.delete(lease.resource.resourceId);

    const workerLeases = this.workerLeases.get(lease.metadata.workerId);
    if (workerLeases) {
      workerLeases.delete(leaseId);
      this.workerLeases.set(lease.metadata.workerId, workerLeases);
    }

    this.leases.delete(leaseId);
  }

  /**
   * Get lease statistics
   */
  getStatistics(): {
    totalLeases: number;
    activeLeases: number;
    expiredLeases: number;
    leasesByWorker: Map<WorkerId, number>;
    averageRenewals: number;
  } {
    let activeCount = 0;
    const leasesByWorker = new Map<WorkerId, number>();
    let totalRenewals = 0;

    for (const lease of this.leases.values()) {
      if (lease.state === LeaseStateEnum.ACTIVE) {
        activeCount++;
      }

      const workerCount = leasesByWorker.get(lease.metadata.workerId) || 0;
      leasesByWorker.set(lease.metadata.workerId, workerCount + 1);

      totalRenewals += lease.renewals;
    }

    const avgRenewals = this.leases.size > 0 ? totalRenewals / this.leases.size : 0;

    return {
      totalLeases: this.leases.size,
      activeLeases: activeCount,
      expiredLeases: 0, // Expired leases are removed
      leasesByWorker,
      averageRenewals: avgRenewals,
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
    this.leases.clear();
    this.workerLeases.clear();
    this.resourceLeases.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): LeaseCoordinatorConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<LeaseCoordinatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

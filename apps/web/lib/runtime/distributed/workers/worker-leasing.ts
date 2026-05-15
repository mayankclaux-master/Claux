/**
 * CLAUX Runtime Distributed Layer - Worker Leasing
 * 
 * Manages worker lease acquisition and renewal.
 * No external dependencies - pure leasing semantics.
 */

import type { WorkerId, LeaseId, LeaseResourceType, LeaseInfo, LeaseState } from '../types';
import { LeaseResourceType as LeaseResourceTypeEnum, LeaseState as LeaseStateEnum } from '../types';
import { DEFAULT_LEASE_DURATION_MS, DEFAULT_LEASE_RENEWAL_INTERVAL_MS, MAX_LEASE_RENEWALS } from '../constants';
import { LeaseAcquisitionError, LeaseRenewalError } from '../errors';

/**
 * Worker Leasing Configuration
 */
export interface WorkerLeasingConfig {
  readonly leaseDurationMs: number;
  readonly renewalIntervalMs: number;
  readonly maxRenewals: number;
}

/**
 * Worker Leasing Manager
 * 
 * Manages worker lease acquisition and renewal.
 */
export class WorkerLeasingManager {
  private config: WorkerLeasingConfig;
  private workerLeases: Map<WorkerId, LeaseId> = new Map();
  private leaseRegistry: Map<LeaseId, LeaseInfo> = new Map();

  constructor(config: Partial<WorkerLeasingConfig> = {}) {
    this.config = {
      leaseDurationMs: config.leaseDurationMs || DEFAULT_LEASE_DURATION_MS,
      renewalIntervalMs: config.renewalIntervalMs || DEFAULT_LEASE_RENEWAL_INTERVAL_MS,
      maxRenewals: config.maxRenewals || MAX_LEASE_RENEWALS,
    };
  }

  /**
   * Acquire worker lease
   */
  async acquireWorkerLease(workerId: WorkerId): Promise<LeaseInfo> {
    // Check if worker already has a lease
    const existingLeaseId = this.workerLeases.get(workerId);
    if (existingLeaseId) {
      const existingLease = this.leaseRegistry.get(existingLeaseId);
      if (existingLease && existingLease.state === LeaseStateEnum.ACTIVE) {
        throw new LeaseAcquisitionError(
          `Worker ${workerId} already has an active lease`,
          existingLeaseId,
          workerId
        );
      }
    }

    const leaseId = this.generateLeaseId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.leaseDurationMs);

    const leaseInfo: LeaseInfo = {
      metadata: {
        leaseId,
        workerId,
        clusterId: 'default',
        issuedAt: now,
        expiresAt,
        epoch: 0,
      },
      state: LeaseStateEnum.ACTIVE,
      resource: {
        type: LeaseResourceTypeEnum.WORKER,
        resourceId: workerId,
        metadata: {},
      },
      renewals: 0,
      lastRenewed: now,
    };

    this.leaseRegistry.set(leaseId, leaseInfo);
    this.workerLeases.set(workerId, leaseId);

    return leaseInfo;
  }

  /**
   * Renew worker lease
   */
  async renewWorkerLease(workerId: WorkerId): Promise<LeaseInfo> {
    const leaseId = this.workerLeases.get(workerId);
    if (!leaseId) {
      throw new LeaseRenewalError(
        `Worker ${workerId} does not have a lease`,
        'none',
        workerId
      );
    }

    const lease = this.leaseRegistry.get(leaseId);
    if (!lease) {
      throw new LeaseRenewalError(
        `Lease ${leaseId} not found`,
        leaseId,
        workerId
      );
    }

    if (lease.renewals >= this.config.maxRenewals) {
      throw new LeaseRenewalError(
        `Lease ${leaseId} has reached maximum renewals`,
        leaseId,
        workerId
      );
    }

    if (lease.state !== LeaseStateEnum.ACTIVE) {
      throw new LeaseRenewalError(
        `Lease ${leaseId} is not in active state`,
        leaseId,
        workerId
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
   * Release worker lease
   */
  async releaseWorkerLease(workerId: WorkerId): Promise<void> {
    const leaseId = this.workerLeases.get(workerId);
    if (!leaseId) {
      throw new Error(`Worker ${workerId} does not have a lease`);
    }

    const lease = this.leaseRegistry.get(leaseId);
    if (!lease) {
      throw new Error(`Lease ${leaseId} not found`);
    }

    lease.state = LeaseStateEnum.RELEASED;
    this.leaseRegistry.delete(leaseId);
    this.workerLeases.delete(workerId);
  }

  /**
   * Get worker lease
   */
  getWorkerLease(workerId: WorkerId): LeaseInfo | undefined {
    const leaseId = this.workerLeases.get(workerId);
    if (!leaseId) return undefined;

    const lease = this.leaseRegistry.get(leaseId);
    return lease ? { ...lease } : undefined;
  }

  /**
   * Check if worker has active lease
   */
  hasActiveLease(workerId: WorkerId): boolean {
    const lease = this.getWorkerLease(workerId);
    if (!lease) return false;

    return lease.state === LeaseStateEnum.ACTIVE && new Date() < lease.metadata.expiresAt;
  }

  /**
   * Check if lease is expiring soon
   */
  isLeaseExpiringSoon(workerId: WorkerId): boolean {
    const lease = this.getWorkerLease(workerId);
    if (!lease) return true;

    const timeUntilExpiration = lease.metadata.expiresAt.getTime() - Date.now();
    return timeUntilExpiration < this.config.renewalIntervalMs;
  }

  /**
   * Get all workers with active leases
   */
  getWorkersWithActiveLeases(): readonly WorkerId[] {
    const workers: WorkerId[] = [];
    for (const [workerId, leaseId] of this.workerLeases) {
      const lease = this.leaseRegistry.get(leaseId);
      if (lease && lease.state === LeaseStateEnum.ACTIVE) {
        workers.push(workerId);
      }
    }
    return workers;
  }

  /**
   * Expire worker lease
   */
  expireWorkerLease(workerId: WorkerId): void {
    const leaseId = this.workerLeases.get(workerId);
    if (!leaseId) return;

    const lease = this.leaseRegistry.get(leaseId);
    if (!lease) return;

    lease.state = LeaseStateEnum.EXPIRED;
    this.leaseRegistry.delete(leaseId);
    this.workerLeases.delete(workerId);
  }

  /**
   * Check for expired leases
   */
  checkExpiredLeases(): readonly WorkerId[] {
    const expired: WorkerId[] = [];
    const now = new Date();

    for (const [workerId, leaseId] of this.workerLeases) {
      const lease = this.leaseRegistry.get(leaseId);
      if (lease && lease.metadata.expiresAt < now) {
        expired.push(workerId);
        this.expireWorkerLease(workerId);
      }
    }

    return expired;
  }

  /**
   * Get leasing statistics
   */
  getStatistics(): {
    totalLeases: number;
    activeLeases: number;
    expiredLeases: number;
    averageRenewals: number;
    leasesNearExpiry: number;
  } {
    let activeCount = 0;
    let nearExpiryCount = 0;
    let totalRenewals = 0;

    for (const lease of this.leaseRegistry.values()) {
      if (lease.state === LeaseStateEnum.ACTIVE) {
        activeCount++;

        const timeUntilExpiration = lease.metadata.expiresAt.getTime() - Date.now();
        if (timeUntilExpiration < this.config.renewalIntervalMs) {
          nearExpiryCount++;
        }
      }

      totalRenewals += lease.renewals;
    }

    const avgRenewals = this.leaseRegistry.size > 0 ? totalRenewals / this.leaseRegistry.size : 0;

    return {
      totalLeases: this.leaseRegistry.size,
      activeLeases: activeCount,
      expiredLeases: 0, // Expired leases are removed
      averageRenewals: avgRenewals,
      leasesNearExpiry: nearExpiryCount,
    };
  }

  /**
   * Generate lease ID
   */
  private generateLeaseId(): LeaseId {
    return `lease_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` as LeaseId;
  }

  /**
   * Clear all leases
   */
  clear(): void {
    this.workerLeases.clear();
    this.leaseRegistry.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): WorkerLeasingConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<WorkerLeasingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

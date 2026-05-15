/**
 * CLAUX Runtime Distributed Layer - Worker Registry
 * 
 * Manages worker registration and lifecycle.
 * No external dependencies - pure worker semantics.
 */

import type { WorkerId, ClusterId, WorkerMetadata, WorkerInfo, WorkerState, WorkerHealthStatus } from '../types';
import { WorkerState as WorkerStateEnum, WorkerHealthStatus as WorkerHealthStatusEnum } from '../types';
import { DEFAULT_WORKER_JOIN_TIMEOUT_MS } from '../constants';
import { WorkerRegistrationError, WorkerNotFoundError, WorkerAlreadyExistsError } from '../errors';

/**
 * Worker Registry Configuration
 */
export interface WorkerRegistryConfig {
  readonly joinTimeoutMs: number;
}

/**
 * Worker Registry
 * 
 * Manages worker registration and lifecycle.
 */
export class WorkerRegistry {
  private config: WorkerRegistryConfig;
  private workers: Map<WorkerId, WorkerInfo> = new Map();
  private pendingRegistrations: Set<WorkerId> = new Set();

  constructor(config: Partial<WorkerRegistryConfig> = {}) {
    this.config = {
      joinTimeoutMs: config.joinTimeoutMs || DEFAULT_WORKER_JOIN_TIMEOUT_MS,
    };
  }

  /**
   * Register worker
   */
  async registerWorker(metadata: WorkerMetadata): Promise<WorkerInfo> {
    if (this.workers.has(metadata.workerId)) {
      throw new WorkerAlreadyExistsError(
        `Worker ${metadata.workerId} is already registered`,
        metadata.workerId
      );
    }

    this.pendingRegistrations.add(metadata.workerId);

    const workerInfo: WorkerInfo = {
      metadata,
      state: WorkerStateEnum.JOINING,
      health: WorkerHealthStatusEnum.HEALTHY,
      utilization: {
        cpu: 0,
        memory: 0,
        concurrency: 0,
        bandwidth: 0,
      },
      lastHeartbeat: new Date(),
      ownedPartitions: [],
      ownedExecutions: [],
    };

    this.workers.set(metadata.workerId, workerInfo);
    this.pendingRegistrations.delete(metadata.workerId);

    // Transition to active
    workerInfo.state = WorkerStateEnum.ACTIVE;

    return workerInfo;
  }

  /**
   * Unregister worker
   */
  async unregisterWorker(workerId: WorkerId): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new WorkerNotFoundError(`Worker ${workerId} not found`, workerId);
    }

    worker.state = WorkerStateEnum.LEAVING;

    // In production, wait for graceful shutdown
    worker.state = WorkerStateEnum.GONE;
    this.workers.delete(workerId);
  }

  /**
   * Get worker info
   */
  getWorker(workerId: WorkerId): WorkerInfo | undefined {
    const worker = this.workers.get(workerId);
    return worker ? { ...worker } : undefined;
  }

  /**
   * Get all workers
   */
  getAllWorkers(): readonly WorkerInfo[] {
    return Array.from(this.workers.values()).map(w => ({ ...w }));
  }

  /**
   * Get workers by state
   */
  getWorkersByState(state: WorkerState): readonly WorkerInfo[] {
    return Array.from(this.workers.values())
      .filter(w => w.state === state)
      .map(w => ({ ...w }));
  }

  /**
   * Get workers by health status
   */
  getWorkersByHealth(health: WorkerHealthStatus): readonly WorkerInfo[] {
    return Array.from(this.workers.values())
      .filter(w => w.health === health)
      .map(w => ({ ...w }));
  }

  /**
   * Get workers for cluster
   */
  getWorkersForCluster(clusterId: ClusterId): readonly WorkerInfo[] {
    return Array.from(this.workers.values())
      .filter(w => w.metadata.clusterId === clusterId)
      .map(w => ({ ...w }));
  }

  /**
   * Update worker state
   */
  updateWorkerState(workerId: WorkerId, state: WorkerState): void {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new WorkerNotFoundError(`Worker ${workerId} not found`, workerId);
    }

    worker.state = state;
  }

  /**
   * Update worker health
   */
  updateWorkerHealth(workerId: WorkerId, health: WorkerHealthStatus): void {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new WorkerNotFoundError(`Worker ${workerId} not found`, workerId);
    }

    worker.health = health;
  }

  /**
   * Check if worker is registered
   */
  isRegistered(workerId: WorkerId): boolean {
    return this.workers.has(workerId);
  }

  /**
   * Check if worker is active
   */
  isActive(workerId: WorkerId): boolean {
    const worker = this.workers.get(workerId);
    return worker?.state === WorkerStateEnum.ACTIVE;
  }

  /**
   * Get worker count
   */
  getWorkerCount(): number {
    return this.workers.size;
  }

  /**
   * Get active worker count
   */
  getActiveWorkerCount(): number {
    return Array.from(this.workers.values())
      .filter(w => w.state === WorkerStateEnum.ACTIVE)
      .length;
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalWorkers: number;
    activeWorkers: number;
    joiningWorkers: number;
    leavingWorkers: number;
    goneWorkers: number;
    healthyWorkers: number;
    degradedWorkers: number;
    unhealthyWorkers: number;
  } {
    let active = 0;
    let joining = 0;
    let leaving = 0;
    let gone = 0;
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;

    for (const worker of this.workers.values()) {
      switch (worker.state) {
        case WorkerStateEnum.ACTIVE:
          active++;
          break;
        case WorkerStateEnum.JOINING:
          joining++;
          break;
        case WorkerStateEnum.LEAVING:
          leaving++;
          break;
        case WorkerStateEnum.GONE:
          gone++;
          break;
      }

      switch (worker.health) {
        case WorkerHealthStatusEnum.HEALTHY:
          healthy++;
          break;
        case WorkerHealthStatusEnum.DEGRADED:
          degraded++;
          break;
        case WorkerHealthStatusEnum.UNHEALTHY:
          unhealthy++;
          break;
      }
    }

    return {
      totalWorkers: this.workers.size,
      activeWorkers: active,
      joiningWorkers: joining,
      leavingWorkers: leaving,
      goneWorkers: gone,
      healthyWorkers: healthy,
      degradedWorkers: degraded,
      unhealthyWorkers: unhealthy,
    };
  }

  /**
   * Reset registry
   */
  reset(): void {
    this.workers.clear();
    this.pendingRegistrations.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): WorkerRegistryConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<WorkerRegistryConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

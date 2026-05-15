/**
 * CLAUX Runtime Distributed Layer - Worker Heartbeat
 * 
 * Manages worker heartbeat monitoring and health tracking.
 * No external dependencies - pure heartbeat semantics.
 */

import type { WorkerId, HeartbeatData, WorkerHealthStatus, WorkerUtilization } from '../types';
import { WorkerHealthStatus as WorkerHealthStatusEnum } from '../types';
import { DEFAULT_HEARTBEAT_INTERVAL_MS, DEFAULT_HEARTBEAT_TIMEOUT_MS, CPU_UTILIZATION_THRESHOLDS, MEMORY_UTILIZATION_THRESHOLDS, CONCURRENCY_UTILIZATION_THRESHOLDS } from '../constants';
import { WorkerHeartbeatError, WorkerHeartbeatTimeoutError } from '../errors';

/**
 * Worker Heartbeat Configuration
 */
export interface WorkerHeartbeatConfig {
  readonly intervalMs: number;
  readonly timeoutMs: number;
  readonly cpuThreshold: number;
  readonly memoryThreshold: number;
  readonly concurrencyThreshold: number;
}

/**
 * Worker Heartbeat Monitor
 * 
 * Manages worker heartbeat monitoring and health tracking.
 */
export class WorkerHeartbeatMonitor {
  private config: WorkerHeartbeatConfig;
  private heartbeats: Map<WorkerId, HeartbeatData> = new Map();
  private missedHeartbeats: Map<WorkerId, number> = new Map();
  private lastSeen: Map<WorkerId, Date> = new Map();

  constructor(config: Partial<WorkerHeartbeatConfig> = {}) {
    this.config = {
      intervalMs: config.intervalMs || DEFAULT_HEARTBEAT_INTERVAL_MS,
      timeoutMs: config.timeoutMs || DEFAULT_HEARTBEAT_TIMEOUT_MS,
      cpuThreshold: config.cpuThreshold || CPU_UTILIZATION_THRESHOLDS.UNHEALTHY,
      memoryThreshold: config.memoryThreshold || MEMORY_UTILIZATION_THRESHOLDS.UNHEALTHY,
      concurrencyThreshold: config.concurrencyThreshold || CONCURRENCY_UTILIZATION_THRESHOLDS.UNHEALTHY,
    };
  }

  /**
   * Record heartbeat from worker
   */
  recordHeartbeat(heartbeat: HeartbeatData): void {
    this.heartbeats.set(heartbeat.workerId, heartbeat);
    this.lastSeen.set(heartbeat.workerId, heartbeat.timestamp);
    this.missedHeartbeats.set(heartbeat.workerId, 0);
  }

  /**
   * Get latest heartbeat for worker
   */
  getHeartbeat(workerId: WorkerId): HeartbeatData | undefined {
    const heartbeat = this.heartbeats.get(workerId);
    return heartbeat ? { ...heartbeat } : undefined;
  }

  /**
   * Check if heartbeat is valid
   */
  isHeartbeatValid(workerId: WorkerId): boolean {
    const heartbeat = this.heartbeats.get(workerId);
    if (!heartbeat) return false;

    const elapsed = Date.now() - heartbeat.timestamp.getTime();
    return elapsed < this.config.timeoutMs;
  }

  /**
   * Check if worker is alive
   */
  isAlive(workerId: WorkerId): boolean {
    return this.isHeartbeatValid(workerId);
  }

  /**
   * Get last seen time for worker
   */
  getLastSeen(workerId: WorkerId): Date | undefined {
    return this.lastSeen.get(workerId);
  }

  /**
   * Get time since last heartbeat
   */
  getTimeSinceLastHeartbeat(workerId: WorkerId): number | undefined {
    const lastSeen = this.lastSeen.get(workerId);
    if (!lastSeen) return undefined;

    return Date.now() - lastSeen.getTime();
  }

  /**
   * Evaluate worker health from heartbeat
   */
  evaluateHealth(workerId: WorkerId): WorkerHealthStatus {
    const heartbeat = this.heartbeats.get(workerId);
    if (!heartbeat) return WorkerHealthStatusEnum.OFFLINE;

    // Check if heartbeat is stale
    if (!this.isHeartbeatValid(workerId)) {
      return WorkerHealthStatusEnum.OFFLINE;
    }

    // Evaluate based on utilization
    const { cpu, memory, concurrency } = heartbeat.utilization;

    if (cpu > this.config.cpuThreshold ||
        memory > this.config.memoryThreshold ||
        concurrency > this.config.concurrencyThreshold) {
      return WorkerHealthStatusEnum.UNHEALTHY;
    }

    if (cpu > CPU_UTILIZATION_THRESHOLDS.DEGRADED ||
        memory > MEMORY_UTILIZATION_THRESHOLDS.DEGRADED ||
        concurrency > CONCURRENCY_UTILIZATION_THRESHOLDS.DEGRADED) {
      return WorkerHealthStatusEnum.DEGRADED;
    }

    return WorkerHealthStatusEnum.HEALTHY;
  }

  /**
   * Get worker utilization
   */
  getUtilization(workerId: WorkerId): WorkerUtilization | undefined {
    const heartbeat = this.heartbeats.get(workerId);
    return heartbeat ? { ...heartbeat.utilization } : undefined;
  }

  /**
   * Get all workers that are alive
   */
  getAliveWorkers(): readonly WorkerId[] {
    const alive: WorkerId[] = [];
    for (const [workerId] of this.heartbeats) {
      if (this.isAlive(workerId)) {
        alive.push(workerId);
      }
    }
    return alive;
  }

  /**
   * Get all workers that are dead
   */
  getDeadWorkers(): readonly WorkerId[] {
    const dead: WorkerId[] = [];
    for (const [workerId] of this.heartbeats) {
      if (!this.isAlive(workerId)) {
        dead.push(workerId);
      }
    }
    return dead;
  }

  /**
   * Get workers by health status
   */
  getWorkersByHealth(status: WorkerHealthStatus): readonly WorkerId[] {
    const workers: WorkerId[] = [];
    for (const [workerId] of this.heartbeats) {
      if (this.evaluateHealth(workerId) === status) {
        workers.push(workerId);
      }
    }
    return workers;
  }

  /**
   * Check for heartbeat timeout
   */
  checkHeartbeatTimeout(workerId: WorkerId): boolean {
    const elapsed = this.getTimeSinceLastHeartbeat(workerId);
    if (elapsed === undefined) return true;

    return elapsed > this.config.timeoutMs;
  }

  /**
   * Increment missed heartbeat count
   */
  incrementMissedHeartbeats(workerId: WorkerId): number {
    const current = this.missedHeartbeats.get(workerId) || 0;
    const newCount = current + 1;
    this.missedHeartbeats.set(workerId, newCount);
    return newCount;
  }

  /**
   * Reset missed heartbeat count
   */
  resetMissedHeartbeats(workerId: WorkerId): void {
    this.missedHeartbeats.set(workerId, 0);
  }

  /**
   * Remove worker from monitoring
   */
  removeWorker(workerId: WorkerId): void {
    this.heartbeats.delete(workerId);
    this.lastSeen.delete(workerId);
    this.missedHeartbeats.delete(workerId);
  }

  /**
   * Get heartbeat statistics
   */
  getStatistics(): {
    totalWorkers: number;
    aliveWorkers: number;
    deadWorkers: number;
    healthyWorkers: number;
    degradedWorkers: number;
    unhealthyWorkers: number;
    averageUtilization: {
      cpu: number;
      memory: number;
      concurrency: number;
      bandwidth: number;
    };
  } {
    let alive = 0;
    let dead = 0;
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;

    let totalCpu = 0;
    let totalMemory = 0;
    let totalConcurrency = 0;
    let totalBandwidth = 0;

    for (const [workerId, heartbeat] of this.heartbeats) {
      if (this.isAlive(workerId)) {
        alive++;
      } else {
        dead++;
      }

      const health = this.evaluateHealth(workerId);
      switch (health) {
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

      totalCpu += heartbeat.utilization.cpu;
      totalMemory += heartbeat.utilization.memory;
      totalConcurrency += heartbeat.utilization.concurrency;
      totalBandwidth += heartbeat.utilization.bandwidth;
    }

    const count = this.heartbeats.size || 1;

    return {
      totalWorkers: this.heartbeats.size,
      aliveWorkers: alive,
      deadWorkers: dead,
      healthyWorkers: healthy,
      degradedWorkers: degraded,
      unhealthyWorkers: unhealthy,
      averageUtilization: {
        cpu: totalCpu / count,
        memory: totalMemory / count,
        concurrency: totalConcurrency / count,
        bandwidth: totalBandwidth / count,
      },
    };
  }

  /**
   * Clear all heartbeats
   */
  clear(): void {
    this.heartbeats.clear();
    this.lastSeen.clear();
    this.missedHeartbeats.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): WorkerHeartbeatConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<WorkerHeartbeatConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * CLAUX Runtime Distributed Layer - Cluster Health
 * 
 * Monitors and reports cluster health status.
 * No external dependencies - pure health semantics.
 */

import type { WorkerId, ClusterId, WorkerHealthStatus } from '../types';
import { WorkerHealthStatus as WorkerHealthStatusEnum } from '../types';
import { DEFAULT_HEARTBEAT_INTERVAL_MS, DEFAULT_HEARTBEAT_TIMEOUT_MS } from '../constants';

/**
 * Cluster Health Configuration
 */
export interface ClusterHealthConfig {
  readonly checkIntervalMs: number;
  readonly timeoutMs: number;
}

/**
 * Cluster Health Monitor
 * 
 * Monitors and reports cluster health status.
 */
export class ClusterHealthMonitor {
  private config: ClusterHealthConfig;
  private workerHealth: Map<WorkerId, WorkerHealthStatus> = new Map();
  private workerLastCheck: Map<WorkerId, Date> = new Map();
  private clusterId: ClusterId;

  constructor(clusterId: ClusterId, config: Partial<ClusterHealthConfig> = {}) {
    this.clusterId = clusterId;
    this.config = {
      checkIntervalMs: config.checkIntervalMs || DEFAULT_HEARTBEAT_INTERVAL_MS,
      timeoutMs: config.timeoutMs || DEFAULT_HEARTBEAT_TIMEOUT_MS,
    };
  }

  /**
   * Update worker health
   */
  updateWorkerHealth(workerId: WorkerId, health: WorkerHealthStatus): void {
    this.workerHealth.set(workerId, health);
    this.workerLastCheck.set(workerId, new Date());
  }

  /**
   * Get worker health
   */
  getWorkerHealth(workerId: WorkerId): WorkerHealthStatus | undefined {
    return this.workerHealth.get(workerId);
  }

  /**
   * Get cluster health
   */
  getClusterHealth(): ClusterHealthStatus {
    const healthCount = new Map<WorkerHealthStatus, number>();

    for (const health of this.workerHealth.values()) {
      const count = healthCount.get(health) || 0;
      healthCount.set(health, count + 1);
    }

    const total = this.workerHealth.size;
    const healthy = healthCount.get(WorkerHealthStatusEnum.HEALTHY) || 0;
    const degraded = healthCount.get(WorkerHealthStatusEnum.DEGRADED) || 0;
    const unhealthy = healthCount.get(WorkerHealthStatusEnum.UNHEALTHY) || 0;

    if (total === 0) {
      return ClusterHealthStatus.UNKNOWN;
    }

    const healthyRatio = healthy / total;

    if (healthyRatio >= 0.8) {
      return ClusterHealthStatus.HEALTHY;
    } else if (healthyRatio >= 0.5) {
      return ClusterHealthStatus.DEGRADED;
    } else if (unhealthy > healthy) {
      return ClusterHealthStatus.UNHEALTHY;
    } else {
      return ClusterHealthStatus.DEGRADED;
    }
  }

  /**
   * Get health summary
   */
  getHealthSummary(): HealthSummary {
    const healthCount = new Map<WorkerHealthStatus, number>();

    for (const health of this.workerHealth.values()) {
      const count = healthCount.get(health) || 0;
      healthCount.set(health, count + 1);
    }

    return {
      clusterId: this.clusterId,
      clusterHealth: this.getClusterHealth(),
      totalWorkers: this.workerHealth.size,
      healthyWorkers: healthCount.get(WorkerHealthStatusEnum.HEALTHY) || 0,
      degradedWorkers: healthCount.get(WorkerHealthStatusEnum.DEGRADED) || 0,
      unhealthyWorkers: healthCount.get(WorkerHealthStatusEnum.UNHEALTHY) || 0,
      offlineWorkers: healthCount.get(WorkerHealthStatusEnum.OFFLINE) || 0,
      lastCheckTime: new Date(),
    };
  }

  /**
   * Check if worker is healthy
   */
  isWorkerHealthy(workerId: WorkerId): boolean {
    const health = this.workerHealth.get(workerId);
    return health === WorkerHealthStatusEnum.HEALTHY;
  }

  /**
   * Check if cluster is healthy
   */
  isClusterHealthy(): boolean {
    return this.getClusterHealth() === ClusterHealthStatus.HEALTHY;
  }

  /**
   * Get unhealthy workers
   */
  getUnhealthyWorkers(): readonly WorkerId[] {
    const unhealthy: WorkerId[] = [];
    for (const [workerId, health] of this.workerHealth) {
      if (health !== WorkerHealthStatusEnum.HEALTHY) {
        unhealthy.push(workerId);
      }
    }
    return unhealthy;
  }

  /**
   * Remove worker from health monitoring
   */
  removeWorker(workerId: WorkerId): void {
    this.workerHealth.delete(workerId);
    this.workerLastCheck.delete(workerId);
  }

  /**
   * Get last check time for worker
   */
  getLastCheckTime(workerId: WorkerId): Date | undefined {
    return this.workerLastCheck.get(workerId);
  }

  /**
   * Clear all health data
   */
  clear(): void {
    this.workerHealth.clear();
    this.workerLastCheck.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): ClusterHealthConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<ClusterHealthConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Cluster Health Status
 */
enum ClusterHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

/**
 * Health Summary
 */
interface HealthSummary {
  readonly clusterId: ClusterId;
  readonly clusterHealth: ClusterHealthStatus;
  readonly totalWorkers: number;
  readonly healthyWorkers: number;
  readonly degradedWorkers: number;
  readonly unhealthyWorkers: number;
  readonly offlineWorkers: number;
  readonly lastCheckTime: Date;
}

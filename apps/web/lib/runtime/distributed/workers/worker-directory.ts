/**
 * CLAUX Runtime Distributed Layer - Worker Directory
 * 
 * Provides directory services for worker discovery and lookup.
 * No external dependencies - pure directory semantics.
 */

import type { WorkerId, ClusterId, WorkerInfo, WorkerCapability, WorkerCapacity } from '../types';
import { WorkerNotFoundError } from '../errors';

/**
 * Worker Directory Configuration
 */
export interface WorkerDirectoryConfig {
  readonly enableCaching: boolean;
  readonly cacheTtlMs: number;
}

/**
 * Worker Directory
 * 
 * Provides directory services for worker discovery and lookup.
 */
export class WorkerDirectory {
  private config: WorkerDirectoryConfig;
  private workerRegistry: Map<WorkerId, WorkerInfo> = new Map();
  private clusterIndex: Map<ClusterId, Set<WorkerId>> = new Map();
  private capabilityIndex: Map<string, Set<WorkerId>> = new Map();
  private cache: Map<string, { data: WorkerInfo[]; timestamp: number }> = new Map();

  constructor(config: Partial<WorkerDirectoryConfig> = {}) {
    this.config = {
      enableCaching: config.enableCaching ?? true,
      cacheTtlMs: config.cacheTtlMs || 60000,
    };
  }

  /**
   * Register worker in directory
   */
  register(workerInfo: WorkerInfo): void {
    this.workerRegistry.set(workerInfo.metadata.workerId, workerInfo);

    // Update cluster index
    const clusterWorkers = this.clusterIndex.get(workerInfo.metadata.clusterId) || new Set();
    clusterWorkers.add(workerInfo.metadata.workerId);
    this.clusterIndex.set(workerInfo.metadata.clusterId, clusterWorkers);

    // Update capability index
    for (const capability of workerInfo.metadata.capabilities) {
      const capKey = this.capabilityKey(capability);
      const capWorkers = this.capabilityIndex.get(capKey) || new Set();
      capWorkers.add(workerInfo.metadata.workerId);
      this.capabilityIndex.set(capKey, capWorkers);
    }

    // Invalidate cache
    this.invalidateCache();
  }

  /**
   * Unregister worker from directory
   */
  unregister(workerId: WorkerId): void {
    const workerInfo = this.workerRegistry.get(workerId);
    if (!workerInfo) return;

    // Remove from cluster index
    const clusterWorkers = this.clusterIndex.get(workerInfo.metadata.clusterId);
    if (clusterWorkers) {
      clusterWorkers.delete(workerId);
      if (clusterWorkers.size === 0) {
        this.clusterIndex.delete(workerInfo.metadata.clusterId);
      }
    }

    // Remove from capability index
    for (const capability of workerInfo.metadata.capabilities) {
      const capKey = this.capabilityKey(capability);
      const capWorkers = this.capabilityIndex.get(capKey);
      if (capWorkers) {
        capWorkers.delete(workerId);
        if (capWorkers.size === 0) {
          this.capabilityIndex.delete(capKey);
        }
      }
    }

    // Remove from registry
    this.workerRegistry.delete(workerId);

    // Invalidate cache
    this.invalidateCache();
  }

  /**
   * Find worker by ID
   */
  find(workerId: WorkerId): WorkerInfo | undefined {
    const worker = this.workerRegistry.get(workerId);
    return worker ? { ...worker } : undefined;
  }

  /**
   * Find workers by cluster
   */
  findByCluster(clusterId: ClusterId): readonly WorkerInfo[] {
    const cacheKey = `cluster:${clusterId}`;
    
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTtlMs) {
        return cached.data;
      }
    }

    const clusterWorkers = this.clusterIndex.get(clusterId);
    if (!clusterWorkers) return [];

    const workers: WorkerInfo[] = [];
    for (const workerId of clusterWorkers) {
      const worker = this.workerRegistry.get(workerId);
      if (worker) {
        workers.push({ ...worker });
      }
    }

    if (this.config.enableCaching) {
      this.cache.set(cacheKey, { data: workers, timestamp: Date.now() });
    }

    return workers;
  }

  /**
   * Find workers by capability
   */
  findByCapability(capability: WorkerCapability): readonly WorkerInfo[] {
    const cacheKey = `capability:${this.capabilityKey(capability)}`;
    
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTtlMs) {
        return cached.data;
      }
    }

    const capWorkers = this.capabilityIndex.get(this.capabilityKey(capability));
    if (!capWorkers) return [];

    const workers: WorkerInfo[] = [];
    for (const workerId of capWorkers) {
      const worker = this.workerRegistry.get(workerId);
      if (worker) {
        workers.push({ ...worker });
      }
    }

    if (this.config.enableCaching) {
      this.cache.set(cacheKey, { data: workers, timestamp: Date.now() });
    }

    return workers;
  }

  /**
   * Find workers by capacity requirements
   */
  findByCapacity(minCapacity: WorkerCapacity): readonly WorkerInfo[] {
    const workers: WorkerInfo[] = [];
    
    for (const worker of this.workerRegistry.values()) {
      if (
        worker.metadata.capacity.cpu >= minCapacity.cpu &&
        worker.metadata.capacity.memory >= minCapacity.memory &&
        worker.metadata.capacity.concurrency >= minCapacity.concurrency &&
        worker.metadata.capacity.bandwidth >= minCapacity.bandwidth
      ) {
        workers.push({ ...worker });
      }
    }

    return workers;
  }

  /**
   * List all workers
   */
  listAll(): readonly WorkerInfo[] {
    return Array.from(this.workerRegistry.values()).map(w => ({ ...w }));
  }

  /**
   * Get worker count
   */
  getCount(): number {
    return this.workerRegistry.size;
  }

  /**
   * Get cluster count
   */
  getClusterCount(): number {
    return this.clusterIndex.size;
  }

  /**
   * Get cluster worker count
   */
  getClusterWorkerCount(clusterId: ClusterId): number {
    const clusterWorkers = this.clusterIndex.get(clusterId);
    return clusterWorkers ? clusterWorkers.size : 0;
  }

  /**
   * Search workers by criteria
   */
  search(criteria: {
    clusterId?: ClusterId;
    capability?: WorkerCapability;
    minCapacity?: WorkerCapacity;
  }): readonly WorkerInfo[] {
    let results: WorkerInfo[] = [];

    if (criteria.clusterId) {
      results = [...this.findByCluster(criteria.clusterId)];
    } else if (criteria.capability) {
      results = [...this.findByCapability(criteria.capability)];
    } else {
      results = [...this.listAll()];
    }

    if (criteria.minCapacity) {
      results = results.filter(w =>
        w.metadata.capacity.cpu >= criteria.minCapacity!.cpu &&
        w.metadata.capacity.memory >= criteria.minCapacity!.memory &&
        w.metadata.capacity.concurrency >= criteria.minCapacity!.concurrency &&
        w.metadata.capacity.bandwidth >= criteria.minCapacity!.bandwidth
      );
    }

    return results;
  }

  /**
   * Generate capability key for indexing
   */
  private capabilityKey(capability: WorkerCapability): string {
    return `${capability.name}:${capability.version}`;
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Clear directory
   */
  clear(): void {
    this.workerRegistry.clear();
    this.clusterIndex.clear();
    this.capabilityIndex.clear();
    this.cache.clear();
  }

  /**
   * Get directory statistics
   */
  getStatistics(): {
    totalWorkers: number;
    totalClusters: number;
    totalCapabilities: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    return {
      totalWorkers: this.workerRegistry.size,
      totalClusters: this.clusterIndex.size,
      totalCapabilities: this.capabilityIndex.size,
      cacheSize: this.cache.size,
      cacheHitRate: 0, // Would track in production
    };
  }

  /**
   * Get configuration
   */
  getConfig(): WorkerDirectoryConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<WorkerDirectoryConfig>): void {
    this.config = { ...this.config, ...config };
    if (!this.config.enableCaching) {
      this.cache.clear();
    }
  }
}

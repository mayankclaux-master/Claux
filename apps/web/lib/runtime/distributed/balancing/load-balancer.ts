/**
 * CLAUX Runtime Distributed Layer - Load Balancer
 * 
 * Provides load balancing strategies for distributed execution.
 * No external dependencies - pure balancing semantics.
 */

import type { WorkerId, LoadBalancingStrategy, WorkerInfo } from '../types';
import { LoadBalancingStrategy as LoadBalancingStrategyEnum } from '../types';

/**
 * Load Balancer
 * 
 * Provides load balancing strategies for distributed execution.
 */
export class LoadBalancer {
  /**
   * Select worker using specified strategy
   */
  selectWorker(
    workers: readonly WorkerInfo[],
    strategy: LoadBalancingStrategy,
    excludedWorkers: Set<WorkerId> = new Set()
  ): WorkerId | undefined {
    const availableWorkers = workers.filter(w => !excludedWorkers.has(w.metadata.workerId));

    if (availableWorkers.length === 0) {
      return undefined;
    }

    switch (strategy) {
      case LoadBalancingStrategyEnum.ROUND_ROBIN:
        return this.roundRobin(availableWorkers);
      case LoadBalancingStrategyEnum.LEAST_LOADED:
        return this.leastLoaded(availableWorkers);
      case LoadBalancingStrategyEnum.CAPABILITY_AWARE:
        return this.capabilityAware(availableWorkers);
      case LoadBalancingStrategyEnum.RESOURCE_AWARE:
        return this.resourceAware(availableWorkers);
      case LoadBalancingStrategyEnum.LOCALITY_AWARE:
        return this.localityAware(availableWorkers);
      default:
        return this.leastLoaded(availableWorkers);
    }
  }

  /**
   * Round robin strategy
   */
  private roundRobin(workers: readonly WorkerInfo[]): WorkerId {
    // In production, maintain round-robin index
    const index = Math.floor(Math.random() * workers.length);
    return workers[index].metadata.workerId;
  }

  /**
   * Least loaded strategy
   */
  private leastLoaded(workers: readonly WorkerInfo[]): WorkerId {
    let minLoad = Infinity;
    let selectedWorker: WorkerInfo | undefined;

    for (const worker of workers) {
      const load = worker.ownedExecutions.length;
      if (load < minLoad) {
        minLoad = load;
        selectedWorker = worker;
      }
    }

    return selectedWorker?.metadata.workerId || workers[0].metadata.workerId;
  }

  /**
   * Weighted strategy based on capacity
   */
  private weighted(workers: readonly WorkerInfo[]): WorkerId {
    let totalWeight = 0;
    const weights: { worker: WorkerInfo; weight: number }[] = [];

    for (const worker of workers) {
      const weight = worker.metadata.capacity.cpu + worker.metadata.capacity.memory;
      weights.push({ worker, weight });
      totalWeight += weight;
    }

    let random = Math.random() * totalWeight;
    for (const { worker, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return worker.metadata.workerId;
      }
    }

    return workers[0].metadata.workerId;
  }

  /**
   * Capability-aware strategy
   */
  private capabilityAware(workers: readonly WorkerInfo[]): WorkerId {
    // Select worker with most capabilities
    let maxCapabilities = 0;
    let selectedWorker: WorkerInfo | undefined;

    for (const worker of workers) {
      const capabilityCount = worker.metadata.capabilities.length;
      if (capabilityCount > maxCapabilities) {
        maxCapabilities = capabilityCount;
        selectedWorker = worker;
      }
    }

    return selectedWorker?.metadata.workerId || workers[0].metadata.workerId;
  }

  /**
   * Resource-aware strategy
   */
  private resourceAware(workers: readonly WorkerInfo[]): WorkerId {
    let minUtilization = Infinity;
    let selectedWorker: WorkerInfo | undefined;

    for (const worker of workers) {
      const utilization = worker.utilization.cpu + worker.utilization.memory + worker.utilization.concurrency;
      if (utilization < minUtilization) {
        minUtilization = utilization;
        selectedWorker = worker;
      }
    }

    return selectedWorker?.metadata.workerId || workers[0].metadata.workerId;
  }

  /**
   * Partition-aware strategy
   */
  private partitionAware(workers: readonly WorkerInfo[]): WorkerId {
    // Select worker with fewest partitions
    let minPartitions = Infinity;
    let selectedWorker: WorkerInfo | undefined;

    for (const worker of workers) {
      const partitionCount = worker.ownedPartitions.length;
      if (partitionCount < minPartitions) {
        minPartitions = partitionCount;
        selectedWorker = worker;
      }
    }

    return selectedWorker?.metadata.workerId || workers[0].metadata.workerId;
  }

  /**
   * Locality-aware strategy
   */
  private localityAware(workers: readonly WorkerInfo[]): WorkerId {
    // In production, use network topology for locality
    // For now, use hash-based selection
    const index = Math.floor(Math.random() * workers.length);
    return workers[index].metadata.workerId;
  }

  /**
   * Get balancing statistics
   */
  getStatistics(workers: readonly WorkerInfo[]): {
    totalWorkers: number;
    averageLoad: number;
    averageUtilization: number;
    loadVariance: number;
  } {
    if (workers.length === 0) {
      return {
        totalWorkers: 0,
        averageLoad: 0,
        averageUtilization: 0,
        loadVariance: 0,
      };
    }

    const loads = workers.map(w => w.ownedExecutions.length);
    const utilizations = workers.map(w => w.utilization.cpu + w.utilization.memory);

    const avgLoad = loads.reduce((sum, load) => sum + load, 0) / workers.length;
    const avgUtilization = utilizations.reduce((sum, util) => sum + util, 0) / workers.length;

    const loadVariance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / workers.length;

    return {
      totalWorkers: workers.length,
      averageLoad: avgLoad,
      averageUtilization: avgUtilization,
      loadVariance,
    };
  }
}

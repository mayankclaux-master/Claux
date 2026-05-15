/**
 * CLAUX Runtime Scaling Layer - Workload Balancing
 */

import type { WorkerId, WorkloadDistribution } from './types';

/**
 * Workload Balancing Manager
 */
export class WorkloadBalancingManager {
  private distributions: Map<WorkerId, WorkloadDistribution> = new Map();

  /**
   * Update distribution
   */
  update(distribution: WorkloadDistribution): void {
    this.distributions.set(distribution.workerId, distribution);
  }

  /**
   * Get least loaded worker
   */
  getLeastLoaded(): WorkerId | null {
    let leastLoaded: WorkerId | null = null;
    let lowestLoad = Infinity;

    for (const [workerId, dist] of this.distributions) {
      if (dist.load < lowestLoad) {
        lowestLoad = dist.load;
        leastLoaded = workerId;
      }
    }

    return leastLoaded;
  }

  /**
   * Get most loaded worker
   */
  getMostLoaded(): WorkerId | null {
    let mostLoaded: WorkerId | null = null;
    let highestLoad = -1;

    for (const [workerId, dist] of this.distributions) {
      if (dist.load > highestLoad) {
        highestLoad = dist.load;
        mostLoaded = workerId;
      }
    }

    return mostLoaded;
  }

  /**
   * Calculate balance score
   */
  calculateBalanceScore(): number {
    const distributions = Array.from(this.distributions.values());
    if (distributions.length === 0) return 1;

    const loads = distributions.map(d => d.load);
    const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avg, 2), 0) / loads.length;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, 1 - stdDev / avg);
  }

  /**
   * Clear
   */
  clear(): void {
    this.distributions.clear();
  }
}

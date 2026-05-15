/**
 * CLAUX Runtime Scaling Layer - Worker Affinity
 */

import type { WorkerId, WorkerAffinity } from './types';

/**
 * Worker Affinity Manager
 */
export class WorkerAffinityManager {
  private affinities: Map<WorkerId, WorkerAffinity> = new Map();

  /**
   * Set affinity
   */
  setAffinity(workerId: WorkerId, key: string, value: number): void {
    let affinity = this.affinities.get(workerId);
    if (!affinity) {
      affinity = { workerId, affinity: new Map() };
      this.affinities.set(workerId, affinity);
    }

    affinity.affinity.set(key, value);
  }

  /**
   * Get affinity
   */
  getAffinity(workerId: WorkerId, key: string): number {
    const affinity = this.affinities.get(workerId);
    if (!affinity) return 0;
    return affinity.affinity.get(key) || 0;
  }

  /**
   * Find best match
   */
  findBestMatch(requirements: Map<string, number>): WorkerId | null {
    let bestWorker: WorkerId | null = null;
    let bestScore = -1;

    for (const [workerId, affinity] of this.affinities) {
      const score = this.calculateMatch(affinity.affinity, requirements);
      if (score > bestScore) {
        bestScore = score;
        bestWorker = workerId;
      }
    }

    return bestWorker;
  }

  /**
   * Calculate match
   */
  private calculateMatch(affinity: Map<string, number>, requirements: Map<string, number>): number {
    let score = 0;
    let total = 0;

    for (const [key, requiredValue] of requirements) {
      const affinityValue = affinity.get(key) || 0;
      const diff = Math.abs(affinityValue - requiredValue);
      score += Math.max(0, 1 - diff);
      total++;
    }

    return total > 0 ? score / total : 0;
  }

  /**
   * Clear
   */
  clear(): void {
    this.affinities.clear();
  }
}

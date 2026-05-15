/**
 * CLAUX Runtime Distributed Layer - Worker Capability Matcher
 * 
 * Matches workers based on capabilities and requirements.
 * No external dependencies - pure matching semantics.
 */

import type { WorkerId, WorkerCapability, WorkerInfo } from '../types';
import { CAPABILITY_MATCHING_STRICTNESS } from '../constants';

/**
 * Worker Capability Matcher Configuration
 */
export interface WorkerCapabilityMatcherConfig {
  readonly strictness: keyof typeof CAPABILITY_MATCHING_STRICTNESS;
}

/**
 * Worker Capability Matcher
 * 
 * Matches workers based on capabilities and requirements.
 */
export class WorkerCapabilityMatcher {
  private config: WorkerCapabilityMatcherConfig;

  constructor(config: Partial<WorkerCapabilityMatcherConfig> = {}) {
    this.config = {
      strictness: config.strictness || 'MINIMUM',
    };
  }

  /**
   * Match workers by capability requirements
   */
  matchWorkers(
    workers: readonly WorkerInfo[],
    requiredCapabilities: readonly WorkerCapability[]
  ): readonly WorkerInfo[] {
    if (requiredCapabilities.length === 0) {
      return workers;
    }

    return workers.filter(worker =>
      this.workerMatchesCapabilities(worker, requiredCapabilities)
    );
  }

  /**
   * Check if worker matches capabilities
   */
  workerMatchesCapabilities(
    worker: WorkerInfo,
    requiredCapabilities: readonly WorkerCapability[]
  ): boolean {
    const workerCapabilities = worker.metadata.capabilities;

    switch (this.config.strictness) {
      case 'EXACT':
        return this.matchesExactly(workerCapabilities, requiredCapabilities);
      case 'MINIMUM':
        return this.matchesMinimum(workerCapabilities, requiredCapabilities);
      case 'PREFERRED':
        return this.matchesPreferred(workerCapabilities, requiredCapabilities);
      default:
        return this.matchesMinimum(workerCapabilities, requiredCapabilities);
    }
  }

  /**
   * Exact matching - all required capabilities must match exactly
   */
  private matchesExactly(
    workerCapabilities: readonly WorkerCapability[],
    requiredCapabilities: readonly WorkerCapability[]
  ): boolean {
    if (workerCapabilities.length !== requiredCapabilities.length) {
      return false;
    }

    const workerCapMap = new Map(
      workerCapabilities.map(cap => [cap.name, cap])
    );

    for (const required of requiredCapabilities) {
      const workerCap = workerCapMap.get(required.name);
      if (!workerCap || workerCap.version !== required.version) {
        return false;
      }
    }

    return true;
  }

  /**
   * Minimum matching - all required capabilities must be present with at least minimum version
   */
  private matchesMinimum(
    workerCapabilities: readonly WorkerCapability[],
    requiredCapabilities: readonly WorkerCapability[]
  ): boolean {
    const workerCapMap = new Map(
      workerCapabilities.map(cap => [cap.name, cap])
    );

    for (const required of requiredCapabilities) {
      const workerCap = workerCapMap.get(required.name);
      if (!workerCap) {
        return false;
      }

      // Version comparison (simplified)
      if (!this.versionSatisfies(workerCap.version, required.version, '>=')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Preferred matching - required capabilities should be present, but not strictly enforced
   */
  private matchesPreferred(
    workerCapabilities: readonly WorkerCapability[],
    requiredCapabilities: readonly WorkerCapability[]
  ): boolean {
    const workerCapMap = new Map(
      workerCapabilities.map(cap => [cap.name, cap])
    );

    let matchCount = 0;
    for (const required of requiredCapabilities) {
      const workerCap = workerCapMap.get(required.name);
      if (workerCap && this.versionSatisfies(workerCap.version, required.version, '>=')) {
        matchCount++;
      }
    }

    // At least 50% of required capabilities should match
    return matchCount >= requiredCapabilities.length * 0.5;
  }

  /**
   * Score workers by capability match
   */
  scoreWorkers(
    workers: readonly WorkerInfo[],
    requiredCapabilities: readonly WorkerCapability[]
  ): Map<WorkerId, number> {
    const scores = new Map<WorkerId, number>();

    for (const worker of workers) {
      scores.set(worker.metadata.workerId, this.calculateMatchScore(worker, requiredCapabilities));
    }

    return scores;
  }

  /**
   * Calculate match score for worker
   */
  private calculateMatchScore(
    worker: WorkerInfo,
    requiredCapabilities: readonly WorkerCapability[]
  ): number {
    if (requiredCapabilities.length === 0) {
      return 1.0;
    }

    const workerCapabilities = worker.metadata.capabilities;
    const workerCapMap = new Map(
      workerCapabilities.map(cap => [cap.name, cap])
    );

    let matchScore = 0;
    for (const required of requiredCapabilities) {
      const workerCap = workerCapMap.get(required.name);
      if (workerCap) {
        if (workerCap.version === required.version) {
          matchScore += 1.0;
        } else if (this.versionSatisfies(workerCap.version, required.version, '>=')) {
          matchScore += 0.5;
        }
      }
    }

    return matchScore / requiredCapabilities.length;
  }

  /**
   * Simple version comparison
   */
  private versionSatisfies(
    workerVersion: string,
    requiredVersion: string,
    operator: '=' | '>=' | '<='
  ): boolean {
    // Simplified version comparison
    // In production, use semver or similar library
    const workerParts = workerVersion.split('.').map(Number);
    const requiredParts = requiredVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(workerParts.length, requiredParts.length); i++) {
      const workerPart = workerParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;

      if (operator === '>=' && workerPart < requiredPart) {
        return false;
      } else if (operator === '<=' && workerPart > requiredPart) {
        return false;
      } else if (operator === '=' && workerPart !== requiredPart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find best matching worker
   */
  findBestWorker(
    workers: readonly WorkerInfo[],
    requiredCapabilities: readonly WorkerCapability[]
  ): WorkerInfo | undefined {
    const matchedWorkers = this.matchWorkers(workers, requiredCapabilities);
    if (matchedWorkers.length === 0) {
      return undefined;
    }

    const scores = this.scoreWorkers(matchedWorkers, requiredCapabilities);
    
    let bestWorker: WorkerInfo | undefined;
    let bestScore = -1;

    for (const worker of matchedWorkers) {
      const score = scores.get(worker.metadata.workerId) || 0;
      if (score > bestScore) {
        bestScore = score;
        bestWorker = worker;
      }
    }

    return bestWorker;
  }

  /**
   * Get capability compatibility matrix
   */
  getCompatibilityMatrix(
    workers: readonly WorkerInfo[],
    requiredCapabilities: readonly WorkerCapability[]
  ): Map<WorkerId, boolean> {
    const matrix = new Map<WorkerId, boolean>();

    for (const worker of workers) {
      matrix.set(
        worker.metadata.workerId,
        this.workerMatchesCapabilities(worker, requiredCapabilities)
      );
    }

    return matrix;
  }

  /**
   * Get configuration
   */
  getConfig(): WorkerCapabilityMatcherConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<WorkerCapabilityMatcherConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

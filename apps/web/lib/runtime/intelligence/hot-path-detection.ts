/**
 * CLAUX Runtime Intelligence Layer - Hot Path Detection
 * 
 * Hot path detection intelligence.
 * No ML providers - pure semantic intelligence.
 */

import type { HotPathDetectionResult } from './types';
import { HOT_PATH_THRESHOLDS } from './constants';

/**
 * Hot Path Detection Manager
 */
export class HotPathDetectionManager {
  private paths: Map<string, HotPathData> = new Map();

  /**
   * Track execution path
   */
  trackPath(pathId: string, duration: number): void {
    const data = this.paths.get(pathId) || this.defaultPathData();
    data.frequency++;
    data.totalDuration += duration;
    data.avgDuration = data.totalDuration / data.frequency;
    data.lastSeen = Date.now();

    this.paths.set(pathId, data);
  }

  /**
   * Detect hot paths
   */
  detectHotPaths(): readonly HotPathDetectionResult[] {
    const results: HotPathDetectionResult[] = [];

    for (const [pathId, data] of this.paths) {
      if (data.frequency >= HOT_PATH_THRESHOLDS.MIN_FREQUENCY &&
          data.avgDuration >= HOT_PATH_THRESHOLDS.MIN_DURATION_MS) {
        const optimizationPotential = this.calculateOptimizationPotential(data);
        if (optimizationPotential >= HOT_PATH_THRESHOLDS.OPTIMIZATION_POTENTIAL_THRESHOLD) {
          results.push({
            pathId,
            frequency: data.frequency,
            avgDuration: data.avgDuration,
            optimizationPotential,
          });
        }
      }
    }

    return results.sort((a, b) => b.optimizationPotential - a.optimizationPotential);
  }

  /**
   * Calculate optimization potential
   */
  private calculateOptimizationPotential(data: HotPathData): number {
    const frequencyScore = Math.min(data.frequency / 100, 1);
    const durationScore = Math.min(data.avgDuration / 10000, 1);
    return (frequencyScore + durationScore) / 2;
  }

  /**
   * Get path data
   */
  getPathData(pathId: string): HotPathData | undefined {
    return this.paths.get(pathId);
  }

  /**
   * Clear path
   */
  clearPath(pathId: string): void {
    this.paths.delete(pathId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.paths.clear();
  }

  /**
   * Default path data
   */
  private defaultPathData(): HotPathData {
    return {
      frequency: 0,
      totalDuration: 0,
      avgDuration: 0,
      lastSeen: Date.now(),
    };
  }
}

/**
 * Hot Path Data
 */
interface HotPathData {
  frequency: number;
  totalDuration: number;
  avgDuration: number;
  lastSeen: number;
}

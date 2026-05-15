/**
 * CLAUX Runtime Testing Layer - Checkpoint Corruption
 */

import type { ChaosTestId } from './types';
import { DEFAULT_CORRUPTION_PROBABILITY } from './constants';

/**
 * Checkpoint Corruption Manager
 */
export class CheckpointCorruptionManager {
  private corrupted: Map<string, ChaosTestId> = new Map();
  private probability: number = DEFAULT_CORRUPTION_PROBABILITY;

  /**
   * Set probability
   */
  setProbability(probability: number): void {
    this.probability = probability;
  }

  /**
   * Corrupt checkpoint
   */
  corrupt(checkpointId: string): ChaosTestId | null {
    if (Math.random() > this.probability) return null;

    const testId = `corruption_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.corrupted.set(checkpointId, testId);
    return testId;
  }

  /**
   * Is corrupted
   */
  isCorrupted(checkpointId: string): boolean {
    return this.corrupted.has(checkpointId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.corrupted.clear();
  }
}

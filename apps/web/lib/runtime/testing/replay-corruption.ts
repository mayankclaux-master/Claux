/**
 * CLAUX Runtime Testing Layer - Replay Corruption
 */

import type { ChaosTestId } from './types';
import { DEFAULT_CORRUPTION_PROBABILITY } from './constants';

/**
 * Replay Corruption Manager
 */
export class ReplayCorruptionManager {
  private corrupted: Map<string, ChaosTestId> = new Map();
  private probability: number = DEFAULT_CORRUPTION_PROBABILITY;

  /**
   * Set probability
   */
  setProbability(probability: number): void {
    this.probability = probability;
  }

  /**
   * Corrupt replay
   */
  corrupt(replayId: string): ChaosTestId | null {
    if (Math.random() > this.probability) return null;

    const testId = `replay_corruption_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.corrupted.set(replayId, testId);
    return testId;
  }

  /**
   * Is corrupted
   */
  isCorrupted(replayId: string): boolean {
    return this.corrupted.has(replayId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.corrupted.clear();
  }
}

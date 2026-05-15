/**
 * CLAUX Runtime Temporal Layer - Replay Diff
 * 
 * Diff analysis for replay comparison.
 * No external dependencies - pure diff semantics.
 */

import type { ReplayDiff, TemporalTimestamp } from '../types';

/**
 * Replay Diff Manager
 * 
 * Diff analysis for replay comparison.
 */
export class ReplayDiffManager {
  /**
   * Compute diff between states
   */
  computeStateDiff(expected: unknown, actual: unknown): readonly ReplayDiff[] {
    const diffs: ReplayDiff[] = [];
    const timestamp = Date.now() as TemporalTimestamp;

    if (typeof expected !== typeof actual) {
      diffs.push({
        timestamp,
        expected,
        actual,
        diffType: 'changed',
      });
      return diffs;
    }

    if (typeof expected === 'object' && expected !== null && typeof actual === 'object' && actual !== null) {
      const expectedObj = expected as Record<string, unknown>;
      const actualObj = actual as Record<string, unknown>;
      const allKeys = new Set([...Object.keys(expectedObj), ...Object.keys(actualObj)]);

      for (const key of allKeys) {
        const expectedValue = expectedObj[key];
        const actualValue = actualObj[key];

        if (!(key in expectedObj)) {
          diffs.push({
            timestamp,
            expected: undefined,
            actual: actualValue,
            diffType: 'added',
          });
        } else if (!(key in actualObj)) {
          diffs.push({
            timestamp,
            expected: expectedValue,
            actual: undefined,
            diffType: 'removed',
          });
        } else if (JSON.stringify(expectedValue) !== JSON.stringify(actualValue)) {
          diffs.push({
            timestamp,
            expected: expectedValue,
            actual: actualValue,
            diffType: 'changed',
          });
        }
      }
    } else if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      diffs.push({
        timestamp,
        expected,
        actual,
        diffType: 'changed',
      });
    }

    return diffs;
  }

  /**
   * Compute event diff
   */
  computeEventDiff(originalEvents: readonly unknown[], replayedEvents: readonly unknown[]): readonly ReplayDiff[] {
    const diffs: ReplayDiff[] = [];
    const timestamp = Date.now() as TemporalTimestamp;

    for (let i = 0; i < Math.max(originalEvents.length, replayedEvents.length); i++) {
      const original = originalEvents[i];
      const replayed = replayedEvents[i];

      if (original === undefined && replayed !== undefined) {
        diffs.push({
          timestamp,
          expected: undefined,
          actual: replayed,
          diffType: 'added',
        });
      } else if (original !== undefined && replayed === undefined) {
        diffs.push({
          timestamp,
          expected: original,
          actual: undefined,
          diffType: 'removed',
        });
      } else if (JSON.stringify(original) !== JSON.stringify(replayed)) {
        diffs.push({
          timestamp,
          expected: original,
          actual: replayed,
          diffType: 'changed',
        });
      }
    }

    return diffs;
  }

  /**
   * Get diff statistics
   */
  getDiffStatistics(diffs: readonly ReplayDiff[]): {
    totalDiffs: number;
    added: number;
    removed: number;
    changed: number;
  } {
    let added = 0;
    let removed = 0;
    let changed = 0;

    for (const diff of diffs) {
      switch (diff.diffType) {
        case 'added':
          added++;
          break;
        case 'removed':
          removed++;
          break;
        case 'changed':
          changed++;
          break;
      }
    }

    return {
      totalDiffs: diffs.length,
      added,
      removed,
      changed,
    };
  }
}

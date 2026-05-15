/**
 * CLAUX Runtime Temporal Layer - Replay Validation
 * 
 * Replay validation for correctness and consistency.
 * No external dependencies - pure validation semantics.
 */

import type { ReplayValidationResult, TemporalEvent, ReplayId, TemporalTimestamp } from '../types';
import { ReplayValidationError, ReplayDivergenceError } from '../errors';
import { DEFAULT_REPLAY_TOLERANCE_MS } from '../constants';

/**
 * Replay Validator
 * 
 * Replay validation for correctness and consistency.
 */
export class ReplayValidator {
  /**
   * Validate replay
   */
  validateReplay(
    replayId: ReplayId,
    originalEvents: readonly TemporalEvent[],
    replayedEvents: readonly TemporalEvent[],
    expectedState: unknown,
    actualState: unknown
  ): ReplayValidationResult {
    const errors: string[] = [];
    let divergenceDetected = false;
    let divergencePoint: TemporalTimestamp | null = null;

    // Check event count
    if (originalEvents.length !== replayedEvents.length) {
      errors.push(`Event count mismatch: original ${originalEvents.length}, replayed ${replayedEvents.length}`);
    }

    // Check event sequence
    for (let i = 0; i < Math.min(originalEvents.length, replayedEvents.length); i++) {
      const original = originalEvents[i];
      const replayed = replayedEvents[i];

      if (original.metadata.eventType !== replayed.metadata.eventType) {
        errors.push(`Event type mismatch at sequence ${i}: ${original.metadata.eventType} vs ${replayed.metadata.eventType}`);
        divergenceDetected = true;
        divergencePoint = original.metadata.timestamp;
      }

      if (JSON.stringify(original.payload) !== JSON.stringify(replayed.payload)) {
        errors.push(`Event payload mismatch at sequence ${i}`);
        divergenceDetected = true;
        divergencePoint = original.metadata.timestamp;
      }
    }

    // Check state
    if (JSON.stringify(expectedState) !== JSON.stringify(actualState)) {
      errors.push('State mismatch after replay');
    }

    return {
      valid: errors.length === 0,
      divergenceDetected,
      divergencePoint,
      expectedState,
      actualState,
      errors,
    };
  }

  /**
   * Validate replay lineage
   */
  validateReplayLineage(replayId: ReplayId, originalExecutionId: string, replayedExecutionId: string): boolean {
    return originalExecutionId !== replayedExecutionId;
  }

  /**
   * Detect divergence
   */
  detectDivergence(originalEvents: readonly TemporalEvent[], replayedEvents: readonly TemporalEvent[]): TemporalTimestamp | null {
    for (let i = 0; i < Math.min(originalEvents.length, replayedEvents.length); i++) {
      const original = originalEvents[i];
      const replayed = replayedEvents[i];

      if (original.metadata.eventType !== replayed.metadata.eventType ||
          JSON.stringify(original.payload) !== JSON.stringify(replayed.payload)) {
        return original.metadata.timestamp;
      }
    }

    return null;
  }

  /**
   * Validate replay safety
   */
  validateReplaySafety(events: readonly TemporalEvent[]): boolean {
    // Check that all events have valid sequence numbers
    for (let i = 0; i < events.length; i++) {
      if (events[i].metadata.sequenceNumber !== i + 1) {
        return false;
      }
    }

    return true;
  }
}

/**
 * CLAUX Runtime Verification Layer - Types
 */

export type VerificationId = string;
export type ReplayId = string;

/**
 * Verification Result
 */
export interface VerificationResult {
  readonly verificationId: VerificationId;
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly timestamp: number;
}

/**
 * Replay Comparison
 */
export interface ReplayComparison {
  readonly replayId: ReplayId;
  readonly originalExecutionId: string;
  readonly matches: boolean;
  readonly differences: readonly string[];
  readonly timestamp: number;
}

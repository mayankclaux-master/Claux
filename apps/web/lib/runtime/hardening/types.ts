/**
 * CLAUX Runtime Hardening Layer - Types
 */

export type HardeningId = string;

/**
 * Hardening Check Result
 */
export interface HardeningCheckResult {
  readonly hardeningId: HardeningId;
  readonly checkType: string;
  readonly passed: boolean;
  readonly details: readonly string[];
  readonly timestamp: number;
}

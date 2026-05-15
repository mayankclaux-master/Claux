/**
 * CLAUX Runtime E2E Layer - Types
 */

export type SandboxId = string;
export type SnapshotId = string;

/**
 * Sandbox State
 */
export interface SandboxState {
  readonly sandboxId: SandboxId;
  readonly isolated: boolean;
  readonly timestamp: number;
}

/**
 * Snapshot State
 */
export interface SnapshotState {
  readonly snapshotId: SnapshotId;
  readonly state: Record<string, unknown>;
  readonly timestamp: number;
}

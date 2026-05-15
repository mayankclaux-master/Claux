/**
 * CLAUX Runtime Temporal Layer - Constants
 * 
 * Configuration constants for temporal operations.
 * No external dependencies - pure constants.
 */

/**
 * Default event version
 */
export const DEFAULT_EVENT_VERSION: `${number}.${number}.${number}` = '1.0.0';

/**
 * Default snapshot interval (in milliseconds)
 */
export const DEFAULT_SNAPSHOT_INTERVAL_MS = 60000;

/**
 * Default compaction threshold (number of events)
 */
export const DEFAULT_COMPACTION_THRESHOLD = 1000;

/**
 * Default replay validation tolerance (in milliseconds)
 */
export const DEFAULT_REPLAY_TOLERANCE_MS = 100;

/**
 * Default audit chain max length
 */
export const DEFAULT_AUDIT_CHAIN_MAX_LENGTH = 10000;

/**
 * Default temporal query window size (in milliseconds)
 */
export const DEFAULT_TEMPORAL_WINDOW_MS = 3600000;

/**
 * Default causality graph max depth
 */
export const DEFAULT_CAUSALITY_MAX_DEPTH = 1000;

/**
 * Default lineage max depth
 */
export const DEFAULT_LINEAGE_MAX_DEPTH = 1000;

/**
 * Event type constants
 */
export const EVENT_TYPES = {
  EXECUTION_STARTED: 'execution.started',
  EXECUTION_COMPLETED: 'execution.completed',
  EXECUTION_FAILED: 'execution.failed',
  TASK_STARTED: 'task.started',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',
  CHECKPOINT_CREATED: 'checkpoint.created',
  CHECKPOINT_RESTORED: 'checkpoint.restored',
  REPLAY_STARTED: 'replay.started',
  REPLAY_COMPLETED: 'replay.completed',
  REPLAY_FAILED: 'replay.failed',
  RECOVERY_STARTED: 'recovery.started',
  RECOVERY_COMPLETED: 'recovery.completed',
  RECOVERY_FAILED: 'recovery.failed',
  STATE_UPDATED: 'state.updated',
  LINEAGE_UPDATED: 'lineage.updated',
  CAUSALITY_UPDATED: 'causality.updated',
} as const;

/**
 * Replay type constants
 */
export const REPLAY_TYPES = {
  DETERMINISTIC: 'deterministic',
  AUDIT: 'audit',
  FORENSIC: 'forensic',
  DEBUG: 'debug',
} as const;

/**
 * Recovery type constants
 */
export const RECOVERY_TYPES = {
  FAILBACK: 'failback',
  FAILOVER: 'failover',
  RETRY: 'retry',
  MANUAL: 'manual',
} as const;

/**
 * Lineage type constants
 */
export const LINEAGE_TYPES = {
  EXECUTION: 'execution',
  REPLAY: 'replay',
  RECOVERY: 'recovery',
  CHECKPOINT: 'checkpoint',
} as const;

/**
 * Audit type constants
 */
export const AUDIT_TYPES = {
  EVENT_APPENDED: 'event.appended',
  SNAPSHOT_CREATED: 'snapshot.created',
  SNAPSHOT_RESTORED: 'snapshot.restored',
  REPLAY_VALIDATED: 'replay.validated',
  CAUSALITY_VERIFIED: 'causality.verified',
  INTEGRITY_CHECK: 'integrity.check',
} as const;

/**
 * Compaction strategy constants
 */
export const COMPACTION_STRATEGIES = {
  SEQUENTIAL: 'sequential',
  TEMPORAL: 'temporal',
  CAUSALITY_PRESERVING: 'causality_preserving',
  LINEAGE_PRESERVING: 'lineage_preserving',
} as const;

/**
 * Snapshot strategy constants
 */
export const SNAPSHOT_STRATEGIES = {
  FULL: 'full',
  INCREMENTAL: 'incremental',
  DIFF: 'diff',
} as const;

/**
 * Temporal consistency level constants
 */
export const TEMPORAL_CONSISTENCY_LEVELS = {
  STRICT: 'strict',
  EVENTUAL: 'eventual',
  CAUSAL: 'causal',
} as const;

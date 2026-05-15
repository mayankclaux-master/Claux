/**
 * CLAUX Runtime Temporal Layer - Errors
 * 
 * Error classes for temporal operations.
 * No external dependencies - pure error semantics.
 */

/**
 * Base Temporal Error
 */
export class TemporalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemporalError';
  }
}

/**
 * Event Append Error
 */
export class EventAppendError extends TemporalError {
  constructor(message: string, public readonly eventId: string) {
    super(message);
    this.name = 'EventAppendError';
  }
}

/**
 * Event Replay Error
 */
export class EventReplayError extends TemporalError {
  constructor(message: string, public readonly eventId: string) {
    super(message);
    this.name = 'EventReplayError';
  }
}

/**
 * Event Compaction Error
 */
export class EventCompactionError extends TemporalError {
  constructor(message: string) {
    super(message);
    this.name = 'EventCompactionError';
  }
}

/**
 * Snapshot Error
 */
export class SnapshotError extends TemporalError {
  constructor(message: string, public readonly snapshotId: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

/**
 * Snapshot Restoration Error
 */
export class SnapshotRestorationError extends TemporalError {
  constructor(message: string, public readonly snapshotId: string) {
    super(message);
    this.name = 'SnapshotRestorationError';
  }
}

/**
 * Temporal Reconstruction Error
 */
export class TemporalReconstructionError extends TemporalError {
  constructor(message: string, public readonly executionId: string) {
    super(message);
    this.name = 'TemporalReconstructionError';
  }
}

/**
 * Causality Error
 */
export class CausalityError extends TemporalError {
  constructor(message: string, public readonly causationId: string) {
    super(message);
    this.name = 'CausalityError';
  }
}

/**
 * Lineage Error
 */
export class LineageError extends TemporalError {
  constructor(message: string, public readonly lineageId: string) {
    super(message);
    this.name = 'LineageError';
  }
}

/**
 * Replay Validation Error
 */
export class ReplayValidationError extends TemporalError {
  constructor(message: string, public readonly replayId: string) {
    super(message);
    this.name = 'ReplayValidationError';
  }
}

/**
 * Replay Divergence Error
 */
export class ReplayDivergenceError extends TemporalError {
  constructor(
    message: string,
    public readonly replayId: string,
    public readonly divergencePoint: number
  ) {
    super(message);
    this.name = 'ReplayDivergenceError';
  }
}

/**
 * Audit Integrity Error
 */
export class AuditIntegrityError extends TemporalError {
  constructor(message: string, public readonly auditId: string) {
    super(message);
    this.name = 'AuditIntegrityError';
  }
}

/**
 * Forensic Reconstruction Error
 */
export class ForensicReconstructionError extends TemporalError {
  constructor(message: string, public readonly executionId: string) {
    super(message);
    this.name = 'ForensicReconstructionError';
  }
}

/**
 * Temporal Query Error
 */
export class TemporalQueryError extends TemporalError {
  constructor(message: string, public readonly queryId: string) {
    super(message);
    this.name = 'TemporalQueryError';
  }
}

/**
 * Event Version Error
 */
export class EventVersionError extends TemporalError {
  constructor(message: string, public readonly version: string) {
    super(message);
    this.name = 'EventVersionError';
  }
}

/**
 * Temporal Consistency Error
 */
export class TemporalConsistencyError extends TemporalError {
  constructor(message: string, public readonly timestamp: number) {
    super(message);
    this.name = 'TemporalConsistencyError';
  }
}

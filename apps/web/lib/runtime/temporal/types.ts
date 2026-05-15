/**
 * CLAUX Runtime Temporal Layer - Types
 * 
 * Core types for event sourcing, temporal persistence, and deterministic replay.
 * No external dependencies - pure temporal semantics.
 */

/**
 * Event ID - Unique identifier for events
 */
export type EventId = string;

/**
 * Execution ID - Unique identifier for executions
 */
export type ExecutionId = string;

/**
 * Task ID - Unique identifier for tasks
 */
export type TaskId = string;

/**
 * Snapshot ID - Unique identifier for snapshots
 */
export type SnapshotId = string;

/**
 * Checkpoint ID - Unique identifier for checkpoints
 */
export type CheckpointId = string;

/**
 * Replay ID - Unique identifier for replays
 */
export type ReplayId = string;

/**
 * Recovery ID - Unique identifier for recovery operations
 */
export type RecoveryId = string;

/**
 * Causation ID - Unique identifier for causation relationships
 */
export type CausationId = string;

/**
 * Lineage ID - Unique identifier for lineage chains
 */
export type LineageId = string;

/**
 * Audit ID - Unique identifier for audit entries
 */
export type AuditId = string;

/**
 * Temporal Timestamp - High-precision timestamp for temporal operations
 */
export type TemporalTimestamp = number;

/**
 * Event Version - Semantic version for event schemas
 */
export type EventVersion = `${number}.${number}.${number}`;

/**
 * Event Type - Type discriminator for events
 */
export type EventType = string;

/**
 * Event Metadata
 */
export interface EventMetadata {
  readonly eventId: EventId;
  readonly eventType: EventType;
  readonly executionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  readonly causationId: CausationId | null;
  readonly correlationId: string | null;
  readonly version: EventVersion;
  readonly sequenceNumber: number;
}

/**
 * Temporal Event
 */
export interface TemporalEvent {
  readonly metadata: EventMetadata;
  readonly payload: unknown;
  readonly immutable: true;
}

/**
 * Event Batch
 */
export interface EventBatch {
  readonly events: readonly TemporalEvent[];
  readonly batchId: string;
  readonly timestamp: TemporalTimestamp;
}

/**
 * Execution Journal Entry
 */
export interface ExecutionJournalEntry {
  readonly eventId: EventId;
  readonly executionId: ExecutionId;
  readonly eventType: EventType;
  readonly timestamp: TemporalTimestamp;
  readonly payload: unknown;
  readonly causationId: CausationId | null;
  readonly sequenceNumber: number;
}

/**
 * Task Journal Entry
 */
export interface TaskJournalEntry {
  readonly eventId: EventId;
  readonly taskId: TaskId;
  readonly executionId: ExecutionId;
  readonly eventType: EventType;
  readonly timestamp: TemporalTimestamp;
  readonly payload: unknown;
  readonly causationId: CausationId | null;
  readonly sequenceNumber: number;
}

/**
 * Replay Journal Entry
 */
export interface ReplayJournalEntry {
  readonly eventId: EventId;
  readonly replayId: ReplayId;
  readonly originalExecutionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  readonly replayTimestamp: TemporalTimestamp;
  readonly payload: unknown;
  readonly causationId: CausationId | null;
  readonly sequenceNumber: number;
}

/**
 * Checkpoint Journal Entry
 */
export interface CheckpointJournalEntry {
  readonly eventId: EventId;
  readonly checkpointId: CheckpointId;
  readonly executionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  readonly state: unknown;
  readonly sequenceNumber: number;
}

/**
 * Recovery Journal Entry
 */
export interface RecoveryJournalEntry {
  readonly eventId: EventId;
  readonly recoveryId: RecoveryId;
  readonly executionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  readonly recoveryType: string;
  readonly payload: unknown;
  readonly causationId: CausationId | null;
  readonly sequenceNumber: number;
}

/**
 * Lineage Journal Entry
 */
export interface LineageJournalEntry {
  readonly eventId: EventId;
  readonly lineageId: LineageId;
  readonly parentId: LineageId | null;
  readonly executionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  readonly lineageType: string;
  readonly payload: unknown;
  readonly sequenceNumber: number;
}

/**
 * Snapshot Metadata
 */
export interface SnapshotMetadata {
  readonly snapshotId: SnapshotId;
  readonly executionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  readonly eventSequence: number;
  readonly version: EventVersion;
  readonly checksum: string;
}

/**
 * Snapshot
 */
export interface Snapshot {
  readonly metadata: SnapshotMetadata;
  readonly state: unknown;
  readonly lineage: readonly LineageId[];
  readonly causality: readonly CausationId[];
}

/**
 * Causation Chain
 */
export interface CausationChain {
  readonly causationId: CausationId;
  readonly chain: readonly CausationId[];
  readonly rootCausationId: CausationId;
  readonly depth: number;
}

/**
 * Execution Lineage
 */
export interface ExecutionLineage {
  readonly lineageId: LineageId;
  readonly executionId: ExecutionId;
  readonly parentExecutionId: ExecutionId | null;
  readonly replayId: ReplayId | null;
  readonly recoveryId: RecoveryId | null;
  children: ExecutionId[];
  readonly depth: number;
}

/**
 * Replay Lineage
 */
export interface ReplayLineage {
  readonly replayId: ReplayId;
  readonly originalExecutionId: ExecutionId;
  readonly replayedExecutionId: ExecutionId;
  readonly parentReplayId: ReplayId | null;
  children: ReplayId[];
  readonly depth: number;
}

/**
 * Recovery Lineage
 */
export interface RecoveryLineage {
  readonly recoveryId: RecoveryId;
  readonly executionId: ExecutionId;
  readonly recoveryType: string;
  readonly parentRecoveryId: RecoveryId | null;
  children: RecoveryId[];
  readonly depth: number;
}

/**
 * Causation Graph Node
 */
export interface CausationGraphNode {
  readonly causationId: CausationId;
  readonly eventId: EventId;
  readonly executionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  parents: CausationId[];
  children: CausationId[];
}

/**
 * Causation Graph
 */
export interface CausationGraph {
  readonly nodes: Map<CausationId, CausationGraphNode>;
  edges: { from: CausationId; to: CausationId }[];
}

/**
 * Ancestry Entry
 */
export interface AncestryEntry {
  readonly ancestorId: string;
  readonly ancestorType: 'execution' | 'replay' | 'recovery';
  readonly timestamp: TemporalTimestamp;
  readonly depth: number;
}

/**
 * Temporal State
 */
export interface TemporalState {
  readonly executionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  readonly eventSequence: number;
  readonly state: unknown;
  readonly lineage: readonly LineageId[];
  readonly causality: readonly CausationId[];
}

/**
 * Temporal Window
 */
export interface TemporalWindow {
  readonly startTime: TemporalTimestamp;
  readonly endTime: TemporalTimestamp;
  readonly executionId: ExecutionId | null;
  readonly eventTypes: readonly EventType[] | null;
}

/**
 * Replay Validation Result
 */
export interface ReplayValidationResult {
  readonly valid: boolean;
  readonly divergenceDetected: boolean;
  readonly divergencePoint: TemporalTimestamp | null;
  readonly expectedState: unknown | null;
  readonly actualState: unknown | null;
  readonly errors: readonly string[];
}

/**
 * Replay Diff
 */
export interface ReplayDiff {
  readonly timestamp: TemporalTimestamp;
  readonly expected: unknown;
  readonly actual: unknown;
  readonly diffType: 'added' | 'removed' | 'changed';
}

/**
 * Audit Entry
 */
export interface AuditEntry {
  readonly auditId: AuditId;
  readonly eventId: EventId;
  readonly executionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  readonly auditType: string;
  readonly payload: unknown;
  readonly checksum: string;
  readonly previousAuditId: AuditId | null;
}

/**
 * Audit Chain
 */
export interface AuditChain {
  readonly chainId: string;
  readonly executionId: ExecutionId;
  readonly entries: readonly AuditEntry[];
  readonly headAuditId: AuditId;
  readonly tailAuditId: AuditId;
  readonly length: number;
}

/**
 * Forensic Reconstruction Result
 */
export interface ForensicReconstructionResult {
  readonly executionId: ExecutionId;
  readonly reconstructedState: unknown;
  readonly timeline: readonly TemporalEvent[];
  readonly causalityChain: readonly CausationId[];
  readonly lineageChain: readonly LineageId[];
  readonly confidence: number;
}

/**
 * Event Compaction Result
 */
export interface EventCompactionResult {
  readonly originalEventCount: number;
  readonly compactedEventCount: number;
  readonly spaceSaved: number;
  readonly compactionRatio: number;
  readonly preservedCausality: boolean;
  readonly preservedLineage: boolean;
}

/**
 * Temporal Query Result
 */
export interface TemporalQueryResult {
  readonly queryId: string;
  readonly timestamp: TemporalTimestamp;
  readonly events: readonly TemporalEvent[];
  readonly state: unknown | null;
  readonly lineage: readonly LineageId[];
  readonly causality: readonly CausationId[];
}

/**
 * Temporal Runtime State
 */
export interface TemporalRuntimeState {
  activeExecutions: ExecutionId[];
  activeReplays: ReplayId[];
  activeRecoveries: RecoveryId[];
  snapshotCount: number;
  eventCount: number;
  auditCount: number;
  lastEventTimestamp: TemporalTimestamp;
}

/**
 * Temporal Runtime Context
 */
export interface TemporalRuntimeContext {
  readonly executionId: ExecutionId;
  readonly timestamp: TemporalTimestamp;
  readonly causationId: CausationId | null;
  readonly lineageId: LineageId | null;
  readonly metadata: Map<string, unknown>;
}

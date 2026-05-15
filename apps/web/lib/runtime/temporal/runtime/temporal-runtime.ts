/**
 * CLAUX Runtime Temporal Layer - Temporal Runtime
 * 
 * Main temporal runtime orchestrator.
 * No external dependencies - pure runtime semantics.
 */

import type { ExecutionId, TemporalTimestamp } from '../types';
import { EventStore } from '../sourcing/event-store';
import { SnapshotEngine } from '../snapshots/snapshot-engine';
import { SnapshotRebuilder } from '../snapshots/snapshot-rebuilder';
import { TemporalQueryEngine } from '../temporal/temporal-query-engine';
import { TemporalStateManager } from '../temporal/temporal-state';
import { TemporalReconstructionManager } from '../temporal/temporal-reconstruction';
import { DeterministicReplayManager } from '../replay/deterministic-replay';
import { AuditLog } from '../audit/audit-log';

/**
 * Temporal Runtime
 * 
 * Main temporal runtime orchestrator.
 */
export class TemporalRuntime {
  private eventStore: EventStore;
  private snapshotEngine: SnapshotEngine;
  private snapshotRebuilder: SnapshotRebuilder;
  private queryEngine: TemporalQueryEngine;
  private stateManager: TemporalStateManager;
  private reconstructionManager: TemporalReconstructionManager;
  private replayManager: DeterministicReplayManager;
  private auditLog: AuditLog;

  constructor() {
    this.eventStore = new EventStore();
    this.snapshotEngine = new SnapshotEngine();
    this.snapshotRebuilder = new SnapshotRebuilder();
    this.queryEngine = new TemporalQueryEngine();
    this.stateManager = new TemporalStateManager();
    this.reconstructionManager = new TemporalReconstructionManager();
    this.replayManager = new DeterministicReplayManager();
    this.auditLog = new AuditLog();
  }

  /**
   * Start temporal runtime
   */
  async start(): Promise<void> {
    // Initialize temporal runtime
  }

  /**
   * Stop temporal runtime
   */
  async stop(): Promise<void> {
    this.eventStore.clear();
    this.snapshotEngine.clear();
    this.stateManager.clear();
    this.auditLog.clear();
  }

  /**
   * Get event store
   */
  getEventStore(): EventStore {
    return this.eventStore;
  }

  /**
   * Get snapshot engine
   */
  getSnapshotEngine(): SnapshotEngine {
    return this.snapshotEngine;
  }

  /**
   * Get query engine
   */
  getQueryEngine(): TemporalQueryEngine {
    return this.queryEngine;
  }

  /**
   * Get state manager
   */
  getStateManager(): TemporalStateManager {
    return this.stateManager;
  }

  /**
   * Get reconstruction manager
   */
  getReconstructionManager(): TemporalReconstructionManager {
    return this.reconstructionManager;
  }

  /**
   * Get replay manager
   */
  getReplayManager(): DeterministicReplayManager {
    return this.replayManager;
  }

  /**
   * Get audit log
   */
  getAuditLog(): AuditLog {
    return this.auditLog;
  }
}

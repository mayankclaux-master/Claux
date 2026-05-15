/**
 * CLAUX Runtime E2E Layer - Facade
 */

import { ExecutionSandboxManager } from './sandbox';
import { DeterministicExecutionManager } from './deterministic-execution';
import { ExecutionRecordingManager } from './recording';
import { SideEffectIsolationManager } from './side-effect-isolation';
import { ReplayBoundaryManager } from './replay-boundaries';
import { SnapshotManager } from './snapshots';

/**
 * E2E Facade
 */
export class E2EFacade {
  readonly sandbox: ExecutionSandboxManager;
  readonly deterministicExecution: DeterministicExecutionManager;
  readonly recording: ExecutionRecordingManager;
  readonly sideEffectIsolation: SideEffectIsolationManager;
  readonly replayBoundaries: ReplayBoundaryManager;
  readonly snapshots: SnapshotManager;

  constructor() {
    this.sandbox = new ExecutionSandboxManager();
    this.deterministicExecution = new DeterministicExecutionManager();
    this.recording = new ExecutionRecordingManager();
    this.sideEffectIsolation = new SideEffectIsolationManager();
    this.replayBoundaries = new ReplayBoundaryManager();
    this.snapshots = new SnapshotManager();
  }
}

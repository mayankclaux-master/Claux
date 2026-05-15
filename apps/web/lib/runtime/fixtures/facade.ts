/**
 * CLAUX Runtime Fixtures Layer - Facade
 */

import { WorkflowFixturesManager } from './workflow-fixtures';
import { DAGFixturesManager } from './dag-fixtures';
import { CheckpointFixturesManager } from './checkpoint-fixtures';
import { TelemetryFixturesManager } from './telemetry-fixtures';
import { WorkerFixturesManager } from './worker-fixtures';
import { FailureFixturesManager } from './failure-fixtures';
import { RecoveryFixturesManager } from './recovery-fixtures';
import { ReplayFixturesManager } from './replay-fixtures';

/**
 * Fixtures Facade
 */
export class FixturesFacade {
  readonly workflow: WorkflowFixturesManager;
  readonly dag: DAGFixturesManager;
  readonly checkpoint: CheckpointFixturesManager;
  readonly telemetry: TelemetryFixturesManager;
  readonly worker: WorkerFixturesManager;
  readonly failure: FailureFixturesManager;
  readonly recovery: RecoveryFixturesManager;
  readonly replay: ReplayFixturesManager;

  constructor() {
    this.workflow = new WorkflowFixturesManager();
    this.dag = new DAGFixturesManager();
    this.checkpoint = new CheckpointFixturesManager();
    this.telemetry = new TelemetryFixturesManager();
    this.worker = new WorkerFixturesManager();
    this.failure = new FailureFixturesManager();
    this.recovery = new RecoveryFixturesManager();
    this.replay = new ReplayFixturesManager();
  }
}

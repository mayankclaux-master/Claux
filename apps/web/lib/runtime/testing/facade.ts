/**
 * CLAUX Runtime Testing Layer - Facade
 */

import { FaultInjectionManager } from './fault-injection';
import { WorkerCrashManager } from './worker-crash';
import { NetworkPartitionManager } from './network-partition';
import { DelayedEventsManager } from './delayed-events';
import { CheckpointCorruptionManager } from './checkpoint-corruption';
import { ReplayCorruptionManager } from './replay-corruption';
import { RecoveryValidationManager } from './recovery-validation';

/**
 * Testing Facade
 */
export class TestingFacade {
  readonly faultInjection: FaultInjectionManager;
  readonly workerCrash: WorkerCrashManager;
  readonly networkPartition: NetworkPartitionManager;
  readonly delayedEvents: DelayedEventsManager;
  readonly checkpointCorruption: CheckpointCorruptionManager;
  readonly replayCorruption: ReplayCorruptionManager;
  readonly recovery: RecoveryValidationManager;

  constructor() {
    this.faultInjection = new FaultInjectionManager();
    this.workerCrash = new WorkerCrashManager();
    this.networkPartition = new NetworkPartitionManager();
    this.delayedEvents = new DelayedEventsManager();
    this.checkpointCorruption = new CheckpointCorruptionManager();
    this.replayCorruption = new ReplayCorruptionManager();
    this.recovery = new RecoveryValidationManager();
  }
}

/**
 * CLAUX Runtime Hardening Layer - Facade
 */

import { InvariantValidationManager } from './invariant-validation';
import { SemanticConsistencyManager } from './semantic-consistency';
import { MemoryLeakDetectionManager } from './memory-leak-detection';
import { DeadlockDetectionManager } from './deadlock-detection';
import { StalledExecutionManager } from './stalled-execution';
import { InfiniteRetryPreventionManager } from './infinite-retry-prevention';
import { ReplayDriftDetectionManager } from './replay-drift-detection';
import { EventOrderingValidationManager } from './event-ordering-validation';
import { ClockSkewToleranceManager } from './clock-skew-tolerance';
import { StateCorruptionDetectionManager } from './state-corruption-detection';

/**
 * Hardening Facade
 */
export class HardeningFacade {
  readonly invariantValidation: InvariantValidationManager;
  readonly semanticConsistency: SemanticConsistencyManager;
  readonly memoryLeakDetection: MemoryLeakDetectionManager;
  readonly deadlockDetection: DeadlockDetectionManager;
  readonly stalledExecution: StalledExecutionManager;
  readonly infiniteRetryPrevention: InfiniteRetryPreventionManager;
  readonly replayDriftDetection: ReplayDriftDetectionManager;
  readonly eventOrderingValidation: EventOrderingValidationManager;
  readonly clockSkewTolerance: ClockSkewToleranceManager;
  readonly stateCorruptionDetection: StateCorruptionDetectionManager;

  constructor() {
    this.invariantValidation = new InvariantValidationManager();
    this.semanticConsistency = new SemanticConsistencyManager();
    this.memoryLeakDetection = new MemoryLeakDetectionManager();
    this.deadlockDetection = new DeadlockDetectionManager();
    this.stalledExecution = new StalledExecutionManager();
    this.infiniteRetryPrevention = new InfiniteRetryPreventionManager();
    this.replayDriftDetection = new ReplayDriftDetectionManager();
    this.eventOrderingValidation = new EventOrderingValidationManager();
    this.clockSkewTolerance = new ClockSkewToleranceManager();
    this.stateCorruptionDetection = new StateCorruptionDetectionManager();
  }
}

/**
 * CLAUX Runtime Scenarios Layer - Facade
 */

import { SequentialWorkflowScenario } from './sequential-workflow';
import { ParallelWorkflowScenario } from './parallel-workflow';
import { FanOutFanInScenario } from './fan-out-fan-in';
import { RetryWorkflowScenario } from './retry-workflow';
import { RecoveryWorkflowScenario } from './recovery-workflow';
import { CheckpointRestoreScenario } from './checkpoint-restore';
import { DistributedWorkerScenario } from './distributed-worker';
import { LongRunningScenario } from './long-running';
import { EventDrivenScenario } from './event-driven';
import { MultiTenantScenario } from './multi-tenant';
import { HighConcurrencyScenario } from './high-concurrency';
import { FailureCascadeScenario } from './failure-cascade';
import { ReplayValidationScenario } from './replay-validation';
import { GovernanceRejectionScenario } from './governance-rejection';
import { ChaosRecoveryScenario } from './chaos-recovery';

/**
 * Scenarios Facade
 */
export class ScenariosFacade {
  readonly sequential: SequentialWorkflowScenario;
  readonly parallel: ParallelWorkflowScenario;
  readonly fanOutFanIn: FanOutFanInScenario;
  readonly retry: RetryWorkflowScenario;
  readonly recovery: RecoveryWorkflowScenario;
  readonly checkpointRestore: CheckpointRestoreScenario;
  readonly distributedWorker: DistributedWorkerScenario;
  readonly longRunning: LongRunningScenario;
  readonly eventDriven: EventDrivenScenario;
  readonly multiTenant: MultiTenantScenario;
  readonly highConcurrency: HighConcurrencyScenario;
  readonly failureCascade: FailureCascadeScenario;
  readonly replayValidation: ReplayValidationScenario;
  readonly governanceRejection: GovernanceRejectionScenario;
  readonly chaosRecovery: ChaosRecoveryScenario;

  constructor() {
    this.sequential = new SequentialWorkflowScenario();
    this.parallel = new ParallelWorkflowScenario();
    this.fanOutFanIn = new FanOutFanInScenario();
    this.retry = new RetryWorkflowScenario();
    this.recovery = new RecoveryWorkflowScenario();
    this.checkpointRestore = new CheckpointRestoreScenario();
    this.distributedWorker = new DistributedWorkerScenario();
    this.longRunning = new LongRunningScenario();
    this.eventDriven = new EventDrivenScenario();
    this.multiTenant = new MultiTenantScenario();
    this.highConcurrency = new HighConcurrencyScenario();
    this.failureCascade = new FailureCascadeScenario();
    this.replayValidation = new ReplayValidationScenario();
    this.governanceRejection = new GovernanceRejectionScenario();
    this.chaosRecovery = new ChaosRecoveryScenario();
  }
}

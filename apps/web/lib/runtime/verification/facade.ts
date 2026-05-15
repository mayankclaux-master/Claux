/**
 * CLAUX Runtime Verification Layer - Facade
 */

import { DeterministicReplayVerificationManager } from './deterministic-replay';
import { TemporalConsistencyVerificationManager } from './temporal-consistency';
import { EventCausalityVerificationManager } from './event-causality';
import { CheckpointIntegrityVerificationManager } from './checkpoint-integrity';
import { RecoveryCorrectnessVerificationManager } from './recovery-correctness';
import { DAGConsistencyVerificationManager } from './dag-consistency';
import { DistributedOwnershipVerificationManager } from './distributed-ownership';
import { SchedulingFairnessVerificationManager } from './scheduling-fairness';
import { TenantIsolationVerificationManager } from './tenant-isolation';
import { GovernanceEnforcementVerificationManager } from './governance-enforcement';

/**
 * Verification Facade
 */
export class VerificationFacade {
  readonly deterministicReplay: DeterministicReplayVerificationManager;
  readonly temporalConsistency: TemporalConsistencyVerificationManager;
  readonly eventCausality: EventCausalityVerificationManager;
  readonly checkpointIntegrity: CheckpointIntegrityVerificationManager;
  readonly recoveryCorrectness: RecoveryCorrectnessVerificationManager;
  readonly dagConsistency: DAGConsistencyVerificationManager;
  readonly distributedOwnership: DistributedOwnershipVerificationManager;
  readonly schedulingFairness: SchedulingFairnessVerificationManager;
  readonly tenantIsolation: TenantIsolationVerificationManager;
  readonly governanceEnforcement: GovernanceEnforcementVerificationManager;

  constructor() {
    this.deterministicReplay = new DeterministicReplayVerificationManager();
    this.temporalConsistency = new TemporalConsistencyVerificationManager();
    this.eventCausality = new EventCausalityVerificationManager();
    this.checkpointIntegrity = new CheckpointIntegrityVerificationManager();
    this.recoveryCorrectness = new RecoveryCorrectnessVerificationManager();
    this.dagConsistency = new DAGConsistencyVerificationManager();
    this.distributedOwnership = new DistributedOwnershipVerificationManager();
    this.schedulingFairness = new SchedulingFairnessVerificationManager();
    this.tenantIsolation = new TenantIsolationVerificationManager();
    this.governanceEnforcement = new GovernanceEnforcementVerificationManager();
  }
}

/**
 * CLAUX Runtime Distributed Layer - Errors
 * 
 * Custom error classes for distributed runtime coordination.
 * No external dependencies - pure distributed semantics.
 */

import type { WorkerId, ClusterId, PartitionId, LeaseId, ExecutionId } from './types';

/**
 * Base distributed error
 */
export class DistributedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DistributedError';
    Object.setPrototypeOf(this, DistributedError.prototype);
  }
}

/**
 * Worker registration error
 */
export class WorkerRegistrationError extends DistributedError {
  constructor(
    message: string,
    public readonly workerId: WorkerId
  ) {
    super(message);
    this.name = 'WorkerRegistrationError';
    Object.setPrototypeOf(this, WorkerRegistrationError.prototype);
  }
}

/**
 * Worker not found error
 */
export class WorkerNotFoundError extends DistributedError {
  constructor(
    message: string,
    public readonly workerId: WorkerId
  ) {
    super(message);
    this.name = 'WorkerNotFoundError';
    Object.setPrototypeOf(this, WorkerNotFoundError.prototype);
  }
}

/**
 * Worker already exists error
 */
export class WorkerAlreadyExistsError extends DistributedError {
  constructor(
    message: string,
    public readonly workerId: WorkerId
  ) {
    super(message);
    this.name = 'WorkerAlreadyExistsError';
    Object.setPrototypeOf(this, WorkerAlreadyExistsError.prototype);
  }
}

/**
 * Worker heartbeat error
 */
export class WorkerHeartbeatError extends DistributedError {
  constructor(
    message: string,
    public readonly workerId: WorkerId
  ) {
    super(message);
    this.name = 'WorkerHeartbeatError';
    Object.setPrototypeOf(this, WorkerHeartbeatError.prototype);
  }
}

/**
 * Worker heartbeat timeout error
 */
export class WorkerHeartbeatTimeoutError extends WorkerHeartbeatError {
  constructor(
    workerId: WorkerId,
    public readonly lastHeartbeat: Date,
    public readonly timeoutMs: number
  ) {
    super(`Worker ${workerId} heartbeat timeout after ${timeoutMs}ms`, workerId);
    this.name = 'WorkerHeartbeatTimeoutError';
    Object.setPrototypeOf(this, WorkerHeartbeatTimeoutError.prototype);
  }
}

/**
 * Lease acquisition error
 */
export class LeaseAcquisitionError extends DistributedError {
  constructor(
    message: string,
    public readonly leaseId: LeaseId,
    public readonly workerId: WorkerId
  ) {
    super(message);
    this.name = 'LeaseAcquisitionError';
    Object.setPrototypeOf(this, LeaseAcquisitionError.prototype);
  }
}

/**
 * Lease renewal error
 */
export class LeaseRenewalError extends DistributedError {
  constructor(
    message: string,
    public readonly leaseId: LeaseId,
    public readonly workerId: WorkerId
  ) {
    super(message);
    this.name = 'LeaseRenewalError';
    Object.setPrototypeOf(this, LeaseRenewalError.prototype);
  }
}

/**
 * Lease expiration error
 */
export class LeaseExpirationError extends DistributedError {
  constructor(
    message: string,
    public readonly leaseId: LeaseId,
    public readonly workerId: WorkerId,
    public readonly expiredAt: Date
  ) {
    super(message);
    this.name = 'LeaseExpirationError';
    Object.setPrototypeOf(this, LeaseExpirationError.prototype);
  }
}

/**
 * Lease transfer error
 */
export class LeaseTransferError extends DistributedError {
  constructor(
    message: string,
    public readonly leaseId: LeaseId,
    public readonly fromWorker: WorkerId,
    public readonly toWorker: WorkerId
  ) {
    super(message);
    this.name = 'LeaseTransferError';
    Object.setPrototypeOf(this, LeaseTransferError.prototype);
  }
}

/**
 * Ownership conflict error
 */
export class OwnershipConflictError extends DistributedError {
  constructor(
    message: string,
    public readonly resourceId: string,
    public readonly currentOwner: WorkerId,
    public readonly claimedOwner: WorkerId
  ) {
    super(message);
    this.name = 'OwnershipConflictError';
    Object.setPrototypeOf(this, OwnershipConflictError.prototype);
  }
}

/**
 * Ownership not found error
 */
export class OwnershipNotFoundError extends DistributedError {
  constructor(
    message: string,
    public readonly resourceId: string
  ) {
    super(message);
    this.name = 'OwnershipNotFoundError';
    Object.setPrototypeOf(this, OwnershipNotFoundError.prototype);
  }
}

/**
 * Cluster membership error
 */
export class ClusterMembershipError extends DistributedError {
  constructor(
    message: string,
    public readonly clusterId: ClusterId
  ) {
    super(message);
    this.name = 'ClusterMembershipError';
    Object.setPrototypeOf(this, ClusterMembershipError.prototype);
  }
}

/**
 * Cluster not found error
 */
export class ClusterNotFoundError extends ClusterMembershipError {
  constructor(
    message: string,
    clusterId: ClusterId
  ) {
    super(message, clusterId);
    this.name = 'ClusterNotFoundError';
    Object.setPrototypeOf(this, ClusterNotFoundError.prototype);
  }
}

/**
 * Cluster formation error
 */
export class ClusterFormationError extends ClusterMembershipError {
  constructor(
    message: string,
    clusterId: ClusterId,
    public readonly requiredSize: number,
    public readonly actualSize: number
  ) {
    super(message, clusterId);
    this.name = 'ClusterFormationError';
    Object.setPrototypeOf(this, ClusterFormationError.prototype);
  }
}

/**
 * Partition assignment error
 */
export class PartitionAssignmentError extends DistributedError {
  constructor(
    message: string,
    public readonly partitionId: PartitionId,
    public readonly workerId: WorkerId
  ) {
    super(message);
    this.name = 'PartitionAssignmentError';
    Object.setPrototypeOf(this, PartitionAssignmentError.prototype);
  }
}

/**
 * Partition reassignment error
 */
export class PartitionReassignmentError extends DistributedError {
  constructor(
    message: string,
    public readonly partitionId: PartitionId,
    public readonly fromWorker: WorkerId,
    public readonly toWorker: WorkerId
  ) {
    super(message);
    this.name = 'PartitionReassignmentError';
    Object.setPrototypeOf(this, PartitionReassignmentError.prototype);
  }
}

/**
 * Partition not found error
 */
export class PartitionNotFoundError extends DistributedError {
  constructor(
    message: string,
    public readonly partitionId: PartitionId
  ) {
    super(message);
    this.name = 'PartitionNotFoundError';
    Object.setPrototypeOf(this, PartitionNotFoundError.prototype);
  }
}

/**
 * Execution routing error
 */
export class ExecutionRoutingError extends DistributedError {
  constructor(
    message: string,
    public readonly executionId: ExecutionId
  ) {
    super(message);
    this.name = 'ExecutionRoutingError';
    Object.setPrototypeOf(this, ExecutionRoutingError.prototype);
  }
}

/**
 * Execution reassignment error
 */
export class ExecutionReassignmentError extends DistributedError {
  constructor(
    message: string,
    public readonly executionId: ExecutionId,
    public readonly fromWorker: WorkerId,
    public readonly toWorker: WorkerId
  ) {
    super(message);
    this.name = 'ExecutionReassignmentError';
    Object.setPrototypeOf(this, ExecutionReassignmentError.prototype);
  }
}

/**
 * Failover error
 */
export class FailoverError extends DistributedError {
  constructor(
    message: string,
    public readonly sourceWorker: WorkerId,
    public readonly targetWorker: WorkerId
  ) {
    super(message);
    this.name = 'FailoverError';
    Object.setPrototypeOf(this, FailoverError.prototype);
  }
}

/**
 * Failover timeout error
 */
export class FailoverTimeoutError extends FailoverError {
  constructor(
    sourceWorker: WorkerId,
    targetWorker: WorkerId,
    public readonly timeoutMs: number
  ) {
    super(`Failover from ${sourceWorker} to ${targetWorker} timed out after ${timeoutMs}ms`, sourceWorker, targetWorker);
    this.name = 'FailoverTimeoutError';
    Object.setPrototypeOf(this, FailoverTimeoutError.prototype);
  }
}

/**
 * Consensus error
 */
export class ConsensusError extends DistributedError {
  constructor(
    message: string,
    public readonly clusterId: ClusterId
  ) {
    super(message);
    this.name = 'ConsensusError';
    Object.setPrototypeOf(this, ConsensusError.prototype);
  }
}

/**
 * Consensus timeout error
 */
export class ConsensusTimeoutError extends ConsensusError {
  constructor(
    clusterId: ClusterId,
    public readonly proposalId: string,
    public readonly timeoutMs: number
  ) {
    super(`Consensus for proposal ${proposalId} timed out after ${timeoutMs}ms`, clusterId);
    this.name = 'ConsensusTimeoutError';
    Object.setPrototypeOf(this, ConsensusTimeoutError.prototype);
  }
}

/**
 * Leader election error
 */
export class LeaderElectionError extends DistributedError {
  constructor(
    message: string,
    public readonly clusterId: ClusterId
  ) {
    super(message);
    this.name = 'LeaderElectionError';
    Object.setPrototypeOf(this, LeaderElectionError.prototype);
  }
}

/**
 * Load balancing error
 */
export class LoadBalancingError extends DistributedError {
  constructor(
    message: string,
    public readonly clusterId: ClusterId
  ) {
    super(message);
    this.name = 'LoadBalancingError';
    Object.setPrototypeOf(this, LoadBalancingError.prototype);
  }
}

/**
 * Worker draining error
 */
export class WorkerDrainingError extends DistributedError {
  constructor(
    message: string,
    public readonly workerId: WorkerId
  ) {
    super(message);
    this.name = 'WorkerDrainingError';
    Object.setPrototypeOf(this, WorkerDrainingError.prototype);
  }
}

/**
 * Worker drain timeout error
 */
export class WorkerDrainTimeoutError extends WorkerDrainingError {
  constructor(
    workerId: WorkerId,
    public readonly timeoutMs: number,
    public readonly remainingExecutions: number
  ) {
    super(`Worker ${workerId} drain timed out after ${timeoutMs}ms with ${remainingExecutions} remaining executions`, workerId);
    this.name = 'WorkerDrainTimeoutError';
    Object.setPrototypeOf(this, WorkerDrainTimeoutError.prototype);
  }
}

/**
 * Split brain detection error
 */
export class SplitBrainError extends DistributedError {
  constructor(
    message: string,
    public readonly clusterId: ClusterId,
    public readonly detectedLeaders: readonly WorkerId[]
  ) {
    super(message);
    this.name = 'SplitBrainError';
    Object.setPrototypeOf(this, SplitBrainError.prototype);
  }
}

/**
 * Determinism violation error
 */
export class DeterminismViolationError extends DistributedError {
  constructor(
    message: string,
    public readonly executionId: ExecutionId,
    public readonly violationDetails: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DeterminismViolationError';
    Object.setPrototypeOf(this, DeterminismViolationError.prototype);
  }
}

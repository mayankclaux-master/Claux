/**
 * CLAUX Agent Execution Model Types
 * 
 * This file defines the agent execution model including:
 * - task delegation semantics
 * - subtask spawning
 * - execution claims
 * - execution leases
 * - execution cancellation
 * - execution recovery
 * - execution retries
 * - execution checkpoints
 * - execution replay
 * - deterministic execution guarantees
 * - agent runtime boundaries
 * - execution isolation semantics
 */

import { CanonicalAgentType } from '../system/types';

/**
 * Execution claim status
 */
export enum ExecutionClaimStatus {
  /**
   * PENDING - Claim pending
   */
  PENDING = 'pending',

  /**
   * GRANTED - Claim granted
   */
  GRANTED = 'granted',

  /**
   * DENIED - Claim denied
   */
  DENIED = 'denied',

  /**
   * RELEASED - Claim released
   */
  RELEASED = 'released',

  /**
   * EXPIRED - Claim expired
   */
  EXPIRED = 'expired',
}

/**
 * Execution lease type
 */
export enum ExecutionLeaseType {
  /**
   * TASK_LEASE - Task-level lease
   */
  TASK_LEASE = 'task_lease',

  /**
   * WORKFLOW_LEASE - Workflow-level lease
   */
  WORKFLOW_LEASE = 'workflow_lease',

  /**
   * SESSION_LEASE - Session-level lease
   */
  SESSION_LEASE = 'session_lease',
}

/**
 * Execution cancellation reason
 */
export enum ExecutionCancellationReason {
  /**
   * USER_REQUEST - User requested cancellation
   */
  USER_REQUEST = 'user_request',

  /**
   * TIMEOUT - Execution timeout
   */
  TIMEOUT = 'timeout',

  /**
   * GOVERNANCE_REJECTION - Governance rejection
   */
  GOVERNANCE_REJECTION = 'governance_rejection',

  /**
   * RESOURCE_EXHAUSTION - Resource exhaustion
   */
  RESOURCE_EXHAUSTION = 'resource_exhaustion',

  /**
   * FAILURE - Execution failure
   */
  FAILURE = 'failure',
}

/**
 * Execution retry policy
 */
export enum ExecutionRetryPolicy {
  /**
   * NO_RETRY - No retry
   */
  NO_RETRY = 'no_retry',

  /**
   * FIXED_RETRY - Fixed number of retries
   */
  FIXED_RETRY = 'fixed_retry',

  /**
   * EXPONENTIAL_BACKOFF - Exponential backoff
   */
  EXPONENTIAL_BACKOFF = 'exponential_backoff',

  /**
   * INFINITE_RETRY - Infinite retry (with limits)
   */
  INFINITE_RETRY = 'infinite_retry',
}

/**
 * Deterministic guarantee level
 */
export enum DeterministicGuaranteeLevel {
  /**
   * STRICT - Strict determinism
   */
  STRICT = 'strict',

  /**
   * CAUSAL - Causal determinism
   */
  CAUSAL = 'causal',

  /**
   * EVENTUAL - Eventual determinism
   */
  EVENTUAL = 'eventual',

  /**
   * NONE - No guarantee
   */
  NONE = 'none',
}

/**
 * Execution isolation level
 */
export enum ExecutionIsolationLevel {
  /**
   * AGENT_ISOLATED - Agent-level isolation
   */
  AGENT_ISOLATED = 'agent_isolated',

  /**
   * TASK_ISOLATED - Task-level isolation
   */
  TASK_ISOLATED = 'task_isolated',

  /**
   * WORKFLOW_ISOLATED - Workflow-level isolation
   */
  WORKFLOW_ISOLATED = 'workflow_isolated',

  /**
   * SESSION_ISOLATED - Session-level isolation
   */
  SESSION_ISOLATED = 'session_isolated',

  /**
   * SHARED - Shared execution
   */
  SHARED = 'shared',
}

/**
 * Task delegation
 */
export interface TaskDelegation {
  /**
   * Delegation identifier
   */
  readonly delegationId: string;

  /**
   * Delegator agent type
   */
  readonly delegator: CanonicalAgentType;

  /**
   * Delegatee agent type
   */
  readonly delegatee: CanonicalAgentType;

  /**
   * Task identifier
   */
  readonly taskId: string;

  /**
   * Delegation timestamp
   */
  readonly timestamp: number;

  /**
   * Delegation scope
   */
  readonly scope: string;
}

/**
 * Subtask spawn
 */
export interface SubtaskSpawn {
  /**
   * Spawn identifier
   */
  readonly spawnId: string;

  /**
   * Parent task identifier
   */
  readonly parentTaskId: string;

  /**
   * Subtask identifier
   */
  readonly subtaskId: string;

  /**
   * Spawning agent type
   */
  readonly spawningAgent: CanonicalAgentType;

  /**
   * Execution agent type
   */
  readonly executionAgent: CanonicalAgentType;

  /**
   * Spawn timestamp
   */
  readonly timestamp: number;
}

/**
 * Execution claim
 */
export interface ExecutionClaim {
  /**
   * Claim identifier
   */
  readonly claimId: string;

  /**
   * Claiming agent type
   */
  readonly claimingAgent: CanonicalAgentType;

  /**
   * Task identifier
   */
  readonly taskId: string;

  /**
   * Claim status
   */
  readonly status: ExecutionClaimStatus;

  /**
   * Claim timestamp
   */
  readonly timestamp: number;

  /**
   * Lease expiry
   */
  readonly leaseExpiry?: number;
}

/**
 * Execution lease
 */
export interface ExecutionLease {
  /**
   * Lease identifier
   */
  readonly leaseId: string;

  /**
   * Leased agent type
   */
  readonly leasedAgent: CanonicalAgentType;

  /**
   * Lease type
   */
  readonly leaseType: ExecutionLeaseType;

  /**
   * Lease duration
   */
  readonly duration: number;

  /**
   * Lease start time
   */
  readonly startTime: number;

  /**
   * Lease expiry time
   */
  readonly expiryTime: number;

  /**
   * Renewable
   */
  readonly renewable: boolean;
}

/**
 * Execution cancellation
 */
export interface ExecutionCancellation {
  /**
   * Cancellation identifier
   */
  readonly cancellationId: string;

  /**
   * Task identifier
   */
  readonly taskId: string;

  /**
   * Cancelling agent type
   */
  readonly cancellingAgent: CanonicalAgentType;

  /**
   * Cancellation reason
   */
  readonly reason: ExecutionCancellationReason;

  /**
   * Cancellation timestamp
   */
  readonly timestamp: number;

  /**
   * Force cancellation
   */
  readonly force: boolean;
}

/**
 * Execution recovery
 */
export interface ExecutionRecovery {
  /**
   * Recovery identifier
   */
  readonly recoveryId: string;

  /**
   * Failed task identifier
   */
  readonly failedTaskId: string;

  /**
   * Recovering agent type
   */
  readonly recoveringAgent: CanonicalAgentType;

  /**
   * Recovery strategy
   */
  readonly recoveryStrategy: string;

  /**
   * Recovery timestamp
   */
  readonly timestamp: number;

  /**
   * Recovery checkpoint
   */
  readonly recoveryCheckpoint?: string;
}

/**
 * Execution retry
 */
export interface ExecutionRetry {
  /**
   * Retry identifier
   */
  readonly retryId: string;

  /**
   * Failed task identifier
   */
  readonly failedTaskId: string;

  /**
   * Retrying agent type
   */
  readonly retryingAgent: CanonicalAgentType;

  /**
   * Retry attempt
   */
  readonly retryAttempt: number;

  /**
   * Retry policy
   */
  readonly retryPolicy: ExecutionRetryPolicy;

  /**
   * Retry timestamp
   */
  readonly timestamp: number;
}

/**
 * Execution checkpoint
 */
export interface ExecutionCheckpoint {
  /**
   * Checkpoint identifier
   */
  readonly checkpointId: string;

  /**
   * Task identifier
   */
  readonly taskId: string;

  /**
   * Checkpointing agent type
   */
  readonly checkpointingAgent: CanonicalAgentType;

  /**
   * Checkpoint state
   */
  readonly state: Readonly<Record<string, unknown>>;

  /**
   * Checkpoint timestamp
   */
  readonly timestamp: number;
}

/**
 * Execution replay
 */
export interface ExecutionReplay {
  /**
   * Replay identifier
   */
  readonly replayId: string;

  /**
   * Original task identifier
   */
  readonly originalTaskId: string;

  /**
   * Replaying agent type
   */
  readonly replayingAgent: CanonicalAgentType;

  /**
   * Replay checkpoint
   */
  readonly replayCheckpoint: string;

  /**
   * Replay timestamp
   */
  readonly timestamp: number;
}

/**
 * Agent execution model
 */
export interface AgentExecutionModel {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Deterministic guarantee level
   */
  readonly deterministicGuarantee: DeterministicGuaranteeLevel;

  /**
   * Execution isolation level
   */
  readonly executionIsolation: ExecutionIsolationLevel;

  /**
   * Retry policy
   */
  readonly retryPolicy: ExecutionRetryPolicy;

  /**
   * Lease type
   */
  readonly leaseType: ExecutionLeaseType;

  /**
   * Cancellable
   */
  readonly cancellable: boolean;

  /**
   * Recoverable
   */
  readonly recoverable: boolean;

  /**
   * Replayable
   */
  readonly replayable: boolean;
}

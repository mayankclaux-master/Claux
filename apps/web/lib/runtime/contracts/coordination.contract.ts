/**
 * Runtime Coordination Contracts
 * 
 * Pure abstractions for distributed coordination
 * NO actual distributed coordination implementation
 */

/**
 * Coordination provider
 * Canonical interface for coordination provider
 */
export interface CoordinationProvider {
  readonly providerId: string;
  readonly providerType: string;
  readonly version: string;

  /**
   * Create distributed lock
   */
  createLock(lockId: string, options?: LockOptions): DistributedLock;

  /**
   * Get lock
   */
  getLock(lockId: string): DistributedLock | null;

  /**
   * Create lease manager
   */
  createLeaseManager(leaseId: string, options?: LeaseManagerOptions): LeaseManager;

  /**
   * Get lease manager
   */
  getLeaseManager(leaseId: string): LeaseManager | null;

  /**
   * Create heartbeat coordinator
   */
  createHeartbeatCoordinator(coordinatorId: string, options?: HeartbeatCoordinatorOptions): HeartbeatCoordinator;

  /**
   * Get heartbeat coordinator
   */
  getHeartbeatCoordinator(coordinatorId: string): HeartbeatCoordinator | null;

  /**
   * Create consensus context
   */
  createConsensusContext(contextId: string, options?: ConsensusContextOptions): ConsensusContext;

  /**
   * Get consensus context
   */
  getConsensusContext(contextId: string): ConsensusContext | null;

  /**
   * Health check
   */
  healthCheck(): Promise<CoordinationHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Distributed lock
 * Canonical interface for distributed locking
 */
export interface DistributedLock {
  readonly lockId: string;
  readonly ownerId: string;
  readonly resource: string;
  readonly status: LockStatus;
  readonly acquiredAt?: Date;
  readonly expiresAt?: Date;

  /**
   * Acquire lock
   */
  acquire(options?: LockAcquisitionOptions): Promise<LockAcquisitionResult>;

  /**
   * Release lock
   */
  release(): Promise<LockReleaseResult>;

  /**
   * Extend lock
   */
  extend(durationMs: number): Promise<LockExtensionResult>;

  /**
   * Try acquire
   */
  tryAcquire(options?: LockAcquisitionOptions): Promise<LockAcquisitionResult>;

  /**
   * Get lock info
   */
  getLockInfo(): LockInfo;

  /**
   * Is locked
   */
  isLocked(): boolean;

  /**
   * Is expired
   */
  isExpired(): boolean;
}

/**
 * Lock status
 */
export enum LockStatus {
  UNLOCKED = 'unlocked',
  LOCKED = 'locked',
  EXPIRED = 'expired',
  ERROR = 'error',
}

/**
 * Lock options
 */
export interface LockOptions {
  readonly resource: string;
  readonly ttlMs?: number;
  readonly autoRenew?: boolean;
  readonly metadata?: LockMetadata;
}

/**
 * Lock metadata
 */
export interface LockMetadata {
  readonly ownerType?: string;
  readonly purpose?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Lock acquisition options
 */
export interface LockAcquisitionOptions {
  readonly ttlMs?: number;
  readonly waitTimeoutMs?: number;
  readonly retryIntervalMs?: number;
  readonly metadata?: LockMetadata;
}

/**
 * Lock acquisition result
 */
export interface LockAcquisitionResult {
  readonly success: boolean;
  readonly lockId: string;
  readonly acquiredAt: Date;
  readonly expiresAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Lock release result
 */
export interface LockReleaseResult {
  readonly success: boolean;
  readonly releasedAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Lock extension result
 */
export interface LockExtensionResult {
  readonly success: boolean;
  readonly newExpiresAt: Date;
  readonly extendedAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Lock info
 */
export interface LockInfo {
  readonly lockId: string;
  readonly ownerId: string;
  readonly resource: string;
  readonly status: LockStatus;
  readonly acquiredAt?: Date;
  readonly expiresAt?: Date;
  readonly metadata?: LockMetadata;
}

/**
 * Lease manager
 * Canonical interface for lease management
 */
export interface LeaseManager {
  readonly leaseId: string;
  readonly ownerId: string;
  readonly resource: string;
  readonly status: LeaseStatus;
  readonly createdAt: Date;
  readonly expiresAt?: Date;

  /**
   * Acquire lease
   */
  acquire(options?: LeaseAcquisitionOptions): Promise<LeaseAcquisitionResult>;

  /**
   * Release lease
   */
  release(): Promise<LeaseReleaseResult>;

  /**
   * Renew lease
   */
  renew(durationMs: number): Promise<LeaseRenewalResult>;

  /**
   * Extend lease
   */
  extend(durationMs: number): Promise<LeaseExtensionResult>;

  /**
   * Get lease info
   */
  getLeaseInfo(): LeaseInfo;

  /**
   * Is active
   */
  isActive(): boolean;

  /**
   * Is expired
   */
  isExpired(): boolean;

  /**
   * Get remaining time
   */
  getRemainingTimeMs(): number;
}

/**
 * Lease status
 */
export enum LeaseStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  RELEASED = 'released',
  ERROR = 'error',
}

/**
 * Lease manager options
 */
export interface LeaseManagerOptions {
  readonly resource: string;
  readonly ttlMs?: number;
  readonly renewable?: boolean;
  readonly metadata?: LeaseMetadata;
}

/**
 * Lease metadata
 */
export interface LeaseMetadata {
  readonly leaseType?: string;
  readonly purpose?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Lease acquisition options
 */
export interface LeaseAcquisitionOptions {
  readonly ttlMs?: number;
  readonly renewable?: boolean;
  readonly waitTimeoutMs?: number;
  readonly retryIntervalMs?: number;
  readonly metadata?: LeaseMetadata;
}

/**
 * Lease acquisition result
 */
export interface LeaseAcquisitionResult {
  readonly success: boolean;
  readonly leaseId: string;
  readonly acquiredAt: Date;
  readonly expiresAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Lease release result
 */
export interface LeaseReleaseResult {
  readonly success: boolean;
  readonly releasedAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Lease renewal result
 */
export interface LeaseRenewalResult {
  readonly success: boolean;
  readonly newExpiresAt: Date;
  readonly renewedAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Lease extension result
 */
export interface LeaseExtensionResult {
  readonly success: boolean;
  readonly newExpiresAt: Date;
  readonly extendedAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Lease info
 */
export interface LeaseInfo {
  readonly leaseId: string;
  readonly ownerId: string;
  readonly resource: string;
  readonly status: LeaseStatus;
  readonly createdAt: Date;
  readonly expiresAt?: Date;
  readonly renewable: boolean;
  readonly metadata?: LeaseMetadata;
}

/**
 * Heartbeat coordinator
 * Canonical interface for heartbeat coordination
 */
export interface HeartbeatCoordinator {
  readonly coordinatorId: string;
  readonly ownerId: string;

  /**
   * Register participant
   */
  registerParticipant(participantId: string, options?: ParticipantOptions): Promise<ParticipantRegistrationResult>;

  /**
   * Unregister participant
   */
  unregisterParticipant(participantId: string): Promise<ParticipantUnregistrationResult>;

  /**
   * Send heartbeat
   */
  sendHeartbeat(participantId: string): Promise<HeartbeatResult>;

  /**
   * Get participant status
   */
  getParticipantStatus(participantId: string): ParticipantStatus;

  /**
   * List participants
   */
  listParticipants(): readonly ParticipantStatus[];

  /**
   * Get coordinator info
   */
  getCoordinatorInfo(): CoordinatorInfo;

  /**
   * Check participant health
   */
  checkParticipantHealth(participantId: string): ParticipantHealth;
}

/**
 * Participant options
 */
export interface ParticipantOptions {
  readonly ttlMs?: number;
  readonly metadata?: ParticipantMetadata;
}

/**
 * Participant metadata
 */
export interface ParticipantMetadata {
  readonly participantType?: string;
  readonly capabilities?: readonly string[];
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Participant registration result
 */
export interface ParticipantRegistrationResult {
  readonly success: boolean;
  readonly participantId: string;
  readonly registeredAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Participant unregistration result
 */
export interface ParticipantUnregistrationResult {
  readonly success: boolean;
  readonly unregisteredAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Heartbeat result
 */
export interface HeartbeatResult {
  readonly success: boolean;
  readonly participantId: string;
  readonly heartbeatAt: Date;
  readonly nextHeartbeatAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Participant status
 */
export interface ParticipantStatus {
  readonly participantId: string;
  readonly status: ParticipantState;
  readonly registeredAt: Date;
  readonly lastHeartbeatAt: Date;
  readonly expiresAt: Date;
  readonly metadata?: ParticipantMetadata;
}

/**
 * Participant state
 */
export enum ParticipantState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  ERROR = 'error',
}

/**
 * Participant health
 */
export interface ParticipantHealth {
  readonly healthy: boolean;
  readonly lastHeartbeatAt: Date;
  readonly timeSinceLastHeartbeatMs: number;
  readonly ttlMs: number;
  readonly timeUntilExpiryMs: number;
}

/**
 * Coordinator info
 */
export interface CoordinatorInfo {
  readonly coordinatorId: string;
  readonly ownerId: string;
  readonly participantCount: number;
  readonly activeParticipants: number;
  readonly inactiveParticipants: number;
  readonly createdAt: Date;
}

/**
 * Heartbeat coordinator options
 */
export interface HeartbeatCoordinatorOptions {
  readonly ttlMs?: number;
  readonly heartbeatIntervalMs?: number;
  readonly maxMissedHeartbeats?: number;
}

/**
 * Consensus context
 * Canonical interface for consensus coordination
 */
export interface ConsensusContext {
  readonly contextId: string;
  readonly ownerId: string;
  readonly status: ConsensusStatus;

  /**
   * Propose value
   */
  proposeValue(value: unknown, options?: ProposalOptions): Promise<ProposalResult>;

  /**
   * Accept proposal
   */
  acceptProposal(proposalId: string): Promise<AcceptanceResult>;

  /**
   * Reject proposal
   */
  rejectProposal(proposalId: string, reason?: string): Promise<RejectionResult>;

  /**
   * Get consensus
   */
  getConsensus(): ConsensusResult;

  /**
   * Get context info
   */
  getContextInfo(): ContextInfo;

  /**
   * Is consensus reached
   */
  isConsensusReached(): boolean;
}

/**
 * Consensus status
 */
export enum ConsensusStatus {
  INITIALIZING = 'initializing',
  PROPOSING = 'proposing',
  ACCEPTING = 'accepting',
  REJECTING = 'rejecting',
  CONSENSUS_REACHED = 'consensus_reached',
  FAILED = 'failed',
}

/**
 * Consensus context options
 */
export interface ConsensusContextOptions {
  readonly participants: readonly string[];
  readonly quorum?: number;
  readonly timeoutMs?: number;
  readonly metadata?: ConsensusMetadata;
}

/**
 * Consensus metadata
 */
export interface ConsensusMetadata {
  readonly consensusType?: string;
  readonly purpose?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Proposal options
 */
export interface ProposalOptions {
  readonly ttlMs?: number;
  readonly metadata?: ProposalMetadata;
}

/**
 * Proposal metadata
 */
export interface ProposalMetadata {
  readonly proposerId?: string;
  readonly proposalType?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Proposal result
 */
export interface ProposalResult {
  readonly success: boolean;
  readonly proposalId: string;
  readonly proposedAt: Date;
  readonly expiresAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Acceptance result
 */
export interface AcceptanceResult {
  readonly success: boolean;
  readonly proposalId: string;
  readonly acceptedAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Rejection result
 */
export interface RejectionResult {
  readonly success: boolean;
  readonly proposalId: string;
  readonly rejectedAt: Date;
  readonly reason?: string;
  readonly error?: CoordinationError;
}

/**
 * Consensus result
 */
export interface ConsensusResult {
  readonly reached: boolean;
  readonly value?: unknown;
  readonly proposalId?: string;
  readonly reachedAt?: Date;
  readonly participants: readonly string[];
  readonly acceptCount: number;
  readonly rejectCount: number;
}

/**
 * Context info
 */
export interface ContextInfo {
  readonly contextId: string;
  readonly ownerId: string;
  readonly status: ConsensusStatus;
  readonly participantCount: number;
  readonly quorum: number;
  readonly createdAt: Date;
  readonly metadata?: ConsensusMetadata;
}

/**
 * Lock ownership
 * Canonical interface for lock ownership
 */
export interface LockOwnership {
  readonly lockId: string;
  readonly ownerId: string;
  readonly resource: string;

  /**
   * Transfer ownership
   */
  transferOwnership(newOwnerId: string): Promise<LockTransferResult>;

  /**
   * Validate ownership
   */
  validateOwnership(): LockOwnershipValidationResult;
}

/**
 * Lock transfer result
 */
export interface LockTransferResult {
  readonly success: boolean;
  readonly previousOwnerId: string;
  readonly newOwnerId: string;
  readonly transferredAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Lock ownership validation result
 */
export interface LockOwnershipValidationResult {
  readonly valid: boolean;
  readonly ownerId: string;
  readonly expiresAt?: Date;
  readonly expired: boolean;
}

/**
 * Leader election
 * Canonical interface for leader election
 */
export interface LeaderElection {
  readonly electionId: string;
  readonly participants: readonly string[];
  readonly status: ElectionStatus;

  /**
   * Participate in election
   */
  participate(participantId: string, options?: ElectionOptions): Promise<ElectionParticipationResult>;

  /**
   * Withdraw from election
   */
  withdraw(participantId: string): Promise<ElectionWithdrawalResult>;

  /**
   * Get leader
   */
  getLeader(): string | null;

  /**
   * Is leader
   */
  isLeader(participantId: string): boolean;

  /**
   * Get election info
   */
  getElectionInfo(): ElectionInfo;
}

/**
 * Election status
 */
export enum ElectionStatus {
  INITIALIZING = 'initializing',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Election options
 */
export interface ElectionOptions {
  readonly ttlMs?: number;
  readonly electionTimeoutMs?: number;
  readonly metadata?: ElectionMetadata;
}

/**
 * Election metadata
 */
export interface ElectionMetadata {
  readonly electionType?: string;
  readonly purpose?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Election participation result
 */
export interface ElectionParticipationResult {
  readonly success: boolean;
  readonly participantId: string;
  readonly participatedAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Election withdrawal result
 */
export interface ElectionWithdrawalResult {
  readonly success: boolean;
  readonly participantId: string;
  readonly withdrawnAt: Date;
  readonly error?: CoordinationError;
}

/**
 * Election info
 */
export interface ElectionInfo {
  readonly electionId: string;
  readonly status: ElectionStatus;
  readonly participants: readonly string[];
  readonly leader?: string;
  readonly createdAt: Date;
  readonly completedAt?: Date;
  readonly metadata?: ElectionMetadata;
}

/**
 * Coordination error
 */
export interface CoordinationError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Coordination health status
 */
export interface CoordinationHealthStatus {
  readonly healthy: boolean;
  readonly totalLocks: number;
  readonly activeLocks: number;
  readonly totalLeases: number;
  readonly activeLeases: number;
  readonly totalParticipants: number;
  readonly activeParticipants: number;
  readonly errorCount: number;
  readonly lastError?: CoordinationError;
}

/**
 * Failover coordination
 * Canonical interface for failover coordination
 */
export interface FailoverCoordination {
  readonly coordinationId: string;

  /**
   * Initiate failover
   */
  initiateFailover(
    resourceId: string,
    reason: FailoverReason
  ): Promise<FailoverCoordinationResult>;

  /**
   * Complete failover
   */
  completeFailover(coordinationId: string): Promise<FailoverCoordinationResult>;

  /**
   * Get failover status
   */
  getFailoverStatus(coordinationId: string): FailoverCoordinationStatus;

  /**
   * Get failover candidates
   */
  getFailoverCandidates(resourceId: string): readonly FailoverCandidate[];
}

/**
 * Failover reason
 */
export enum FailoverReason {
  NODE_FAILURE = 'node_failure',
  WORKER_FAILURE = 'worker_failure',
  NETWORK_PARTITION = 'network_partition',
  HIGH_LATENCY = 'high_latency',
  MAINTENANCE = 'maintenance',
  MANUAL = 'manual',
  CUSTOM = 'custom',
}

/**
 * Failover coordination result
 */
export interface FailoverCoordinationResult {
  readonly success: boolean;
  readonly coordinationId: string;
  readonly resourceId: string;
  readonly fromNodeId?: string;
  readonly toNodeId?: string;
  readonly initiatedAt: Date;
  readonly completedAt?: Date;
  readonly error?: CoordinationError;
}

/**
 * Failover coordination status
 */
export interface FailoverCoordinationStatus {
  readonly coordinationId: string;
  readonly status: FailoverState;
  readonly progress: number; // 0-100
  readonly initiatedAt: Date;
  readonly completedAt?: Date;
  readonly error?: CoordinationError;
}

/**
 * Failover state
 */
export enum FailoverState {
  INITIATED = 'initiated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Failover candidate
 */
export interface FailoverCandidate {
  readonly nodeId: string;
  readonly workerId?: string;
  readonly priority: number;
  readonly readiness: ReadinessStatus;
  readonly metadata: CandidateMetadata;
}

/**
 * Readiness status
 */
export enum ReadinessStatus {
  READY = 'ready',
  NOT_READY = 'not_ready',
  DRAINING = 'draining',
}

/**
 * Candidate metadata
 */
export interface CandidateMetadata {
  readonly labels: Record<string, string>;
  readonly annotations: Record<string, unknown>;
  readonly affinityKey?: string;
}

/**
 * CLAUX Runtime Distributed Layer - Types
 * 
 * Core type definitions for distributed runtime coordination.
 * No external dependencies - pure distributed semantics.
 */

/**
 * Execution Identifier (re-exported locally for isolatedModules compliance)
 */
export type ExecutionId = string;

/**
 * Task Identifier (re-exported locally for isolatedModules compliance)
 */
export type TaskId = string;

/**
 * Worker Identifier
 */
export type WorkerId = string;

/**
 * Cluster Identifier
 */
export type ClusterId = string;

/**
 * Partition Identifier
 */
export type PartitionId = string;

/**
 * Lease Identifier
 */
export type LeaseId = string;

/**
 * Epoch Number
 */
export type Epoch = number;

/**
 * Worker Capability
 */
export interface WorkerCapability {
  readonly name: string;
  readonly version: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Worker Resource Capacity
 */
export interface WorkerCapacity {
  readonly cpu: number;
  readonly memory: number;
  readonly concurrency: number;
  readonly bandwidth: number;
}

/**
 * Worker Resource Utilization
 */
export interface WorkerUtilization {
  readonly cpu: number;
  readonly memory: number;
  readonly concurrency: number;
  readonly bandwidth: number;
}

/**
 * Worker Health Status
 */
export enum WorkerHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  DRAINING = 'draining',
  OFFLINE = 'offline',
}

/**
 * Worker State
 */
export enum WorkerState {
  JOINING = 'joining',
  ACTIVE = 'active',
  DRAINING = 'draining',
  LEAVING = 'leaving',
  GONE = 'gone',
}

/**
 * Worker Metadata
 */
export interface WorkerMetadata {
  readonly workerId: WorkerId;
  readonly clusterId: ClusterId;
  readonly hostname: string;
  readonly pid: number;
  readonly startTime: Date;
  readonly capabilities: readonly WorkerCapability[];
  readonly capacity: WorkerCapacity;
}

/**
 * Worker Info
 */
export interface WorkerInfo {
  readonly metadata: WorkerMetadata;
  state: WorkerState;
  health: WorkerHealthStatus;
  utilization: WorkerUtilization;
  lastHeartbeat: Date;
  leaseId?: LeaseId;
  ownedPartitions: PartitionId[];
  ownedExecutions: ExecutionId[];
}

/**
 * Heartbeat Data
 */
export interface HeartbeatData {
  readonly workerId: WorkerId;
  readonly timestamp: Date;
  readonly health: WorkerHealthStatus;
  readonly utilization: WorkerUtilization;
  readonly activeExecutions: number;
  readonly activeTasks: number;
  readonly capabilities: readonly WorkerCapability[];
}

/**
 * Lease State
 */
export enum LeaseState {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRING = 'expiring',
  EXPIRED = 'expired',
  RELEASED = 'released',
  TRANSFERRED = 'transferred',
}

/**
 * Lease Metadata
 */
export interface LeaseMetadata {
  readonly leaseId: LeaseId;
  readonly workerId: WorkerId;
  readonly clusterId: ClusterId;
  readonly issuedAt: Date;
  expiresAt: Date;
  readonly epoch: Epoch;
}

/**
 * Lease Info
 */
export interface LeaseInfo {
  readonly metadata: LeaseMetadata;
  state: LeaseState;
  readonly resource: LeaseResource;
  renewals: number;
  lastRenewed: Date;
}

/**
 * Lease Resource Type
 */
export enum LeaseResourceType {
  WORKER = 'worker',
  PARTITION = 'partition',
  EXECUTION = 'execution',
}

/**
 * Lease Resource
 */
export interface LeaseResource {
  readonly type: LeaseResourceType;
  readonly resourceId: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Ownership Epoch
 */
export interface OwnershipEpoch {
  readonly epoch: Epoch;
  readonly owner: WorkerId;
  readonly timestamp: Date;
  readonly reason: string;
}

/**
 * Ownership Metadata
 */
export interface OwnershipMetadata {
  readonly resourceId: string;
  readonly resourceType: LeaseResourceType;
  owner: WorkerId;
  epoch: Epoch;
  readonly leaseId: LeaseId;
  readonly acquiredAt: Date;
  readonly history: readonly OwnershipEpoch[];
}

/**
 * Ownership Info
 */
export interface OwnershipInfo {
  readonly metadata: OwnershipMetadata;
  readonly leaseInfo: LeaseInfo;
  readonly transferable: boolean;
  readonly replaySafe: boolean;
}

/**
 * Partition Metadata
 */
export interface PartitionMetadata {
  readonly partitionId: PartitionId;
  readonly clusterId: ClusterId;
  readonly keyRange: PartitionKeyRange;
  readonly owner: WorkerId;
  readonly epoch: Epoch;
}

/**
 * Partition Key Range
 */
export interface PartitionKeyRange {
  readonly start: string;
  readonly end: string;
  readonly inclusive: boolean;
}

/**
 * Partition Info
 */
export interface PartitionInfo {
  readonly metadata: PartitionMetadata;
  state: PartitionState;
  ownership: OwnershipInfo;
  executionCount: number;
  lastAssignment: Date;
}

/**
 * Partition State
 */
export enum PartitionState {
  ASSIGNING = 'assigning',
  ASSIGNED = 'assigned',
  REASSIGNING = 'reassigning',
  UNASSIGNED = 'unassigned',
}

/**
 * Execution Routing Metadata
 */
export interface ExecutionRoutingMetadata {
  readonly executionId: ExecutionId;
  readonly partitionId: PartitionId;
  owner: WorkerId;
  epoch: Epoch;
  readonly routedAt: Date;
  routingPath: WorkerId[];
}

/**
 * Execution Routing Info
 */
export interface ExecutionRoutingInfo {
  readonly metadata: ExecutionRoutingMetadata;
  readonly ownership: OwnershipInfo;
  readonly checkpointInfo: ExecutionCheckpointInfo;
  readonly replayInfo: ExecutionReplayInfo;
}

/**
 * Execution Checkpoint Info
 */
export interface ExecutionCheckpointInfo {
  readonly hasCheckpoint: boolean;
  readonly checkpointLocation?: string;
  readonly checkpointTimestamp?: Date;
  readonly checkpointOwner?: WorkerId;
}

/**
 * Execution Replay Info
 */
export interface ExecutionReplayInfo {
  readonly isReplay: boolean;
  readonly originalExecutionId?: ExecutionId;
  readonly replayEpoch?: Epoch;
  readonly replayOwner?: WorkerId;
}

/**
 * Cluster Membership State
 */
export enum ClusterMembershipState {
  FORMING = 'forming',
  STABLE = 'stable',
  DEGRADED = 'degraded',
  RECOVERING = 'recovering',
}

/**
 * Cluster Metadata
 */
export interface ClusterMetadata {
  readonly clusterId: ClusterId;
  readonly formationTime: Date;
  readonly expectedSize: number;
  actualSize: number;
}

/**
 * Cluster Info
 */
export interface ClusterInfo {
  readonly metadata: ClusterMetadata;
  state: ClusterMembershipState;
  members: WorkerId[];
  leader?: WorkerId;
  readonly partitions: readonly PartitionId[];
  topology: ClusterTopology;
}

/**
 * Cluster Topology
 */
export interface ClusterTopology {
  readonly nodes: readonly ClusterNode[];
  readonly edges: readonly ClusterEdge[];
}

/**
 * Cluster Node
 */
export interface ClusterNode {
  readonly workerId: WorkerId;
  readonly role: ClusterRole;
  readonly capabilities: readonly WorkerCapability[];
  readonly connections: readonly WorkerId[];
}

/**
 * Cluster Edge
 */
export interface ClusterEdge {
  readonly from: WorkerId;
  readonly to: WorkerId;
  readonly weight: number;
  readonly latency: number;
}

/**
 * Cluster Role
 */
export enum ClusterRole {
  LEADER = 'leader',
  FOLLOWER = 'follower',
  CANDIDATE = 'candidate',
}

/**
 * Consensus State
 */
export enum ConsensusState {
  SEEKING = 'seeking',
  AGREED = 'agreed',
  DISAGREED = 'disagreed',
  TIMEOUT = 'timeout',
}

/**
 * Consensus Proposal
 */
export interface ConsensusProposal {
  readonly proposalId: string;
  readonly proposer: WorkerId;
  readonly value: unknown;
  readonly epoch: Epoch;
  readonly timestamp: Date;
}

/**
 * Consensus Vote
 */
export interface ConsensusVote {
  readonly proposalId: string;
  readonly voter: WorkerId;
  readonly decision: boolean;
  readonly epoch: Epoch;
  readonly timestamp: Date;
}

/**
 * Consensus Result
 */
export interface ConsensusResult {
  readonly proposal: ConsensusProposal;
  readonly votes: readonly ConsensusVote[];
  readonly state: ConsensusState;
  readonly agreed: boolean;
  readonly timestamp: Date;
}

/**
 * Failover Trigger
 */
export enum FailoverTrigger {
  HEARTBEAT_TIMEOUT = 'heartbeat_timeout',
  LEASE_EXPIRATION = 'lease_expiration',
  WORKER_FAILURE = 'worker_failure',
  MANUAL = 'manual',
  PARTITION = 'partition',
}

/**
 * Failover Metadata
 */
export interface FailoverMetadata {
  readonly failoverId: string;
  readonly trigger: FailoverTrigger;
  readonly sourceWorker: WorkerId;
  readonly targetWorker: WorkerId;
  readonly timestamp: Date;
  readonly reason: string;
}

/**
 * Failover Info
 */
export interface FailoverInfo {
  readonly metadata: FailoverMetadata;
  readonly affectedExecutions: readonly ExecutionId[];
  readonly affectedPartitions: readonly PartitionId[];
  readonly checkpointPreserved: boolean;
  readonly replayPreserved: boolean;
  readonly completed: boolean;
}

/**
 * Load Balancing Strategy
 */
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_LOADED = 'least_loaded',
  CAPABILITY_AWARE = 'capability_aware',
  RESOURCE_AWARE = 'resource_aware',
  LOCALITY_AWARE = 'locality_aware',
}

/**
 * Load Balancing Decision
 */
export interface LoadBalancingDecision {
  readonly targetWorker: WorkerId;
  readonly strategy: LoadBalancingStrategy;
  readonly score: number;
  readonly alternatives: readonly WorkerId[];
  readonly timestamp: Date;
}

/**
 * Distributed Runtime Context
 */
export interface DistributedRuntimeContext {
  readonly clusterId: ClusterId;
  readonly workerId: WorkerId;
  readonly epoch: Epoch;
  readonly startTime: Date;
  readonly metadata: Record<string, unknown>;
}

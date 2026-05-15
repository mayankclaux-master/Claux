/**
 * Runtime Identity Contracts
 * 
 * Foundational contracts for distributed ownership, execution leasing, and worker ownership
 * Supports failover semantics, replay ownership, and execution affinity
 */

/**
 * Runtime identity
 * Canonical interface for runtime identity
 */
export interface RuntimeIdentity {
  readonly identityId: string;
  readonly identityType: IdentityType;
  readonly nodeId: string;
  readonly instanceId: string;
  readonly createdAt: Date;
  readonly expiresAt?: Date;
  readonly metadata: IdentityMetadata;
}

/**
 * Identity type
 */
export enum IdentityType {
  RUNTIME_NODE = 'runtime_node',
  RUNTIME_INSTANCE = 'runtime_instance',
  WORKER_INSTANCE = 'worker_instance',
  EXECUTION_LEASE = 'execution_lease',
  OWNERSHIP_TOKEN = 'ownership_token',
}

/**
 * Identity metadata
 */
export interface IdentityMetadata {
  readonly labels: Record<string, string>;
  readonly annotations: Record<string, unknown>;
  readonly owner?: string;
  readonly affinityKey?: string;
}

/**
 * Runtime node
 * Canonical interface for runtime node
 */
export interface RuntimeNode {
  readonly nodeId: string;
  readonly nodeType: NodeType;
  readonly address: NodeAddress;
  readonly capabilities: NodeCapabilities;
  readonly status: NodeStatus;
  readonly metadata: NodeMetadata;
  readonly createdAt: Date;
  readonly lastHeartbeatAt: Date;
}

/**
 * Node type
 */
export enum NodeType {
  WORKER = 'worker',
  SCHEDULER = 'scheduler',
  COORDINATOR = 'coordinator',
  GATEWAY = 'gateway',
  CUSTOM = 'custom',
}

/**
 * Node address
 */
export interface NodeAddress {
  readonly host: string;
  readonly port: number;
  readonly protocol: string;
  readonly path?: string;
}

/**
 * Node capabilities
 */
export interface NodeCapabilities {
  readonly supportedExecutionTypes: readonly ExecutionType[];
  readonly resourceLimits: ResourceLimits;
  readonly features: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Execution type
 */
export enum ExecutionType {
  AI_AGENT = 'ai_agent',
  WORKFLOW = 'workflow',
  DAG = 'dag',
  TASK = 'task',
  CUSTOM = 'custom',
}

/**
 * Resource limits
 */
export interface ResourceLimits {
  readonly cpuCores?: number;
  readonly memoryMB?: number;
  readonly gpuCount?: number;
  readonly maxConcurrentExecutions?: number;
}

/**
 * Node status
 */
export enum NodeStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  BUSY = 'busy',
  DRAINING = 'draining',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error',
}

/**
 * Node metadata
 */
export interface NodeMetadata {
  readonly labels: Record<string, string>;
  readonly annotations: Record<string, unknown>;
  readonly version: string;
  readonly region?: string;
  readonly zone?: string;
}

/**
 * Runtime instance
 * Canonical interface for runtime instance
 */
export interface RuntimeInstance {
  readonly instanceId: string;
  readonly nodeId: string;
  readonly instanceType: InstanceType;
  readonly configuration: InstanceConfiguration;
  readonly status: InstanceStatus;
  readonly metadata: InstanceMetadata;
  readonly createdAt: Date;
  readonly startedAt?: Date;
  readonly shutdownAt?: Date;
}

/**
 * Instance type
 */
export enum InstanceType {
  PRIMARY = 'primary',
  REPLICA = 'replica',
  STANDBY = 'standby',
  CANARY = 'canary',
  CUSTOM = 'custom',
}

/**
 * Instance configuration
 */
export interface InstanceConfiguration {
  readonly runtimeVersion: string;
  readonly featureFlags: Record<string, boolean>;
  readonly environment: string;
  readonly customConfig?: Record<string, unknown>;
}

/**
 * Instance status
 */
export enum InstanceStatus {
  INITIALIZING = 'initializing',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Instance metadata
 */
export interface InstanceMetadata {
  readonly labels: Record<string, string>;
  readonly annotations: Record<string, unknown>;
  readonly deploymentId?: string;
  readonly releaseId?: string;
}

/**
 * Worker instance
 * Canonical interface for worker instance
 */
export interface WorkerInstance {
  readonly workerId: string;
  readonly nodeId: string;
  readonly instanceId: string;
  readonly workerType: WorkerType;
  readonly capabilities: WorkerCapabilities;
  readonly status: WorkerStatus;
  readonly metadata: WorkerMetadata;
  readonly createdAt: Date;
  readonly lastHeartbeatAt: Date;
}

/**
 * Worker type
 */
export enum WorkerType {
  AI_AGENT_WORKER = 'ai_agent_worker',
  WORKFLOW_WORKER = 'workflow_worker',
  DAG_WORKER = 'dag_worker',
  TASK_WORKER = 'task_worker',
  CUSTOM_WORKER = 'custom_worker',
}

/**
 * Worker capabilities
 */
export interface WorkerCapabilities {
  readonly supportedTaskTypes: readonly TaskType[];
  readonly resourceLimits: ResourceLimits;
  readonly features: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Task type
 */
export enum TaskType {
  AI_INFERENCE = 'ai_inference',
  DATA_PROCESSING = 'data_processing',
  TRANSFORMATION = 'transformation',
  VALIDATION = 'validation',
  CUSTOM = 'custom',
}

/**
 * Worker status
 */
export enum WorkerStatus {
  INITIALIZING = 'initializing',
  IDLE = 'idle',
  BUSY = 'busy',
  PAUSED = 'paused',
  DRAINING = 'draining',
  ERROR = 'error',
}

/**
 * Worker metadata
 */
export interface WorkerMetadata {
  readonly labels: Record<string, string>;
  readonly annotations: Record<string, unknown>;
  readonly affinityKey?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Execution lease
 * Canonical interface for execution leasing
 */
export interface ExecutionLease {
  readonly leaseId: string;
  readonly executionId: string;
  readonly workerId: string;
  readonly nodeId: string;
  readonly leasedAt: Date;
  readonly leaseExpiresAt: Date;
  readonly leaseDurationMs: number;
  readonly leaseCount: number;
  readonly renewable: boolean;
  readonly metadata: LeaseMetadata;
}

/**
 * Lease metadata
 */
export interface LeaseMetadata {
  readonly leaseType: LeaseType;
  readonly priority: LeasePriority;
  readonly affinityKey?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Lease type
 */
export enum LeaseType {
  EXCLUSIVE = 'exclusive',
  SHARED = 'shared',
  READ_ONLY = 'read_only',
  CUSTOM = 'custom',
}

/**
 * Lease priority
 */
export enum LeasePriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

/**
 * Ownership token
 * Canonical interface for ownership token
 */
export interface OwnershipToken {
  readonly tokenId: string;
  readonly ownerId: string;
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  readonly grantedAt: Date;
  readonly expiresAt: Date;
  readonly durationMs: number;
  readonly renewable: boolean;
  readonly metadata: OwnershipMetadata;
}

/**
 * Resource type
 */
export enum ResourceType {
  EXECUTION = 'execution',
  WORKER = 'worker',
  NODE = 'node',
  QUEUE = 'queue',
  STREAM = 'stream',
  CUSTOM = 'custom',
}

/**
 * Ownership metadata
 */
export interface OwnershipMetadata {
  readonly ownershipType: OwnershipType;
  readonly transferable: boolean;
  readonly revocable: boolean;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Ownership type
 */
export enum OwnershipType {
  EXCLUSIVE = 'exclusive',
  SHARED = 'shared',
  LEASED = 'leased',
  DELEGATED = 'delegated',
}

/**
 * Distributed ownership
 * Canonical interface for distributed ownership
 */
export interface DistributedOwnership {
  readonly ownershipId: string;
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  readonly ownerId: string;
  readonly ownershipType: OwnershipType;
  readonly grantedAt: Date;
  readonly expiresAt?: Date;
  readonly metadata: OwnershipMetadata;

  /**
   * Transfer ownership
   */
  transferOwnership(newOwnerId: string): Promise<OwnershipTransferResult>;

  /**
   * Release ownership
   */
  releaseOwnership(): Promise<OwnershipReleaseResult>;

  /**
   * Renew ownership
   */
  renewOwnership(durationMs: number): Promise<OwnershipRenewResult>;

  /**
   * Validate ownership
   */
  validateOwnership(): OwnershipValidationResult;
}

/**
 * Ownership transfer result
 */
export interface OwnershipTransferResult {
  readonly success: boolean;
  readonly previousOwnerId: string;
  readonly newOwnerId: string;
  readonly transferredAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Ownership release result
 */
export interface OwnershipReleaseResult {
  readonly success: boolean;
  readonly releasedAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Ownership renew result
 */
export interface OwnershipRenewResult {
  readonly success: boolean;
  readonly newExpiresAt: Date;
  readonly renewedAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Ownership validation result
 */
export interface OwnershipValidationResult {
  readonly valid: boolean;
  readonly ownerId: string;
  readonly expiresAt?: Date;
  readonly expired: boolean;
  readonly revocable: boolean;
}

/**
 * Ownership error
 */
export interface OwnershipError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Execution leasing
 * Canonical interface for execution leasing
 */
export interface ExecutionLeasing {
  readonly leasingId: string;

  /**
   * Acquire lease
   */
  acquireLease(
    executionId: string,
    workerId: string,
    options?: LeaseAcquisitionOptions
  ): Promise<LeaseAcquisitionResult>;

  /**
   * Renew lease
   */
  renewLease(
    leaseId: string,
    durationMs: number
  ): Promise<LeaseRenewalResult>;

  /**
   * Release lease
   */
  releaseLease(leaseId: string): Promise<LeaseReleaseResult>;

  /**
   * Transfer lease
   */
  transferLease(
    leaseId: string,
    newWorkerId: string
  ): Promise<LeaseTransferResult>;

  /**
   * Get lease
   */
  getLease(leaseId: string): ExecutionLease | null;

  /**
   * Get active leases
   */
  getActiveLeases(workerId: string): readonly ExecutionLease[];

  /**
   * Validate lease
   */
  validateLease(leaseId: string): LeaseValidationResult;
}

/**
 * Lease acquisition options
 */
export interface LeaseAcquisitionOptions {
  readonly leaseDurationMs?: number;
  readonly renewable?: boolean;
  readonly leaseType?: LeaseType;
  readonly priority?: LeasePriority;
  readonly affinityKey?: string;
  readonly metadata?: LeaseMetadata;
}

/**
 * Lease acquisition result
 */
export interface LeaseAcquisitionResult {
  readonly success: boolean;
  readonly lease?: ExecutionLease;
  readonly acquiredAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Lease renewal result
 */
export interface LeaseRenewalResult {
  readonly success: boolean;
  readonly lease?: ExecutionLease;
  readonly renewedAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Lease release result
 */
export interface LeaseReleaseResult {
  readonly success: boolean;
  readonly releasedAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Lease transfer result
 */
export interface LeaseTransferResult {
  readonly success: boolean;
  readonly lease?: ExecutionLease;
  readonly transferredAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Lease validation result
 */
export interface LeaseValidationResult {
  readonly valid: boolean;
  readonly leaseId: string;
  readonly workerId: string;
  readonly expiresAt: Date;
  readonly expired: boolean;
  readonly renewable: boolean;
}

/**
 * Worker ownership
 * Canonical interface for worker ownership
 */
export interface WorkerOwnership {
  readonly ownershipId: string;

  /**
   * Acquire worker ownership
   */
  acquireOwnership(
    workerId: string,
    ownerId: string,
    options?: WorkerOwnershipOptions
  ): Promise<WorkerOwnershipAcquisitionResult>;

  /**
   * Release worker ownership
   */
  releaseOwnership(workerId: string): Promise<WorkerOwnershipReleaseResult>;

  /**
   * Transfer worker ownership
   */
  transferOwnership(
    workerId: string,
    newOwnerId: string
  ): Promise<WorkerOwnershipTransferResult>;

  /**
   * Get worker owner
   */
  getWorkerOwner(workerId: string): string | null;

  /**
   * Validate ownership
   */
  validateOwnership(workerId: string, ownerId: string): WorkerOwnershipValidationResult;
}

/**
 * Worker ownership options
 */
export interface WorkerOwnershipOptions {
  readonly ownershipType?: OwnershipType;
  readonly transferable?: boolean;
  readonly revocable?: boolean;
  readonly durationMs?: number;
  readonly metadata?: OwnershipMetadata;
}

/**
 * Worker ownership acquisition result
 */
export interface WorkerOwnershipAcquisitionResult {
  readonly success: boolean;
  readonly token?: OwnershipToken;
  readonly acquiredAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Worker ownership release result
 */
export interface WorkerOwnershipReleaseResult {
  readonly success: boolean;
  readonly releasedAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Worker ownership transfer result
 */
export interface WorkerOwnershipTransferResult {
  readonly success: boolean;
  readonly transferredAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Worker ownership validation result
 */
export interface WorkerOwnershipValidationResult {
  readonly valid: boolean;
  readonly workerId: string;
  readonly ownerId: string;
  readonly expiresAt?: Date;
  readonly expired: boolean;
}

/**
 * Failover semantics
 * Canonical interface for failover
 */
export interface FailoverSemantics {
  readonly failoverId: string;

  /**
   * Initiate failover
   */
  initiateFailover(
    resourceId: string,
    reason: FailoverReason
  ): Promise<FailoverResult>;

  /**
   * Complete failover
   */
  completeFailover(failoverId: string): Promise<FailoverResult>;

  /**
   * Get failover status
   */
  getFailoverStatus(failoverId: string): FailoverStatus;

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
 * Failover result
 */
export interface FailoverResult {
  readonly success: boolean;
  readonly failoverId: string;
  readonly resourceId: string;
  readonly fromNodeId?: string;
  readonly toNodeId?: string;
  readonly initiatedAt: Date;
  readonly completedAt?: Date;
  readonly error?: OwnershipError;
}

/**
 * Failover status
 */
export interface FailoverStatus {
  readonly failoverId: string;
  readonly status: FailoverState;
  readonly progress: number; // 0-100
  readonly initiatedAt: Date;
  readonly completedAt?: Date;
  readonly error?: OwnershipError;
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

/**
 * Replay ownership
 * Canonical interface for replay ownership
 */
export interface ReplayOwnership {
  readonly ownershipId: string;

  /**
   * Acquire replay ownership
   */
  acquireReplayOwnership(
    executionId: string,
    ownerId: string,
    options?: ReplayOwnershipOptions
  ): Promise<ReplayOwnershipAcquisitionResult>;

  /**
   * Release replay ownership
   */
  releaseReplayOwnership(executionId: string): Promise<ReplayOwnershipReleaseResult>;

  /**
   * Validate replay ownership
   */
  validateReplayOwnership(executionId: string, ownerId: string): ReplayOwnershipValidationResult;

  /**
   * Get replay owner
   */
  getReplayOwner(executionId: string): string | null;
}

/**
 * Replay ownership options
 */
export interface ReplayOwnershipOptions {
  readonly exclusive?: boolean;
  readonly durationMs?: number;
  readonly deterministicSeed?: string;
  readonly metadata?: OwnershipMetadata;
}

/**
 * Replay ownership acquisition result
 */
export interface ReplayOwnershipAcquisitionResult {
  readonly success: boolean;
  readonly token?: OwnershipToken;
  readonly acquiredAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Replay ownership release result
 */
export interface ReplayOwnershipReleaseResult {
  readonly success: boolean;
  readonly releasedAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Replay ownership validation result
 */
export interface ReplayOwnershipValidationResult {
  readonly valid: boolean;
  readonly executionId: string;
  readonly ownerId: string;
  readonly exclusive: boolean;
  readonly expiresAt?: Date;
  readonly expired: boolean;
}

/**
 * Execution affinity
 * Canonical interface for execution affinity
 */
export interface ExecutionAffinity {
  readonly affinityId: string;

  /**
   * Set affinity
   */
  setAffinity(
    executionId: string,
    affinityKey: string,
    options?: AffinityOptions
  ): Promise<AffinityResult>;

  /**
   * Get affinity
   */
  getAffinity(executionId: string): AffinityRule | null;

  /**
   * Remove affinity
   */
  removeAffinity(executionId: string): Promise<AffinityResult>;

  /**
   * Resolve affinity
   */
  resolveAffinity(
    affinityKey: string,
    availableNodes: readonly RuntimeNode[]
  ): RuntimeNode | null;
}

/**
 * Affinity options
 */
export interface AffinityOptions {
  readonly affinityType: AffinityType;
  readonly strict?: boolean;
  readonly priority?: number;
  readonly ttlMs?: number;
}

/**
 * Affinity type
 */
export enum AffinityType {
  NODE_AFFINITY = 'node_affinity',
  WORKER_AFFINITY = 'worker_affinity',
  REGION_AFFINITY = 'region_affinity',
  CUSTOM_AFFINITY = 'custom_affinity',
}

/**
 * Affinity result
 */
export interface AffinityResult {
  readonly success: boolean;
  readonly executionId: string;
  readonly affinityKey: string;
  readonly setAt: Date;
  readonly error?: OwnershipError;
}

/**
 * Affinity rule
 */
export interface AffinityRule {
  readonly executionId: string;
  readonly affinityKey: string;
  readonly affinityType: AffinityType;
  readonly strict: boolean;
  readonly priority: number;
  readonly createdAt: Date;
  readonly expiresAt?: Date;
}

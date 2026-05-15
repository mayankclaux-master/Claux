/**
 * Worker Runtime Adapter Contracts
 * 
 * Pure abstractions for worker runtime
 * No Kubernetes/Docker/serverless coupling
 */

import type { AdapterId, ProviderId } from '../types';

/**
 * Worker runtime adapter
 * Canonical interface for worker runtime operations
 */
export interface WorkerRuntimeAdapter {
  readonly adapterId: AdapterId;
  readonly providerType: string;
  readonly capabilities: WorkerRuntimeCapabilities;

  /**
   * Initialize adapter
   */
  initialize(config: WorkerRuntimeAdapterConfig): Promise<void>;

  /**
   * Create worker host
   */
  createWorkerHost(hostId: string, config: WorkerHostConfig): Promise<WorkerHost>;

  /**
   * Get worker host
   */
  getWorkerHost(hostId: string): Promise<WorkerHost | null>;

  /**
   * List worker hosts
   */
  listWorkerHosts(filter?: WorkerHostFilter): Promise<readonly WorkerHost[]>;

  /**
   * Delete worker host
   */
  deleteWorkerHost(hostId: string): Promise<void>;

  /**
   * Acquire worker lease
   */
  acquireWorkerLease(
    workerId: string,
    options?: LeaseOptions
  ): Promise<WorkerLease>;

  /**
   * Renew worker lease
   */
  renewWorkerLease(leaseId: string): Promise<WorkerLease>;

  /**
   * Release worker lease
   */
  releaseWorkerLease(leaseId: string): Promise<void>;

  /**
   * Send heartbeat
   */
  sendHeartbeat(workerId: string): Promise<HeartbeatResult>;

  /**
   * Health check
   */
  healthCheck(): Promise<WorkerRuntimeHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Worker host
 */
export interface WorkerHost {
  readonly hostId: string;
  readonly hostType: WorkerHostType;
  readonly createdAt: Date;
  readonly status: WorkerHostStatus;
  readonly config: WorkerHostConfig;
  readonly metadata: WorkerHostMetadata;
}

/**
 * Worker host type
 */
export enum WorkerHostType {
  KUBERNETES = 'kubernetes',
  DOCKER = 'docker',
  SERVERLESS = 'serverless',
  LOCAL = 'local',
  CUSTOM = 'custom',
}

/**
 * Worker host status
 */
export enum WorkerHostStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  BUSY = 'busy',
  DRAINING = 'draining',
  SHUTTING_DOWN = 'shutting_down',
  ERROR = 'error',
}

/**
 * Worker host config
 */
export interface WorkerHostConfig {
  readonly isolationMode: WorkerIsolationMode;
  readonly resourceLimits: WorkerResourceLimits;
  readonly networkConfig: NetworkConfig;
  readonly storageConfig: StorageConfig;
  readonly checkpointConfig: CheckpointConfig;
}

/**
 * Worker isolation mode
 */
export enum WorkerIsolationMode {
  PROCESS = 'process',
  CONTAINER = 'container',
  VM = 'vm',
  SANDBOX = 'sandbox',
  SHARED = 'shared',
}

/**
 * Worker resource limits
 */
export interface WorkerResourceLimits {
  readonly cpuCores?: number;
  readonly memoryMB?: number;
  readonly storageGB?: number;
  readonly timeoutMs?: number;
  readonly maxConcurrentTasks?: number;
}

/**
 * Network config
 */
export interface NetworkConfig {
  readonly outboundEnabled?: boolean;
  readonly allowedHosts?: readonly string[];
  readonly allowedPorts?: readonly number[];
}

/**
 * Storage config
 */
export interface StorageConfig {
  readonly ephemeralStorageMB?: number;
  readonly persistentStorageEnabled?: boolean;
  readonly storageMounts?: readonly StorageMount[];
}

/**
 * Storage mount
 */
export interface StorageMount {
  readonly mountPath: string;
  readonly source: string;
  readonly readOnly?: boolean;
}

/**
 * Checkpoint config
 */
export interface CheckpointConfig {
  readonly enabled: boolean;
  readonly checkpointIntervalMs?: number;
  readonly checkpointOnFailure?: boolean;
}

/**
 * Worker host metadata
 */
export interface WorkerHostMetadata {
  readonly labels: Record<string, string>;
  readonly annotations: Record<string, string>;
  readonly affinity?: WorkerAffinity;
}

/**
 * Worker affinity
 */
export interface WorkerAffinity {
  readonly nodeAffinity?: NodeAffinity;
  readonly podAffinity?: PodAffinity;
  readonly customAffinity?: Record<string, unknown>;
}

/**
 * Node affinity
 */
export interface NodeAffinity {
  readonly required?: readonly NodeSelectorTerm[];
  readonly preferred?: readonly PreferredSchedulingTerm[];
}

/**
 * Node selector term
 */
export interface NodeSelectorTerm {
  readonly matchExpressions?: readonly NodeSelectorRequirement[];
}

/**
 * Node selector requirement
 */
export interface NodeSelectorRequirement {
  readonly key: string;
  readonly operator: NodeSelectorOperator;
  readonly values?: readonly string[];
}

/**
 * Node selector operator
 */
export enum NodeSelectorOperator {
  IN = 'In',
  NOT_IN = 'NotIn',
  EXISTS = 'Exists',
  DOES_NOT_EXIST = 'DoesNotExist',
  GT = 'Gt',
  LT = 'Lt',
}

/**
 * Preferred scheduling term
 */
export interface PreferredSchedulingTerm {
  readonly weight: number;
  readonly preference: NodeSelectorTerm;
}

/**
 * Pod affinity
 */
export interface PodAffinity {
  readonly required?: readonly PodAffinityTerm[];
  readonly preferred?: readonly WeightedPodAffinityTerm[];
}

/**
 * Pod affinity term
 */
export interface PodAffinityTerm {
  readonly labelSelector: LabelSelector;
  readonly topologyKey: string;
}

/**
 * Label selector
 */
export interface LabelSelector {
  readonly matchLabels?: Record<string, string>;
  readonly matchExpressions?: readonly LabelSelectorRequirement[];
}

/**
 * Label selector requirement
 */
export interface LabelSelectorRequirement {
  readonly key: string;
  readonly operator: LabelSelectorOperator;
  readonly values?: readonly string[];
}

/**
 * Label selector operator
 */
export enum LabelSelectorOperator {
  IN = 'In',
  NOT_IN = 'NotIn',
  EXISTS = 'Exists',
  DOES_NOT_EXIST = 'DoesNotExist',
}

/**
 * Weighted pod affinity term
 */
export interface WeightedPodAffinityTerm {
  readonly weight: number;
  readonly podAffinityTerm: PodAffinityTerm;
}

/**
 * Worker lease
 */
export interface WorkerLease {
  readonly leaseId: string;
  readonly workerId: string;
  readonly hostId: string;
  readonly leasedAt: Date;
  readonly leaseExpiresAt: Date;
  readonly leaseDurationMs: number;
  readonly leaseCount: number;
  readonly metadata: LeaseMetadata;
}

/**
 * Lease metadata
 */
export interface LeaseMetadata {
  readonly executionId?: string;
  readonly taskId?: string;
  readonly affinityKey?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Lease options
 */
export interface LeaseOptions {
  readonly leaseDurationMs?: number;
  readonly renewable?: boolean;
  readonly metadata?: LeaseMetadata;
}

/**
 * Heartbeat result
 */
export interface HeartbeatResult {
  readonly success: boolean;
  readonly timestamp: Date;
  readonly nextHeartbeatAt: Date;
  readonly error?: WorkerRuntimeError;
}

/**
 * Worker runtime error
 */
export interface WorkerRuntimeError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Worker lifecycle
 */
export interface WorkerLifecycle {
  readonly workerId: string;
  readonly status: WorkerStatus;
  readonly startedAt?: Date;
  readonly readyAt?: Date;
  readonly shutdownAt?: Date;
  readonly errorCount: number;
}

/**
 * Worker status
 */
export enum WorkerStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  DRAINING = 'draining',
  SHUTTING_DOWN = 'shutting_down',
  TERMINATED = 'terminated',
  ERROR = 'error',
}

/**
 * Worker runtime capabilities
 */
export interface WorkerRuntimeCapabilities {
  readonly supportedHostTypes: readonly WorkerHostType[];
  readonly supportedIsolationModes: readonly WorkerIsolationMode[];
  readonly supportsLeasing: boolean;
  readonly supportsHeartbeats: boolean;
  readonly supportsAffinity: boolean;
  readonly supportsCheckpointing: boolean;
  readonly supportsGracefulShutdown: boolean;
  readonly supportsResourceLimits: boolean;
  readonly maxConcurrentWorkers?: number;
  readonly maxLeaseDurationMs?: number;
}

/**
 * Worker runtime adapter config
 */
export interface WorkerRuntimeAdapterConfig {
  readonly hostConfig: HostConfig;
  readonly leaseConfig: LeaseConfig;
  readonly heartbeatConfig: HeartbeatConfig;
  readonly lifecycleConfig: LifecycleConfig;
}

/**
 * Host config
 */
export interface HostConfig {
  readonly defaultHostType: WorkerHostType;
  readonly defaultIsolationMode: WorkerIsolationMode;
  readonly defaultResourceLimits: WorkerResourceLimits;
}

/**
 * Lease config
 */
export interface LeaseConfig {
  readonly defaultLeaseDurationMs: number;
  readonly leaseRenewalThresholdMs: number;
  readonly maxLeaseRenewals: number;
}

/**
 * Heartbeat config
 */
export interface HeartbeatConfig {
  readonly intervalMs: number;
  readonly timeoutMs: number;
  readonly maxMissedHeartbeats: number;
}

/**
 * Lifecycle config
 */
export interface LifecycleConfig {
  readonly gracefulShutdownTimeoutMs: number;
  readonly forceShutdownTimeoutMs: number;
  readonly drainTimeoutMs: number;
}

/**
 * Worker host filter
 */
export interface WorkerHostFilter {
  readonly hostType?: WorkerHostType;
  readonly status?: WorkerHostStatus;
  readonly labels?: Record<string, string>;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Worker runtime health status
 */
export interface WorkerRuntimeHealthStatus {
  readonly healthy: boolean;
  readonly totalHosts: number;
  readonly readyHosts: number;
  readonly activeLeases: number;
  readonly heartbeatsPerMinute: number;
  readonly errorCount: number;
  readonly lastError?: WorkerRuntimeError;
}

/**
 * Worker provider
 * Canonical interface for worker provider implementation
 */
export interface WorkerProvider {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;

  /**
   * Create adapter
   */
  createAdapter(config: WorkerRuntimeAdapterConfig): WorkerRuntimeAdapter;

  /**
   * Validate config
   */
  validateConfig(config: WorkerRuntimeAdapterConfig): Promise<WorkerConfigValidationResult>;

  /**
   * Get capabilities
   */
  getCapabilities(): WorkerRuntimeCapabilities;

  /**
   * Get provider metadata
   */
  getMetadata(): WorkerProviderMetadata;
}

/**
 * Worker config validation result
 */
export interface WorkerConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Worker provider metadata
 */
export interface WorkerProviderMetadata {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Checkpoint-aware worker
 * Canonical interface for checkpoint-aware workers
 */
export interface CheckpointAwareWorker {
  readonly workerId: string;

  /**
   * Create checkpoint
   */
  createCheckpoint(): Promise<WorkerCheckpoint>;

  /**
   * Restore from checkpoint
   */
  restoreFromCheckpoint(checkpointId: string): Promise<WorkerCheckpoint>;

  /**
   * List checkpoints
   */
  listCheckpoints(): Promise<readonly WorkerCheckpoint[]>;

  /**
   * Delete checkpoint
   */
  deleteCheckpoint(checkpointId: string): Promise<void>;
}

/**
 * Worker checkpoint
 */
export interface WorkerCheckpoint {
  readonly checkpointId: string;
  readonly workerId: string;
  readonly executionId?: string;
  readonly state: WorkerState;
  readonly createdAt: Date;
}

/**
 * Worker state
 */
export interface WorkerState {
  readonly variables: Record<string, unknown>;
  readonly stackTrace?: string;
  readonly customState?: Record<string, unknown>;
}

/**
 * Graceful shutdown
 * Canonical interface for graceful shutdown
 */
export interface GracefulShutdown {
  readonly workerId: string;

  /**
   * Initiate graceful shutdown
   */
  initiateShutdown(options?: ShutdownOptions): Promise<ShutdownResult>;

  /**
   * Cancel shutdown
   */
  cancelShutdown(): Promise<void>;

  /**
   * Get shutdown status
   */
  getShutdownStatus(): ShutdownStatus;
}

/**
 * Shutdown options
 */
export interface ShutdownOptions {
  readonly timeoutMs?: number;
  readonly drainTasks?: boolean;
  readonly forceAfterTimeout?: boolean;
}

/**
 * Shutdown result
 */
export interface ShutdownResult {
  readonly success: boolean;
  readonly shutdownAt: Date;
  readonly tasksDrained: number;
  readonly tasksForced: number;
  readonly error?: WorkerRuntimeError;
}

/**
 * Shutdown status
 */
export interface ShutdownStatus {
  readonly status: ShutdownState;
  readonly initiatedAt?: Date;
  readonly completedAt?: Date;
  readonly timeoutAt?: Date;
}

/**
 * Shutdown state
 */
export enum ShutdownState {
  NOT_INITIATED = 'not_initiated',
  INITIATED = 'initiated',
  DRAINING = 'draining',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  ERROR = 'error',
}

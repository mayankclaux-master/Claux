/**
 * Scheduling Adapter Contracts
 * 
 * Pure abstractions for scheduling systems
 * No cron/Temporal/Airflow dependencies
 */

import type { AdapterId, ProviderId } from '../types';

/**
 * Scheduling adapter
 * Canonical interface for scheduling operations
 */
export interface SchedulingAdapter {
  readonly adapterId: AdapterId;
  readonly providerType: string;
  readonly capabilities: SchedulingCapabilities;

  /**
   * Initialize adapter
   */
  initialize(config: SchedulingAdapterConfig): Promise<void>;

  /**
   * Create schedule
   */
  createSchedule(schedule: RuntimeSchedule): Promise<ScheduleResult>;

  /**
   * Update schedule
   */
  updateSchedule(scheduleId: string, updates: ScheduleUpdate): Promise<ScheduleResult>;

  /**
   * Delete schedule
   */
  deleteSchedule(scheduleId: string): Promise<void>;

  /**
   * Get schedule
   */
  getSchedule(scheduleId: string): Promise<RuntimeSchedule | null>;

  /**
   * List schedules
   */
  listSchedules(filter?: ScheduleFilter): Promise<readonly RuntimeSchedule[]>;

  /**
   * Acquire scheduling lease
   */
  acquireSchedulingLease(
    scheduleId: string,
    options?: LeaseOptions
  ): Promise<SchedulingLease>;

  /**
   * Renew scheduling lease
   */
  renewSchedulingLease(leaseId: string): Promise<SchedulingLease>;

  /**
   * Release scheduling lease
   */
  releaseSchedulingLease(leaseId: string): Promise<void>;

  /**
   * Make scheduling decision
   */
  makeSchedulingDecision(
    context: SchedulingContext
  ): Promise<SchedulingDecision>;

  /**
   * Get scheduling topology
   */
  getSchedulingTopology(): Promise<SchedulingTopology>;

  /**
   * Health check
   */
  healthCheck(): Promise<SchedulingHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Runtime schedule
 */
export interface RuntimeSchedule {
  readonly scheduleId: string;
  readonly scheduleType: ScheduleType;
  readonly scheduleExpression: ScheduleExpression;
  readonly schedulingPolicy: SchedulingPolicy;
  readonly metadata: ScheduleMetadata;
  readonly constraints: SchedulingConstraints;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Schedule type
 */
export enum ScheduleType {
  CRON = 'cron',
  INTERVAL = 'interval',
  DELAYED = 'delayed',
  ONE_TIME = 'one_time',
  EVENT_DRIVEN = 'event_driven',
  CUSTOM = 'custom',
}

/**
 * Schedule expression
 */
export interface ScheduleExpression {
  readonly type: ScheduleType;
  readonly expression: string;
  readonly timezone?: string;
}

/**
 * Scheduling policy
 */
export enum SchedulingPolicy {
  FIFO = 'fifo',
  PRIORITY = 'priority',
  FAIR_SHARE = 'fair_share',
  DEADLINE_AWARE = 'deadline_aware',
  TOPOLOGY_AWARE = 'topology_aware',
  CUSTOM = 'custom',
}

/**
 * Schedule metadata
 */
export interface ScheduleMetadata {
  readonly name?: string;
  readonly description?: string;
  readonly labels: Record<string, string>;
  readonly annotations: Record<string, unknown>;
  readonly priority?: number;
  readonly deadline?: Date;
}

/**
 * Scheduling constraints
 */
export interface SchedulingConstraints {
  readonly resourceConstraints?: ResourceConstraints;
  readonly affinityConstraints?: AffinityConstraints;
  readonly concurrencyConstraints?: ConcurrencyConstraints;
  readonly timeConstraints?: TimeConstraints;
}

/**
 * Resource constraints
 */
export interface ResourceConstraints {
  readonly cpuCores?: number;
  readonly memoryMB?: number;
  readonly gpuCount?: number;
}

/**
 * Affinity constraints
 */
export interface AffinityConstraints {
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
 * Concurrency constraints
 */
export interface ConcurrencyConstraints {
  readonly maxConcurrent?: number;
  readonly perKey?: string;
}

/**
 * Time constraints
 */
export interface TimeConstraints {
  readonly windowStart?: string;
  readonly windowEnd?: string;
  readonly timezone?: string;
}

/**
 * Schedule result
 */
export interface ScheduleResult {
  readonly scheduleId: string;
  readonly success: boolean;
  readonly scheduledAt: Date;
  readonly nextExecutionAt?: Date;
  readonly error?: SchedulingError;
}

/**
 * Scheduling error
 */
export interface SchedulingError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Schedule update
 */
export interface ScheduleUpdate {
  readonly scheduleExpression?: ScheduleExpression;
  readonly schedulingPolicy?: SchedulingPolicy;
  readonly metadata?: Partial<ScheduleMetadata>;
  readonly constraints?: Partial<SchedulingConstraints>;
}

/**
 * Schedule filter
 */
export interface ScheduleFilter {
  readonly scheduleType?: ScheduleType;
  readonly schedulingPolicy?: SchedulingPolicy;
  readonly labels?: Record<string, string>;
  readonly active?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Scheduling lease
 */
export interface SchedulingLease {
  readonly leaseId: string;
  readonly scheduleId: string;
  readonly executionId?: string;
  readonly leasedAt: Date;
  readonly leaseExpiresAt: Date;
  readonly leaseDurationMs: number;
  readonly leaseCount: number;
}

/**
 * Lease options
 */
export interface LeaseOptions {
  readonly leaseDurationMs?: number;
  readonly renewable?: boolean;
  readonly executionId?: string;
}

/**
 * Scheduling context
 */
export interface SchedulingContext {
  readonly scheduleId: string;
  readonly currentTime: Date;
  readonly availableResources: ResourceConstraints;
  readonly activeLeases: readonly SchedulingLease[];
  readonly topology: SchedulingTopology;
}

/**
 * Scheduling decision
 */
export interface SchedulingDecision {
  readonly scheduleId: string;
  readonly executionId: string;
  readonly decision: DecisionType;
  readonly scheduledAt: Date;
  readonly executionAt: Date;
  readonly assignedWorker?: string;
  readonly assignedTopology?: string;
  readonly priority?: number;
  readonly estimatedDurationMs?: number;
}

/**
 * Decision type
 */
export enum DecisionType {
  SCHEDULE = 'schedule',
  DEFER = 'defer',
  SKIP = 'skip',
  CANCEL = 'cancel',
}

/**
 * Scheduling topology
 */
export interface SchedulingTopology {
  readonly topologyId: string;
  readonly nodes: readonly TopologyNode[];
  readonly edges: readonly TopologyEdge[];
  readonly metadata: TopologyMetadata;
}

/**
 * Topology node
 */
export interface TopologyNode {
  readonly nodeId: string;
  readonly nodeType: NodeType;
  readonly capacity: ResourceConstraints;
  readonly utilization: ResourceConstraints;
  readonly labels: Record<string, string>;
  readonly status: NodeStatus;
}

/**
 * Node type
 */
export enum NodeType {
  WORKER = 'worker',
  SCHEDULER = 'scheduler',
  COORDINATOR = 'coordinator',
  CUSTOM = 'custom',
}

/**
 * Node status
 */
export enum NodeStatus {
  READY = 'ready',
  BUSY = 'busy',
  DRAINING = 'draining',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error',
}

/**
 * Topology edge
 */
export interface TopologyEdge {
  readonly edgeId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly weight: number;
  readonly latencyMs?: number;
}

/**
 * Topology metadata
 */
export interface TopologyMetadata {
  readonly topologyType: TopologyType;
  readonly version: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Topology type
 */
export enum TopologyType {
  HIERARCHICAL = 'hierarchical',
  MESH = 'mesh',
  RING = 'ring',
  STAR = 'star',
  CUSTOM = 'custom',
}

/**
 * Scheduling capabilities
 */
export interface SchedulingCapabilities {
  readonly supportedScheduleTypes: readonly ScheduleType[];
  readonly supportedSchedulingPolicies: readonly SchedulingPolicy[];
  readonly supportedTopologyTypes: readonly TopologyType[];
  readonly supportsLeasing: boolean;
  readonly supportsTopologyAware: boolean;
  readonly supportsDeadlineAware: boolean;
  readonly supportsFairShare: boolean;
  readonly supportsPriority: boolean;
  readonly supportsAffinity: boolean;
  readonly supportsConcurrency: boolean;
  readonly maxSchedules?: number;
  readonly maxLeaseDurationMs?: number;
}

/**
 * Scheduling adapter config
 */
export interface SchedulingAdapterConfig {
  readonly schedulingConfig: SchedulingConfig;
  readonly leaseConfig: LeaseConfig;
  readonly topologyConfig: TopologyConfig;
  readonly fairnessConfig: FairnessConfig;
}

/**
 * Scheduling config
 */
export interface SchedulingConfig {
  readonly defaultScheduleType: ScheduleType;
  readonly defaultSchedulingPolicy: SchedulingPolicy;
  readonly maxConcurrentSchedules?: number;
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
 * Topology config
 */
export interface TopologyConfig {
  readonly topologyType: TopologyType;
  readonly autoDiscovery?: boolean;
  readonly refreshIntervalMs?: number;
}

/**
 * Fairness config
 */
export interface FairnessConfig {
  readonly enabled: boolean;
  readonly algorithm: FairnessAlgorithm;
  readonly weightConfig?: WeightConfig;
}

/**
 * Fairness algorithm
 */
export enum FairnessAlgorithm {
  ROUND_ROBIN = 'round_robin',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  LEAST_LOADED = 'least_loaded',
  CUSTOM = 'custom',
}

/**
 * Weight config
 */
export interface WeightConfig {
  readonly weightKey?: string;
  readonly defaultWeight?: number;
  readonly maxWeight?: number;
}

/**
 * Scheduling health status
 */
export interface SchedulingHealthStatus {
  readonly healthy: boolean;
  readonly totalSchedules: number;
  readonly activeSchedules: number;
  readonly activeLeases: number;
  readonly schedulingDecisionsPerMinute: number;
  readonly errorCount: number;
  readonly lastError?: SchedulingError;
}

/**
 * Scheduling backend
 * Canonical interface for scheduling backend
 */
export interface SchedulingBackend {
  readonly backendId: string;
  readonly backendType: SchedulingBackendType;

  /**
   * Connect
   */
  connect(): Promise<void>;

  /**
   * Disconnect
   */
  disconnect(): Promise<void>;

  /**
   * Is connected
   */
  isConnected(): boolean;

  /**
   * Get connection status
   */
  getConnectionStatus(): Promise<ConnectionStatus>;
}

/**
 * Scheduling backend type
 */
export enum SchedulingBackendType {
  CRON = 'cron',
  TEMPORAL = 'temporal',
  AIRFLOW = 'airflow',
  KUBERNETES_CRONJOB = 'kubernetes_cronjob',
  CUSTOM = 'custom',
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Scheduling provider
 * Canonical interface for scheduling provider implementation
 */
export interface SchedulingProvider {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;

  /**
   * Create adapter
   */
  createAdapter(config: SchedulingAdapterConfig): SchedulingAdapter;

  /**
   * Validate config
   */
  validateConfig(config: SchedulingAdapterConfig): Promise<ScheduleConfigValidationResult>;

  /**
   * Get capabilities
   */
  getCapabilities(): SchedulingCapabilities;

  /**
   * Get provider metadata
   */
  getMetadata(): SchedulingProviderMetadata;
}

/**
 * Schedule config validation result
 */
export interface ScheduleConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Scheduling provider metadata
 */
export interface SchedulingProviderMetadata {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Runtime Resource Contracts
 * 
 * Canonical interfaces for resource limits, quotas, and consumption tracking
 * Future-proofs runtime scheduling and worker scaling systems
 */

/**
 * Resource type
 */
export enum ResourceType {
  CPU = 'cpu',
  MEMORY = 'memory',
  STORAGE = 'storage',
  NETWORK = 'network',
  GPU = 'gpu',
  TOKEN = 'token',
  COST = 'cost',
  TIME = 'time',
  CUSTOM = 'custom',
}

/**
 * Resource unit
 */
export enum ResourceUnit {
  CORES = 'cores',
  BYTES = 'bytes',
  MEGABYTES = 'megabytes',
  GIGABYTES = 'gigabytes',
  MILLISECONDS = 'milliseconds',
  SECONDS = 'seconds',
  MINUTES = 'minutes',
  TOKENS = 'tokens',
  USD = 'usd',
  CUSTOM = 'custom',
}

/**
 * Resource limit
 */
export interface ResourceLimit {
  readonly resourceType: ResourceType;
  readonly limit: number;
  readonly unit: ResourceUnit;
  readonly hardLimit: boolean;
  readonly enforcePolicy: EnforcePolicy;
}

/**
 * Enforce policy
 */
export enum EnforcePolicy {
  STRICT = 'strict',
  SOFT = 'soft',
  ADVISORY = 'advisory',
}

/**
 * Runtime resource limits
 */
export interface RuntimeResourceLimits {
  readonly limits: readonly ResourceLimit[];
  readonly enforcementStrategy: EnforcementStrategy;
  readonly overcommitRatio: number;
  readonly customLimits?: Record<string, ResourceLimit>;
}

/**
 * Enforcement strategy
 */
export enum EnforcementStrategy {
  FAIL_FAST = 'fail_fast',
  THROTTLE = 'throttle',
  QUEUE = 'queue',
  BEST_EFFORT = 'best_effort',
}

/**
 * Resource consumption
 */
export interface ResourceConsumption {
  readonly resourceId: string;
  readonly resourceType: ResourceType;
  readonly consumed: number;
  readonly unit: ResourceUnit;
  readonly timestamp: Date;
  readonly sourceId: string; // executionId, taskId, workerId, etc.
  readonly sourceType: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Resource consumption snapshot
 */
export interface ResourceConsumptionSnapshot {
  readonly snapshotId: string;
  readonly timestamp: Date;
  readonly consumptions: readonly ResourceConsumption[];
  readonly totalConsumption: TotalResourceConsumption;
}

/**
 * Total resource consumption
 */
export interface TotalResourceConsumption {
  readonly cpu: ResourceConsumptionSummary;
  readonly memory: ResourceConsumptionSummary;
  readonly storage: ResourceConsumptionSummary;
  readonly network: ResourceConsumptionSummary;
  readonly gpu?: ResourceConsumptionSummary;
  readonly tokens?: ResourceConsumptionSummary;
  readonly cost?: ResourceConsumptionSummary;
  readonly time?: ResourceConsumptionSummary;
  readonly custom?: Record<string, ResourceConsumptionSummary>;
}

/**
 * Resource consumption summary
 */
export interface ResourceConsumptionSummary {
  readonly total: number;
  readonly unit: ResourceUnit;
  readonly peak: number;
  readonly average: number;
  readonly count: number;
}

/**
 * Execution quota
 */
export interface ExecutionQuota {
  readonly quotaId: string;
  readonly scope: QuotaScope;
  readonly scopeId: string; // tenantId, userId, etc.
  readonly quotas: readonly ResourceLimit[];
  readonly period: QuotaPeriod;
  readonly currentUsage: readonly ResourceConsumption[];
  readonly resetAt: Date;
  readonly exceeded: boolean;
  readonly warnings: readonly QuotaWarning[];
}

/**
 * Quota scope
 */
export enum QuotaScope {
  TENANT = 'tenant',
  USER = 'user',
  WORKSPACE = 'workspace',
  WORKFLOW = 'workflow',
  GLOBAL = 'global',
  CUSTOM = 'custom',
}

/**
 * Quota period
 */
export enum QuotaPeriod {
  SECOND = 'second',
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom',
}

/**
 * Quota warning
 */
export interface QuotaWarning {
  readonly resourceType: ResourceType;
  readonly thresholdPercent: number;
  readonly currentPercent: number;
  readonly message: string;
  readonly severity: 'info' | 'warning' | 'critical';
}

/**
 * Worker resource profile
 */
export interface WorkerResourceProfile {
  readonly workerId: string;
  readonly workerType: string;
  readonly capacity: ResourceCapacity;
  readonly available: ResourceCapacity;
  readonly allocated: ResourceCapacity;
  readonly utilization: ResourceUtilization;
  readonly lastUpdated: Date;
}

/**
 * Resource capacity
 */
export interface ResourceCapacity {
  readonly cpu: ResourceCapacityValue;
  readonly memory: ResourceCapacityValue;
  readonly storage: ResourceCapacityValue;
  readonly network: ResourceCapacityValue;
  readonly gpu?: ResourceCapacityValue;
  readonly custom?: Record<string, ResourceCapacityValue>;
}

/**
 * Resource capacity value
 */
export interface ResourceCapacityValue {
  readonly total: number;
  readonly unit: ResourceUnit;
  readonly reserved?: number;
  readonly overcommitable?: number;
}

/**
 * Resource utilization
 */
export interface ResourceUtilization {
  readonly cpu: number; // 0-100
  readonly memory: number; // 0-100
  readonly storage: number; // 0-100
  readonly network: number; // 0-100
  readonly gpu?: number; // 0-100
  readonly custom?: Record<string, number>;
}

/**
 * Resource allocation
 */
export interface ResourceAllocation {
  readonly allocationId: string;
  readonly sourceId: string; // executionId, taskId, etc.
  readonly sourceType: string;
  readonly allocated: ResourceCapacity;
  readonly requested: ResourceCapacity;
  readonly status: AllocationStatus;
  readonly allocatedAt: Date;
  readonly expiresAt?: Date;
  readonly constraints?: ResourceConstraints;
}

/**
 * Allocation status
 */
export enum AllocationStatus {
  PENDING = 'pending',
  ALLOCATED = 'allocated',
  RELEASED = 'released',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

/**
 * Resource constraints
 */
export interface ResourceConstraints {
  readonly minResources?: ResourceCapacity;
  readonly maxResources?: ResourceCapacity;
  readonly preferredResources?: ResourceCapacity;
  readonly affinity?: ResourceAffinity;
  readonly antiAffinity?: ResourceAffinity;
}

/**
 * Resource affinity
 */
export interface ResourceAffinity {
  readonly resourceType: ResourceType;
  readonly value: string;
  readonly operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'exists';
}

/**
 * Resource manager
 * Canonical interface for resource management
 */
export interface ResourceManager {
  /**
   * Allocate resources
   */
  allocate(
    sourceId: string,
    sourceType: string,
    requested: ResourceCapacity,
    constraints?: ResourceConstraints
  ): Promise<ResourceAllocation>;

  /**
   * Release resources
   */
  release(allocationId: string): Promise<void>;

  /**
   * Get allocation
   */
  getAllocation(allocationId: string): Promise<ResourceAllocation | null>;

  /**
   * Get allocations for source
   */
  getAllocations(
    sourceId: string,
    sourceType: string
  ): Promise<readonly ResourceAllocation[]>;

  /**
   * Check resource availability
   */
  checkAvailability(
    requested: ResourceCapacity,
    constraints?: ResourceConstraints
  ): Promise<AvailabilityResult>;

  /**
   * Get resource utilization
   */
  getUtilization(
    scope: ResourceScope,
    scopeId: string
  ): Promise<ResourceUtilization>;

  /**
   * Record consumption
   */
  recordConsumption(consumption: ResourceConsumption): Promise<void>;

  /**
   * Get consumption snapshot
   */
  getConsumptionSnapshot(
    sourceId: string,
    sourceType: string
  ): Promise<ResourceConsumptionSnapshot>;

  /**
   * Enforce limits
   */
  enforceLimits(
    limits: RuntimeResourceLimits,
    consumption: ResourceConsumption
  ): Promise<EnforcementResult>;
}

/**
 * Resource scope
 */
export enum ResourceScope {
  WORKER = 'worker',
  EXECUTION = 'execution',
  TASK = 'task',
  TENANT = 'tenant',
  GLOBAL = 'global',
}

/**
 * Availability result
 */
export interface AvailabilityResult {
  readonly available: boolean;
  readonly availableCapacity: ResourceCapacity;
  readonly requestedCapacity: ResourceCapacity;
  readonly constraintsMet: boolean;
  readonly warnings: readonly string[];
}

/**
 * Enforcement result
 */
export interface EnforcementResult {
  readonly enforced: boolean;
  readonly action: EnforcementAction;
  readonly message?: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Enforcement action
 */
export enum EnforcementAction {
  ALLOWED = 'allowed',
  THROTTLED = 'throttled',
  REJECTED = 'rejected',
  QUEUED = 'queued',
}

/**
 * Resource quota manager
 * Canonical interface for quota management
 */
export interface ResourceQuotaManager {
  /**
   * Get quota
   */
  getQuota(
    scope: QuotaScope,
    scopeId: string
  ): Promise<ExecutionQuota | null>;

  /**
   * Set quota
   */
  setQuota(quota: ExecutionQuota): Promise<void>;

  /**
   * Check quota
   */
  checkQuota(
    scope: QuotaScope,
    scopeId: string,
    requested: ResourceCapacity
  ): Promise<QuotaCheckResult>;

  /**
   * Record usage
   */
  recordUsage(consumption: ResourceConsumption): Promise<void>;

  /**
   * Get quota usage
   */
  getUsage(
    scope: QuotaScope,
    scopeId: string
  ): Promise<readonly ResourceConsumption[]>;

  /**
   * Reset quota
   */
  resetQuota(
    scope: QuotaScope,
    scopeId: string
  ): Promise<void>;

  /**
   * List quotas
   */
  listQuotas(filter?: QuotaFilter): Promise<readonly ExecutionQuota[]>;

  /**
   * Get quota warnings
   */
  getWarnings(
    scope: QuotaScope,
    scopeId: string
  ): Promise<readonly QuotaWarning[]>;
}

/**
 * Quota check result
 */
export interface QuotaCheckResult {
  readonly allowed: boolean;
  readonly remainingCapacity: ResourceCapacity;
  readonly requestedCapacity: ResourceCapacity;
  readonly warnings: readonly QuotaWarning[];
  readonly exceededQuotas: readonly ResourceType[];
}

/**
 * Quota filter
 */
export interface QuotaFilter {
  readonly scope?: QuotaScope;
  readonly scopeId?: string;
  readonly resourceType?: ResourceType;
  readonly exceeded?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Resource monitoring
 * Canonical interface for resource monitoring
 */
export interface ResourceMonitoring {
  /**
   * Get current metrics
   */
  getCurrentMetrics(
    scope: ResourceScope,
    scopeId: string
  ): Promise<ResourceMetrics>;

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(
    scope: ResourceScope,
    scopeId: string,
    timeRange: TimeRange
  ): Promise<readonly ResourceMetrics[]>;

  /**
   * Get resource trends
   */
  getTrends(
    scope: ResourceScope,
    scopeId: string,
    timeRange: TimeRange
  ): Promise<ResourceTrends>;

  /**
   * Get resource alerts
   */
  getAlerts(
    scope: ResourceScope,
    scopeId: string
  ): Promise<readonly ResourceAlert[]>;

  /**
   * Subscribe to metrics
   */
  subscribeMetrics(
    scope: ResourceScope,
    scopeId: string,
    handler: MetricsHandler
  ): Promise<SubscriptionId>;

  /**
   * Unsubscribe from metrics
   */
  unsubscribeMetrics(subscriptionId: string): Promise<void>;
}

/**
 * Resource metrics
 */
export interface ResourceMetrics {
  readonly timestamp: Date;
  readonly scope: ResourceScope;
  readonly scopeId: string;
  readonly utilization: ResourceUtilization;
  readonly consumption: TotalResourceConsumption;
  readonly allocationCount: number;
  readonly activeAllocations: number;
}

/**
 * Time range
 */
export interface TimeRange {
  readonly start: Date;
  readonly end: Date;
}

/**
 * Resource trends
 */
export interface ResourceTrends {
  readonly timeRange: TimeRange;
  readonly utilizationTrends: ResourceUtilizationTrends;
  readonly consumptionTrends: ResourceConsumptionTrends;
  readonly predictions?: ResourcePredictions;
}

/**
 * Resource utilization trends
 */
export interface ResourceUtilizationTrends {
  readonly cpu: TrendData;
  readonly memory: TrendData;
  readonly storage: TrendData;
  readonly network: TrendData;
  readonly gpu?: TrendData;
  readonly custom?: Record<string, TrendData>;
}

/**
 * Trend data
 */
export interface TrendData {
  readonly average: number;
  readonly peak: number;
  readonly trough: number;
  readonly trend: 'increasing' | 'decreasing' | 'stable';
  readonly rateOfChange: number;
}

/**
 * Resource consumption trends
 */
export interface ResourceConsumptionTrends {
  readonly cpu: TrendData;
  readonly memory: TrendData;
  readonly storage: TrendData;
  readonly network: TrendData;
  readonly tokens?: TrendData;
  readonly cost?: TrendData;
  readonly custom?: Record<string, TrendData>;
}

/**
 * Resource predictions
 */
export interface ResourcePredictions {
  readonly predictedUtilization: ResourceUtilization;
  readonly predictedConsumption: TotalResourceConsumption;
  readonly confidence: number; // 0-100
  readonly timeHorizonMs: number;
}

/**
 * Resource alert
 */
export interface ResourceAlert {
  readonly alertId: string;
  readonly alertType: AlertType;
  readonly resourceType: ResourceType;
  readonly severity: 'info' | 'warning' | 'critical';
  readonly message: string;
  readonly currentValue: number;
  readonly threshold: number;
  readonly triggeredAt: Date;
  readonly resolvedAt?: Date;
}

/**
 * Alert type
 */
export enum AlertType {
  UTILIZATION_HIGH = 'utilization_high',
  UTILIZATION_LOW = 'utilization_low',
  QUOTA_EXCEEDED = 'quota_exceeded',
  QUOTA_WARNING = 'quota_warning',
  ALLOCATION_FAILED = 'allocation_failed',
  CUSTOM = 'custom',
}

/**
 * Metrics handler
 */
export type MetricsHandler = (metrics: ResourceMetrics) => Promise<void>;

/**
 * Subscription ID
 */
export type SubscriptionId = string;

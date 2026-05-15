/**
 * Runtime Scheduling Contracts
 * 
 * Canonical interfaces for task scheduling and execution ordering
 * Semantic scheduling contracts only - no implementation
 */

/**
 * Scheduling policy
 */
export enum SchedulingPolicy {
  FIFO = 'fifo',
  LIFO = 'lifo',
  PRIORITY = 'priority',
  FAIR_SHARE = 'fair_share',
  ROUND_ROBIN = 'round_robin',
  WEIGHTED_FAIR = 'weighted_fair',
  CUSTOM = 'custom',
}

/**
 * Execution priority
 */
export enum ExecutionPriority {
  LOWEST = 'lowest',
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  HIGHEST = 'highest',
  CRITICAL = 'critical',
}

/**
 * Queue affinity
 */
export interface QueueAffinity {
  readonly queueId?: string;
  readonly queueType?: QueueType;
  readonly affinityType: AffinityType;
  readonly affinityValue: string;
  readonly weight?: number;
}

/**
 * Queue type
 */
export enum QueueType {
  DEFAULT = 'default',
  HIGH_PRIORITY = 'high_priority',
  LOW_PRIORITY = 'low_priority',
  WORKER_SPECIFIC = 'worker_specific',
  TENANT_SPECIFIC = 'tenant_specific',
  CUSTOM = 'custom',
}

/**
 * Affinity type
 */
export enum AffinityType {
  REQUIRED = 'required',
  PREFERRED = 'preferred',
  AVOIDED = 'avoided',
}

/**
 * Scheduling constraint
 */
export interface SchedulingConstraint {
  readonly constraintType: ConstraintType;
  readonly constraintValue: unknown;
  readonly enforce: boolean;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Constraint type
 */
export enum ConstraintType {
  MAX_CONCURRENCY = 'max_concurrency',
  MIN_CONCURRENCY = 'min_concurrency',
  MAX_EXECUTIONS_PER_TENANT = 'max_executions_per_tenant',
  MAX_EXECUTIONS_PER_USER = 'max_executions_per_user',
  TIME_WINDOW = 'time_window',
  DEADLINE = 'deadline',
  DEPENDENCY = 'dependency',
  RESOURCE_REQUIREMENT = 'resource_requirement',
  CUSTOM = 'custom',
}

/**
 * Task scheduling policy
 */
export interface TaskSchedulingPolicy {
  readonly policyId: string;
  readonly policyName: string;
  readonly schedulingPolicy: SchedulingPolicy;
  readonly defaultPriority: ExecutionPriority;
  readonly queueAffinity?: QueueAffinity;
  readonly constraints: readonly SchedulingConstraint[];
  readonly priorityRules: readonly PriorityRule[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Priority rule
 */
export interface PriorityRule {
  readonly ruleId: string;
  readonly condition: PriorityCondition;
  readonly priority: ExecutionPriority;
  readonly weight?: number;
}

/**
 * Priority condition
 */
export interface PriorityCondition {
  readonly conditionType: ConditionType;
  readonly operator: ComparisonOperator;
  readonly value: unknown;
}

/**
 * Condition type
 */
export enum ConditionType {
  TASK_TYPE = 'task_type',
  WORKFLOW_TYPE = 'workflow_type',
  TENANT_ID = 'tenant_id',
  USER_ID = 'user_id',
  CUSTOM_ATTRIBUTE = 'custom_attribute',
}

/**
 * Comparison operator
 */
export enum ComparisonOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  IN = 'in',
  NOT_IN = 'not_in',
}

/**
 * Scheduled task
 */
export interface ScheduledTask {
  readonly taskId: string;
  readonly taskType: string;
  readonly priority: ExecutionPriority;
  readonly scheduledAt: Date;
  readonly executeAt?: Date; // For delayed execution
  readonly deadlineAt?: Date;
  readonly schedulingPolicy?: TaskSchedulingPolicy;
  readonly queueAffinity?: QueueAffinity;
  readonly constraints: readonly SchedulingConstraint[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Delayed execution
 */
export interface DelayedExecution {
  readonly executionId: string;
  readonly scheduledAt: Date;
  readonly executeAt: Date;
  readonly delayMs: number;
  readonly reason: DelayReason;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Delay reason
 */
export enum DelayReason {
  SCHEDULED = 'scheduled',
  RATE_LIMITED = 'rate_limited',
  RESOURCE_CONSTRAINT = 'resource_constraint',
  DEPENDENCY_WAIT = 'dependency_wait',
  CUSTOM = 'custom',
}

/**
 * Deadline scheduling
 */
export interface DeadlineScheduling {
  readonly executionId: string;
  readonly deadlineAt: Date;
  readonly priority: ExecutionPriority;
  readonly escalationPolicy: EscalationPolicy;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Escalation policy
 */
export enum EscalationPolicy {
  INCREASE_PRIORITY = 'increase_priority',
  NOTIFY = 'notify',
  ABORT = 'abort',
  CUSTOM = 'custom',
}

/**
 * Runtime scheduler
 * Canonical interface for task scheduling
 */
export interface RuntimeScheduler {
  /**
   * Schedule task
   */
  schedule(task: ScheduledTask): Promise<SchedulingResult>;

  /**
   * Schedule task batch
   */
  scheduleBatch(tasks: readonly ScheduledTask[]): Promise<readonly SchedulingResult[]>;

  /**
   * Schedule delayed execution
   */
  scheduleDelayed(execution: DelayedExecution): Promise<SchedulingResult>;

  /**
   * Schedule with deadline
   */
  scheduleWithDeadline(execution: DeadlineScheduling): Promise<SchedulingResult>;

  /**
   * Unschedule task
   */
  unschedule(taskId: string): Promise<void>;

  /**
   * Reschedule task
   */
  reschedule(
    taskId: string,
    newExecuteAt?: Date,
    newPriority?: ExecutionPriority
  ): Promise<SchedulingResult>;

  /**
   * Get scheduled tasks
   */
  getScheduledTasks(filter?: ScheduledTaskFilter): Promise<readonly ScheduledTask[]>;

  /**
   * Get task queue status
   */
  getQueueStatus(queueId?: string): Promise<QueueStatus>;

  /**
   * Get scheduling statistics
   */
  getStatistics(filter?: StatisticsFilter): Promise<SchedulingStatistics>;

  /**
   * Apply scheduling policy
   */
  applyPolicy(policy: TaskSchedulingPolicy): Promise<void>;

  /**
   * Get scheduling policy
   */
  getPolicy(policyId: string): Promise<TaskSchedulingPolicy | null>;

  /**
   * List scheduling policies
   */
  listPolicies(filter?: PolicyFilter): Promise<readonly TaskSchedulingPolicy[]>;
}

/**
 * Scheduling result
 */
export interface SchedulingResult {
  readonly taskId: string;
  readonly success: boolean;
  readonly scheduledAt: Date;
  readonly executeAt?: Date;
  readonly queueId?: string;
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
 * Scheduled task filter
 */
export interface ScheduledTaskFilter {
  readonly taskType?: string;
  readonly priority?: ExecutionPriority;
  readonly queueId?: string;
  readonly scheduledAfter?: Date;
  readonly scheduledBefore?: Date;
  readonly executeAfter?: Date;
  readonly executeBefore?: Date;
  readonly status?: TaskStatus;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Task status
 */
export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  ASSIGNED = 'assigned',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Queue status
 */
export interface QueueStatus {
  readonly queueId: string;
  readonly queueType: QueueType;
  readonly depth: number;
  readonly pendingTasks: number;
  readonly runningTasks: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly averageWaitTimeMs: number;
  readonly averageExecutionTimeMs: number;
}

/**
 * Statistics filter
 */
export interface StatisticsFilter {
  readonly queueId?: string;
  readonly taskType?: string;
  readonly after?: Date;
  readonly before?: Date;
}

/**
 * Scheduling statistics
 */
export interface SchedulingStatistics {
  readonly totalScheduled: number;
  readonly totalExecuted: number;
  readonly totalFailed: number;
  readonly totalCancelled: number;
  readonly averageExecutionTimeMs: number;
  readonly averageWaitTimeMs: number;
  readonly throughputPerMinute: number;
  readonly tasksByPriority: Record<ExecutionPriority, number>;
  readonly tasksByQueue: Record<string, number>;
}

/**
 * Policy filter
 */
export interface PolicyFilter {
  readonly policyName?: string;
  readonly schedulingPolicy?: SchedulingPolicy;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Concurrency constraint
 */
export interface ConcurrencyConstraint {
  readonly constraintId: string;
  readonly scope: ConcurrencyScope;
  readonly scopeId: string;
  readonly maxConcurrent: number;
  readonly minConcurrent?: number;
  readonly currentCount: number;
  readonly enforcementPolicy: 'strict';
}

/**
 * Concurrency scope
 */
export enum ConcurrencyScope {
  GLOBAL = 'global',
  TENANT = 'tenant',
  USER = 'user',
  WORKFLOW = 'workflow',
  WORKER_TYPE = 'worker_type',
  QUEUE = 'queue',
  CUSTOM = 'custom',
}

/**
 * Concurrency manager
 * Canonical interface for concurrency management
 */
export interface ConcurrencyManager {
  /**
   * Acquire slot
   */
  acquireSlot(
    scope: ConcurrencyScope,
    scopeId: string,
    taskId: string
  ): Promise<SlotAcquisitionResult>;

  /**
   * Release slot
   */
  releaseSlot(
    scope: ConcurrencyScope,
    scopeId: string,
    taskId: string
  ): Promise<void>;

  /**
   * Get available slots
   */
  getAvailableSlots(
    scope: ConcurrencyScope,
    scopeId: string
  ): Promise<number>;

  /**
   * Get current count
   */
  getCurrentCount(
    scope: ConcurrencyScope,
    scopeId: string
  ): Promise<number>;

  /**
   * Set constraint
   */
  setConstraint(constraint: ConcurrencyConstraint): Promise<void>;

  /**
   * Get constraint
   */
  getConstraint(
    scope: ConcurrencyScope,
    scopeId: string
  ): Promise<ConcurrencyConstraint | null>;

  /**
   * List constraints
   */
  listConstraints(filter?: ConstraintFilter): Promise<readonly ConcurrencyConstraint[]>;

  /**
   * Wait for slot
   */
  waitForSlot(
    scope: ConcurrencyScope,
    scopeId: string,
    taskId: string,
    timeoutMs?: number
  ): Promise<SlotAcquisitionResult>;
}

/**
 * Slot acquisition result
 */
export interface SlotAcquisitionResult {
  readonly acquired: boolean;
  readonly taskId: string;
  readonly acquiredAt?: Date;
  readonly waitTimeMs?: number;
  readonly error?: SlotAcquisitionError;
}

/**
 * Slot acquisition error
 */
export interface SlotAcquisitionError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Concurrency filter
 */
export interface ConcurrencyFilter {
  readonly scope?: ConcurrencyScope;
  readonly scopeId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Constraint filter
 */
export interface ConstraintFilter {
  readonly scope?: ConcurrencyScope;
  readonly scopeId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Priority queue
 * Canonical interface for priority-based task queuing
 */
export interface PriorityQueue {
  /**
   * Enqueue task
   */
  enqueue(task: ScheduledTask): Promise<void>;

  /**
   * Dequeue task
   */
  dequeue(): Promise<ScheduledTask | null>;

  /**
   * Peek at next task
   */
  peek(): Promise<ScheduledTask | null>;

  /**
   * Get queue size
   */
  size(): Promise<number>;

  /**
   * Is queue empty
   */
  isEmpty(): Promise<boolean>;

  /**
   * Get tasks by priority
   */
  getTasksByPriority(priority: ExecutionPriority): Promise<readonly ScheduledTask[]>;

  /**
   * Update task priority
   */
  updatePriority(
    taskId: string,
    newPriority: ExecutionPriority
  ): Promise<void>;

  /**
   * Remove task
   */
  remove(taskId: string): Promise<void>;

  /**
   * Clear queue
   */
  clear(): Promise<void>;
}

/**
 * Fair share scheduler
 * Canonical interface for fair share scheduling
 */
export interface FairShareScheduler {
  /**
   * Register share
   */
  registerShare(
    shareId: string,
    weight: number,
    minShares?: number
  ): Promise<void>;

  /**
   * Unregister share
   */
  unregisterShare(shareId: string): Promise<void>;

  /**
   * Get share allocation
   */
  getShareAllocation(shareId: string): Promise<ShareAllocation>;

  /**
   * Get all share allocations
   */
  getAllShareAllocations(): Promise<readonly ShareAllocation[]>;

  /**
   * Update share weight
   */
  updateShareWeight(
    shareId: string,
    newWeight: number
  ): Promise<void>;

  /**
   * Get scheduling decision
   */
  getSchedulingDecision(): Promise<SchedulingDecision>;
}

/**
 * Share allocation
 */
export interface ShareAllocation {
  readonly shareId: string;
  readonly weight: number;
  readonly allocatedSlots: number;
  readonly usedSlots: number;
  readonly availableSlots: number;
  readonly minShares?: number;
}

/**
 * Scheduling decision
 */
export interface SchedulingDecision {
  readonly selectedShareId: string;
  readonly selectedTaskId: string;
  readonly reason: string;
  readonly timestamp: Date;
}

/**
 * Deadline manager
 * Canonical interface for deadline management
 */
export interface DeadlineManager {
  /**
   * Set deadline
   */
  setDeadline(deadline: DeadlineScheduling): Promise<void>;

  /**
   * Get deadline
   */
  getDeadline(executionId: string): Promise<DeadlineScheduling | null>;

  /**
   * Check deadline compliance
   */
  checkCompliance(executionId: string): Promise<DeadlineComplianceResult>;

  /**
   * Get approaching deadlines
   */
  getApproachingDeadlines(
    withinMs: number
  ): Promise<readonly DeadlineScheduling[]>;

  /**
   * Get missed deadlines
   */
  getMissedDeadlines(
    after?: Date,
    before?: Date
  ): Promise<readonly DeadlineScheduling[]>;

  /**
   * Cancel deadline
   */
  cancelDeadline(executionId: string): Promise<void>;

  /**
   * Update deadline
   */
  updateDeadline(
    executionId: string,
    newDeadlineAt: Date
  ): Promise<void>;
}

/**
 * Deadline compliance result
 */
export interface DeadlineComplianceResult {
  readonly compliant: boolean;
  readonly timeRemainingMs: number;
  readonly timeElapsedMs: number;
  readonly progress: number; // 0-100
  readonly estimatedCompletionAt?: Date;
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

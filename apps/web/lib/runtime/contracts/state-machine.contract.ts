/**
 * Runtime State Machine Contracts
 * 
 * Canonical interfaces for state machine semantics
 * Formalizes execution and task lifecycle semantics
 */

/**
 * State type
 */
export type StateType = string;

/**
 * State identifier
 */
export type StateId = string;

/**
 * State
 */
export interface State {
  readonly stateId: StateId;
  readonly stateType: StateType;
  readonly stateName: string;
  readonly metadata?: StateMetadata;
}

/**
 * State metadata
 */
export interface StateMetadata {
  readonly final: boolean;
  readonly initial: boolean;
  readonly terminal: boolean;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * State transition
 */
export interface StateTransition {
  readonly transitionId: string;
  readonly fromState: StateId;
  readonly toState: StateId;
  readonly event: string;
  readonly guard?: TransitionGuard;
  readonly action?: TransitionAction;
  readonly metadata?: TransitionMetadata;
}

/**
 * Transition guard
 */
export interface TransitionGuard {
  readonly guardId: string;
  readonly guardType: GuardType;
  readonly condition: GuardCondition;
  readonly description?: string;
}

/**
 * Guard type
 */
export enum GuardType {
  STATE_BASED = 'state_based',
  CONDITION_BASED = 'condition_based',
  CUSTOM = 'custom',
}

/**
 * Guard condition
 */
export interface GuardCondition {
  readonly conditionType: ConditionType;
  readonly operator: ComparisonOperator;
  readonly value: unknown;
  readonly customEvaluator?: (context: StateMachineContext) => Promise<boolean>;
}

/**
 * Condition type
 */
export enum ConditionType {
  STATE_EQUALS = 'state_equals',
  STATE_IN = 'state_in',
  ATTRIBUTE_EQUALS = 'attribute_equals',
  ATTRIBUTE_GREATER_THAN = 'attribute_greater_than',
  ATTRIBUTE_LESS_THAN = 'attribute_less_than',
  CUSTOM = 'custom',
}

/**
 * Comparison operator
 */
export enum ComparisonOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
}

/**
 * Transition action
 */
export interface TransitionAction {
  readonly actionId: string;
  readonly actionType: ActionType;
  readonly actionHandler: string;
  readonly parameters?: Record<string, unknown>;
  readonly description?: string;
}

/**
 * Action type
 */
export enum ActionType {
  STATE_CHANGE = 'state_change',
  SIDE_EFFECT = 'side_effect',
  NOTIFICATION = 'notification',
  LOGGING = 'logging',
  CUSTOM = 'custom',
}

/**
 * Transition metadata
 */
export interface TransitionMetadata {
  readonly automatic: boolean;
  readonly reversible: boolean;
  readonly transitionTimeMs?: number;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * State snapshot
 */
export interface StateSnapshot {
  readonly snapshotId: string;
  readonly stateId: StateId;
  readonly timestamp: Date;
  readonly stateData: Record<string, unknown>;
  readonly context: StateMachineContext;
  readonly transitionHistory: readonly TransitionRecord[];
}

/**
 * Transition record
 */
export interface TransitionRecord {
  readonly recordId: string;
  readonly transitionId: string;
  readonly fromState: StateId;
  readonly toState: StateId;
  readonly event: string;
  readonly timestamp: Date;
  readonly durationMs?: number;
  readonly success: boolean;
  readonly error?: TransitionError;
}

/**
 * Transition error
 */
export interface TransitionError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * State machine context
 */
export interface StateMachineContext {
  readonly contextId: string;
  readonly stateMachineId: string;
  readonly currentState: StateId;
  readonly stateData: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly traceId?: string;
}

/**
 * Runtime state machine
 * Canonical interface for state machine operations
 */
export interface RuntimeStateMachine {
  readonly stateMachineId: string;
  readonly stateMachineType: StateMachineType;
  readonly initialState: StateId;
  readonly states: readonly State[];
  readonly transitions: readonly StateTransition[];

  /**
   * Initialize state machine
   */
  initialize(context: StateMachineContext): Promise<StateMachineInitializationResult>;

  /**
   * Transition to state
   */
  transition(
    event: string,
    context: StateMachineContext
  ): Promise<StateTransitionResult>;

  /**
   * Get current state
   */
  getCurrentState(contextId: string): Promise<State | null>;

  /**
   * Get valid transitions
   */
  getValidTransitions(stateId: StateId): Promise<readonly StateTransition[]>;

  /**
   * Create snapshot
   */
  createSnapshot(contextId: string): Promise<StateSnapshot>;

  /**
   * Restore from snapshot
   */
  restoreSnapshot(snapshotId: string): Promise<SnapshotRestoreResult>;

  /**
   * Validate transition
   */
  validateTransition(
    fromState: StateId,
    toState: StateId,
    event: string
  ): Promise<TransitionValidationResult>;

  /**
   * Get transition history
   */
  getTransitionHistory(
    contextId: string,
    limit?: number
  ): Promise<readonly TransitionRecord[]>;

  /**
   * Reset to initial state
   */
  reset(contextId: string): Promise<StateTransitionResult>;
}

/**
 * State machine type
 */
export enum StateMachineType {
  EXECUTION = 'execution',
  TASK = 'task',
  WORKFLOW = 'workflow',
  CUSTOM = 'custom',
}

/**
 * State machine initialization result
 */
export interface StateMachineInitializationResult {
  readonly stateMachineId: string;
  readonly contextId: string;
  readonly success: boolean;
  readonly initialState: StateId;
  readonly initializedAt: Date;
  readonly error?: StateMachineError;
}

/**
 * State transition result
 */
export interface StateTransitionResult {
  readonly transitionId: string;
  readonly fromState: StateId;
  readonly toState: StateId;
  readonly event: string;
  readonly success: boolean;
  readonly timestamp: Date;
  readonly durationMs?: number;
  readonly snapshot?: StateSnapshot;
  readonly error?: TransitionError;
}

/**
 * Transition validation result
 */
export interface TransitionValidationResult {
  readonly valid: boolean;
  readonly allowed: boolean;
  readonly guardResults: readonly GuardResult[];
  readonly warnings: readonly string[];
}

/**
 * Guard result
 */
export interface GuardResult {
  readonly guardId: string;
  readonly passed: boolean;
  readonly message?: string;
  readonly durationMs?: number;
}

/**
 * Snapshot restore result
 */
export interface SnapshotRestoreResult {
  readonly snapshotId: string;
  readonly success: boolean;
  readonly restoredAt: Date;
  readonly restoredState: StateId;
  readonly restoredContext: StateMachineContext;
  readonly error?: SnapshotRestoreError;
}

/**
 * Snapshot restore error
 */
export interface SnapshotRestoreError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * State machine error
 */
export interface StateMachineError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * State machine builder
 * Canonical interface for building state machines
 */
export interface StateMachineBuilder {
  /**
   * Create state machine
   */
  createStateMachine(
    stateMachineId: string,
    stateMachineType: StateMachineType,
    initialState: StateId
  ): RuntimeStateMachine;

  /**
   * Add state
   */
  addState(state: State): void;

  /**
   * Add transition
   */
  addTransition(transition: StateTransition): void;

  /**
   * Add guard
   */
  addGuard(guard: TransitionGuard): void;

  /**
   * Add action
   */
  addAction(action: TransitionAction): void;

  /**
   * Build
   */
  build(): RuntimeStateMachine;

  /**
   * Validate
   */
  validate(): StateMachineValidationResult;
}

/**
 * State machine validation result
 */
export interface StateMachineValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly unreachableStates: readonly StateId[];
  readonly invalidTransitions: readonly string[];
}

/**
 * State machine registry
 * Canonical interface for state machine registration and discovery
 */
export interface StateMachineRegistry {
  /**
   * Register state machine
   */
  registerStateMachine(
    stateMachine: RuntimeStateMachine
  ): Promise<void>;

  /**
   * Unregister state machine
   */
  unregisterStateMachine(stateMachineId: string): Promise<void>;

  /**
   * Get state machine
   */
  getStateMachine(
    stateMachineId: string
  ): Promise<RuntimeStateMachine | null>;

  /**
   * Get state machine by type
   */
  getStateMachinesByType(
    stateMachineType: StateMachineType
  ): Promise<readonly RuntimeStateMachine[]>;

  /**
   * List state machines
   */
  listStateMachines(filter?: StateMachineFilter): Promise<readonly RuntimeStateMachine[]>;

  /**
   * Validate state machine
   */
  validateStateMachine(
    stateMachineId: string
  ): Promise<StateMachineValidationResult>;
}

/**
 * State machine filter
 */
export interface StateMachineFilter {
  readonly stateMachineType?: StateMachineType;
  readonly initialState?: StateId;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * State machine observer
 * Canonical interface for observing state machine events
 */
export interface StateMachineObserver {
  /**
   * Subscribe to state transitions
   */
  subscribeTransitions(
    stateMachineId: string,
    handler: TransitionEventHandler
  ): Promise<SubscriptionId>;

  /**
   * Subscribe to state changes
   */
  subscribeStateChanges(
    stateMachineId: string,
    handler: StateChangeHandler
  ): Promise<SubscriptionId>;

  /**
   * Subscribe to guard failures
   */
  subscribeGuardFailures(
    stateMachineId: string,
    handler: GuardFailureHandler
  ): Promise<SubscriptionId>;

  /**
   * Unsubscribe
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Get transition events
   */
  getTransitionEvents(
    stateMachineId: string,
    filter?: TransitionEventFilter
  ): Promise<readonly TransitionEvent[]>;
}

/**
 * Transition event handler
 */
export type TransitionEventHandler = (
  event: TransitionEvent
) => Promise<void>;

/**
 * State change handler
 */
export type StateChangeHandler = (
  event: StateChangeEvent
) => Promise<void>;

/**
 * Guard failure handler
 */
export type GuardFailureHandler = (
  event: GuardFailureEvent
) => Promise<void>;

/**
 * Subscription ID
 */
export type SubscriptionId = string;

/**
 * Transition event
 */
export interface TransitionEvent {
  readonly eventId: string;
  readonly stateMachineId: string;
  readonly transitionId: string;
  readonly fromState: StateId;
  readonly toState: StateId;
  readonly event: string;
  readonly timestamp: Date;
  readonly context: StateMachineContext;
  readonly success: boolean;
  readonly error?: TransitionError;
}

/**
 * State change event
 */
export interface StateChangeEvent {
  readonly eventId: string;
  readonly stateMachineId: string;
  readonly fromState: StateId;
  readonly toState: StateId;
  readonly timestamp: Date;
  readonly context: StateMachineContext;
}

/**
 * Guard failure event
 */
export interface GuardFailureEvent {
  readonly eventId: string;
  readonly stateMachineId: string;
  readonly guardId: string;
  readonly transitionId: string;
  readonly timestamp: Date;
  readonly reason: string;
}

/**
 * Transition event filter
 */
export interface TransitionEventFilter {
  readonly stateMachineId?: string;
  readonly fromState?: StateId;
  readonly toState?: StateId;
  readonly event?: string;
  readonly success?: boolean;
  readonly after?: Date;
  readonly before?: Date;
  readonly limit?: number;
}

/**
 * Hierarchical state machine
 * Canonical interface for hierarchical state machines
 */
export interface HierarchicalStateMachine extends RuntimeStateMachine {
  readonly parentStateMachineId?: string;
  readonly childStateMachines: readonly StateId[];

  /**
   * Add child state machine
   */
  addChildStateMachine(
    stateId: StateId,
    childStateMachine: RuntimeStateMachine
  ): Promise<void>;

  /**
   * Remove child state machine
   */
  removeChildStateMachine(stateId: StateId): Promise<void>;

  /**
   * Get child state machine
   */
  getChildStateMachine(stateId: StateId): Promise<RuntimeStateMachine | null>;

  /**
   * Get parent state machine
   */
  getParentStateMachine(): Promise<RuntimeStateMachine | null>;

  /**
   * Enter composite state
   */
  enterCompositeState(
    stateId: StateId,
    context: StateMachineContext
  ): Promise<StateTransitionResult>;

  /**
   * Exit composite state
   */
  exitCompositeState(
    stateId: StateId,
    context: StateMachineContext
  ): Promise<StateTransitionResult>;
}

/**
 * Parallel state machine
 * Canonical interface for parallel state machine regions
 */
export interface ParallelStateMachine extends RuntimeStateMachine {
  readonly regions: readonly ParallelRegion[];

  /**
   * Add region
   */
  addRegion(region: ParallelRegion): Promise<void>;

  /**
   * Remove region
   */
  removeRegion(regionId: string): Promise<void>;

  /**
   * Get region
   */
  getRegion(regionId: string): Promise<ParallelRegion | null>;

  /**
   * Start parallel execution
   */
  startParallelExecution(
    context: StateMachineContext
  ): Promise<ParallelExecutionResult>;

  /**
   * Synchronize regions
   */
  synchronizeRegions(
    context: StateMachineContext
  ): Promise<SynchronizationResult>;
}

/**
 * Parallel region
 */
export interface ParallelRegion {
  readonly regionId: string;
  readonly stateMachine: RuntimeStateMachine;
  readonly initialStates: readonly StateId[];
}

/**
 * Parallel execution result
 */
export interface ParallelExecutionResult {
  readonly success: boolean;
  readonly regionResults: readonly RegionExecutionResult[];
  readonly timestamp: Date;
  readonly durationMs?: number;
}

/**
 * Region execution result
 */
export interface RegionExecutionResult {
  readonly regionId: string;
  readonly success: boolean;
  readonly finalState: StateId;
  readonly error?: TransitionError;
}

/**
 * Synchronization result
 */
export interface SynchronizationResult {
  readonly synchronized: boolean;
  readonly synchronizationPoint: string;
  readonly timestamp: Date;
  readonly regionStates: Record<string, StateId>;
  readonly conflicts: readonly SynchronizationConflict[];
}

/**
 * Synchronization conflict
 */
export interface SynchronizationConflict {
  readonly regionId: string;
  readonly conflictType: ConflictType;
  readonly description: string;
}

/**
 * Conflict type
 */
export enum ConflictType {
  STATE_MISMATCH = 'state_mismatch',
  GUARD_FAILURE = 'guard_failure',
  DEADLOCK = 'deadlock',
  CUSTOM = 'custom',
}

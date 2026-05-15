/**
 * Adapter Factory Layer
 * 
 * Runtime initialization and lifecycle management
 * NO actual dependency injection frameworks
 */

import type { AdapterId, AdapterType } from '../types';

/**
 * Adapter factory
 * Canonical interface for adapter factory operations
 */
export interface AdapterFactory {
  readonly factoryId: string;

  /**
   * Create adapter
   */
  createAdapter(
    adapterType: AdapterType,
    config: AdapterFactoryConfig
  ): Promise<AdapterFactoryResult>;

  /**
   * Create adapter batch
   */
  createAdapterBatch(
    configs: readonly AdapterFactoryConfig[]
  ): Promise<readonly AdapterFactoryResult[]>;

  /**
   * Destroy adapter
   */
  destroyAdapter(adapterId: AdapterId): Promise<void>;

  /**
   * Destroy adapter batch
   */
  destroyAdapterBatch(adapterIds: readonly AdapterId[]): Promise<void>;

  /**
   * Get adapter
   */
  getAdapter(adapterId: AdapterId): unknown | null;

  /**
   * List adapters
   */
  listAdapters(filter?: AdapterFactoryFilter): readonly AdapterId[];

  /**
   * Validate config
   */
  validateConfig(
    adapterType: AdapterType,
    config: Record<string, unknown>
  ): ConfigValidationResult;

  /**
   * Get factory context
   */
  getContext(): AdapterFactoryContext;

  /**
   * Set factory context
   */
  setContext(context: AdapterFactoryContext): void;

  /**
   * Health check
   */
  healthCheck(): Promise<FactoryHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Adapter factory config
 */
export interface AdapterFactoryConfig {
  readonly adapterId: AdapterId;
  readonly adapterType: AdapterType;
  readonly providerType: string;
  readonly config: Record<string, unknown>;
  readonly dependencies?: readonly AdapterDependency[];
  readonly lifecycle?: AdapterLifecycleConfig;
}

/**
 * Adapter dependency
 */
export interface AdapterDependency {
  readonly adapterId: AdapterId;
  readonly type: DependencyType;
  readonly required: boolean;
}

/**
 * Dependency type
 */
export enum DependencyType {
  INITIALIZATION = 'initialization',
  RUNTIME = 'runtime',
  OPTIONAL = 'optional',
}

/**
 * Adapter lifecycle config
 */
export interface AdapterLifecycleConfig {
  readonly autoInitialize?: boolean;
  readonly lazyLoading?: boolean;
  readonly shutdownTimeoutMs?: number;
  readonly gracefulShutdown?: boolean;
}

/**
 * Adapter factory result
 */
export interface AdapterFactoryResult {
  readonly adapterId: AdapterId;
  readonly success: boolean;
  readonly adapter?: unknown;
  readonly createdAt: Date;
  readonly error?: FactoryError;
}

/**
 * Factory error
 */
export interface FactoryError {
  readonly code: string;
  readonly message: string;
  readonly adapterId: AdapterId;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Config validation result
 */
export interface ConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly normalizedConfig?: Record<string, unknown>;
}

/**
 * Adapter factory filter
 */
export interface AdapterFactoryFilter {
  readonly adapterType?: AdapterType;
  readonly providerType?: string;
  readonly status?: AdapterFactoryStatus;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Adapter factory status
 */
export enum AdapterFactoryStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  SHUTTING_DOWN = 'shutting_down',
  SHUTDOWN = 'shutdown',
}

/**
 * Adapter factory context
 */
export interface AdapterFactoryContext {
  readonly environment: RuntimeEnvironment;
  readonly configuration: FactoryConfiguration;
  readonly dependencies: AdapterDependencyGraph;
  readonly metadata: FactoryMetadata;
}

/**
 * Runtime environment
 */
export interface RuntimeEnvironment {
  readonly environment: string;
  readonly region?: string;
  readonly deploymentId?: string;
  readonly customEnvironment?: Record<string, string>;
}

/**
 * Factory configuration
 */
export interface FactoryConfiguration {
  readonly defaults: Record<string, unknown>;
  readonly overrides: Record<string, unknown>;
  readonly secrets: Record<string, string>;
}

/**
 * Adapter dependency graph
 */
export interface AdapterDependencyGraph {
  readonly nodes: readonly DependencyNode[];
  readonly edges: readonly DependencyEdge[];
}

/**
 * Dependency node
 */
export interface DependencyNode {
  readonly adapterId: AdapterId;
  readonly adapterType: AdapterType;
  readonly status: AdapterFactoryStatus;
}

/**
 * Dependency edge
 */
export interface DependencyEdge {
  readonly source: AdapterId;
  readonly target: AdapterId;
  readonly type: DependencyType;
}

/**
 * Factory metadata
 */
export interface FactoryMetadata {
  readonly version: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Factory health status
 */
export interface FactoryHealthStatus {
  readonly healthy: boolean;
  readonly totalAdapters: number;
  readonly readyAdapters: number;
  readonly errorAdapters: number;
  readonly initializationCount: number;
  readonly errorCount: number;
  readonly lastError?: FactoryError;
}

/**
 * Adapter bootstrapper
 * Canonical interface for adapter bootstrap
 */
export interface AdapterBootstrapper {
  readonly bootstrapperId: string;

  /**
   * Bootstrap adapter
   */
  bootstrap(
    adapterId: AdapterId,
    config: Record<string, unknown>
  ): Promise<BootstrapResult>;

  /**
   * Bootstrap batch
   */
  bootstrapBatch(
    configs: readonly BootstrapConfig[]
  ): Promise<readonly BootstrapResult[]>;

  /**
   * Get bootstrap status
   */
  getBootstrapStatus(adapterId: AdapterId): BootstrapStatus;

  /**
   * Cancel bootstrap
   */
  cancelBootstrap(adapterId: AdapterId): Promise<void>;
}

/**
 * Bootstrap config
 */
export interface BootstrapConfig {
  readonly adapterId: AdapterId;
  readonly config: Record<string, unknown>;
  readonly dependencies?: readonly AdapterId[];
  readonly timeoutMs?: number;
}

/**
 * Bootstrap result
 */
export interface BootstrapResult {
  readonly adapterId: AdapterId;
  readonly success: boolean;
  readonly bootstrappedAt: Date;
  readonly durationMs: number;
  readonly error?: FactoryError;
}

/**
 * Bootstrap status
 */
export interface BootstrapStatus {
  readonly adapterId: AdapterId;
  readonly status: BootstrapState;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly progress?: number; // 0-100
  readonly error?: FactoryError;
}

/**
 * Bootstrap state
 */
export enum BootstrapState {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  BOOTSTRAPPING = 'bootstrapping',
  READY = 'ready',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

/**
 * Adapter lifecycle manager
 * Canonical interface for adapter lifecycle management
 */
export interface AdapterLifecycleManager {
  readonly managerId: string;

  /**
   * Initialize adapter
   */
  initialize(
    adapterId: AdapterId,
    config: Record<string, unknown>
  ): Promise<LifecycleResult>;

  /**
   * Start adapter
   */
  start(adapterId: AdapterId): Promise<LifecycleResult>;

  /**
   * Stop adapter
   */
  stop(adapterId: AdapterId): Promise<LifecycleResult>;

  /**
   * Shutdown adapter
   */
  shutdown(adapterId: AdapterId): Promise<LifecycleResult>;

  /**
   * Restart adapter
   */
  restart(adapterId: AdapterId): Promise<LifecycleResult>;

  /**
   * Get lifecycle state
   */
  getLifecycleState(adapterId: AdapterId): LifecycleState;

  /**
   * Get lifecycle history
   */
  getLifecycleHistory(adapterId: AdapterId): readonly LifecycleEvent[];

  /**
   * Subscribe to lifecycle events
   */
  subscribe(
    adapterId: AdapterId,
    handler: LifecycleEventHandler
  ): LifecycleSubscription;

  /**
   * Unsubscribe
   */
  unsubscribe(subscriptionId: string): void;
}

/**
 * Lifecycle result
 */
export interface LifecycleResult {
  readonly adapterId: AdapterId;
  readonly success: boolean;
  readonly previousState: LifecycleState;
  readonly newState: LifecycleState;
  readonly transitionedAt: Date;
  readonly error?: FactoryError;
}

/**
 * Lifecycle state
 */
export enum LifecycleState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  SHUTTING_DOWN = 'shutting_down',
  SHUTDOWN = 'shutdown',
  ERROR = 'error',
}

/**
 * Lifecycle event
 */
export interface LifecycleEvent {
  readonly eventId: string;
  readonly adapterId: AdapterId;
  readonly eventType: LifecycleEventType;
  readonly previousState: LifecycleState;
  readonly newState: LifecycleState;
  readonly timestamp: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Lifecycle event type
 */
export enum LifecycleEventType {
  INITIALIZED = 'initialized',
  STARTED = 'started',
  STOPPED = 'stopped',
  SHUTDOWN = 'shutdown',
  ERROR = 'error',
  STATE_CHANGE = 'state_change',
}

/**
 * Lifecycle event handler
 */
export type LifecycleEventHandler = (event: LifecycleEvent) => void;

/**
 * Lifecycle subscription
 */
export interface LifecycleSubscription {
  readonly subscriptionId: string;
  readonly adapterId: AdapterId;
  readonly subscribedAt: Date;
}

/**
 * Dependency wiring
 * Canonical interface for dependency wiring
 */
export interface DependencyWiring {
  readonly wiringId: string;

  /**
   * Wire dependencies
   */
  wireDependencies(
    adapterId: AdapterId,
    dependencies: readonly AdapterId[]
  ): Promise<WiringResult>;

  /**
   * Unwire dependencies
   */
  unwireDependencies(
    adapterId: AdapterId,
    dependencies: readonly AdapterId[]
  ): Promise<WiringResult>;

  /**
   * Get dependency graph
   */
  getDependencyGraph(): DependencyGraph;

  /**
   * Validate wiring
   */
  validateWiring(adapterId: AdapterId): WiringValidationResult;

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(): readonly CircularDependency[];
}

/**
 * Wiring result
 */
export interface WiringResult {
  readonly adapterId: AdapterId;
  readonly success: boolean;
  readonly wiredAt: Date;
  readonly dependencies: readonly AdapterId[];
  readonly error?: FactoryError;
}

/**
 * Dependency graph
 */
export interface DependencyGraph {
  readonly nodes: readonly DependencyGraphNode[];
  readonly edges: readonly DependencyGraphEdge[];
  readonly hasCircularDependencies: boolean;
}

/**
 * Dependency graph node
 */
export interface DependencyGraphNode {
  readonly adapterId: AdapterId;
  readonly adapterType: AdapterType;
  readonly depth: number;
}

/**
 * Dependency graph edge
 */
export interface DependencyGraphEdge {
  readonly source: AdapterId;
  readonly target: AdapterId;
  readonly weight: number;
}

/**
 * Wiring validation result
 */
export interface WiringValidationResult {
  readonly valid: boolean;
  readonly missingDependencies: readonly AdapterId[];
  readonly circularDependencies: readonly CircularDependency[];
  readonly warnings: readonly string[];
}

/**
 * Circular dependency
 */
export interface CircularDependency {
  readonly cycle: readonly AdapterId[];
  readonly detectedAt: Date;
}

/**
 * Lazy loading semantics
 * Canonical interface for lazy loading
 */
export interface LazyLoadingSemantics {
  readonly loaderId: string;

  /**
   * Load adapter lazily
   */
  loadLazy(
    adapterId: AdapterId,
    config: Record<string, unknown>
  ): Promise<LazyLoadResult>;

  /**
   * Preload adapter
   */
  preload(
    adapterId: AdapterId,
    config: Record<string, unknown>
  ): Promise<LazyLoadResult>;

  /**
   * Unload adapter
   */
  unload(adapterId: AdapterId): Promise<void>;

  /**
   * Get loaded adapters
   */
  getLoadedAdapters(): readonly AdapterId[];

  /**
   * Get load status
   */
  getLoadStatus(adapterId: AdapterId): LazyLoadStatus;
}

/**
 * Lazy load result
 */
export interface LazyLoadResult {
  readonly adapterId: AdapterId;
  readonly success: boolean;
  readonly loadedAt: Date;
  readonly loadTimeMs: number;
  readonly error?: FactoryError;
}

/**
 * Lazy load status
 */
export interface LazyLoadStatus {
  readonly adapterId: AdapterId;
  readonly status: LazyLoadState;
  readonly loadedAt?: Date;
  readonly lastAccessedAt?: Date;
  readonly accessCount: number;
}

/**
 * Lazy load state
 */
export enum LazyLoadState {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  UNLOADING = 'unloading',
  ERROR = 'error',
}

/**
 * Runtime bootstrap manager
 * Canonical interface for runtime bootstrap lifecycle management
 */
export interface RuntimeBootstrapManager {
  readonly managerId: string;

  /**
   * Bootstrap runtime
   */
  bootstrapRuntime(
    config: RuntimeBootstrapConfig
  ): Promise<RuntimeBootstrapResult>;

  /**
   * Get bootstrap progress
   */
  getBootstrapProgress(): BootstrapProgress;

  /**
   * Cancel bootstrap
   */
  cancelBootstrap(): Promise<void>;

  /**
   * Get runtime status
   */
  getRuntimeStatus(): RuntimeStatus;
}

/**
 * Runtime bootstrap config
 */
export interface RuntimeBootstrapConfig {
  readonly adapters: readonly AdapterFactoryConfig[];
  readonly bootstrapOrder: BootstrapOrder;
  readonly parallelization: ParallelizationConfig;
  readonly timeoutMs?: number;
}

/**
 * Bootstrap order
 */
export enum BootstrapOrder {
  DEPENDENCY_ORDER = 'dependency_order',
  PRIORITY_ORDER = 'priority_order',
  CUSTOM_ORDER = 'custom_order',
}

/**
 * Parallelization config
 */
export interface ParallelizationConfig {
  readonly enabled: boolean;
  readonly maxParallel?: number;
  readonly parallelGroups?: readonly AdapterId[][];
}

/**
 * Runtime bootstrap result
 */
export interface RuntimeBootstrapResult {
  readonly success: boolean;
  readonly bootstrappedAt: Date;
  readonly durationMs: number;
  readonly adapterResults: readonly AdapterFactoryResult[];
  readonly error?: FactoryError;
}

/**
 * Bootstrap progress
 */
export interface BootstrapProgress {
  readonly totalAdapters: number;
  readonly bootstrappedAdapters: number;
  readonly failedAdapters: number;
  readonly progress: number; // 0-100
  readonly currentAdapter?: AdapterId;
  readonly estimatedTimeRemainingMs?: number;
}

/**
 * Runtime status
 */
export interface RuntimeStatus {
  readonly status: RuntimeState;
  readonly healthy: boolean;
  readonly adapterCount: number;
  readonly readyAdapterCount: number;
  readonly errorAdapterCount: number;
}

/**
 * Runtime state
 */
export enum RuntimeState {
  INITIALIZING = 'initializing',
  BOOTSTRAPPING = 'bootstrapping',
  READY = 'ready',
  DEGRADED = 'degraded',
  ERROR = 'error',
  SHUTTING_DOWN = 'shutting_down',
  SHUTDOWN = 'shutdown',
}

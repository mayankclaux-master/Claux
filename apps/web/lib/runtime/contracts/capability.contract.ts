/**
 * Runtime Capability Contracts
 * 
 * Canonical interfaces for runtime capability discovery and negotiation
 * Enables heterogeneous worker/runtime compatibility
 */

/**
 * Capability type
 */
export enum CapabilityType {
  CHECKPOINTING = 'checkpointing',
  CANCELLATION = 'cancellation',
  RESUMABILITY = 'resumability',
  STREAMING = 'streaming',
  RETRIES = 'retries',
  DISTRIBUTED_EXECUTION = 'distributed_execution',
  PARALLEL_EXECUTION = 'parallel_execution',
  ROLLBACK = 'rollback',
  COMPENSATION = 'compensation',
  TRACING = 'tracing',
  DETERMINISM = 'determinism',
  RESOURCE_LIMITS = 'resource_limits',
  METRICS = 'metrics',
  LOGGING = 'logging',
  EVENT_PUBLISHING = 'event_publishing',
}

/**
 * Capability level
 */
export enum CapabilityLevel {
  NONE = 'none',
  BASIC = 'basic',
  STANDARD = 'standard',
  ADVANCED = 'advanced',
}

/**
 * Capability descriptor
 */
export interface CapabilityDescriptor {
  readonly type: CapabilityType;
  readonly level: CapabilityLevel;
  readonly version: string;
  readonly enabled: boolean;
  readonly constraints?: CapabilityConstraints;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Capability constraints
 */
export interface CapabilityConstraints {
  readonly maxConcurrentOperations?: number;
  readonly maxDataSizeBytes?: number;
  readonly timeoutMs?: number;
  readonly supportedFormats?: readonly string[];
  readonly customConstraints?: Record<string, unknown>;
}

/**
 * Runtime capabilities
 * Canonical interface for runtime capability declaration
 */
export interface RuntimeCapabilities {
  readonly runtimeId: string;
  readonly runtimeVersion: string;
  readonly capabilities: readonly CapabilityDescriptor[];
  readonly supportedContractVersions: readonly string[];
  readonly customCapabilities?: Record<string, unknown>;
}

/**
 * Worker capabilities
 * Canonical interface for worker capability declaration
 */
export interface WorkerCapabilities {
  readonly workerId: string;
  readonly workerType: string;
  readonly workerVersion: string;
  readonly capabilities: readonly CapabilityDescriptor[];
  readonly supportedTaskTypes: readonly string[];
  readonly resourceProfile: ResourceProfile;
  readonly customCapabilities?: Record<string, unknown>;
}

/**
 * Execution capabilities
 * Canonical interface for execution capability declaration
 */
export interface ExecutionCapabilities {
  readonly executionId: string;
  readonly capabilities: readonly CapabilityDescriptor[];
  readonly requiredCapabilities: readonly CapabilityType[];
  readonly optionalCapabilities: readonly CapabilityType[];
  readonly capabilityNegotiation: CapabilityNegotiation;
}

/**
 * Streaming capabilities
 */
export interface StreamingCapabilities {
  readonly supportedStreamTypes: readonly StreamType[];
  readonly supportsBackpressure: boolean;
  readonly supportsResumption: boolean;
  readonly supportsCancellation: boolean;
  readonly maxConcurrentStreams: number;
  readonly streamBufferSizeBytes: number;
}

/**
 * Stream type
 */
export enum StreamType {
  TOKEN = 'token',
  PROGRESS = 'progress',
  EVENT = 'event',
  LOG = 'log',
  OUTPUT = 'output',
  CUSTOM = 'custom',
}

/**
 * Recovery capabilities
 */
export interface RecoveryCapabilities {
  readonly checkpointing: CapabilityLevel;
  readonly rollback: CapabilityLevel;
  readonly compensation: CapabilityLevel;
  readonly maxCheckpoints: number;
  readonly checkpointRetentionMs: number;
  readonly supportsDeterministicRecovery: boolean;
}

/**
 * Tracing capabilities
 */
export interface TracingCapabilities {
  readonly distributedTracing: boolean;
  readonly spanCollection: boolean;
  readonly traceSampling: boolean;
  readonly tracePropagationFormat: readonly string[];
  readonly maxTraceDepth: number;
}

/**
 * Resource profile
 */
export interface ResourceProfile {
  readonly cpuCores: number;
  readonly memoryMb: number;
  readonly storageMb: number;
  readonly networkBandwidthMbps: number;
  readonly gpuAvailable: boolean;
  readonly gpuMemoryMb?: number;
  readonly customResources?: Record<string, number>;
}

/**
 * Capability negotiation
 */
export interface CapabilityNegotiation {
  readonly strategy: NegotiationStrategy;
  readonly fallbackStrategy?: NegotiationStrategy;
  readonly strictMode: boolean;
}

/**
 * Negotiation strategy
 */
export enum NegotiationStrategy {
  REQUIRED = 'required',
  PREFERRED = 'preferred',
  OPTIONAL = 'optional',
  BEST_EFFORT = 'best_effort',
}

/**
 * Capability match result
 */
export interface CapabilityMatchResult {
  readonly matched: boolean;
  readonly matchedCapabilities: readonly CapabilityType[];
  readonly unmatchedCapabilities: readonly CapabilityType[];
  readonly partialMatches: readonly PartialCapabilityMatch[];
  readonly negotiationResult: NegotiationResult;
}

/**
 * Partial capability match
 */
export interface PartialCapabilityMatch {
  readonly type: CapabilityType;
  readonly requiredLevel: CapabilityLevel;
  readonly availableLevel: CapabilityLevel;
  readonly compatible: boolean;
}

/**
 * Negotiation result
 */
export interface NegotiationResult {
  readonly strategy: NegotiationStrategy;
  readonly success: boolean;
  readonly fallbackUsed: boolean;
  readonly warnings: readonly string[];
}

/**
 * Capability registry
 * Canonical interface for capability registration and discovery
 */
export interface CapabilityRegistry {
  /**
   * Register runtime capabilities
   */
  registerRuntime(capabilities: RuntimeCapabilities): Promise<void>;

  /**
   * Register worker capabilities
   */
  registerWorker(capabilities: WorkerCapabilities): Promise<void>;

  /**
   * Get runtime capabilities
   */
  getRuntimeCapabilities(runtimeId: string): Promise<RuntimeCapabilities | null>;

  /**
   * Get worker capabilities
   */
  getWorkerCapabilities(workerId: string): Promise<WorkerCapabilities | null>;

  /**
   * Find workers by capability
   */
  findWorkersByCapability(
    capabilityType: CapabilityType,
    minLevel?: CapabilityLevel
  ): Promise<readonly WorkerCapabilities[]>;

  /**
   * Find runtimes by capability
   */
  findRuntimesByCapability(
    capabilityType: CapabilityType,
    minLevel?: CapabilityLevel
  ): Promise<readonly RuntimeCapabilities[]>;

  /**
   * Match capabilities
   */
  matchCapabilities(
    required: readonly CapabilityDescriptor[],
    available: readonly CapabilityDescriptor[],
    negotiation?: CapabilityNegotiation
  ): CapabilityMatchResult;

  /**
   * Validate capability compatibility
   */
  validateCompatibility(
    execution: ExecutionCapabilities,
    worker: WorkerCapabilities
  ): Promise<CompatibilityValidationResult>;

  /**
   * List all registered capabilities
   */
  listCapabilities(): Promise<readonly CapabilityDescriptor[]>;

  /**
   * Unregister runtime
   */
  unregisterRuntime(runtimeId: string): Promise<void>;

  /**
   * Unregister worker
   */
  unregisterWorker(workerId: string): Promise<void>;
}

/**
 * Compatibility validation result
 */
export interface CompatibilityValidationResult {
  readonly compatible: boolean;
  readonly score: number; // 0-100
  readonly matchedCapabilities: readonly CapabilityType[];
  readonly missingCapabilities: readonly CapabilityType[];
  readonly degradedCapabilities: readonly CapabilityType[];
  readonly recommendations: readonly string[];
}

/**
 * Capability query
 */
export interface CapabilityQuery {
  readonly capabilityTypes?: readonly CapabilityType[];
  readonly minLevel?: CapabilityLevel;
  readonly enabled?: boolean;
  readonly customFilters?: Record<string, unknown>;
}

/**
 * Capability discovery
 * Canonical interface for capability discovery
 */
export interface CapabilityDiscovery {
  /**
   * Discover runtime capabilities
   */
  discoverRuntime(runtimeId: string): Promise<RuntimeCapabilities>;

  /**
   * Discover worker capabilities
   */
  discoverWorker(workerId: string): Promise<WorkerCapabilities>;

  /**
   * Discover capabilities by type
   */
  discoverByType(
    capabilityType: CapabilityType,
    query?: CapabilityQuery
  ): Promise<readonly CapabilityDescriptor[]>;

  /**
   * Auto-discover all capabilities
   */
  autoDiscover(): Promise<{
    readonly runtimes: readonly RuntimeCapabilities[];
    readonly workers: readonly WorkerCapabilities[];
  }>;

  /**
   * Validate discovered capabilities
   */
  validateCapabilities(capabilities: RuntimeCapabilities | WorkerCapabilities): Promise<ValidationResult>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Capability provider
 * Canonical interface for capability provision
 */
export interface CapabilityProvider {
  /**
   * Provide capability
   */
  provideCapability(
    capabilityType: CapabilityType,
    context: CapabilityContext
  ): Promise<CapabilityProvisionResult>;

  /**
   * Revoke capability
   */
  revokeCapability(
    capabilityId: string
  ): Promise<void>;

  /**
   * Check capability availability
   */
  checkAvailability(
    capabilityType: CapabilityType
  ): Promise<boolean>;

  /**
   * Get capability status
   */
  getCapabilityStatus(capabilityId: string): Promise<CapabilityStatus>;
}

/**
 * Capability context
 */
export interface CapabilityContext {
  readonly executionId?: string;
  readonly taskId?: string;
  readonly workerId?: string;
  readonly runtimeId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Capability provision result
 */
export interface CapabilityProvisionResult {
  readonly capabilityId: string;
  readonly success: boolean;
  readonly provisionedAt: Date;
  readonly expiresAt?: Date;
  readonly error?: CapabilityProvisionError;
}

/**
 * Capability provision error
 */
export interface CapabilityProvisionError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Capability status
 */
export interface CapabilityStatus {
  readonly capabilityId: string;
  readonly type: CapabilityType;
  readonly status: 'active' | 'inactive' | 'expiring' | 'expired';
  readonly provisionedAt: Date;
  readonly expiresAt?: Date;
  readonly usageStats?: CapabilityUsageStats;
}

/**
 * Capability usage stats
 */
export interface CapabilityUsageStats {
  readonly usageCount: number;
  readonly lastUsedAt: Date;
  readonly totalDurationMs: number;
  readonly averageDurationMs: number;
}

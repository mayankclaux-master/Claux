/**
 * Runtime Checkpoint Contract
 * 
 * Canonical interfaces for checkpointing and resumability
 * Framework-agnostic, database-agnostic, queue-agnostic abstractions
 */

/**
 * Unique identifier for checkpoints
 */
export type CheckpointId = string;

/**
 * Checkpoint type
 */
export enum CheckpointType {
  EXECUTION = 'execution',
  TASK = 'task',
  WORKFLOW = 'workflow',
  CUSTOM = 'custom',
}

/**
 * Checkpoint status
 */
export enum CheckpointStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CONSUMED = 'consumed',
  FAILED = 'failed',
}

/**
 * Runtime checkpoint
 * Canonical interface for checkpoints
 */
export interface RuntimeCheckpoint {
  readonly checkpointId: CheckpointId;
  readonly checkpointType: CheckpointType;
  readonly targetId: string; // executionId, taskId, etc.
  readonly timestamp: Date;
  readonly status: CheckpointStatus;
  readonly state: CheckpointState;
  readonly metadata?: CheckpointMetadata;
  readonly expiresAt?: Date;
  readonly traceId?: string;
}

/**
 * Checkpoint state
 */
export interface CheckpointState {
  readonly version: string;
  readonly data: Record<string, unknown>;
  readonly completedSteps: readonly string[];
  readonly currentStep?: string;
  readonly progress: number;
  readonly customFields?: Record<string, unknown>;
}

/**
 * Checkpoint metadata
 */
export interface CheckpointMetadata {
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly tags?: readonly string[];
  readonly description?: string;
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Checkpoint options
 */
export interface CheckpointOptions {
  readonly ttlMs?: number; // Time to live
  readonly compress?: boolean;
  readonly encrypt?: boolean;
  readonly includeMetrics?: boolean;
  readonly includeLogs?: boolean;
  readonly customOptions?: Record<string, unknown>;
}

/**
 * Checkpoint result
 */
export interface CheckpointResult {
  readonly checkpointId: CheckpointId;
  readonly success: boolean;
  readonly createdAt: Date;
  readonly error?: CheckpointError;
}

/**
 * Checkpoint error
 */
export interface CheckpointError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Checkpoint manager
 * Canonical interface for checkpoint management
 */
export interface CheckpointManager {
  /**
   * Create checkpoint
   */
  createCheckpoint(
    targetId: string,
    checkpointType: CheckpointType,
    state: CheckpointState,
    options?: CheckpointOptions
  ): Promise<CheckpointResult>;

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(checkpointId: CheckpointId): Promise<RuntimeCheckpoint | null>;

  /**
   * Get latest checkpoint for target
   */
  getLatestCheckpoint(
    targetId: string,
    checkpointType: CheckpointType
  ): Promise<RuntimeCheckpoint | null>;

  /**
   * Get all checkpoints for target
   */
  getCheckpoints(
    targetId: string,
    checkpointType?: CheckpointType
  ): Promise<readonly RuntimeCheckpoint[]>;

  /**
   * Update checkpoint
   */
  updateCheckpoint(
    checkpointId: CheckpointId,
    state: CheckpointState
  ): Promise<CheckpointResult>;

  /**
   * Delete checkpoint
   */
  deleteCheckpoint(checkpointId: CheckpointId): Promise<void>;

  /**
   * Delete checkpoints for target
   */
  deleteCheckpoints(
    targetId: string,
    checkpointType?: CheckpointType
  ): Promise<number>;

  /**
   * Restore from checkpoint
   */
  restoreCheckpoint(
    checkpointId: CheckpointId
  ): Promise<CheckpointRestoreResult>;

  /**
   * Validate checkpoint
   */
  validateCheckpoint(checkpointId: CheckpointId): Promise<CheckpointValidationResult>;

  /**
   * List checkpoints
   */
  listCheckpoints(filter?: CheckpointFilter): Promise<readonly RuntimeCheckpoint[]>;

  /**
   * Expire checkpoints
   */
  expireCheckpoints(beforeDate: Date): Promise<number>;
}

/**
 * Checkpoint restore result
 */
export interface CheckpointRestoreResult {
  readonly checkpointId: CheckpointId;
  readonly success: boolean;
  readonly restoredAt: Date;
  readonly restoredState: CheckpointState;
  readonly error?: CheckpointError;
}

/**
 * Checkpoint validation result
 */
export interface CheckpointValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Checkpoint filter
 */
export interface CheckpointFilter {
  readonly checkpointType?: CheckpointType;
  readonly targetId?: string;
  readonly status?: CheckpointStatus;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
  readonly expiresAfter?: Date;
  readonly expiresBefore?: Date;
  readonly tags?: readonly string[];
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Checkpoint storage
 * Canonical interface for checkpoint storage
 */
export interface CheckpointStorage {
  /**
   * Store checkpoint
   */
  store(checkpoint: RuntimeCheckpoint): Promise<CheckpointStorageResult>;

  /**
   * Retrieve checkpoint
   */
  retrieve(checkpointId: CheckpointId): Promise<RuntimeCheckpoint | null>;

  /**
   * Query checkpoints
   */
  query(filter: CheckpointFilter): Promise<readonly RuntimeCheckpoint[]>;

  /**
   * Delete checkpoint
   */
  delete(checkpointId: CheckpointId): Promise<void>;

  /**
   * Delete batch
   */
  deleteBatch(filter: CheckpointFilter): Promise<number>;

  /**
   * Count checkpoints
   */
  count(filter?: CheckpointFilter): Promise<number>;
}

/**
 * Checkpoint storage result
 */
export interface CheckpointStorageResult {
  readonly checkpointId: CheckpointId;
  readonly success: boolean;
  readonly storedAt: Date;
  readonly error?: CheckpointStorageError;
}

/**
 * Checkpoint storage error
 */
export interface CheckpointStorageError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Checkpoint serializer
 * Canonical interface for checkpoint serialization
 */
export interface CheckpointSerializer {
  /**
   * Serialize checkpoint state
   */
  serialize(state: CheckpointState): Promise<SerializedCheckpoint>;

  /**
   * Deserialize checkpoint state
   */
  deserialize(serialized: SerializedCheckpoint): Promise<CheckpointState>;

  /**
   * Compress checkpoint
   */
  compress(serialized: SerializedCheckpoint): Promise<CompressedCheckpoint>;

  /**
   * Decompress checkpoint
   */
  decompress(compressed: CompressedCheckpoint): Promise<SerializedCheckpoint>;

  /**
   * Encrypt checkpoint
   */
  encrypt(serialized: SerializedCheckpoint): Promise<EncryptedCheckpoint>;

  /**
   * Decrypt checkpoint
   */
  decrypt(encrypted: EncryptedCheckpoint): Promise<SerializedCheckpoint>;
}

/**
 * Serialized checkpoint
 */
export interface SerializedCheckpoint {
  readonly version: string;
  readonly format: string;
  readonly data: string;
  readonly checksum?: string;
  readonly serializedAt: Date;
}

/**
 * Compressed checkpoint
 */
export interface CompressedCheckpoint {
  readonly originalSize: number;
  readonly compressedSize: number;
  readonly compressionAlgorithm: string;
  readonly data: string;
  readonly compressedAt: Date;
}

/**
 * Encrypted checkpoint
 */
export interface EncryptedCheckpoint {
  readonly encryptionAlgorithm: string;
  readonly keyId: string;
  readonly iv: string;
  readonly data: string;
  readonly encryptedAt: Date;
}

/**
 * Checkpoint policy
 */
export interface CheckpointPolicy {
  readonly policyId: string;
  readonly checkpointType: CheckpointType;
  readonly autoCheckpoint: boolean;
  readonly checkpointIntervalMs: number;
  readonly maxCheckpointsPerTarget: number;
  readonly ttlMs: number;
  readonly compressionEnabled: boolean;
  readonly encryptionEnabled: boolean;
}

/**
 * Checkpoint policy manager
 * Canonical interface for checkpoint policy management
 */
export interface CheckpointPolicyManager {
  /**
   * Get policy for checkpoint type
   */
  getPolicy(checkpointType: CheckpointType): Promise<CheckpointPolicy | null>;

  /**
   * Set policy
   */
  setPolicy(policy: CheckpointPolicy): Promise<void>;

  /**
   * Remove policy
   */
  removePolicy(checkpointType: CheckpointType): Promise<void>;

  /**
   * List policies
   */
  listPolicies(): Promise<readonly CheckpointPolicy[]>;

  /**
   * Evaluate policy
   */
  evaluatePolicy(
    checkpointType: CheckpointType,
    targetId: string
  ): Promise<PolicyEvaluationResult>;
}

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  readonly shouldCheckpoint: boolean;
  readonly reason: string;
  readonly options: CheckpointOptions;
}

/**
 * Checkpoint metrics
 */
export interface CheckpointMetrics {
  readonly totalCheckpoints: number;
  readonly activeCheckpoints: number;
  readonly expiredCheckpoints: number;
  readonly consumedCheckpoints: number;
  readonly averageCheckpointSizeBytes: number;
  readonly totalCheckpointSizeBytes: number;
  readonly checkpointsByType: Record<CheckpointType, number>;
}

/**
 * Checkpoint statistics
 */
export interface CheckpointStatistics {
  readonly metrics: CheckpointMetrics;
  readonly recentCheckpoints: readonly RuntimeCheckpoint[];
  readonly checkpointRatePerMinute: number;
  readonly restoreSuccessRate: number;
}

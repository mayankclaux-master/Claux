/**
 * Checkpoint Storage Adapter Contracts
 * 
 * Pure abstractions for checkpoint storage
 * No S3/Postgres/Redis dependencies
 */

import type { AdapterId, ProviderId } from '../types';

/**
 * Checkpoint storage adapter
 * Canonical interface for checkpoint storage operations
 */
export interface CheckpointStorageAdapter {
  readonly adapterId: AdapterId;
  readonly providerType: string;
  readonly capabilities: CheckpointStorageCapabilities;

  /**
   * Initialize adapter
   */
  initialize(config: CheckpointStorageAdapterConfig): Promise<void>;

  /**
   * Store checkpoint
   */
  storeCheckpoint(
    checkpoint: StoredCheckpoint
  ): Promise<CheckpointStorageResult>;

  /**
   * Store checkpoint batch
   */
  storeCheckpointBatch(
    checkpoints: readonly StoredCheckpoint[]
  ): Promise<readonly CheckpointStorageResult[]>;

  /**
   * Retrieve checkpoint
   */
  retrieveCheckpoint(
    checkpointId: string
  ): Promise<StoredCheckpoint | null>;

  /**
   * Retrieve checkpoint by execution
   */
  retrieveByExecution(
    executionId: string,
    options?: CheckpointQueryOptions
  ): Promise<readonly StoredCheckpoint[]>;

  /**
   * List checkpoints
   */
  listCheckpoints(filter?: CheckpointFilter): Promise<readonly StoredCheckpoint[]>;

  /**
   * Delete checkpoint
   */
  deleteCheckpoint(checkpointId: string): Promise<void>;

  /**
   * Delete by execution
   */
  deleteByExecution(executionId: string): Promise<void>;

  /**
   * Apply retention policy
   */
  applyRetentionPolicy(policy: CheckpointRetentionPolicy): Promise<RetentionPolicyResult>;

  /**
   * Get checkpoint lineage
   */
  getLineage(checkpointId: string): Promise<CheckpointLineage>;

  /**
   * Health check
   */
  healthCheck(): Promise<CheckpointStorageHealthStatus>;

  /**
   * Shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Stored checkpoint
 */
export interface StoredCheckpoint {
  readonly checkpointId: string;
  readonly executionId: string;
  readonly checkpointType: CheckpointType;
  readonly state: CheckpointState;
  readonly metadata: CheckpointMetadata;
  readonly serializedData: SerializedCheckpoint;
  readonly compressionInfo?: CompressionInfo;
  readonly encryptionInfo?: EncryptionInfo;
  readonly storedAt: Date;
  readonly expiresAt?: Date;
  readonly sizeBytes: number;
}

/**
 * Checkpoint type
 */
export enum CheckpointType {
  INCREMENTAL = 'incremental',
  SNAPSHOT = 'snapshot',
  DELTA = 'delta',
  HYBRID = 'hybrid',
}

/**
 * Checkpoint state
 */
export interface CheckpointState {
  readonly executionId: string;
  readonly stateData: Record<string, unknown>;
  readonly taskStates: Record<string, TaskCheckpointState>;
  readonly timestamp: Date;
  readonly sequence: number;
}

/**
 * Task checkpoint state
 */
export interface TaskCheckpointState {
  readonly taskId: string;
  readonly status: string;
  readonly output?: unknown;
  readonly error?: unknown;
}

/**
 * Checkpoint metadata
 */
export interface CheckpointMetadata {
  readonly source: string;
  readonly version: string;
  readonly tags: readonly string[];
  readonly customMetadata?: Record<string, unknown>;
}

/**
 * Serialized checkpoint
 */
export interface SerializedCheckpoint {
  readonly format: SerializationFormat;
  readonly data: string | ArrayBuffer;
  readonly checksum?: string;
}

/**
 * Serialization format
 */
export enum SerializationFormat {
  JSON = 'json',
  PROTOBUF = 'protobuf',
  AVRO = 'avro',
  MSGPACK = 'msgpack',
  CUSTOM = 'custom',
}

/**
 * Compression info
 */
export interface CompressionInfo {
  readonly algorithm: CompressionAlgorithm;
  readonly originalSizeBytes: number;
  readonly compressedSizeBytes: number;
  readonly compressionRatio: number;
}

/**
 * Compression algorithm
 */
export enum CompressionAlgorithm {
  NONE = 'none',
  GZIP = 'gzip',
  SNAPPY = 'snappy',
  LZ4 = 'lz4',
  ZSTD = 'zstd',
}

/**
 * Encryption info
 */
export interface EncryptionInfo {
  readonly algorithm: EncryptionAlgorithm;
  readonly keyId: string;
  readonly encryptedAt: Date;
}

/**
 * Encryption algorithm
 */
export enum EncryptionAlgorithm {
  NONE = 'none',
  AES_256_GCM = 'aes_256_gcm',
  AES_256_CBC = 'aes_256_cbc',
  CUSTOM = 'custom',
}

/**
 * Checkpoint storage result
 */
export interface CheckpointStorageResult {
  readonly checkpointId: string;
  readonly success: boolean;
  readonly storedAt: Date;
  readonly sizeBytes: number;
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
 * Checkpoint query options
 */
export interface CheckpointQueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly after?: Date;
  readonly before?: Date;
  readonly checkpointType?: CheckpointType;
}

/**
 * Checkpoint filter
 */
export interface CheckpointFilter {
  readonly executionId?: string;
  readonly checkpointType?: CheckpointType;
  readonly tags?: readonly string[];
  readonly after?: Date;
  readonly before?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Checkpoint retention policy
 */
export interface CheckpointRetentionPolicy {
  readonly policyId: string;
  readonly scope: RetentionPolicyScope;
  readonly scopeId: string;
  readonly maxAgeMs: number;
  readonly maxCount?: number;
  readonly maxSizeBytes?: number;
  readonly checkpointTypes?: readonly CheckpointType[];
}

/**
 * Retention policy scope
 */
export enum RetentionPolicyScope {
  EXECUTION = 'execution',
  WORKSPACE = 'workspace',
  TENANT = 'tenant',
  GLOBAL = 'global',
}

/**
 * Retention policy result
 */
export interface RetentionPolicyResult {
  readonly policyId: string;
  readonly deletedCount: number;
  readonly freedSpaceBytes: number;
  readonly executedAt: Date;
}

/**
 * Checkpoint lineage
 */
export interface CheckpointLineage {
  readonly checkpointId: string;
  readonly parentCheckpointId?: string;
  readonly childCheckpointIds: readonly string[];
  readonly lineageDepth: number;
  readonly lineagePath: readonly string[];
}

/**
 * Checkpoint storage capabilities
 */
export interface CheckpointStorageCapabilities {
  readonly supportedCheckpointTypes: readonly CheckpointType[];
  readonly supportedSerializationFormats: readonly SerializationFormat[];
  readonly supportedCompressionAlgorithms: readonly CompressionAlgorithm[];
  readonly supportedEncryptionAlgorithms: readonly EncryptionAlgorithm[];
  readonly supportsIncremental: boolean;
  readonly supportsCompression: boolean;
  readonly supportsEncryption: boolean;
  readonly supportsRetentionPolicies: boolean;
  readonly supportsLineage: boolean;
  readonly maxCheckpointSizeBytes?: number;
  readonly maxRetentionMs?: number;
}

/**
 * Checkpoint storage adapter config
 */
export interface CheckpointStorageAdapterConfig {
  readonly storageOptions: StorageOptions;
  readonly serializationOptions: SerializationOptions;
  readonly compressionOptions: CompressionOptions;
  readonly encryptionOptions: EncryptionOptions;
  readonly retentionOptions: RetentionOptions;
}

/**
 * Storage options
 */
export interface StorageOptions {
  readonly storageType: StorageType;
  readonly connectionString?: string;
  readonly bucketName?: string;
  readonly prefix?: string;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
}

/**
 * Storage type
 */
export enum StorageType {
  S3 = 's3',
  AZURE_BLOB = 'azure_blob',
  GCP_STORAGE = 'gcp_storage',
  POSTGRES = 'postgres',
  REDIS = 'redis',
  FILE_SYSTEM = 'file_system',
  CUSTOM = 'custom',
}

/**
 * Serialization options
 */
export interface SerializationOptions {
  readonly format: SerializationFormat;
  readonly schema?: string;
  readonly customSerializer?: string;
}

/**
 * Compression options
 */
export interface CompressionOptions {
  readonly enabled: boolean;
  readonly algorithm: CompressionAlgorithm;
  readonly level?: number;
}

/**
 * Encryption options
 */
export interface EncryptionOptions {
  readonly enabled: boolean;
  readonly algorithm: EncryptionAlgorithm;
  readonly keyId: string;
  readonly encryptionProvider?: string;
}

/**
 * Retention options
 */
export interface RetentionOptions {
  readonly defaultMaxAgeMs: number;
  readonly defaultMaxCount?: number;
  readonly autoCleanupEnabled: boolean;
  readonly cleanupIntervalMs?: number;
}

/**
 * Checkpoint storage health status
 */
export interface CheckpointStorageHealthStatus {
  readonly healthy: boolean;
  readonly connected: boolean;
  readonly totalCheckpoints: number;
  readonly totalSizeBytes: number;
  readonly storageUtilization: number; // 0-100
  readonly errorCount: number;
  readonly lastError?: CheckpointStorageError;
}

/**
 * Checkpoint provider
 * Canonical interface for checkpoint provider implementation
 */
export interface CheckpointProvider {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;

  /**
   * Create adapter
   */
  createAdapter(config: CheckpointStorageAdapterConfig): CheckpointStorageAdapter;

  /**
   * Validate config
   */
  validateConfig(config: CheckpointStorageAdapterConfig): Promise<CheckpointConfigValidationResult>;

  /**
   * Get capabilities
   */
  getCapabilities(): CheckpointStorageCapabilities;

  /**
   * Get provider metadata
   */
  getMetadata(): CheckpointProviderMetadata;
}

/**
 * Checkpoint config validation result
 */
export interface CheckpointConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Checkpoint provider metadata
 */
export interface CheckpointProviderMetadata {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly version: string;
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly string[];
}

/**
 * Checkpoint serializer
 * Canonical interface for checkpoint serialization
 */
export interface CheckpointSerializer {
  readonly serializerId: string;
  readonly format: SerializationFormat;

  /**
   * Serialize checkpoint
   */
  serialize(checkpoint: StoredCheckpoint): Promise<SerializedCheckpoint>;

  /**
   * Deserialize checkpoint
   */
  deserialize(data: SerializedCheckpoint): Promise<StoredCheckpoint>;

  /**
   * Validate serialization
   */
  validate(data: SerializedCheckpoint): Promise<boolean>;
}

/**
 * Checkpoint compressor
 * Canonical interface for checkpoint compression
 */
export interface CheckpointCompressor {
  readonly compressorId: string;
  readonly algorithm: CompressionAlgorithm;

  /**
   * Compress data
   */
  compress(data: string | ArrayBuffer): Promise<CompressedData>;

  /**
   * Decompress data
   */
  decompress(data: string | ArrayBuffer): Promise<string | ArrayBuffer>;

  /**
   * Get compression ratio
   */
  getCompressionRatio(originalSize: number, compressedSize: number): number;
}

/**
 * Compressed data
 */
export interface CompressedData {
  readonly data: string | ArrayBuffer;
  readonly algorithm: CompressionAlgorithm;
  readonly originalSizeBytes: number;
  readonly compressedSizeBytes: number;
}

/**
 * Checkpoint encryptor
 * Canonical interface for checkpoint encryption
 */
export interface CheckpointEncryptor {
  readonly encryptorId: string;
  readonly algorithm: EncryptionAlgorithm;

  /**
   * Encrypt data
   */
  encrypt(data: string | ArrayBuffer, keyId: string): Promise<EncryptedData>;

  /**
   * Decrypt data
   */
  decrypt(data: string | ArrayBuffer, keyId: string): Promise<string | ArrayBuffer>;

  /**
   * Rotate key
   */
  rotateKey(oldKeyId: string, newKeyId: string): Promise<void>;
}

/**
 * Encrypted data
 */
export interface EncryptedData {
  readonly data: string | ArrayBuffer;
  readonly algorithm: EncryptionAlgorithm;
  readonly keyId: string;
  readonly encryptedAt: Date;
}

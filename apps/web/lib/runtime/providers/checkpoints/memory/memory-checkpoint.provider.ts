/**
 * Memory Checkpoint Provider
 * 
 * Reference implementation of CheckpointStorageAdapter for in-memory checkpoint semantics.
 * Validates checkpoint storage adapter contracts and runtime checkpoint semantics.
 * 
 * This is a semantic validation provider, NOT production-ready.
 * For production, use S3, Postgres, Redis, or Azure Blob.
 * 
 * Implements:
 * - checkpoint creation
 * - checkpoint restore
 * - checkpoint validation
 * - resumability
 * - snapshot metadata
 */

import type {
  CheckpointStorageAdapter,
  CheckpointStorageAdapterConfig,
  StoredCheckpoint,
  CheckpointStorageResult,
  CheckpointQueryOptions,
  CheckpointFilter,
  CheckpointRetentionPolicy,
  RetentionPolicyResult,
  CheckpointLineage,
  CheckpointStorageHealthStatus,
  CheckpointStorageCapabilities,
  CheckpointType,
  CheckpointState,
  CheckpointMetadata,
  SerializedCheckpoint,
  CompressionInfo,
  EncryptionInfo,
} from '../../../adapters';
import {
  CheckpointType as CheckpointTypeEnum,
  SerializationFormat,
  CompressionAlgorithm,
  EncryptionAlgorithm,
  StorageType,
  RetentionPolicyScope,
} from '../../../adapters';

export interface MemoryCheckpointProviderConfig extends CheckpointStorageAdapterConfig {
  readonly maxCheckpoints?: number;
  readonly maxCheckpointSizeBytes?: number;
}

export class MemoryCheckpointProvider implements CheckpointStorageAdapter {
  readonly adapterId: string;
  readonly providerType: string = 'memory';
  readonly capabilities: CheckpointStorageCapabilities;

  private initialized: boolean = false;
  private checkpoints: Map<string, StoredCheckpoint> = new Map();
  private executionCheckpoints: Map<string, string[]> = new Map(); // executionId -> checkpointIds
  private checkpointIdCounter: number = 0;
  private config: CheckpointStorageAdapterConfig;
  private maxCheckpoints: number;
  private maxCheckpointSizeBytes: number;

  constructor(config: CheckpointStorageAdapterConfig) {
    this.adapterId = `memory-checkpoint-${Date.now()}`;
    this.config = config;
    this.maxCheckpoints = (config as MemoryCheckpointProviderConfig).maxCheckpoints ?? 1000;
    this.maxCheckpointSizeBytes = (config as MemoryCheckpointProviderConfig).maxCheckpointSizeBytes ?? 10 * 1024 * 1024; // 10MB default
    this.capabilities = {
      supportedCheckpointTypes: [CheckpointTypeEnum.INCREMENTAL, CheckpointTypeEnum.SNAPSHOT, CheckpointTypeEnum.DELTA, CheckpointTypeEnum.HYBRID],
      supportedSerializationFormats: [SerializationFormat.JSON],
      supportedCompressionAlgorithms: [CompressionAlgorithm.NONE],
      supportedEncryptionAlgorithms: [EncryptionAlgorithm.NONE],
      supportsIncremental: true,
      supportsCompression: false,
      supportsEncryption: false,
      supportsRetentionPolicies: true,
      supportsLineage: true,
      maxCheckpointSizeBytes: this.maxCheckpointSizeBytes,
    };
  }

  // =====================================================
  // CheckpointStorageAdapter Implementation
  // =====================================================

  async initialize(config: CheckpointStorageAdapterConfig): Promise<void> {
    this.config = config;
    this.initialized = true;
  }

  async storeCheckpoint(checkpoint: StoredCheckpoint): Promise<CheckpointStorageResult> {
    if (!this.initialized) {
      throw new Error('Checkpoint provider not initialized');
    }

    if (this.checkpoints.size >= this.maxCheckpoints) {
      return {
        checkpointId: checkpoint.checkpointId,
        success: false,
        storedAt: new Date(),
        sizeBytes: 0,
        error: {
          code: 'CAPACITY_EXCEEDED',
          message: 'Maximum checkpoint capacity reached',
        },
      };
    }

    // Check checkpoint size
    const dataSize = JSON.stringify(checkpoint.serializedData).length;
    if (dataSize > this.maxCheckpointSizeBytes) {
      return {
        checkpointId: checkpoint.checkpointId,
        success: false,
        storedAt: new Date(),
        sizeBytes: dataSize,
        error: {
          code: 'SIZE_EXCEEDED',
          message: 'Checkpoint size exceeds maximum allowed',
        },
      };
    }

    // Store checkpoint
    this.checkpoints.set(checkpoint.checkpointId, checkpoint);

    // Track by execution
    const executionCheckpoints = this.executionCheckpoints.get(checkpoint.executionId) ?? [];
    executionCheckpoints.push(checkpoint.checkpointId);
    this.executionCheckpoints.set(checkpoint.executionId, executionCheckpoints);

    return {
      checkpointId: checkpoint.checkpointId,
      success: true,
      storedAt: new Date(),
      sizeBytes: dataSize,
    };
  }

  async storeCheckpointBatch(checkpoints: readonly StoredCheckpoint[]): Promise<readonly CheckpointStorageResult[]> {
    const results: CheckpointStorageResult[] = [];
    for (const checkpoint of checkpoints) {
      const result = await this.storeCheckpoint(checkpoint);
      results.push(result);
    }
    return results;
  }

  async retrieveCheckpoint(checkpointId: string): Promise<StoredCheckpoint | null> {
    if (!this.initialized) {
      throw new Error('Checkpoint provider not initialized');
    }

    return this.checkpoints.get(checkpointId) ?? null;
  }

  async retrieveByExecution(
    executionId: string,
    options?: CheckpointQueryOptions
  ): Promise<readonly StoredCheckpoint[]> {
    if (!this.initialized) {
      throw new Error('Checkpoint provider not initialized');
    }

    const checkpointIds = this.executionCheckpoints.get(executionId) ?? [];
    const checkpoints: StoredCheckpoint[] = [];

    for (const checkpointId of checkpointIds) {
      const checkpoint = this.checkpoints.get(checkpointId);
      if (checkpoint) {
        // Apply filters
        if (options?.checkpointType && checkpoint.checkpointType !== options.checkpointType) {
          continue;
        }
        if (options?.limit && checkpoints.length >= options.limit) {
          break;
        }
        checkpoints.push(checkpoint);
      }
    }

    return checkpoints;
  }

  async listCheckpoints(filter?: CheckpointFilter): Promise<readonly StoredCheckpoint[]> {
    if (!this.initialized) {
      throw new Error('Checkpoint provider not initialized');
    }

    let checkpoints = Array.from(this.checkpoints.values());

    if (filter) {
      if (filter.executionId) {
        checkpoints = checkpoints.filter(cp => cp.executionId === filter.executionId);
      }
      if (filter.checkpointType) {
        checkpoints = checkpoints.filter(cp => cp.checkpointType === filter.checkpointType);
      }
      if (filter.tags) {
        checkpoints = checkpoints.filter(cp => 
          filter.tags!.some(tag => cp.metadata.tags.includes(tag))
        );
      }
      if (filter.after || filter.before) {
        checkpoints = checkpoints.filter(cp => {
          const storedAt = cp.storedAt;
          if (filter.after && storedAt < filter.after) {
            return false;
          }
          if (filter.before && storedAt > filter.before) {
            return false;
          }
          return true;
        });
      }
      if (filter.limit) {
        checkpoints = checkpoints.slice(0, filter.limit);
      }
      if (filter.offset) {
        checkpoints = checkpoints.slice(filter.offset);
      }
    }

    return checkpoints;
  }

  async deleteCheckpoint(checkpointId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Checkpoint provider not initialized');
    }

    const checkpoint = this.checkpoints.get(checkpointId);
    if (checkpoint) {
      // Remove from execution tracking
      const executionCheckpoints = this.executionCheckpoints.get(checkpoint.executionId);
      if (executionCheckpoints) {
        const index = executionCheckpoints.indexOf(checkpointId);
        if (index > -1) {
          executionCheckpoints.splice(index, 1);
        }
      }
      this.checkpoints.delete(checkpointId);
    }
  }

  async deleteByExecution(executionId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Checkpoint provider not initialized');
    }

    const checkpointIds = this.executionCheckpoints.get(executionId) ?? [];
    for (const checkpointId of checkpointIds) {
      this.checkpoints.delete(checkpointId);
    }
    this.executionCheckpoints.delete(executionId);
  }

  async applyRetentionPolicy(policy: CheckpointRetentionPolicy): Promise<RetentionPolicyResult> {
    if (!this.initialized) {
      throw new Error('Checkpoint provider not initialized');
    }

    let deletedCount = 0;
    let freedSpaceBytes = 0;
    const now = new Date();

    for (const [checkpointId, checkpoint] of this.checkpoints.entries()) {
      const ageMs = now.getTime() - checkpoint.storedAt.getTime();

      // Check age-based retention
      if (policy.maxAgeMs && ageMs > policy.maxAgeMs) {
        const sizeBytes = JSON.stringify(checkpoint.serializedData).length;
        await this.deleteCheckpoint(checkpointId);
        deletedCount++;
        freedSpaceBytes += sizeBytes;
        continue;
      }

      // Check count-based retention per execution
      if (policy.maxCount && policy.scope === RetentionPolicyScope.EXECUTION) {
        const executionCheckpoints = this.executionCheckpoints.get(checkpoint.executionId) ?? [];
        if (executionCheckpoints.length > policy.maxCount) {
          // Delete oldest checkpoints beyond limit
          const sorted = executionCheckpoints.sort((a, b) => {
            const cpA = this.checkpoints.get(a);
            const cpB = this.checkpoints.get(b);
            return (cpA?.storedAt.getTime() ?? 0) - (cpB?.storedAt.getTime() ?? 0);
          });

          const toDelete = sorted.slice(0, sorted.length - policy.maxCount);
          for (const id of toDelete) {
            const cp = this.checkpoints.get(id);
            if (cp) {
              const sizeBytes = JSON.stringify(cp.serializedData).length;
              await this.deleteCheckpoint(id);
              deletedCount++;
              freedSpaceBytes += sizeBytes;
            }
          }
        }
      }
    }

    return {
      policyId: policy.policyId,
      deletedCount,
      freedSpaceBytes,
      executedAt: new Date(),
    };
  }

  async getLineage(checkpointId: string): Promise<CheckpointLineage> {
    if (!this.initialized) {
      throw new Error('Checkpoint provider not initialized');
    }

    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return {
        checkpointId,
        childCheckpointIds: [],
        lineageDepth: 0,
        lineagePath: [checkpointId],
      };
    }

    // Find child checkpoints (checkpoints that reference this as parent)
    // Note: Since CheckpointMetadata doesn't have parentCheckpointId, we'll track lineage via execution
    const childCheckpointIds: string[] = [];
    const executionCheckpoints = this.executionCheckpoints.get(checkpoint.executionId) ?? [];
    const currentIndex = executionCheckpoints.indexOf(checkpointId);
    if (currentIndex >= 0 && currentIndex < executionCheckpoints.length - 1) {
      // All checkpoints after this one in the same execution are "children"
      childCheckpointIds.push(...executionCheckpoints.slice(currentIndex + 1));
    }

    // Build lineage path (all checkpoints in this execution)
    const lineagePath = executionCheckpoints;

    return {
      checkpointId,
      childCheckpointIds,
      lineageDepth: currentIndex,
      lineagePath,
    };
  }

  async healthCheck(): Promise<CheckpointStorageHealthStatus> {
    const totalSizeBytes = Array.from(this.checkpoints.values()).reduce((sum, cp) => {
      return sum + JSON.stringify(cp.serializedData).length;
    }, 0);
    
    return {
      healthy: this.initialized,
      connected: this.initialized,
      totalCheckpoints: this.checkpoints.size,
      totalSizeBytes,
      storageUtilization: this.maxCheckpoints > 0 ? (this.checkpoints.size / this.maxCheckpoints) * 100 : 0,
      errorCount: 0,
    };
  }

  async shutdown(): Promise<void> {
    this.checkpoints.clear();
    this.executionCheckpoints.clear();
    this.initialized = false;
  }
}

export function createMemoryCheckpointProvider(config: CheckpointStorageAdapterConfig): MemoryCheckpointProvider {
  return new MemoryCheckpointProvider(config);
}

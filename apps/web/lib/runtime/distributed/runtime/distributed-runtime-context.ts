/**
 * CLAUX Runtime Distributed Layer - Distributed Runtime Context
 * 
 * Context for distributed runtime operations.
 * No external dependencies - pure context semantics.
 */

import type { ClusterId, WorkerId, ExecutionId, PartitionId } from '../types';

/**
 * Distributed Runtime Context
 * 
 * Context for distributed runtime operations.
 */
export class DistributedRuntimeContext {
  private clusterId: ClusterId;
  private executionId: ExecutionId;
  private partitionId: PartitionId;
  private workerId: WorkerId;
  private metadata: Map<string, unknown>;

  constructor(
    clusterId: ClusterId,
    executionId: ExecutionId,
    partitionId: PartitionId,
    workerId: WorkerId
  ) {
    this.clusterId = clusterId;
    this.executionId = executionId;
    this.partitionId = partitionId;
    this.workerId = workerId;
    this.metadata = new Map();
  }

  /**
   * Get cluster ID
   */
  getClusterId(): ClusterId {
    return this.clusterId;
  }

  /**
   * Get execution ID
   */
  getExecutionId(): ExecutionId {
    return this.executionId;
  }

  /**
   * Get partition ID
   */
  getPartitionId(): PartitionId {
    return this.partitionId;
  }

  /**
   * Get worker ID
   */
  getWorkerId(): WorkerId {
    return this.workerId;
  }

  /**
   * Set metadata
   */
  setMetadata(key: string, value: unknown): void {
    this.metadata.set(key, value);
  }

  /**
   * Get metadata
   */
  getMetadata(key: string): unknown | undefined {
    return this.metadata.get(key);
  }

  /**
   * Get all metadata
   */
  getAllMetadata(): Map<string, unknown> {
    return new Map(this.metadata);
  }

  /**
   * Clear metadata
   */
  clearMetadata(): void {
    this.metadata.clear();
  }

  /**
   * Clone context
   */
  clone(): DistributedRuntimeContext {
    const cloned = new DistributedRuntimeContext(
      this.clusterId,
      this.executionId,
      this.partitionId,
      this.workerId
    );
    
    for (const [key, value] of this.metadata) {
      cloned.setMetadata(key, value);
    }
    
    return cloned;
  }
}

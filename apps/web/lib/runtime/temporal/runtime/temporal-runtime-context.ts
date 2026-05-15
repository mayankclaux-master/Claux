/**
 * CLAUX Runtime Temporal Layer - Temporal Runtime Context
 * 
 * Context for temporal runtime operations.
 * No external dependencies - pure context semantics.
 */

import type { ExecutionId, TemporalTimestamp, CausationId, LineageId } from '../types';

/**
 * Temporal Runtime Context
 * 
 * Context for temporal runtime operations.
 */
export class TemporalRuntimeContext {
  private executionId: ExecutionId;
  private timestamp: TemporalTimestamp;
  private causationId: CausationId | null;
  private lineageId: LineageId | null;
  private metadata: Map<string, unknown>;

  constructor(
    executionId: ExecutionId,
    timestamp: TemporalTimestamp,
    causationId: CausationId | null,
    lineageId: LineageId | null
  ) {
    this.executionId = executionId;
    this.timestamp = timestamp;
    this.causationId = causationId;
    this.lineageId = lineageId;
    this.metadata = new Map();
  }

  /**
   * Get execution ID
   */
  getExecutionId(): ExecutionId {
    return this.executionId;
  }

  /**
   * Get timestamp
   */
  getTimestamp(): TemporalTimestamp {
    return this.timestamp;
  }

  /**
   * Get causation ID
   */
  getCausationId(): CausationId | null {
    return this.causationId;
  }

  /**
   * Get lineage ID
   */
  getLineageId(): LineageId | null {
    return this.lineageId;
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
  clone(): TemporalRuntimeContext {
    const cloned = new TemporalRuntimeContext(
      this.executionId,
      this.timestamp,
      this.causationId,
      this.lineageId
    );

    for (const [key, value] of this.metadata) {
      cloned.setMetadata(key, value);
    }

    return cloned;
  }
}

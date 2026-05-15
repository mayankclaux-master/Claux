/**
 * CLAUX Runtime Distributed Layer - Validation
 * 
 * Validates distributed runtime configuration and state.
 * No external dependencies - pure validation semantics.
 */

import type { ClusterId, WorkerId, ExecutionId, PartitionId } from './types';

/**
 * Validation Result
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Distributed Runtime Validator
 * 
 * Validates distributed runtime configuration and state.
 */
export class DistributedRuntimeValidator {
  /**
   * Validate cluster configuration
   */
  validateClusterConfig(clusterId: ClusterId, expectedSize: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!clusterId || clusterId.trim() === '') {
      errors.push('Cluster ID is required');
    }

    if (expectedSize < 1) {
      errors.push('Expected cluster size must be at least 1');
    }

    if (expectedSize > 1000) {
      warnings.push('Expected cluster size is very large (>1000)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate worker configuration
   */
  validateWorkerConfig(workerId: WorkerId): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!workerId || workerId.trim() === '') {
      errors.push('Worker ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate execution configuration
   */
  validateExecutionConfig(executionId: ExecutionId): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!executionId || executionId.trim() === '') {
      errors.push('Execution ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate partition configuration
   */
  validatePartitionConfig(partitionId: PartitionId): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!partitionId || partitionId.trim() === '') {
      errors.push('Partition ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate ownership transfer
   */
  validateOwnershipTransfer(
    resourceId: string,
    fromWorker: WorkerId,
    toWorker: WorkerId
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!resourceId) {
      errors.push('Resource ID is required');
    }

    if (!fromWorker || fromWorker.trim() === '') {
      errors.push('Source worker ID is required');
    }

    if (!toWorker || toWorker.trim() === '') {
      errors.push('Target worker ID is required');
    }

    if (fromWorker === toWorker) {
      errors.push('Source and target workers cannot be the same');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate failover operation
   */
  validateFailover(
    executionId: ExecutionId,
    sourceWorker: WorkerId,
    targetWorker: WorkerId
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!executionId || executionId.trim() === '') {
      errors.push('Execution ID is required');
    }

    if (!sourceWorker || sourceWorker.trim() === '') {
      errors.push('Source worker ID is required');
    }

    if (!targetWorker || targetWorker.trim() === '') {
      errors.push('Target worker ID is required');
    }

    if (sourceWorker === targetWorker) {
      errors.push('Source and target workers cannot be the same');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate lease configuration
   */
  validateLeaseConfig(leaseDurationMs: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (leaseDurationMs < 1000) {
      errors.push('Lease duration must be at least 1000ms');
    }

    if (leaseDurationMs > 3600000) {
      warnings.push('Lease duration is very long (>1 hour)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate load balancing configuration
   */
  validateLoadBalancingConfig(strategy: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validStrategies = [
      'round_robin',
      'least_loaded',
      'weighted',
      'capability_aware',
      'resource_aware',
      'partition_aware',
      'locality_aware',
    ];

    if (!validStrategies.includes(strategy)) {
      errors.push(`Invalid load balancing strategy: ${strategy}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate distributed runtime state
   */
  validateRuntimeState(
    activeWorkers: number,
    activeExecutions: number,
    activePartitions: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (activeWorkers < 1) {
      errors.push('No active workers in runtime');
    }

    if (activeExecutions < 0) {
      errors.push('Active executions cannot be negative');
    }

    if (activePartitions < 0) {
      errors.push('Active partitions cannot be negative');
    }

    if (activeWorkers > 0 && activeExecutions === 0 && activePartitions === 0) {
      warnings.push('Runtime has active workers but no executions or partitions');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate replay safety
   */
  validateReplaySafety(
    executionId: ExecutionId,
    hasCheckpoint: boolean,
    checkpointValid: boolean
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!executionId || executionId.trim() === '') {
      errors.push('Execution ID is required');
    }

    if (!hasCheckpoint) {
      warnings.push('No checkpoint available for replay');
    }

    if (hasCheckpoint && !checkpointValid) {
      errors.push('Checkpoint is invalid for replay');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

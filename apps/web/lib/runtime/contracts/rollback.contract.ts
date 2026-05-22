/**
 * Canonical Rollback Contract
 * 
 * This contract defines the standardized rollback mechanism for CLAUX.
 * All rollback operations MUST follow this contract.
 * 
 * CRITICAL: This is the ONLY rollback mechanism allowed in CLAUX.
 */

import type { UUID } from '../types/common.types';

/**
 * Rollback operation types
 */
export enum RollbackOperationType {
  TASK_ROLLBACK = 'task_rollback',
  EXECUTION_ROLLBACK = 'execution_rollback',
  CONNECTOR_ROLLBACK = 'connector_rollback',
  PROVIDER_ROLLBACK = 'provider_rollback',
}

/**
 * Rollback status
 */
export enum RollbackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Rollback strategy
 */
export enum RollbackStrategy {
  // Reverse operations - undo each operation in reverse order
  REVERSE = 'reverse',
  
  // Snapshot restore - restore from pre-execution snapshot
  SNAPSHOT = 'snapshot',
  
  // Compensation - execute compensating transactions
  COMPENSATION = 'compensation',
  
  // Manual - requires manual intervention
  MANUAL = 'manual',
}

/**
 * Rollback reason
 */
export enum RollbackReason {
  TASK_FAILURE = 'task_failure',
  EXECUTION_FAILURE = 'execution_failure',
  CONNECTOR_FAILURE = 'connector_failure',
  PROVIDER_FAILURE = 'provider_failure',
  VALIDATION_FAILURE = 'validation_failure',
  TIMEOUT = 'timeout',
  USER_REQUESTED = 'user_requested',
  GOVERNANCE_VIOLATION = 'governance_violation',
  TENANT_ISOLATION_VIOLATION = 'tenant_isolation_violation',
}

/**
 * Rollback metadata
 */
export interface RollbackMetadata {
  readonly rollbackId: UUID;
  readonly operationType: RollbackOperationType;
  readonly status: RollbackStatus;
  readonly strategy: RollbackStrategy;
  readonly reason: RollbackReason;
  readonly tenantId: UUID;
  readonly executionId: UUID | null;
  readonly taskId: UUID | null;
  readonly agent?: string;
  readonly provider?: string;
  readonly connector?: string;
  readonly originalOperation?: string;
  readonly originalData?: Record<string, unknown>;
  readonly rollbackData?: Record<string, unknown>;
  readonly errorMessage?: string;
  readonly timestamp: string;
  readonly completedAt?: string;
  readonly durationMs?: number;
}

/**
 * Rollback operation interface
 */
export interface RollbackOperation {
  readonly operation: string;
  readonly data: Record<string, unknown>;
  readonly reverseOperation?: string;
  readonly reverseData?: Record<string, unknown>;
}

/**
 * Rollback plan interface
 */
export interface RollbackPlan {
  readonly rollbackId: UUID;
  readonly strategy: RollbackStrategy;
  readonly operations: ReadonlyArray<RollbackOperation>;
  readonly estimatedDurationMs: number;
  readonly requiresManualIntervention: boolean;
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Rollback result interface
 */
export interface RollbackResult {
  readonly rollbackId: UUID;
  readonly success: boolean;
  readonly status: RollbackStatus;
  readonly errorMessage?: string;
  readonly rolledBackOperations: ReadonlyArray<string>;
  readonly failedOperations: ReadonlyArray<string>;
  readonly durationMs: number;
  readonly timestamp: string;
}

/**
 * Canonical rollback contract
 */
export class RollbackContract {
  /**
   * Create a rollback plan
   */
  static createRollbackPlan(
    strategy: RollbackStrategy,
    operations: ReadonlyArray<RollbackOperation>,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): RollbackPlan {
    const rollbackId = crypto.randomUUID() as UUID;
    const estimatedDurationMs = operations.length * 1000; // 1 second per operation
    const requiresManualIntervention = strategy === RollbackStrategy.MANUAL;

    return {
      rollbackId,
      strategy,
      operations,
      estimatedDurationMs,
      requiresManualIntervention,
      riskLevel,
    };
  }

  /**
   * Execute rollback
   */
  static async executeRollback(
    plan: RollbackPlan,
    metadata: Omit<RollbackMetadata, 'status' | 'timestamp' | 'completedAt' | 'durationMs'>
  ): Promise<RollbackResult> {
    const startTime = Date.now();
    const rolledBackOperations: string[] = [];
    const failedOperations: string[] = [];

    try {
      for (const operation of plan.operations) {
        try {
          // Execute reverse operation if available
          if (operation.reverseOperation) {
            await this.executeReverseOperation(operation);
            rolledBackOperations.push(operation.operation);
          } else {
            // No reverse operation available, skip
            rolledBackOperations.push(operation.operation);
          }
        } catch (error) {
          failedOperations.push(operation.operation);
          console.error(`Failed to rollback operation: ${operation.operation}`, error);
        }
      }

      const durationMs = Date.now() - startTime;
      const success = failedOperations.length === 0;

      return {
        rollbackId: plan.rollbackId,
        success,
        status: success ? RollbackStatus.COMPLETED : RollbackStatus.FAILED,
        errorMessage: success ? undefined : `Failed to rollback ${failedOperations.length} operations`,
        rolledBackOperations,
        failedOperations,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      return {
        rollbackId: plan.rollbackId,
        success: false,
        status: RollbackStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        rolledBackOperations,
        failedOperations,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Execute reverse operation
   */
  private static async executeReverseOperation(operation: RollbackOperation): Promise<void> {
    // This is a placeholder - actual implementation depends on operation type
    // In production, this would call the appropriate connector or service
    console.log(`Executing reverse operation: ${operation.reverseOperation}`);
    console.log(`Reverse data:`, operation.reverseData);
  }

  /**
   * Determine rollback strategy
   */
  static determineRollbackStrategy(
    operationType: RollbackOperationType,
    hasSnapshot: boolean,
    hasCompensation: boolean
  ): RollbackStrategy {
    if (operationType === RollbackOperationType.PROVIDER_ROLLBACK) {
      return RollbackStrategy.COMPENSATION;
    }

    if (hasSnapshot) {
      return RollbackStrategy.SNAPSHOT;
    }

    if (hasCompensation) {
      return RollbackStrategy.COMPENSATION;
    }

    return RollbackStrategy.REVERSE;
  }

  /**
   * Assess rollback risk
   */
  static assessRollbackRisk(
    operationType: RollbackOperationType,
    operationCount: number,
    hasExternalSideEffects: boolean
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (hasExternalSideEffects && operationType === RollbackOperationType.PROVIDER_ROLLBACK) {
      return 'critical';
    }

    if (hasExternalSideEffects) {
      return 'high';
    }

    if (operationCount > 10) {
      return 'high';
    }

    if (operationCount > 5) {
      return 'medium';
    }

    return 'low';
  }
}

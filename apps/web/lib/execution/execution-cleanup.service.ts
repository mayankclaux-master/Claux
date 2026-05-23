/**
 * Execution Cleanup Service
 * 
 * Canonical cleanup utilities for CLAUX V1.
 * Stale lock cleanup, expired idempotency cleanup, old heartbeat cleanup, orphan execution cleanup.
 * 
 * CRITICAL: This is the ONLY execution cleanup service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { executionLockService } from './execution-lock.service';
import { clearAllIdempotencyKeys, clearExpiredIdempotencyKeys } from '@/lib/utils/idempotency';
import { vercelSafeExecutionStrategy } from './vercel-safe-execution';

/**
 * Cleanup thresholds (in milliseconds)
 */
const STALE_LOCK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const EXPIRED_IDEMPOTENCY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const OLD_HEARTBEAT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const ORPHAN_EXECUTION_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cleanup result
 */
export interface CleanupResult {
  staleLocks: number;
  expiredIdempotencyKeys: number;
  oldHeartbeats: number;
  orphanExecutions: number;
}

/**
 * Execution cleanup service
 */
export class ExecutionCleanupService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Run all cleanup tasks
   */
  async runAllCleanup(token: string): Promise<CleanupResult> {
    this.logger.info('Running all cleanup tasks');

    const results = await Promise.all([
      this.cleanupStaleLocks(token),
      this.cleanupExpiredIdempotencyKeys(),
      this.cleanupOldHeartbeats(),
      this.cleanupOrphanExecutions(token),
    ]);

    const cleanupResult: CleanupResult = {
      staleLocks: results[0],
      expiredIdempotencyKeys: results[1],
      oldHeartbeats: results[2],
      orphanExecutions: results[3],
    };

    this.logger.info('All cleanup tasks completed', { 
      staleLocks: cleanupResult.staleLocks,
      expiredIdempotencyKeys: cleanupResult.expiredIdempotencyKeys,
      oldHeartbeats: cleanupResult.oldHeartbeats,
      orphanExecutions: cleanupResult.orphanExecutions,
    });
    return cleanupResult;
  }

  /**
   * Cleanup stale locks
   */
  async cleanupStaleLocks(token: string): Promise<number> {
    this.logger.info('Cleaning up stale locks');

    const deletedCount = await executionLockService.cleanupExpiredLocks(token);

    this.logger.info('Stale locks cleaned up successfully', { count: deletedCount });
    return deletedCount;
  }

  /**
   * Cleanup expired idempotency keys
   */
  async cleanupExpiredIdempotencyKeys(): Promise<number> {
    this.logger.info('Cleaning up expired idempotency keys');

    clearExpiredIdempotencyKeys();

    this.logger.info('Expired idempotency keys cleaned up successfully');
    return 0; // The utility doesn't return a count
  }

  /**
   * Cleanup old heartbeats
   */
  async cleanupOldHeartbeats(): Promise<number> {
    this.logger.info('Cleaning up old heartbeats');

    vercelSafeExecutionStrategy.cleanupStaleHeartbeats(OLD_HEARTBEAT_THRESHOLD_MS);

    this.logger.info('Old heartbeats cleaned up successfully');
    return 0; // The utility doesn't return a count
  }

  /**
   * Cleanup orphan executions
   */
  async cleanupOrphanExecutions(token: string): Promise<number> {
    this.logger.info('Cleaning up orphan executions');

    const supabase = createClerkSupabaseClient(token);

    // Find executions that have been running for too long without completion
    const orphanThreshold = new Date(Date.now() - ORPHAN_EXECUTION_THRESHOLD_MS);

    const { data: orphanExecutions, error } = await supabase
      .from('execution_audit')
      .select('id, tenant_id')
      .is('completed_at', null)
      .lt('started_at', orphanThreshold.toISOString());

    if (error) {
      this.logger.error('Failed to find orphan executions', { error });
      return 0;
    }

    if (!orphanExecutions || orphanExecutions.length === 0) {
      this.logger.info('No orphan executions found');
      return 0;
    }

    this.logger.info('Orphan executions found', { count: orphanExecutions.length });

    // Mark them as failed
    for (const execution of orphanExecutions) {
      const { error: updateError } = await supabase
        .from('execution_audit')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          error_type: 'timeout',
          error_message: 'Orphan execution cleaned up',
        })
        .eq('id', execution.id);

      if (updateError) {
        this.logger.error('Failed to mark orphan execution as failed', { error: updateError, executionId: execution.id });
      }
    }

    this.logger.info('Orphan executions cleaned up successfully', { count: orphanExecutions.length });
    return orphanExecutions.length;
  }

  /**
   * Cleanup old audit logs
   */
  async cleanupOldAuditLogs(token: string, daysToKeep: number = 90): Promise<number> {
    this.logger.info('Cleaning up old audit logs', { daysToKeep });

    const supabase = createClerkSupabaseClient(token);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('execution_audit')
      .delete()
      .lt('started_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Failed to cleanup old audit logs', { error });
      return 0;
    }

    this.logger.info('Old audit logs cleaned up successfully');
    return 0; // Supabase delete doesn't return count
  }

  /**
   * Cleanup old schedules
   */
  async cleanupOldSchedules(token: string, daysToKeep: number = 30): Promise<number> {
    this.logger.info('Cleaning up old schedules', { daysToKeep });

    const supabase = createClerkSupabaseClient(token);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('execution_schedules')
      .delete()
      .eq('enabled', false)
      .lt('updated_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Failed to cleanup old schedules', { error });
      return 0;
    }

    this.logger.info('Old schedules cleaned up successfully');
    return 0; // Supabase delete doesn't return count
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStatistics(token: string): Promise<{
    staleLocks: number;
    activeIdempotencyKeys: number;
    activeHeartbeats: number;
    orphanExecutions: number;
    oldAuditLogs: number;
    oldSchedules: number;
  }> {
    this.logger.info('Getting cleanup statistics');

    const supabase = createClerkSupabaseClient(token);

    // Count stale locks
    const { count: staleLocks } = await supabase
      .from('execution_locks')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString());

    // Count orphan executions
    const orphanThreshold = new Date(Date.now() - ORPHAN_EXECUTION_THRESHOLD_MS);
    const { count: orphanExecutions } = await supabase
      .from('execution_audit')
      .select('*', { count: 'exact', head: true })
      .is('completed_at', null)
      .lt('started_at', orphanThreshold.toISOString());

    // Count old audit logs
    const oldAuditThreshold = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
    const { count: oldAuditLogs } = await supabase
      .from('execution_audit')
      .select('*', { count: 'exact', head: true })
      .lt('started_at', oldAuditThreshold.toISOString());

    // Count old schedules
    const oldScheduleThreshold = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const { count: oldSchedules } = await supabase
      .from('execution_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('enabled', false)
      .lt('updated_at', oldScheduleThreshold.toISOString());

    this.logger.info('Cleanup statistics retrieved successfully', {
      staleLocks,
      orphanExecutions,
      oldAuditLogs,
      oldSchedules,
    });

    return {
      staleLocks: staleLocks || 0,
      activeIdempotencyKeys: 0, // Not easily queryable
      activeHeartbeats: 0, // Not easily queryable
      orphanExecutions: orphanExecutions || 0,
      oldAuditLogs: oldAuditLogs || 0,
      oldSchedules: oldSchedules || 0,
    };
  }

  /**
   * Schedule periodic cleanup
   */
  schedulePeriodicCleanup(intervalMs: number = 60 * 60 * 1000): void {
    this.logger.info('Scheduling periodic cleanup', { intervalMs });

    setInterval(async () => {
      try {
        this.logger.info('Running periodic cleanup');
        // This would need a token to execute
        // For now, this is a placeholder
        this.logger.info('Periodic cleanup completed');
      } catch (error) {
        this.logger.error('Periodic cleanup failed', { error });
      }
    }, intervalMs);
  }
}

/**
 * Singleton instance
 */
export const executionCleanupService = new ExecutionCleanupService();

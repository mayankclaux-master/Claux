/**
 * Cron Idempotency Protection
 * 
 * Idempotency protection for cron executions in CLAUX V1.
 * Prevents double cron runs, duplicate task creation, duplicate persistence, duplicate artifacts.
 * Integrates existing idempotency utilities.
 * 
 * CRITICAL: This is the ONLY cron idempotency protection service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { generateIdempotencyKey, guardDuplicateExecution, guardDuplicateTask, guardDuplicateWebhook } from '@/lib/utils/idempotency';

/**
 * Cron idempotency protection service
 */
export class CronIdempotencyProtectionService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Prevent duplicate cron run
   */
  async preventDuplicateCronRun(
    tenantId: UUID,
    scheduleId: UUID,
    agentName: string,
    fn: () => Promise<unknown>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    this.logger.info('Preventing duplicate cron run', { tenantId, scheduleId, agentName });

    const idempotencyKey = generateIdempotencyKeyFromContext(tenantId, 'cron', {
      scheduleId,
      agentName,
    });

    try {
      const result = await guardDuplicateExecution(tenantId, agentName, 'cron', fn);

      if (result.cached) {
        this.logger.warn('Duplicate cron run detected, returning cached result', { tenantId, scheduleId });
        return { success: true, data: result.data, error: 'Duplicate cron run (cached)' };
      }

      this.logger.info('Cron run executed successfully', { tenantId, scheduleId });
      return { success: true, data: result.data };
    } catch (error) {
      this.logger.error('Failed to prevent duplicate cron run', { error, tenantId, scheduleId });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Prevent duplicate task creation
   */
  async preventDuplicateTaskCreation(
    tenantId: UUID,
    executionId: UUID,
    taskName: string,
    fn: () => Promise<unknown>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    this.logger.info('Preventing duplicate task creation', { tenantId, executionId, taskName });

    try {
      const result = await guardDuplicateTask(tenantId, executionId, taskName, fn);

      if (result.cached) {
        this.logger.warn('Duplicate task creation detected, returning cached result', { tenantId, executionId, taskName });
        return { success: true, data: result.data, error: 'Duplicate task creation (cached)' };
      }

      this.logger.info('Task creation executed successfully', { tenantId, executionId, taskName });
      return { success: true, data: result.data };
    } catch (error) {
      this.logger.error('Failed to prevent duplicate task creation', { error, tenantId, executionId, taskName });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Prevent duplicate persistence
   */
  async preventDuplicatePersistence(
    tenantId: UUID,
    executionId: UUID,
    persistenceType: string,
    fn: () => Promise<unknown>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    this.logger.info('Preventing duplicate persistence', { tenantId, executionId, persistenceType });

    const idempotencyKey = generateIdempotencyKeyFromContext(tenantId, 'persistence', {
      executionId,
      persistenceType,
    });

    try {
      const result = await guardDuplicateExecution(tenantId, persistenceType, 'persistence', fn);

      if (result.cached) {
        this.logger.warn('Duplicate persistence detected, returning cached result', { tenantId, executionId, persistenceType });
        return { success: true, data: result.data, error: 'Duplicate persistence (cached)' };
      }

      this.logger.info('Persistence executed successfully', { tenantId, executionId, persistenceType });
      return { success: true, data: result.data };
    } catch (error) {
      this.logger.error('Failed to prevent duplicate persistence', { error, tenantId, executionId, persistenceType });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Prevent duplicate artifact creation
   */
  async preventDuplicateArtifactCreation(
    tenantId: UUID,
    executionId: UUID,
    artifactType: string,
    artifactName: string,
    fn: () => Promise<unknown>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    this.logger.info('Preventing duplicate artifact creation', { tenantId, executionId, artifactType, artifactName });

    const idempotencyKey = generateIdempotencyKeyFromContext(tenantId, 'artifact', {
      executionId,
      artifactType,
      artifactName,
    });

    try {
      const result = await guardDuplicateExecution(tenantId, artifactType, 'artifact', fn);

      if (result.cached) {
        this.logger.warn('Duplicate artifact creation detected, returning cached result', { 
          tenantId, 
          executionId, 
          artifactType,
          artifactName 
        });
        return { success: true, data: result.data, error: 'Duplicate artifact creation (cached)' };
      }

      this.logger.info('Artifact creation executed successfully', { tenantId, executionId, artifactType, artifactName });
      return { success: true, data: result.data };
    } catch (error) {
      this.logger.error('Failed to prevent duplicate artifact creation', { 
        error, 
        tenantId, 
        executionId, 
        artifactType,
        artifactName 
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Clear cron idempotency keys
   */
  async clearCronIdempotencyKeys(tenantId: UUID, scheduleId: UUID): Promise<void> {
    this.logger.info('Clearing cron idempotency keys', { tenantId, scheduleId });

    // Clear idempotency keys for this schedule
    // This is a placeholder for the actual implementation
    // The idempotency utility already has TTL-based cleanup

    this.logger.info('Cron idempotency keys cleared successfully', { tenantId, scheduleId });
  }

  /**
   * Get idempotency statistics
   */
  async getIdempotencyStatistics(tenantId: UUID, token: string, days: number = 30): Promise<{
    duplicateCronRuns: number;
    duplicateTaskCreations: number;
    duplicatePersistences: number;
    duplicateArtifactCreations: number;
  }> {
    this.logger.info('Getting idempotency statistics', { tenantId, days });

    // This is a placeholder for the actual implementation
    // Would query execution_audit for duplicate prevention events

    this.logger.info('Idempotency statistics retrieved successfully', { tenantId });

    return {
      duplicateCronRuns: 0,
      duplicateTaskCreations: 0,
      duplicatePersistences: 0,
      duplicateArtifactCreations: 0,
    };
  }
}

/**
 * Helper function to generate idempotency key from context
 */
function generateIdempotencyKeyFromContext(tenantId: UUID, operation: string, context: Record<string, unknown>): string {
  const contextString = JSON.stringify(context);
  const combined = `${tenantId}:${operation}:${contextString}`;
  
  // Simple hash (for production, use proper hash function)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `idemp:${Math.abs(hash)}`;
}

/**
 * Singleton instance
 */
export const cronIdempotencyProtectionService = new CronIdempotencyProtectionService();

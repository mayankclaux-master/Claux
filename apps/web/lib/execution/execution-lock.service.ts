/**
 * Execution Lock Service
 * 
 * Canonical locking system for CLAUX V1.
 * Prevents duplicate execution, prevents parallel same-agent execution, prevents cron overlap.
 * Uses Supabase/Postgres only (NO REDIS).
 * 
 * CRITICAL: This is the ONLY execution lock service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Lock result
 */
export interface LockResult {
  acquired: boolean;
  lockId?: UUID;
  error?: string;
}

/**
 * Execution lock service
 */
export class ExecutionLockService {
  private logger: Logger;
  private readonly DEFAULT_LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Generate lock key
   */
  private generateLockKey(tenantId: UUID, agentName: string, resourceType: string, resourceId?: string): string {
    if (resourceId) {
      return `${resourceType}:${agentName}:${tenantId}:${resourceId}`;
    }
    return `${resourceType}:${agentName}:${tenantId}`;
  }

  /**
   * Acquire lock
   */
  async acquireLock(
    tenantId: UUID,
    agentName: string,
    resourceType: string,
    token: string,
    resourceId?: string,
    ttlMs: number = this.DEFAULT_LOCK_TTL_MS
  ): Promise<LockResult> {
    const lockKey = this.generateLockKey(tenantId, agentName, resourceType, resourceId);
    const expiresAt = new Date(Date.now() + ttlMs);

    this.logger.info('Attempting to acquire lock', { tenantId, agentName, lockKey, ttlMs });

    const supabase = createClerkSupabaseClient(token);

    // Try to insert lock (will fail if lock already exists due to unique constraint)
    const { data, error } = await supabase
      .from('execution_locks')
      .insert({
        tenant_id: tenantId,
        lock_key: lockKey,
        locked_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (error) {
      // Lock already exists or other error
      if (error.code === '23505') { // Unique violation
        this.logger.warn('Lock already held', { tenantId, agentName, lockKey });
        return { acquired: false, error: 'Lock already held' };
      }
      
      this.logger.error('Failed to acquire lock', { error, tenantId, agentName, lockKey });
      return { acquired: false, error: error.message };
    }

    this.logger.info('Lock acquired successfully', { tenantId, agentName, lockKey, lockId: data?.id });
    return { acquired: true, lockId: data?.id };
  }

  /**
   * Release lock
   */
  async releaseLock(tenantId: UUID, lockId: UUID, token: string): Promise<boolean> {
    this.logger.info('Releasing lock', { tenantId, lockId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('execution_locks')
      .delete()
      .eq('id', lockId)
      .eq('tenant_id', tenantId);

    if (error) {
      this.logger.error('Failed to release lock', { error, tenantId, lockId });
      return false;
    }

    this.logger.info('Lock released successfully', { tenantId, lockId });
    return true;
  }

  /**
   * Release lock by key
   */
  async releaseLockByKey(tenantId: UUID, agentName: string, resourceType: string, token: string, resourceId?: string): Promise<boolean> {
    const lockKey = this.generateLockKey(tenantId, agentName, resourceType, resourceId);

    this.logger.info('Releasing lock by key', { tenantId, lockKey });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('execution_locks')
      .delete()
      .eq('lock_key', lockKey)
      .eq('tenant_id', tenantId);

    if (error) {
      this.logger.error('Failed to release lock by key', { error, tenantId, lockKey });
      return false;
    }

    this.logger.info('Lock released by key successfully', { tenantId, lockKey });
    return true;
  }

  /**
   * Check if lock is held
   */
  async isLockHeld(tenantId: UUID, agentName: string, resourceType: string, token: string, resourceId?: string): Promise<boolean> {
    const lockKey = this.generateLockKey(tenantId, agentName, resourceType, resourceId);

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_locks')
      .select('id')
      .eq('lock_key', lockKey)
      .eq('tenant_id', tenantId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to check lock status', { error, tenantId, lockKey });
      return false;
    }

    return data !== null;
  }

  /**
   * Extend lock TTL
   */
  async extendLock(tenantId: UUID, lockId: UUID, token: string, ttlMs: number = this.DEFAULT_LOCK_TTL_MS): Promise<boolean> {
    const expiresAt = new Date(Date.now() + ttlMs);

    this.logger.info('Extending lock TTL', { tenantId, lockId, ttlMs });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('execution_locks')
      .update({ expires_at: expiresAt.toISOString() })
      .eq('id', lockId)
      .eq('tenant_id', tenantId);

    if (error) {
      this.logger.error('Failed to extend lock TTL', { error, tenantId, lockId });
      return false;
    }

    this.logger.info('Lock TTL extended successfully', { tenantId, lockId });
    return true;
  }

  /**
   * Clean up expired locks
   */
  async cleanupExpiredLocks(token: string): Promise<number> {
    this.logger.info('Cleaning up expired locks');

    const supabase = createClerkSupabaseClient(token);

    // Call the SQL function to clean up expired locks
    const { data, error } = await supabase.rpc('cleanup_expired_locks');

    if (error) {
      this.logger.error('Failed to clean up expired locks', { error });
      return 0;
    }

    const deletedCount = data as number;
    this.logger.info('Expired locks cleaned up successfully', { count: deletedCount });
    return deletedCount;
  }

  /**
   * Get all active locks for tenant
   */
  async getActiveLocks(tenantId: UUID, token: string): Promise<unknown[]> {
    this.logger.info('Getting active locks', { tenantId });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_locks')
      .select('*')
      .eq('tenant_id', tenantId)
      .gt('expires_at', new Date().toISOString())
      .order('locked_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to get active locks', { error, tenantId });
      return [];
    }

    this.logger.info('Active locks retrieved successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Acquire lock with automatic cleanup on failure
   */
  async withLock<T>(
    tenantId: UUID,
    agentName: string,
    resourceType: string,
    token: string,
    fn: () => Promise<T>,
    resourceId?: string,
    ttlMs: number = this.DEFAULT_LOCK_TTL_MS
  ): Promise<T> {
    const lockResult = await this.acquireLock(tenantId, agentName, resourceType, token, resourceId, ttlMs);

    if (!lockResult.acquired) {
      throw new Error(`Failed to acquire lock: ${lockResult.error || 'Unknown error'}`);
    }

    const lockId = lockResult.lockId!;

    try {
      return await fn();
    } finally {
      await this.releaseLock(tenantId, lockId, token);
    }
  }
}

/**
 * Singleton instance
 */
export const executionLockService = new ExecutionLockService();

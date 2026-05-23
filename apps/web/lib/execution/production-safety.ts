/**
 * Production Safety
 * 
 * Production safety utilities for CLAUX V1.
 * Execution rate limiting, tenant execution caps, connector timeout caps, payload size caps, cron flood prevention.
 * 
 * CRITICAL: This is the ONLY production safety utility in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Production safety limits
 */
const PRODUCTION_LIMITS = {
  MAX_EXECUTIONS_PER_TENANT_PER_HOUR: 100,
  MAX_EXECUTIONS_PER_TENANT_PER_DAY: 1000,
  MAX_CONNECTOR_TIMEOUT_MS: 60000, // 60 seconds
  MAX_PAYLOAD_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_CRON_EXECUTIONS_PER_MINUTE: 10,
} as const;

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  error?: string;
}

/**
 * Production safety service
 */
export class ProductionSafetyService {
  private logger: Logger;
  private executionCounts = new Map<UUID, { count: number; resetAt: number }>();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Check execution rate limit for tenant
   */
  async checkExecutionRateLimit(
    tenantId: UUID,
    token: string,
    window: 'hour' | 'day' = 'hour'
  ): Promise<RateLimitResult> {
    this.logger.info('Checking execution rate limit', { tenantId, window });

    const supabase = createClerkSupabaseClient(token);

    const limit = window === 'hour' 
      ? PRODUCTION_LIMITS.MAX_EXECUTIONS_PER_TENANT_PER_HOUR 
      : PRODUCTION_LIMITS.MAX_EXECUTIONS_PER_TENANT_PER_DAY;

    const startDate = new Date();
    if (window === 'hour') {
      startDate.setHours(startDate.getHours() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 1);
    }

    const { data, error } = await supabase
      .from('execution_audit')
      .select('id')
      .eq('tenant_id', tenantId)
      .gte('started_at', startDate.toISOString());

    if (error) {
      this.logger.error('Failed to check execution rate limit', { error, tenantId });
      return { allowed: true, remaining: limit, resetAt: new Date().toISOString() };
    }

    const count = data?.length || 0;
    const remaining = Math.max(0, limit - count);
    const resetAt = window === 'hour' 
      ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    if (count >= limit) {
      this.logger.warn('Execution rate limit exceeded', { tenantId, window, count, limit });
      return { 
        allowed: false, 
        remaining: 0, 
        resetAt,
        error: `Execution rate limit exceeded: ${count}/${limit} per ${window}`
      };
    }

    this.logger.info('Execution rate limit check passed', { tenantId, window, count, remaining });
    return { allowed: true, remaining, resetAt };
  }

  /**
   * Check connector timeout cap
   */
  checkConnectorTimeout(timeoutMs: number): { allowed: boolean; error?: string } {
    if (timeoutMs > PRODUCTION_LIMITS.MAX_CONNECTOR_TIMEOUT_MS) {
      this.logger.warn('Connector timeout exceeds limit', { timeoutMs, max: PRODUCTION_LIMITS.MAX_CONNECTOR_TIMEOUT_MS });
      return { 
        allowed: false, 
        error: `Connector timeout exceeds limit: ${timeoutMs}ms (max: ${PRODUCTION_LIMITS.MAX_CONNECTOR_TIMEOUT_MS}ms)`
      };
    }

    return { allowed: true };
  }

  /**
   * Check payload size cap
   */
  checkPayloadSize(payloadSizeBytes: number): { allowed: boolean; error?: string } {
    if (payloadSizeBytes > PRODUCTION_LIMITS.MAX_PAYLOAD_SIZE_BYTES) {
      this.logger.warn('Payload size exceeds limit', { payloadSizeBytes, max: PRODUCTION_LIMITS.MAX_PAYLOAD_SIZE_BYTES });
      return { 
        allowed: false, 
        error: `Payload size exceeds limit: ${payloadSizeBytes} bytes (max: ${PRODUCTION_LIMITS.MAX_PAYLOAD_SIZE_BYTES} bytes)`
      };
    }

    return { allowed: true };
  }

  /**
   * Check cron flood prevention
   */
  async checkCronFloodPrevention(token: string): Promise<{ allowed: boolean; error?: string }> {
    this.logger.info('Checking cron flood prevention');

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - 1);

    const { data, error } = await supabase
      .from('execution_audit')
      .select('id')
      .eq('execution_type', 'cron')
      .gte('started_at', startDate.toISOString());

    if (error) {
      this.logger.error('Failed to check cron flood prevention', { error });
      return { allowed: true };
    }

    const count = data?.length || 0;

    if (count >= PRODUCTION_LIMITS.MAX_CRON_EXECUTIONS_PER_MINUTE) {
      this.logger.warn('Cron flood detected', { count, max: PRODUCTION_LIMITS.MAX_CRON_EXECUTIONS_PER_MINUTE });
      return { 
        allowed: false, 
        error: `Cron flood detected: ${count} executions per minute (max: ${PRODUCTION_LIMITS.MAX_CRON_EXECUTIONS_PER_MINUTE})`
      };
    }

    this.logger.info('Cron flood prevention check passed', { count });
    return { allowed: true };
  }

  /**
   * Validate execution safety
   */
  async validateExecutionSafety(
    tenantId: UUID,
    token: string,
    options: {
      timeoutMs?: number;
      payloadSizeBytes?: number;
      isCron?: boolean;
    } = {}
  ): Promise<{ allowed: boolean; errors: string[] }> {
    this.logger.info('Validating execution safety', { tenantId, options });

    const errors: string[] = [];

    // Check rate limit
    const rateLimitResult = await this.checkExecutionRateLimit(tenantId, token);
    if (!rateLimitResult.allowed) {
      errors.push(rateLimitResult.error || 'Rate limit exceeded');
    }

    // Check connector timeout
    if (options.timeoutMs) {
      const timeoutResult = this.checkConnectorTimeout(options.timeoutMs);
      if (!timeoutResult.allowed) {
        errors.push(timeoutResult.error || 'Connector timeout exceeds limit');
      }
    }

    // Check payload size
    if (options.payloadSizeBytes) {
      const payloadResult = this.checkPayloadSize(options.payloadSizeBytes);
      if (!payloadResult.allowed) {
        errors.push(payloadResult.error || 'Payload size exceeds limit');
      }
    }

    // Check cron flood
    if (options.isCron) {
      const cronResult = await this.checkCronFloodPrevention(token);
      if (!cronResult.allowed) {
        errors.push(cronResult.error || 'Cron flood detected');
      }
    }

    const allowed = errors.length === 0;

    if (!allowed) {
      this.logger.warn('Execution safety validation failed', { tenantId, errors });
    } else {
      this.logger.info('Execution safety validation passed', { tenantId });
    }

    return { allowed, errors };
  }

  /**
   * Get production safety statistics
   */
  async getProductionSafetyStatistics(token: string): Promise<{
    totalExecutionsLastHour: number;
    totalExecutionsLastDay: number;
    cronExecutionsLastMinute: number;
    rateLimitedTenants: number;
  }> {
    this.logger.info('Getting production safety statistics');

    const supabase = createClerkSupabaseClient(token);

    // Total executions last hour
    const hourAgo = new Date();
    hourAgo.setHours(hourAgo.getHours() - 1);

    const { count: totalExecutionsLastHour } = await supabase
      .from('execution_audit')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', hourAgo.toISOString());

    // Total executions last day
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);

    const { count: totalExecutionsLastDay } = await supabase
      .from('execution_audit')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', dayAgo.toISOString());

    // Cron executions last minute
    const minuteAgo = new Date();
    minuteAgo.setMinutes(minuteAgo.getMinutes() - 1);

    const { count: cronExecutionsLastMinute } = await supabase
      .from('execution_audit')
      .select('*', { count: 'exact', head: true })
      .eq('execution_type', 'cron')
      .gte('started_at', minuteAgo.toISOString());

    // Rate limited tenants (approximate)
    // Fetch all executions and count per tenant in memory
    const { data: allExecutions } = await supabase
      .from('execution_audit')
      .select('tenant_id')
      .gte('started_at', hourAgo.toISOString());

    const tenantCounts = new Map<UUID, number>();
    for (const execution of allExecutions || []) {
      const tenantId = execution.tenant_id as UUID;
      tenantCounts.set(tenantId, (tenantCounts.get(tenantId) || 0) + 1);
    }

    const rateLimitedTenants = Array.from(tenantCounts.entries())
      .filter(([_, count]) => count > PRODUCTION_LIMITS.MAX_EXECUTIONS_PER_TENANT_PER_HOUR)
      .map(([tenantId]) => ({ tenant_id: tenantId }));

    this.logger.info('Production safety statistics retrieved successfully', {
      totalExecutionsLastHour,
      totalExecutionsLastDay,
      cronExecutionsLastMinute,
      rateLimitedTenants: rateLimitedTenants?.length || 0,
    });

    return {
      totalExecutionsLastHour: totalExecutionsLastHour || 0,
      totalExecutionsLastDay: totalExecutionsLastDay || 0,
      cronExecutionsLastMinute: cronExecutionsLastMinute || 0,
      rateLimitedTenants: rateLimitedTenants?.length || 0,
    };
  }

  /**
   * Get production limits
   */
  getProductionLimits() {
    return { ...PRODUCTION_LIMITS };
  }
}

/**
 * Singleton instance
 */
export const productionSafetyService = new ProductionSafetyService();

/**
 * Convenience functions
 */
export async function validateExecutionSafety(
  tenantId: UUID,
  token: string,
  options?: {
    timeoutMs?: number;
    payloadSizeBytes?: number;
    isCron?: boolean;
  }
): Promise<{ allowed: boolean; errors: string[] }> {
  return productionSafetyService.validateExecutionSafety(tenantId, token, options);
}

export function checkConnectorTimeout(timeoutMs: number): { allowed: boolean; error?: string } {
  return productionSafetyService.checkConnectorTimeout(timeoutMs);
}

export function checkPayloadSize(payloadSizeBytes: number): { allowed: boolean; error?: string } {
  return productionSafetyService.checkPayloadSize(payloadSizeBytes);
}

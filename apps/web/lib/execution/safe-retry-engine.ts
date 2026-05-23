/**
 * Safe Retry Engine
 * 
 * Canonical retry engine for CLAUX V1.
 * Exponential backoff, retry caps, retry visibility, retry audit logs.
 * NO infinite retries.
 * 
 * CRITICAL: This is the ONLY retry engine in CLAUX.
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { failureClassifier, ErrorType } from './failure-classification';
import { executionAuditService } from './execution-audit.service';
import type { UUID } from '../runtime/types/common.types';

/**
 * Retry options
 */
export interface SafeRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: unknown) => void;
  tenantId?: UUID;
  executionId?: UUID;
  traceId?: UUID;
  token?: string;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<SafeRetryOptions, 'tenantId' | 'executionId' | 'traceId' | 'token'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  onRetry: () => {},
};

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  errorType?: ErrorType;
}

/**
 * Safe retry engine
 */
export class SafeRetryEngine {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attempt: number, options: Required<Omit<SafeRetryOptions, 'tenantId' | 'executionId' | 'traceId' | 'token'>>): number {
    const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
    return Math.min(delay, options.maxDelayMs);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute with safe retry
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: SafeRetryOptions = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: unknown;
    let lastErrorType: ErrorType | undefined;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const data = await fn();
        
        this.logger.info('Operation succeeded', { attempt });
        
        return {
          success: true,
          data,
          attempts: attempt + 1,
        };
      } catch (error) {
        lastError = error;
        lastErrorType = failureClassifier.getErrorType(error);
        
        this.logger.warn('Operation failed', { attempt, errorType: lastErrorType, error });

        // Check if error is retryable
        if (!failureClassifier.isRetryable(error)) {
          this.logger.error('Error is not retryable, aborting', { errorType: lastErrorType });
          break;
        }

        // Don't retry if we've exhausted attempts
        if (attempt === opts.maxRetries) {
          this.logger.error('Max retries exhausted, aborting', { maxRetries: opts.maxRetries });
          break;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt, opts);
        
        if (opts.onRetry) {
          opts.onRetry(attempt + 1, error);
        }

        // Log retry to audit if options provided
        if (opts.tenantId && opts.executionId && opts.traceId && opts.token) {
          try {
            await executionAuditService.recordExecutionCompletion(
              opts.tenantId,
              opts.executionId,
              'failed',
              opts.token,
              lastErrorType,
              error instanceof Error ? error.message : 'Unknown error',
              attempt + 1
            );
          } catch (auditError) {
            this.logger.error('Failed to log retry to audit', { auditError });
          }
        }

        this.logger.info('Retrying after delay', { attempt, delayMs: delay });
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    this.logger.error('Operation failed after all retries', { 
      attempts: opts.maxRetries + 1,
      errorType: lastErrorType 
    });

    return {
      success: false,
      error: lastError,
      attempts: opts.maxRetries + 1,
      errorType: lastErrorType,
    };
  }

  /**
   * Execute with retry for transient failures only
   */
  async executeWithTransientRetry<T>(
    fn: () => Promise<T>,
    options: SafeRetryOptions = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...options };

    // Override onRetry to only retry transient failures
    const originalOnRetry = opts.onRetry;
    opts.onRetry = (attempt, error) => {
      const classification = failureClassifier.classify(error);
      
      if (classification.type !== ErrorType.TRANSIENT && classification.type !== ErrorType.TIMEOUT) {
        throw error; // Abort retry for non-transient errors
      }

      if (originalOnRetry) {
        originalOnRetry(attempt, error);
      }
    };

    return this.executeWithRetry(fn, opts);
  }

  /**
   * Execute with retry for connector failures
   */
  async executeWithConnectorRetry<T>(
    fn: () => Promise<T>,
    options: SafeRetryOptions = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...options, maxRetries: options.maxRetries || 2 }; // Lower retry limit for connectors

    const originalOnRetry = opts.onRetry;
    opts.onRetry = (attempt, error) => {
      const classification = failureClassifier.classify(error);
      
      // Only retry connector errors if they're transient
      if (classification.type === ErrorType.CONNECTOR) {
        throw error; // Don't retry connector errors
      }

      if (originalOnRetry) {
        originalOnRetry(attempt, error);
      }
    };

    return this.executeWithRetry(fn, opts);
  }

  /**
   * Execute with retry for persistence failures
   */
  async executeWithPersistenceRetry<T>(
    fn: () => Promise<T>,
    options: SafeRetryOptions = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...options, maxRetries: options.maxRetries || 5 }; // Higher retry limit for persistence

    const originalOnRetry = opts.onRetry;
    opts.onRetry = (attempt, error) => {
      const classification = failureClassifier.classify(error);
      
      // Only retry persistence errors
      if (classification.type !== ErrorType.PERSISTENCE && classification.type !== ErrorType.TRANSIENT) {
        throw error;
      }

      if (originalOnRetry) {
        originalOnRetry(attempt, error);
      }
    };

    return this.executeWithRetry(fn, opts);
  }

  /**
   * Get retry statistics for tenant
   */
  async getRetryStatistics(
    tenantId: UUID,
    token: string,
    days: number = 30
  ): Promise<{
    totalRetries: number;
    byErrorType: Record<string, number>;
    byAgent: Record<string, number>;
    averageRetryCount: number;
  }> {
    this.logger.info('Getting retry statistics', { tenantId, days });

    const supabase = require('@/lib/supabase/admin').createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('execution_audit')
      .select('agent_name, error_type, retry_count')
      .eq('tenant_id', tenantId)
      .gte('started_at', startDate.toISOString())
      .gt('retry_count', 0);

    if (error) {
      this.logger.error('Failed to get retry statistics', { error, tenantId });
      throw new Error(`Failed to get retry statistics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalRetries: 0,
        byErrorType: {},
        byAgent: {},
        averageRetryCount: 0,
      };
    }

    const totalRetries = data.length;
    const byErrorType: Record<string, number> = {};
    const byAgent: Record<string, number> = {};
    let totalRetryCount = 0;

    for (const record of data) {
      const r = record as { agent_name: string; error_type: string | null; retry_count: number };
      
      byAgent[r.agent_name] = (byAgent[r.agent_name] || 0) + 1;
      totalRetryCount += r.retry_count;
      
      if (r.error_type) {
        byErrorType[r.error_type] = (byErrorType[r.error_type] || 0) + 1;
      }
    }

    const averageRetryCount = totalRetryCount / totalRetries;

    this.logger.info('Retry statistics retrieved successfully', { tenantId, totalRetries });

    return {
      totalRetries,
      byErrorType,
      byAgent,
      averageRetryCount,
    };
  }
}

/**
 * Singleton instance
 */
export const safeRetryEngine = new SafeRetryEngine();

/**
 * Convenience functions
 */
export async function executeWithRetry<T>(fn: () => Promise<T>, options?: SafeRetryOptions): Promise<T> {
  const result = await safeRetryEngine.executeWithRetry(fn, options);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data!;
}

export async function executeWithTransientRetry<T>(fn: () => Promise<T>, options?: SafeRetryOptions): Promise<T> {
  const result = await safeRetryEngine.executeWithTransientRetry(fn, options);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data!;
}

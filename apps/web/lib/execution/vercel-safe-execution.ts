/**
 * Vercel-Safe Execution Strategy
 * 
 * Vercel timeout safety for CLAUX V1.
 * Chunks long tasks, timeout-aware execution, execution heartbeat updates, prevents hanging requests, graceful abort support.
 * Target: ALL executions must survive Vercel serverless constraints.
 * 
 * CRITICAL: This is the ONLY Vercel-safe execution strategy in CLAUX.
 */

import { withTimeout, DEFAULT_TIMEOUTS, TimeoutError } from '@/lib/utils/timeout';
import { createLogger, Logger } from '@/lib/utils/logger';
import type { UUID } from '../runtime/types/common.types';

/**
 * Vercel serverless constraints
 */
const VERCEL_SERVERLESS_TIMEOUT_MS = 60 * 1000; // 60 seconds (Vercel Hobby)
const VERCEL_PRO_TIMEOUT_MS = 900 * 1000; // 15 minutes (Vercel Pro)
const SAFETY_MARGIN_MS = 5 * 1000; // 5 seconds safety margin

/**
 * Execution chunk
 */
export interface ExecutionChunk<T> {
  id: string;
  data: T;
  index: number;
  total: number;
}

/**
 * Execution heartbeat
 */
export interface ExecutionHeartbeat {
  executionId: UUID;
  lastHeartbeat: string;
  status: 'running' | 'paused' | 'aborted';
  progress: number;
}

/**
 * Vercel-safe execution options
 */
export interface VercelSafeExecutionOptions {
  timeoutMs?: number;
  enableHeartbeat?: boolean;
  heartbeatIntervalMs?: number;
  enableChunking?: boolean;
  chunkSize?: number;
  onProgress?: (progress: number) => void;
  onAbort?: () => void;
}

/**
 * Default Vercel-safe execution options
 */
const DEFAULT_VERCEL_SAFE_OPTIONS: Required<Omit<VercelSafeExecutionOptions, 'onProgress' | 'onAbort'>> = {
  timeoutMs: VERCEL_SERVERLESS_TIMEOUT_MS - SAFETY_MARGIN_MS,
  enableHeartbeat: true,
  heartbeatIntervalMs: 10 * 1000, // 10 seconds
  enableChunking: false,
  chunkSize: 10,
};

/**
 * Vercel-safe execution strategy
 */
export class VercelSafeExecutionStrategy {
  private logger: Logger;
  private heartbeats = new Map<UUID, ExecutionHeartbeat>();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Execute with Vercel timeout safety
   */
  async executeWithVercelSafety<T>(
    fn: () => Promise<T>,
    options: VercelSafeExecutionOptions = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_VERCEL_SAFE_OPTIONS, ...options };
    
    this.logger.info('Executing with Vercel safety', { 
      timeoutMs: opts.timeoutMs,
      enableHeartbeat: opts.enableHeartbeat,
      enableChunking: opts.enableChunking 
    });

    return withTimeout(fn, { 
      timeoutMs: opts.timeoutMs,
      onTimeout: () => {
        this.logger.warn('Execution timed out', { timeoutMs: opts.timeoutMs });
        if (opts.onAbort) {
          opts.onAbort();
        }
      }
    });
  }

  /**
   * Execute with heartbeat
   */
  async executeWithHeartbeat<T>(
    executionId: UUID,
    fn: () => Promise<T>,
    options: VercelSafeExecutionOptions = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_VERCEL_SAFE_OPTIONS, ...options };

    if (!opts.enableHeartbeat) {
      return fn();
    }

    this.logger.info('Executing with heartbeat', { executionId });

    // Initialize heartbeat
    this.heartbeats.set(executionId, {
      executionId,
      lastHeartbeat: new Date().toISOString(),
      status: 'running',
      progress: 0,
    });

    // Start heartbeat interval
    const heartbeatInterval = setInterval(() => {
      this.updateHeartbeat(executionId, 0);
    }, opts.heartbeatIntervalMs);

    try {
      const result = await fn();
      
      // Clear heartbeat on success
      clearInterval(heartbeatInterval);
      this.heartbeats.delete(executionId);
      
      this.logger.info('Execution with heartbeat completed successfully', { executionId });
      return result;
    } catch (error) {
      // Clear heartbeat on error
      clearInterval(heartbeatInterval);
      this.heartbeats.delete(executionId);
      
      this.logger.error('Execution with heartbeat failed', { executionId, error });
      throw error;
    }
  }

  /**
   * Update heartbeat
   */
  private updateHeartbeat(executionId: UUID, progress: number): void {
    const heartbeat = this.heartbeats.get(executionId);
    
    if (heartbeat) {
      heartbeat.lastHeartbeat = new Date().toISOString();
      heartbeat.progress = progress;
      this.heartbeats.set(executionId, heartbeat);
    }
  }

  /**
   * Execute chunked operation
   */
  async executeChunked<T, R>(
    items: T[],
    chunkFn: (chunk: T[]) => Promise<R[]>,
    options: VercelSafeExecutionOptions = {}
  ): Promise<R[]> {
    const opts = { ...DEFAULT_VERCEL_SAFE_OPTIONS, ...options };

    if (!opts.enableChunking || items.length <= opts.chunkSize) {
      return chunkFn(items);
    }

    this.logger.info('Executing chunked operation', { 
      totalItems: items.length, 
      chunkSize: opts.chunkSize 
    });

    const results: R[] = [];
    const chunks = this.chunkArray(items, opts.chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const progress = ((i + 1) / chunks.length) * 100;

      this.logger.info('Processing chunk', { 
        chunkIndex: i + 1, 
        totalChunks: chunks.length,
        progress 
      });

      const chunkResults = await this.executeWithVercelSafety(
        () => chunkFn(chunk),
        options
      );

      results.push(...chunkResults);

      if (opts.onProgress) {
        opts.onProgress(progress);
      }

      // Update heartbeat if enabled
      if (opts.enableHeartbeat) {
        this.updateHeartbeat(crypto.randomUUID() as UUID, progress);
      }
    }

    this.logger.info('Chunked operation completed', { totalResults: results.length });
    return results;
  }

  /**
   * Chunk array
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Abort execution
   */
  abortExecution(executionId: UUID): void {
    this.logger.warn('Aborting execution', { executionId });

    const heartbeat = this.heartbeats.get(executionId);
    
    if (heartbeat) {
      heartbeat.status = 'aborted';
      this.heartbeats.set(executionId, heartbeat);
    }
  }

  /**
   * Check if execution is aborted
   */
  isExecutionAborted(executionId: UUID): boolean {
    const heartbeat = this.heartbeats.get(executionId);
    return heartbeat?.status === 'aborted' || false;
  }

  /**
   * Get heartbeat status
   */
  getHeartbeatStatus(executionId: UUID): ExecutionHeartbeat | null {
    return this.heartbeats.get(executionId) || null;
  }

  /**
   * Clean up stale heartbeats
   */
  cleanupStaleHeartbeats(maxAgeMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    
    for (const [executionId, heartbeat] of this.heartbeats.entries()) {
      const heartbeatAge = now - new Date(heartbeat.lastHeartbeat).getTime();
      
      if (heartbeatAge > maxAgeMs) {
        this.logger.info('Cleaning up stale heartbeat', { executionId, age: heartbeatAge });
        this.heartbeats.delete(executionId);
      }
    }
  }

  /**
   * Get remaining time before Vercel timeout
   */
  getRemainingTime(startTime: number, timeoutMs: number = VERCEL_SERVERLESS_TIMEOUT_MS): number {
    const elapsed = Date.now() - startTime;
    const remaining = timeoutMs - elapsed - SAFETY_MARGIN_MS;
    return Math.max(0, remaining);
  }

  /**
   * Check if execution should continue based on remaining time
   */
  shouldContinueExecution(startTime: number, estimatedRemainingMs: number): boolean {
    const remainingTime = this.getRemainingTime(startTime);
    return remainingTime > estimatedRemainingMs + SAFETY_MARGIN_MS;
  }

  /**
   * Execute with graceful abort
   */
  async executeWithGracefulAbort<T>(
    executionId: UUID,
    fn: (abortSignal: { aborted: boolean }) => Promise<T>,
    options: VercelSafeExecutionOptions = {}
  ): Promise<T> {
    const abortSignal = { aborted: false };

    // Set up abort handler
    const originalOnAbort = options.onAbort;
    options.onAbort = () => {
      abortSignal.aborted = true;
      if (originalOnAbort) {
        originalOnAbort();
      }
    };

    return this.executeWithVercelSafety(() => fn(abortSignal), options);
  }

  /**
   * Get Vercel timeout limit based on environment
   */
  getVercelTimeoutLimit(): number {
    // Check if running in Vercel Pro environment
    if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
      return VERCEL_PRO_TIMEOUT_MS;
    }
    
    return VERCEL_SERVERLESS_TIMEOUT_MS;
  }

  /**
   * Calculate safe timeout for execution
   */
  calculateSafeTimeout(estimatedDurationMs: number): number {
    const vercelLimit = this.getVercelTimeoutLimit();
    const safeTimeout = Math.min(estimatedDurationMs, vercelLimit - SAFETY_MARGIN_MS);
    return Math.max(safeTimeout, 1000); // Minimum 1 second
  }
}

/**
 * Singleton instance
 */
export const vercelSafeExecutionStrategy = new VercelSafeExecutionStrategy();

/**
 * Convenience functions
 */
export async function executeWithVercelSafety<T>(fn: () => Promise<T>, options?: VercelSafeExecutionOptions): Promise<T> {
  return vercelSafeExecutionStrategy.executeWithVercelSafety(fn, options);
}

export async function executeChunked<T, R>(
  items: T[],
  chunkFn: (chunk: T[]) => Promise<R[]>,
  options?: VercelSafeExecutionOptions
): Promise<R[]> {
  return vercelSafeExecutionStrategy.executeChunked(items, chunkFn, options);
}

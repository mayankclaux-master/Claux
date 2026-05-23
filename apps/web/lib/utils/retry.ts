/**
 * Retry Wrapper Utility
 * 
 * Canonical retry utility for CLAUX V1.
 * Exponential backoff, max retry limits, retry only transient failures.
 * 
 * CRITICAL: This is the ONLY retry utility in CLAUX.
 */

/**
 * Retry options
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
    // Retry on network errors, timeouts, and 5xx errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('5') // 5xx errors
      );
    }
    return false;
  },
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };

  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === opts.maxRetries) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);
      
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, error);
      }

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry with default options
 */
export async function retry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn);
}

/**
 * Retry with custom max retries
 */
export async function retryWithMaxRetries<T>(
  fn: () => Promise<T>,
  maxRetries: number
): Promise<T> {
  return withRetry(fn, { maxRetries });
}

/**
 * Retry with custom delay
 */
export async function retryWithDelay<T>(
  fn: () => Promise<T>,
  initialDelayMs: number
): Promise<T> {
  return withRetry(fn, { initialDelayMs });
}

/**
 * Retry with custom backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  backoffMultiplier: number
): Promise<T> {
  return withRetry(fn, { backoffMultiplier });
}

/**
 * Retry with custom shouldRetry predicate
 */
export async function retryWithPredicate<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean
): Promise<T> {
  return withRetry(fn, { shouldRetry });
}

/**
 * Common retry predicates
 */

/**
 * Retry on network errors
 */
export function shouldRetryNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('etimedout')
    );
  }
  return false;
}

/**
 * Retry on 5xx errors
 */
export function shouldRetry5xxError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('5');
  }
  return false;
}

/**
 * Retry on rate limit errors
 */
export function shouldRetryRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('too many requests')
    );
  }
  return false;
}

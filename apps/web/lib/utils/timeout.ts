/**
 * Timeout Protection
 * 
 * Timeout wrapper for CLAUX V1.
 * Protects external APIs, prevents hanging executions, configurable timeout limits.
 * 
 * CRITICAL: This is the ONLY timeout protection in CLAUX.
 */

/**
 * Timeout error
 */
export class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Timeout options
 */
export interface TimeoutOptions {
  timeoutMs: number;
  onTimeout?: () => void;
}

/**
 * Default timeout values (in milliseconds)
 */
export const DEFAULT_TIMEOUTS = {
  API: 30000, // 30 seconds
  CONNECTOR: 30000, // 30 seconds
  DATABASE: 10000, // 10 seconds
  EXTERNAL_API: 60000, // 60 seconds
  LONG_RUNNING: 300000, // 5 minutes
} as const;

/**
 * Wrap function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeoutMs, onTimeout } = options;

  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        if (onTimeout) {
          onTimeout();
        }
        reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, timeoutMs));
      }, timeoutMs);

      // Cleanup on success
      fn().then(() => clearTimeout(timeoutId));
    }),
  ]);
}

/**
 * Wrap async function with timeout (method decorator style)
 */
export function timeout(timeoutMs: number) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
      return withTimeout(
        () => originalMethod!.apply(this, args) as Promise<ReturnType<T>>,
        { timeoutMs }
      );
    } as T;

    return descriptor;
  };
}

/**
 * Execute with default API timeout
 */
export async function withApiTimeout<T>(fn: () => Promise<T>): Promise<T> {
  return withTimeout(fn, { timeoutMs: DEFAULT_TIMEOUTS.API });
}

/**
 * Execute with default connector timeout
 */
export async function withConnectorTimeout<T>(fn: () => Promise<T>): Promise<T> {
  return withTimeout(fn, { timeoutMs: DEFAULT_TIMEOUTS.CONNECTOR });
}

/**
 * Execute with default database timeout
 */
export async function withDatabaseTimeout<T>(fn: () => Promise<T>): Promise<T> {
  return withTimeout(fn, { timeoutMs: DEFAULT_TIMEOUTS.DATABASE });
}

/**
 * Execute with default external API timeout
 */
export async function withExternalApiTimeout<T>(fn: () => Promise<T>): Promise<T> {
  return withTimeout(fn, { timeoutMs: DEFAULT_TIMEOUTS.EXTERNAL_API });
}

/**
 * Execute with default long-running timeout
 */
export async function withLongRunningTimeout<T>(fn: () => Promise<T>): Promise<T> {
  return withTimeout(fn, { timeoutMs: DEFAULT_TIMEOUTS.LONG_RUNNING });
}

/**
 * Check if error is timeout error
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

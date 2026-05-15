/**
 * Provider Resilience Layer
 * 
 * Hardens OpenAI and DataForSEO providers with:
 * - circuit breakers
 * - adaptive retries
 * - provider cooldown windows
 * - transient failure classification
 * - timeout escalation
 * - provider health scoring
 */

export interface ProviderConfig {
  name: string;
  maxRetries: number;
  initialRetryDelayMs: number;
  maxRetryDelayMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeoutMs: number;
  cooldownWindowMs: number;
  timeoutMs: number;
}

export interface ProviderHealth {
  provider: string;
  healthy: boolean;
  successRate: number;
  failureCount: number;
  lastFailureAt: string | null;
  circuitOpen: boolean;
  circuitOpenedAt: string | null;
  cooldownUntil: string | null;
}

export interface ProviderRequestResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount: number;
  latencyMs: number;
  circuitTripped?: boolean;
  cooldownActive?: boolean;
}

export class ProviderResilience {
  private configs: Map<string, ProviderConfig>;
  private healthScores: Map<string, ProviderHealth>;
  private failureCounts: Map<string, number>;
  private circuitOpenAt: Map<string, number>;
  private cooldownUntil: Map<string, number>;

  constructor() {
    this.configs = new Map();
    this.healthScores = new Map();
    this.failureCounts = new Map();
    this.circuitOpenAt = new Map();
    this.cooldownUntil = new Map();

    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    // OpenAI configuration
    this.configs.set('OpenAI', {
      name: 'OpenAI',
      maxRetries: 3,
      initialRetryDelayMs: 1000,
      maxRetryDelayMs: 10000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeoutMs: 60000, // 1 minute
      cooldownWindowMs: 300000, // 5 minutes
      timeoutMs: 30000, // 30 seconds
    });

    // DataForSEO configuration
    this.configs.set('DataForSEO', {
      name: 'DataForSEO',
      maxRetries: 5,
      initialRetryDelayMs: 2000,
      maxRetryDelayMs: 20000,
      circuitBreakerThreshold: 10,
      circuitBreakerTimeoutMs: 120000, // 2 minutes
      cooldownWindowMs: 600000, // 10 minutes
      timeoutMs: 60000, // 60 seconds
    });
  }

  /**
   * Execute provider request with resilience
   */
  async executeWithResilience<T>(
    provider: string,
    requestFn: () => Promise<T>
  ): Promise<ProviderRequestResult<T>> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    // Check circuit breaker
    if (this.isCircuitOpen(provider)) {
      return {
        success: false,
        error: 'Circuit breaker open',
        circuitTripped: true,
        retryCount: 0,
        latencyMs: 0,
      };
    }

    // Check cooldown
    if (this.isCooldownActive(provider)) {
      return {
        success: false,
        error: 'Provider cooldown active',
        cooldownActive: true,
        retryCount: 0,
        latencyMs: 0,
      };
    }

    // Execute with adaptive retries
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= config.maxRetries) {
      const startTime = Date.now();

      try {
        // Add timeout to request
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), config.timeoutMs);
        });

        const result = await Promise.race([requestFn(), timeoutPromise]);
        const latencyMs = Date.now() - startTime;

        // Success - update health
        this.recordSuccess(provider);

        return {
          success: true,
          data: result,
          retryCount,
          latencyMs,
        };
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        lastError = error as Error;

        // Classify failure
        const isTransient = this.isTransientError(error as Error);

        if (!isTransient) {
          // Non-transient error - don't retry
          this.recordFailure(provider);
          return {
            success: false,
            error: lastError.message,
            retryCount,
            latencyMs,
          };
        }

        // Transient error - retry
        retryCount++;
        this.recordFailure(provider);

        if (retryCount <= config.maxRetries) {
          // Exponential backoff with jitter
          const delay = Math.min(
            config.initialRetryDelayMs * Math.pow(2, retryCount - 1),
            config.maxRetryDelayMs
          );
          const jitter = Math.random() * 0.2 * delay; // 20% jitter
          await this.sleep(delay + jitter);
        }
      }
    }

    // All retries exhausted - check circuit breaker
    this.checkCircuitBreaker(provider);

    return {
      success: false,
      error: lastError?.message || 'Max retries exceeded',
      retryCount,
      latencyMs: 0,
    };
  }

  /**
   * Check if error is transient (retryable)
   */
  private isTransientError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('timeout') || message.includes('econnreset') || message.includes('etimedout')) {
      return true;
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      return true;
    }

    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }

    return false;
  }

  /**
   * Record successful request
   */
  private recordSuccess(provider: string): void {
    this.failureCounts.set(provider, 0);
    this.circuitOpenAt.delete(provider);
  }

  /**
   * Record failed request
   */
  private recordFailure(provider: string): void {
    const currentCount = this.failureCounts.get(provider) || 0;
    this.failureCounts.set(provider, currentCount + 1);
  }

  /**
   * Check if circuit breaker should be opened
   */
  private checkCircuitBreaker(provider: string): void {
    const config = this.configs.get(provider);
    if (!config) return;

    const failureCount = this.failureCounts.get(provider) || 0;
    if (failureCount >= config.circuitBreakerThreshold) {
      this.circuitOpenAt.set(provider, Date.now());
      this.cooldownUntil.set(provider, Date.now() + config.cooldownWindowMs);
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(provider: string): boolean {
    const config = this.configs.get(provider);
    if (!config) return false;

    const openedAt = this.circuitOpenAt.get(provider);
    if (!openedAt) return false;

    // Check if circuit breaker timeout has elapsed
    if (Date.now() - openedAt > config.circuitBreakerTimeoutMs) {
      this.circuitOpenAt.delete(provider);
      return false;
    }

    return true;
  }

  /**
   * Check if cooldown is active
   */
  private isCooldownActive(provider: string): boolean {
    const cooldownEnd = this.cooldownUntil.get(provider);
    if (!cooldownEnd) return false;

    if (Date.now() > cooldownEnd) {
      this.cooldownUntil.delete(provider);
      return false;
    }

    return true;
  }

  /**
   * Get provider health
   */
  getProviderHealth(provider: string): ProviderHealth {
    const config = this.configs.get(provider);
    const failureCount = this.failureCounts.get(provider) || 0;
    const openedAt = this.circuitOpenAt.get(provider);
    const cooldownEnd = this.cooldownUntil.get(provider);

    return {
      provider,
      healthy: !this.isCircuitOpen(provider) && !this.isCooldownActive(provider),
      successRate: config ? Math.max(0, 1 - failureCount / config.circuitBreakerThreshold) : 0,
      failureCount,
      lastFailureAt: openedAt ? new Date(openedAt).toISOString() : null,
      circuitOpen: this.isCircuitOpen(provider),
      circuitOpenedAt: openedAt ? new Date(openedAt).toISOString() : null,
      cooldownUntil: cooldownEnd ? new Date(cooldownEnd).toISOString() : null,
    };
  }

  /**
   * Reset provider circuit breaker
   */
  resetCircuitBreaker(provider: string): void {
    this.circuitOpenAt.delete(provider);
    this.cooldownUntil.delete(provider);
    this.failureCounts.set(provider, 0);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let providerResilienceInstance: ProviderResilience | null = null;

export function getProviderResilience(): ProviderResilience {
  if (!providerResilienceInstance) {
    providerResilienceInstance = new ProviderResilience();
  }
  return providerResilienceInstance;
}

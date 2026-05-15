/**
 * CLAUX Runtime Governance Layer - Rate Limiting
 */

import type { RateLimit, TenantId } from './types';
import { RateLimitError } from './errors';
import { DEFAULT_RATE_LIMIT, DEFAULT_RATE_LIMIT_WINDOW } from './constants';

/**
 * Rate Limit Manager
 */
export class RateLimitManager {
  private limits: Map<string, RateLimit> = new Map();
  private counters: Map<string, TokenBucket> = new Map();

  /**
   * Set rate limit
   */
  setRateLimit(key: string, limit: RateLimit): void {
    this.limits.set(key, limit);
  }

  /**
   * Check rate limit
   */
  check(key: string): boolean {
    const limit = this.limits.get(key) || this.defaultLimit();
    const bucket = this.getOrCreateBucket(key, limit);

    return bucket.consume();
  }

  /**
   * Get remaining
   */
  getRemaining(key: string): number {
    const bucket = this.counters.get(key);
    if (!bucket) return 0;
    return bucket.tokens;
  }

  /**
   * Reset
   */
  reset(key: string): void {
    this.counters.delete(key);
  }

  /**
   * Clear
   */
  clear(): void {
    this.limits.clear();
    this.counters.clear();
  }

  /**
   * Get or create bucket
   */
  private getOrCreateBucket(key: string, limit: RateLimit): TokenBucket {
    let bucket = this.counters.get(key);
    if (!bucket || bucket.isExpired(limit.window)) {
      bucket = new TokenBucket(limit.limit, limit.burst || limit.limit);
      this.counters.set(key, bucket);
    }
    return bucket;
  }

  /**
   * Default limit
   */
  private defaultLimit(): RateLimit {
    return {
      limit: DEFAULT_RATE_LIMIT,
      window: DEFAULT_RATE_LIMIT_WINDOW,
    };
  }
}

/**
 * Token Bucket
 */
class TokenBucket {
  tokens: number;
  lastRefill: number;

  constructor(private capacity: number, private burst: number) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(): boolean {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }

  refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed >= 1000) {
      this.tokens = Math.min(this.tokens + 1, this.capacity);
      this.lastRefill = now;
    }
  }

  isExpired(window: number): boolean {
    return Date.now() - this.lastRefill > window;
  }
}

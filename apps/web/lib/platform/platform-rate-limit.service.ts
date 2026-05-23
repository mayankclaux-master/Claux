/**
 * Platform Rate Limit Service
 * 
 * Canonical rate limiting service for CLAUX V1 platform edge hardening.
 * Protects onboarding routes, execution routes, connector routes, dashboard APIs, command centre APIs, OAuth callbacks.
 * Tenant-aware limits, IP-aware limits, burst protection, cron flood protection, retry flood protection.
 * NO REDIS - uses Supabase + memory-safe local fallback.
 * 
 * CRITICAL: This is the ONLY rate limiting service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  reason?: string;
}

/**
 * Rate limit config
 */
export interface RateLimitConfig {
  tenantLimit: number; // requests per minute per tenant
  ipLimit: number; // requests per minute per IP
  burstLimit: number; // burst requests per 10 seconds
  cronLimit: number; // cron executions per minute
  retryLimit: number; // retry attempts per minute
}

/**
 * In-memory rate limit cache (fallback)
 */
interface RateLimitCache {
  tenant: Map<string, { count: number; resetAt: number }>;
  ip: Map<string, { count: number; resetAt: number }>;
  burst: Map<string, { count: number; resetAt: number }>;
  cron: Map<string, { count: number; resetAt: number }>;
  retry: Map<string, { count: number; resetAt: number }>;
}

/**
 * Platform rate limit service
 */
export class PlatformRateLimitService {
  private logger: Logger;
  private cache: RateLimitCache;
  private readonly DEFAULT_CONFIG: RateLimitConfig = {
    tenantLimit: 100, // 100 requests per minute per tenant
    ipLimit: 60, // 60 requests per minute per IP
    burstLimit: 20, // 20 requests per 10 seconds
    cronLimit: 30, // 30 cron executions per minute
    retryLimit: 10, // 10 retry attempts per minute
  };

  constructor() {
    this.logger = createLogger();
    this.cache = {
      tenant: new Map(),
      ip: new Map(),
      burst: new Map(),
      cron: new Map(),
      retry: new Map(),
    };
  }

  /**
   * Check tenant rate limit
   */
  async checkTenantLimit(tenantId: UUID, token: string): Promise<RateLimitResult> {
    const key = `tenant:${tenantId}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // Check cache first
    const cached = this.cache.tenant.get(key);
    if (cached && cached.resetAt > now) {
      if (cached.count >= this.DEFAULT_CONFIG.tenantLimit) {
        return {
          allowed: false,
          limit: this.DEFAULT_CONFIG.tenantLimit,
          remaining: 0,
          resetAt: cached.resetAt,
          reason: 'Tenant rate limit exceeded',
        };
      }
      cached.count++;
      return {
        allowed: true,
        limit: this.DEFAULT_CONFIG.tenantLimit,
        remaining: this.DEFAULT_CONFIG.tenantLimit - cached.count,
        resetAt: cached.resetAt,
      };
    }

    // Reset cache
    this.cache.tenant.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    // Persist to Supabase for distributed tracking
    await this.persistRateLimit('tenant', tenantId, 1, now + windowMs, token);

    return {
      allowed: true,
      limit: this.DEFAULT_CONFIG.tenantLimit,
      remaining: this.DEFAULT_CONFIG.tenantLimit - 1,
      resetAt: now + windowMs,
    };
  }

  /**
   * Check IP rate limit
   */
  async checkIpLimit(ip: string, token: string): Promise<RateLimitResult> {
    const key = `ip:${ip}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // Check cache first
    const cached = this.cache.ip.get(key);
    if (cached && cached.resetAt > now) {
      if (cached.count >= this.DEFAULT_CONFIG.ipLimit) {
        return {
          allowed: false,
          limit: this.DEFAULT_CONFIG.ipLimit,
          remaining: 0,
          resetAt: cached.resetAt,
          reason: 'IP rate limit exceeded',
        };
      }
      cached.count++;
      return {
        allowed: true,
        limit: this.DEFAULT_CONFIG.ipLimit,
        remaining: this.DEFAULT_CONFIG.ipLimit - cached.count,
        resetAt: cached.resetAt,
      };
    }

    // Reset cache
    this.cache.ip.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      limit: this.DEFAULT_CONFIG.ipLimit,
      remaining: this.DEFAULT_CONFIG.ipLimit - 1,
      resetAt: now + windowMs,
    };
  }

  /**
   * Check burst limit
   */
  async checkBurstLimit(identifier: string): Promise<RateLimitResult> {
    const key = `burst:${identifier}`;
    const now = Date.now();
    const windowMs = 10 * 1000; // 10 seconds

    // Check cache first
    const cached = this.cache.burst.get(key);
    if (cached && cached.resetAt > now) {
      if (cached.count >= this.DEFAULT_CONFIG.burstLimit) {
        return {
          allowed: false,
          limit: this.DEFAULT_CONFIG.burstLimit,
          remaining: 0,
          resetAt: cached.resetAt,
          reason: 'Burst limit exceeded',
        };
      }
      cached.count++;
      return {
        allowed: true,
        limit: this.DEFAULT_CONFIG.burstLimit,
        remaining: this.DEFAULT_CONFIG.burstLimit - cached.count,
        resetAt: cached.resetAt,
      };
    }

    // Reset cache
    this.cache.burst.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      limit: this.DEFAULT_CONFIG.burstLimit,
      remaining: this.DEFAULT_CONFIG.burstLimit - 1,
      resetAt: now + windowMs,
    };
  }

  /**
   * Check cron execution limit
   */
  async checkCronLimit(tenantId: UUID, token: string): Promise<RateLimitResult> {
    const key = `cron:${tenantId}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // Check cache first
    const cached = this.cache.cron.get(key);
    if (cached && cached.resetAt > now) {
      if (cached.count >= this.DEFAULT_CONFIG.cronLimit) {
        return {
          allowed: false,
          limit: this.DEFAULT_CONFIG.cronLimit,
          remaining: 0,
          resetAt: cached.resetAt,
          reason: 'Cron execution limit exceeded',
        };
      }
      cached.count++;
      return {
        allowed: true,
        limit: this.DEFAULT_CONFIG.cronLimit,
        remaining: this.DEFAULT_CONFIG.cronLimit - cached.count,
        resetAt: cached.resetAt,
      };
    }

    // Reset cache
    this.cache.cron.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      limit: this.DEFAULT_CONFIG.cronLimit,
      remaining: this.DEFAULT_CONFIG.cronLimit - 1,
      resetAt: now + windowMs,
    };
  }

  /**
   * Check retry limit
   */
  async checkRetryLimit(identifier: string): Promise<RateLimitResult> {
    const key = `retry:${identifier}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // Check cache first
    const cached = this.cache.retry.get(key);
    if (cached && cached.resetAt > now) {
      if (cached.count >= this.DEFAULT_CONFIG.retryLimit) {
        return {
          allowed: false,
          limit: this.DEFAULT_CONFIG.retryLimit,
          remaining: 0,
          resetAt: cached.resetAt,
          reason: 'Retry limit exceeded',
        };
      }
      cached.count++;
      return {
        allowed: true,
        limit: this.DEFAULT_CONFIG.retryLimit,
        remaining: this.DEFAULT_CONFIG.retryLimit - cached.count,
        resetAt: cached.resetAt,
      };
    }

    // Reset cache
    this.cache.retry.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      limit: this.DEFAULT_CONFIG.retryLimit,
      remaining: this.DEFAULT_CONFIG.retryLimit - 1,
      resetAt: now + windowMs,
    };
  }

  /**
   * Persist rate limit to Supabase
   */
  private async persistRateLimit(
    type: string,
    identifier: string,
    count: number,
    resetAt: number,
    token: string
  ): Promise<void> {
    try {
      const supabase = createClerkSupabaseClient(token);

      const { error } = await supabase
        .from('rate_limits')
        .upsert({
          type,
          identifier,
          count,
          reset_at: new Date(resetAt).toISOString(),
        }, {
          onConflict: 'type,identifier',
        });

      if (error) {
        this.logger.warn('Failed to persist rate limit', { error, type, identifier });
      }
    } catch (error) {
      this.logger.warn('Failed to persist rate limit', { error, type, identifier });
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache(): void {
    const now = Date.now();

    for (const [key, value] of this.cache.tenant.entries()) {
      if (value.resetAt <= now) {
        this.cache.tenant.delete(key);
      }
    }

    for (const [key, value] of this.cache.ip.entries()) {
      if (value.resetAt <= now) {
        this.cache.ip.delete(key);
      }
    }

    for (const [key, value] of this.cache.burst.entries()) {
      if (value.resetAt <= now) {
        this.cache.burst.delete(key);
      }
    }

    for (const [key, value] of this.cache.cron.entries()) {
      if (value.resetAt <= now) {
        this.cache.cron.delete(key);
      }
    }

    for (const [key, value] of this.cache.retry.entries()) {
      if (value.resetAt <= now) {
        this.cache.retry.delete(key);
      }
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(tenantId: UUID, ip: string): Promise<{
    tenant: RateLimitResult;
    ip: RateLimitResult;
  }> {
    const tenantResult = await this.checkTenantLimit(tenantId, '');
    const ipResult = await this.checkIpLimit(ip, '');

    return {
      tenant: tenantResult,
      ip: ipResult,
    };
  }
}

/**
 * Singleton instance
 */
export const platformRateLimitService = new PlatformRateLimitService();

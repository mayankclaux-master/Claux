/**
 * Cache Control Service
 * 
 * Canonical cache control service for CLAUX V1 platform edge hardening.
 * Tenant-safe cache keys, no cross-tenant cache leakage, dashboard cache TTLs, execution cache invalidation, onboarding cache invalidation, connector health cache, trend cache.
 * Prevents stale dashboard states after executions.
 * 
 * CRITICAL: This is the ONLY cache control service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Cache entry
 */
interface CacheEntry<T> {
  data: T;
  tenantId: UUID;
  expiresAt: number;
  createdAt: number;
}

/**
 * Cache config
 */
export interface CacheConfig {
  dashboardTtl: number; // 5 minutes
  executionTtl: number; // 1 minute
  onboardingTtl: number; // 10 minutes
  connectorHealthTtl: number; // 2 minutes
  trendTtl: number; // 15 minutes
  tenantIsolation: boolean;
}

/**
 * Cache control service
 */
export class CacheControlService {
  private logger: Logger;
  private cache: Map<string, CacheEntry<unknown>>;
  private readonly DEFAULT_CONFIG: CacheConfig = {
    dashboardTtl: 5 * 60 * 1000, // 5 minutes
    executionTtl: 1 * 60 * 1000, // 1 minute
    onboardingTtl: 10 * 60 * 1000, // 10 minutes
    connectorHealthTtl: 2 * 60 * 1000, // 2 minutes
    trendTtl: 15 * 60 * 1000, // 15 minutes
    tenantIsolation: true,
  };

  constructor() {
    this.logger = createLogger();
    this.cache = new Map();
  }

  /**
   * Generate tenant-safe cache key
   */
  private generateCacheKey(tenantId: UUID, key: string): string {
    if (this.DEFAULT_CONFIG.tenantIsolation) {
      return `tenant:${tenantId}:${key}`;
    }
    return key;
  }

  /**
   * Set cache entry
   */
  set<T>(tenantId: UUID, key: string, data: T, ttl: number): void {
    const cacheKey = this.generateCacheKey(tenantId, key);
    const now = Date.now();

    this.cache.set(cacheKey, {
      data,
      tenantId,
      expiresAt: now + ttl,
      createdAt: now,
    });

    this.logger.debug('Cache set', { tenantId, key, ttl });
  }

  /**
   * Get cache entry
   */
  get<T>(tenantId: UUID, key: string): T | null {
    const cacheKey = this.generateCacheKey(tenantId, key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Verify tenant isolation
    if (this.DEFAULT_CONFIG.tenantIsolation && entry.tenantId !== tenantId) {
      this.logger.warn('Cache tenant mismatch', { tenantId, cacheKey });
      return null;
    }

    return entry.data as T;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(tenantId: UUID, key: string): void {
    const cacheKey = this.generateCacheKey(tenantId, key);
    this.cache.delete(cacheKey);
    this.logger.debug('Cache invalidated', { tenantId, key });
  }

  /**
   * Invalidate all tenant cache
   */
  invalidateTenant(tenantId: UUID): void {
    const prefix = `tenant:${tenantId}:`;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    this.logger.info('Tenant cache invalidated', { tenantId, count: keysToDelete.length });
  }

  /**
   * Invalidate dashboard cache
   */
  invalidateDashboardCache(tenantId: UUID): void {
    this.invalidateTenant(tenantId);
    this.logger.info('Dashboard cache invalidated', { tenantId });
  }

  /**
   * Invalidate execution cache
   */
  invalidateExecutionCache(tenantId: UUID, executionId: UUID): void {
    this.invalidate(tenantId, `execution:${executionId}`);
    this.invalidate(tenantId, `execution:${executionId}:result`);
    this.logger.info('Execution cache invalidated', { tenantId, executionId });
  }

  /**
   * Invalidate onboarding cache
   */
  invalidateOnboardingCache(tenantId: UUID): void {
    this.invalidate(tenantId, 'onboarding:status');
    this.invalidate(tenantId, 'onboarding:progress');
    this.logger.info('Onboarding cache invalidated', { tenantId });
  }

  /**
   * Invalidate connector health cache
   */
  invalidateConnectorHealthCache(tenantId: UUID, provider: string): void {
    this.invalidate(tenantId, `connector:${provider}:health`);
    this.logger.info('Connector health cache invalidated', { tenantId, provider });
  }

  /**
   * Invalidate trend cache
   */
  invalidateTrendCache(tenantId: UUID): void {
    this.invalidate(tenantId, 'trends:all');
    this.invalidate(tenantId, 'trends:ranking');
    this.invalidate(tenantId, 'trends:traffic');
    this.logger.info('Trend cache invalidated', { tenantId });
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.logger.debug('Expired cache entries cleaned', { count: keysToDelete.length });
    }
  }

  /**
   * Get cache stats
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    sizeBytes: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;
    let sizeBytes = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      }
      sizeBytes += JSON.stringify(entry.data).length;
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      sizeBytes,
    };
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    this.logger.info('All cache cleared');
  }

  /**
   * Get dashboard data with cache
   */
  getDashboardData<T>(tenantId: UUID, key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(tenantId, `dashboard:${key}`);
    if (cached) {
      return Promise.resolve(cached);
    }

    return fetchFn().then((data) => {
      this.set(tenantId, `dashboard:${key}`, data, this.DEFAULT_CONFIG.dashboardTtl);
      return data;
    });
  }

  /**
   * Get connector health with cache
   */
  getConnectorHealth<T>(tenantId: UUID, provider: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(tenantId, `connector:${provider}:health`);
    if (cached) {
      return Promise.resolve(cached);
    }

    return fetchFn().then((data) => {
      this.set(tenantId, `connector:${provider}:health`, data, this.DEFAULT_CONFIG.connectorHealthTtl);
      return data;
    });
  }

  /**
   * Get trend data with cache
   */
  getTrendData<T>(tenantId: UUID, key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(tenantId, `trends:${key}`);
    if (cached) {
      return Promise.resolve(cached);
    }

    return fetchFn().then((data) => {
      this.set(tenantId, `trends:${key}`, data, this.DEFAULT_CONFIG.trendTtl);
      return data;
    });
  }
}

/**
 * Singleton instance
 */
export const cacheControlService = new CacheControlService();

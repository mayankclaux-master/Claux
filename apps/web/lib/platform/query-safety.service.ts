/**
 * Query Safety Service
 * 
 * Canonical query safety service for CLAUX V1 platform edge hardening.
 * Protects against unbounded queries, massive pagination, accidental full table scans, dashboard overfetching, trend query explosion.
 * Default pagination, max query limits, safe sorting only, query timeout enforcement, lightweight summaries.
 * 
 * CRITICAL: This is the ONLY query safety service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Query safety config
 */
export interface QuerySafetyConfig {
  defaultLimit: number;
  maxLimit: number;
  defaultOffset: number;
  maxOffset: number;
  timeoutMs: number;
  allowedSortColumns: string[];
}

/**
 * Safe query options
 */
export interface SafeQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  timeoutMs?: number;
}

/**
 * Query safety result
 */
export interface QuerySafetyResult {
  safe: boolean;
  options: SafeQueryOptions;
  warnings: string[];
}

/**
 * Query safety service
 */
export class QuerySafetyService {
  private logger: Logger;
  private readonly DEFAULT_CONFIG: QuerySafetyConfig = {
    defaultLimit: 50,
    maxLimit: 500,
    defaultOffset: 0,
    maxOffset: 10000,
    timeoutMs: 30000, // 30 seconds
    allowedSortColumns: ['created_at', 'updated_at', 'id', 'name', 'status'],
  };

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Sanitize query options
   */
  sanitizeQueryOptions(
    options: SafeQueryOptions,
    customConfig?: Partial<QuerySafetyConfig>
  ): QuerySafetyResult {
    const config = { ...this.DEFAULT_CONFIG, ...customConfig };
    const warnings: string[] = [];

    // Sanitize limit
    let limit = options.limit ?? config.defaultLimit;
    if (limit > config.maxLimit) {
      warnings.push(`Limit reduced from ${limit} to ${config.maxLimit}`);
      limit = config.maxLimit;
    }
    if (limit < 1) {
      warnings.push(`Limit increased from ${limit} to 1`);
      limit = 1;
    }

    // Sanitize offset
    let offset = options.offset ?? config.defaultOffset;
    if (offset > config.maxOffset) {
      warnings.push(`Offset reduced from ${offset} to ${config.maxOffset}`);
      offset = config.maxOffset;
    }
    if (offset < 0) {
      warnings.push(`Offset increased from ${offset} to 0`);
      offset = 0;
    }

    // Sanitize sort column
    let sortBy = options.sortBy;
    if (sortBy && !config.allowedSortColumns.includes(sortBy)) {
      warnings.push(`Sort column '${sortBy}' not allowed, using default`);
      sortBy = 'created_at';
    }

    // Sanitize sort order
    let sortOrder = options.sortOrder ?? 'desc';
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      warnings.push(`Sort order '${sortOrder}' invalid, using 'desc'`);
      sortOrder = 'desc';
    }

    // Sanitize timeout
    let timeoutMs = options.timeoutMs ?? config.timeoutMs;
    if (timeoutMs > 60000) {
      warnings.push(`Timeout reduced from ${timeoutMs} to 60000ms`);
      timeoutMs = 60000;
    }
    if (timeoutMs < 1000) {
      warnings.push(`Timeout increased from ${timeoutMs} to 1000ms`);
      timeoutMs = 1000;
    }

    return {
      safe: true,
      options: {
        limit,
        offset,
        sortBy,
        sortOrder,
        timeoutMs,
      },
      warnings,
    };
  }

  /**
   * Validate pagination
   */
  validatePagination(
    page: number,
    pageSize: number,
    maxPageSize: number = 100
  ): { valid: boolean; limit: number; offset: number; warnings: string[] } {
    const warnings: string[] = [];
    let valid = true;

    // Sanitize page
    if (page < 1) {
      warnings.push(`Page ${page} invalid, using 1`);
      page = 1;
    }

    // Sanitize page size
    let limit = pageSize;
    if (limit > maxPageSize) {
      warnings.push(`Page size ${pageSize} exceeds max ${maxPageSize}, using ${maxPageSize}`);
      limit = maxPageSize;
    }
    if (limit < 1) {
      warnings.push(`Page size ${pageSize} invalid, using 10`);
      limit = 10;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Check if offset exceeds max
    if (offset > this.DEFAULT_CONFIG.maxOffset) {
      warnings.push(`Offset ${offset} exceeds max ${this.DEFAULT_CONFIG.maxOffset}`);
      valid = false;
    }

    return { valid, limit, offset, warnings };
  }

  /**
   * Enforce query timeout
   */
  async enforceQueryTimeout<T>(
    queryFn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout exceeded')), timeoutMs);
    });

    return Promise.race([queryFn(), timeoutPromise]);
  }

  /**
   * Validate sort column
   */
  validateSortColumn(column: string, allowedColumns: string[]): boolean {
    return allowedColumns.includes(column);
  }

  /**
   * Get safe default options
   */
  getSafeDefaults(): SafeQueryOptions {
    return {
      limit: this.DEFAULT_CONFIG.defaultLimit,
      offset: this.DEFAULT_CONFIG.defaultOffset,
      sortBy: 'created_at',
      sortOrder: 'desc',
      timeoutMs: this.DEFAULT_CONFIG.timeoutMs,
    };
  }

  /**
   * Check for potential full table scan
   */
  detectFullTableScan(options: SafeQueryOptions, estimatedRows: number): boolean {
    // If no limit or offset, or limit is very high, potential full table scan
    if (!options.limit || options.limit > estimatedRows * 0.5) {
      return true;
    }
    return false;
  }

  /**
   * Generate lightweight summary
   */
  generateLightweightSummary<T>(
    data: T[],
    maxItems: number = 10
  ): { summary: T[]; total: number; truncated: boolean } {
    const total = data.length;
    const truncated = total > maxItems;
    const summary = data.slice(0, maxItems);

    return { summary, total, truncated };
  }
}

/**
 * Singleton instance
 */
export const querySafetyService = new QuerySafetyService();

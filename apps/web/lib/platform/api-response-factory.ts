/**
 * API Response Factory
 * 
 * Canonical API response factory for CLAUX V1 platform edge hardening.
 * Standardizes all API responses with canonical format: success, data, error, traceId, executionTime, pagination, warnings.
 * 
 * CRITICAL: This is the ONLY API response factory in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * API response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  traceId?: UUID;
  executionTime?: number;
  pagination?: PaginationMetadata;
  warnings?: string[];
}

/**
 * API response factory
 */
export class ApiResponseFactory {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Create success response
   */
  success<T>(data: T, options?: {
    traceId?: UUID;
    executionTime?: number;
    pagination?: PaginationMetadata;
    warnings?: string[];
  }): ApiResponse<T> {
    return {
      success: true,
      data,
      traceId: options?.traceId,
      executionTime: options?.executionTime,
      pagination: options?.pagination,
      warnings: options?.warnings,
    };
  }

  /**
   * Create error response
   */
  error(error: string, options?: {
    traceId?: UUID;
    executionTime?: number;
    warnings?: string[];
  }): ApiResponse {
    return {
      success: false,
      error,
      traceId: options?.traceId,
      executionTime: options?.executionTime,
      warnings: options?.warnings,
    };
  }

  /**
   * Create paginated response
   */
  paginated<T>(
    data: T[],
    page: number,
    pageSize: number,
    total: number,
    options?: {
      traceId?: UUID;
      executionTime?: number;
      warnings?: string[];
    }
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(total / pageSize);
    const pagination: PaginationMetadata = {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    return {
      success: true,
      data,
      traceId: options?.traceId,
      executionTime: options?.executionTime,
      pagination,
      warnings: options?.warnings,
    };
  }

  /**
   * Create response with warnings
   */
  withWarnings<T>(response: ApiResponse<T>, warnings: string[]): ApiResponse<T> {
    return {
      ...response,
      warnings: [...(response.warnings || []), ...warnings],
    };
  }

  /**
   * Create rate limit response
   */
  rateLimit(options?: {
    traceId?: UUID;
    executionTime?: number;
  }): ApiResponse {
    return {
      success: false,
      error: 'Rate limit exceeded',
      traceId: options?.traceId,
      executionTime: options?.executionTime,
    };
  }

  /**
   * Create validation error response
   */
  validationError(errors: string[], options?: {
    traceId?: UUID;
    executionTime?: number;
  }): ApiResponse {
    return {
      success: false,
      error: 'Validation failed',
      traceId: options?.traceId,
      executionTime: options?.executionTime,
      warnings: errors,
    };
  }

  /**
   * Create not found response
   */
  notFound(resource: string, options?: {
    traceId?: UUID;
    executionTime?: number;
  }): ApiResponse {
    return {
      success: false,
      error: `${resource} not found`,
      traceId: options?.traceId,
      executionTime: options?.executionTime,
    };
  }

  /**
   * Create unauthorized response
   */
  unauthorized(options?: {
    traceId?: UUID;
    executionTime?: number;
  }): ApiResponse {
    return {
      success: false,
      error: 'Unauthorized',
      traceId: options?.traceId,
      executionTime: options?.executionTime,
    };
  }

  /**
   * Create forbidden response
   */
  forbidden(options?: {
    traceId?: UUID;
    executionTime?: number;
  }): ApiResponse {
    return {
      success: false,
      error: 'Forbidden',
      traceId: options?.traceId,
      executionTime: options?.executionTime,
    };
  }

  /**
   * Create internal server error response
   */
  internalError(error?: string, options?: {
    traceId?: UUID;
    executionTime?: number;
  }): ApiResponse {
    return {
      success: false,
      error: error || 'Internal server error',
      traceId: options?.traceId,
      executionTime: options?.executionTime,
    };
  }

  /**
   * Wrap async function with response factory
   */
  async wrap<T>(
    fn: () => Promise<T>,
    traceId?: UUID
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();

    try {
      const data = await fn();
      const executionTime = Date.now() - startTime;

      return this.success(data, { traceId, executionTime });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('API error', { error, traceId });

      return this.error(errorMessage, { traceId, executionTime }) as ApiResponse<T>;
    }
  }

  /**
   * Create empty success response
   */
  empty(options?: {
    traceId?: UUID;
    executionTime?: number;
  }): ApiResponse<void> {
    return {
      success: true,
      data: undefined,
      traceId: options?.traceId,
      executionTime: options?.executionTime,
    };
  }
}

/**
 * Singleton instance
 */
export const apiResponseFactory = new ApiResponseFactory();

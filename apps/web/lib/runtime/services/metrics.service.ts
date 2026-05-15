/**
 * Metrics Service
 * 
 * Business logic for runtime metrics and analytics
 * Provides aggregated statistics and performance insights
 */

import type { UUID, ISODateTime, Result } from '../types/common.types';
import { MetricsRepository } from '../repositories';
import type {
  ExecutionMetrics,
  TaskMetrics,
  EventMetrics,
  LogMetrics,
  CostMetrics,
  TokenMetrics,
  FailureRateMetrics,
  DurationMetrics,
} from '../repositories';
import { RuntimeDatabaseError } from '../db';
import {
  logServiceOperation,
  logServiceError,
  wrapRepositoryError,
  ServiceConfig,
  ServiceContext,
} from './types';

/**
 * Metrics service configuration
 */
export interface MetricsServiceConfig extends ServiceConfig {}

/**
 * Metrics service
 * Manages metrics aggregation and analytics
 */
export class MetricsService {
  private repository: MetricsRepository;
  private config: MetricsServiceConfig;

  constructor(config: MetricsServiceConfig) {
    this.config = config;
    this.repository = new MetricsRepository(config.tenantId);
  }

  /**
   * Get execution metrics
   */
  async getExecutionMetrics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<ExecutionMetrics, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'MetricsService',
      operation: 'getExecutionMetrics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const result = await this.repository.getExecutionMetrics({
      created_after: options?.createdAfter,
      created_before: options?.createdBefore,
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
      return { success: false, error: wrapRepositoryError(result.error, 'MetricsService', 'getExecutionMetrics') };
    }

    return result;
  }

  /**
   * Get task metrics
   */
  async getTaskMetrics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<TaskMetrics, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'MetricsService',
      operation: 'getTaskMetrics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const result = await this.repository.getTaskMetrics({
      created_after: options?.createdAfter,
      created_before: options?.createdBefore,
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
      return { success: false, error: wrapRepositoryError(result.error, 'MetricsService', 'getTaskMetrics') };
    }

    return result;
  }

  /**
   * Get event metrics
   */
  async getEventMetrics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<EventMetrics, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'MetricsService',
      operation: 'getEventMetrics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const result = await this.repository.getEventMetrics({
      created_after: options?.createdAfter,
      created_before: options?.createdBefore,
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
      return { success: false, error: wrapRepositoryError(result.error, 'MetricsService', 'getEventMetrics') };
    }

    return result;
  }

  /**
   * Get log metrics
   */
  async getLogMetrics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<LogMetrics, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'MetricsService',
      operation: 'getLogMetrics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const result = await this.repository.getLogMetrics({
      created_after: options?.createdAfter,
      created_before: options?.createdBefore,
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
      return { success: false, error: wrapRepositoryError(result.error, 'MetricsService', 'getLogMetrics') };
    }

    return result;
  }

  /**
   * Get cost metrics
   */
  async getCostMetrics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<CostMetrics, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'MetricsService',
      operation: 'getCostMetrics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const result = await this.repository.getCostMetrics({
      created_after: options?.createdAfter,
      created_before: options?.createdBefore,
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
      return { success: false, error: wrapRepositoryError(result.error, 'MetricsService', 'getCostMetrics') };
    }

    return result;
  }

  /**
   * Get token metrics
   */
  async getTokenMetrics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<TokenMetrics, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'MetricsService',
      operation: 'getTokenMetrics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const result = await this.repository.getTokenMetrics({
      created_after: options?.createdAfter,
      created_before: options?.createdBefore,
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
      return { success: false, error: wrapRepositoryError(result.error, 'MetricsService', 'getTokenMetrics') };
    }

    return result;
  }

  /**
   * Get failure rate metrics
   */
  async getFailureRateMetrics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<FailureRateMetrics, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'MetricsService',
      operation: 'getFailureRateMetrics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const result = await this.repository.getFailureRateMetrics({
      created_after: options?.createdAfter,
      created_before: options?.createdBefore,
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
      return { success: false, error: wrapRepositoryError(result.error, 'MetricsService', 'getFailureRateMetrics') };
    }

    return result;
  }

  /**
   * Get duration metrics
   */
  async getDurationMetrics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<DurationMetrics, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'MetricsService',
      operation: 'getDurationMetrics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const result = await this.repository.getDurationMetrics({
      created_after: options?.createdAfter,
      created_before: options?.createdBefore,
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
      return { success: false, error: wrapRepositoryError(result.error, 'MetricsService', 'getDurationMetrics') };
    }

    return result;
  }
}

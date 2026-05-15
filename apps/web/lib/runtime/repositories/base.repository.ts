/**
 * Base Repository
 * 
 * Shared CRUD patterns and query execution abstraction
 * All repositories extend this base class for consistency
 */

import type {
  UUID,
  Result,
  PaginationOptions,
  SortOptions,
} from '../types/common.types';
import type { QueryConfig } from '../db';
import { RuntimeDatabaseError, RuntimeDbErrorCode } from '../db';

/**
 * Base filter interface
 * Common filter fields across repositories
 */
export interface BaseFilter {
  readonly created_after?: string;
  readonly created_before?: string;
  readonly updated_after?: string;
  readonly updated_before?: string;
}

/**
 * Base repository class
 * Provides shared CRUD operations and query patterns
 */
export abstract class BaseRepository<T, TInsert, TUpdate, TFilter extends BaseFilter> {
  /**
   * Get the table name for this repository
   */
  protected abstract getTableName(): string;

  /**
   * Get the tenant ID for the current context
   * Must be implemented by concrete repositories
   */
  protected abstract getTenantId(): UUID;

  /**
   * Get query configuration for operations
   */
  protected getQueryConfig(): QueryConfig {
    return {
      retryCount: 3,
      retryDelayMs: 100,
      timeoutMs: 30000,
      logContext: { table: this.getTableName() },
    };
  }

  /**
   * Log repository operation
   */
  protected logOperation(operation: string, context?: Record<string, unknown>): void {
    // In production, this would use a proper logging system
    // For now, we'll use console.debug for visibility
    console.debug(`[BaseRepository:${this.getTableName()}] ${operation}`, context);
  }

  /**
   * Log repository error
   */
  protected logError(operation: string, error: unknown, context?: Record<string, unknown>): void {
    console.error(`[BaseRepository:${this.getTableName()}] ERROR in ${operation}`, error, context);
  }

  /**
   * Apply base filters to a query
   */
  protected applyFilters(query: any, filter?: TFilter): any {
    if (!filter) {
      return query;
    }

    const typedFilter = filter as BaseFilter;

    if (typedFilter.created_after) {
      query = query.gte('created_at', typedFilter.created_after);
    }

    if (typedFilter.created_before) {
      query = query.lte('created_at', typedFilter.created_before);
    }

    if (typedFilter.updated_after) {
      query = query.gte('updated_at', typedFilter.updated_after);
    }

    if (typedFilter.updated_before) {
      query = query.lte('updated_at', typedFilter.updated_before);
    }

    return query;
  }

  /**
   * Create a new record
   */
  protected async create(data: TInsert): Promise<Result<T, RuntimeDatabaseError>> {
    this.logOperation('create', { data });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .insert(data)
      .select()
      .single();

    const result = await this.executeInsert(() => query);

    if (!result.success) {
      this.logError('create', result.error, { data });
    }

    return result as Result<T, RuntimeDatabaseError>;
  }

  /**
   * Create multiple records in batch
   */
  protected async createBatch(data: TInsert[]): Promise<Result<T[], RuntimeDatabaseError>> {
    this.logOperation('createBatch', { count: data.length });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .insert(data)
      .select();

    const result = await this.executeInsert(() => query);

    if (!result.success) {
      this.logError('createBatch', result.error, { count: data.length });
    }

    return result as Result<T[], RuntimeDatabaseError>;
  }

  /**
   * Find a record by ID
   */
  protected async findById(id: UUID): Promise<Result<T, RuntimeDatabaseError>> {
    this.logOperation('findById', { id });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .select()
      .eq('id', id)
      .single();

    const result = await this.executeQuery(() => query);
    return result as unknown as Result<T, RuntimeDatabaseError>;
  }

  /**
   * Find records by tenant ID
   */
  protected async findByTenant(options?: {
    filter?: TFilter;
    pagination?: PaginationOptions;
    sort?: SortOptions;
  }): Promise<Result<T[], RuntimeDatabaseError>> {
    this.logOperation('findByTenant', options);

    const client = this.getAdminClient();
    let query = client
      .from(this.getTableName())
      .select()
      .eq('tenant_id', this.getTenantId());

    // Apply filters
    if (options?.filter) {
      query = this.applyFilters(query, options.filter);
    }

    // Apply sorting
    if (options?.sort) {
      query = query.order(options.sort.column, { ascending: options.sort.direction === 'asc' });
    }

    // Apply pagination
    if (options?.pagination) {
      if (options.pagination.limit) {
        query = query.limit(options.pagination.limit);
      }
      if (options.pagination.offset) {
        query = query.range(options.pagination.offset, options.pagination.offset + (options.pagination.limit || 10) - 1);
      }
    }

    const result = await this.executeQuery(() => query);
    return result as unknown as Result<T[], RuntimeDatabaseError>;
  }

  /**
   * Update a record by ID
   */
  protected async updateById(id: UUID, data: TUpdate): Promise<Result<T, RuntimeDatabaseError>> {
    this.logOperation('updateById', { id, data });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .update(data)
      .eq('id', id)
      .select()
      .single();

    const result = await this.executeUpdate(() => query);

    if (!result.success) {
      this.logError('updateById', result.error, { id, data });
    }

    return result as Result<T, RuntimeDatabaseError>;
  }

  /**
   * Update records by tenant ID
   */
  protected async updateByTenant(data: TUpdate, filter?: TFilter): Promise<Result<T[], RuntimeDatabaseError>> {
    this.logOperation('updateByTenant', { data, filter });

    const client = this.getAdminClient();
    let query = client
      .from(this.getTableName())
      .update(data)
      .eq('tenant_id', this.getTenantId());

    if (filter) {
      query = this.applyFilters(query, filter);
    }

    query = query.select();

    const result = await this.executeUpdate(() => query);

    if (!result.success) {
      this.logError('updateByTenant', result.error, { data, filter });
    }

    return result as Result<T[], RuntimeDatabaseError>;
  }

  /**
   * Delete records by tenant ID
   */
  protected async deleteByTenant(filter?: TFilter): Promise<Result<T[], RuntimeDatabaseError>> {
    this.logOperation('deleteByTenant', { filter });

    const client = this.getAdminClient();
    let query = client
      .from(this.getTableName())
      .delete()
      .eq('tenant_id', this.getTenantId());

    if (filter) {
      query = this.applyFilters(query, filter);
    }

    query = query.select();

    const result = await this.executeDelete(() => query);

    if (!result.success) {
      this.logError('deleteByTenant', result.error, { filter });
    }

    return result as Result<T[], RuntimeDatabaseError>;
  }

  /**
   * Count records by tenant ID
   */
  protected async countByTenant(filter?: TFilter): Promise<Result<number, RuntimeDatabaseError>> {
    this.logOperation('countByTenant', { filter });

    const client = this.getAdminClient();
    let query = client
      .from(this.getTableName())
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', this.getTenantId());

    if (filter) {
      query = this.applyFilters(query, filter);
    }

    const result = await this.executeQuery(() => query);

    if (!result.success) {
      this.logError('countByTenant', result.error, { filter });
      return result;
    }

    // Extract count from result
    const count = (result.data as any)?.count || 0;
    return { success: true, data: count };
  }

  /**
   * Get admin client for repository operations
   */
  protected getAdminClient() {
    const { getRuntimeAdminClient } = require('../db');
    return getRuntimeAdminClient();
  }

  /**
   * Get authenticated client for tenant-isolated operations
   */
  protected getAuthClient() {
    const { getRuntimeAuthClient } = require('../db');
    return getRuntimeAuthClient();
  }

  /**
   * Execute query with proper error handling
   */
  private async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: Error | null }>
  ): Promise<Result<T, RuntimeDatabaseError>> {
    const { executeQuery } = require('../db');
    const result = await executeQuery(queryFn, this.getQueryConfig());
    return result as Result<T, RuntimeDatabaseError>;
  }

  /**
   * Execute insert query with proper error handling
   */
  private async executeInsert<T>(
    queryFn: () => Promise<{ data: T | null; error: Error | null }>
  ): Promise<Result<T, RuntimeDatabaseError>> {
    const { executeInsertQuery } = require('../db');
    const result = await executeInsertQuery(queryFn, this.getQueryConfig());
    return result as Result<T, RuntimeDatabaseError>;
  }

  /**
   * Execute update query with proper error handling
   */
  private async executeUpdate<T>(
    queryFn: () => Promise<{ data: T | null; error: Error | null }>
  ): Promise<Result<T, RuntimeDatabaseError>> {
    const { executeUpdateQuery } = require('../db');
    const result = await executeUpdateQuery(queryFn, this.getQueryConfig());
    return result as Result<T, RuntimeDatabaseError>;
  }

  /**
   * Execute delete query with proper error handling
   */
  private async executeDelete<T>(
    queryFn: () => Promise<{ data: T | null; error: Error | null }>
  ): Promise<Result<T, RuntimeDatabaseError>> {
    const { executeDeleteQuery } = require('../db');
    const result = await executeDeleteQuery(queryFn, this.getQueryConfig());
    return result as Result<T, RuntimeDatabaseError>;
  }
}

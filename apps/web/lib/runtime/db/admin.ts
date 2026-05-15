/**
 * Runtime Admin Database Client
 * 
 * Provides service role Supabase client for runtime operations
 * Reuses existing Supabase architecture patterns
 * Bypasses RLS for system-level operations
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Normalize Supabase URL
 * Reuses existing normalization logic from lib/supabase
 */
function normalizeSupabaseUrl(value: string): string {
  return value.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

/**
 * Create runtime admin client
 * Uses service role key, bypasses RLS
 * Suitable for system-level operations, background jobs, and admin tasks
 */
export function createRuntimeAdminClient() {
  return createClient(
    normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL),
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Runtime admin client interface
 * Wrapper around Supabase admin client with runtime-specific typing
 */
export interface RuntimeAdminClient {
  /**
   * Execute a query on a specific table
   */
  from<T = unknown>(table: string): RuntimeAdminTableClient<T>;

  /**
   * Execute RPC function
   */
  rpc<Return = unknown>(
    fn: string,
    params?: Record<string, unknown>
  ): Promise<RuntimeRpcResult<Return>>;
}

/**
 * Runtime admin table client interface
 * Provides typed table operations with admin privileges
 */
export interface RuntimeAdminTableClient<T> {
  /**
   * Select records
   */
  select<Columns = '*'>(columns?: Columns): RuntimeAdminQueryBuilder<T>;
  
  /**
   * Insert a record
   */
  insert<Row extends Partial<T>>(row: Row): RuntimeAdminInsertBuilder<T>;
  
  /**
   * Update records
   */
  update<Row extends Partial<T>>(row: Row): RuntimeAdminUpdateBuilder<T>;
  
  /**
   * Delete records
   */
  delete(): RuntimeAdminDeleteBuilder<T>;
}

/**
 * Runtime admin query builder interface
 * Type-safe query building with admin privileges
 */
export interface RuntimeAdminQueryBuilder<T> {
  eq(column: keyof T, value: unknown): RuntimeAdminQueryBuilder<T>;
  neq(column: keyof T, value: unknown): RuntimeAdminQueryBuilder<T>;
  gt(column: keyof T, value: unknown): RuntimeAdminQueryBuilder<T>;
  gte(column: keyof T, value: unknown): RuntimeAdminQueryBuilder<T>;
  lt(column: keyof T, value: unknown): RuntimeAdminQueryBuilder<T>;
  lte(column: keyof T, value: unknown): RuntimeAdminQueryBuilder<T>;
  like(column: keyof T, pattern: string): RuntimeAdminQueryBuilder<T>;
  ilike(column: keyof T, pattern: string): RuntimeAdminQueryBuilder<T>;
  in(column: keyof T, values: readonly unknown[]): RuntimeAdminQueryBuilder<T>;
  is(column: keyof T, value: unknown): RuntimeAdminQueryBuilder<T>;
  order(column: keyof T, options?: { ascending?: boolean; nullsFirst?: boolean }): RuntimeAdminQueryBuilder<T>;
  limit(count: number): RuntimeAdminQueryBuilder<T>;
  range(from: number, to: number): RuntimeAdminQueryBuilder<T>;
  single(): Promise<RuntimeAdminSingleResult<T>>;
  maybeSingle(): Promise<RuntimeAdminMaybeSingleResult<T>>;
}

/**
 * Runtime admin insert builder interface
 */
export interface RuntimeAdminInsertBuilder<T> {
  select<Columns = '*'>(columns?: Columns): RuntimeAdminQueryBuilder<T>;
}

/**
 * Runtime admin update builder interface
 */
export interface RuntimeAdminUpdateBuilder<T> {
  eq(column: keyof T, value: unknown): RuntimeAdminUpdateBuilder<T>;
  select<Columns = '*'>(columns?: Columns): RuntimeAdminQueryBuilder<T>;
}

/**
 * Runtime admin delete builder interface
 */
export interface RuntimeAdminDeleteBuilder<T> {
  eq(column: keyof T, value: unknown): RuntimeAdminDeleteBuilder<T>;
}

/**
 * Runtime admin RPC result type
 */
export interface RuntimeRpcResult<Return = unknown> {
  data: Return | null;
  error: Error | null;
}

/**
 * Runtime admin single result type
 */
export interface RuntimeAdminSingleResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Runtime admin maybe single result type
 */
export interface RuntimeAdminMaybeSingleResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Admin client pool for connection reuse
 * Maintains singleton instances for performance
 */
class AdminClientPool {
  private static instance: ReturnType<typeof createRuntimeAdminClient> | null = null;

  static getInstance(): ReturnType<typeof createRuntimeAdminClient> {
    if (!AdminClientPool.instance) {
      AdminClientPool.instance = createRuntimeAdminClient();
    }
    return AdminClientPool.instance;
  }

  static reset(): void {
    AdminClientPool.instance = null;
  }
}

/**
 * Get singleton runtime admin client
 * Use this for system-level operations
 */
export function getRuntimeAdminClient(): ReturnType<typeof createRuntimeAdminClient> {
  return AdminClientPool.getInstance();
}

/**
 * Reset admin client pool
 * Use for testing or when configuration changes
 */
export function resetRuntimeAdminClientPool(): void {
  AdminClientPool.reset();
}

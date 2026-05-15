/**
 * Runtime Authenticated Database Client
 * 
 * Provides authenticated Supabase client for runtime operations
 * Reuses existing Supabase architecture patterns
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
 * Create runtime authenticated client
 * Uses anon key with RLS enforcement
 * Suitable for user-context operations where tenant isolation is enforced by RLS
 */
export function createRuntimeAuthClient() {
  return createClient(
    normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL),
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
}

/**
 * Create runtime client with specific access token
 * Used for service-to-service authentication or when token is available
 */
export function createRuntimeClientWithToken(token: string) {
  return createClient(
    normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL),
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );
}

/**
 * Runtime authenticated client interface
 * Wrapper around Supabase client with runtime-specific typing
 */
export interface RuntimeAuthClient {
  /**
   * Execute a query on a specific table
   */
  from<T = unknown>(table: string): RuntimeTableClient<T>;
}

/**
 * Runtime table client interface
 * Provides typed table operations
 */
export interface RuntimeTableClient<T> {
  /**
   * Select records
   */
  select<Columns = '*'>(columns?: Columns): RuntimeQueryBuilder<T>;
  
  /**
   * Insert a record
   */
  insert<Row extends Partial<T>>(row: Row): RuntimeInsertBuilder<T>;
  
  /**
   * Update records
   */
  update<Row extends Partial<T>>(row: Row): RuntimeUpdateBuilder<T>;
  
  /**
   * Delete records
   */
  delete(): RuntimeDeleteBuilder<T>;
}

/**
 * Runtime query builder interface
 * Type-safe query building
 */
export interface RuntimeQueryBuilder<T> {
  eq(column: keyof T, value: unknown): RuntimeQueryBuilder<T>;
  neq(column: keyof T, value: unknown): RuntimeQueryBuilder<T>;
  gt(column: keyof T, value: unknown): RuntimeQueryBuilder<T>;
  gte(column: keyof T, value: unknown): RuntimeQueryBuilder<T>;
  lt(column: keyof T, value: unknown): RuntimeQueryBuilder<T>;
  lte(column: keyof T, value: unknown): RuntimeQueryBuilder<T>;
  like(column: keyof T, pattern: string): RuntimeQueryBuilder<T>;
  ilike(column: keyof T, pattern: string): RuntimeQueryBuilder<T>;
  in(column: keyof T, values: readonly unknown[]): RuntimeQueryBuilder<T>;
  is(column: keyof T, value: unknown): RuntimeQueryBuilder<T>;
  order(column: keyof T, options?: { ascending?: boolean; nullsFirst?: boolean }): RuntimeQueryBuilder<T>;
  limit(count: number): RuntimeQueryBuilder<T>;
  range(from: number, to: number): RuntimeQueryBuilder<T>;
  single(): Promise<RuntimeSingleResult<T>>;
  maybeSingle(): Promise<RuntimeMaybeSingleResult<T>>;
}

/**
 * Runtime insert builder interface
 */
export interface RuntimeInsertBuilder<T> {
  select<Columns = '*'>(columns?: Columns): RuntimeQueryBuilder<T>;
}

/**
 * Runtime update builder interface
 */
export interface RuntimeUpdateBuilder<T> {
  eq(column: keyof T, value: unknown): RuntimeUpdateBuilder<T>;
  select<Columns = '*'>(columns?: Columns): RuntimeQueryBuilder<T>;
}

/**
 * Runtime delete builder interface
 */
export interface RuntimeDeleteBuilder<T> {
  eq(column: keyof T, value: unknown): RuntimeDeleteBuilder<T>;
}

/**
 * Runtime single result type
 */
export interface RuntimeSingleResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Runtime maybe single result type
 */
export interface RuntimeMaybeSingleResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Client pool for connection reuse
 * Maintains singleton instances for performance
 */
class ClientPool {
  private static instance: ReturnType<typeof createRuntimeAuthClient> | null = null;

  static getInstance(): ReturnType<typeof createRuntimeAuthClient> {
    if (!ClientPool.instance) {
      ClientPool.instance = createRuntimeAuthClient();
    }
    return ClientPool.instance;
  }

  static reset(): void {
    ClientPool.instance = null;
  }
}

/**
 * Get singleton runtime auth client
 * Use this for most runtime operations
 */
export function getRuntimeAuthClient(): ReturnType<typeof createRuntimeAuthClient> {
  return ClientPool.getInstance();
}

/**
 * Reset client pool
 * Use for testing or when configuration changes
 */
export function resetRuntimeClientPool(): void {
  ClientPool.reset();
}

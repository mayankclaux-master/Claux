/**
 * Google Search Console Runtime Connector
 * 
 * Canonical connector for Google Search Console API execution.
 * Implements real auth, real request preparation, real response parsing, real error handling.
 * 
 * CRITICAL: This is the ONLY connector that may call Google Search Console API.
 */

import type { UUID } from '../types/common.types';
import { BaseConnector, BaseConnectorConfig } from './base.connector';
import type { GoogleSearchConsoleResponseData } from '../contracts/provider-response.contract';
import {
  ProviderError,
  AuthenticationError,
  RateLimitError,
  ExecutionTimeoutError,
  NetworkError,
  ProviderErrorCode,
} from '../contracts/provider-error.contract';

/**
 * Google Search Console connector configuration
 */
export interface GoogleSearchConsoleConnectorConfig extends BaseConnectorConfig {
  readonly startDate?: string;
  readonly endDate?: string;
}

/**
 * Google Search Console runtime connector
 */
export class GoogleSearchConsoleConnector extends BaseConnector {
  constructor(config: GoogleSearchConsoleConnectorConfig) {
    super(config, 'google-search-console');
  }

  /**
   * Prepare request for Google Search Console API
   */
  protected prepareRequest(
    operation: string,
    payload: Record<string, unknown>,
    credentials: Record<string, unknown>
  ): Record<string, unknown> {
    const accessToken = credentials.accessToken as string;
    
    if (!accessToken) {
      throw new AuthenticationError(
        'Google access token is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation
      );
    }

    const url = payload.url as string;
    const startDate = (payload.startDate as string) || '28daysAgo';
    const endDate = (payload.endDate as string) || 'today';

    if (!url) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'URL is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { field: 'url' }
      );
    }

    return {
      url: 'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(url) + '/searchAnalytics/query',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        startDate,
        endDate,
        dimensions: ['date'],
        metrics: ['clicks', 'impressions', 'ctr', 'position'],
        rowLimit: 100,
      },
      timeout: 30000,
    };
  }

  /**
   * Execute Google Search Console API call
   */
  protected async executeProvider(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = request.url as string;
    const headers = request.headers as Record<string, string>;
    const body = request.body as Record<string, unknown>;
    const timeout = request.timeout as number;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError(
            errorData.error?.message || 'Authentication failed',
            this.tenantId,
            this.executionId,
            this.taskId,
            this.provider,
            'executeProvider',
            { status: response.status, error: errorData }
          );
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new RateLimitError(
            errorData.error?.message || 'Rate limit exceeded',
            this.tenantId,
            this.executionId,
            this.taskId,
            this.provider,
            'executeProvider',
            retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined,
            { status: response.status, error: errorData }
          );
        }

        throw new ProviderError(
          ProviderErrorCode.PROVIDER_ERROR,
          errorData.error?.message || `Google Search Console API error: ${response.status}`,
          this.tenantId,
          this.executionId,
          this.taskId,
          this.provider,
          'executeProvider',
          { status: response.status, error: errorData }
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AuthenticationError || error instanceof RateLimitError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExecutionTimeoutError(
          'Google Search Console API request timed out',
          this.tenantId,
          this.executionId,
          this.taskId,
          this.provider,
          'executeProvider'
        );
      }

      if (error instanceof Error) {
        throw new NetworkError(
          `Network error: ${error.message}`,
          this.tenantId,
          this.executionId,
          this.taskId,
          this.provider,
          'executeProvider',
          { originalError: error.message }
        );
      }

      throw new ProviderError(
        ProviderErrorCode.PROVIDER_ERROR,
        'Unknown error executing Google Search Console API',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'executeProvider',
        { error: String(error) }
      );
    }
  }

  /**
   * Parse Google Search Console API response
   */
  protected parseResponse<T>(response: Record<string, unknown>): T {
    const rows = response.rows as unknown[] | undefined;
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Google Search Console API response: no rows returned',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { response }
      );
    }

    // Aggregate metrics across all rows
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalCtr = 0;
    let totalPosition = 0;

    for (const row of rows) {
      const rowObj = row as Record<string, unknown>;
      const clicks = rowObj.clicks as number || 0;
      const impressions = rowObj.impressions as number || 0;
      const ctr = rowObj.ctr as number || 0;
      const position = rowObj.position as number || 0;

      totalClicks += clicks;
      totalImpressions += impressions;
      totalCtr += ctr;
      totalPosition += position;
    }

    const rowCount = rows.length;
    const avgCtr = rowCount > 0 ? totalCtr / rowCount : 0;
    const avgPosition = rowCount > 0 ? totalPosition / rowCount : 0;

    const data: GoogleSearchConsoleResponseData = {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: avgCtr,
      position: avgPosition,
    };

    return data as T;
  }

  /**
   * Handle error
   */
  protected handleError(error: unknown, operation: string): ProviderError {
    if (error instanceof ProviderError) {
      return error;
    }

    if (error instanceof Error) {
      return new ProviderError(
        ProviderErrorCode.PROVIDER_ERROR,
        error.message,
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { originalError: error.name }
      );
    }

    return new ProviderError(
      ProviderErrorCode.PROVIDER_ERROR,
      'Unknown error',
      this.tenantId,
      this.executionId,
      this.taskId,
      this.provider,
      operation,
      { error: String(error) }
    );
  }
}

/**
 * Google Analytics Runtime Connector
 * 
 * Canonical connector for Google Analytics API execution.
 * Implements real auth, real request preparation, real response parsing, real error handling.
 * 
 * CRITICAL: This is the ONLY connector that may call Google Analytics API.
 */

import type { UUID } from '../types/common.types';
import { BaseConnector, BaseConnectorConfig } from './base.connector';
import type { GoogleAnalyticsResponseData } from '../contracts/provider-response.contract';
import {
  ProviderError,
  AuthenticationError,
  RateLimitError,
  ExecutionTimeoutError,
  NetworkError,
  ProviderErrorCode,
} from '../contracts/provider-error.contract';

/**
 * Google Analytics connector configuration
 */
export interface GoogleAnalyticsConnectorConfig extends BaseConnectorConfig {
  readonly propertyId?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

/**
 * Google Analytics runtime connector
 */
export class GoogleAnalyticsConnector extends BaseConnector {
  constructor(config: GoogleAnalyticsConnectorConfig) {
    super(config, 'google-analytics');
  }

  /**
   * Prepare request for Google Analytics API
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

    const propertyId = payload.propertyId as string;
    const startDate = (payload.startDate as string) || '28daysAgo';
    const endDate = (payload.endDate as string) || 'today';

    if (!propertyId) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Property ID is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { field: 'propertyId' }
      );
    }

    return {
      url: `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
        ],
      },
      timeout: 30000,
    };
  }

  /**
   * Execute Google Analytics API call
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
          errorData.error?.message || `Google Analytics API error: ${response.status}`,
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
          'Google Analytics API request timed out',
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
        'Unknown error executing Google Analytics API',
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
   * Parse Google Analytics API response
   */
  protected parseResponse<T>(response: Record<string, unknown>): T {
    const rows = response.rows as unknown[] | undefined;
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Google Analytics API response: no rows returned',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { response }
      );
    }

    // Aggregate metrics across all rows
    let totalSessions = 0;
    let totalUsers = 0;
    let totalPageviews = 0;
    let totalBounceRate = 0;

      for (const row of rows) {
        const rowObj = row as Record<string, unknown>;
        const metricValues = rowObj.metricValues as unknown[] | undefined;
        
        if (metricValues && Array.isArray(metricValues)) {
          const metricValue0 = metricValues[0] as Record<string, unknown> | undefined;
          const metricValue1 = metricValues[1] as Record<string, unknown> | undefined;
          const metricValue2 = metricValues[2] as Record<string, unknown> | undefined;
          const metricValue3 = metricValues[3] as Record<string, unknown> | undefined;

          const sessions = metricValue0?.value as number || 0;
          const users = metricValue1?.value as number || 0;
          const pageviews = metricValue2?.value as number || 0;
          const bounceRate = metricValue3?.value as number || 0;

          totalSessions += sessions;
          totalUsers += users;
          totalPageviews += pageviews;
          totalBounceRate += bounceRate;
        }
      }

    const rowCount = rows.length;
    const avgBounceRate = rowCount > 0 ? totalBounceRate / rowCount : 0;

    const data: GoogleAnalyticsResponseData = {
      sessions: totalSessions,
      users: totalUsers,
      pageviews: totalPageviews,
      bounceRate: avgBounceRate,
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

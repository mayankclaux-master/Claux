/**
 * DataForSEO Runtime Connector
 * 
 * Canonical connector for DataForSEO API execution.
 * Implements real auth, real request preparation, real response parsing, real error handling.
 * 
 * CRITICAL: This is the ONLY connector that may call DataForSEO API.
 */

import type { UUID } from '../types/common.types';
import { BaseConnector, BaseConnectorConfig } from './base.connector';
import type { DataForSEOResponseData } from '../contracts/provider-response.contract';
import {
  ProviderError,
  AuthenticationError,
  RateLimitError,
  ExecutionTimeoutError,
  NetworkError,
  ProviderErrorCode,
} from '../contracts/provider-error.contract';

/**
 * DataForSEO connector configuration
 */
export interface DataForSEOConnectorConfig extends BaseConnectorConfig {
  readonly locationName?: string;
  readonly languageName?: string;
}

/**
 * DataForSEO runtime connector
 */
export class DataForSEOConnector extends BaseConnector {
  constructor(config: DataForSEOConnectorConfig) {
    super(config, 'dataforseo');
  }

  /**
   * Prepare request for DataForSEO API
   */
  protected prepareRequest(
    operation: string,
    payload: Record<string, unknown>,
    credentials: Record<string, unknown>
  ): Record<string, unknown> {
    const apiKey = credentials.apiKey as string;
    
    if (!apiKey) {
      throw new AuthenticationError(
        'DataForSEO API key is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation
      );
    }

    const keyword = payload.keyword as string;
    const target = payload.target as string;
    const locationName = (payload.locationName as string) || 'United States';
    const languageName = (payload.languageName as string) || 'English';

    if (!keyword) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Keyword is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { field: 'keyword' }
      );
    }

    if (!target) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Target is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { field: 'target' }
      );
    }

    return {
      url: 'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: [
        {
          keyword,
          target,
          location_name: locationName,
          language_name: languageName,
          depth: 100,
          priority: 1,
        },
      ],
      timeout: 30000,
    };
  }

  /**
   * Execute DataForSEO API call
   */
  protected async executeProvider(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = request.url as string;
    const headers = request.headers as Record<string, string>;
    const body = request.body as Record<string, unknown>[];
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
            errorData.message || 'Authentication failed',
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
            errorData.message || 'Rate limit exceeded',
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
          errorData.message || `DataForSEO API error: ${response.status}`,
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
          'DataForSEO API request timed out',
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
        'Unknown error executing DataForSEO API',
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
   * Parse DataForSEO API response
   */
  protected parseResponse<T>(response: Record<string, unknown>): T {
    if (!response.tasks || !Array.isArray(response.tasks) || response.tasks.length === 0) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid DataForSEO API response: no tasks returned',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { response }
      );
    }

    const task = response.tasks[0] as Record<string, unknown>;
    
    if (task.status_code !== 20000) {
      throw new ProviderError(
        ProviderErrorCode.PROVIDER_ERROR,
        `DataForSEO task failed: ${task.status_message}`,
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { task }
      );
    }

    const result = task.result as Record<string, unknown>;
    
    if (!result) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid DataForSEO API response: no result in task',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { task }
      );
    }

    const keywordData = result as Record<string, unknown>;
    const keywordMetrics = keywordData.keyword_data_metrics as Record<string, unknown> | undefined;
    
    if (!keywordMetrics) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid DataForSEO API response: no keyword_data_metrics',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { result }
      );
    }

    const data: DataForSEOResponseData = {
      keyword: keywordData.keyword as string,
      volume: keywordMetrics.search_volume as number || 0,
      difficulty: keywordMetrics.keyword_difficulty as number || 0,
      cpc: keywordMetrics.cpc as number | undefined,
      intent: keywordMetrics.search_intent as string | undefined,
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

  /**
   * Extract cost from response
   */
  protected extractCost(response: Record<string, unknown> | null): {
    readonly currency: string;
    readonly amount: number;
  } | undefined {
    if (!response) return undefined;
    
    // DataForSEO pricing (as of 2024)
    // Search Volume API: $0.001 per task
    return {
      currency: 'USD',
      amount: 0.001,
    };
  }
}

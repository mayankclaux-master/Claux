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

    const locationName = (payload.locationName as string) || 'United States';
    const languageName = (payload.languageName as string) || 'English';

    switch (operation) {
      case 'search_volume':
        return this.prepareSearchVolumeRequest(payload, apiKey, locationName, languageName);
      
      case 'serp_rankings':
        return this.prepareSerpRankingsRequest(payload, apiKey, locationName, languageName);
      
      case 'backlinks':
        return this.prepareBacklinksRequest(payload, apiKey);
      
      case 'local_serp':
        return this.prepareLocalSerpRequest(payload, apiKey, locationName, languageName);
      
      case 'keyword_difficulty':
        return this.prepareKeywordDifficultyRequest(payload, apiKey, locationName, languageName);
      
      default:
        throw new ProviderError(
          ProviderErrorCode.PROVIDER_ERROR,
          `Unknown operation: ${operation}`,
          this.tenantId,
          this.executionId,
          this.taskId,
          this.provider,
          'prepareRequest',
          { operation }
        );
    }
  }

  /**
   * Prepare search volume request
   */
  private prepareSearchVolumeRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    locationName: string,
    languageName: string
  ): Record<string, unknown> {
    const keyword = payload.keyword as string;
    const target = payload.target as string;

    if (!keyword) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Keyword is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'search_volume',
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
        'search_volume',
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
   * Prepare SERP rankings request
   */
  private prepareSerpRankingsRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    locationName: string,
    languageName: string
  ): Record<string, unknown> {
    const keyword = payload.keyword as string;
    const target = payload.target as string;

    if (!keyword) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Keyword is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'serp_rankings',
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
        'serp_rankings',
        { field: 'target' }
      );
    }

    return {
      url: 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
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
        },
      ],
      timeout: 30000,
    };
  }

  /**
   * Prepare backlinks request
   */
  private prepareBacklinksRequest(
    payload: Record<string, unknown>,
    apiKey: string
  ): Record<string, unknown> {
    const target = payload.target as string;

    if (!target) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Target is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'backlinks',
        { field: 'target' }
      );
    }

    return {
      url: 'https://api.dataforseo.com/v3/backlinks/backlinks/live',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: [
        {
          target,
          limit: 100,
          order_by: ['domain_authority,desc'],
          filters: [['dofollow', '=', true]],
        },
      ],
      timeout: 30000,
    };
  }

  /**
   * Prepare local SERP request
   */
  private prepareLocalSerpRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    locationName: string,
    languageName: string
  ): Record<string, unknown> {
    const keyword = payload.keyword as string;
    const target = payload.target as string;

    if (!keyword) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Keyword is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'local_serp',
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
        'local_serp',
        { field: 'target' }
      );
    }

    return {
      url: 'https://api.dataforseo.com/v3/serp/google/local_pack/live/advanced',
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
          depth: 20,
        },
      ],
      timeout: 30000,
    };
  }

  /**
   * Prepare keyword difficulty request
   */
  private prepareKeywordDifficultyRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    locationName: string,
    languageName: string
  ): Record<string, unknown> {
    const keyword = payload.keyword as string;

    if (!keyword) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Keyword is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'keyword_difficulty',
        { field: 'keyword' }
      );
    }

    return {
      url: 'https://api.dataforseo.com/v3/keywords_data/google_ads/keyword_difficulty/live',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: [
        {
          keyword,
          location_name: locationName,
          language_name: languageName,
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

    // Parse based on operation type
    const operation = this.provider;
    
    if (operation === 'dataforseo') {
      // Determine response type based on result structure
      if (result.keyword_data_metrics) {
        return this.parseSearchVolumeResponse(result) as T;
      } else if (result.items) {
        return this.parseSerpRankingsResponse(result) as T;
      } else if (result.items && Array.isArray(result.items) && result.items[0]?.backlinks) {
        return this.parseBacklinksResponse(result) as T;
      } else if (result.local_pack_items) {
        return this.parseLocalSerpResponse(result) as T;
      } else if (result.difficulty) {
        return this.parseKeywordDifficultyResponse(result) as T;
      }
    }

    // Default to search volume parsing for backward compatibility
    return this.parseSearchVolumeResponse(result) as T;
  }

  /**
   * Parse search volume response
   */
  private parseSearchVolumeResponse(result: Record<string, unknown>): DataForSEOResponseData {
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
        'parseSearchVolumeResponse',
        { result }
      );
    }

    return {
      keyword: keywordData.keyword as string,
      volume: keywordMetrics.search_volume as number || 0,
      difficulty: keywordMetrics.keyword_difficulty as number || 0,
      cpc: keywordMetrics.cpc as number | undefined,
      intent: keywordMetrics.search_intent as string | undefined,
    };
  }

  /**
   * Parse SERP rankings response
   */
  private parseSerpRankingsResponse(result: Record<string, unknown>): Record<string, unknown> {
    const items = result.items as unknown[] | undefined;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid DataForSEO API response: no items in SERP result',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseSerpRankingsResponse',
        { result }
      );
    }

    const organic = items[0] as Record<string, unknown>;
    const organicItems = organic.items as unknown[] | undefined;
    
    if (!organicItems || !Array.isArray(organicItems)) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid DataForSEO API response: no organic items',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseSerpRankingsResponse',
        { result }
      );
    }

    const rankings = organicItems.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        rank: itemObj.rank_group as number,
        url: itemObj.url as string,
        title: itemObj.title as string,
      };
    });

    return {
      rankings,
      total_results: organicItems.length,
    };
  }

  /**
   * Parse backlinks response
   */
  private parseBacklinksResponse(result: Record<string, unknown>): Record<string, unknown> {
    const items = result.items as unknown[] | undefined;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid DataForSEO API response: no items in backlinks result',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseBacklinksResponse',
        { result }
      );
    }

    const backlinks = items.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        domain: itemObj.domain as string,
        url: itemObj.url as string,
        domain_authority: itemObj.domain_authority as number,
        page_authority: itemObj.page_authority as number,
        dofollow: itemObj.dofollow as boolean,
      };
    });

    return {
      backlinks,
      total_results: items.length,
    };
  }

  /**
   * Parse local SERP response
   */
  private parseLocalSerpResponse(result: Record<string, unknown>): Record<string, unknown> {
    const localPackItems = result.local_pack_items as unknown[] | undefined;
    
    if (!localPackItems || !Array.isArray(localPackItems) || localPackItems.length === 0) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid DataForSEO API response: no local pack items',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseLocalSerpResponse',
        { result }
      );
    }

    const localResults = localPackItems.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        rank: itemObj.rank_group as number,
        title: itemObj.title as string,
        rating: itemObj.rating as number,
        reviews_count: itemObj.reviews_count as number,
        address: itemObj.address as string,
      };
    });

    return {
      local_results: localResults,
      total_results: localPackItems.length,
    };
  }

  /**
   * Parse keyword difficulty response
   */
  private parseKeywordDifficultyResponse(result: Record<string, unknown>): Record<string, unknown> {
    const difficulty = result.difficulty as number | undefined;
    
    if (difficulty === undefined) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid DataForSEO API response: no difficulty in result',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseKeywordDifficultyResponse',
        { result }
      );
    }

    return {
      difficulty,
      keyword: result.keyword as string,
    };
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
    // SERP Rankings API: $0.003 per task
    // Backlinks API: $0.001 per task
    // Local SERP API: $0.003 per task
    // Keyword Difficulty API: $0.001 per task
    
    // Determine cost based on response structure
    if (response.keyword_data_metrics) {
      return { currency: 'USD', amount: 0.001 }; // Search Volume
    } else if (response.items) {
      return { currency: 'USD', amount: 0.003 }; // SERP Rankings
    } else if (response.local_pack_items) {
      return { currency: 'USD', amount: 0.003 }; // Local SERP
    } else if (response.difficulty) {
      return { currency: 'USD', amount: 0.001 }; // Keyword Difficulty
    }
    
    // Default cost
    return { currency: 'USD', amount: 0.001 };
  }
}

/**
 * SerpAPI Runtime Connector
 * 
 * Canonical connector for SerpAPI execution.
 * Implements real auth, real request preparation, real response parsing, real error handling.
 * 
 * CRITICAL: This is the ONLY connector that may call SerpAPI.
 */

import type { UUID } from '../types/common.types';
import { BaseConnector, BaseConnectorConfig } from './base.connector';
import {
  ProviderError,
  AuthenticationError,
  RateLimitError,
  ExecutionTimeoutError,
  NetworkError,
  ProviderErrorCode,
} from '../contracts/provider-error.contract';

/**
 * SerpAPI connector configuration
 */
export interface SerpAPIConnectorConfig extends BaseConnectorConfig {
  readonly engine?: string;
  readonly location?: string;
  readonly googleDomain?: string;
}

/**
 * SerpAPI runtime connector
 */
export class SerpAPIConnector extends BaseConnector {
  private readonly defaultEngine = 'google';
  private readonly defaultLocation = 'United States';
  private readonly defaultGoogleDomain = 'google.com';

  constructor(config: SerpAPIConnectorConfig) {
    super(config, 'serpapi');
  }

  /**
   * Prepare request for SerpAPI
   */
  protected prepareRequest(
    operation: string,
    payload: Record<string, unknown>,
    credentials: Record<string, unknown>
  ): Record<string, unknown> {
    const apiKey = credentials.apiKey as string;
    
    if (!apiKey) {
      throw new AuthenticationError(
        'SerpAPI key is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation
      );
    }

    const engine = (payload.engine as string) || this.defaultEngine;
    const location = (payload.location as string) || this.defaultLocation;
    const googleDomain = (payload.googleDomain as string) || this.defaultGoogleDomain;

    switch (operation) {
      case 'serp_snapshot':
        return this.prepareSerpSnapshotRequest(payload, apiKey, engine, location, googleDomain);
      
      case 'ranking_verification':
        return this.prepareRankingVerificationRequest(payload, apiKey, engine, location, googleDomain);
      
      case 'featured_snippets':
        return this.prepareFeaturedSnippetsRequest(payload, apiKey, engine, location, googleDomain);
      
      case 'ai_overview':
        return this.prepareAiOverviewRequest(payload, apiKey, engine, location, googleDomain);
      
      case 'serp_volatility':
        return this.prepareSerpVolatilityRequest(payload, apiKey, engine, location, googleDomain);
      
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
   * Prepare SERP snapshot request
   */
  private prepareSerpSnapshotRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    engine: string,
    location: string,
    googleDomain: string
  ): Record<string, unknown> {
    const query = payload.query as string;

    if (!query) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Query is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'serp_snapshot',
        { field: 'query' }
      );
    }

    const url = new URL('https://serpapi.com/search');
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('engine', engine);
    url.searchParams.append('q', query);
    url.searchParams.append('location', location);
    url.searchParams.append('google_domain', googleDomain);
    url.searchParams.append('num', '100');

    return {
      url: url.toString(),
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Prepare ranking verification request
   */
  private prepareRankingVerificationRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    engine: string,
    location: string,
    googleDomain: string
  ): Record<string, unknown> {
    const query = payload.query as string;
    const targetDomain = payload.targetDomain as string;

    if (!query) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Query is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'ranking_verification',
        { field: 'query' }
      );
    }

    if (!targetDomain) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Target domain is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'ranking_verification',
        { field: 'targetDomain' }
      );
    }

    const url = new URL('https://serpapi.com/search');
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('engine', engine);
    url.searchParams.append('q', query);
    url.searchParams.append('location', location);
    url.searchParams.append('google_domain', googleDomain);
    url.searchParams.append('num', '100');

    return {
      url: url.toString(),
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      targetDomain,
    };
  }

  /**
   * Prepare featured snippets request
   */
  private prepareFeaturedSnippetsRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    engine: string,
    location: string,
    googleDomain: string
  ): Record<string, unknown> {
    const query = payload.query as string;

    if (!query) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Query is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'featured_snippets',
        { field: 'query' }
      );
    }

    const url = new URL('https://serpapi.com/search');
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('engine', engine);
    url.searchParams.append('q', query);
    url.searchParams.append('location', location);
    url.searchParams.append('google_domain', googleDomain);
    url.searchParams.append('num', '10');

    return {
      url: url.toString(),
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Prepare AI overview request
   */
  private prepareAiOverviewRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    engine: string,
    location: string,
    googleDomain: string
  ): Record<string, unknown> {
    const query = payload.query as string;

    if (!query) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Query is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'ai_overview',
        { field: 'query' }
      );
    }

    const url = new URL('https://serpapi.com/search');
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('engine', engine);
    url.searchParams.append('q', query);
    url.searchParams.append('location', location);
    url.searchParams.append('google_domain', googleDomain);
    url.searchParams.append('num', '10');

    return {
      url: url.toString(),
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Prepare SERP volatility request
   */
  private prepareSerpVolatilityRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    engine: string,
    location: string,
    googleDomain: string
  ): Record<string, unknown> {
    const query = payload.query as string;

    if (!query) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Query is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'serp_volatility',
        { field: 'query' }
      );
    }

    const url = new URL('https://serpapi.com/search');
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('engine', engine);
    url.searchParams.append('q', query);
    url.searchParams.append('location', location);
    url.searchParams.append('google_domain', googleDomain);
    url.searchParams.append('num', '100');

    return {
      url: url.toString(),
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Execute SerpAPI call
   */
  protected async executeProvider(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = request.url as string;
    const headers = request.headers as Record<string, string>;
    const timeout = request.timeout as number;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError(
            errorData.error || 'Authentication failed',
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
            errorData.error || 'Rate limit exceeded',
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
          errorData.error || `SerpAPI error: ${response.status}`,
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
          'SerpAPI request timed out',
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
        'Unknown error executing SerpAPI',
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
   * Parse SerpAPI response
   */
  protected parseResponse<T>(response: Record<string, unknown>): T {
    if (!response.organic_results || !Array.isArray(response.organic_results)) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid SerpAPI response: no organic_results',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { response }
      );
    }

    const organicResults = response.organic_results as unknown[];
    const rankings = organicResults.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        position: itemObj.position as number,
        title: itemObj.title as string,
        link: itemObj.link as string,
        snippet: itemObj.snippet as string,
      };
    });

    const searchInformation = response.search_information as Record<string, unknown> | undefined;
    const searchParameters = response.search_parameters as Record<string, unknown> | undefined;

    const data: Record<string, unknown> = {
      rankings,
      total_results: searchInformation?.total_results as number || 0,
      query: searchParameters?.q as string || '',
    };

    // Add featured snippet if present
    if (response.answer_box) {
      const answerBox = response.answer_box as Record<string, unknown>;
      data.featured_snippet = {
        title: answerBox.title as string,
        snippet: answerBox.snippet as string,
        link: answerBox.link as string,
      };
    }

    // Add AI overview if present
    if (response.ai_overview) {
      const aiOverview = response.ai_overview as Record<string, unknown>;
      data.ai_overview = {
        text: aiOverview.text as string,
        sources: aiOverview.sources as string[],
      };
    }

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
  protected extractCost(response: Record<string, unknown> | null) {
    if (!response) return undefined;
    
    // SerpAPI pricing (as of 2024)
    // Google Search API: $0.0025 per search
    return {
      currency: 'USD',
      amount: 0.0025,
    };
  }
}

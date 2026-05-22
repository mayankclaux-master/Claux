/**
 * WordPress Runtime Connector
 * 
 * Canonical connector for WordPress REST API execution.
 * Implements real auth, real request preparation, real response parsing, real error handling.
 * 
 * CRITICAL: This is the ONLY connector that may call WordPress API.
 */

import type { UUID } from '../types/common.types';
import { BaseConnector, BaseConnectorConfig } from './base.connector';
import type { WordPressResponseData } from '../contracts/provider-response.contract';
import {
  ProviderError,
  AuthenticationError,
  RateLimitError,
  ExecutionTimeoutError,
  NetworkError,
  ProviderErrorCode,
} from '../contracts/provider-error.contract';

/**
 * WordPress connector configuration
 */
export interface WordPressConnectorConfig extends BaseConnectorConfig {
  readonly siteUrl?: string;
}

/**
 * WordPress runtime connector
 */
export class WordPressConnector extends BaseConnector {
  constructor(config: WordPressConnectorConfig) {
    super(config, 'wordpress');
  }

  /**
   * Prepare request for WordPress API
   */
  protected prepareRequest(
    operation: string,
    payload: Record<string, unknown>,
    credentials: Record<string, unknown>
  ): Record<string, unknown> {
    const username = credentials.username as string;
    const password = credentials.password as string;
    
    if (!username || !password) {
      throw new AuthenticationError(
        'WordPress credentials are required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation
      );
    }

    const siteUrl = payload.siteUrl as string;
    const title = payload.title as string;
    const content = payload.content as string;
    const status = (payload.status as string) || 'draft';
    const slug = payload.slug as string | undefined;
    const categories = payload.categories as number[] | undefined;

    if (!siteUrl) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Site URL is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { field: 'siteUrl' }
      );
    }

    if (!title) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Title is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { field: 'title' }
      );
    }

    if (!content) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Content is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { field: 'content' }
      );
    }

    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    return {
      url: `${siteUrl}/wp-json/wp/v2/posts`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        title,
        content,
        status,
        ...(slug && { slug }),
        ...(categories && { categories }),
      },
      timeout: 30000,
    };
  }

  /**
   * Execute WordPress API call
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
          errorData.message || `WordPress API error: ${response.status}`,
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
          'WordPress API request timed out',
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
        'Unknown error executing WordPress API',
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
   * Parse WordPress API response
   */
  protected parseResponse<T>(response: Record<string, unknown>): T {
    if (!response.id) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid WordPress API response: no id returned',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { response }
      );
    }

    const data: WordPressResponseData = {
      id: response.id as number,
      url: response.link as string || '',
      status: response.status as string || 'draft',
      date: response.date as string || new Date().toISOString(),
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

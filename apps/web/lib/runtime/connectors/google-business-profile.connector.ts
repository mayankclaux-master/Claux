/**
 * Google Business Profile Runtime Connector
 * 
 * Canonical connector for Google Business Profile API execution.
 * Implements real auth, real request preparation, real response parsing, real error handling.
 * 
 * CRITICAL: This is the ONLY connector that may call Google Business Profile API.
 */

import type { UUID } from '../types/common.types';
import { BaseConnector, BaseConnectorConfig } from './base.connector';
import type { GoogleBusinessProfileResponseData } from '../contracts/provider-response.contract';
import {
  ProviderError,
  AuthenticationError,
  RateLimitError,
  ExecutionTimeoutError,
  NetworkError,
  ProviderErrorCode,
} from '../contracts/provider-error.contract';

/**
 * Google Business Profile connector configuration
 */
export interface GoogleBusinessProfileConnectorConfig extends BaseConnectorConfig {
  readonly locationId?: string;
}

/**
 * Google Business Profile runtime connector
 */
export class GoogleBusinessProfileConnector extends BaseConnector {
  constructor(config: GoogleBusinessProfileConnectorConfig) {
    super(config, 'google-business-profile');
  }

  /**
   * Prepare request for Google Business Profile API
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

    const locationId = payload.locationId as string;
    const fields = (payload.fields as string) || 'title,primaryCategory,reviewCount,averageRating,photosCount,postsCount';

    if (!locationId) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Location ID is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { field: 'locationId' }
      );
    }

    return {
      url: `https://mybusiness.googleapis.com/v4/accounts/${locationId}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        readMask: fields,
      },
      timeout: 30000,
    };
  }

  /**
   * Execute Google Business Profile API call
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
        method: 'GET',
        headers,
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
          errorData.error?.message || `Google Business Profile API error: ${response.status}`,
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
          'Google Business Profile API request timed out',
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
        'Unknown error executing Google Business Profile API',
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
   * Parse Google Business Profile API response
   */
  protected parseResponse<T>(response: Record<string, unknown>): T {
    if (!response.title) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Google Business Profile API response: no title returned',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { response }
      );
    }

    const primaryCategory = response.primaryCategory as Record<string, unknown> | undefined;
    const data: GoogleBusinessProfileResponseData = {
      gmb_name: response.title as string,
      primary_category: primaryCategory?.displayName as string || '',
      review_count: response.reviewCount as number || 0,
      average_rating: response.averageRating as number || 0,
      photos_count: response.photosCount as number || 0,
      posts_count: response.postsCount as number || 0,
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

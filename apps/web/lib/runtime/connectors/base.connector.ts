/**
 * Base Runtime Connector
 * 
 * All runtime connectors MUST extend this base class.
 * This enforces canonical connector rules and standardizes provider execution.
 * 
 * CRITICAL: No connector may bypass this base class.
 */

import type { UUID } from '../types/common.types';
import type { ProviderResponse, ProviderMetadata } from '../contracts/provider-response.contract';
import type { ProviderError } from '../contracts/provider-error.contract';
import { credentialInjectionAuthority } from '../authority/credential-injection-authority';

/**
 * Base connector interface
 */
export interface BaseConnectorConfig {
  readonly tenantId: UUID;
  readonly executionId: UUID;
  readonly taskId: UUID;
}

/**
 * Base runtime connector
 * All connectors MUST extend this class
 */
export abstract class BaseConnector {
  protected readonly tenantId: UUID;
  protected readonly executionId: UUID;
  protected readonly taskId: UUID;
  protected readonly provider: string;

  constructor(config: BaseConnectorConfig, provider: string) {
    this.tenantId = config.tenantId;
    this.executionId = config.executionId;
    this.taskId = config.taskId;
    this.provider = provider;
  }

  /**
   * Execute provider operation
   * CRITICAL: This is the ONLY public method that executes provider operations
   */
  async execute<T>(operation: string, payload: Record<string, unknown>): Promise<ProviderResponse<T>> {
    const startTime = Date.now();

    try {
      // Inject credentials
      const credentials = await this.injectCredentials();

      // Prepare request
      const request = this.prepareRequest(operation, payload, credentials);

      // Execute provider API
      const response = await this.executeProvider(request);

      // Parse response
      const data = this.parseResponse<T>(response);

      // Create metadata
      const metadata = this.createMetadata(startTime, operation, response);

      // Create success response
      return this.createSuccessResponse(data, metadata);
    } catch (error) {
      // Handle error
      const providerError = this.handleError(error, operation);
      
      // Create metadata
      const metadata = this.createMetadata(startTime, operation, null);

      // Create error response
      return this.createErrorResponse(providerError, metadata) as ProviderResponse<T>;
    }
  }

  /**
   * Inject credentials
   * CRITICAL: Must use credential injection authority
   */
  protected async injectCredentials(): Promise<Record<string, unknown>> {
    const result = await credentialInjectionAuthority.injectCredentials(
      this.tenantId,
      this.executionId,
      this.taskId,
      this.provider
    );
    return result.credentials as Record<string, unknown>;
  }

  /**
   * Prepare request for provider
   * Must be implemented by concrete connectors
   */
  protected abstract prepareRequest(
    operation: string,
    payload: Record<string, unknown>,
    credentials: Record<string, unknown>
  ): Record<string, unknown>;

  /**
   * Execute provider API call
   * Must be implemented by concrete connectors
   */
  protected abstract executeProvider(request: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Parse provider response
   * Must be implemented by concrete connectors
   */
  protected abstract parseResponse<T>(response: Record<string, unknown>): T;

  /**
   * Handle error
   * Must be implemented by concrete connectors
   */
  protected abstract handleError(error: unknown, operation: string): ProviderError;

  /**
   * Create metadata
   */
  protected createMetadata(
    startTime: number,
    operation: string,
    response: Record<string, unknown> | null
  ): ProviderMetadata {
    const executionTimeMs = Date.now() - startTime;

    return {
      provider: this.provider,
      operation,
      executionTimeMs,
      timestamp: new Date().toISOString(),
      rateLimit: this.extractRateLimit(response),
      quota: this.extractQuota(response),
      cost: this.extractCost(response),
      tokens: this.extractTokens(response),
    };
  }

  /**
   * Extract rate limit from response
   */
  protected extractRateLimit(response: Record<string, unknown> | null): {
    readonly remaining: number;
    readonly resetAt: string;
  } | undefined {
    if (!response) return undefined;
    
    // Default implementation - override in concrete connectors
    return undefined;
  }

  /**
   * Extract quota from response
   */
  protected extractQuota(response: Record<string, unknown> | null): {
    readonly used: number;
    readonly limit: number;
  } | undefined {
    if (!response) return undefined;
    
    // Default implementation - override in concrete connectors
    return undefined;
  }

  /**
   * Extract cost from response
   */
  protected extractCost(response: Record<string, unknown> | null): {
    readonly currency: string;
    readonly amount: number;
  } | undefined {
    if (!response) return undefined;
    
    // Default implementation - override in concrete connectors
    return undefined;
  }

  /**
   * Extract tokens from response
   */
  protected extractTokens(response: Record<string, unknown> | null): {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  } | undefined {
    if (!response) return undefined;
    
    // Default implementation - override in concrete connectors
    return undefined;
  }

  /**
   * Create success response
   */
  protected createSuccessResponse<T>(
    data: T,
    metadata: ProviderMetadata
  ): ProviderResponse<T> {
    const { createProviderResponse } = require('../contracts/provider-response.contract');
    
    return createProviderResponse(
      data,
      metadata,
      this.tenantId,
      this.executionId,
      this.taskId
    );
  }

  /**
   * Create error response
   */
  protected createErrorResponse(
    error: ProviderError,
    metadata: ProviderMetadata
  ): ProviderResponse<null> {
    const { createProviderErrorResponse } = require('../contracts/provider-response.contract');
    
    return createProviderErrorResponse(
      error,
      metadata,
      this.tenantId,
      this.executionId,
      this.taskId
    );
  }
}

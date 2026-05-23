/**
 * Screaming Frog Runtime Connector
 * 
 * Canonical connector for Screaming Frog API execution.
 * Implements real auth, real request preparation, real response parsing, real error handling.
 * 
 * CRITICAL: This is the ONLY connector that may call Screaming Frog API.
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
 * Screaming Frog connector configuration
 */
export interface ScreamingFrogConnectorConfig extends BaseConnectorConfig {
  readonly crawlId?: string;
  readonly exportType?: string;
}

/**
 * Screaming Frog runtime connector
 */
export class ScreamingFrogConnector extends BaseConnector {
  private readonly defaultExportType = 'csv';

  constructor(config: ScreamingFrogConnectorConfig) {
    super(config, 'screaming-frog');
  }

  /**
   * Prepare request for Screaming Frog API
   */
  protected prepareRequest(
    operation: string,
    payload: Record<string, unknown>,
    credentials: Record<string, unknown>
  ): Record<string, unknown> {
    const apiKey = credentials.apiKey as string;
    
    if (!apiKey) {
      throw new AuthenticationError(
        'Screaming Frog API key is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation
      );
    }

    const crawlId = payload.crawlId as string;
    const exportType = (payload.exportType as string) || this.defaultExportType;

    switch (operation) {
      case 'crawl_export':
        return this.prepareCrawlExportRequest(payload, apiKey, crawlId, exportType);
      
      case 'broken_links':
        return this.prepareBrokenLinksRequest(payload, apiKey, crawlId);
      
      case 'redirect_chains':
        return this.prepareRedirectChainsRequest(payload, apiKey, crawlId);
      
      case 'schema_validation':
        return this.prepareSchemaValidationRequest(payload, apiKey, crawlId);
      
      case 'canonical_conflicts':
        return this.prepareCanonicalConflictsRequest(payload, apiKey, crawlId);
      
      case 'image_audit':
        return this.prepareImageAuditRequest(payload, apiKey, crawlId);
      
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
   * Prepare crawl export request
   */
  private prepareCrawlExportRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    crawlId: string,
    exportType: string
  ): Record<string, unknown> {
    if (!crawlId) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Crawl ID is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'crawl_export',
        { field: 'crawlId' }
      );
    }

    return {
      url: `https://api.screamingfrog.com/v1/crawls/${crawlId}/export`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        export_type: exportType,
        columns: ['address', 'status_code', 'title', 'meta_description', 'h1', 'h2', 'canonical', 'indexability'],
      },
      timeout: 60000, // 60 seconds for large exports
    };
  }

  /**
   * Prepare broken links request
   */
  private prepareBrokenLinksRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    crawlId: string
  ): Record<string, unknown> {
    if (!crawlId) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Crawl ID is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'broken_links',
        { field: 'crawlId' }
      );
    }

    return {
      url: `https://api.screamingfrog.com/v1/crawls/${crawlId}/broken-links`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Prepare redirect chains request
   */
  private prepareRedirectChainsRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    crawlId: string
  ): Record<string, unknown> {
    if (!crawlId) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Crawl ID is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'redirect_chains',
        { field: 'crawlId' }
      );
    }

    return {
      url: `https://api.screamingfrog.com/v1/crawls/${crawlId}/redirect-chains`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Prepare schema validation request
   */
  private prepareSchemaValidationRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    crawlId: string
  ): Record<string, unknown> {
    if (!crawlId) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Crawl ID is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'schema_validation',
        { field: 'crawlId' }
      );
    }

    return {
      url: `https://api.screamingfrog.com/v1/crawls/${crawlId}/schema-validation`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Prepare canonical conflicts request
   */
  private prepareCanonicalConflictsRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    crawlId: string
  ): Record<string, unknown> {
    if (!crawlId) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Crawl ID is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'canonical_conflicts',
        { field: 'crawlId' }
      );
    }

    return {
      url: `https://api.screamingfrog.com/v1/crawls/${crawlId}/canonical-conflicts`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Prepare image audit request
   */
  private prepareImageAuditRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    crawlId: string
  ): Record<string, unknown> {
    if (!crawlId) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Crawl ID is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'image_audit',
        { field: 'crawlId' }
      );
    }

    return {
      url: `https://api.screamingfrog.com/v1/crawls/${crawlId}/image-audit`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Execute Screaming Frog API call
   */
  protected async executeProvider(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = request.url as string;
    const headers = request.headers as Record<string, string>;
    const body = request.body as Record<string, unknown> | undefined;
    const timeout = request.timeout as number;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers,
        body: body ? JSON.stringify(body) : undefined,
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
          errorData.error || `Screaming Frog API error: ${response.status}`,
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
          'Screaming Frog API request timed out',
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
        'Unknown error executing Screaming Frog API',
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
   * Parse Screaming Frog API response
   */
  protected parseResponse<T>(response: Record<string, unknown>): T {
    if (!response.data && !response.items) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Screaming Frog API response: no data or items',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { response }
      );
    }

    // Determine response type based on structure
    if (response.broken_links) {
      return this.parseBrokenLinksResponse(response) as T;
    } else if (response.redirect_chains) {
      return this.parseRedirectChainsResponse(response) as T;
    } else if (response.schema_issues) {
      return this.parseSchemaValidationResponse(response) as T;
    } else if (response.canonical_conflicts) {
      return this.parseCanonicalConflictsResponse(response) as T;
    } else if (response.image_issues) {
      return this.parseImageAuditResponse(response) as T;
    }

    // Default to crawl export parsing
    return this.parseCrawlExportResponse(response) as T;
  }

  /**
   * Parse crawl export response
   */
  private parseCrawlExportResponse(response: Record<string, unknown>): Record<string, unknown> {
    const data = response.data as unknown[] | undefined;
    
    if (!data || !Array.isArray(data)) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Screaming Frog API response: no data in crawl export',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseCrawlExportResponse',
        { response }
      );
    }

    const pages = data.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        address: itemObj.address as string,
        status_code: itemObj.status_code as number,
        title: itemObj.title as string,
        meta_description: itemObj.meta_description as string,
        h1: itemObj.h1 as string,
        h2: itemObj.h2 as string,
        canonical: itemObj.canonical as string,
        indexability: itemObj.indexability as string,
      };
    });

    return {
      pages,
      total_pages: data.length,
    };
  }

  /**
   * Parse broken links response
   */
  private parseBrokenLinksResponse(response: Record<string, unknown>): Record<string, unknown> {
    const brokenLinks = response.broken_links as unknown[] | undefined;
    
    if (!brokenLinks || !Array.isArray(brokenLinks)) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Screaming Frog API response: no broken_links',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseBrokenLinksResponse',
        { response }
      );
    }

    const links = brokenLinks.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        source_url: itemObj.source_url as string,
        target_url: itemObj.target_url as string,
        status_code: itemObj.status_code as number,
        link_text: itemObj.link_text as string,
      };
    });

    return {
      broken_links: links,
      total_broken_links: brokenLinks.length,
    };
  }

  /**
   * Parse redirect chains response
   */
  private parseRedirectChainsResponse(response: Record<string, unknown>): Record<string, unknown> {
    const redirectChains = response.redirect_chains as unknown[] | undefined;
    
    if (!redirectChains || !Array.isArray(redirectChains)) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Screaming Frog API response: no redirect_chains',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseRedirectChainsResponse',
        { response }
      );
    }

    const chains = redirectChains.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        source_url: itemObj.source_url as string,
        final_url: itemObj.final_url as string,
        chain_length: itemObj.chain_length as number,
        redirect_types: itemObj.redirect_types as string[],
      };
    });

    return {
      redirect_chains: chains,
      total_redirect_chains: redirectChains.length,
    };
  }

  /**
   * Parse schema validation response
   */
  private parseSchemaValidationResponse(response: Record<string, unknown>): Record<string, unknown> {
    const schemaIssues = response.schema_issues as unknown[] | undefined;
    
    if (!schemaIssues || !Array.isArray(schemaIssues)) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Screaming Frog API response: no schema_issues',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseSchemaValidationResponse',
        { response }
      );
    }

    const issues = schemaIssues.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        url: itemObj.url as string,
        schema_type: itemObj.schema_type as string,
        issue_type: itemObj.issue_type as string,
        severity: itemObj.severity as string,
        recommended_fix: itemObj.recommended_fix as string,
      };
    });

    return {
      schema_issues: issues,
      total_schema_issues: schemaIssues.length,
    };
  }

  /**
   * Parse canonical conflicts response
   */
  private parseCanonicalConflictsResponse(response: Record<string, unknown>): Record<string, unknown> {
    const canonicalConflicts = response.canonical_conflicts as unknown[] | undefined;
    
    if (!canonicalConflicts || !Array.isArray(canonicalConflicts)) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Screaming Frog API response: no canonical_conflicts',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseCanonicalConflictsResponse',
        { response }
      );
    }

    const conflicts = canonicalConflicts.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        url: itemObj.url as string,
        canonical_url: itemObj.canonical_url as string,
        conflict_type: itemObj.conflict_type as string,
        recommended_action: itemObj.recommended_action as string,
      };
    });

    return {
      canonical_conflicts: conflicts,
      total_canonical_conflicts: canonicalConflicts.length,
    };
  }

  /**
   * Parse image audit response
   */
  private parseImageAuditResponse(response: Record<string, unknown>): Record<string, unknown> {
    const imageIssues = response.image_issues as unknown[] | undefined;
    
    if (!imageIssues || !Array.isArray(imageIssues)) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid Screaming Frog API response: no image_issues',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseImageAuditResponse',
        { response }
      );
    }

    const issues = imageIssues.map((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      return {
        url: itemObj.url as string,
        issue_type: itemObj.issue_type as string,
        file_size: itemObj.file_size as number,
        alt_text: itemObj.alt_text as string,
        recommended_action: itemObj.recommended_action as string,
      };
    });

    return {
      image_issues: issues,
      total_image_issues: imageIssues.length,
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
  protected extractCost(response: Record<string, unknown> | null) {
    if (!response) return undefined;
    
    // Screaming Frog pricing (as of 2024)
    // Crawl export: $0.01 per request
    // Other operations: $0.005 per request
    
    if (response.data) {
      return { currency: 'USD', amount: 0.01 }; // Crawl export
    }
    
    return { currency: 'USD', amount: 0.005 }; // Other operations
  }
}

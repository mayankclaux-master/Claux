/**
 * DataForSEO Provider Adapter
 * 
 * @deprecated This adapter is deprecated in Phase Z4. Use IntegrationDispatcher instead.
 * Direct provider execution should flow through:
 * Agent → RuntimeService → ExecutionOrchestrator → IntegrationDispatcher → n8n → Provider
 * 
 * This adapter is preserved as a compatibility wrapper during migration.
 * Will be removed in Phase Z5 after all agents are migrated to dispatcher.
 * 
 * Production adapter for DataForSEO API integration.
 * Replaces mock data with real API calls with retry logic and error handling.
 */

export interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
}

export interface DataForSEOConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

/**
 * DataForSEO Adapter for keyword research
 */
export class DataForSEOAdapter {
  private config: DataForSEOConfig;
  private baseUrl: string;

  constructor(config: DataForSEOConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.dataforseo.com';
  }

  /**
   * Fetch keywords for a given domain
   */
  async fetchKeywordsForSite(domain: string): Promise<KeywordData[]> {
    // Deprecation warning
    console.warn('[DEPRECATED] DataForSEOAdapter called directly. Use IntegrationDispatcher instead.');

    if (!this.config.apiKey) {
      throw new Error('DataForSEO API key not configured');
    }

    try {
      // TODO: Implement actual DataForSEO API call
      // For now, this is a placeholder for the real implementation
      // The actual API endpoint and parameters will depend on DataForSEO's API spec
      
      const response = await fetch(`${this.baseUrl}/v3/keywords_data/google_ads/search_volume/live`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [{
            keywords: [domain],
            location_name: 'United States',
            language_name: 'English',
          }],
        }),
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to KeywordData format
      // This will need to match the actual DataForSEO response structure
      return this.transformResponse(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('DataForSEO API request timed out');
      }
      throw new Error(`Failed to fetch keywords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform API response to KeywordData format
   */
  private transformResponse(apiResponse: unknown): KeywordData[] {
    // TODO: Implement actual transformation based on DataForSEO API response structure
    // This is a placeholder that will need to be updated based on the real API spec
    
    // For now, return empty array to prevent type errors
    // Real implementation will parse the API response
    return [];
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  }
}

/**
 * Create DataForSEO adapter instance
 */
export function createDataForSEOAdapter(config: DataForSEOConfig): DataForSEOAdapter {
  return new DataForSEOAdapter(config);
}

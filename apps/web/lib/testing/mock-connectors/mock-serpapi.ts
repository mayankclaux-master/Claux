/**
 * Mock SerpAPI Connector
 * 
 * Mock implementation of SerpAPI for testing.
 * Provides deterministic SERP and search result data.
 */

import { MockConnectorBase, MockConnectorConfig, MockResponse } from './mock-connector-base';

export interface MockSearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  displayed_link: string;
}

export interface MockSerpResponse {
  search_metadata: {
    id: string;
    status: string;
    google_url: string;
    processed_at: string;
  };
  search_parameters: {
    q: string;
    engine: string;
  };
  search_information: {
    query_displayed: string;
    total_results: number;
    time_taken: number;
  };
  organic_results: MockSearchResult[];
}

/**
 * Mock SerpAPI connector
 */
export class MockSerpAPIConnector extends MockConnectorBase {
  private searchDataset: Map<string, MockSerpResponse> = new Map();

  constructor(config?: Partial<MockConnectorConfig>) {
    super(config);
    this.generateSearchDataset();
  }

  /**
   * Generate seeded search dataset
   */
  private generateSearchDataset(): void {
    const queries = [
      'seo services',
      'digital marketing agency',
      'content marketing strategy',
      'link building services',
      'technical seo audit',
    ];

    queries.forEach(query => {
      this.searchDataset.set(query.toLowerCase(), {
        search_metadata: {
          id: `mock-${this.random().toString(36).substring(7)}`,
          status: 'Success',
          google_url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          processed_at: new Date().toISOString(),
        },
        search_parameters: {
          q: query,
          engine: 'google',
        },
        search_information: {
          query_displayed: query,
          total_results: Math.floor(this.random() * 10000000),
          time_taken: parseFloat((this.random() * 2).toFixed(2)),
        },
        organic_results: Array.from({ length: 10 }, (_, i) => ({
          position: i + 1,
          title: `${query} - Result ${i + 1}`,
          link: `https://example.com/${query.replace(/\s+/g, '-')}-${i + 1}`,
          snippet: `This is a snippet for ${query} result ${i + 1}`,
          displayed_link: `example.com › ${query.replace(/\s+/g, '-')}`,
        })),
      });
    });
  }

  /**
   * Get search results
   */
  async search(query: string): Promise<MockResponse<MockSerpResponse | null>> {
    return this.simulateRequest(() => {
      return this.searchDataset.get(query.toLowerCase()) || null;
    });
  }

  /**
   * Get search results with custom parameters
   */
  async searchWithParams(params: {
    q: string;
    engine?: string;
    num?: number;
  }): Promise<MockResponse<MockSerpResponse | null>> {
    return this.simulateRequest(() => {
      const result = this.searchDataset.get(params.q.toLowerCase());
      if (!result) return null;

      // Apply num parameter
      if (params.num && params.num < result.organic_results.length) {
        return {
          ...result,
          organic_results: result.organic_results.slice(0, params.num),
        };
      }

      return result;
    });
  }
}

/**
 * Mock DataForSEO Connector
 * 
 * Mock implementation of DataForSEO API for testing.
 * Provides deterministic keyword, SERP, and backlink data.
 */

import { MockConnectorBase, MockConnectorConfig, MockResponse } from './mock-connector-base';

export interface MockKeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  search_intent: string;
}

export interface MockSERPData {
  keyword: string;
  results: Array<{
    position: number;
    url: string;
    title: string;
    description: string;
  }>;
}

export interface MockBacklinkData {
  url: string;
  backlinks: Array<{
    source_url: string;
    domain_authority: number;
    page_authority: number;
    anchor_text: string;
  }>;
}

/**
 * Mock DataForSEO connector
 */
export class MockDataForSEOConnector extends MockConnectorBase {
  private keywordDataset: MockKeywordData[] = [];
  private serpDataset: Map<string, MockSERPData> = new Map();
  private backlinkDataset: Map<string, MockBacklinkData> = new Map();

  constructor(config?: Partial<MockConnectorConfig>) {
    super(config);
    this.generateKeywordDataset();
    this.generateSERPDataset();
    this.generateBacklinkDataset();
  }

  /**
   * Generate seeded keyword dataset
   */
  private generateKeywordDataset(): void {
    const keywords = [
      'seo services',
      'digital marketing',
      'content marketing',
      'link building',
      'technical seo',
      'local seo',
      'keyword research',
      'on-page seo',
      'off-page seo',
      'seo audit',
    ];

    this.keywordDataset = keywords.map((keyword, i) => ({
      keyword,
      volume: Math.floor(this.random() * 10000) + 100,
      difficulty: Math.floor(this.random() * 100),
      cpc: parseFloat((this.random() * 10).toFixed(2)),
      competition: parseFloat(this.random().toFixed(2)),
      search_intent: ['informational', 'commercial', 'transactional', 'navigational'][Math.floor(this.random() * 4)],
    }));
  }

  /**
   * Generate seeded SERP dataset
   */
  private generateSERPDataset(): void {
    this.keywordDataset.forEach(keywordData => {
      this.serpDataset.set(keywordData.keyword, {
        keyword: keywordData.keyword,
        results: Array.from({ length: 10 }, (_, i) => ({
          position: i + 1,
          url: `https://example.com/page-${i + 1}`,
          title: `${keywordData.keyword} - Result ${i + 1}`,
          description: `This is a description for ${keywordData.keyword} result ${i + 1}`,
        })),
      });
    });
  }

  /**
   * Generate seeded backlink dataset
   */
  private generateBacklinkDataset(): void {
    const urls = ['https://example.com', 'https://test.com', 'https://demo.com'];
    urls.forEach(url => {
      this.backlinkDataset.set(url, {
        url,
        backlinks: Array.from({ length: 50 }, () => ({
          source_url: `https://backlink-${Math.floor(this.random() * 1000)}.com`,
          domain_authority: Math.floor(this.random() * 100),
          page_authority: Math.floor(this.random() * 100),
          anchor_text: 'example anchor',
        })),
      });
    });
  }

  /**
   * Get keyword data
   */
  async getKeywordData(keyword: string): Promise<MockResponse<MockKeywordData | null>> {
    return this.simulateRequest(() => {
      const found = this.keywordDataset.find(k => k.keyword.toLowerCase() === keyword.toLowerCase());
      return found || null;
    });
  }

  /**
   * Get SERP data
   */
  async getSERPData(keyword: string): Promise<MockResponse<MockSERPData | null>> {
    return this.simulateRequest(() => {
      return this.serpDataset.get(keyword.toLowerCase()) || null;
    });
  }

  /**
   * Get backlink data
   */
  async getBacklinkData(url: string): Promise<MockResponse<MockBacklinkData | null>> {
    return this.simulateRequest(() => {
      return this.backlinkDataset.get(url) || null;
    });
  }

  /**
   * Get keyword rankings
   */
  async getKeywordRankings(keywords: string[]): Promise<MockResponse<Array<{ keyword: string; position: number }>>> {
    return this.simulateRequest(() => {
      return keywords.map(keyword => ({
        keyword,
        position: Math.floor(this.random() * 100) + 1,
      }));
    });
  }
}

/**
 * Mock Google Search Console Connector
 * 
 * Mock implementation of Google Search Console API for testing.
 * Provides deterministic search performance and index coverage data.
 */

import { MockConnectorBase, MockConnectorConfig, MockResponse } from './mock-connector-base';

export interface MockSearchPerformanceData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface MockIndexCoverageData {
  page: string;
  status: string;
  lastCrawled: string;
  indexingErrors: number;
}

export interface MockQueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Mock GSC connector
 */
export class MockGSCConnector extends MockConnectorBase {
  private performanceDataset: MockSearchPerformanceData[] = [];
  private coverageDataset: MockIndexCoverageData[] = [];
  private queryDataset: MockQueryData[] = [];

  constructor(config?: Partial<MockConnectorConfig>) {
    super(config);
    this.generatePerformanceDataset();
    this.generateCoverageDataset();
    this.generateQueryDataset();
  }

  /**
   * Generate seeded performance dataset
   */
  private generatePerformanceDataset(): void {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    for (let i = 0; i < 28; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const impressions = Math.floor(this.random() * 10000) + 1000;
      const clicks = Math.floor(impressions * (this.random() * 0.1 + 0.01));

      this.performanceDataset.push({
        date: date.toISOString().split('T')[0],
        clicks,
        impressions,
        ctr: parseFloat((clicks / impressions * 100).toFixed(2)),
        position: parseFloat((this.random() * 20 + 1).toFixed(2)),
      });
    }
  }

  /**
   * Generate seeded coverage dataset
   */
  private generateCoverageDataset(): void {
    const statuses = ['Indexed', 'Indexed, not submitted in sitemap', 'Error', 'Excluded'];
    const pages = Array.from({ length: 100 }, (_, i) => `https://example.com/page-${i}`);

    this.coverageDataset = pages.map(page => ({
      page,
      status: statuses[Math.floor(this.random() * statuses.length)],
      lastCrawled: new Date(Date.now() - Math.floor(this.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      indexingErrors: Math.floor(this.random() * 5),
    }));
  }

  /**
   * Generate seeded query dataset
   */
  private generateQueryDataset(): void {
    const queries = [
      'seo services',
      'digital marketing',
      'content marketing',
      'link building',
      'technical seo',
    ];

    this.queryDataset = queries.map(query => {
      const impressions = Math.floor(this.random() * 5000) + 500;
      const clicks = Math.floor(impressions * (this.random() * 0.1 + 0.01));

      return {
        query,
        clicks,
        impressions,
        ctr: parseFloat((clicks / impressions * 100).toFixed(2)),
        position: parseFloat((this.random() * 20 + 1).toFixed(2)),
      };
    });
  }

  /**
   * Get search performance data
   */
  async getSearchPerformance(startDate: string, endDate: string): Promise<MockResponse<MockSearchPerformanceData[]>> {
    return this.simulateRequest(() => {
      return this.performanceDataset.filter(d => d.date >= startDate && d.date <= endDate);
    });
  }

  /**
   * Get index coverage data
   */
  async getIndexCoverage(): Promise<MockResponse<MockIndexCoverageData[]>> {
    return this.simulateRequest(() => {
      return this.coverageDataset;
    });
  }

  /**
   * Get query data
   */
  async getQueryData(startDate: string, endDate: string): Promise<MockResponse<MockQueryData[]>> {
    return this.simulateRequest(() => {
      return this.queryDataset;
    });
  }

  /**
   * Get URL inspection
   */
  async inspectUrl(url: string): Promise<MockResponse<{
    url: string;
    indexStatus: string;
    lastCrawled: string;
    crawlErrors: string[];
  }>> {
    return this.simulateRequest(() => {
      const coverage = this.coverageDataset.find(c => c.page === url);
      return {
        url,
        indexStatus: coverage?.status || 'Not indexed',
        lastCrawled: coverage?.lastCrawled || new Date().toISOString(),
        crawlErrors: (coverage?.indexingErrors ?? 0) > 0 ? ['Sample error'] : [],
      };
    });
  }
}

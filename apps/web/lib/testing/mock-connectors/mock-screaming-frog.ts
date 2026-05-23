/**
 * Mock Screaming Frog Connector
 * 
 * Mock implementation of Screaming Frog API for testing.
 * Provides deterministic technical SEO crawl data.
 */

import { MockConnectorBase, MockConnectorConfig, MockResponse } from './mock-connector-base';

export interface MockCrawlPage {
  url: string;
  statusCode: number;
  title: string;
  metaDescription: string;
  h1: string;
  canonical: string;
  noindex: boolean;
  nofollow: boolean;
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
}

export interface MockCrawlIssue {
  url: string;
  issueType: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
}

export interface MockCoreWebVitals {
  url: string;
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
}

/**
 * Mock Screaming Frog connector
 */
export class MockScreamingFrogConnector extends MockConnectorBase {
  private crawlDataset: MockCrawlPage[] = [];
  private issuesDataset: MockCrawlIssue[] = [];
  private cwvDataset: MockCoreWebVitals[] = [];

  constructor(config?: Partial<MockConnectorConfig>) {
    super(config);
    this.generateCrawlDataset();
    this.generateIssuesDataset();
    this.generateCWVDataset();
  }

  /**
   * Generate seeded crawl dataset
   */
  private generateCrawlDataset(): void {
    const pages = Array.from({ length: 100 }, (_, i) => `https://example.com/page-${i}`);

    this.crawlDataset = pages.map(url => ({
      url,
      statusCode: Math.random() > 0.05 ? 200 : 404,
      title: `Page ${url.split('/').pop()}`,
      metaDescription: `Description for ${url}`,
      h1: `Heading for ${url}`,
      canonical: url,
      noindex: Math.random() > 0.9,
      nofollow: Math.random() > 0.95,
      internalLinks: Math.floor(this.random() * 20) + 1,
      externalLinks: Math.floor(this.random() * 10),
      wordCount: Math.floor(this.random() * 1000) + 200,
    }));
  }

  /**
   * Generate seeded issues dataset
   */
  private generateIssuesDataset(): void {
    const issueTypes = [
      'Missing H1',
      'Duplicate Title',
      'Missing Meta Description',
      'Broken Link',
      'No Canonical',
      'Orphan Page',
      'Large Page Size',
      'Slow Page Speed',
    ];

    const severities: ('error' | 'warning' | 'info')[] = ['error', 'warning', 'info'];

    this.issuesDataset = Array.from({ length: 50 }, () => ({
      url: this.crawlDataset[Math.floor(this.random() * this.crawlDataset.length)].url,
      issueType: issueTypes[Math.floor(this.random() * issueTypes.length)],
      severity: severities[Math.floor(this.random() * severities.length)],
      description: `Issue description for ${issueTypes[Math.floor(this.random() * issueTypes.length)]}`,
    }));
  }

  /**
   * Generate seeded Core Web Vitals dataset
   */
  private generateCWVDataset(): void {
    this.cwvDataset = this.crawlDataset.slice(0, 20).map(page => ({
      url: page.url,
      lcp: parseFloat((this.random() * 4 + 0.5).toFixed(2)),
      fid: parseFloat((this.random() * 200).toFixed(2)),
      cls: parseFloat((this.random() * 0.5).toFixed(3)),
    }));
  }

  /**
   * Get crawl data
   */
  async getCrawlData(): Promise<MockResponse<MockCrawlPage[]>> {
    return this.simulateRequest(() => this.crawlDataset);
  }

  /**
   * Get crawl issues
   */
  async getCrawlIssues(): Promise<MockResponse<MockCrawlIssue[]>> {
    return this.simulateRequest(() => this.issuesDataset);
  }

  /**
   * Get Core Web Vitals
   */
  async getCoreWebVitals(): Promise<MockResponse<MockCoreWebVitals[]>> {
    return this.simulateRequest(() => this.cwvDataset);
  }

  /**
   * Get page details
   */
  async getPageDetails(url: string): Promise<MockResponse<MockCrawlPage | null>> {
    return this.simulateRequest(() => {
      return this.crawlDataset.find(p => p.url === url) || null;
    });
  }

  /**
   * Start crawl
   */
  async startCrawl(startUrl: string): Promise<MockResponse<{ crawlId: string; status: string }>> {
    return this.simulateRequest(() => ({
      crawlId: `crawl-${this.random().toString(36).substring(7)}`,
      status: 'started',
    }));
  }

  /**
   * Get crawl status
   */
  async getCrawlStatus(crawlId: string): Promise<MockResponse<{ status: string; progress: number }>> {
    return this.simulateRequest(() => ({
      status: 'completed',
      progress: 100,
    }));
  }
}

/**
 * Mock GA4 Connector
 * 
 * Mock implementation of Google Analytics 4 API for testing.
 * Provides deterministic traffic and analytics data.
 */

import { MockConnectorBase, MockConnectorConfig, MockResponse } from './mock-connector-base';

export interface MockGA4Report {
  dimensionValues: string[];
  metricValues: string[];
}

export interface MockTrafficData {
  date: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export interface MockTrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
}

/**
 * Mock GA4 connector
 */
export class MockGA4Connector extends MockConnectorBase {
  private trafficDataset: MockTrafficData[] = [];
  private sourceDataset: MockTrafficSource[] = [];

  constructor(config?: Partial<MockConnectorConfig>) {
    super(config);
    this.generateTrafficDataset();
    this.generateSourceDataset();
  }

  /**
   * Generate seeded traffic dataset
   */
  private generateTrafficDataset(): void {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      this.trafficDataset.push({
        date: date.toISOString().split('T')[0],
        sessions: Math.floor(this.random() * 1000) + 100,
        users: Math.floor(this.random() * 800) + 80,
        pageviews: Math.floor(this.random() * 5000) + 500,
        bounceRate: parseFloat((this.random() * 100).toFixed(2)),
        avgSessionDuration: parseFloat((this.random() * 300).toFixed(2)),
      });
    }
  }

  /**
   * Generate seeded source dataset
   */
  private generateSourceDataset(): void {
    const sources = [
      { source: 'google', medium: 'organic' },
      { source: 'google', medium: 'cpc' },
      { source: 'facebook', medium: 'social' },
      { source: 'linkedin', medium: 'social' },
      { source: 'direct', medium: '(none)' },
    ];

    this.sourceDataset = sources.map(item => ({
      source: item.source,
      medium: item.medium,
      sessions: Math.floor(this.random() * 500) + 50,
      users: Math.floor(this.random() * 400) + 40,
    }));
  }

  /**
   * Get traffic report
   */
  async getTrafficReport(startDate: string, endDate: string): Promise<MockResponse<MockTrafficData[]>> {
    return this.simulateRequest(() => {
      return this.trafficDataset.filter(d => d.date >= startDate && d.date <= endDate);
    });
  }

  /**
   * Get source report
   */
  async getSourceReport(startDate: string, endDate: string): Promise<MockResponse<MockTrafficSource[]>> {
    return this.simulateRequest(() => {
      return this.sourceDataset;
    });
  }

  /**
   * Get page report
   */
  async getPageReport(startDate: string, endDate: string): Promise<MockResponse<Array<{ page: string; pageviews: number }>>> {
    return this.simulateRequest(() => {
      return Array.from({ length: 20 }, () => ({
        page: `/page-${Math.floor(this.random() * 100)}`,
        pageviews: Math.floor(this.random() * 1000) + 100,
      }));
    });
  }

  /**
   * Get realtime users
   */
  async getRealtimeUsers(): Promise<MockResponse<{ activeUsers: number }>> {
    return this.simulateRequest(() => ({
      activeUsers: Math.floor(this.random() * 50) + 10,
    }));
  }
}

/**
 * Mock Google Business Profile Connector
 * 
 * Mock implementation of Google Business Profile API for testing.
 * Provides deterministic local SEO and GMB data.
 */

import { MockConnectorBase, MockConnectorConfig, MockResponse } from './mock-connector-base';

export interface MockGBPLocation {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  businessHours: Array<{ day: string; hours: string }>;
}

export interface MockGBPReview {
  author: string;
  rating: number;
  comment: string;
  createTime: string;
  reply?: string;
}

export interface MockGBPInsight {
  metricName: string;
  value: number;
}

/**
 * Mock GBP connector
 */
export class MockGBPConnector extends MockConnectorBase {
  private locationData: MockGBPLocation;
  private reviewsDataset: MockGBPReview[] = [];
  private insightsDataset: MockGBPInsight[] = [];

  constructor(config?: Partial<MockConnectorConfig>) {
    super(config);
    this.locationData = this.generateLocationData();
    this.generateReviewsDataset();
    this.generateInsightsDataset();
  }

  /**
   * Generate seeded location data
   */
  private generateLocationData(): MockGBPLocation {
    return {
      name: 'Example Business',
      address: '123 Main St, City, State 12345',
      phone: '+1 555-123-4567',
      website: 'https://example.com',
      rating: parseFloat((this.random() * 2 + 3).toFixed(1)),
      reviewCount: Math.floor(this.random() * 500) + 50,
      businessHours: [
        { day: 'Monday', hours: '9:00 AM - 5:00 PM' },
        { day: 'Tuesday', hours: '9:00 AM - 5:00 PM' },
        { day: 'Wednesday', hours: '9:00 AM - 5:00 PM' },
        { day: 'Thursday', hours: '9:00 AM - 5:00 PM' },
        { day: 'Friday', hours: '9:00 AM - 5:00 PM' },
        { day: 'Saturday', hours: '10:00 AM - 2:00 PM' },
        { day: 'Sunday', hours: 'Closed' },
      ],
    };
  }

  /**
   * Generate seeded reviews dataset
   */
  private generateReviewsDataset(): void {
    const comments = [
      'Great service!',
      'Excellent experience',
      'Highly recommend',
      'Professional team',
      'Will return again',
      'Amazing work',
      'Very satisfied',
      'Top quality',
    ];

    const authors = Array.from({ length: 50 }, (_, i) => `User ${i + 1}`);

    this.reviewsDataset = authors.map(author => ({
      author,
      rating: Math.floor(this.random() * 2) + 4,
      comment: comments[Math.floor(this.random() * comments.length)],
      createTime: new Date(Date.now() - Math.floor(this.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
      reply: this.random() > 0.5 ? 'Thank you for your review!' : undefined,
    }));
  }

  /**
   * Generate seeded insights dataset
   */
  private generateInsightsDataset(): void {
    this.insightsDataset = [
      { metricName: 'LOCAL_POST_VIEWS_SEARCH', value: Math.floor(this.random() * 1000) + 100 },
      { metricName: 'LOCAL_POST_VIEWS_MAPS', value: Math.floor(this.random() * 500) + 50 },
      { metricName: 'LOCAL_ACTIONS_CALLS', value: Math.floor(this.random() * 100) + 10 },
      { metricName: 'LOCAL_ACTIONS_WEBSITE', value: Math.floor(this.random() * 200) + 20 },
      { metricName: 'LOCAL_ACTIONS_DRIVING_DIRECTIONS', value: Math.floor(this.random() * 150) + 15 },
    ];
  }

  /**
   * Get location data
   */
  async getLocation(): Promise<MockResponse<MockGBPLocation>> {
    return this.simulateRequest(() => this.locationData);
  }

  /**
   * Get reviews
   */
  async getReviews(): Promise<MockResponse<MockGBPReview[]>> {
    return this.simulateRequest(() => this.reviewsDataset);
  }

  /**
   * Get insights
   */
  async getInsights(): Promise<MockResponse<MockGBPInsight[]>> {
    return this.simulateRequest(() => this.insightsDataset);
  }

  /**
   * Reply to review
   */
  async replyToReview(reviewId: string, reply: string): Promise<MockResponse<{ success: boolean }>> {
    return this.simulateRequest(() => ({ success: true }));
  }

  /**
   * Update location
   */
  async updateLocation(data: Partial<MockGBPLocation>): Promise<MockResponse<{ success: boolean }>> {
    return this.simulateRequest(() => {
      Object.assign(this.locationData, data);
      return { success: true };
    });
  }
}

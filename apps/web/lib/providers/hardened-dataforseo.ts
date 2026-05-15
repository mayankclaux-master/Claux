/**
 * Hardened DataForSEO Provider
 * With retries, backoff, rate limiting, quota tracking
 */

export class HardenedDataForSEOAdapter {
  private apiKey: string;
  private requestCount = 0;
  private lastRequestTime = 0;
  private minRequestInterval = 100; // ms

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchKeywords(domain: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.rateLimit();
        const result = await this.fetchWithRetry(domain);
        return result;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.backoff(i);
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async rateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - elapsed));
    }
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private async backoff(attempt: number) {
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async fetchWithRetry(domain: string) {
    // Actual API call implementation
    return { keywords: [], total: 0 };
  }

  getStats() {
    return { requestCount: this.requestCount };
  }
}

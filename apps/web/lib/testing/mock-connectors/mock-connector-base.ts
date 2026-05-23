/**
 * Mock Connector Base
 * 
 * Base class for all mock connectors with configurable behavior.
 * Provides deterministic responses, seeded datasets, latency simulation, failure injection.
 */

export interface MockConnectorConfig {
  latencyMs: number;
  failureRate: number; // 0-1
  timeoutRate: number; // 0-1
  malformedRate: number; // 0-1
  rateLimitMs: number; // minimum time between requests
  seed: number; // for deterministic responses
}

export interface MockResponse<T> {
  data: T;
  latency: number;
  simulatedFailure: boolean;
  simulatedTimeout: boolean;
  simulatedMalformed: boolean;
}

/**
 * Base mock connector class
 */
export class MockConnectorBase {
  protected config: MockConnectorConfig;
  protected lastRequestTime: number = 0;
  protected requestCount: number = 0;

  constructor(config: Partial<MockConnectorConfig> = {}) {
    this.config = {
      latencyMs: 100,
      failureRate: 0,
      timeoutRate: 0,
      malformedRate: 0,
      rateLimitMs: 0,
      seed: 42,
      ...config,
    };
  }

  /**
   * Simulate request with latency and potential failures
   */
  protected async simulateRequest<T>(
    dataGenerator: () => T
  ): Promise<MockResponse<T>> {
    this.requestCount++;

    // Check rate limit
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.rateLimitMs) {
      await this.sleep(this.config.rateLimitMs - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    // Simulate latency
    const latency = this.config.latencyMs + (this.random() * 50);
    await this.sleep(latency);

    // Simulate failure
    const simulatedFailure = this.random() < this.config.failureRate;
    if (simulatedFailure) {
      throw new Error('Simulated connector failure');
    }

    // Simulate timeout
    const simulatedTimeout = this.random() < this.config.timeoutRate;
    if (simulatedTimeout) {
      throw new Error('Simulated timeout');
    }

    // Simulate malformed payload
    const simulatedMalformed = this.random() < this.config.malformedRate;
    const data = dataGenerator();

    return {
      data,
      latency,
      simulatedFailure,
      simulatedTimeout,
      simulatedMalformed,
    };
  }

  /**
   * Seeded random number generator for deterministic responses
   */
  protected random(): number {
    this.config.seed = (this.config.seed * 9301 + 49297) % 233280;
    return this.config.seed / 233280;
  }

  /**
   * Sleep helper
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<MockConnectorConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get statistics
   */
  getStats(): {
    requestCount: number;
    config: MockConnectorConfig;
  } {
    return {
      requestCount: this.requestCount,
      config: { ...this.config },
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}

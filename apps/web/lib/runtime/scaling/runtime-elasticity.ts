/**
 * CLAUX Runtime Scaling Layer - Runtime Elasticity
 */

/**
 * Runtime Elasticity Manager
 */
export class RuntimeElasticityManager {
  private elasticityFactor: number = 1.0;
  private loadHistory: number[] = [];

  /**
   * Calculate elasticity
   */
  calculate(currentLoad: number): number {
    this.loadHistory.push(currentLoad);
    if (this.loadHistory.length > 100) this.loadHistory.shift();

    const avg = this.loadHistory.reduce((a, b) => a + b, 0) / this.loadHistory.length;
    const variance = this.loadHistory.reduce((sum, load) => sum + Math.pow(load - avg, 2), 0) / this.loadHistory.length;
    const stdDev = Math.sqrt(variance);

    // Higher elasticity for more volatile loads
    this.elasticityFactor = 1 + stdDev;

    return this.elasticityFactor;
  }

  /**
   * Get elasticity factor
   */
  getElasticityFactor(): number {
    return this.elasticityFactor;
  }

  /**
   * Clear
   */
  clear(): void {
    this.elasticityFactor = 1.0;
    this.loadHistory = [];
  }
}

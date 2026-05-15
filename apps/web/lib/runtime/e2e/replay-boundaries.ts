/**
 * CLAUX Runtime E2E Layer - Replay Boundaries
 */

/**
 * Replay Boundary Manager
 */
export class ReplayBoundaryManager {
  private boundaries: Map<string, string[]> = new Map();

  /**
   * Define boundary
   */
  define(boundaryId: string, executionIds: string[]): void {
    this.boundaries.set(boundaryId, executionIds);
  }

  /**
   * Get boundary
   */
  getBoundary(boundaryId: string): readonly string[] {
    return this.boundaries.get(boundaryId) || [];
  }

  /**
   * Clear
   */
  clear(): void {
    this.boundaries.clear();
  }
}

/**
 * CLAUX Runtime Simulation Layer - Resource Simulation
 */

/**
 * Resource Simulation Manager
 */
export class ResourceSimulationManager {
  private resources: Map<string, number> = new Map();

  /**
   * Allocate resource
   */
  allocate(resource: string, amount: number): boolean {
    const current = this.resources.get(resource) || 0;
    const available = 100 - current;

    if (available >= amount) {
      this.resources.set(resource, current + amount);
      return true;
    }

    return false;
  }

  /**
   * Release resource
   */
  release(resource: string, amount: number): void {
    const current = this.resources.get(resource) || 0;
    this.resources.set(resource, Math.max(0, current - amount));
  }

  /**
   * Get usage
   */
  getUsage(resource: string): number {
    return this.resources.get(resource) || 0;
  }

  /**
   * Clear
   */
  clear(): void {
    this.resources.clear();
  }
}

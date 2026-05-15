/**
 * CLAUX Runtime Bootstrap Layer - Runtime Warmup
 */

/**
 * Runtime Warmup Manager
 */
export class RuntimeWarmupManager {
  private warmupTasks: Map<string, () => Promise<void>> = new Map();
  private completedTasks: Set<string> = new Set();

  /**
   * Add warmup task
   */
  addWarmupTask(name: string, task: () => Promise<void>): void {
    this.warmupTasks.set(name, task);
  }

  /**
   * Run warmup
   */
  async runWarmup(): Promise<void> {
    const promises = Array.from(this.warmupTasks.entries()).map(
      async ([name, task]) => {
        await task();
        this.completedTasks.add(name);
      }
    );

    await Promise.all(promises);
  }

  /**
   * Check if warmup complete
   */
  isWarmupComplete(): boolean {
    return this.completedTasks.size === this.warmupTasks.size;
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks(): readonly string[] {
    return Array.from(this.completedTasks);
  }

  /**
   * Clear
   */
  clear(): void {
    this.warmupTasks.clear();
    this.completedTasks.clear();
  }
}

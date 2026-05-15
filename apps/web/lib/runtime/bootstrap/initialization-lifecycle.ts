/**
 * CLAUX Runtime Bootstrap Layer - Initialization Lifecycle
 */

/**
 * Initialization Lifecycle Manager
 */
export class InitializationLifecycleManager {
  private initializedModules: Set<string> = new Set();
  private initializationOrder: string[] = [];

  /**
   * Initialize module
   */
  initializeModule(moduleId: string): void {
    if (this.initializedModules.has(moduleId)) {
      return;
    }

    this.initializedModules.add(moduleId);
    this.initializationOrder.push(moduleId);
  }

  /**
   * Check if module is initialized
   */
  isInitialized(moduleId: string): boolean {
    return this.initializedModules.has(moduleId);
  }

  /**
   * Get initialization order
   */
  getInitializationOrder(): readonly string[] {
    return this.initializationOrder;
  }

  /**
   * Reset
   */
  reset(): void {
    this.initializedModules.clear();
    this.initializationOrder = [];
  }
}

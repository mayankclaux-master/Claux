/**
 * CLAUX Runtime E2E Layer - Side Effect Isolation
 */

/**
 * Side Effect Isolation Manager
 */
export class SideEffectIsolationManager {
  private sideEffects: Map<string, unknown[]> = new Map();

  /**
   * Capture side effect
   */
  capture(executionId: string, effect: unknown): void {
    const effects = this.sideEffects.get(executionId) || [];
    effects.push(effect);
    this.sideEffects.set(executionId, effects);
  }

  /**
   * Get side effects
   */
  getSideEffects(executionId: string): readonly unknown[] {
    return this.sideEffects.get(executionId) || [];
  }

  /**
   * Clear side effects
   */
  clear(executionId: string): void {
    this.sideEffects.delete(executionId);
  }

  /**
   * Clear all
   */
  clearAll(): void {
    this.sideEffects.clear();
  }
}

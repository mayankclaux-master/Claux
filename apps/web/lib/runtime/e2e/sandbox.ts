/**
 * CLAUX Runtime E2E Layer - Sandbox
 */

import type { SandboxState, SandboxId } from './types';

/**
 * Execution Sandbox Manager
 */
export class ExecutionSandboxManager {
  private sandboxes: Map<string, SandboxState> = new Map();

  /**
   * Create sandbox
   */
  create(): SandboxState {
    const sandboxId = this.generateSandboxId();
    const state: SandboxState = {
      sandboxId,
      isolated: true,
      timestamp: Date.now(),
    };

    this.sandboxes.set(sandboxId, state);
    return state;
  }

  /**
   * Get sandbox
   */
  get(sandboxId: string): SandboxState | undefined {
    return this.sandboxes.get(sandboxId);
  }

  /**
   * Destroy sandbox
   */
  destroy(sandboxId: string): void {
    this.sandboxes.delete(sandboxId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.sandboxes.clear();
  }

  /**
   * Generate sandbox ID
   */
  private generateSandboxId(): SandboxId {
    return `sandbox_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

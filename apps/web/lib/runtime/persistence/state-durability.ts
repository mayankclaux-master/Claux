/**
 * CLAUX Runtime Persistence Layer - State Durability
 */

import type { StateDurability, StateId } from './types';
import { StateDurabilityError } from './errors';

/**
 * State Durability Manager
 */
export class StateDurabilityManager {
  private states: Map<StateId, StateDurability> = new Map();
  private versionCounter: number = 0;

  /**
   * Persist state
   */
  persist(state: Record<string, unknown>): StateDurability {
    const stateId = this.generateStateId();
    this.versionCounter++;

    const durability: StateDurability = {
      stateId,
      version: this.versionCounter,
      persisted: true,
      location: `memory://${stateId}`,
    };

    this.states.set(stateId, durability);
    return durability;
  }

  /**
   * Restore state
   */
  restore(stateId: StateId): Record<string, unknown> | null {
    const durability = this.states.get(stateId);
    if (!durability) return null;

    return {
      stateId,
      version: durability.version,
      restoredAt: Date.now(),
    };
  }

  /**
   * Get state
   */
  getState(stateId: StateId): StateDurability | undefined {
    return this.states.get(stateId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.states.clear();
    this.versionCounter = 0;
  }

  /**
   * Generate state ID
   */
  private generateStateId(): StateId {
    return `state_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

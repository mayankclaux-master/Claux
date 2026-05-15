/**
 * CLAUX Runtime Bootstrap Layer - Capability Discovery
 */

import type { RuntimeCapability } from './types';

/**
 * Capability Discovery Manager
 */
export class CapabilityDiscoveryManager {
  private capabilities: Map<string, RuntimeCapability> = new Map();

  /**
   * Register capability
   */
  registerCapability(capability: RuntimeCapability): void {
    this.capabilities.set(capability.capabilityId, capability);
  }

  /**
   * Get capability
   */
  getCapability(capabilityId: string): RuntimeCapability | undefined {
    return this.capabilities.get(capabilityId);
  }

  /**
   * List capabilities
   */
  listCapabilities(): readonly RuntimeCapability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * List required capabilities
   */
  listRequiredCapabilities(): readonly RuntimeCapability[] {
    return Array.from(this.capabilities.values()).filter((c) => c.required);
  }

  /**
   * Check capability exists
   */
  hasCapability(capabilityId: string): boolean {
    return this.capabilities.has(capabilityId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.capabilities.clear();
  }
}

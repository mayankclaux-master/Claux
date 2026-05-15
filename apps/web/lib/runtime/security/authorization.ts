/**
 * CLAUX Runtime Security Layer - Authorization
 */

import type { Capability, CapabilityId, IdentityId } from './types';
import { AuthorizationError } from './errors';

/**
 * Authorization Manager
 */
export class AuthorizationManager {
  private capabilities: Map<CapabilityId, Capability> = new Map();
  private identityCapabilities: Map<IdentityId, CapabilityId[]> = new Map();

  /**
   * Register capability
   */
  register(capability: Capability): void {
    this.capabilities.set(capability.capabilityId, capability);
  }

  /**
   * Grant capability to identity
   */
  grant(identityId: IdentityId, capabilityId: CapabilityId): void {
    const caps = this.identityCapabilities.get(identityId) || [];
    caps.push(capabilityId);
    this.identityCapabilities.set(identityId, caps);
  }

  /**
   * Check capability
   */
  check(identityId: IdentityId, capabilityId: CapabilityId): boolean {
    const caps = this.identityCapabilities.get(identityId) || [];
    return caps.includes(capabilityId);
  }

  /**
   * Get capabilities
   */
  getCapabilities(identityId: IdentityId): readonly Capability[] {
    const capIds = this.identityCapabilities.get(identityId) || [];
    return capIds.map(id => this.capabilities.get(id)).filter((c): c is Capability => c !== undefined);
  }

  /**
   * Clear
   */
  clear(): void {
    this.capabilities.clear();
    this.identityCapabilities.clear();
  }
}

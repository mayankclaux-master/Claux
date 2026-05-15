/**
 * CLAUX Runtime Bootstrap Layer - Provider Registration
 */

import type { ProviderRegistration, ProviderId } from './types';
import { ProviderRegistrationError } from './errors';

/**
 * Provider Registration Manager
 */
export class ProviderRegistrationManager {
  private providers: Map<ProviderId, ProviderRegistration> = new Map();

  /**
   * Register provider
   */
  register(provider: ProviderRegistration): void {
    if (this.providers.has(provider.providerId)) {
      throw new ProviderRegistrationError(`Provider ${provider.providerId} already registered`);
    }

    this.providers.set(provider.providerId, provider);
  }

  /**
   * Unregister provider
   */
  unregister(providerId: ProviderId): void {
    if (!this.providers.has(providerId)) {
      throw new ProviderRegistrationError(`Provider ${providerId} not registered`);
    }

    this.providers.delete(providerId);
  }

  /**
   * Get provider
   */
  get(providerId: ProviderId): ProviderRegistration | undefined {
    return this.providers.get(providerId);
  }

  /**
   * List providers
   */
  list(): readonly ProviderRegistration[] {
    return Array.from(this.providers.values());
  }

  /**
   * List providers by type
   */
  listByType(providerType: string): readonly ProviderRegistration[] {
    return Array.from(this.providers.values()).filter(
      (p) => p.providerType === providerType
    );
  }

  /**
   * Clear
   */
  clear(): void {
    this.providers.clear();
  }
}

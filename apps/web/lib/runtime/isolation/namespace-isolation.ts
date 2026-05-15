/**
 * CLAUX Runtime Isolation Layer - Namespace Isolation
 */

import type { NamespaceIsolation, NamespaceId, TenantId } from './types';

/**
 * Namespace Isolation Manager
 */
export class NamespaceIsolationManager {
  private namespaces: Map<NamespaceId, NamespaceIsolation> = new Map();
  private tenantNamespaces: Map<TenantId, NamespaceId[]> = new Map();

  /**
   * Create namespace
   */
  create(namespaceId: NamespaceId, tenantId: TenantId): NamespaceIsolation {
    const isolation: NamespaceIsolation = {
      namespaceId,
      tenantId,
      isolated: true,
    };

    this.namespaces.set(namespaceId, isolation);

    const tenantNs = this.tenantNamespaces.get(tenantId) || [];
    tenantNs.push(namespaceId);
    this.tenantNamespaces.set(tenantId, tenantNs);

    return isolation;
  }

  /**
   * Get namespace
   */
  get(namespaceId: NamespaceId): NamespaceIsolation | undefined {
    return this.namespaces.get(namespaceId);
  }

  /**
   * Get tenant namespaces
   */
  getTenantNamespaces(tenantId: TenantId): readonly NamespaceIsolation[] {
    const nsIds = this.tenantNamespaces.get(tenantId) || [];
    return nsIds.map(id => this.namespaces.get(id)).filter((n): n is NamespaceIsolation => n !== undefined);
  }

  /**
   * Check isolation
   */
  isIsolated(namespaceId: NamespaceId): boolean {
    const ns = this.namespaces.get(namespaceId);
    return ns?.isolated || false;
  }

  /**
   * Clear
   */
  clear(): void {
    this.namespaces.clear();
    this.tenantNamespaces.clear();
  }
}

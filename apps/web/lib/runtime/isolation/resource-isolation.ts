/**
 * CLAUX Runtime Isolation Layer - Resource Isolation
 */

import type { ResourceIsolation, TenantId } from './types';
import { ResourceIsolationError } from './errors';
import { DEFAULT_CPU_LIMIT, DEFAULT_MEMORY_LIMIT, DEFAULT_STORAGE_LIMIT, DEFAULT_NETWORK_LIMIT } from './constants';

/**
 * Resource Isolation Manager
 */
export class ResourceIsolationManager {
  private resources: Map<string, ResourceIsolation> = new Map();
  private tenantResources: Map<TenantId, string[]> = new Map();

  /**
   * Allocate resource
   */
  allocate(tenantId: TenantId, type: ResourceIsolation['type'], amount: number): ResourceIsolation {
    const resourceId = this.generateResourceId(tenantId, type);
    const limit = this.getDefaultLimit(type);

    const isolation: ResourceIsolation = {
      resourceId,
      tenantId,
      type,
      allocated: amount,
      limit,
    };

    this.resources.set(resourceId, isolation);

    const tenantRes = this.tenantResources.get(tenantId) || [];
    tenantRes.push(resourceId);
    this.tenantResources.set(tenantId, tenantRes);

    return isolation;
  }

  /**
   * Get resource
   */
  get(resourceId: string): ResourceIsolation | undefined {
    return this.resources.get(resourceId);
  }

  /**
   * Get tenant resources
   */
  getTenantResources(tenantId: TenantId): readonly ResourceIsolation[] {
    const resIds = this.tenantResources.get(tenantId) || [];
    return resIds.map(id => this.resources.get(id)).filter((r): r is ResourceIsolation => r !== undefined);
  }

  /**
   * Check limit
   */
  checkLimit(resourceId: string, additional: number): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource) return false;

    return resource.allocated + additional <= resource.limit;
  }

  /**
   * Clear
   */
  clear(): void {
    this.resources.clear();
    this.tenantResources.clear();
  }

  /**
   * Generate resource ID
   */
  private generateResourceId(tenantId: TenantId, type: string): string {
    return `${tenantId}_${type}_${Date.now()}`;
  }

  /**
   * Get default limit
   */
  private getDefaultLimit(type: ResourceIsolation['type']): number {
    switch (type) {
      case 'cpu':
        return DEFAULT_CPU_LIMIT;
      case 'memory':
        return DEFAULT_MEMORY_LIMIT;
      case 'storage':
        return DEFAULT_STORAGE_LIMIT;
      case 'network':
        return DEFAULT_NETWORK_LIMIT;
      default:
        return 100;
    }
  }
}

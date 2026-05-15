/**
 * CLAUX Runtime Isolation Layer - Tenant Boundaries
 */

import type { TenantBoundary, TenantId, BoundaryId } from './types';
import { TenantBoundaryError } from './errors';

/**
 * Tenant Boundary Manager
 */
export class TenantBoundaryManager {
  private boundaries: Map<TenantId, TenantBoundary> = new Map();

  /**
   * Create boundary
   */
  create(tenantId: TenantId): TenantBoundary {
    const boundary: TenantBoundary = {
      tenantId,
      boundaryId: this.generateBoundaryId(),
      createdAt: Date.now(),
      isolated: true,
    };

    this.boundaries.set(tenantId, boundary);
    return boundary;
  }

  /**
   * Get boundary
   */
  get(tenantId: TenantId): TenantBoundary | undefined {
    return this.boundaries.get(tenantId);
  }

  /**
   * Check isolation
   */
  isIsolated(tenantId: TenantId): boolean {
    const boundary = this.boundaries.get(tenantId);
    return boundary?.isolated || false;
  }

  /**
   * Enable isolation
   */
  enableIsolation(tenantId: TenantId): void {
    const boundary = this.boundaries.get(tenantId);
    if (!boundary) return;

    const updated: TenantBoundary = {
      ...boundary,
      isolated: true,
    };

    this.boundaries.set(tenantId, updated);
  }

  /**
   * Disable isolation
   */
  disableIsolation(tenantId: TenantId): void {
    const boundary = this.boundaries.get(tenantId);
    if (!boundary) return;

    const updated: TenantBoundary = {
      ...boundary,
      isolated: false,
    };

    this.boundaries.set(tenantId, updated);
  }

  /**
   * Clear
   */
  clear(): void {
    this.boundaries.clear();
  }

  /**
   * Generate boundary ID
   */
  private generateBoundaryId(): BoundaryId {
    return `boundary_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

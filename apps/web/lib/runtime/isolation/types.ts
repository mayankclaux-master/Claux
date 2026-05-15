/**
 * CLAUX Runtime Isolation Layer - Types
 */

export type TenantId = string;
export type NamespaceId = string;
export type BoundaryId = string;

/**
 * Tenant Boundary
 */
export interface TenantBoundary {
  readonly tenantId: TenantId;
  readonly boundaryId: BoundaryId;
  readonly createdAt: number;
  readonly isolated: boolean;
}

/**
 * Namespace Isolation
 */
export interface NamespaceIsolation {
  readonly namespaceId: NamespaceId;
  readonly tenantId: TenantId;
  readonly isolated: boolean;
}

/**
 * Resource Isolation
 */
export interface ResourceIsolation {
  readonly resourceId: string;
  readonly tenantId: TenantId;
  readonly type: 'cpu' | 'memory' | 'storage' | 'network';
  readonly allocated: number;
  readonly limit: number;
}

/**
 * Tenant Checkpoint
 */
export interface TenantCheckpoint {
  readonly checkpointId: string;
  readonly tenantId: TenantId;
  readonly timestamp: number;
  readonly state: Record<string, unknown>;
}

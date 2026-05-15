/**
 * CLAUX Runtime Isolation Layer - Validation
 */

import type { TenantBoundary, NamespaceIsolation, ResourceIsolation } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Isolation Validator
 */
export class IsolationValidator {
  /**
   * Validate tenant boundary
   */
  validateTenantBoundary(boundary: TenantBoundary): ValidationResult {
    const errors: string[] = [];

    if (!boundary.tenantId) errors.push('Missing tenantId');
    if (!boundary.boundaryId) errors.push('Missing boundaryId');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate namespace isolation
   */
  validateNamespaceIsolation(isolation: NamespaceIsolation): ValidationResult {
    const errors: string[] = [];

    if (!isolation.namespaceId) errors.push('Missing namespaceId');
    if (!isolation.tenantId) errors.push('Missing tenantId');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate resource isolation
   */
  validateResourceIsolation(isolation: ResourceIsolation): ValidationResult {
    const errors: string[] = [];

    if (!isolation.resourceId) errors.push('Missing resourceId');
    if (!isolation.tenantId) errors.push('Missing tenantId');
    if (isolation.allocated < 0) errors.push('Invalid allocated value');
    if (isolation.limit < 0) errors.push('Invalid limit value');

    return { valid: errors.length === 0, errors };
  }
}

/**
 * CLAUX Runtime Security Layer - Validation
 */

import type { Permission, Identity, Secret } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Security Validator
 */
export class SecurityValidator {
  /**
   * Validate permission
   */
  validatePermission(permission: Permission): ValidationResult {
    const errors: string[] = [];

    if (!permission.permissionId) errors.push('Missing permissionId');
    if (!permission.resource) errors.push('Missing resource');
    if (!permission.action) errors.push('Missing action');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate identity
   */
  validateIdentity(identity: Identity): ValidationResult {
    const errors: string[] = [];

    if (!identity.identityId) errors.push('Missing identityId');
    if (!identity.type) errors.push('Missing type');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate secret
   */
  validateSecret(secret: Secret): ValidationResult {
    const errors: string[] = [];

    if (!secret.secretId) errors.push('Missing secretId');
    if (!secret.name) errors.push('Missing name');
    if (!secret.type) errors.push('Missing type');

    return { valid: errors.length === 0, errors };
  }
}

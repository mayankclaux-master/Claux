/**
 * CLAUX Runtime Security Layer - Permissions
 */

import type { Permission, PermissionId, IdentityId } from './types';
import { PermissionError } from './errors';

/**
 * Permission Manager
 */
export class PermissionManager {
  private permissions: Map<PermissionId, Permission> = new Map();
  private identityPermissions: Map<IdentityId, PermissionId[]> = new Map();

  /**
   * Register permission
   */
  register(permission: Permission): void {
    this.permissions.set(permission.permissionId, permission);
  }

  /**
   * Grant permission to identity
   */
  grant(identityId: IdentityId, permissionId: PermissionId): void {
    const perms = this.identityPermissions.get(identityId) || [];
    perms.push(permissionId);
    this.identityPermissions.set(identityId, perms);
  }

  /**
   * Revoke permission from identity
   */
  revoke(identityId: IdentityId, permissionId: PermissionId): void {
    const perms = this.identityPermissions.get(identityId) || [];
    const filtered = perms.filter(p => p !== permissionId);
    this.identityPermissions.set(identityId, filtered);
  }

  /**
   * Check permission
   */
  check(identityId: IdentityId, resource: string, action: string): boolean {
    const permIds = this.identityPermissions.get(identityId) || [];

    for (const permId of permIds) {
      const perm = this.permissions.get(permId);
      if (!perm) continue;

      if (perm.resource === resource && perm.action === action) {
        return true;
      }

      if (perm.resource === '*' || perm.action === '*') {
        return true;
      }
    }

    return false;
  }

  /**
   * Get permissions
   */
  getPermissions(identityId: IdentityId): readonly Permission[] {
    const permIds = this.identityPermissions.get(identityId) || [];
    return permIds.map(id => this.permissions.get(id)).filter((p): p is Permission => p !== undefined);
  }

  /**
   * Clear
   */
  clear(): void {
    this.permissions.clear();
    this.identityPermissions.clear();
  }
}

/**
 * CLAUX Runtime Security Layer - Types
 */

export type PermissionId = string;
export type CapabilityId = string;
export type IdentityId = string;
export type SecretId = string;

/**
 * Permission
 */
export interface Permission {
  readonly permissionId: PermissionId;
  readonly resource: string;
  readonly action: string;
  readonly conditions?: readonly PermissionCondition[];
}

/**
 * Permission Condition
 */
export interface PermissionCondition {
  readonly key: string;
  readonly operator: 'eq' | 'neq' | 'in';
  readonly value: unknown;
}

/**
 * Capability
 */
export interface Capability {
  readonly capabilityId: CapabilityId;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly PermissionId[];
}

/**
 * Identity
 */
export interface Identity {
  readonly identityId: IdentityId;
  readonly type: 'user' | 'service' | 'system';
  readonly attributes: Record<string, unknown>;
}

/**
 * Secret
 */
export interface Secret {
  readonly secretId: SecretId;
  readonly name: string;
  readonly type: string;
  readonly encrypted: boolean;
  readonly createdAt: number;
}

/**
 * Trust Boundary
 */
export interface TrustBoundary {
  readonly boundaryId: string;
  readonly name: string;
  readonly level: 'public' | 'internal' | 'restricted' | 'confidential';
}

/**
 * Encryption Context
 */
export interface EncryptionContext {
  readonly algorithm: string;
  readonly keyId: string;
  readonly nonce?: string;
}

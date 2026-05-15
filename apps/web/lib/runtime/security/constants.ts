/**
 * CLAUX Runtime Security Layer - Constants
 */

/**
 * Default Encryption Algorithm
 */
export const DEFAULT_ENCRYPTION_ALGORITHM = 'AES-256-GCM';

/**
 * Default Signing Algorithm
 */
export const DEFAULT_SIGNING_ALGORITHM = 'ECDSA';

/**
 * Trust Boundary Levels
 */
export const TRUST_BOUNDARY_LEVELS = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  RESTRICTED: 'restricted',
  CONFIDENTIAL: 'confidential',
} as const;

/**
 * Secret TTL (24 hours)
 */
export const SECRET_TTL = 86400000;

/**
 * Permission Cache TTL (1 hour)
 */
export const PERMISSION_CACHE_TTL = 3600000;

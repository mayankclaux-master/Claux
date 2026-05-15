/**
 * CLAUX Runtime Security Layer - Secret Access
 */

import type { Secret, SecretId } from './types';
import { SecretAccessError } from './errors';
import { SECRET_TTL } from './constants';

/**
 * Secret Access Manager
 */
export class SecretAccessManager {
  private secrets: Map<SecretId, Secret> = new Map();
  private accessLog: Map<SecretId, AccessRecord[]> = new Map();

  /**
   * Store secret
   */
  store(secret: Secret): void {
    this.secrets.set(secret.secretId, secret);
  }

  /**
   * Access secret
   */
  access(secretId: SecretId, requesterId: string): Secret | undefined {
    const secret = this.secrets.get(secretId);
    if (!secret) return undefined;

    // Check TTL
    if (Date.now() - secret.createdAt > SECRET_TTL) {
      this.secrets.delete(secretId);
      return undefined;
    }

    // Log access
    this.logAccess(secretId, requesterId);

    return secret;
  }

  /**
   * Revoke secret
   */
  revoke(secretId: SecretId): void {
    this.secrets.delete(secretId);
  }

  /**
   * Get access log
   */
  getAccessLog(secretId: SecretId): readonly AccessRecord[] {
    return this.accessLog.get(secretId) || [];
  }

  /**
   * Clear
   */
  clear(): void {
    this.secrets.clear();
    this.accessLog.clear();
  }

  /**
   * Log access
   */
  private logAccess(secretId: SecretId, requesterId: string): void {
    const log = this.accessLog.get(secretId) || [];
    log.push({
      timestamp: Date.now(),
      requesterId,
    });
    this.accessLog.set(secretId, log);
  }
}

/**
 * Access Record
 */
interface AccessRecord {
  readonly timestamp: number;
  readonly requesterId: string;
}

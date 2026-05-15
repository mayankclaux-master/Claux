/**
 * CLAUX Runtime Security Layer - Errors
 */

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class PermissionError extends SecurityError {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class AuthorizationError extends SecurityError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class SecretAccessError extends SecurityError {
  constructor(message: string) {
    super(message);
    this.name = 'SecretAccessError';
  }
}

export class EncryptionError extends SecurityError {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class IdentityVerificationError extends SecurityError {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityVerificationError';
  }
}

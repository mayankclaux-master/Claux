/**
 * CLAUX Runtime Isolation Layer - Errors
 */

export class IsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IsolationError';
  }
}

export class TenantBoundaryError extends IsolationError {
  constructor(message: string) {
    super(message);
    this.name = 'TenantBoundaryError';
  }
}

export class ResourceIsolationError extends IsolationError {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceIsolationError';
  }
}

export class QuotaEnforcementError extends IsolationError {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaEnforcementError';
  }
}

export class CrossTenantViolationError extends IsolationError {
  constructor(message: string) {
    super(message);
    this.name = 'CrossTenantViolationError';
  }
}

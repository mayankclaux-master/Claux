/**
 * CLAUX Runtime Governance Layer - Errors
 */

export class GovernanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GovernanceError';
  }
}

export class PolicyError extends GovernanceError {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyError';
  }
}

export class RateLimitError extends GovernanceError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class QuotaError extends GovernanceError {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaError';
  }
}

export class ComplianceError extends GovernanceError {
  constructor(message: string) {
    super(message);
    this.name = 'ComplianceError';
  }
}

export class PolicyInheritanceError extends GovernanceError {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyInheritanceError';
  }
}

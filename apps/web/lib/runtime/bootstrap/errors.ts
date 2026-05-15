/**
 * CLAUX Runtime Bootstrap Layer - Errors
 */

export class BootstrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BootstrapError';
  }
}

export class AssemblyError extends BootstrapError {
  constructor(message: string) {
    super(message);
    this.name = 'AssemblyError';
  }
}

export class ProviderRegistrationError extends BootstrapError {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderRegistrationError';
  }
}

export class DependencyValidationError extends BootstrapError {
  constructor(message: string) {
    super(message);
    this.name = 'DependencyValidationError';
  }
}

export class StartupValidationError extends BootstrapError {
  constructor(message: string) {
    super(message);
    this.name = 'StartupValidationError';
  }
}

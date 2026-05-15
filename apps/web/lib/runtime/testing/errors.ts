/**
 * CLAUX Runtime Testing Layer - Errors
 */

export class TestingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TestingError';
  }
}

export class ChaosTestError extends TestingError {
  constructor(message: string) {
    super(message);
    this.name = 'ChaosTestError';
  }
}

export class RecoveryValidationError extends TestingError {
  constructor(message: string) {
    super(message);
    this.name = 'RecoveryValidationError';
  }
}

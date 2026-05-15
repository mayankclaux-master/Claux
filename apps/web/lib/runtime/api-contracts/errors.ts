/**
 * CLAUX Runtime API Contracts Layer - Errors
 */

export class APIContractsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIContractsError';
  }
}

export class RequestError extends APIContractsError {
  constructor(message: string) {
    super(message);
    this.name = 'RequestError';
  }
}

export class QueryError extends APIContractsError {
  constructor(message: string) {
    super(message);
    this.name = 'QueryError';
  }
}

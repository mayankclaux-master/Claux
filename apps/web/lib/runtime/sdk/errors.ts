/**
 * CLAUX Runtime SDK Layer - Errors
 */

export class SDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SDKError';
  }
}

export class RuntimeClientError extends SDKError {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeClientError';
  }
}

export class StreamingError extends SDKError {
  constructor(message: string) {
    super(message);
    this.name = 'StreamingError';
  }
}

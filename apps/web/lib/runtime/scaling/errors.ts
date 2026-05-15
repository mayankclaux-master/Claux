/**
 * CLAUX Runtime Scaling Layer - Errors
 */

export class ScalingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScalingError';
  }
}

export class PredictiveScalingError extends ScalingError {
  constructor(message: string) {
    super(message);
    this.name = 'PredictiveScalingError';
  }
}

export class ResourceSchedulingError extends ScalingError {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceSchedulingError';
  }
}

export class BackpressureError extends ScalingError {
  constructor(message: string) {
    super(message);
    this.name = 'BackpressureError';
  }
}

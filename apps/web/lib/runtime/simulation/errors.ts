/**
 * CLAUX Runtime Simulation Layer - Errors
 */

export class SimulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SimulationError';
  }
}

export class DryRunError extends SimulationError {
  constructor(message: string) {
    super(message);
    this.name = 'DryRunError';
  }
}

export class FaultInjectionError extends SimulationError {
  constructor(message: string) {
    super(message);
    this.name = 'FaultInjectionError';
  }
}

/**
 * CLAUX Runtime Telemetry Layer - Errors
 */

export class TelemetryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TelemetryError';
  }
}

export class SpanError extends TelemetryError {
  constructor(message: string) {
    super(message);
    this.name = 'SpanError';
  }
}

export class MetricError extends TelemetryError {
  constructor(message: string) {
    super(message);
    this.name = 'MetricError';
  }
}

export class TraceError extends TelemetryError {
  constructor(message: string) {
    super(message);
    this.name = 'TraceError';
  }
}

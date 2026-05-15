/**
 * CLAUX Runtime Persistence Layer - Errors
 */

export class PersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersistenceError';
  }
}

export class StateDurabilityError extends PersistenceError {
  constructor(message: string) {
    super(message);
    this.name = 'StateDurabilityError';
  }
}

export class SnapshotError extends PersistenceError {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

export class ArchiveError extends PersistenceError {
  constructor(message: string) {
    super(message);
    this.name = 'ArchiveError';
  }
}

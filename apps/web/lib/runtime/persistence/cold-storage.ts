/**
 * CLAUX Runtime Persistence Layer - Cold Storage
 */

import type { Archive, ArchiveId } from './types';

/**
 * Cold Storage Manager
 */
export class ColdStorageManager {
  private storage: Map<ArchiveId, Archive> = new Map();

  /**
   * Store in cold storage
   */
  store(archive: Archive): void {
    const coldArchive: Archive = {
      ...archive,
      tier: 'cold',
    };
    this.storage.set(archive.archiveId, coldArchive);
  }

  /**
   * Retrieve from cold storage
   */
  retrieve(archiveId: ArchiveId): Archive | undefined {
    return this.storage.get(archiveId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.storage.clear();
  }
}

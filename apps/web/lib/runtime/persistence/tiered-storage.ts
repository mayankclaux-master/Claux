/**
 * CLAUX Runtime Persistence Layer - Tiered Storage
 */

import type { Archive, ArchiveId } from './types';
import { HOT_TIER_TTL, WARM_TIER_TTL } from './constants';

/**
 * Tiered Storage Manager
 */
export class TieredStorageManager {
  private hotTier: Map<ArchiveId, Archive> = new Map();
  private warmTier: Map<ArchiveId, Archive> = new Map();
  private coldTier: Map<ArchiveId, Archive> = new Map();

  /**
   * Store in hot tier
   */
  storeHot(archive: Archive): void {
    const hotArchive: Archive = { ...archive, tier: 'hot' };
    this.hotTier.set(archive.archiveId, hotArchive);
  }

  /**
   * Store in warm tier
   */
  storeWarm(archive: Archive): void {
    const warmArchive: Archive = { ...archive, tier: 'warm' };
    this.warmTier.set(archive.archiveId, warmArchive);
  }

  /**
   * Store in cold tier
   */
  storeCold(archive: Archive): void {
    const coldArchive: Archive = { ...archive, tier: 'cold' };
    this.coldTier.set(archive.archiveId, coldArchive);
  }

  /**
   * Retrieve
   */
  retrieve(archiveId: ArchiveId): Archive | undefined {
    return this.hotTier.get(archiveId) || this.warmTier.get(archiveId) || this.coldTier.get(archiveId);
  }

  /**
   * Demote tiers
   */
  demoteTiers(): void {
    const now = Date.now();

    // Hot to Warm
    for (const [id, archive] of this.hotTier) {
      if (now - archive.timestamp > HOT_TIER_TTL) {
        this.hotTier.delete(id);
        this.storeWarm(archive);
      }
    }

    // Warm to Cold
    for (const [id, archive] of this.warmTier) {
      if (now - archive.timestamp > WARM_TIER_TTL) {
        this.warmTier.delete(id);
        this.storeCold(archive);
      }
    }
  }

  /**
   * Clear
   */
  clear(): void {
    this.hotTier.clear();
    this.warmTier.clear();
    this.coldTier.clear();
  }
}

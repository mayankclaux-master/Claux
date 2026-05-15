/**
 * Sitemap Ingestion
 * Ingests sitemap data into database
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { type SitemapEntry } from './website-scanner';

export async function ingestSitemap(
  tenantId: string,
  workspaceId: string,
  websiteUrl: string,
  sitemapUrl: string,
  entries: SitemapEntry[]
): Promise<{ success: boolean; total_ingested: number; errors: string[] }> {
  const supabase = createSupabaseAdminClient();
  const errors: string[] = [];
  let totalIngested = 0;

  try {
    // Store sitemap metadata
    const { error: sitemapError } = await supabase
      .from('sitemaps')
      .upsert({
        tenant_id: tenantId,
        workspace_id: workspaceId,
        website_url: websiteUrl,
        sitemap_url: sitemapUrl,
        total_entries: entries.length,
        last_crawled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,website_url' });

    if (sitemapError) {
      errors.push(sitemapError.message);
      return { success: false, total_ingested: 0, errors };
    }

    // Batch insert pages
    const batchSize = 100;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const pageInserts = batch.map(entry => ({
        tenant_id: tenantId,
        workspace_id: workspaceId,
        url: entry.url,
        website_url: websiteUrl,
        last_modified: entry.last_modified,
        change_frequency: entry.change_frequency,
        priority: entry.priority,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: pagesError } = await supabase
        .from('pages')
        .upsert(pageInserts, { onConflict: 'tenant_id,url' });

      if (pagesError) {
        errors.push(pagesError.message);
      } else {
        totalIngested += batch.length;
      }
    }

    return { success: true, total_ingested: totalIngested, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, total_ingested: 0, errors };
  }
}

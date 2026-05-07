import { getGoogleAccessToken, getTenantIntegrations } from "../utils";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Indexing Assistant for Google Search Console
 * Updates sitemap, submits to Search Console, and requests indexing for priority URLs
 * Does NOT use Google Indexing API for normal blog pages
 */

export interface IndexingStatus {
  url: string;
  status: "pending" | "submitted" | "indexed" | "failed";
  submitted_at: string | null;
  indexed_at: string | null;
  error_message: string | null;
}

/**
 * Update sitemap and submit to Search Console
 */
export async function updateAndSubmitSitemap(tenantId: string, sitemapUrl: string): Promise<boolean> {
  const integrations = await getTenantIntegrations(tenantId);

  if (!integrations || integrations.google_status !== "connected" || !integrations.search_console_property) {
    console.warn("Google Search Console not connected, skipping sitemap submission");
    return false;
  }

  const accessToken = await getGoogleAccessToken(tenantId);

  if (!accessToken) {
    console.error("Failed to get Google access token for sitemap submission");
    return false;
  }

  try {
    // Submit sitemap to Search Console
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(integrations.search_console_property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sitemap submission failed:", errorText);
      return false;
    }

    console.log("Sitemap submitted successfully:", sitemapUrl);
    return true;
  } catch (error) {
    console.error("Error submitting sitemap:", error);
    return false;
  }
}

/**
 * Request indexing for a URL using URL Inspection API
 * Only for priority URLs - does NOT use Google Indexing API
 */
export async function requestUrlIndexing(tenantId: string, url: string): Promise<boolean> {
  const integrations = await getTenantIntegrations(tenantId);

  if (!integrations || integrations.google_status !== "connected" || !integrations.search_console_property) {
    console.warn("Google Search Console not connected, skipping URL indexing request");
    return false;
  }

  const accessToken = await getGoogleAccessToken(tenantId);

  if (!accessToken) {
    console.error("Failed to get Google access token for URL indexing");
    return false;
  }

  try {
    // Use URL Inspection API to request indexing
    const response = await fetch(
      `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          inspectionUrl: url,
          siteUrl: integrations.search_console_property,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("URL indexing request failed:", errorText);
      return false;
    }

    const data = await response.json();
    console.log("URL indexing requested successfully:", url, data.inspectionResult?.indexStatusResult);
    return true;
  } catch (error) {
    console.error("Error requesting URL indexing:", error);
    return false;
  }
}

/**
 * Store indexing status in database
 */
export async function storeIndexingStatus(
  tenantId: string,
  url: string,
  status: IndexingStatus["status"],
  errorMessage: string | null = null
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from("indexing_status")
      .upsert({
        tenant_id: tenantId,
        url: url,
        status: status,
        submitted_at: status === "submitted" ? new Date().toISOString() : null,
        indexed_at: status === "indexed" ? new Date().toISOString() : null,
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "tenant_id,url"
      });

    if (error) {
      console.error("Failed to store indexing status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error storing indexing status:", error);
    return false;
  }
}

/**
 * Complete indexing workflow after publish
 * 1. Update sitemap
 * 2. Submit sitemap to Search Console
 * 3. Request indexing for priority URLs
 * 4. Store status in database
 */
export async function completeIndexingWorkflow(
  tenantId: string,
  publishedUrl: string,
  isPriority: boolean = false
): Promise<void> {
  const integrations = await getTenantIntegrations(tenantId);

  if (!integrations || integrations.google_status !== "connected") {
    console.log("Google Search Console not connected, skipping indexing workflow");
    await storeIndexingStatus(tenantId, publishedUrl, "pending", "Search Console not connected");
    return;
  }

  // Step 1: Update sitemap (if applicable)
  const sitemapUrl = `${new URL(publishedUrl).origin}/sitemap.xml`;
  const sitemapSubmitted = await updateAndSubmitSitemap(tenantId, sitemapUrl);

  // Step 2: Request indexing for priority URLs only
  if (isPriority) {
    const indexingRequested = await requestUrlIndexing(tenantId, publishedUrl);
    
    if (indexingRequested) {
      await storeIndexingStatus(tenantId, publishedUrl, "submitted");
    } else {
      await storeIndexingStatus(tenantId, publishedUrl, "failed", "Indexing request failed");
    }
  } else {
    // For non-priority URLs, just mark as pending after sitemap submission
    await storeIndexingStatus(tenantId, publishedUrl, sitemapSubmitted ? "submitted" : "pending");
  }
}

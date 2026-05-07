import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getGoogleRefreshToken, encryptSecret, updateIntegrationStatus } from "../utils";

/**
 * Token Refresh Job
 * Checks expiring Google tokens and refreshes them automatically
 * Runs periodically to ensure tokens don't expire
 */

const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * Check if a token is expiring soon
 */
function isTokenExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return true;

  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;

  return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD_MS;
}

/**
 * Refresh a single tenant's Google token
 */
export async function refreshTenantGoogleToken(tenantId: string): Promise<boolean> {
  try {
    const refreshToken = await getGoogleRefreshToken(tenantId);

    if (!refreshToken) {
      console.log(`No refresh token found for tenant ${tenantId}`);
      await updateIntegrationStatus(tenantId, "google", "expired");
      return false;
    }

    // Exchange refresh token for new access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      console.error(`Token refresh failed for tenant ${tenantId}:`, await tokenResponse.text());
      await updateIntegrationStatus(tenantId, "google", "expired");
      return false;
    }

    const tokenData = await tokenResponse.json();
    
    // Store new access token
    const supabase = createSupabaseAdminClient();

    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        google_access_token_encrypted: encryptSecret(tokenData.access_token),
        google_token_expires_at: expiresAt,
        google_status: "connected",
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", tenantId);

    if (updateError) {
      console.error(`Failed to store refreshed token for tenant ${tenantId}:`, updateError);
      return false;
    }

    console.log(`Successfully refreshed token for tenant ${tenantId}`);
    return true;
  } catch (error) {
    console.error(`Error refreshing token for tenant ${tenantId}:`, error);
    await updateIntegrationStatus(tenantId, "google", "error");
    return false;
  }
}

/**
 * Refresh all expiring Google tokens
 */
export async function refreshExpiringTokens(): Promise<{
  success: number;
  failed: number;
  skipped: number;
}> {
  const supabase = createSupabaseAdminClient();

  // Get all tenants with Google integration
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("tenant_id, google_token_expires_at, google_status")
    .eq("google_status", "connected");

  if (error) {
    console.error("Failed to fetch integrations for token refresh:", error);
    return { success: 0, failed: 0, skipped: 0 };
  }

  if (!integrations || integrations.length === 0) {
    console.log("No Google integrations to refresh");
    return { success: 0, failed: 0, skipped: 0 };
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const integration of integrations) {
    if (!isTokenExpiringSoon(integration.google_token_expires_at)) {
      skipped++;
      continue;
    }

    const result = await refreshTenantGoogleToken(integration.tenant_id);
    
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(`Token refresh completed: ${success} success, ${failed} failed, ${skipped} skipped`);
  
  return { success, failed, skipped };
}

/**
 * Manual trigger for token refresh (for testing or urgent refresh)
 */
export async function triggerTokenRefreshForTenant(tenantId: string): Promise<boolean> {
  return await refreshTenantGoogleToken(tenantId);
}

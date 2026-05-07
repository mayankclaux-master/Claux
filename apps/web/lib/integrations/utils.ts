import crypto from 'crypto';
import { env } from '@/lib/env';

/**
 * Encrypt a secret using AES-256-GCM
 * Uses a key derived from environment variable
 */
export function encryptSecret(secret: string): string {
  const algorithm = 'aes-256-gcm';
  const encryptionKey = env.INTEGRATION_ENCRYPTION_KEY || 'default-key-change-in-production';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, auth tag, and encrypted data
  const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;
  
  return Buffer.from(combined, 'hex').toString('base64');
}

/**
 * Decrypt a secret using AES-256-GCM
 */
export function decryptSecret(encryptedSecret: string): string {
  const algorithm = 'aes-256-gcm';
  const encryptionKey = env.INTEGRATION_ENCRYPTION_KEY || 'default-key-change-in-production';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  
  // Decode base64
  const combined = Buffer.from(encryptedSecret, 'base64').toString('hex');
  
  // Extract IV, auth tag, and encrypted data
  const iv = Buffer.from(combined.slice(0, 32), 'hex');
  const authTag = Buffer.from(combined.slice(32, 64), 'hex');
  const encrypted = combined.slice(64);
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Get tenant integrations from database
 */
export async function getTenantIntegrations(tenantId: string) {
  const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
  const supabase = createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching tenant integrations:', error);
    return null;
  }
  
  return data;
}

/**
 * Update integration status
 */
export async function updateIntegrationStatus(
  tenantId: string,
  provider: 'google' | 'wp' | 'shopify' | 'custom',
  status: 'not_connected' | 'connected' | 'error' | 'expired',
  metadata?: Record<string, unknown>
) {
  const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
  const supabase = createSupabaseAdminClient();
  
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };
  
  if (provider === 'google') {
    updateData.google_status = status;
  } else if (provider === 'wp') {
    updateData.wp_status = status;
  } else if (provider === 'shopify') {
    updateData.shopify_status = status;
  } else if (provider === 'custom') {
    updateData.custom_status = status;
  }
  
  if (metadata) {
    updateData.metadata = metadata;
  }
  
  const { error } = await supabase
    .from('integrations')
    .update(updateData)
    .eq('tenant_id', tenantId);
  
  if (error) {
    console.error('Error updating integration status:', error);
    return false;
  }
  
  return true;
}

/**
 * Ensure integration row exists for tenant
 */
export async function ensureIntegrationRow(tenantId: string) {
  const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
  const supabase = createSupabaseAdminClient();
  
  // Check if row exists
  const { data: existing } = await supabase
    .from('integrations')
    .select('id')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  
  if (existing) {
    return existing.id;
  }
  
  // Create new row
  const { data, error } = await supabase
    .from('integrations')
    .insert({
      tenant_id: tenantId,
      provider: 'google'
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating integration row:', error);
    return null;
  }
  
  return data.id;
}

/**
 * Get decrypted Google access token
 */
export async function getGoogleAccessToken(tenantId: string): Promise<string | null> {
  const integrations = await getTenantIntegrations(tenantId);
  
  if (!integrations?.google_access_token_encrypted) {
    return null;
  }
  
  try {
    return decryptSecret(integrations.google_access_token_encrypted);
  } catch (error) {
    console.error('Error decrypting Google access token:', error);
    return null;
  }
}

/**
 * Get decrypted Google refresh token
 */
export async function getGoogleRefreshToken(tenantId: string): Promise<string | null> {
  const integrations = await getTenantIntegrations(tenantId);
  
  if (!integrations?.google_refresh_token_encrypted) {
    return null;
  }
  
  try {
    return decryptSecret(integrations.google_refresh_token_encrypted);
  } catch (error) {
    console.error('Error decrypting Google refresh token:', error);
    return null;
  }
}

/**
 * Get decrypted WordPress app password
 */
export async function getWordPressAppPassword(tenantId: string): Promise<string | null> {
  const integrations = await getTenantIntegrations(tenantId);
  
  if (!integrations?.wp_app_password_encrypted) {
    return null;
  }
  
  try {
    return decryptSecret(integrations.wp_app_password_encrypted);
  } catch (error) {
    console.error('Error decrypting WordPress app password:', error);
    return null;
  }
}

/**
 * Get decrypted Shopify access token
 */
export async function getShopifyAccessToken(tenantId: string): Promise<string | null> {
  const integrations = await getTenantIntegrations(tenantId);
  
  if (!integrations?.shopify_access_token_encrypted) {
    return null;
  }
  
  try {
    return decryptSecret(integrations.shopify_access_token_encrypted);
  } catch (error) {
    console.error('Error decrypting Shopify access token:', error);
    return null;
  }
}

/**
 * Get decrypted custom API key
 */
export async function getCustomApiKey(tenantId: string): Promise<string | null> {
  const integrations = await getTenantIntegrations(tenantId);
  
  if (!integrations?.custom_api_key_encrypted) {
    return null;
  }
  
  try {
    return decryptSecret(integrations.custom_api_key_encrypted);
  } catch (error) {
    console.error('Error decrypting custom API key:', error);
    return null;
  }
}

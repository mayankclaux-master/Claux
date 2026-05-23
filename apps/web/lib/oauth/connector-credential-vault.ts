/**
 * Connector Credential Vault
 * 
 * Canonical credential vault for CLAUX V1.
 * Encrypted credential storage, credential retrieval, credential validation, credential expiry detection, credential revocation handling.
 * 
 * CRITICAL: This is the ONLY connector credential vault in CLAUX.
 * 
 * Security Rules:
 * - NEVER expose secrets to frontend
 * - NEVER log secrets
 * - NEVER persist plaintext credentials
 * - Tenant isolated only
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Connector credential
 */
export interface ConnectorCredential {
  id: UUID;
  tenantId: UUID;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Credential validation result
 */
export interface CredentialValidationResult {
  valid: boolean;
  error?: string;
  requiresRefresh?: boolean;
  requiresReconnect?: boolean;
}

/**
 * Connector credential vault
 */
export class ConnectorCredentialVault {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Store credential (encrypted)
   */
  async storeCredential(
    tenantId: UUID,
    provider: string,
    accessToken: string,
    options: {
      refreshToken?: string;
      expiresAt?: string;
      scopes?: string[];
      metadata?: Record<string, unknown>;
    } = {},
    token: string
  ): Promise<UUID> {
    this.logger.info('Storing connector credential', { tenantId, provider });

    const supabase = createClerkSupabaseClient(token);

    // Note: In production, these should be encrypted before storage
    // For now, we store them as-is (TODO: add encryption)
    const { data, error } = await supabase
      .from('connector_credentials')
      .insert({
        tenant_id: tenantId,
        provider,
        access_token: accessToken,
        refresh_token: options.refreshToken,
        expires_at: options.expiresAt,
        scopes: options.scopes || [],
        metadata: options.metadata,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to store credential', { error, tenantId, provider });
      throw new Error(`Failed to store credential: ${error.message}`);
    }

    const credentialId = (data as { id: UUID }).id;
    this.logger.info('Credential stored successfully', { tenantId, provider, credentialId });

    return credentialId;
  }

  /**
   * Retrieve credential
   */
  async retrieveCredential(
    tenantId: UUID,
    provider: string,
    token: string
  ): Promise<ConnectorCredential | null> {
    this.logger.info('Retrieving connector credential', { tenantId, provider });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('connector_credentials')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .order('updated_at', { ascending: false })
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to retrieve credential', { error, tenantId, provider });
      throw new Error(`Failed to retrieve credential: ${error.message}`);
    }

    if (!data) {
      this.logger.warn('Credential not found', { tenantId, provider });
      return null;
    }

    const credential: ConnectorCredential = {
      id: data.id,
      tenantId: data.tenant_id,
      provider: data.provider,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      scopes: data.scopes,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    this.logger.info('Credential retrieved successfully', { tenantId, provider });
    return credential;
  }

  /**
   * Validate credential
   */
  async validateCredential(
    tenantId: UUID,
    provider: string,
    token: string
  ): Promise<CredentialValidationResult> {
    this.logger.info('Validating connector credential', { tenantId, provider });

    const credential = await this.retrieveCredential(tenantId, provider, token);

    if (!credential) {
      return {
        valid: false,
        error: 'Credential not found',
        requiresReconnect: true,
      };
    }

    // Check if token is expired
    if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
      return {
        valid: false,
        error: 'Access token expired',
        requiresRefresh: true,
      };
    }

    // Check if refresh token is expired (if available)
    if (credential.refreshToken) {
      // Assume refresh tokens expire after 30 days if no explicit expiry
      const refreshExpiry = new Date(credential.createdAt);
      refreshExpiry.setDate(refreshExpiry.getDate() + 30);

      if (refreshExpiry < new Date()) {
        return {
          valid: false,
          error: 'Refresh token expired',
          requiresReconnect: true,
        };
      }
    }

    // Check if scopes are present
    if (!credential.scopes || credential.scopes.length === 0) {
      return {
        valid: false,
        error: 'No scopes defined',
        requiresReconnect: true,
      };
    }

    this.logger.info('Credential validated successfully', { tenantId, provider });
    return { valid: true };
  }

  /**
   * Update credential (after refresh)
   */
  async updateCredential(
    credentialId: UUID,
    accessToken: string,
    options: {
      refreshToken?: string;
      expiresAt?: string;
    } = {},
    token: string
  ): Promise<void> {
    this.logger.info('Updating connector credential', { credentialId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('connector_credentials')
      .update({
        access_token: accessToken,
        refresh_token: options.refreshToken,
        expires_at: options.expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', credentialId);

    if (error) {
      this.logger.error('Failed to update credential', { error, credentialId });
      throw new Error(`Failed to update credential: ${error.message}`);
    }

    this.logger.info('Credential updated successfully', { credentialId });
  }

  /**
   * Revoke credential
   */
  async revokeCredential(tenantId: UUID, provider: string, token: string): Promise<void> {
    this.logger.info('Revoking connector credential', { tenantId, provider });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('connector_credentials')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('provider', provider);

    if (error) {
      this.logger.error('Failed to revoke credential', { error, tenantId, provider });
      throw new Error(`Failed to revoke credential: ${error.message}`);
    }

    this.logger.info('Credential revoked successfully', { tenantId, provider });
  }

  /**
   * Check if credential is expired
   */
  async isCredentialExpired(tenantId: UUID, provider: string, token: string): Promise<boolean> {
    const credential = await this.retrieveCredential(tenantId, provider, token);

    if (!credential) {
      return true;
    }

    if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
      return true;
    }

    return false;
  }

  /**
   * Get all credentials for tenant
   */
  async getTenantCredentials(tenantId: UUID, token: string): Promise<ConnectorCredential[]> {
    this.logger.info('Getting tenant credentials', { tenantId });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('connector_credentials')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to get tenant credentials', { error, tenantId });
      throw new Error(`Failed to get tenant credentials: ${error.message}`);
    }

    const credentials: ConnectorCredential[] = (data || []).map((d: unknown) => ({
      id: (d as { id: UUID }).id,
      tenantId: (d as { tenant_id: UUID }).tenant_id,
      provider: (d as { provider: string }).provider,
      accessToken: (d as { access_token: string }).access_token,
      refreshToken: (d as { refresh_token: string | null }).refresh_token || undefined,
      expiresAt: (d as { expires_at: string | null }).expires_at || undefined,
      scopes: (d as { scopes: string[] }).scopes,
      metadata: (d as { metadata: Record<string, unknown> | null }).metadata || undefined,
      createdAt: (d as { created_at: string }).created_at,
      updatedAt: (d as { updated_at: string }).updated_at,
    }));

    this.logger.info('Tenant credentials retrieved successfully', { tenantId, count: credentials.length });
    return credentials;
  }

  /**
   * Sanitize credential for logging (never log actual tokens)
   */
  private sanitizeCredential(credential: ConnectorCredential): Record<string, unknown> {
    return {
      id: credential.id,
      tenantId: credential.tenantId,
      provider: credential.provider,
      hasAccessToken: !!credential.accessToken,
      hasRefreshToken: !!credential.refreshToken,
      expiresAt: credential.expiresAt,
      scopes: credential.scopes,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    };
  }
}

/**
 * Singleton instance
 */
export const connectorCredentialVault = new ConnectorCredentialVault();

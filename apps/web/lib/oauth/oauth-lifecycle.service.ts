/**
 * OAuth Lifecycle Service
 * 
 * Canonical OAuth lifecycle service for CLAUX V1.
 * Token refresh, expiry detection, reconnect required detection, token health verification, token rotation, refresh retry handling.
 * 
 * CRITICAL: This is the ONLY OAuth lifecycle service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';
import { connectorCredentialVault, CredentialValidationResult } from './connector-credential-vault';
import { safeRetryEngine } from '../execution/safe-retry-engine';
import { failureClassifier, ErrorType } from '../execution/failure-classification';

/**
 * OAuth token
 */
export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes: string[];
}

/**
 * OAuth refresh result
 */
export interface OAuthRefreshResult {
  success: boolean;
  token?: OAuthToken;
  error?: string;
  requiresReconnect?: boolean;
}

/**
 * OAuth lifecycle service
 */
export class OAuthLifecycleService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Refresh token
   */
  async refreshToken(
    tenantId: UUID,
    provider: string,
    token: string
  ): Promise<OAuthRefreshResult> {
    this.logger.info('Refreshing OAuth token', { tenantId, provider });

    // Get current credential
    const credential = await connectorCredentialVault.retrieveCredential(tenantId, provider, token);

    if (!credential) {
      return {
        success: false,
        error: 'Credential not found',
        requiresReconnect: true,
      };
    }

    if (!credential.refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
        requiresReconnect: true,
      };
    }

    // Perform provider-specific refresh
    try {
      const newToken = await this.performProviderRefresh(provider, credential.refreshToken);

      // Update credential with new token
      await connectorCredentialVault.updateCredential(
        credential.id,
        newToken.accessToken,
        {
          refreshToken: newToken.refreshToken,
          expiresAt: newToken.expiresAt,
        },
        token
      );

      this.logger.info('Token refreshed successfully', { tenantId, provider });
      return { success: true, token: newToken };
    } catch (error) {
      const errorType = failureClassifier.getErrorType(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Token refresh failed', { tenantId, provider, error });

      // If error is permanent, require reconnect
      if (errorType === ErrorType.AUTH || errorType === ErrorType.VALIDATION) {
        return {
          success: false,
          error: errorMessage,
          requiresReconnect: true,
        };
      }

      // If error is transient, retry
      return {
        success: false,
        error: errorMessage,
        requiresReconnect: false,
      };
    }
  }

  /**
   * Perform provider-specific refresh
   */
  private async performProviderRefresh(provider: string, refreshToken: string): Promise<OAuthToken> {
    // Placeholder for actual refresh logic
    // In production, this would call the provider's OAuth refresh endpoint
    
    switch (provider) {
      case 'google_analytics':
      case 'google_search_console':
      case 'google_business_profile':
        return await this.refreshGoogleToken(refreshToken);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Refresh Google token
   */
  private async refreshGoogleToken(refreshToken: string): Promise<OAuthToken> {
    // Placeholder for Google OAuth refresh
    // In production, this would call https://oauth2.googleapis.com/token
    
    this.logger.info('Refreshing Google token (placeholder)');
    
    // Simulate refresh
    return {
      accessToken: 'new_access_token_placeholder',
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    };
  }

  /**
   * Check if token is expired
   */
  async isTokenExpired(tenantId: UUID, provider: string, token: string): Promise<boolean> {
    return await connectorCredentialVault.isCredentialExpired(tenantId, provider, token);
  }

  /**
   * Check if token requires refresh
   */
  async requiresRefresh(tenantId: UUID, provider: string, token: string): Promise<boolean> {
    const credential = await connectorCredentialVault.retrieveCredential(tenantId, provider, token);

    if (!credential) {
      return true;
    }

    if (!credential.expiresAt) {
      return false;
    }

    // Refresh if token expires within 5 minutes
    const expiryTime = new Date(credential.expiresAt).getTime();
    const now = Date.now();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes

    return expiryTime - now < refreshThreshold;
  }

  /**
   * Validate token health
   */
  async validateTokenHealth(tenantId: UUID, provider: string, token: string): Promise<CredentialValidationResult> {
    return await connectorCredentialVault.validateCredential(tenantId, provider, token);
  }

  /**
   * Get token with auto-refresh
   */
  async getTokenWithAutoRefresh(
    tenantId: UUID,
    provider: string,
    token: string
  ): Promise<{ success: boolean; accessToken?: string; error?: string; requiresReconnect?: boolean }> {
    this.logger.info('Getting token with auto-refresh', { tenantId, provider });

    // Check if refresh is required
    const needsRefresh = await this.requiresRefresh(tenantId, provider, token);

    if (needsRefresh) {
      this.logger.info('Token requires refresh', { tenantId, provider });

      // Attempt refresh with retry
      const refreshResult = await safeRetryEngine.executeWithRetry(
        async () => {
          return await this.refreshToken(tenantId, provider, token);
        },
        {
          maxRetries: 3,
          tenantId,
          executionId: crypto.randomUUID() as UUID,
          traceId: crypto.randomUUID() as UUID,
          token,
        }
      );

      if (!refreshResult.success) {
        return {
          success: false,
          error: refreshResult.error instanceof Error ? refreshResult.error.message : 'Unknown error',
          requiresReconnect: false, // Will be determined by the refresh logic
        };
      }

      // Return new access token
      const tokenData = refreshResult.data as OAuthRefreshResult;
      return {
        success: true,
        accessToken: tokenData.token?.accessToken,
      };
    }

    // Return existing access token
    const credential = await connectorCredentialVault.retrieveCredential(tenantId, provider, token);

    if (!credential) {
      return {
        success: false,
        error: 'Credential not found',
        requiresReconnect: true,
      };
    }

    return {
      success: true,
      accessToken: credential.accessToken,
    };
  }

  /**
   * Rotate token (proactive refresh)
   */
  async rotateToken(tenantId: UUID, provider: string, token: string): Promise<OAuthRefreshResult> {
    this.logger.info('Rotating OAuth token', { tenantId, provider });

    return await this.refreshToken(tenantId, provider, token);
  }

  /**
   * Detect reconnect required
   */
  async detectReconnectRequired(tenantId: UUID, provider: string, token: string): Promise<boolean> {
    const validation = await this.validateTokenHealth(tenantId, provider, token);

    return !validation.valid && (validation.requiresReconnect === true);
  }

  /**
   * Handle refresh failure
   */
  async handleRefreshFailure(
    tenantId: UUID,
    provider: string,
    error: unknown,
    token: string
  ): Promise<void> {
    this.logger.error('Handling refresh failure', { tenantId, provider, error });

    const errorType = failureClassifier.getErrorType(error);

    // If error is permanent, mark as requiring reconnect
    if (errorType === ErrorType.AUTH || errorType === ErrorType.VALIDATION) {
      // TODO: Mark connector as unhealthy
      // TODO: Generate reconnect task
      this.logger.warn('Marking connector as requiring reconnect', { tenantId, provider });
    }
  }

  /**
   * Get token expiry time
   */
  async getTokenExpiry(tenantId: UUID, provider: string, token: string): Promise<Date | null> {
    const credential = await connectorCredentialVault.retrieveCredential(tenantId, provider, token);

    if (!credential || !credential.expiresAt) {
      return null;
    }

    return new Date(credential.expiresAt);
  }

  /**
   * Get token time to expiry (in seconds)
   */
  async getTimeToExpiry(tenantId: UUID, provider: string, token: string): Promise<number | null> {
    const expiry = await this.getTokenExpiry(tenantId, provider, token);

    if (!expiry) {
      return null;
    }

    const now = Date.now();
    const expiryTime = expiry.getTime();
    const timeToExpiry = Math.max(0, expiryTime - now);

    return Math.floor(timeToExpiry / 1000);
  }
}

/**
 * Singleton instance
 */
export const oauthLifecycleService = new OAuthLifecycleService();

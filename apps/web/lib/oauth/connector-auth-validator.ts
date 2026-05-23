/**
 * Connector Auth Validator
 * 
 * Canonical auth validator for CLAUX V1 connectors.
 * Validates credentials before execution, rejects invalid credentials gracefully, generates reconnect-required state, never crashes execution pipeline.
 * 
 * CRITICAL: This is the ONLY connector auth validator in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';
import { oauthLifecycleService } from './oauth-lifecycle.service';
import { connectorCredentialVault } from './connector-credential-vault';

/**
 * Auth validation result
 */
export interface AuthValidationResult {
  valid: boolean;
  accessToken?: string;
  error?: string;
  requiresReconnect?: boolean;
  requiresRefresh?: boolean;
}

/**
 * Connector auth validator
 */
export class ConnectorAuthValidator {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Validate credentials before execution
   */
  async validateCredentials(
    tenantId: UUID,
    provider: string,
    token: string
  ): Promise<AuthValidationResult> {
    this.logger.info('Validating connector credentials', { tenantId, provider });

    try {
      // Check if credential exists
      const credential = await connectorCredentialVault.retrieveCredential(tenantId, provider, token);

      if (!credential) {
        this.logger.warn('Credential not found', { tenantId, provider });
        return {
          valid: false,
          error: 'Credential not found',
          requiresReconnect: true,
        };
      }

      // Validate credential health
      const validation = await connectorCredentialVault.validateCredential(tenantId, provider, token);

      if (!validation.valid) {
        this.logger.warn('Credential validation failed', { tenantId, provider, error: validation.error });

        if (validation.requiresRefresh) {
          // Attempt refresh
          const refreshResult = await oauthLifecycleService.refreshToken(tenantId, provider, token);

          if (refreshResult.success) {
            this.logger.info('Token refreshed successfully', { tenantId, provider });
            return {
              valid: true,
              accessToken: refreshResult.token?.accessToken,
            };
          }

          this.logger.error('Token refresh failed', { tenantId, provider, error: refreshResult.error });
          return {
            valid: false,
            error: refreshResult.error,
            requiresReconnect: refreshResult.requiresReconnect,
          };
        }

        if (validation.requiresReconnect) {
          return {
            valid: false,
            error: validation.error,
            requiresReconnect: true,
          };
        }

        return {
          valid: false,
          error: validation.error,
        };
      }

      // Check if refresh is needed
      const needsRefresh = await oauthLifecycleService.requiresRefresh(tenantId, provider, token);

      if (needsRefresh) {
        this.logger.info('Token requires refresh', { tenantId, provider });

        const refreshResult = await oauthLifecycleService.refreshToken(tenantId, provider, token);

        if (refreshResult.success) {
          this.logger.info('Token refreshed successfully', { tenantId, provider });
          return {
            valid: true,
            accessToken: refreshResult.token?.accessToken,
          };
        }

        this.logger.error('Token refresh failed', { tenantId, provider, error: refreshResult.error });
        return {
          valid: false,
          error: refreshResult.error,
          requiresReconnect: refreshResult.requiresReconnect,
        };
      }

      // Credential is valid
      this.logger.info('Credentials validated successfully', { tenantId, provider });
      return {
        valid: true,
        accessToken: credential.accessToken,
      };
    } catch (error) {
      this.logger.error('Credential validation error', { tenantId, provider, error });
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        requiresReconnect: false,
      };
    }
  }

  /**
   * Get access token with auto-refresh
   */
  async getAccessToken(
    tenantId: UUID,
    provider: string,
    token: string
  ): Promise<AuthValidationResult> {
    this.logger.info('Getting access token with auto-refresh', { tenantId, provider });

    const result = await oauthLifecycleService.getTokenWithAutoRefresh(tenantId, provider, token);

    return {
      valid: result.success,
      accessToken: result.accessToken,
      error: result.error,
      requiresReconnect: result.requiresReconnect,
    };
  }

  /**
   * Check if reconnect is required
   */
  async isReconnectRequired(tenantId: UUID, provider: string, token: string): Promise<boolean> {
    return await oauthLifecycleService.detectReconnectRequired(tenantId, provider, token);
  }

  /**
   * Mark connector as requiring reconnect
   */
  async markReconnectRequired(tenantId: UUID, provider: string, token: string): Promise<void> {
    this.logger.warn('Marking connector as requiring reconnect', { tenantId, provider });

    // TODO: Store reconnect state in database
    // TODO: Generate Command Centre task
    // TODO: Show warning in dashboard
  }

  /**
   * Validate connector health
   */
  async validateConnectorHealth(tenantId: UUID, provider: string, token: string): Promise<{
    healthy: boolean;
    lastValidAuth?: string;
    requiresReconnect: boolean;
    requiresRefresh: boolean;
  }> {
    this.logger.info('Validating connector health', { tenantId, provider });

    const validation = await this.validateCredentials(tenantId, provider, token);

    const credential = await connectorCredentialVault.retrieveCredential(tenantId, provider, token);

    return {
      healthy: validation.valid,
      lastValidAuth: credential?.updatedAt,
      requiresReconnect: validation.requiresReconnect === true,
      requiresRefresh: validation.requiresRefresh === true,
    };
  }
}

/**
 * Singleton instance
 */
export const connectorAuthValidator = new ConnectorAuthValidator();

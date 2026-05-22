/**
 * Canonical Credential Injection Authority
 * 
 * This is the sole authority for credential injection in CLAUX.
 * Runtime connectors MUST retrieve credentials through this authority.
 * 
 * CRITICAL: No connector may retrieve credentials directly.
 * This authority enforces tenant isolation and credential security.
 */

import type { UUID } from '../types/common.types';
import { getTenantIntegrations, decryptSecret } from '@/lib/integrations/utils';
import { CredentialInjectionError } from '../contracts/provider-error.contract';

/**
 * Provider credential interface
 */
export interface ProviderCredential {
  readonly apiKey?: string;
  readonly accessToken?: string;
  readonly username?: string;
  readonly password?: string;
  readonly [key: string]: string | undefined;
}

/**
 * Credential injection result
 */
export interface CredentialInjectionResult {
  readonly credentials: ProviderCredential;
  readonly provider: string;
  readonly tenantId: UUID;
}

/**
 * Canonical Credential Injection Authority
 * Sole authority for credential injection
 */
export class CredentialInjectionAuthority {
  /**
   * Inject credentials for a provider
   * CRITICAL: This is the ONLY method that may inject credentials
   */
  async injectCredentials(
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    provider: string
  ): Promise<CredentialInjectionResult> {
    // Validate tenantId
    if (!tenantId) {
      throw new CredentialInjectionError(
        'Tenant ID is required for credential injection',
        tenantId,
        executionId,
        taskId,
        provider,
        'injectCredentials'
      );
    }

    // Retrieve tenant integrations
    const integrations = await getTenantIntegrations(tenantId);
    
    if (!integrations) {
      throw new CredentialInjectionError(
        `No integrations found for tenant ${tenantId}`,
        tenantId,
        executionId,
        taskId,
        provider,
        'injectCredentials'
      );
    }

    // Extract and decrypt credentials based on provider
    const credentials = await this.extractCredentials(integrations, provider, tenantId, executionId, taskId);

    return {
      credentials,
      provider,
      tenantId,
    };
  }

  /**
   * Extract credentials from integrations based on provider
   */
  private async extractCredentials(
    integrations: Record<string, unknown>,
    provider: string,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID
  ): Promise<ProviderCredential> {
    switch (provider) {
      case 'openai':
        return this.extractOpenAICredentials(integrations, tenantId, executionId, taskId);
      
      case 'dataforseo':
        return this.extractDataForSEOCredentials(integrations, tenantId, executionId, taskId);
      
      case 'wordpress':
        return this.extractWordPressCredentials(integrations, tenantId, executionId, taskId);
      
      case 'google-search-console':
        return this.extractGoogleSearchConsoleCredentials(integrations, tenantId, executionId, taskId);
      
      case 'google-analytics':
        return this.extractGoogleAnalyticsCredentials(integrations, tenantId, executionId, taskId);
      
      case 'google-business-profile':
        return this.extractGoogleBusinessProfileCredentials(integrations, tenantId, executionId, taskId);
      
      case 'custom-api':
        return this.extractCustomAPICredentials(integrations, tenantId, executionId, taskId);
      
      default:
        throw new CredentialInjectionError(
          `Unknown provider: ${provider}`,
          tenantId,
          executionId,
          taskId,
          provider,
          'extractCredentials'
        );
    }
  }

  /**
   * Extract OpenAI credentials
   */
  private async extractOpenAICredentials(
    integrations: Record<string, unknown>,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID
  ): Promise<ProviderCredential> {
    const apiKey = integrations.openai_api_key as string | undefined;
    
    if (!apiKey) {
      throw new CredentialInjectionError(
        'OpenAI API key not found in integrations',
        tenantId,
        executionId,
        taskId,
        'openai',
        'extractOpenAICredentials'
      );
    }

    try {
      const decryptedApiKey = decryptSecret(apiKey);
      
      return {
        apiKey: decryptedApiKey,
      };
    } catch (error) {
      throw new CredentialInjectionError(
        'Failed to decrypt OpenAI API key',
        tenantId,
        executionId,
        taskId,
        'openai',
        'extractOpenAICredentials',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Extract DataForSEO credentials
   */
  private async extractDataForSEOCredentials(
    integrations: Record<string, unknown>,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID
  ): Promise<ProviderCredential> {
    const apiKey = integrations.dataforseo_api_key as string | undefined;
    
    if (!apiKey) {
      throw new CredentialInjectionError(
        'DataForSEO API key not found in integrations',
        tenantId,
        executionId,
        taskId,
        'dataforseo',
        'extractDataForSEOCredentials'
      );
    }

    try {
      const decryptedApiKey = decryptSecret(apiKey);
      
      return {
        apiKey: decryptedApiKey,
      };
    } catch (error) {
      throw new CredentialInjectionError(
        'Failed to decrypt DataForSEO API key',
        tenantId,
        executionId,
        taskId,
        'dataforseo',
        'extractDataForSEOCredentials',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Extract WordPress credentials
   */
  private async extractWordPressCredentials(
    integrations: Record<string, unknown>,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID
  ): Promise<ProviderCredential> {
    const username = integrations.wordpress_username as string | undefined;
    const password = integrations.wordpress_application_password as string | undefined;
    
    if (!username || !password) {
      throw new CredentialInjectionError(
        'WordPress credentials not found in integrations',
        tenantId,
        executionId,
        taskId,
        'wordpress',
        'extractWordPressCredentials'
      );
    }

    try {
      const decryptedPassword = decryptSecret(password);
      
      return {
        username,
        password: decryptedPassword,
      };
    } catch (error) {
      throw new CredentialInjectionError(
        'Failed to decrypt WordPress password',
        tenantId,
        executionId,
        taskId,
        'wordpress',
        'extractWordPressCredentials',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Extract Google Search Console credentials
   */
  private async extractGoogleSearchConsoleCredentials(
    integrations: Record<string, unknown>,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID
  ): Promise<ProviderCredential> {
    const accessToken = integrations.google_access_token as string | undefined;
    
    if (!accessToken) {
      throw new CredentialInjectionError(
        'Google access token not found in integrations',
        tenantId,
        executionId,
        taskId,
        'google-search-console',
        'extractGoogleSearchConsoleCredentials'
      );
    }

    try {
      const decryptedAccessToken = decryptSecret(accessToken);
      
      return {
        accessToken: decryptedAccessToken,
      };
    } catch (error) {
      throw new CredentialInjectionError(
        'Failed to decrypt Google access token',
        tenantId,
        executionId,
        taskId,
        'google-search-console',
        'extractGoogleSearchConsoleCredentials',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Extract Google Analytics credentials
   */
  private async extractGoogleAnalyticsCredentials(
    integrations: Record<string, unknown>,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID
  ): Promise<ProviderCredential> {
    const accessToken = integrations.google_access_token as string | undefined;
    
    if (!accessToken) {
      throw new CredentialInjectionError(
        'Google access token not found in integrations',
        tenantId,
        executionId,
        taskId,
        'google-analytics',
        'extractGoogleAnalyticsCredentials'
      );
    }

    try {
      const decryptedAccessToken = decryptSecret(accessToken);
      
      return {
        accessToken: decryptedAccessToken,
      };
    } catch (error) {
      throw new CredentialInjectionError(
        'Failed to decrypt Google access token',
        tenantId,
        executionId,
        taskId,
        'google-analytics',
        'extractGoogleAnalyticsCredentials',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Extract Google Business Profile credentials
   */
  private async extractGoogleBusinessProfileCredentials(
    integrations: Record<string, unknown>,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID
  ): Promise<ProviderCredential> {
    const accessToken = integrations.google_access_token as string | undefined;
    
    if (!accessToken) {
      throw new CredentialInjectionError(
        'Google access token not found in integrations',
        tenantId,
        executionId,
        taskId,
        'google-business-profile',
        'extractGoogleBusinessProfileCredentials'
      );
    }

    try {
      const decryptedAccessToken = decryptSecret(accessToken);
      
      return {
        accessToken: decryptedAccessToken,
      };
    } catch (error) {
      throw new CredentialInjectionError(
        'Failed to decrypt Google access token',
        tenantId,
        executionId,
        taskId,
        'google-business-profile',
        'extractGoogleBusinessProfileCredentials',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Extract Custom API credentials
   */
  private async extractCustomAPICredentials(
    integrations: Record<string, unknown>,
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID
  ): Promise<ProviderCredential> {
    const apiKey = integrations.custom_api_key as string | undefined;
    const apiUrl = integrations.custom_api_url as string | undefined;
    
    if (!apiKey || !apiUrl) {
      throw new CredentialInjectionError(
        'Custom API credentials not found in integrations',
        tenantId,
        executionId,
        taskId,
        'custom-api',
        'extractCustomAPICredentials'
      );
    }

    try {
      const decryptedApiKey = decryptSecret(apiKey);
      
      return {
        apiKey: decryptedApiKey,
        apiUrl,
      };
    } catch (error) {
      throw new CredentialInjectionError(
        'Failed to decrypt Custom API key',
        tenantId,
        executionId,
        taskId,
        'custom-api',
        'extractCustomAPICredentials',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Sanitize credentials for logging
   * CRITICAL: Never log actual credentials
   */
  sanitizeCredentials(credentials: ProviderCredential): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(credentials)) {
      if (value) {
        sanitized[key] = this.maskCredential(value);
      }
    }
    
    return sanitized;
  }

  /**
   * Mask credential for logging
   */
  private maskCredential(credential: string): string {
    if (credential.length <= 8) {
      return '***';
    }
    
    return `${credential.substring(0, 4)}...${credential.substring(credential.length - 4)}`;
  }
}

/**
 * Singleton instance of CredentialInjectionAuthority
 * CRITICAL: There is only ONE credential injection authority in CLAUX
 */
export const credentialInjectionAuthority = new CredentialInjectionAuthority();

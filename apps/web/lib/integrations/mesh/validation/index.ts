/**
 * Validation Layer
 * 
 * Validate:
 * - integration requests
 * - provider credentials
 * - payload schemas
 * - rate limits
 * - tenant permissions
 */

import { IntegrationRequest } from '../callbacks';
import { ProviderConfig } from '../providers';
import { ProviderRegistry } from '../providers';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class IntegrationValidator {
  private providerRegistry: ProviderRegistry;

  constructor(providerRegistry: ProviderRegistry) {
    this.providerRegistry = providerRegistry;
  }

  /**
   * Validate integration request
   */
  validateRequest(request: IntegrationRequest): ValidationResult {
    // Check required fields
    if (!request.executionId || !request.tenantId || !request.provider || !request.action) {
      return {
        valid: false,
        error: 'Missing required fields',
      };
    }

    // Check provider exists
    const provider = this.providerRegistry.getProvider(request.provider);
    if (!provider) {
      return {
        valid: false,
        error: `Unknown provider: ${request.provider}`,
      };
    }

    // Check action exists
    const action = this.providerRegistry.getAction(request.provider, request.action);
    if (!action) {
      return {
        valid: false,
        error: `Unknown action: ${request.provider}:${request.action}`,
      };
    }

    return {
      valid: true,
    };
  }

  /**
   * Validate provider credentials
   */
  validateCredentials(provider: string, credentials: Record<string, string>): ValidationResult {
    const providerConfig = this.providerRegistry.getProvider(provider);
    if (!providerConfig) {
      return {
        valid: false,
        error: `Unknown provider: ${provider}`,
      };
    }

    for (const requiredCredential of providerConfig.requiredCredentials) {
      if (!credentials[requiredCredential]) {
        return {
          valid: false,
          error: `Missing credential: ${requiredCredential}`,
        };
      }
    }

    return {
      valid: true,
    };
  }

  /**
   * Validate payload schema
   */
  validatePayload(provider: string, action: string, payload: Record<string, unknown>): ValidationResult {
    // TODO: Implement schema validation
    // This would use a JSON schema validator
    return {
      valid: true,
    };
  }

  /**
   * Validate rate limit
   */
  validateRateLimit(provider: string, tenantId: string): ValidationResult {
    // TODO: Implement rate limit checking
    // This would check a rate limit store
    return {
      valid: true,
    };
  }

  /**
   * Validate tenant permissions
   */
  validateTenantPermissions(tenantId: string, provider: string, action: string): ValidationResult {
    // TODO: Implement tenant permission checking
    // This would check tenant permissions for provider/action
    return {
      valid: true,
    };
  }
}

/**
 * Create integration validator instance
 */
export function createIntegrationValidator(providerRegistry: ProviderRegistry): IntegrationValidator {
  return new IntegrationValidator(providerRegistry);
}

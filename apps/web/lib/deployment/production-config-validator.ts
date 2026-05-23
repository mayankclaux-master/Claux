/**
 * Production Config Validator
 * 
 * Validates production configuration:
 * - No localhost URLs in prod
 * - No test secrets in prod
 * - No mock mode enabled in prod
 * - No debug flags enabled in prod
 * - No unsafe feature flags enabled
 * - No staging connectors enabled in prod
 * - No development OAuth callbacks in prod
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Config validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: number;
}

/**
 * Production config validator
 */
export class ProductionConfigValidator {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Validate production configuration
   */
  validateProductionConfig(): ConfigValidationResult {
    this.logger.info('Validating production configuration');

    const result: ConfigValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      timestamp: Date.now(),
    };

    // Check for localhost URLs
    this.checkLocalhostUrls(result);

    // Check for test secrets
    this.checkTestSecrets(result);

    // Check for mock mode
    this.checkMockMode(result);

    // Check for debug flags
    this.checkDebugFlags(result);

    // Check for unsafe feature flags
    this.checkUnsafeFeatureFlags(result);

    // Check for staging connectors
    this.checkStagingConnectors(result);

    // Check for development OAuth callbacks
    this.checkDevelopmentOAuthCallbacks(result);

    result.isValid = result.errors.length === 0;

    this.logger.info('Production config validation completed', { result });

    return result;
  }

  /**
   * Check for localhost URLs
   */
  private checkLocalhostUrls(result: ConfigValidationResult): void {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (appUrl && (appUrl.includes('localhost') || appUrl.includes('127.0.0.1'))) {
      result.isValid = false;
      result.errors.push('NEXT_PUBLIC_APP_URL contains localhost or 127.0.0.1');
    }

    if (supabaseUrl && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'))) {
      result.isValid = false;
      result.errors.push('NEXT_PUBLIC_SUPABASE_URL contains localhost or 127.0.0.1');
    }
  }

  /**
   * Check for test secrets
   */
  private checkTestSecrets(result: ConfigValidationResult): void {
    const testSecretPatterns = [
      'test_',
      'dev_',
      'staging_',
      'mock_',
      'dummy_',
      'example_',
    ];

    const envVars = [
      'DATAFORSEO_API_KEY',
      'SERPAPI_API_KEY',
      'OPENAI_API_KEY',
      'CLERK_SECRET_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    envVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        testSecretPatterns.forEach(pattern => {
          if (value.toLowerCase().includes(pattern)) {
            result.isValid = false;
            result.errors.push(`${envVar} appears to be a test secret (contains "${pattern}")`);
          }
        });
      }
    });
  }

  /**
   * Check for mock mode
   */
  private checkMockMode(result: ConfigValidationResult): void {
    const mockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE;

    if (mockMode === 'true' || mockMode === '1') {
      result.isValid = false;
      result.errors.push('NEXT_PUBLIC_ENABLE_MOCK_MODE is enabled in production');
    }
  }

  /**
   * Check for debug flags
   */
  private checkDebugFlags(result: ConfigValidationResult): void {
    const debugMode = process.env.NEXT_PUBLIC_ENABLE_DEBUG;
    const nodeEnv = process.env.NODE_ENV;

    if (debugMode === 'true' || debugMode === '1') {
      result.warnings.push('NEXT_PUBLIC_ENABLE_DEBUG is enabled in production');
    }

    if (nodeEnv !== 'production') {
      result.isValid = false;
      result.errors.push(`NODE_ENV is set to "${nodeEnv}" instead of "production"`);
    }
  }

  /**
   * Check for unsafe feature flags
   */
  private checkUnsafeFeatureFlags(result: ConfigValidationResult): void {
    // Check for feature flags that should not be enabled in production
    const unsafeFlags = [
      'NEXT_PUBLIC_ENABLE_BETA_FEATURES',
      'NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES',
      'NEXT_PUBLIC_ENABLE_UNSTABLE_FEATURES',
    ];

    unsafeFlags.forEach(flag => {
      const value = process.env[flag];
      if (value === 'true' || value === '1') {
        result.warnings.push(`${flag} is enabled in production - review before deployment`);
      }
    });
  }

  /**
   * Check for staging connectors
   */
  private checkStagingConnectors(result: ConfigValidationResult): void {
    // Check if connector URLs point to staging endpoints
    const connectorUrls = [
      process.env.DATAFORSEO_API_URL,
      process.env.SERPAPI_API_URL,
    ];

    connectorUrls.forEach(url => {
      if (url && (url.includes('staging') || url.includes('test'))) {
        result.isValid = false;
        result.errors.push('Connector API URL points to staging or test environment');
      }
    });
  }

  /**
   * Check for development OAuth callbacks
   */
  private checkDevelopmentOAuthCallbacks(result: ConfigValidationResult): void {
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    // Check if Clerk key is for development
    if (clerkPublishableKey && clerkPublishableKey.includes('test_')) {
      result.isValid = false;
      result.errors.push('Clerk publishable key appears to be for development environment');
    }

    // Check OAuth callback URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && (appUrl.includes('localhost') || appUrl.includes('127.0.0.1'))) {
      result.isValid = false;
      result.errors.push('OAuth callback URL points to localhost');
    }
  }

  /**
   * Generate validation report
   */
  generateValidationReport(result: ConfigValidationResult): string {
    let report = '=== Production Config Validation Report ===\n';
    report += `Status: ${result.isValid ? 'VALID' : 'INVALID'}\n`;
    report += `Timestamp: ${new Date(result.timestamp).toISOString()}\n\n`;

    if (result.errors.length > 0) {
      report += '--- Errors ---\n';
      result.errors.forEach(error => {
        report += `✗ ${error}\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += '\n--- Warnings ---\n';
      result.warnings.forEach(warning => {
        report += `⚠ ${warning}\n`;
      });
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      report += '\nAll configuration checks passed.\n';
    }

    return report;
  }

  /**
   * Require valid production config
   */
  requireValidProductionConfig(): void {
    const result = this.validateProductionConfig();

    if (!result.isValid) {
      const error = new Error('Production configuration validation failed');
      this.logger.error('Production config validation failed', { result });
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
export const productionConfigValidator = new ProductionConfigValidator();

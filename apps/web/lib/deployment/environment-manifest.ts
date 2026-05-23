/**
 * Environment Manifest System
 * 
 * Canonical required environment variable list with classification:
 * - required: Must be present in all environments
 * - optional: Nice to have, but not blocking
 * - production-only: Only required in production
 * - staging-only: Only required in staging
 * 
 * Validates Vercel envs, Supabase envs, OAuth envs, connector envs.
 * Fails boot safely if invalid, generates readable diagnostics.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Environment variable classification
 */
export enum EnvClassification {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
  PRODUCTION_ONLY = 'production_only',
  STAGING_ONLY = 'staging_only',
}

/**
 * Environment variable category
 */
export enum EnvCategory {
  VERCEL = 'vercel',
  SUPABASE = 'supabase',
  OAUTH = 'oauth',
  CONNECTOR = 'connector',
  APP = 'app',
}

/**
 * Environment variable definition
 */
export interface EnvVarDefinition {
  name: string;
  classification: EnvClassification;
  category: EnvCategory;
  description: string;
  defaultValue?: string;
  validation?: (value: string) => boolean;
}

/**
 * Environment validation result
 */
export interface EnvValidationResult {
  isValid: boolean;
  missing: EnvVarDefinition[];
  invalid: { def: EnvVarDefinition; value: string }[];
  warnings: string[];
  diagnostics: string[];
}

/**
 * Environment manifest
 */
export class EnvironmentManifest {
  private logger: Logger;
  private envVars: EnvVarDefinition[] = [];

  constructor() {
    this.logger = createLogger();
    this.initializeEnvVars();
  }

  /**
   * Initialize environment variable definitions
   */
  private initializeEnvVars(): void {
    // Vercel environment variables
    this.envVars.push(
      {
        name: 'NEXT_PUBLIC_APP_URL',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.VERCEL,
        description: 'Public application URL',
        validation: (value) => value.startsWith('http'),
      },
      {
        name: 'NODE_ENV',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.VERCEL,
        description: 'Node environment (development, staging, production)',
        validation: (value) => ['development', 'staging', 'production'].includes(value),
      }
    );

    // Supabase environment variables
    this.envVars.push(
      {
        name: 'NEXT_PUBLIC_SUPABASE_URL',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.SUPABASE,
        description: 'Supabase project URL',
        validation: (value) => value.startsWith('https://'),
      },
      {
        name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.SUPABASE,
        description: 'Supabase anonymous key',
        validation: (value) => value.length > 20,
      },
      {
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.SUPABASE,
        description: 'Supabase service role key (server-side)',
        validation: (value) => value.length > 20,
      }
    );

    // OAuth environment variables (Clerk)
    this.envVars.push(
      {
        name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.OAUTH,
        description: 'Clerk publishable key',
        validation: (value) => value.startsWith('pk_'),
      },
      {
        name: 'CLERK_SECRET_KEY',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.OAUTH,
        description: 'Clerk secret key',
        validation: (value) => value.startsWith('sk_'),
      }
    );

    // Connector environment variables
    this.envVars.push(
      {
        name: 'DATAFORSEO_API_KEY',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.CONNECTOR,
        description: 'DataForSEO API key',
        validation: (value) => value.length > 10,
      },
      {
        name: 'SERPAPI_API_KEY',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.CONNECTOR,
        description: 'SerpAPI API key',
        validation: (value) => value.length > 10,
      },
      {
        name: 'OPENAI_API_KEY',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.CONNECTOR,
        description: 'OpenAI API key',
        validation: (value) => value.startsWith('sk-'),
      }
    );

    // App environment variables
    this.envVars.push(
      {
        name: 'NEXT_PUBLIC_APP_NAME',
        classification: EnvClassification.REQUIRED,
        category: EnvCategory.APP,
        description: 'Application name',
        defaultValue: 'CLAUX',
      },
      {
        name: 'NEXT_PUBLIC_ENABLE_MOCK_MODE',
        classification: EnvClassification.OPTIONAL,
        category: EnvCategory.APP,
        description: 'Enable mock mode for testing',
        defaultValue: 'false',
      },
      {
        name: 'NEXT_PUBLIC_ENABLE_DEBUG',
        classification: EnvClassification.OPTIONAL,
        category: EnvCategory.APP,
        description: 'Enable debug logging',
        defaultValue: 'false',
      }
    );

    // Production-only environment variables
    this.envVars.push(
      {
        name: 'PRODUCTION_DOMAIN',
        classification: EnvClassification.PRODUCTION_ONLY,
        category: EnvCategory.VERCEL,
        description: 'Production domain name',
        validation: (value) => value.includes('.'),
      },
      {
        name: 'PRODUCTION_WEBHOOK_SECRET',
        classification: EnvClassification.PRODUCTION_ONLY,
        category: EnvCategory.APP,
        description: 'Webhook secret for production',
        validation: (value) => value.length > 20,
      }
    );

    // Staging-only environment variables
    this.envVars.push(
      {
        name: 'STAGING_DOMAIN',
        classification: EnvClassification.STAGING_ONLY,
        category: EnvCategory.VERCEL,
        description: 'Staging domain name',
        validation: (value) => value.includes('.'),
      }
    );
  }

  /**
   * Validate environment variables
   */
  validate(environment: 'development' | 'staging' | 'production' = 'development'): EnvValidationResult {
    const result: EnvValidationResult = {
      isValid: true,
      missing: [],
      invalid: [],
      warnings: [],
      diagnostics: [],
    };

    const nodeEnv = process.env.NODE_ENV || 'development';
    result.diagnostics.push(`Validating environment: ${nodeEnv}`);
    result.diagnostics.push(`Target environment: ${environment}`);

    this.envVars.forEach((envVar) => {
      // Skip if classification doesn't match environment
      if (envVar.classification === EnvClassification.PRODUCTION_ONLY && environment !== 'production') {
        return;
      }
      if (envVar.classification === EnvClassification.STAGING_ONLY && environment !== 'staging') {
        return;
      }

      const value = process.env[envVar.name];

      // Check if missing
      if (!value) {
        if (envVar.classification === EnvClassification.REQUIRED) {
          result.missing.push(envVar);
          result.isValid = false;
          result.diagnostics.push(`MISSING (required): ${envVar.name} - ${envVar.description}`);
        } else {
          result.warnings.push(`Optional env not set: ${envVar.name}`);
          result.diagnostics.push(`OPTIONAL (not set): ${envVar.name} - ${envVar.description}`);
        }
        return;
      }

      // Validate value if validation function exists
      if (envVar.validation && !envVar.validation(value)) {
        result.invalid.push({ def: envVar, value });
        result.isValid = false;
        result.diagnostics.push(`INVALID: ${envVar.name} has invalid value`);
      } else {
        result.diagnostics.push(`VALID: ${envVar.name}`);
      }
    });

    // Check for unexpected localhost URLs in production
    if (environment === 'production') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl && appUrl.includes('localhost')) {
        result.isValid = false;
        result.diagnostics.push('CRITICAL: localhost URL detected in production environment');
      }
    }

    // Check for mock mode in production
    if (environment === 'production') {
      const mockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE;
      if (mockMode === 'true') {
        result.isValid = false;
        result.diagnostics.push('CRITICAL: mock mode enabled in production environment');
      }
    }

    // Check for debug mode in production
    if (environment === 'production') {
      const debugMode = process.env.NEXT_PUBLIC_ENABLE_DEBUG;
      if (debugMode === 'true') {
        result.warnings.push('Debug mode enabled in production environment');
      }
    }

    this.logger.info('Environment validation completed', { result });

    return result;
  }

  /**
   * Get all environment variable definitions
   */
  getEnvVarDefinitions(): EnvVarDefinition[] {
    return [...this.envVars];
  }

  /**
   * Get environment variables by category
   */
  getEnvVarsByCategory(category: EnvCategory): EnvVarDefinition[] {
    return this.envVars.filter(env => env.category === category);
  }

  /**
   * Get environment variables by classification
   */
  getEnvVarsByClassification(classification: EnvClassification): EnvVarDefinition[] {
    return this.envVars.filter(env => env.classification === classification);
  }

  /**
   * Generate environment diagnostics report
   */
  generateDiagnosticsReport(environment: 'development' | 'staging' | 'production' = 'development'): string {
    const result = this.validate(environment);
    
    let report = '=== Environment Diagnostics Report ===\n';
    report += `Environment: ${environment}\n`;
    report += `Status: ${result.isValid ? 'VALID' : 'INVALID'}\n\n`;
    
    report += '--- Diagnostics ---\n';
    result.diagnostics.forEach(d => {
      report += `${d}\n`;
    });
    
    if (result.missing.length > 0) {
      report += '\n--- Missing Required Variables ---\n';
      result.missing.forEach(m => {
        report += `${m.name}: ${m.description}\n`;
      });
    }
    
    if (result.invalid.length > 0) {
      report += '\n--- Invalid Variables ---\n';
      result.invalid.forEach(i => {
        report += `${i.def.name}: ${i.value}\n`;
      });
    }
    
    if (result.warnings.length > 0) {
      report += '\n--- Warnings ---\n';
      result.warnings.forEach(w => {
        report += `${w}\n`;
      });
    }
    
    return report;
  }

  /**
   * Fail boot safely if environment is invalid
   */
  requireValidEnvironment(environment: 'development' | 'staging' | 'production' = 'development'): void {
    const result = this.validate(environment);
    
    if (!result.isValid) {
      const error = new Error('Environment validation failed');
      this.logger.error('Environment validation failed, boot halted', { result });
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
export const environmentManifest = new EnvironmentManifest();

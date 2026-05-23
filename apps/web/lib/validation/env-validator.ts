/**
 * Environment Validation System
 * 
 * Startup validation for CLAUX V1.
 * Fails boot if secrets missing, validates API keys, validates Supabase env, validates Vercel env.
 * 
 * CRITICAL: This is the ONLY environment validation system in CLAUX.
 */

/**
 * Environment validation result
 */
export interface EnvValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'VERCEL_ENV',
] as const;

/**
 * Validate environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check recommended environment variables
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar]) {
      warnings.push(`Missing recommended environment variable: ${envVar}`);
    }
  }

  // Validate Clerk keys
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
      errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_');
    }
  }

  if (process.env.CLERK_SECRET_KEY) {
    if (!process.env.CLERK_SECRET_KEY.startsWith('sk_')) {
      errors.push('CLERK_SECRET_KEY must start with sk_');
    }
  }

  // Validate Supabase URL
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
    }
  }

  // Validate Supabase keys
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 20) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
    }
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY.length < 20) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)');
    }
  }

  // Validate API keys (if present)
  if (process.env.OPENAI_API_KEY) {
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      errors.push('OPENAI_API_KEY must start with sk-');
    }
  }

  if (process.env.DATAFORSEO_API_KEY) {
    if (process.env.DATAFORSEO_API_KEY.length < 10) {
      errors.push('DATAFORSEO_API_KEY appears to be invalid (too short)');
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and throw on error
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();
  
  if (!result.success) {
    throw new Error(`Environment validation failed:\n${result.errors.join('\n')}`);
  }

  if (result.warnings.length > 0) {
    console.warn(`Environment validation warnings:\n${result.warnings.join('\n')}`);
  }
}

/**
 * Get typed environment variable
 */
export function getEnvVar<T extends string = string>(key: string): T | undefined {
  return process.env[key] as T | undefined;
}

/**
 * Get required environment variable or throw
 */
export function getRequiredEnvVar<T extends string = string>(key: string): T {
  const value = process.env[key] as T | undefined;
  
  if (!value) {
    throw new Error(`Required environment variable missing: ${key}`);
  }
  
  return value;
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL;
}

/**
 * Get Vercel environment
 */
export function getVercelEnv(): string | undefined {
  return process.env.VERCEL_ENV;
}

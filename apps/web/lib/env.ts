/**
 * Centralized environment variable validation
 * Fails fast on boot if critical variables are missing
 */

function getEnvVar(key: string, required: true): string;
function getEnvVar(key: string, required: false): string | undefined;
function getEnvVar(key: string, required: boolean): string | undefined {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Required environment variables (needed for app to function)
export const env = {
  // Application URL - validated at runtime by getAppUrl()
  NEXT_PUBLIC_APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL', false),
  
  // Legacy: NEXT_PUBLIC_SITE_URL (deprecated, use NEXT_PUBLIC_APP_URL instead)
  NEXT_PUBLIC_SITE_URL: getEnvVar('NEXT_PUBLIC_SITE_URL', false),
  
  // Supabase - required for all database operations
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', true),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', true),
  
  // Clerk - required for authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', true),
  CLERK_SECRET_KEY: getEnvVar('CLERK_SECRET_KEY', true),
  CLERK_WEBHOOK_SECRET: getEnvVar('CLERK_WEBHOOK_SECRET', true),
  
  // Integration encryption - optional (only needed for token storage)
  INTEGRATION_ENCRYPTION_KEY: getEnvVar('INTEGRATION_ENCRYPTION_KEY', false),
  
  // Google OAuth - optional (only needed for Google integration feature)
  GOOGLE_OAUTH_CLIENT_ID: getEnvVar('GOOGLE_OAUTH_CLIENT_ID', false),
  GOOGLE_OAUTH_CLIENT_SECRET: getEnvVar('GOOGLE_OAUTH_CLIENT_SECRET', false),
  
  // Optional APIs
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY', false),
  DATAFORSEO_API_KEY: getEnvVar('DATAFORSEO_API_KEY', false),
  SERP_API_KEY: getEnvVar('SERP_API_KEY', false),
  N8N_HOST: getEnvVar('N8N_HOST', false),
} as const;

export type Env = typeof env;

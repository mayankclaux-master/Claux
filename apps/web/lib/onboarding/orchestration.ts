/**
 * Tenant Onboarding Orchestration
 * 
 * Orchestrates the complete tenant onboarding flow
 */

import { validateTenantOnboarding, validateGCSCredentials, validateSitemapUrl, validateWebsiteAccessibility, type TenantOnboardingData, type GCSCredentials } from './validation';
import { ingestTenantOnboarding, updateTenantOnboarding, type IngestionResult } from './ingestion';
import { storeCredential } from './credentials';

export interface OnboardingConfig {
  userId: string;
  data: TenantOnboardingData;
  gscCredentials?: GCSCredentials;
  sitemapUrl?: string;
  validateWebsite?: boolean;
}

export interface OnboardingResult {
  success: boolean;
  tenant_id?: string | undefined;
  workspace_id?: string | undefined;
  validation_errors: string[];
  validation_warnings: string[];
  ingestion_errors: string[];
  steps_completed: string[];
}

/**
 * Orchestrate complete tenant onboarding
 */
export async function orchestrateOnboarding(config: OnboardingConfig): Promise<OnboardingResult> {
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  const ingestionErrors: string[] = [];
  const stepsCompleted: string[] = [];

  // Step 1: Validate tenant onboarding data
  stepsCompleted.push('validate_tenant_data');
  const tenantValidation = validateTenantOnboarding(config.data);
  validationErrors.push(...tenantValidation.errors);
  validationWarnings.push(...tenantValidation.warnings);

  if (!tenantValidation.valid) {
    return {
      success: false,
      validation_errors: validationErrors,
      validation_warnings: validationWarnings,
      ingestion_errors: [],
      steps_completed: stepsCompleted,
    };
  }

  // Step 2: Validate GSC credentials if provided
  if (config.gscCredentials) {
    stepsCompleted.push('validate_gsc_credentials');
    const gscValidation = validateGCSCredentials(config.gscCredentials);
    validationErrors.push(...gscValidation.errors);
    validationWarnings.push(...gscValidation.warnings);
  }

  // Step 3: Validate sitemap URL if provided
  if (config.sitemapUrl) {
    stepsCompleted.push('validate_sitemap_url');
    const sitemapValidation = validateSitemapUrl(config.sitemapUrl);
    validationErrors.push(...sitemapValidation.errors);
    validationWarnings.push(...sitemapValidation.warnings);
  }

  // Step 4: Validate website accessibility if requested
  if (config.validateWebsite) {
    stepsCompleted.push('validate_website_accessibility');
    const websiteValidation = await validateWebsiteAccessibility(config.data.website_url);
    validationErrors.push(...websiteValidation.errors);
    validationWarnings.push(...websiteValidation.warnings);
  }

  // Step 5: Ingest tenant data
  stepsCompleted.push('ingest_tenant_data');
  const ingestionResult = await ingestTenantOnboarding(
    config.userId,
    config.data,
    config.gscCredentials
  );

  if (!ingestionResult.success) {
    ingestionErrors.push(...ingestionResult.errors);
    return {
      success: false,
      tenant_id: ingestionResult.tenant_id,
      workspace_id: ingestionResult.workspace_id,
      validation_errors: validationErrors,
      validation_warnings: validationWarnings,
      ingestion_errors: ingestionErrors,
      steps_completed: stepsCompleted,
    };
  }

  // Step 6: Store credentials securely
  if (config.gscCredentials) {
    stepsCompleted.push('store_gsc_credentials');
    const credentialResult = await storeCredential(
      ingestionResult.tenant_id!,
      ingestionResult.workspace_id!,
      'gsc',
      {
        site_url: config.gscCredentials.site_url,
        property_id: config.gscCredentials.property_id,
        api_key: config.gscCredentials.api_key,
      }
    );

    if (!credentialResult.success) {
      validationWarnings.push(`Failed to store GSC credentials: ${credentialResult.error}`);
    }
  }

  // Step 7: Store sitemap URL if provided
  if (config.sitemapUrl) {
    stepsCompleted.push('store_sitemap_url');
    const sitemapResult = await storeCredential(
      ingestionResult.tenant_id!,
      ingestionResult.workspace_id!,
      'custom',
      {
        sitemap_url: config.sitemapUrl,
      },
      false
    );

    if (!sitemapResult.success) {
      validationWarnings.push(`Failed to store sitemap URL: ${sitemapResult.error}`);
    }
  }

  return {
    success: true,
    tenant_id: ingestionResult.tenant_id,
    workspace_id: ingestionResult.workspace_id,
    validation_errors: validationErrors,
    validation_warnings: validationWarnings,
    ingestion_errors: ingestionErrors,
    steps_completed: stepsCompleted,
  };
}

/**
 * Update existing tenant onboarding
 */
export async function updateOnboarding(
  tenantId: string,
  workspaceId: string,
  data: Partial<TenantOnboardingData>,
  gscCredentials?: GCSCredentials,
  sitemapUrl?: string
): Promise<OnboardingResult> {
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  const ingestionErrors: string[] = [];
  const stepsCompleted: string[] = [];

  // Validate partial data
  if (data.tenant_name || data.workspace_name || data.website_url || data.business_category) {
    stepsCompleted.push('validate_tenant_data');
    const fullData: TenantOnboardingData = {
      tenant_name: data.tenant_name || '',
      workspace_name: data.workspace_name || '',
      website_url: data.website_url || '',
      business_category: data.business_category || '',
      brand_voice: data.brand_voice,
      publishing_preferences: data.publishing_preferences ? {
        frequency: data.publishing_preferences.frequency,
        tone: data.publishing_preferences.tone,
        target_audience: data.publishing_preferences.target_audience,
      } : undefined,
    };
    const tenantValidation = validateTenantOnboarding(fullData);
    validationErrors.push(...tenantValidation.errors);
    validationWarnings.push(...tenantValidation.warnings);
  }

  // Validate GSC credentials if provided
  if (gscCredentials) {
    stepsCompleted.push('validate_gsc_credentials');
    const gscValidation = validateGCSCredentials(gscCredentials);
    validationErrors.push(...gscValidation.errors);
    validationWarnings.push(...gscValidation.warnings);
  }

  // Update tenant data
  stepsCompleted.push('update_tenant_data');
  const updateResult = await updateTenantOnboarding(tenantId, workspaceId, data, gscCredentials);

  if (!updateResult.success) {
    ingestionErrors.push(...updateResult.errors);
    return {
      success: false,
      tenant_id: tenantId,
      workspace_id: workspaceId,
      validation_errors: validationErrors,
      validation_warnings: validationWarnings,
      ingestion_errors: ingestionErrors,
      steps_completed: stepsCompleted,
    };
  }

  // Update GSC credentials if provided
  if (gscCredentials) {
    stepsCompleted.push('update_gsc_credentials');
    const credentialResult = await storeCredential(
      tenantId,
      workspaceId,
      'gsc',
      {
        site_url: gscCredentials.site_url,
        property_id: gscCredentials.property_id,
        api_key: gscCredentials.api_key,
      }
    );

    if (!credentialResult.success) {
      validationWarnings.push(`Failed to update GSC credentials: ${credentialResult.error}`);
    }
  }

  // Update sitemap URL if provided
  if (sitemapUrl) {
    stepsCompleted.push('update_sitemap_url');
    const sitemapValidation = validateSitemapUrl(sitemapUrl);
    validationErrors.push(...sitemapValidation.errors);
    validationWarnings.push(...sitemapValidation.warnings);

    if (sitemapValidation.valid) {
      const sitemapResult = await storeCredential(
        tenantId,
        workspaceId,
        'custom',
        {
          sitemap_url: sitemapUrl,
        },
        false
      );

      if (!sitemapResult.success) {
        validationWarnings.push(`Failed to update sitemap URL: ${sitemapResult.error}`);
      }
    }
  }

  return {
    success: true,
    tenant_id: tenantId,
    workspace_id: workspaceId,
    validation_errors: validationErrors,
    validation_warnings: validationWarnings,
    ingestion_errors: ingestionErrors,
    steps_completed: stepsCompleted,
  };
}

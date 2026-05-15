/**
 * Tenant Onboarding Validation
 * 
 * Validates tenant onboarding data and credentials
 */

export interface TenantValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TenantOnboardingData {
  tenant_name: string;
  workspace_name: string;
  website_url: string;
  business_category: string;
  brand_voice?: string | undefined;
  publishing_preferences?: {
    frequency?: 'daily' | 'weekly' | 'biweekly' | undefined;
    tone?: 'professional' | 'casual' | 'formal' | undefined;
    target_audience?: string | undefined;
  };
}

export interface GCSCredentials {
  site_url: string;
  property_id: string;
  api_key?: string;
}

/**
 * Validate tenant onboarding data
 */
export function validateTenantOnboarding(data: TenantOnboardingData): TenantValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate tenant name
  if (!data.tenant_name || data.tenant_name.trim().length === 0) {
    errors.push('Tenant name is required');
  } else if (data.tenant_name.length > 100) {
    errors.push('Tenant name must be less than 100 characters');
  }

  // Validate workspace name
  if (!data.workspace_name || data.workspace_name.trim().length === 0) {
    errors.push('Workspace name is required');
  } else if (data.workspace_name.length > 100) {
    errors.push('Workspace name must be less than 100 characters');
  }

  // Validate website URL
  if (!data.website_url || data.website_url.trim().length === 0) {
    errors.push('Website URL is required');
  } else {
    try {
      const url = new URL(data.website_url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('Website URL must use HTTP or HTTPS protocol');
      }
    } catch {
      errors.push('Website URL is invalid');
    }
  }

  // Validate business category
  if (!data.business_category || data.business_category.trim().length === 0) {
    errors.push('Business category is required');
  }

  // Validate brand voice (optional)
  if (data.brand_voice && data.brand_voice.length > 500) {
    warnings.push('Brand voice is very long, consider shortening');
  }

  // Validate publishing preferences (optional)
  if (data.publishing_preferences) {
    const validFrequencies = ['daily', 'weekly', 'biweekly'];
    if (data.publishing_preferences.frequency && !validFrequencies.includes(data.publishing_preferences.frequency)) {
      errors.push('Invalid publishing frequency');
    }

    const validTones = ['professional', 'casual', 'formal'];
    if (data.publishing_preferences.tone && !validTones.includes(data.publishing_preferences.tone)) {
      errors.push('Invalid publishing tone');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate GSC credentials
 */
export function validateGCSCredentials(credentials: GCSCredentials): TenantValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate site URL
  if (!credentials.site_url || credentials.site_url.trim().length === 0) {
    errors.push('GSC site URL is required');
  } else {
    try {
      const url = new URL(credentials.site_url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('GSC site URL must use HTTP or HTTPS protocol');
      }
    } catch {
      errors.push('GSC site URL is invalid');
    }
  }

  // Validate property ID
  if (!credentials.property_id || credentials.property_id.trim().length === 0) {
    warnings.push('GSC property ID is recommended but not required');
  }

  // Validate API key (optional)
  if (!credentials.api_key) {
    warnings.push('GSC API key is recommended for full functionality');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate sitemap URL
 */
export function validateSitemapUrl(sitemapUrl: string): TenantValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sitemapUrl || sitemapUrl.trim().length === 0) {
    errors.push('Sitemap URL is required');
  } else {
    try {
      const url = new URL(sitemapUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('Sitemap URL must use HTTP or HTTPS protocol');
      }
      if (!sitemapUrl.includes('sitemap')) {
        warnings.push('URL does not appear to be a sitemap');
      }
    } catch {
      errors.push('Sitemap URL is invalid');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate website accessibility
 */
export async function validateWebsiteAccessibility(websiteUrl: string): Promise<TenantValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const response = await fetch(websiteUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      errors.push(`Website returned status ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      warnings.push('Website may not return HTML content');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      errors.push('Website request timed out');
    } else {
      errors.push('Website is not accessible');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

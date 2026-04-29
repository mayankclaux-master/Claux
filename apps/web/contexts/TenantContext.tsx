'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type TenantStatus = 'active' | 'provisioning' | 'suspended';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  category?: string;
  business_phone?: string;
  full_physical_address?: string;
  gmb_url?: string;
  target_market_type?: 'local_city' | 'national';
  target_city?: string;
  primary_language?: string;
  is_service_area_business?: boolean;
  onboarding_completed_at?: string | null;
  created_at: string;
};

type BusinessProfile = {
  id: string;
  tenant_id: string;
  business_name?: string;
  category?: string;
  phone?: string;
  address?: string;
  service_areas?: string[];
  website_url?: string;
  tech_stack?: string;
  cms_type?: 'wordpress' | 'custom_php' | 'shopify' | 'wix' | 'squarespace' | 'unknown';
  gbp_location_id?: string;
  place_id?: string;
  competitor_urls?: string[];
  updated_at: string;
};

type TenantContextType = {
  tenant: Tenant | null;
  businessProfile: BusinessProfile | null;
  loading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTenantData() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setTenant(null);
        setBusinessProfile(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile?.tenant_id) {
        setError('Could not load tenant information');
        setTenant(null);
        setBusinessProfile(null);
        return;
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .maybeSingle();

      if (tenantError) {
        setError(`Failed to load tenant: ${tenantError.message}`);
        setTenant(null);
        return;
      }

      if (tenantData) {
        setTenant(tenantData as Tenant);
      }

      const { data: businessProfileData, error: businessProfileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      if (businessProfileError) {
        console.warn('Failed to load business profile:', businessProfileError.message);
      } else if (businessProfileData) {
        setBusinessProfile(businessProfileData as BusinessProfile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error loading tenant data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenantData();
  }, []);

  async function refreshTenant() {
    await loadTenantData();
  }

  return (
    <TenantContext.Provider value={{ tenant, businessProfile, loading, error, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

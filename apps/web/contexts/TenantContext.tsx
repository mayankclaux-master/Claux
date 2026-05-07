'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

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
  const { user, isLoaded: isUserLoaded } = useUser();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTenantData() {
    try {
      setLoading(true);
      setError(null);

      if (!isUserLoaded || !user) {
        setTenant(null);
        setBusinessProfile(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/dashboard/profile');

      if (!response.ok) {
        setError('Failed to load tenant information');
        setTenant(null);
        setBusinessProfile(null);
        setLoading(false);
        return;
      }

      const json = await response.json();
      const data = json.data;

      if (data?.tenant) {
        setTenant(data.tenant);
      }

      setBusinessProfile(data?.businessProfile || null);

      setLoading(false);
    } catch (err) {
      setError('Failed to load tenant information');
      setTenant(null);
      setBusinessProfile(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenantData();
  }, [isUserLoaded, user]);

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

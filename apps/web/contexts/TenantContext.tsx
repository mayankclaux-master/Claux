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
  loadingTimeout: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add 15-second loading timeout to prevent infinite loading
  useEffect(() => {
    console.log("[TenantContext] Loading timeout timer START", {
      loading,
      timestamp: new Date().toISOString()
    });

    const timeoutId = setTimeout(() => {
      console.error("[TenantContext] Loading timeout EXCEEDED after 15 seconds", {
        loading,
        timestamp: new Date().toISOString()
      });
      setLoadingTimeout(true);
      setLoading(false);
    }, 15000);

    return () => {
      console.log("[TenantContext] Loading timeout timer CLEARED");
      clearTimeout(timeoutId);
    };
  }, [loading]);

  async function loadTenantData() {
    console.log("[TenantContext] loadTenantData called", {
      isUserLoaded,
      hasUser: !!user,
      userId: user?.id,
      currentLoading: loading,
      timestamp: new Date().toISOString()
    });

    try {
      console.log("[TenantContext] Setting loading to TRUE");
      setLoading(true);
      setError(null);

      console.log("[TenantContext] loadTenantData START", {
        isUserLoaded,
        hasUser: !!user,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      if (!isUserLoaded || !user) {
        console.log("[TenantContext] No user loaded, clearing tenant data");
        setTenant(null);
        setBusinessProfile(null);
        setLoading(false);
        return;
      }

      console.log("[TenantContext] Fetching /api/dashboard/profile START", {
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      const response = await fetch('/api/dashboard/profile');

      console.log("[TenantContext] Fetch /api/dashboard/profile COMPLETE", {
        userId: user.id,
        status: response.status,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        console.error("[TenantContext] Failed to load tenant information", response.status);
        setError('Failed to load tenant information');
        setTenant(null);
        setBusinessProfile(null);
        setLoading(false);
        return;
      }

      const json = await response.json();

      console.log("[TenantContext] Raw API response payload", {
        userId: user.id,
        responseKeys: Object.keys(json),
        hasData: !!json.data,
        response: json,
        timestamp: new Date().toISOString()
      });

      const data = json.data;

      console.log("[TenantContext] Tenant data loaded SUCCESS", {
        userId: user.id,
        has_tenant: !!data?.tenant,
        tenant_id: data?.tenant?.id,
        tenant_name: data?.tenant?.name,
        has_business_profile: !!data?.businessProfile,
        business_name: data?.businessProfile?.business_name,
        timestamp: new Date().toISOString()
      });

      if (data?.tenant) {
        setTenant(data.tenant);
      } else {
        console.warn("[TenantContext] No tenant in response data, setting tenant to null");
        setTenant(null);
      }

      setBusinessProfile(data?.businessProfile || null);

      console.log("[TenantContext] Setting loading to FALSE (success path)");
      console.log("[TenantContext] Loading state CLEARED (loading=false)", {
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      setLoading(false);
    } catch (err) {
      console.error("[TenantContext] Error loading tenant data CRASH:", err);
      setError('Failed to load tenant information');
      setTenant(null);
      setBusinessProfile(null);
      console.log("[TenantContext] Setting loading to FALSE (error path)");
      setLoading(false);
    } finally {
      console.log("[TenantContext] loadTenantData FINALLY - ensuring loading=false", {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("[TenantContext] useEffect triggered", {
      isUserLoaded,
      hasUser: !!user,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
    loadTenantData();
  }, [isUserLoaded, user]);

  async function refreshTenant() {
    await loadTenantData();
  }

  console.log("[TenantContext] Provider render", {
    hasTenant: !!tenant,
    tenantId: tenant?.id,
    hasBusinessProfile: !!businessProfile,
    loading,
    loadingTimeout,
    hasError: !!error,
    timestamp: new Date().toISOString()
  });

  return (
    <TenantContext.Provider value={{ tenant, businessProfile, loading, loadingTimeout, error, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  console.log("[useTenant] Hook called", {
    hasTenant: !!context?.tenant,
    tenantId: context?.tenant?.id,
    hasBusinessProfile: !!context?.businessProfile,
    loading: context?.loading,
    loadingTimeout: context?.loadingTimeout,
    hasError: !!context?.error,
    timestamp: new Date().toISOString()
  });

  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

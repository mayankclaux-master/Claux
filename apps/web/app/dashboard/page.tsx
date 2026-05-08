'use client';

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import MissionControl from "@/components/dashboard/MissionControl";
import CompleteProfileCard from "@/components/dashboard/CompleteProfileCard";

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    async function loadDashboardContext() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      // Set loading timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('[Dashboard] Loading timeout exceeded');
        setLoadingTimeout(true);
        setLoading(false);
      }, 15000); // 15 second timeout

      try {
        // Step 1: Ensure tenant exists
        const ensureTenantResponse = await fetch('/api/internal/ensure-tenant');
        if (!ensureTenantResponse.ok) {
          console.error('[Dashboard] Failed to ensure tenant');
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        // Step 2: Get dashboard context
        const contextResponse = await fetch('/api/dashboard/context');
        if (!contextResponse.ok) {
          console.error('[Dashboard] Failed to get context');
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        const context = await contextResponse.json();
        
        if (!context) {
          console.error('[Dashboard] Context data is null');
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        console.log("[Dashboard] Context data:", context);
        
        // Use actual tenant_id from context, NOT Clerk user ID
        setOnboardingCompleted(true);
        setTenantId(context?.tenant_id || null);
        clearTimeout(timeoutId);

        console.log("[Observability] Dashboard loaded", {
          userId: user?.id,
          tenant_id: context?.tenant_id,
          full_name: context.full_name,
          business_name: context.business_name,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Dashboard] Error loading context:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardContext();

    // Listen for onboarding complete event
    const handleOnboardingComplete = () => {
      setLoading(true);
      setLoadingTimeout(false);
      loadDashboardContext();
    };

    window.addEventListener('onboarding-complete', handleOnboardingComplete);

    return () => {
      window.removeEventListener('onboarding-complete', handleOnboardingComplete);
    };
  }, [isLoaded, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadingTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-semibold mb-4 text-red-600 dark:text-red-400">
              Loading timeout
            </h1>
            <p className="text-muted-foreground mb-6">
              We couldn't load your workspace. Please refresh the page or contact support.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
              <a
                href="mailto:support@claux.com"
                className="block w-full text-center border border-border px-4 py-2 rounded hover:bg-accent transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (onboardingCompleted === false) {
    return <CompleteProfileCard />;
  }

  if (onboardingCompleted === true && tenantId) {
    return <MissionControl isWordPress={false} orgId={tenantId} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading dashboard...</p>
    </div>
  );
}

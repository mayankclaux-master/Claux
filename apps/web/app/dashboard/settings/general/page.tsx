'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTenantAuditLogs } from '@/actions/get-audit-logs';

type CmsType = 'wordpress' | 'custom_php' | 'shopify' | 'wix' | 'squarespace' | 'unknown';

export default function GeneralSettingsPage() {
  try {
    const { tenant, businessProfile, loading, loadingTimeout, refreshTenant } = useTenant();

    console.log("[Settings General] useTenant hook returned", {
      loading,
      loadingTimeout,
      hasTenant: !!tenant,
      tenantId: tenant?.id,
      tenantName: tenant?.name,
      hasBusinessProfile: !!businessProfile,
      businessName: businessProfile?.business_name,
      timestamp: new Date().toISOString()
    });

    console.log("[Settings General] Component render START", {
      loading,
      hasTenant: !!tenant,
      tenantId: tenant?.id,
      hasBusinessProfile: !!businessProfile,
      timestamp: new Date().toISOString()
    });
    
    // Lazy-load Supabase client to avoid RSC module evaluation issue
    const getSupabase = () => createSupabaseBrowserClient();
  
  const [formData, setFormData] = useState({
    business_name: '',
    category: '',
    phone: '',
    address: '',
    service_areas: '',
    website_url: '',
    tech_stack: '',
    cms_type: 'unknown' as CmsType,
    gbp_location_id: '',
    place_id: '',
    competitor_urls: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  useEffect(() => {
    console.log("[Settings General] businessProfile useEffect TRIGGERED", {
      hasBusinessProfile: !!businessProfile,
      businessName: businessProfile?.business_name,
      loading,
      timestamp: new Date().toISOString()
    });

    try {
      console.log("[Settings General] businessProfile useEffect START", {
        hasBusinessProfile: !!businessProfile,
        businessName: businessProfile?.business_name,
        timestamp: new Date().toISOString()
      });

      if (businessProfile) {
        setFormData({
          business_name: businessProfile.business_name || '',
          category: businessProfile.category || '',
          phone: businessProfile.phone || '',
          address: businessProfile.address || '',
          service_areas: Array.isArray(businessProfile.service_areas)
            ? businessProfile.service_areas.join(', ')
            : (businessProfile.service_areas || ''),
          website_url: businessProfile.website_url || '',
          tech_stack: businessProfile.tech_stack || '',
          cms_type: businessProfile.cms_type || 'unknown',
          gbp_location_id: businessProfile.gbp_location_id || '',
          place_id: businessProfile.place_id || '',
          competitor_urls: Array.isArray(businessProfile.competitor_urls)
            ? businessProfile.competitor_urls.join(', ')
            : (businessProfile.competitor_urls || '')
        });
      }
      console.log("[Settings General] businessProfile useEffect SUCCESS");
    } catch (error) {
      console.error("[Settings General] businessProfile useEffect CRASH:", error);
    }
  }, [businessProfile]);

  useEffect(() => {
    try {
      async function loadAuditLogs() {
        console.log("[Settings General] auditLogs useEffect START", {
          hasTenantId: !!tenant?.id,
          tenantId: tenant?.id,
          timestamp: new Date().toISOString()
        });
        
        if (!tenant?.id) return;

        setLoadingAuditLogs(true);
        try {
          const logs = await getTenantAuditLogs(tenant.id);
          console.log("[Settings General] Audit logs loaded", {
            count: logs.length,
            timestamp: new Date().toISOString()
          });
          setAuditLogs(logs);
        } catch (error) {
          console.error('[Settings General] Failed to load audit logs:', error);
        } finally {
          setLoadingAuditLogs(false);
        }
      }

      loadAuditLogs();
    } catch (error) {
      console.error("[Settings General] auditLogs useEffect CRASH:", error);
    }
  }, [tenant?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (!tenant?.id) {
        throw new Error('Tenant not found');
      }

      const serviceAreasArray = formData.service_areas
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const competitorUrlsArray = formData.competitor_urls
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const supabase = getSupabase();
      const { error } = await supabase
        .from('business_profiles')
        .upsert({
          tenant_id: tenant.id,
          business_name: formData.business_name || null,
          category: formData.category || null,
          phone: formData.phone || null,
          address: formData.address || null,
          service_areas: serviceAreasArray.length > 0 ? serviceAreasArray : null,
          website_url: formData.website_url || null,
          tech_stack: formData.tech_stack || null,
          cms_type: formData.cms_type,
          gbp_location_id: formData.gbp_location_id || null,
          place_id: formData.place_id || null,
          competitor_urls: competitorUrlsArray.length > 0 ? competitorUrlsArray : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'tenant_id'
        });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      await refreshTenant();
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to save settings' 
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm('Are you sure you want to delete your account? This will soft-delete your workspace and all associated data. This action cannot be undone.');
    
    if (!confirmed || !tenant?.id) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('tenants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', tenant.id);

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Account deleted successfully. Redirecting to login...' });
      
      // Sign out and redirect after delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      console.error('Error deleting account:', err);
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to delete account' 
      });
    } finally {
      setSaving(false);
    }
  }

  if (loadingTimeout) {
    console.log("[Settings General] Rendering timeout state from TenantContext");
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-semibold mb-4 text-red-600 dark:text-red-400">
              Loading timeout
            </h1>
            <p className="text-muted-foreground mb-6">
              We couldn't load your workspace settings. Please refresh the page or contact support.
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

  if (loading) {
    console.log("[Settings General] Rendering loading state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Gracefully handle missing tenant without crashing
  if (!tenant) {
    console.log("[Settings General] Rendering tenant not found state");
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold mb-4">Workspace Not Found</h1>
          <p className="text-muted-foreground mb-6">
            Your workspace could not be loaded. This may be a temporary issue or your workspace needs to be set up.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  console.log("[Settings General] Rendering main content");

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-claux-text mb-2">General Settings</h1>
        <p className="text-claux-muted">Manage your business profile and workspace settings</p>
      </div>

      {/* Tenant Information */}
      <div className="bg-claux-surface border border-claux-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-claux-text mb-4">Workspace Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-claux-muted">Workspace Name</Label>
            <div className="mt-1 text-claux-text">{tenant?.name || 'N/A'}</div>
          </div>
          <div>
            <Label className="text-claux-muted">Status</Label>
            <div className="mt-1">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                tenant?.status === 'active'
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {tenant?.status === 'active' ? 'Active' : 'Provisioning'}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-claux-muted">Onboarding Completed</Label>
              <div className="mt-1 text-claux-text">
                {tenant?.onboarding_completed_at 
                  ? (() => {
                      try {
                        return new Date(tenant.onboarding_completed_at).toLocaleDateString();
                      } catch (e) {
                        console.error("[Settings General] Date parsing error (onboarding):", e);
                        return 'Invalid date';
                      }
                    })() 
                  : 'Not completed'}
              </div>
            </div>
            <div>
              <Label className="text-claux-muted">Category</Label>
              <div className="mt-1 text-claux-text">{tenant?.category || 'N/A'}</div>
            </div>
            <div>
              <Label className="text-claux-muted">Target Market</Label>
              <div className="mt-1 text-claux-text capitalize">{tenant?.target_market_type || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Business Profile Form */}
        <form onSubmit={handleSubmit} className="bg-claux-surface border border-claux-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-claux-text mb-4">Business Profile</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Your business name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Restaurant, Retail, Services"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State, ZIP"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tech_stack">Tech Stack</Label>
              <Input
                id="tech_stack"
                value={formData.tech_stack}
                onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                placeholder="e.g., Next.js, React, WordPress"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cms_type">CMS Type</Label>
              <select
                id="cms_type"
                value={formData.cms_type}
                onChange={(e) => setFormData({ ...formData, cms_type: e.target.value as CmsType })}
                className="mt-1 w-full px-3 py-2 bg-claux-border/30 border border-claux-border rounded-md text-claux-text focus:outline-none focus:ring-2 focus:ring-[#7F77DD]"
              >
                <option value="unknown">Unknown</option>
                <option value="wordpress">WordPress</option>
                <option value="custom_php">Custom PHP</option>
                <option value="shopify">Shopify</option>
                <option value="wix">Wix</option>
                <option value="squarespace">Squarespace</option>
              </select>
            </div>

            <div>
              <Label htmlFor="gbp_location_id">GBP Location ID</Label>
              <Input
                id="gbp_location_id"
                value={formData.gbp_location_id}
                onChange={(e) => setFormData({ ...formData, gbp_location_id: e.target.value })}
                placeholder="Google Business Profile Location ID"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="place_id">Place ID</Label>
              <Input
                id="place_id"
                value={formData.place_id}
                onChange={(e) => setFormData({ ...formData, place_id: e.target.value })}
                placeholder="Google Maps Place ID"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="service_areas">Service Areas (comma-separated)</Label>
              <Input
                id="service_areas"
                value={formData.service_areas}
                onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
                placeholder="New York, Los Angeles, Chicago"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="competitor_urls">Competitor URLs (comma-separated)</Label>
              <Input
                id="competitor_urls"
                value={formData.competitor_urls}
                onChange={(e) => setFormData({ ...formData, competitor_urls: e.target.value })}
                placeholder="https://competitor1.com, https://competitor2.com"
                className="mt-1"
              />
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#7F77DD] hover:bg-[#6A5BCD] text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
          <p className="text-claux-muted mb-4">Permanently delete your workspace and all associated data. This action cannot be undone.</p>
          <Button
            onClick={handleDeleteAccount}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {saving ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>

        {/* Audit Log */}
        <div className="bg-claux-surface border border-claux-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-claux-text mb-4">Audit Log</h2>
          <p className="text-claux-muted mb-4">Recent activity and changes in your workspace</p>
          {loadingAuditLogs ? (
            <div className="text-claux-muted">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-claux-muted">No audit logs found</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {auditLogs.map((log) => {
                try {
                  return (
                    <div key={log.id} className="p-3 bg-claux-border/30 rounded-lg border border-claux-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-claux-muted font-semibold">{log.action || 'Unknown action'}</span>
                        <span className="text-xs text-claux-muted">
                          {(() => {
                            try {
                              return new Date(log.created_at).toLocaleString();
                            } catch (e) {
                              console.error("[Settings General] Date parsing error (audit log):", e);
                              return 'Invalid date';
                            }
                          })()}
                        </span>
                      </div>
                      <div className="text-sm text-claux-text mb-1">
                        <span className="text-[#7F77DD]">{log.table_name || 'Unknown table'}</span>: {log.record_id || 'N/A'}
                      </div>
                      <div className="text-xs text-claux-muted">
                        Actor: {log.actor_type || 'Unknown'} ({(() => {
                          try {
                            return log.actor_id?.slice(0, 8) || 'N/A';
                          } catch (e) {
                            console.error("[Settings General] actor_id slice error:", e);
                            return 'N/A';
                          }
                        })()}...)
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error("[Settings General] Audit log item render error:", error, log);
                  return (
                    <div key={log.id} className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                      <span className="text-xs text-red-400">Error rendering audit log</span>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
  );
  } catch (error) {
    console.error("[Settings General] COMPONENT RENDER CRASH:", error);
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold mb-4">Render Error</h1>
          <p className="text-muted-foreground mb-6">
            An error occurred while rendering this page. This has been logged for investigation.
          </p>
          <pre className="text-xs text-left bg-red-500/10 p-4 rounded overflow-auto max-h-40">
            {error instanceof Error ? error.message : String(error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}

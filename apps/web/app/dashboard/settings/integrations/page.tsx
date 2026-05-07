'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

type IntegrationStatus = 'not_connected' | 'connected' | 'error' | 'expired';

type IntegrationsData = {
  google_status: IntegrationStatus;
  google_connected_email: string | null;
  search_console_property: string | null;
  ga4_property_id: string | null;
  ga4_account_id: string | null;
  gbp_account_id: string | null;
  gbp_location_id: string | null;
  wp_status: IntegrationStatus;
  wp_site_url: string | null;
  wp_username: string | null;
  shopify_status: IntegrationStatus;
  shopify_store_url: string | null;
  shopify_blog_id: string | null;
  custom_status: IntegrationStatus;
  custom_api_url: string | null;
};

export default function IntegrationsPage() {
  const { user, isLoaded } = useUser();
  const [integrations, setIntegrations] = useState<IntegrationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    loadIntegrations();
  }, [isLoaded, user]);

  async function loadIntegrations() {
    try {
      const response = await fetch('/api/integrations/status');
      if (!response.ok) {
        throw new Error('Failed to load integrations');
      }
      const data = await response.json();
      setIntegrations(data);
    } catch (err) {
      setError('Failed to load integrations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: IntegrationStatus) {
    const styles = {
      not_connected: 'bg-gray-100 text-gray-600',
      connected: 'bg-green-100 text-green-600',
      error: 'bg-red-100 text-red-600',
      expired: 'bg-yellow-100 text-yellow-600'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  }

  function handleGoogleConnect() {
    window.location.href = '/api/integrations/google/connect';
  }

  async function handleGoogleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Google?')) return;

    try {
      const response = await fetch('/api/integrations/google/disconnect', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to disconnect');
      await loadIntegrations();
    } catch (err) {
      setError('Failed to disconnect Google');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Integrations</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

          {/* Google Workspace */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Google Workspace</h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Google Search Console, Analytics, Business Profile</p>
                  {integrations?.google_connected_email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connected as {integrations.google_connected_email}
                    </p>
                  )}
                </div>
                {getStatusBadge(integrations?.google_status || 'not_connected')}
              </div>

              {integrations?.google_status === 'connected' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Search Console Property</p>
                      <p className="font-medium">{integrations.search_console_property || 'Not selected'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">GA4 Property</p>
                      <p className="font-medium">{integrations.ga4_property_id || 'Not selected'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">GBP Account</p>
                      <p className="font-medium">{integrations.gbp_account_id || 'Not selected'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">GBP Location</p>
                      <p className="font-medium">{integrations.gbp_location_id || 'Not selected'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGoogleDisconnect}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                  Connect Google
                </button>
              )}
            </div>
          </section>

          {/* CMS */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Content Management Systems</h2>
            
            {/* WordPress */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">WordPress</p>
                  {integrations?.wp_site_url && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {integrations.wp_site_url}
                    </p>
                  )}
                </div>
                {getStatusBadge(integrations?.wp_status || 'not_connected')}
              </div>

              {integrations?.wp_status === 'connected' ? (
                <button
                  onClick={() => handleCMSDisconnect('wordpress')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleCMSConnect('wordpress')}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                  Connect WordPress
                </button>
              )}
            </div>

            {/* Shopify */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Shopify</p>
                  {integrations?.shopify_store_url && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {integrations.shopify_store_url}
                    </p>
                  )}
                </div>
                {getStatusBadge(integrations?.shopify_status || 'not_connected')}
              </div>

              {integrations?.shopify_status === 'connected' ? (
                <button
                  onClick={() => handleCMSDisconnect('shopify')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleCMSConnect('shopify')}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                  Connect Shopify
                </button>
              )}
            </div>

            {/* Custom API */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Custom API</p>
                  {integrations?.custom_api_url && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {integrations.custom_api_url}
                    </p>
                  )}
                </div>
                {getStatusBadge(integrations?.custom_status || 'not_connected')}
              </div>

              {integrations?.custom_status === 'connected' ? (
                <button
                  onClick={() => handleCMSDisconnect('custom')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleCMSConnect('custom')}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                  Connect Custom API
                </button>
              )}
            </div>
          </section>
    </div>
  );
}

function handleCMSConnect(type: string) {
  // TODO: Open modal to collect credentials
  alert(`Connect ${type} - credential collection modal to be implemented`);
}

async function handleCMSDisconnect(type: string) {
  if (!confirm(`Are you sure you want to disconnect ${type}?`)) return;

  try {
    const response = await fetch(`/api/integrations/cms?type=${type}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to disconnect');
    // Reload integrations
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert('Failed to disconnect');
  }
}

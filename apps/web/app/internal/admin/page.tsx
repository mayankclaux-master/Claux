/**
 * Internal Admin Panel
 * 
 * Internal-only admin panel for managing tenants, monitoring platform health, and performing operational tasks.
 * Protected by role - never accessible to clients.
 */

'use client';

import { useState, useEffect } from 'react';
import { TenantList } from '@/components/internal-admin/tenant-list';
import { PlatformHealth } from '@/components/internal-admin/platform-health';
import { AlertCenter } from '@/components/internal-admin/alert-center';

export default function InternalAdminPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'health' | 'alerts'>('tenants');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Internal Admin</h1>
              <p className="text-sm text-gray-500">Platform operations and tenant management</p>
            </div>
            <div className="flex space-x-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                INTERNAL ONLY
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-gray-200 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tenants'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tenants
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'health'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Platform Health
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Alerts
          </button>
        </div>

        {activeTab === 'tenants' && <TenantList />}
        {activeTab === 'health' && <PlatformHealth />}
        {activeTab === 'alerts' && <AlertCenter />}
      </div>
    </div>
  );
}

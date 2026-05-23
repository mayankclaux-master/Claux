/**
 * Tenant List Component
 * 
 * Displays tenant search, tenant status, onboarding status, execution health, connector health, cron health, dashboard freshness.
 */

'use client';

import { useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'onboarding' | 'suspended';
  onboardingStatus: string;
  executionHealth: 'healthy' | 'degraded' | 'unhealthy';
  connectorHealth: 'healthy' | 'degraded' | 'unhealthy';
  cronHealth: 'healthy' | 'degraded' | 'unhealthy';
  dashboardFreshness: 'fresh' | 'stale';
  lastExecution: string;
}

export function TenantList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tenants] = useState<Tenant[]>([
    {
      id: '1',
      name: 'Example Tenant 1',
      status: 'active',
      onboardingStatus: 'completed',
      executionHealth: 'healthy',
      connectorHealth: 'healthy',
      cronHealth: 'healthy',
      dashboardFreshness: 'fresh',
      lastExecution: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: 'Example Tenant 2',
      status: 'onboarding',
      onboardingStatus: 'connector-setup',
      executionHealth: 'healthy',
      connectorHealth: 'degraded',
      cronHealth: 'healthy',
      dashboardFreshness: 'fresh',
      lastExecution: '2024-01-15T09:45:00Z',
    },
  ]);

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.includes(searchQuery)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'fresh':
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'degraded':
      case 'stale':
      case 'onboarding':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Tenant Management</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Onboarding
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Execution
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Connector
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cron
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dashboard
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Execution
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                  <div className="text-sm text-gray-500">{tenant.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tenant.status)}`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tenant.onboardingStatus)}`}>
                    {tenant.onboardingStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tenant.executionHealth)}`}>
                    {tenant.executionHealth}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tenant.connectorHealth)}`}>
                    {tenant.connectorHealth}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tenant.cronHealth)}`}>
                    {tenant.cronHealth}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tenant.dashboardFreshness)}`}>
                    {tenant.dashboardFreshness}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(tenant.lastExecution).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                  <button className="text-gray-600 hover:text-gray-900">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

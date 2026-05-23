/**
 * Tenant Operations View
 * 
 * Detailed tenant view showing onboarding progress, readiness score, connector states, latest executions, latest failures, task queue health, dashboard freshness, storage usage, artifact usage, execution volume.
 */

'use client';

import { useState } from 'react';

interface ConnectorState {
  provider: string;
  status: 'connected' | 'disconnected' | 'degraded';
  lastSync: string;
  latency: number;
}

interface Execution {
  id: string;
  agent: string;
  status: 'success' | 'failed' | 'running';
  timestamp: string;
  duration: number;
}

export default async function TenantOperationsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  
  const [tenant] = useState({
    id: tenantId,
    name: 'Example Tenant',
    status: 'active',
    onboardingProgress: 100,
    readinessScore: 95,
  });

  const [connectorStates] = useState<ConnectorState[]>([
    { provider: 'DataForSEO', status: 'connected', lastSync: '2024-01-15T10:30:00Z', latency: 120 },
    { provider: 'SerpAPI', status: 'connected', lastSync: '2024-01-15T10:30:00Z', latency: 85 },
    { provider: 'GA4', status: 'connected', lastSync: '2024-01-15T10:25:00Z', latency: 200 },
    { provider: 'GSC', status: 'degraded', lastSync: '2024-01-15T10:20:00Z', latency: 450 },
    { provider: 'GBP', status: 'connected', lastSync: '2024-01-15T10:15:00Z', latency: 150 },
  ]);

  const [latestExecutions] = useState<Execution[]>([
    { id: '1', agent: 'ARIA', status: 'success', timestamp: '2024-01-15T10:30:00Z', duration: 4500 },
    { id: '2', agent: 'PULSE', status: 'success', timestamp: '2024-01-15T10:25:00Z', duration: 3200 },
    { id: '3', agent: 'SCRIBE', status: 'failed', timestamp: '2024-01-15T10:20:00Z', duration: 8900 },
    { id: '4', agent: 'PRISM', status: 'running', timestamp: '2024-01-15T10:15:00Z', duration: 0 },
  ]);

  const [usage] = useState({
    storage: 2.3,
    storageLimit: 10,
    artifacts: 150,
    artifactLimit: 1000,
    executionVolume: 450,
    executionLimit: 1000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'degraded':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button className="text-blue-600 hover:text-blue-900">← Back to Tenants</button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-sm text-gray-500">Tenant ID: {tenant.id}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(tenant.status)}`}>
              {tenant.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Onboarding & Readiness */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{tenant.onboardingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${tenant.onboardingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">Completed: Domain verification, Workspace creation, Connector setup</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Readiness Score</h3>
            <div className="flex items-center justify-center">
              <div className="text-5xl font-bold text-green-600">{tenant.readinessScore}</div>
              <div className="text-sm text-gray-500 ml-2">/ 100</div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">Tenant is production-ready</p>
          </div>
        </div>

        {/* Connector States */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connector States</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {connectorStates.map((connector) => (
              <div key={connector.provider} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{connector.provider}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(connector.status)}`}>
                    {connector.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  <div>Last sync: {new Date(connector.lastSync).toLocaleString()}</div>
                  <div>Latency: {connector.latency}ms</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Executions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Executions</h3>
          <div className="space-y-3">
            {latestExecutions.map((execution) => (
              <div key={execution.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(execution.status)}`}>
                    {execution.status}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{execution.agent}</div>
                    <div className="text-sm text-gray-500">{new Date(execution.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {execution.duration > 0 ? `${execution.duration}ms` : 'Running...'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">{usage.storage} GB / {usage.storageLimit} GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(usage.storage / usage.storageLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Artifact Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Count</span>
                <span className="font-medium">{usage.artifacts} / {usage.artifactLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(usage.artifacts / usage.artifactLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Volume</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">This month</span>
                <span className="font-medium">{usage.executionVolume} / {usage.executionLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(usage.executionVolume / usage.executionLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Freshness</h3>
            <div className="flex items-center justify-center">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Fresh
              </span>
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">Last updated: 5 minutes ago</p>
          </div>
        </div>

        {/* Task Queue Health */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Queue Health</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">145</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

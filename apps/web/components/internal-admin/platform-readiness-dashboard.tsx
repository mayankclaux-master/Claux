/**
 * Platform Readiness Dashboard
 * 
 * Internal platform dashboard showing total tenants, healthy tenants, onboarding success %, connector uptime %, execution success %, cron success %, cache integrity %, DB performance, storage growth, retry frequency, timeout frequency.
 */

'use client';

import { useState } from 'react';

interface PlatformMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  target: number;
}

export function PlatformReadinessDashboard() {
  const [metrics] = useState<PlatformMetric[]>([
    { name: 'Total Tenants', value: 10, unit: '', status: 'healthy', target: 1000 },
    { name: 'Healthy Tenants', value: 9, unit: '', status: 'healthy', target: 10 },
    { name: 'Onboarding Success %', value: 95, unit: '%', status: 'healthy', target: 90 },
    { name: 'Connector Uptime %', value: 99.5, unit: '%', status: 'healthy', target: 99 },
    { name: 'Execution Success %', value: 98.2, unit: '%', status: 'healthy', target: 95 },
    { name: 'Cron Success %', value: 99.8, unit: '%', status: 'healthy', target: 99 },
    { name: 'Cache Integrity %', value: 100, unit: '%', status: 'healthy', target: 99 },
    { name: 'DB Performance', value: 95, unit: '%', status: 'healthy', target: 90 },
    { name: 'Storage Growth', value: 15, unit: '%', status: 'healthy', target: 50 },
    { name: 'Retry Frequency', value: 2.1, unit: '%', status: 'healthy', target: 5 },
    { name: 'Timeout Frequency', value: 0.5, unit: '%', status: 'healthy', target: 1 },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const calculateOverallReadiness = (): number => {
    const healthyCount = metrics.filter(m => m.status === 'healthy').length;
    return (healthyCount / metrics.length) * 100;
  };

  const overallReadiness = calculateOverallReadiness();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Platform Readiness Dashboard</h2>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{overallReadiness.toFixed(0)}%</div>
          <div className="text-sm text-gray-500">Overall Readiness</div>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`p-4 rounded-lg border-2 ${overallReadiness >= 90 ? 'bg-green-50 border-green-200' : overallReadiness >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Platform Status</h3>
            <p className="text-sm text-gray-600">
              {overallReadiness >= 90 ? 'Platform is healthy and ready for production' : overallReadiness >= 70 ? 'Platform has some issues that need attention' : 'Platform has critical issues requiring immediate action'}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full font-semibold ${overallReadiness >= 90 ? 'bg-green-100 text-green-800' : overallReadiness >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
            {overallReadiness >= 90 ? 'HEALTHY' : overallReadiness >= 70 ? 'DEGRADED' : 'UNHEALTHY'}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.name} className={`p-4 rounded-lg border-2 ${getStatusColor(metric.status)}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-gray-900">{metric.name}</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(metric.status)}`}>
                {metric.status}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {metric.value}{metric.unit}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>Target: {metric.target}{metric.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(metric.value, metric.target)}`}
                  style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Health Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">System Health Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">10</div>
            <div className="text-sm text-gray-600">Total Tenants</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">9</div>
            <div className="text-sm text-gray-600">Healthy Tenants</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">45</div>
            <div className="text-sm text-gray-600">Active Schedules</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">2.3 GB</div>
            <div className="text-sm text-gray-600">Storage Used</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Recent Platform Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tenant onboarding completed</span>
            <span className="text-gray-500">5 minutes ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Connector latency spike detected (DataForSEO)</span>
            <span className="text-gray-500">15 minutes ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Scheduled execution batch completed</span>
            <span className="text-gray-500">30 minutes ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cache invalidation completed for tenant 1</span>
            <span className="text-gray-500">1 hour ago</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {overallReadiness < 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Recommendations</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            {metrics.filter(m => m.status !== 'healthy').map(m => (
              <li key={m.name}>• Monitor {m.name} - currently {m.status}</li>
            ))}
            {metrics.filter(m => m.status === 'healthy').length === metrics.length && (
              <li>• All systems healthy - continue monitoring</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Platform Health Component
 * 
 * Displays platform-wide health metrics including connector uptime, execution success, cron success, cache integrity, DB performance, storage growth, retry frequency, timeout frequency.
 */

'use client';

import { useState } from 'react';

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  trend: 'up' | 'down' | 'stable';
}

export function PlatformHealth() {
  const [metrics] = useState<HealthMetric[]>([
    { name: 'Connector Uptime', value: 99.5, unit: '%', status: 'healthy', trend: 'stable' },
    { name: 'Execution Success', value: 98.2, unit: '%', status: 'healthy', trend: 'up' },
    { name: 'Cron Success', value: 99.8, unit: '%', status: 'healthy', trend: 'stable' },
    { name: 'Cache Integrity', value: 100, unit: '%', status: 'healthy', trend: 'stable' },
    { name: 'DB Performance', value: 95, unit: '%', status: 'healthy', trend: 'down' },
    { name: 'Storage Growth', value: 15, unit: '%', status: 'healthy', trend: 'up' },
    { name: 'Retry Frequency', value: 2.1, unit: '%', status: 'healthy', trend: 'down' },
    { name: 'Timeout Frequency', value: 0.5, unit: '%', status: 'healthy', trend: 'stable' },
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'stable':
        return '→';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Platform Health</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className={`p-4 rounded-lg border-2 ${getStatusColor(metric.status)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metric.value}{metric.unit}
                </p>
              </div>
              <div className={`text-lg font-semibold ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)}
              </div>
            </div>
            <div className="mt-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(metric.status)}`}>
                {metric.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">System Overview</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Tenants</span>
            <span className="text-sm font-medium text-gray-900">10</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Healthy Tenants</span>
            <span className="text-sm font-medium text-green-600">9</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Onboarding Success Rate</span>
            <span className="text-sm font-medium text-gray-900">95%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Schedules</span>
            <span className="text-sm font-medium text-gray-900">45</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Storage Used</span>
            <span className="text-sm font-medium text-gray-900">2.3 GB</span>
          </div>
        </div>
      </div>
    </div>
  );
}

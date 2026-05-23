/**
 * Alert Center Component
 * 
 * Displays platform alerts including connector outages, cron failures, stale locks, retry storms, onboarding failures, dashboard stale states, Supabase latency spikes, execution failure spikes.
 */

'use client';

import { useState } from 'react';

interface Alert {
  id: string;
  type: 'connector' | 'cron' | 'lock' | 'retry' | 'onboarding' | 'dashboard' | 'database' | 'execution';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  tenantId?: string;
  traceId?: string;
  timestamp: string;
  resolved: boolean;
}

export function AlertCenter() {
  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'connector',
      severity: 'high',
      message: 'DataForSEO connector experiencing elevated latency',
      tenantId: '2',
      traceId: 'trace-abc123',
      timestamp: '2024-01-15T10:15:00Z',
      resolved: false,
    },
    {
      id: '2',
      type: 'retry',
      severity: 'medium',
      message: 'Retry storm detected for tenant 1',
      tenantId: '1',
      traceId: 'trace-def456',
      timestamp: '2024-01-15T09:30:00Z',
      resolved: true,
    },
    {
      id: '3',
      type: 'cron',
      severity: 'low',
      message: 'Cron execution delayed for ARIA agent',
      tenantId: '1',
      traceId: 'trace-ghi789',
      timestamp: '2024-01-15T08:45:00Z',
      resolved: true,
    },
  ]);

  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [filterResolved, setFilterResolved] = useState<'all' | 'unresolved' | 'resolved'>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterResolved === 'unresolved' && alert.resolved) return false;
    if (filterResolved === 'resolved' && !alert.resolved) return false;
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'connector':
        return '🔌';
      case 'cron':
        return '⏰';
      case 'lock':
        return '🔒';
      case 'retry':
        return '🔄';
      case 'onboarding':
        return '🚀';
      case 'dashboard':
        return '📊';
      case 'database':
        return '💾';
      case 'execution':
        return '⚡';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Alert Center</h2>
        <div className="flex space-x-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterResolved}
            onChange={(e) => setFilterResolved(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)} ${alert.resolved ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{alert.type}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{alert.message}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {alert.tenantId && <span>Tenant: {alert.tenantId}</span>}
                    {alert.traceId && <span>Trace: {alert.traceId}</span>}
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {alert.resolved && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Resolved
                  </span>
                )}
                <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No alerts match the current filters</p>
        </div>
      )}
    </div>
  );
}

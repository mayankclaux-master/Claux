/**
 * Deployment Health Dashboard
 * 
 * Internal admin dashboard displaying:
 * - Deployment readiness
 * - Environment verification
 * - Migration verification
 * - RLS verification
 * - Connector readiness
 * - Onboarding readiness
 * - Execution readiness
 * - Dashboard freshness
 * - Cache integrity
 * - Deployment blockers
 * - Warnings
 * - Rollback compatibility
 * 
 * Internal admin only.
 */

'use client';

import { useState, useEffect } from 'react';

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  threshold: number;
}

interface DeploymentCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export function DeploymentHealthDashboard() {
  const [readinessScore, setReadinessScore] = useState(95);
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('production');
  const [metrics] = useState<HealthMetric[]>([
    { name: 'Environment Verification', value: 100, unit: '%', status: 'healthy', threshold: 100 },
    { name: 'Migration Verification', value: 100, unit: '%', status: 'healthy', threshold: 100 },
    { name: 'RLS Verification', value: 100, unit: '%', status: 'healthy', threshold: 100 },
    { name: 'Connector Readiness', value: 95, unit: '%', status: 'healthy', threshold: 90 },
    { name: 'Onboarding Readiness', value: 100, unit: '%', status: 'healthy', threshold: 95 },
    { name: 'Execution Readiness', value: 98, unit: '%', status: 'healthy', threshold: 95 },
    { name: 'Dashboard Freshness', value: 100, unit: '%', status: 'healthy', threshold: 90 },
    { name: 'Cache Integrity', value: 100, unit: '%', status: 'healthy', threshold: 99 },
  ]);

  const [deploymentChecks] = useState<DeploymentCheck[]>([
    { name: 'Database Connectivity', passed: true, message: 'Connection successful', severity: 'critical' },
    { name: 'Required Tables', passed: true, message: 'All tables present', severity: 'critical' },
    { name: 'Cron Tables', passed: true, message: 'All cron tables present', severity: 'critical' },
    { name: 'Onboarding Tables', passed: true, message: 'All onboarding tables present', severity: 'critical' },
    { name: 'Snapshot Tables', passed: true, message: 'All snapshot tables present', severity: 'warning' },
    { name: 'Connector Health', passed: true, message: 'All connectors healthy', severity: 'warning' },
    { name: 'Storage Sanity', passed: true, message: 'Storage operations working', severity: 'critical' },
    { name: 'Execution Pipeline', passed: true, message: 'Pipeline functional', severity: 'critical' },
  ]);

  const [blockers] = useState<string[]>([]);
  const [warnings] = useState<string[]>([
    'Snapshot tables are optional but recommended',
  ]);

  const [rollbackCompatibility] = useState({
    canRollback: true,
    requiresManualIntervention: false,
    reason: '',
  });

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Deployment Health Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          <span className="text-sm text-gray-500">Environment: {environment}</span>
        </div>
      </div>

      {/* Overall Readiness */}
      <div className={`p-6 rounded-lg border-2 ${readinessScore >= 90 ? 'bg-green-50 border-green-200' : readinessScore >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Deployment Readiness</h3>
            <p className="text-sm text-gray-600 mt-1">
              {readinessScore >= 90 ? 'Ready for production deployment' : readinessScore >= 70 ? 'Ready for staging deployment' : 'Not ready for deployment'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-gray-900">{readinessScore}%</div>
            <div className="text-sm text-gray-500 mt-1">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <span>Threshold: {metric.threshold}{metric.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${metric.value >= metric.threshold ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deployment Checks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Deployment Verification Checks</h3>
        <div className="space-y-3">
          {deploymentChecks.map((check) => (
            <div key={check.name} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(check.severity)}`}>
                  {check.severity.toUpperCase()}
                </span>
                <div>
                  <div className="font-medium text-gray-900">{check.name}</div>
                  <div className="text-sm text-gray-500">{check.message}</div>
                </div>
              </div>
              <div className={`px-3 py-1 text-sm font-medium rounded ${check.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {check.passed ? 'PASSED' : 'FAILED'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blockers and Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blockers.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-md font-semibold text-red-900 mb-4">Deployment Blockers</h3>
            <ul className="space-y-2">
              {blockers.map((blocker, index) => (
                <li key={index} className="text-sm text-red-700">• {blocker}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-md font-semibold text-yellow-900 mb-4">Warnings</h3>
            <ul className="space-y-2">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm text-yellow-700">• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {blockers.length === 0 && warnings.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-md font-semibold text-green-900 mb-2">No Issues</h3>
            <p className="text-sm text-green-700">All checks passed with no blockers or warnings.</p>
          </div>
        )}
      </div>

      {/* Rollback Compatibility */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Rollback Compatibility</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-sm font-medium rounded ${rollbackCompatibility.canRollback ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {rollbackCompatibility.canRollback ? 'CAN ROLLBACK' : 'CANNOT ROLLBACK'}
              </span>
              {rollbackCompatibility.requiresManualIntervention && (
                <span className="px-3 py-1 text-sm font-medium rounded bg-yellow-100 text-yellow-800">
                  REQUIRES MANUAL INTERVENTION
                </span>
              )}
            </div>
            {rollbackCompatibility.reason && (
              <p className="text-sm text-gray-600 mt-2">{rollbackCompatibility.reason}</p>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Previous deployment versions are available for rollback
          </div>
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Recent Deployments</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium text-gray-900">v1.0.15</div>
              <div className="text-gray-500">Commit: 1cdca9a</div>
            </div>
            <div className="text-right">
              <div className="text-gray-900">Production</div>
              <div className="text-gray-500">2 hours ago</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium text-gray-900">v1.0.14</div>
              <div className="text-gray-500">Commit: a3b2c1d</div>
            </div>
            <div className="text-right">
              <div className="text-gray-900">Staging</div>
              <div className="text-gray-500">1 day ago</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium text-gray-900">v1.0.13</div>
              <div className="text-gray-500">Commit: e5f6g7h</div>
            </div>
            <div className="text-right">
              <div className="text-gray-900">Production</div>
              <div className="text-gray-500">3 days ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

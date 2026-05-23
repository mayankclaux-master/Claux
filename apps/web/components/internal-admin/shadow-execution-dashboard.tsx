/**
 * Shadow Execution Dashboard
 * 
 * Internal admin only dashboard showing:
 * - Live executions
 * - Connector health
 * - API failures
 * - API costs
 * - Retry storms
 * - Payload anomalies
 * - OAuth issues
 * - Rate limiting events
 */

'use client';

import { useState, useEffect } from 'react';

interface LiveExecution {
  id: string;
  timestamp: number;
  connector: string;
  operation: string;
  status: 'running' | 'success' | 'failed';
  duration: number;
}

interface ConnectorHealth {
  connector: string;
  reliabilityScore: number;
  uptime: number;
  averageLatency: number;
  failureRate: number;
}

interface APIFailure {
  id: string;
  timestamp: number;
  connector: string;
  error: string;
  severity: 'critical' | 'warning' | 'info';
}

export function ShadowExecutionDashboard() {
  const [executionMode, setExecutionMode] = useState<'mock' | 'shadow' | 'production'>('shadow');
  const [liveExecutions] = useState<LiveExecution[]>([
    { id: '1', timestamp: Date.now() - 5000, connector: 'DataForSEO', operation: 'rank_tracking', status: 'success', duration: 234 },
    { id: '2', timestamp: Date.now() - 10000, connector: 'SerpAPI', operation: 'serp_analysis', status: 'success', duration: 189 },
    { id: '3', timestamp: Date.now() - 15000, connector: 'Google Search Console', operation: 'query_analysis', status: 'running', duration: 0 },
    { id: '4', timestamp: Date.now() - 20000, connector: 'Google Analytics', operation: 'traffic_report', status: 'failed', duration: 0 },
  ]);

  const [connectorHealth] = useState<ConnectorHealth[]>([
    { connector: 'DataForSEO', reliabilityScore: 95, uptime: 99.2, averageLatency: 234, failureRate: 0.8 },
    { connector: 'SerpAPI', reliabilityScore: 92, uptime: 98.5, averageLatency: 189, failureRate: 1.5 },
    { connector: 'Google Search Console', reliabilityScore: 88, uptime: 97.8, averageLatency: 456, failureRate: 2.2 },
    { connector: 'Google Analytics', reliabilityScore: 90, uptime: 98.2, averageLatency: 312, failureRate: 1.8 },
    { connector: 'Google Business Profile', reliabilityScore: 85, uptime: 96.5, averageLatency: 523, failureRate: 3.5 },
  ]);

  const [apiFailures] = useState<APIFailure[]>([
    { id: '1', timestamp: Date.now() - 30000, connector: 'Google Analytics', error: 'Rate limit exceeded', severity: 'warning' },
    { id: '2', timestamp: Date.now() - 60000, connector: 'Google Search Console', error: 'OAuth token expired', severity: 'critical' },
    { id: '3', timestamp: Date.now() - 120000, connector: 'SerpAPI', error: 'Malformed response', severity: 'warning' },
  ]);

  const [apiCosts] = useState({
    totalCost: 12.45,
    totalCredits: 2450,
    totalApiCalls: 2450,
    byConnector: {
      'DataForSEO': { cost: 6.25, credits: 1250, calls: 1250 },
      'SerpAPI': { cost: 3.75, credits: 750, calls: 750 },
      'Google Search Console': { cost: 1.25, credits: 250, calls: 250 },
      'Google Analytics': { cost: 1.20, credits: 200, calls: 200 },
    },
  });

  const [retryStorms] = useState([
    { connector: 'Google Search Console', retryCount: 15, threshold: 10, active: true },
  ]);

  const [payloadAnomalies] = useState([
    { type: 'schema_drift', count: 3, connector: 'SerpAPI' },
    { type: 'empty_response', count: 1, connector: 'Google Analytics' },
  ]);

  const [oauthIssues] = useState([
    { connector: 'Google Search Console', issue: 'Token expired', count: 2 },
  ]);

  const [rateLimitingEvents] = useState([
    { connector: 'Google Analytics', limit: 100, used: 95, percentage: 95 },
    { connector: 'DataForSEO', limit: 1000, used: 850, percentage: 85 },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const getReliabilityColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Shadow Execution Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            value={executionMode}
            onChange={(e) => setExecutionMode(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="mock">Mock Mode</option>
            <option value="shadow">Shadow Mode</option>
            <option value="production">Production Mode</option>
          </select>
          <span className={`px-3 py-1 text-sm font-medium rounded ${executionMode === 'shadow' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
            {executionMode.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Execution Mode Warning */}
      {executionMode === 'shadow' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">Shadow Mode Active</h3>
              <p className="text-sm text-purple-700 mt-1">Real APIs are executing in read-only mode. No client-facing mutations or publishing actions are allowed.</p>
            </div>
          </div>
        </div>
      )}

      {/* API Costs Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">API Costs</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Cost</div>
            <div className="text-2xl font-bold text-gray-900">${apiCosts.totalCost.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Credits</div>
            <div className="text-2xl font-bold text-gray-900">{apiCosts.totalCredits.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total API Calls</div>
            <div className="text-2xl font-bold text-gray-900">{apiCosts.totalApiCalls.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Avg Cost/Call</div>
            <div className="text-2xl font-bold text-gray-900">${(apiCosts.totalCost / apiCosts.totalApiCalls).toFixed(4)}</div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {Object.entries(apiCosts.byConnector).map(([connector, data]) => (
            <div key={connector} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{connector}</span>
              <span className="text-gray-900">${data.cost.toFixed(2)} ({data.calls} calls)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Executions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Live Executions</h3>
        <div className="space-y-3">
          {liveExecutions.map((execution) => (
            <div key={execution.id} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(execution.status)}`}>
                  {execution.status.toUpperCase()}
                </span>
                <div>
                  <div className="font-medium text-gray-900">{execution.connector}</div>
                  <div className="text-sm text-gray-500">{execution.operation}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900">{execution.duration}ms</div>
                <div className="text-xs text-gray-500">{new Date(execution.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connector Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Connector Health</h3>
        <div className="space-y-3">
          {connectorHealth.map((health) => (
            <div key={health.connector} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getReliabilityColor(health.reliabilityScore)}`}>
                  {health.reliabilityScore}/100
                </span>
                <div>
                  <div className="font-medium text-gray-900">{health.connector}</div>
                  <div className="text-sm text-gray-500">Uptime: {health.uptime}% | Latency: {health.averageLatency}ms</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900">Failure Rate: {health.failureRate}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Failures */}
      {apiFailures.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-md font-semibold text-red-900 mb-4">API Failures</h3>
          <div className="space-y-3">
            {apiFailures.map((failure) => (
              <div key={failure.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(failure.severity)}`}>
                    {failure.severity.toUpperCase()}
                  </span>
                  <div>
                    <div className="font-medium text-red-900">{failure.connector}</div>
                    <div className="text-sm text-red-700">{failure.error}</div>
                  </div>
                </div>
                <div className="text-xs text-red-600">
                  {new Date(failure.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retry Storms */}
      {retryStorms.some(storm => storm.active) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-md font-semibold text-orange-900 mb-4">Retry Storms Detected</h3>
          <div className="space-y-3">
            {retryStorms.filter(storm => storm.active).map((storm, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-orange-900">{storm.connector}</div>
                  <div className="text-sm text-orange-700">{storm.retryCount} retries (threshold: {storm.threshold})</div>
                </div>
                <span className="px-3 py-1 text-sm font-medium rounded bg-orange-100 text-orange-800">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payload Anomalies */}
      {payloadAnomalies.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-md font-semibold text-yellow-900 mb-4">Payload Anomalies</h3>
          <div className="space-y-2">
            {payloadAnomalies.map((anomaly, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-yellow-800">{anomaly.connector}: {anomaly.type}</span>
                <span className="text-yellow-900 font-medium">{anomaly.count} occurrences</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OAuth Issues */}
      {oauthIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-md font-semibold text-red-900 mb-4">OAuth Issues</h3>
          <div className="space-y-2">
            {oauthIssues.map((issue, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-red-800">{issue.connector}: {issue.issue}</span>
                <span className="text-red-900 font-medium">{issue.count} occurrences</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rate Limiting Events */}
      {rateLimitingEvents.some(event => event.percentage >= 90) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-md font-semibold text-yellow-900 mb-4">Rate Limiting Warnings</h3>
          <div className="space-y-3">
            {rateLimitingEvents.filter(event => event.percentage >= 90).map((event, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-yellow-900">{event.connector}</div>
                  <div className="text-sm text-yellow-700">{event.used} / {event.limit} requests</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-yellow-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${event.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-yellow-900">{event.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

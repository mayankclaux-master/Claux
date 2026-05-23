/**
 * Platform Test Dashboard
 * 
 * Internal testing dashboard page showing execution metrics, failure metrics, tenant isolation status, cron reliability, cache health, connector reliability, onboarding success rate.
 */

'use client';

import { useState, useEffect } from 'react';
import { tenantIsolationSpec } from '@/lib/testing/tenant-isolation.spec';
import { cacheConsistencySpec } from '@/lib/testing/cache-consistency.spec';
import { cronReliabilitySpec } from '@/lib/testing/cron-reliability.spec';
import { vercelRuntimeSpec } from '@/lib/testing/vercel-runtime.spec';
import { onboardingResilienceSpec } from '@/lib/testing/onboarding-resilience.spec';
import { executionSimulator } from '@/lib/testing/execution-simulator';
import { loadSimulator } from '@/lib/testing/load-simulator';
import { failureInjectionSystem } from '@/lib/testing/failure-injection';

export default function PlatformTestDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState({
    tenantIsolation: null as any,
    cacheConsistency: null as any,
    cronReliability: null as any,
    vercelRuntime: null as any,
    onboardingResilience: null as any,
    executionSimulation: null as any,
    loadSimulation: null as any,
    failureInjection: null as any,
  });

  const runAllTests = async () => {
    setIsRunning(true);

    try {
      // Run all test suites
      const [tenantIsolation, cacheConsistency, cronReliability, vercelRuntime, onboardingResilience] = await Promise.all([
        tenantIsolationSpec.runAllTests(),
        cacheConsistencySpec.runAllTests(),
        cronReliabilitySpec.runAllTests(),
        vercelRuntimeSpec.runAllTests(),
        onboardingResilienceSpec.runAllTests(),
      ]);

      // Run simulations
      const executionSimulation = await executionSimulator.runSimulation();
      const loadSimulation = await loadSimulator.runSimulation();
      const loadSummary = loadSimulator.getMetricsSummary();

      // Get failure injection stats
      const failureStats = failureInjectionSystem.getFailureStatistics();

      setResults({
        tenantIsolation: tenantIsolationSpec.getSummary(),
        cacheConsistency: cacheConsistencySpec.getSummary(),
        cronReliability: cronReliabilitySpec.getSummary(),
        vercelRuntime: vercelRuntimeSpec.getSummary(),
        onboardingResilience: onboardingResilienceSpec.getSummary(),
        executionSimulation: executionSimulation.statistics,
        loadSimulation: loadSummary,
        failureInjection: failureStats,
      });
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color = 'blue' }: { title: string; value: string | number; subtitle?: string; color?: string }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  const TestSection = ({ title, summary, color = 'blue' }: { title: string; summary: any; color?: string }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Tests" value={summary?.total || 0} color={color} />
        <StatCard title="Passed" value={summary?.passed || 0} color="green" />
        <StatCard title="Failed" value={summary?.failed || 0} color="red" />
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Pass Rate</span>
          <span>{summary?.passRate?.toFixed(1) || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`bg-${color}-500 h-2 rounded-full`}
            style={{ width: `${summary?.passRate || 0}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Test Dashboard</h1>
          <p className="text-gray-600 mt-2">Internal testing dashboard for CLAUX V1 platform reliability</p>
        </div>

        <div className="mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        {results.tenantIsolation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TestSection title="Tenant Isolation Tests" summary={results.tenantIsolation} color="blue" />
              <TestSection title="Cache Consistency Tests" summary={results.cacheConsistency} color="purple" />
              <TestSection title="Cron Reliability Tests" summary={results.cronReliability} color="green" />
              <TestSection title="Vercel Runtime Safety Tests" summary={results.vercelRuntime} color="orange" />
              <TestSection title="Onboarding Resilience Tests" summary={results.onboardingResilience} color="pink" />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Simulation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Executions" value={results.executionSimulation?.totalExecutions || 0} />
                <StatCard title="Successful" value={results.executionSimulation?.successfulExecutions || 0} color="green" />
                <StatCard title="Failed" value={results.executionSimulation?.failedExecutions || 0} color="red" />
                <StatCard title="Avg Duration" value={`${Math.round(results.executionSimulation?.averageDuration || 0)}ms`} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Load Simulation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Success Rate" value={`${Math.round(results.loadSimulation?.successRate || 0)}%`} color="green" />
                <StatCard title="Timeout Rate" value={`${Math.round(results.loadSimulation?.timeoutRate || 0)}%`} color="orange" />
                <StatCard title="Lock Contention" value={`${Math.round(results.loadSimulation?.lockContentionRate || 0)}%`} color="red" />
                <StatCard title="Dashboard Freshness" value={`${Math.round(results.loadSimulation?.dashboardFreshness || 0)}%`} color="blue" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Failure Injection</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Failures" value={results.failureInjection?.total || 0} color="red" />
                <StatCard title="Connector Failures" value={results.failureInjection?.byType?.connector_failure || 0} />
                <StatCard title="Timeouts" value={results.failureInjection?.byType?.timeout || 0} />
                <StatCard title="Auth Failures" value={results.failureInjection?.byType?.auth_failure || 0} />
              </div>
            </div>
          </div>
        )}

        {!results.tenantIsolation && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Click "Run All Tests" to execute the test suite</p>
          </div>
        )}
      </div>
    </div>
  );
}

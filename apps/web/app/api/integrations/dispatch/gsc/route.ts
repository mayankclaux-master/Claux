/**
 * GSC Dispatch Route
 * 
 * Phase Z5 - Real Execution Cutover
 * Canonical n8n bridge for GSC provider execution.
 * 
 * Responsibilities:
 * - signed payload generation
 * - execution correlation
 * - tenant correlation
 * - replay metadata
 * - trace metadata
 * - dispatch receipt generation
 * - CORE governance enforcement on failures
 * 
 * NO BUSINESS LOGIC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { IntegrationDispatcher, createIntegrationDispatcher } from '@/lib/integrations/mesh/dispatchers';
import { IntegrationRequest, IntegrationContract } from '@/lib/integrations/mesh/contracts';
import { RuntimeService } from '@/lib/runtime/services/runtime.service';
import { createCoreProviderGovernance } from '@/lib/integrations/mesh/governance/core-provider-governance';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { executionId, tenantId, agentName, action, payload, correlationId, replayId } = body;

    // Validate required fields
    if (!executionId || !tenantId || !agentName || !action || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user profile for tenant validation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile to validate tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, workspace_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant mismatch' },
        { status: 403 }
      );
    }

    // Initialize CORE governance
    const runtime = new RuntimeService({ tenantId, logOperations: true, enableMetrics: true });
    const governance = createCoreProviderGovernance(runtime);

    // Check if provider is in cooldown
    if (governance.isProviderInCooldown('gsc')) {
      return NextResponse.json(
        { error: 'Provider in cooldown' },
        { status: 503 }
      );
    }

    // Check if provider is quarantined
    if (governance.isProviderQuarantined('gsc')) {
      return NextResponse.json(
        { error: 'Provider quarantined' },
        { status: 503 }
      );
    }

    // Create integration request
    const integrationRequest: IntegrationRequest = {
      executionId,
      tenantId,
      agentName,
      provider: 'gsc',
      action,
      payload,
      correlationId: correlationId || IntegrationContract.generateCorrelationId(),
      replayId,
      timestamp: new Date().toISOString(),
    };

    // Create dispatcher
    const dispatcher = createIntegrationDispatcher({
      webhookUrl: process.env.N8N_WEBHOOK_URL || '',
      apiKey: process.env.N8N_API_KEY,
      timeoutMs: 30000,
    });

    // Dispatch to n8n
    const result = await dispatcher.dispatch(integrationRequest);

    // Handle dispatch failure with CORE governance
    if (!result.success) {
      await governance.handleProviderFailure('gsc', tenantId, executionId, result.error || 'Dispatch failed');
      
      // Check failure count for escalation
      const failureCount = governance.getProviderFailureCount('gsc');
      if (failureCount >= 3) {
        // Activate cooldown
        const cooldownUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minute cooldown
        await governance.handleProviderCooldown('gsc', cooldownUntil, tenantId, executionId);
      }
    }

    // Emit provider state event
    await runtime.event.publishEvent({
      tenant_id: tenantId,
      execution_id: executionId,
      event_name: result.success ? 'provider_dispatched' : 'provider_dispatch_failed',
      event_source: 'gsc',
      payload: {
        provider: 'gsc',
        success: result.success,
        tenantId,
      },
    });

    return NextResponse.json({
      success: result.success,
      receipt: result.receipt,
      error: result.error,
    });
  } catch (error) {
    console.error('GSC dispatch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

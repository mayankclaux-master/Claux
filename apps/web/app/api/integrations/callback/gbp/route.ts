/**
 * GBP Callback Route
 * 
 * Canonical callback handler for GBP provider.
 * 
 * Responsibilities:
 * - verify signatures
 * - validate replay safety
 * - prevent duplicates
 * - reconstruct runtime context
 * - emit runtime events
 * - continue execution safely
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CallbackIngestion, createCallbackIngestion } from '@/lib/integrations/mesh/callbacks';
import { WebhookCallback } from '@/lib/integrations/mesh/contracts';
import { RuntimeService } from '@/lib/runtime/services/runtime.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { executionId, tenantId, correlationId, provider, payload, timestamp, signature, replayToken } = body;

    // Validate required fields
    if (!executionId || !tenantId || !correlationId || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify provider is GBP
    if (provider !== 'gbp') {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Create webhook callback
    const callback: WebhookCallback = {
      executionId,
      tenantId,
      correlationId,
      provider,
      payload: payload || {},
      timestamp: timestamp || new Date().toISOString(),
      signature,
      replayToken,
    };

    // Create runtime service
    const runtime = new RuntimeService({
      tenantId,
      logOperations: true,
      enableMetrics: true,
    });

    // Create callback ingestion
    const ingestion = createCallbackIngestion(runtime);

    // Process callback
    await ingestion.process(callback);

    return NextResponse.json({
      success: true,
      message: 'Callback processed',
    });
  } catch (error) {
    console.error('GBP callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

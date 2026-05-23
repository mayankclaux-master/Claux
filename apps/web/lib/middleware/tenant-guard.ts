/**
 * TenantGuard Middleware
 * 
 * Centralized tenant validation middleware for CLAUX V1.
 * Validates authenticated tenant, validates tenant ownership, blocks cross-tenant access.
 * 
 * CRITICAL: This is the ONLY tenant validation middleware in CLAUX.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';

/**
 * TenantGuard options
 */
export interface TenantGuardOptions {
  requireTenant?: boolean;
  requireWorkspace?: boolean;
  checkTenantActive?: boolean;
}

/**
 * Tenant validation result
 */
export interface TenantValidationResult {
  success: boolean;
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  error?: string;
}

/**
 * Validate tenant from request
 */
export async function validateTenant(
  request: NextRequest,
  options: TenantGuardOptions = {}
): Promise<TenantValidationResult> {
  const {
    requireTenant = true,
    requireWorkspace = false,
    checkTenantActive = true,
  } = options;

  try {
    // Get auth from Clerk
    const { userId, getToken } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized: No user ID',
      };
    }

    const token = await getToken({ template: 'supabase' });

    if (!token) {
      return {
        success: false,
        error: 'Unauthorized: No Supabase token',
      };
    }

    // Create Supabase client
    const supabase = createClerkSupabaseClient(token);

    // Get profile with tenant and workspace
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tenant_id, workspace_id, tenant_status')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return {
        success: false,
        error: `Profile lookup failed: ${profileError.message}`,
      };
    }

    if (!profile) {
      return {
        success: false,
        error: 'Profile not found',
      };
    }

    // Check tenant requirement
    if (requireTenant && !profile.tenant_id) {
      return {
        success: false,
        error: 'Tenant not found',
      };
    }

    // Check workspace requirement
    if (requireWorkspace && !profile.workspace_id) {
      return {
        success: false,
        error: 'Workspace not found',
      };
    }

    // Check tenant active status
    if (checkTenantActive && profile.tenant_status === 'inactive') {
      return {
        success: false,
        error: 'Tenant is inactive',
      };
    }

    return {
      success: true,
      userId: profile.id,
      tenantId: profile.tenant_id || undefined,
      workspaceId: profile.workspace_id || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * TenantGuard middleware function
 * Use this in API routes to validate tenant
 */
export async function withTenantGuard(
  request: NextRequest,
  handler: (request: NextRequest, tenantId: string, userId: string, workspaceId?: string) => Promise<NextResponse>,
  options: TenantGuardOptions = {}
): Promise<NextResponse> {
  const validation = await validateTenant(request, options);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401 }
    );
  }

  if (!validation.tenantId) {
    return NextResponse.json(
      { error: 'Tenant ID required' },
      { status: 400 }
    );
  }

  if (!validation.userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 400 }
    );
  }

  return handler(request, validation.tenantId, validation.userId, validation.workspaceId);
}

/**
 * Extract tenant ID from request (for internal use)
 */
export async function extractTenantId(request: NextRequest): Promise<string | null> {
  const validation = await validateTenant(request, { requireTenant: true });
  return validation.tenantId || null;
}

/**
 * Extract user ID from request (for internal use)
 */
export async function extractUserId(request: NextRequest): Promise<string | null> {
  const validation = await validateTenant(request);
  return validation.userId || null;
}

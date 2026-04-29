import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BootstrapTenantResult } from "@/types/rpc";

export type WorkspaceStatus = "healthy" | "provisioning" | "failed";

export type WorkspaceResult = {
  status: WorkspaceStatus;
  tenantId?: string;
  error?: string;
  eventId: string;
};

const MAX_AUTH_WAIT_MS = 8000;
const AUTH_POLL_INTERVAL_MS = 500;
const MAX_RPC_RETRIES = 2;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAuthUser(adminClient: SupabaseClient, userId: string) {
  const deadline = Date.now() + MAX_AUTH_WAIT_MS;

  while (Date.now() < deadline) {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);

    if (!error && data?.user?.id) {
      return true;
    }

    await sleep(AUTH_POLL_INTERVAL_MS);
  }

  return false;
}

export async function ensureWorkspaceForUser(
  userId: string,
  meta?: {
    businessName?: string;
    fullName?: string | null;
  }
): Promise<WorkspaceResult> {
  const eventId = `ws_${userId.slice(0, 8)}_${Date.now()}`;
  const adminClient = createSupabaseAdminClient();

  const authReady = await waitForAuthUser(adminClient, userId);

  if (!authReady) {
    console.error({ eventId, userId, step: "auth_wait", msg: "AUTH_USER_SYNC_TIMEOUT" });
    return { status: "failed", error: "AUTH_USER_SYNC_TIMEOUT", eventId };
  }

  // Retry RPC call with fail-safe
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RPC_RETRIES; attempt++) {
    const { data, error } = await adminClient.rpc("bootstrap_tenant_for_user", {
      p_user_id: userId
    });

    if (error) {
      lastError = error;
      console.warn({ eventId, userId, attempt, step: "rpc", msg: error.message, code: error.code });
      if (attempt < MAX_RPC_RETRIES) {
        await sleep(500 * (attempt + 1)); // Exponential backoff
        continue;
      }
      console.error({ eventId, userId, step: "rpc", msg: error.message, code: error.code });
      return { status: "failed", error: error.message, eventId };
    }

    const result = (data ?? {}) as BootstrapTenantResult;
    const tenantId = typeof result.tenant_id === "string" ? result.tenant_id : undefined;

    if (!tenantId) {
      console.error({ eventId, userId, step: "rpc", msg: "MISSING_TENANT_ID", payload: result });
      return { status: "failed", error: "MISSING_TENANT_ID", eventId };
    }

    console.info({ eventId, userId, step: "provisioned", rpcStatus: result.status, tenantId });

    // If tenant already exists but provisioning failed, return healthy to avoid loop
    if (result.status === "already_exists") {
      return { status: "healthy", tenantId, eventId };
    }

    return { status: "healthy", tenantId, eventId };
  }

  // Should not reach here, but fail-safe
  console.error({ eventId, userId, step: "rpc", msg: "MAX_RETRIES_EXCEEDED", error: lastError?.message });
  return { status: "failed", error: lastError?.message || "MAX_RETRIES_EXCEEDED", eventId };
}

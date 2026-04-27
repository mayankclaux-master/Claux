import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type WorkspaceStatus = "healthy" | "provisioning" | "failed";

export type WorkspaceResult = {
  status: WorkspaceStatus;
  orgId?: string;
  error?: string;
  eventId: string;
};

type ProvisioningRpcResult = {
  status?: string;
  org_id?: string;
};

const MAX_AUTH_WAIT_MS = 8000;
const AUTH_POLL_INTERVAL_MS = 500;

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

  const { data, error } = await adminClient.rpc("bootstrap_organization_for_user", {
    p_user_id: userId,
    p_business_name: meta?.businessName ?? "My Business",
    p_full_name: meta?.fullName ?? ""
  });

  if (error) {
    console.error({ eventId, userId, step: "rpc", msg: error.message, code: error.code });
    return { status: "failed", error: error.message, eventId };
  }

  const result = (data ?? {}) as ProvisioningRpcResult;
  const orgId = typeof result.org_id === "string" ? result.org_id : undefined;

  if (!orgId) {
    console.error({ eventId, userId, step: "rpc", msg: "MISSING_ORG_ID", payload: result });
    return { status: "failed", error: "MISSING_ORG_ID", eventId };
  }

  console.info({ eventId, userId, step: "provisioned", rpcStatus: result.status ?? "unknown", orgId });

  return { status: "healthy", orgId, eventId };
}

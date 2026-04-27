import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BOOTSTRAP_RETRIES = 3;
const PROFILE_SYNC_WAIT_MS = 3000;
const PROFILE_SYNC_POLL_INTERVAL_MS = 250;

type BootstrapError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type EnsureWorkspaceParams = {
  adminClient: SupabaseClient;
  userId: string;
  businessName: string;
  fullName: string | null;
};

function isBootstrapRetryable(errorMessage: string | undefined, errorDetails: string | undefined) {
  const haystack = `${errorMessage ?? ""} ${errorDetails ?? ""}`.toLowerCase();
  return haystack.includes("foreign key") || haystack.includes("created_by");
}

function shouldFallbackToDirectBootstrap(
  errorCode: string | undefined,
  errorMessage: string | undefined,
  errorHint: string | undefined
) {
  const message = (errorMessage ?? "").toLowerCase();
  const hint = (errorHint ?? "").toLowerCase();
  return (
    errorCode === "PGRST202" ||
    message.includes("function") ||
    message.includes("not found") ||
    message.includes("created_by") ||
    hint.includes("function") ||
    hint.includes("overload")
  );
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProfileSync(adminClient: SupabaseClient, userId: string, waitMs = PROFILE_SYNC_WAIT_MS) {
  const maxAttempts = Math.max(1, Math.ceil(waitMs / PROFILE_SYNC_POLL_INTERVAL_MS));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!error && profile?.id) {
      return { found: true as const, error: null };
    }

    if (error) {
      return {
        found: false as const,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      };
    }

    if (attempt < maxAttempts) {
      await sleep(PROFILE_SYNC_POLL_INTERVAL_MS);
    }
  }

  return { found: false as const, error: null };
}

export async function bootstrapWorkspaceWithRetry({
  adminClient,
  userId,
  businessName,
  fullName
}: EnsureWorkspaceParams): Promise<BootstrapError | null> {
  let lastError: BootstrapError | null = null;

  for (let attempt = 1; attempt <= MAX_BOOTSTRAP_RETRIES; attempt += 1) {
    const { error } = await adminClient.rpc("bootstrap_organization_for_user", {
      p_business_name: businessName,
      p_full_name: fullName,
      p_user_id: userId
    });

    if (!error) {
      return null;
    }

    lastError = {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    };

    if (!isBootstrapRetryable(error.message, error.details) || attempt === MAX_BOOTSTRAP_RETRIES) {
      break;
    }

    await sleep(attempt * 250);
  }

  return lastError;
}

export async function bootstrapWorkspaceDirect({
  adminClient,
  userId,
  businessName,
  fullName
}: EnsureWorkspaceParams): Promise<BootstrapError | null> {
  const orgInsertWithCreatedBy = await adminClient
    .from("organizations")
    .insert({ name: businessName, created_by: userId })
    .select("id")
    .single();

  let orgId: string | null = null;

  if (!orgInsertWithCreatedBy.error) {
    orgId = orgInsertWithCreatedBy.data?.id ?? null;
  } else {
    const createdByMissing =
      orgInsertWithCreatedBy.error.code === "42703" ||
      (orgInsertWithCreatedBy.error.message ?? "").toLowerCase().includes("created_by");

    if (!createdByMissing) {
      return {
        message: orgInsertWithCreatedBy.error.message,
        details: orgInsertWithCreatedBy.error.details,
        hint: orgInsertWithCreatedBy.error.hint,
        code: orgInsertWithCreatedBy.error.code
      };
    }

    const orgInsertWithoutCreatedBy = await adminClient
      .from("organizations")
      .insert({ name: businessName })
      .select("id")
      .single();

    if (orgInsertWithoutCreatedBy.error || !orgInsertWithoutCreatedBy.data?.id) {
      return {
        message: orgInsertWithoutCreatedBy.error?.message,
        details: orgInsertWithoutCreatedBy.error?.details,
        hint: orgInsertWithoutCreatedBy.error?.hint,
        code: orgInsertWithoutCreatedBy.error?.code
      };
    }

    orgId = orgInsertWithoutCreatedBy.data.id;
  }

  if (!orgId) {
    return { message: "Failed to create organization row." };
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: userId,
      org_id: orgId,
      full_name: fullName,
      role: "owner"
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code
    };
  }

  return null;
}

export async function ensureWorkspaceForUser(params: EnsureWorkspaceParams): Promise<BootstrapError | null> {
  const profileSync = await waitForProfileSync(params.adminClient, params.userId);

  if (profileSync.error) {
    return profileSync.error;
  }

  if (profileSync.found) {
    return null;
  }

  const rpcError = await bootstrapWorkspaceWithRetry(params);

  if (!rpcError) {
    return null;
  }

  if (!shouldFallbackToDirectBootstrap(rpcError.code, rpcError.message, rpcError.hint)) {
    return rpcError;
  }

  return bootstrapWorkspaceDirect(params);
}

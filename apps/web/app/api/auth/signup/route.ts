import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_BOOTSTRAP_RETRIES = 3;
const USER_LIST_PAGE_SIZE = 200;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isAlreadyRegisteredError(message: string | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return normalized.includes("already registered") || normalized.includes("already exists");
}

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

async function findUserIdByEmail(adminClient: ReturnType<typeof createSupabaseAdminClient>, email: string) {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: USER_LIST_PAGE_SIZE
    });

    if (error) {
      return { userId: null, error };
    }

    const user = data.users.find((entry) => entry.email?.toLowerCase() === email);
    if (user?.id) {
      return { userId: user.id, error: null };
    }

    if (data.users.length < USER_LIST_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return { userId: null, error: null };
}

async function bootstrapWorkspaceWithRetry(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  businessName: string,
  fullName: string | null
) {
  let lastError: { message?: string; details?: string; hint?: string; code?: string } | null = null;

  for (let attempt = 1; attempt <= MAX_BOOTSTRAP_RETRIES; attempt += 1) {
    const payload = {
      p_business_name: businessName,
      p_full_name: fullName,
      p_user_id: userId
    };

    console.log("[DEBUG] RPC Payload:", payload);

    const { error } = await adminClient.rpc("bootstrap_organization_for_user", payload);

    if (!error) {
      return null;
    }

    console.error("[signup] bootstrap rpc raw error", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });

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

async function bootstrapWorkspaceDirect(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  businessName: string,
  fullName: string | null
) {
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

export async function POST(request: Request) {
  const { email, password, businessName, fullName } = await request.json();

  if (!email || !password || !businessName) {
    return NextResponse.json({ error: "Email, password, and business name are required." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(String(email));
  const normalizedBusinessName = String(businessName).trim();
  const normalizedFullName = String(fullName ?? "").trim() || null;
  const isDevelopment = process.env.NODE_ENV !== "production";

  let userId: string | null = null;
  let wasCreatedInRequest = false;

  console.log("--- ATTEMPTING SUPABASE AUTH CREATE ---");
  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: isDevelopment,
    user_metadata: normalizedFullName ? { full_name: normalizedFullName } : undefined
  });

  if (createError) {
    const createErrorMessage = createError.message ?? "";
    const isFetchError = createErrorMessage.toLowerCase().includes("fetch");
    console.error("[signup] createUser failed", {
      email: normalizedEmail,
      message: createError.message,
      code: createError.code,
      status: createError.status,
      isFetchError
    });

    if (!isAlreadyRegisteredError(createError.message)) {
      return NextResponse.json({ error: createError.message ?? "Signup failed." }, { status: 400 });
    }

    const lookup = await findUserIdByEmail(adminClient, normalizedEmail);

    if (lookup.error) {
      console.error("[signup] failed to resolve existing user", {
        email: normalizedEmail,
        message: lookup.error.message
      });
      return NextResponse.json({ error: "Could not look up existing account." }, { status: 500 });
    }

    if (!lookup.userId) {
      return NextResponse.json(
        { error: "Account already exists. Please sign in or reset your password." },
        { status: 409 }
      );
    }

    userId = lookup.userId;
  } else {
    userId = createData.user?.id ?? null;
    wasCreatedInRequest = true;
  }

  if (!userId) {
    return NextResponse.json({ error: "Signup failed. Missing user id." }, { status: 500 });
  }

  const { data: existingProfile, error: profileLookupError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileLookupError) {
    console.error("[signup] profile lookup failed", {
      userId,
      message: profileLookupError.message,
      details: profileLookupError.details,
      code: profileLookupError.code
    });
    return NextResponse.json({ error: "Could not verify tenant workspace." }, { status: 500 });
  }

  if (!existingProfile) {
    const bootstrapError = await bootstrapWorkspaceWithRetry(
      adminClient,
      userId,
      normalizedBusinessName,
      normalizedFullName
    );

    if (bootstrapError) {
      let resolvedBootstrapError = bootstrapError;

      if (shouldFallbackToDirectBootstrap(bootstrapError.code, bootstrapError.message, bootstrapError.hint)) {
        console.warn("[signup] rpc bootstrap failed, attempting direct bootstrap fallback", {
          userId,
          email: normalizedEmail,
          message: bootstrapError.message,
          hint: bootstrapError.hint,
          code: bootstrapError.code
        });

        const directBootstrapError = await bootstrapWorkspaceDirect(
          adminClient,
          userId,
          normalizedBusinessName,
          normalizedFullName
        );

        if (!directBootstrapError) {
          return NextResponse.json({ success: true, emailConfirmed: isDevelopment, bootstrapMode: "direct" });
        }

        resolvedBootstrapError = directBootstrapError;
      }

      console.error("[signup] bootstrap_organization_for_user failed", {
        userId,
        email: normalizedEmail,
        message: resolvedBootstrapError.message,
        details: resolvedBootstrapError.details,
        hint: resolvedBootstrapError.hint,
        code: resolvedBootstrapError.code
      });

      return NextResponse.json(
        {
          error: "Could not create tenant workspace.",
          details: isDevelopment ? resolvedBootstrapError.message ?? null : null
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, emailConfirmed: isDevelopment });
}

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function createSupabaseAdminClient() {
  const normalizedUrl = normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);

  return createClient(normalizedUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function createClerkSupabaseClient(token: string) {
  const normalizedUrl = normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);

  return createClient(normalizedUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    accessToken: async () => token,
  });
}

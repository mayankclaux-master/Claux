import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function createSupabaseBrowserClient() {
  // Import env at function scope to defer validation until runtime
  // This prevents module evaluation failures in client-side bundles
  const { env } = require("@/lib/env");
  return createClient(normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL), env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {}
  });
}

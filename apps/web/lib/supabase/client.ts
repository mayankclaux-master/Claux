import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function createSupabaseBrowserClient() {
  return createClient(normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL), env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {}
  });
}

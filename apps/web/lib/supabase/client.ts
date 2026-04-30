import { createBrowserClient } from "@supabase/ssr";

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

export function createSupabaseBrowserClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("CRITICAL: Database Keys Missing");
    }

    return createBrowserClient(normalizeSupabaseUrl(supabaseUrl), supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
      }
    });
  } catch (error) {
    console.error("CRITICAL: Database Keys Missing", error);
    return "CRITICAL: Database Keys Missing" as never;
  }
}

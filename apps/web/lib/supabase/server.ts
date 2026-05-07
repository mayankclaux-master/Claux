import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL),
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {},
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            return;
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            return;
          }
        }
      }
    }
  );
}

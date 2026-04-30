import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

export function createSupabaseServerClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("CRITICAL: Database Keys Missing");
    }

    const cookieStore = cookies();

    return createServerClient(
      normalizeSupabaseUrl(supabaseUrl),
      supabaseAnonKey,
      {
        auth: {
          flowType: 'pkce',
        },
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
  } catch (error) {
    console.error("CRITICAL: Database Keys Missing", error);
    return "CRITICAL: Database Keys Missing" as never;
  }
}

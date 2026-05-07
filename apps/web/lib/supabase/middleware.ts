import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL),
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          req.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          req.cookies.set({ name, value: "", ...options });
          res.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );
}

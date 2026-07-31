import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/database.types";

export type MiddlewareSupabaseClient = ReturnType<typeof createServerClient<Database>>;

export function createClient(request: NextRequest): {
  supabase: MiddlewareSupabaseClient | null;
  response: NextResponse;
} {
  const url = env.supabaseUrl;
  const key = env.supabaseAnonKey;

  if (!url || !key) {
    console.warn(
      "[Supabase] Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (local development) or in " +
        "Vercel Project Settings > Environment Variables (production), then redeploy. " +
        "Admin route protection is disabled until configured.",
    );
    return {
      supabase: null,
      response: NextResponse.next({ request }),
    };
  }

  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  return { supabase, response: supabaseResponse };
}

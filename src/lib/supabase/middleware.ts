import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/database.types";

export function createClient(request: NextRequest) {
  const url = env.supabaseUrl;
  const key = env.supabaseAnonKey;

  if (!url || !key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Middleware client will not be available until these are set.",
      );
    }
    return {
      supabase: null as unknown as ReturnType<typeof createServerClient<Database>>,
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

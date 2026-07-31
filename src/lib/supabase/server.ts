import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  const url = env.supabaseUrl;
  const key = env.supabaseAnonKey;

  if (!url || !key) {
    throw new Error(
      "[Supabase] Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (local development) or in " +
        "Vercel Project Settings > Environment Variables (production), then redeploy.",
    );
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — ignore and revalidate on next request
        }
      },
    },
  });
}

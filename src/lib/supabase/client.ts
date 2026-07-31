"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) return client;

  const url = env.supabaseUrl;
  const key = env.supabaseAnonKey;

  if (!url || !key) {
    throw new Error(
      "[Supabase] Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (local development) or in " +
        "Vercel Project Settings > Environment Variables (production), then redeploy.",
    );
  }

  client = createBrowserClient<Database>(url, key, {
    cookies: {
      get(name) {
        if (typeof document === "undefined") return "";
        const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
        return cookie ? cookie.split("=")[1] : "";
      },
      set(name, value, options) {
        if (typeof document === "undefined") return;
        document.cookie = `${name}=${value}; path=/; max-age=${options?.maxAge ?? 60 * 60 * 24 * 365}`;
      },
      remove(name) {
        if (typeof document === "undefined") return;
        document.cookie = `${name}=; path=/; max-age=0`;
      },
    },
  });

  return client;
}

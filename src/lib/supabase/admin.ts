import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/database.types";

let client: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (client) return client;

  const url = env.supabaseUrl;
  const key = env.supabaseServiceRoleKey;

  if (!url || !key) {
    throw new Error(
      "[Supabase] Admin client is not configured: set SUPABASE_SERVICE_ROLE_KEY " +
        "(and NEXT_PUBLIC_SUPABASE_URL) in .env.local (local development) or in " +
        "Vercel Project Settings > Environment Variables (production), then redeploy. " +
        "This key must NEVER be exposed to the browser.",
    );
  }

  client = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

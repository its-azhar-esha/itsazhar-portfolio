import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import type { Database } from "@/database.types"

let client: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  if (client) return client

  const url = env.supabaseUrl
  const key = env.supabaseServiceRoleKey

  if (!url || !key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase] Missing SUPABASE_SERVICE_ROLE_KEY. " +
          "Admin client will not be available until this is set. " +
          "This key must NEVER be exposed to the browser."
      )
    }
    return null as unknown as ReturnType<typeof createClient<Database>>
  }

  client = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return client
}

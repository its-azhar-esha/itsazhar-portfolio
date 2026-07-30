import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { env } from "@/lib/env"
import type { Database } from "@/database.types"

export async function createClient() {
  const cookieStore = await cookies()

  const url = env.supabaseUrl
  const key = env.supabaseAnonKey

  if (!url || !key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Server component client will not be available until these are set."
      )
    }
    return null as unknown as ReturnType<typeof createServerClient<Database>>
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component — ignore and revalidate on next request
        }
      },
    },
  })
}

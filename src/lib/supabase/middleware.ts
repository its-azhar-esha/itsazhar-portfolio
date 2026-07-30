import { createServerClient } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/env"
import type { Database } from "@/database.types"

export function createClient(request: NextRequest, response: NextResponse) {
  const url = env.supabaseUrl
  const key = env.supabaseAnonKey

  if (!url || !key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Middleware client will not be available until these are set."
      )
    }
    return null as unknown as ReturnType<typeof createServerClient<Database>>
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })
}

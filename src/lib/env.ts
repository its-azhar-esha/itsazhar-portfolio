/**
 * Environment access.
 *
 * IMPORTANT: only use static member access (`process.env.NEXT_PUBLIC_*`).
 * Dynamic access (`process.env[key]`) works at runtime on the Node server
 * but is silently broken in production browser bundles: bundlers replace
 * `process.env` with a static object (Turbopack's polyfill starts with an
 * empty `env = {}`) and only inline statically analyzable member reads.
 * NEXT_PUBLIC_* values are inlined into client bundles at build time.
 */

const nextPublicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const nextPublicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
const groqApiKey = process.env.GROQ_API_KEY?.trim() ?? "";
const openrouterApiKey = process.env.OPENROUTER_API_KEY?.trim() ?? "";
const vercelToken = process.env.VERCEL_TOKEN?.trim() ?? "";

export const env = {
  groqApiKey,
  openrouterApiKey,
  hasGroq: groqApiKey !== "",
  hasOpenRouter: openrouterApiKey !== "",
  hasAI: groqApiKey !== "" || openrouterApiKey !== "",

  vercelToken,
  hasVercelToken: vercelToken !== "",

  supabaseUrl: nextPublicSupabaseUrl,
  supabaseAnonKey: nextPublicSupabaseAnonKey,
  supabaseServiceRoleKey,
  hasSupabase: nextPublicSupabaseUrl !== "" && nextPublicSupabaseAnonKey !== "",
};

export function getEnv(key: string, fallback = ""): string {
  return process.env[key]?.trim() || fallback;
}

export function hasEnv(key: string): boolean {
  const val = process.env[key]?.trim();
  return val !== undefined && val !== "";
}

export function requireEnv(key: string): string {
  const val = getEnv(key);
  if (!val) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[env] Missing required environment variable: ${key}. ` +
          "Check .env.example for the full list of required variables.",
      );
    }
    return "";
  }
  return val;
}

export const env = {
  groqApiKey: getEnv("GROQ_API_KEY"),
  openrouterApiKey: getEnv("OPENROUTER_API_KEY"),
  hasGroq: hasEnv("GROQ_API_KEY"),
  hasOpenRouter: hasEnv("OPENROUTER_API_KEY"),
  hasAI: hasEnv("GROQ_API_KEY") || hasEnv("OPENROUTER_API_KEY"),

  supabaseUrl: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  hasSupabase: hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};

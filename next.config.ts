import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
const supabaseOrigin = supabaseHostname ? `https://${supabaseHostname}` : undefined;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: supabaseHostname ? [{ protocol: "https", hostname: supabaseHostname }] : [],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
            "style-src 'self' 'unsafe-inline'",
            `img-src 'self' data: blob: ${supabaseOrigin ?? "https://*.supabase.co"} https://www.google-analytics.com`,
            "font-src 'self' data:",
            `connect-src 'self' ${supabaseOrigin ?? "https://*.supabase.co"} https://www.google-analytics.com https://api.groq.com https://openrouter.ai`,
            "frame-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ],
    },
  ],
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  generateEtags: true,
};

export default nextConfig;

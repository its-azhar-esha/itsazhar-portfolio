/**
 * Canonical site URL. Override with NEXT_PUBLIC_SITE_URL (Vercel env var)
 * once a custom domain is attached; defaults to the verified production
 * domain of this project.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  "https://itsazhar-portfolio.vercel.app";

export const SITE_URL_DEFAULT = "https://itsazhar-portfolio.vercel.app";

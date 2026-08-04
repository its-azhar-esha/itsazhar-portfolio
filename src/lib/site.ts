/**
 * Canonical site URL. Override with NEXT_PUBLIC_SITE_URL (Vercel env var)
 * once a custom domain is attached; defaults to the verified production
 * domain of this project. The runtime resolution order is:
 * monitoring_config.siteUrl (DB, admin-editable) -> NEXT_PUBLIC_SITE_URL ->
 * this fallback.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") || "https://itsazhar.com";

export const SITE_URL_DEFAULT = "https://itsazhar.com";

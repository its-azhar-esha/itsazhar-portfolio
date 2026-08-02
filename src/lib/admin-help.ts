/**
 * Admin help content registry.
 *
 * Every major admin section, feature and setting has a HelpEntry that the
 * HelpButton/HelpDialog UI renders. Each entry explains the full picture:
 * what it does, why it exists, when to use it, how it works, what happens
 * when it changes, best practices, and any notes or warnings.
 */

export type HelpSectionKind =
  "what" | "why" | "when" | "how" | "effects" | "best" | "notes" | "warning";

export interface HelpSection {
  kind: HelpSectionKind;
  title: string;
  body: string[];
  bullets?: string[];
}

export interface HelpEntry {
  id: string;
  title: string;
  summary: string;
  sections: HelpSection[];
}

function s(kind: HelpSectionKind, title: string, body: string[], bullets?: string[]): HelpSection {
  return { kind, title, body, bullets };
}

export function entry(
  id: string,
  title: string,
  summary: string,
  sections: HelpSection[],
): HelpEntry {
  return { id, title, summary, sections };
}

export const ADMIN_HELP: Record<string, HelpEntry> = {
  /* ─────────────────────────── Developer Tools ─────────────────────────── */

  "dx-page": entry(
    "dx-page",
    "Developer Tools page",
    "A diagnostic cockpit for the whole site: health checks, backups, schema drift, broken references, storage, and SEO validation.",
    [
      s("what", "What this page does", [
        "This page runs a full diagnostic sweep of the site's infrastructure and reports the results in one place: database and storage reachability, environment configuration, migrations, backups, storage usage, row counts, broken media references, RLS posture, SEO quality, and link validity.",
      ]),
      s("why", "Why it exists", [
        "Problems on a production site are easiest to fix when they are visible. Instead of checking logs, dashboards and database consoles separately, this page surfaces every important signal — and turns failures into clear red/amber/green badges.",
      ]),
      s("when", "When to use it", [
        "Check this page after every deployment, when something looks broken, before changing database settings, or as part of a weekly health routine. It is the first place to look when backups, media, or the admin panel behave unexpectedly.",
      ]),
      s("how", "How it works", [
        "Every time the page loads, the server runs real queries and outbound requests: Supabase database and storage calls, environment variable checks, local migration file reads, live link requests, and storage bucket listings. Results are grouped into the cards below.",
      ]),
      s("effects", "What happens when it changes", [
        "This page is read-only — opening or refreshing it never modifies any data. The only side effects are the queries and requests it runs, which take a few seconds on slow connections.",
        "Some cards below (link checker, health monitor) perform live outbound requests, so the page can take up to ~30 seconds if a link times out.",
      ]),
      s("best", "Best practices", [
        "Treat amber as 'needs attention soon' and red as 'fix now'.",
        "Use it after every deploy to confirm health, migrations and backups.",
        "Re-run the page before contacting support — the details shown here usually pinpoint the failing component.",
      ]),
      s("notes", "Important notes", [
        "The page intentionally shows only the presence of environment variables, never their values.",
        "Storage row counts list at most 1,000 objects per bucket, so very large buckets may show approximate numbers.",
      ]),
    ],
  ),

  "dx-config": entry(
    "dx-config",
    "Developer tools configuration",
    "Tuning knobs for the health ledger, link checker and SEO validator used by this page and the daily health/backup jobs.",
    [
      s("what", "What this is", [
        "A small set of settings stored in the site_settings database row. They control how much health history is recorded, how aggressively links are checked, and what the SEO validator treats as 'good'.",
      ]),
      s("why", "Why it exists", [
        "These knobs affect real behaviour (database writes, outbound requests, validation strictness). Keeping them configurable means you can tighten or relax checks without code changes.",
      ]),
      s("when", "When to change it", [
        "Only when you have a specific reason: links taking too long to check, too little health history, or SEO warnings you want to quiet down. Defaults are sane for a typical portfolio site.",
      ]),
      s("how", "How it works", [
        "Changes are written to the dx_config column of the settings row and read by the /api/health route, the /api/backup route, and this page on every load. They take effect immediately after saving.",
      ]),
      s("effects", "What happens when you change it", [
        "Enabled: the new values are used from the very next load or cron run.",
        "Disabled or reset: the defaults (from the schema migration) are used, which are safe for most setups.",
      ]),
      s("best", "Best practices", [
        "Change one value at a time and re-check this page to see the effect.",
        "Prefer leaving the defaults unless a specific problem appears.",
      ]),
    ],
  ),

  "dx-record-keepalive": entry(
    "dx-record-keepalive",
    "Record keep-alive checks",
    "Whether the daily /api/health cron writes one row per day into the health_checks ledger, powering the keep-alive history and streak.",
    [
      s("what", "What this does", [
        "When enabled, every run of the /api/health endpoint (triggered by the Vercel cron at 12:00 UTC daily) inserts one row into the health_checks table with the date, status and latency.",
      ]),
      s("why", "Why it exists", [
        "Supabase free-tier projects pause after about a week with no API traffic. The daily health call keeps the project awake, and the ledger gives you a visible history proving it happened — and alerts you when it stops.",
      ]),
      s("when", "When to use it", [
        "Leave it enabled unless you are on a paid Supabase plan, do not care about downtime of the database, or want to avoid the tiny amount of extra rows.",
      ]),
      s("how", "How it works", [
        "The cron fires GET /api/health. If recordHealthChecks is true, the route upserts one row per calendar date (checked_on is unique), so at most one row per day is stored. The keep-alive card reads the last 30 rows.",
      ]),
      s("effects", "What happens if you change it", [
        "Enabled: one small row per day is written; the keep-alive history, streak and the DX stat pill work, and the project stays warm.",
        "Disabled: no new rows are written (old history stays), the streak stops growing, and the health endpoint still responds but records nothing. The Supabase project may pause after ~7 days of inactivity if the health call stops.",
      ]),
      s("best", "Best practices", [
        "Keep it enabled while on the Supabase free tier.",
        "If the streak shows a gap, check the Vercel cron logs first — that is the only writer.",
      ]),
      s("notes", "Important notes", [
        "The health_checks table has no RLS policies (service role only), so it is not readable by the public — it only appears in admin tools.",
      ]),
      s("warning", "Warning", [
        "Disabling this while on the free tier can let the project pause, which makes the public site and admin panel fail until you wake it in the Supabase dashboard.",
      ]),
    ],
  ),

  "dx-link-timeout": entry(
    "dx-link-timeout",
    "Link check timeout",
    "How many milliseconds the link checker waits for a response before declaring a link unreachable.",
    [
      s("what", "What this does", [
        "Sets the per-link timeout used when the link checker performs live HTTP requests against booking, social, purchase, demo and repository URLs.",
      ]),
      s("why", "Why it exists", [
        "Slow or hanging third-party sites should not block the whole check. A sensible timeout keeps the page responsive and avoids false 'unreachable' results for slow-but-working sites.",
      ]),
      s("when", "When to change it", [
        "Increase it if valid links are being reported as broken (usually very slow hosting). Decrease it if the page takes too long to load because many links hang.",
      ]),
      s("how", "How it works", [
        "Each link is requested with a timeout of this many milliseconds. If the server does not respond in time, the link is marked unreachable. Range: 1,000–30,000 ms; default 8,000.",
      ]),
      s("effects", "What happens if you change it", [
        "Lower: faster page loads, but slow-but-valid links may be flagged broken.",
        "Higher: fewer false positives, but the page can stay loading longer when links hang.",
      ]),
      s("best", "Best practices", [
        "Keep the default unless you actually see false positives or slow loads.",
        "Remember the total page load time is roughly timeout × broken-link count, so large increases add up.",
      ]),
    ],
  ),

  "dx-link-maxurls": entry(
    "dx-link-maxurls",
    "Max URLs checked",
    "How many links the link checker examines in a single page load.",
    [
      s("what", "What this does", [
        "Caps the number of outbound links checked per run. Links are collected from booking, social, purchase, demo and repository fields across content.",
      ]),
      s("why", "Why it exists", [
        "Checking every link on a large site costs time and outbound requests. The cap keeps page loads predictable while still covering all typical content.",
      ]),
      s("when", "When to change it", [
        "Raise it if your site has many links and some are never checked. Lower it to speed up page loads on huge content sets.",
      ]),
      s("how", "How it works", [
        "The checker collects links in order and stops once the cap is reached (default 25, range 1–200). The card reports how many were OK and lists any broken ones.",
      ]),
      s("effects", "What happens if you change it", [
        "A higher cap checks more links (and more slow ones). A lower cap may miss broken links further down the list.",
      ]),
      s("best", "Best practices", ["Keep it at 25 unless you regularly add many external links."]),
    ],
  ),

  "dx-seo-titlemax": entry(
    "dx-seo-titlemax",
    "SEO title max characters",
    "The maximum length the SEO validator allows for page titles before it warns.",
    [
      s("what", "What this does", [
        "The SEO validator scores every public page. Titles longer than this value are flagged as issues.",
      ]),
      s("why", "Why it exists", [
        "Search engines truncate long titles in results, hurting click-through. 70 characters is the widely accepted target.",
      ]),
      s("when", "When to change it", [
        "Only if you intentionally use longer titles and want the validator to stop flagging them.",
      ]),
      s("how", "How it works", [
        "Each page's metadata title is compared against this limit when the page loads. Range: 40–120; default 70.",
      ]),
      s("effects", "What happens if you change it", [
        "Higher values quiet the warning but allow titles that may be truncated by search engines. Lower values make the validator stricter.",
      ]),
      s("best", "Best practices", [
        "Keep 70 and treat the warning as a signal to write shorter titles — it is better SEO, not a config problem.",
      ]),
    ],
  ),

  "dx-seo-descmin": entry(
    "dx-seo-descmin",
    "Meta description min characters",
    "The minimum length the SEO validator expects from meta descriptions before it warns.",
    [
      s("what", "What this does", [
        "Meta descriptions shorter than this value are flagged as too thin by the SEO validator.",
      ]),
      s("why", "Why it exists", [
        "Very short descriptions waste the space search engines show and miss the chance to explain the page.",
      ]),
      s("when", "When to change it", [
        "Rarely needed; adjust only if your content style is consistently more or less verbose than 120 characters.",
      ]),
      s("how", "How it works", [
        "The validator measures each page description and flags values below this threshold. Range: 60–300; default 120.",
      ]),
      s("effects", "What happens if you change it", [
        "Lower values accept thinner descriptions; higher values demand more detail and may flag good short descriptions.",
      ]),
      s("best", "Best practices", [
        "Keep 120 — it is the common guideline for useful descriptions.",
      ]),
    ],
  ),

  "dx-seo-descmax": entry(
    "dx-seo-descmax",
    "Meta description max characters",
    "The maximum length the SEO validator allows for meta descriptions before it warns.",
    [
      s("what", "What this does", [
        "Meta descriptions longer than this value are flagged as too long (search engines cut them off with '…').",
      ]),
      s("why", "Why it exists", [
        "Truncated descriptions look unfinished in search results and can lose readers.",
      ]),
      s("when", "When to change it", [
        "Rarely; only if your brand style needs longer descriptions.",
      ]),
      s("how", "How it works", [
        "The validator measures each page description and flags values above this threshold. Range: 80–400; default 160.",
      ]),
      s("effects", "What happens if you change it", [
        "Higher values tolerate longer descriptions; lower values flag more of them as too long.",
      ]),
      s("best", "Best practices", [
        "Keep 160 — the classic search-engine snippet length. Use the warning as a hint to tighten copy, not to raise the limit.",
      ]),
    ],
  ),

  "dx-health": entry(
    "dx-health",
    "Health monitor",
    "Live reachability checks for the Supabase database and storage API, with response latency.",
    [
      s("what", "What this does", [
        "Runs two live probes on every page load: a tiny query against the database and a bucket listing against the storage API. Each reports OK/Error plus measured latency.",
      ]),
      s("why", "Why it exists", [
        "Most 'site is down' symptoms trace back to the database or storage being unreachable — either paused by the free tier, failing credentials, or an outage. This card identifies the failing layer immediately.",
      ]),
      s("when", "When to use it", [
        "Whenever the site or admin panel errors, or after deploying to confirm the backend is reachable.",
      ]),
      s("how", "How it works", [
        "The server issues SELECT id FROM blog_posts LIMIT 1 and lists storage buckets, timing both. High latency here usually means network distance (Singapore region) or cold starts, not necessarily failure.",
      ]),
      s("effects", "What happens if it fails", [
        "The card shows red with the error message. The rest of the page still loads — one failing probe does not block the others.",
      ]),
      s("best", "Best practices", [
        "If Database is red, check the Supabase dashboard for a paused project and credentials.",
        "If Storage API is red but Database is green, check bucket permissions rather than project status.",
      ]),
      s("notes", "Important notes", [
        "Latency of a few seconds is normal for cold serverless instances; repeated multi-second latency is worth investigating.",
      ]),
    ],
  ),

  "dx-keepalive": entry(
    "dx-keepalive",
    "Keep-alive history",
    "A 30-day visual log of the daily /api/health cron runs, including your current 'streak' of healthy days.",
    [
      s("what", "What this does", [
        "Shows one square per day for the last 30 days: green when that day's health check succeeded, red when it failed, and the count of consecutive green days (streak).",
      ]),
      s("why", "Why it exists", [
        "The health cron is invisible unless something records it. This history proves the keep-alive is actually running and immediately exposes gaps (missed days = possible downtime).",
      ]),
      s("when", "When to use it", [
        "Check it weekly or whenever the Supabase project seems unresponsive. A red day means the cron or database failed that day.",
      ]),
      s("how", "How it works", [
        "The Vercel cron fires /api/health at 12:00 UTC daily. With 'Record keep-alive checks' enabled, each run upserts one row keyed by date. The card reads the most recent 30 rows and computes the streak from consecutive OK days.",
      ]),
      s("effects", "What happens if checks stop", [
        "The streak resets and future squares turn red/empty. If recording is disabled, new days stop appearing while old history remains.",
      ]),
      s("best", "Best practices", [
        "A healthy streak is the cheapest proof your free-tier database will not pause.",
        "Gaps usually mean the Vercel cron is disabled, not the database failing — check Vercel project settings first.",
      ]),
    ],
  ),

  "dx-backup": entry(
    "dx-backup",
    "Backup status",
    "The latest nightly backup: date, tables exported, files written, total size, and age.",
    [
      s("what", "What this does", [
        "Reports the most recent automated backup produced by the nightly /api/backup job: which date, how many tables, how many files, total size, and how many days ago it ran.",
      ]),
      s("why", "Why it exists", [
        "A backup you cannot see is a backup you do not trust. This card verifies the nightly job actually ran and warns you when it stopped.",
      ]),
      s("when", "When to use it", [
        "Check after configuring or changing the backup pipeline, and weekly as part of a health routine. Age older than 3 days turns the card amber/red.",
      ]),
      s("how", "How it works", [
        "The Vercel cron fires /api/backup at 00:00 UTC. It exports all 19 content tables as JSON plus a storage catalog into the private backups bucket under backups/YYYY-MM-DD/, prunes old events and folders, and writes a ledger row. The GitHub workflow (03:00 UTC) copies the same data to the backups branch of the repository as an offsite copy.",
      ]),
      s("effects", "What happens if backups stop", [
        "The card goes amber (3+ days old) then red. New data continues to be written to the site, but recovery from a disaster would lose whatever changed after the last backup.",
      ]),
      s("best", "Best practices", [
        "Treat a stale backup as urgent: check Vercel cron logs and the GitHub Actions tab first.",
        "Test a restore with scripts/restore-backup.mjs --dry-run once to confirm the pipeline is usable.",
      ]),
      s("notes", "Important notes", [
        "Backups include table data and storage files, but not database schema — the schema is recoverable from the supabase/migrations folder.",
      ]),
      s("warning", "Warning", [
        "A backup folder older than 30 days is automatically deleted to save storage. For longer history, rely on the GitHub branch copy.",
      ]),
    ],
  ),

  "dx-rls": entry(
    "dx-rls",
    "RLS posture",
    "Row-Level Security status of every table: which are protected, which are intentionally service-role-only, and which are at risk.",
    [
      s("what", "What this does", [
        "Lists every table in the database with its RLS state: enabled with policies, enabled with no policies (locked to the service role), or — the dangerous case — RLS disabled entirely.",
      ]),
      s("why", "Why it exists", [
        "RLS is the final security gate between public visitors and your data. One table with RLS off can leak everything. This card makes that invisible risk visible.",
      ]),
      s("when", "When to use it", [
        "After any schema change or migration, and whenever a security review is performed.",
      ]),
      s("how", "How it works", [
        "The page calls the list_rls_status() RPC, which inspects pg_tables and pg_policies. Tables with RLS on but zero policies (health_checks, backups) are flagged as 'locked — service role only', which is intentional.",
      ]),
      s("effects", "What happens if a table shows RLS disabled", [
        "Anyone with the anon key can read/write it. Fix by running supabase db push with the corrected migration — do not edit the database by hand.",
      ]),
      s("best", "Best practices", [
        "Every public table must show RLS on with at least one policy.",
        "Never disable RLS to 'fix' a failing query — fix the policy instead.",
      ]),
      s("warning", "Warning", [
        "If you see a red dot here, treat it as a live security issue and fix it before publishing anything new.",
      ]),
    ],
  ),

  "dx-grants": entry(
    "dx-grants",
    "Data API grants",
    "Verifies every public table has the explicit Postgres grants the Data API (supabase-js / PostgREST) needs for anon, authenticated and service_role.",
    [
      s("what", "What this does", [
        "Lists every public table and whether anon, authenticated and service_role each have SELECT/INSERT/UPDATE/DELETE grants on it. A table missing grants is flagged.",
      ]),
      s("why", "Why it exists", [
        "Supabase removed automatic grants for NEW public tables (breaking change, enforced on all projects on October 30, 2026). After that date, a table created by a migration without explicit GRANT statements becomes invisible to the Data API — pages would silently fall back to mock data or the admin would error. This card is the early warning for that.",
      ]),
      s("when", "When to use it", [
        "After adding any new table or migration, or any time a public page or admin module unexpectedly reads empty/mock data.",
      ]),
      s("how", "How it works", [
        "The page calls the list_data_api_grants() RPC, which inspects information_schema.role_table_grants for each of the three roles across all public tables.",
      ]),
      s("effects", "What happens if a table is missing grants", [
        "Supabase returns a permission-denied error for that table over the REST/GraphQL API even though the table exists in Postgres. Fix by adding the matching GRANT statements to the migration that created the table and running supabase db push.",
      ]),
      s("best", "Best practices", [
        "Every migration that creates a table must include its GRANT statements (and ENABLE ROW LEVEL SECURITY + policies) — grants, RLS and policies are a single unit.",
        "Service-role-only tables (health_checks, backups, audit_log, ...) should still have service_role grants, but no anon/authenticated SELECT policies.",
      ]),
      s("warning", "Warning", [
        "This only inspects the grants a migration declared. A table created outside the migration workflow (e.g. the Supabase SQL editor) is not covered — keep schema changes in migrations.",
      ]),
    ],
  ),

  "dx-orphans": entry(
    "dx-orphans",
    "Orphan storage files",
    "Files sitting in storage that no media_files record references — usually leftover uploads.",
    [
      s("what", "What this does", [
        "Scans storage buckets and compares every file against the media_files table. Files with no matching record are listed, largest first (up to the top 30).",
      ]),
      s("why", "Why it exists", [
        "Uploads that fail part-way, are deleted from the admin but not from storage, or were imported manually leave invisible files that still cost storage and are never shown anywhere. This card surfaces them.",
      ]),
      s("when", "When to use it", [
        "Periodically (monthly is fine) to find and clean up junk, or when storage usage grows faster than expected.",
      ]),
      s("how", "How it works", [
        "The scanner lists files in each bucket (up to 3,000 files per scan) and checks each against media_files by bucket + path. Matching media:<uuid> references are not orphans; everything else is.",
      ]),
      s("effects", "What happens if you ignore or clean them", [
        "Ignored: they accumulate silently. Cleaned: storage shrinks, but any file referenced by content through a non-media record would break — the scanner is conservative and only flags files with no reference at all.",
      ]),
      s("best", "Best practices", [
        "Before deleting orphans, confirm none are referenced in raw database fields the scanner cannot see (it compares against the media_files table only).",
        "The backups bucket is excluded — never delete files there from this view.",
      ]),
    ],
  ),

  "dx-env": entry(
    "dx-env",
    "Environment checker",
    "Verifies the presence of required environment variables on the server — without ever showing their values.",
    [
      s("what", "What this does", [
        "Checks that the Supabase URL, anon key, service role key, AI provider key and site URL are present in the server environment, reporting each as OK or missing.",
      ]),
      s("why", "Why it exists", [
        "The most common cause of admin failures in production is a missing environment variable — one that works fine locally because .env.local exists. This card catches that mismatch in one glance.",
      ]),
      s("when", "When to use it", [
        "After deploying, after copying the project to a new environment, or when the admin panel suddenly stops writing data.",
      ]),
      s("how", "How it works", [
        "The server reads each variable and reports only whether it is set, never its contents. The AI provider row shows which provider keys are configured (Groq/OpenRouter), not the keys themselves.",
      ]),
      s("effects", "What happens if a variable is missing", [
        "The affected feature degrades: missing service role key breaks backups, missing AI key disables AI chat, missing Supabase URL breaks everything. Set the variable in Vercel → Settings → Environment Variables and redeploy.",
      ]),
      s("best", "Best practices", [
        "Keep this page in sync with .env.example, which lists every variable the site can use.",
      ]),
      s("warning", "Warning", [
        "Never paste real key values into chat, logs, or issues — treat them as passwords.",
      ]),
    ],
  ),

  "dx-migrations": entry(
    "dx-migrations",
    "Migration status",
    "Compares the SQL migrations in your repo with what is applied on the remote database.",
    [
      s("what", "What this does", [
        "Lists the migration files found in supabase/migrations/, which are applied remotely, and any pending or unknown ones. Green means the schema is in sync.",
      ]),
      s("why", "Why it exists", [
        "Schema drift (repo and database disagreeing) is the second most common cause of 'works locally, breaks in production'. This card detects it before it bites.",
      ]),
      s("when", "When to use it", [
        "After every schema change and before every deployment. The admin panel and public site depend on the database matching the code.",
      ]),
      s("how", "How it works", [
        "It reads migration filenames from the repo and compares them with the supabase_migrations.schema_migrations table via the list_applied_migrations RPC. Pending = in repo but not applied; unknown = applied but not in repo.",
      ]),
      s("effects", "What happens if migrations drift", [
        "Pending migrations mean new columns/tables the code expects do not exist yet — features break with database errors. Apply them with supabase db push.",
      ]),
      s("best", "Best practices", [
        "Apply migrations from your machine (supabase db push) before pushing code.",
        "Never edit the remote schema directly in the Supabase dashboard — it will show as 'unknown' here and break the sync workflow.",
      ]),
    ],
  ),

  "dx-storage": entry(
    "dx-storage",
    "Storage status",
    "Every storage bucket with its object count, total size, and whether it is public or private.",
    [
      s("what", "What this does", [
        "Lists each storage bucket (media, backups, and any others) with the number of objects, combined size, and visibility.",
      ]),
      s("why", "Why it exists", [
        "Storage fills up quietly, and misconfigured public buckets leak private files. One card shows both problems.",
      ]),
      s("when", "When to use it", [
        "When uploads fail, when storage costs worry you, or during a security review.",
      ]),
      s("how", "How it works", [
        "Lists buckets via the storage API, then counts objects and sums sizes (up to 1,000 objects per bucket).",
      ]),
      s("effects", "What happens if a bucket is wrong", [
        "A bucket marked public when it should be private exposes its files to anyone with the URL. Bucket visibility is changed in the Supabase dashboard — this card only reports it.",
      ]),
      s("best", "Best practices", [
        "Only the media bucket should be public; the backups bucket must stay private.",
      ]),
    ],
  ),

  "dx-database": entry(
    "dx-database",
    "Database status",
    "Row counts for every content table, so growth and unexpected drops are visible at a glance.",
    [
      s("what", "What this does", [
        "Shows the current row count of every table the site uses, from projects and blog posts to analytics events and backups.",
      ]),
      s("why", "Why it exists", [
        "Sudden drops (data deleted by accident) and surprising growth (event spam) are far easier to spot when counts are visible.",
      ]),
      s("when", "When to use it", [
        "When investigating data-loss reports, or to sanity-check that background jobs (like event pruning) are working.",
      ]),
      s("how", "How it works", [
        "Runs an exact count query per table (18 queries total). A table that is unreachable is marked 'unreachable' instead of failing the page.",
      ]),
      s("effects", "What happens if a count is wrong", [
        "Counts are read-only. If a table shows unreachable, the service role cannot read it — check RLS and the service role key.",
      ]),
    ],
  ),

  "dx-brokenrefs": entry(
    "dx-brokenrefs",
    "Broken reference detector",
    "Finds media:<uuid> references in content that point to media files that no longer exist.",
    [
      s("what", "What this does", [
        "Scans every content field that can hold a media reference (project thumbnails/images, hero images, blog covers, SEO images and more) and checks each media:<uuid> value against the media_files table. Missing files are listed with the entity and field.",
      ]),
      s("why", "Why it exists", [
        "Deleted media files leave dangling references that render as broken images on the public site. Because references are resolved at render time, nothing fails loudly — only a broken image appears. This card finds them before visitors do.",
      ]),
      s("when", "When to use it", [
        "After deleting media from the admin panel, or when you see broken images on the public site.",
      ]),
      s("how", "How it works", [
        "It loads all media ids, then scans the content fields that use the media:<uuid> format and reports any value whose id is not in media_files.",
      ]),
      s("effects", "What happens if references are broken", [
        "The affected image/og-image renders as a missing asset. Fix by re-uploading the file or updating the field to a valid media reference.",
      ]),
      s("best", "Best practices", [
        "After any bulk media deletion, check this card before publishing changes.",
      ]),
    ],
  ),

  "dx-seo-validator": entry(
    "dx-seo-validator",
    "SEO validator",
    "Scores every public page's title and meta description against healthy lengths (70 / 120–160 characters).",
    [
      s("what", "What this does", [
        "For each public page, checks the title and meta description lengths against the configured limits and produces a 0–100 score with the list of issues found.",
      ]),
      s("why", "Why it exists", [
        "Search snippets look best when titles and descriptions fit; this validator turns an abstract concept (good SEO hygiene) into a score you can improve page by page.",
      ]),
      s("when", "When to use it", [
        "When publishing new pages, or periodically to keep older pages healthy.",
      ]),
      s("how", "How it works", [
        "Reads each page's metadata (title, description) and compares lengths with seoTitleMax, seoDescMin and seoDescMax. Issues (too long/too short) lower the score and are listed under the page.",
      ]),
      s("effects", "What happens if a page scores low", [
        "Nothing breaks — it is advisory. Fix the title/description in the page's editor (or site defaults) and the score rises on the next load.",
      ]),
      s("best", "Best practices", [
        "Aim for 85+ on every page. Use the listed issues as a checklist.",
      ]),
    ],
  ),

  "dx-link-checker": entry(
    "dx-link-checker",
    "Link checker",
    "Live validation of booking, social, purchase, demo and repository links across the site.",
    [
      s("what", "What this does", [
        "Requests every external link stored in booking/social/purchase URLs, project demos and repositories, and lists the ones that fail with their HTTP status.",
      ]),
      s("why", "Why it exists", [
        "Dead links destroy trust and waste potential conversions (a broken 'Book a call' link is a lost lead). Checking them regularly keeps every path to you working.",
      ]),
      s("when", "When to use it", [
        "After changing any external link, or as part of a monthly maintenance pass.",
      ]),
      s("how", "How it works", [
        "Collects links from content, then performs real HTTP requests using the configured timeout (8s default) and URL cap (25 default). Failures show the HTTP status code or 'unreachable'.",
      ]),
      s("effects", "What happens when links break", [
        "The card turns red and lists each broken link with its status. Fix the link in the relevant editor — this page is read-only.",
      ]),
      s("best", "Best practices", [
        "Re-run after editing project or contact content.",
        "Some sites block bots — a 403 from them is not your link breaking; check the status code before changing anything.",
      ]),
      s("notes", "Important notes", [
        "This is the slowest card: each broken or slow link waits for the full timeout before the page finishes.",
      ]),
    ],
  ),

  /* ───────────────────────────── Analytics ───────────────────────────── */

  "analytics-page": entry(
    "analytics-page",
    "Analytics page",
    "A privacy-friendly dashboard of visitor behaviour: views, CTA clicks, leads, sources, devices and search keywords.",
    [
      s("what", "What this does", [
        "Shows how visitors interact with the public site over a configurable window (default 30 days): page views, unique sessions, downloads, CTA clicks, leads, conversion, daily trends, top content, traffic sources, devices, search keywords and a recent event feed.",
      ]),
      s("why", "Why it exists", [
        "Knowing which pages attract attention and which CTAs convert lets you improve the site with data instead of guesses — all without a third-party analytics cookie banner.",
      ]),
      s("when", "When to use it", [
        "Weekly or monthly, to spot trends; or right after publishing something new to see if it gets traction.",
      ]),
      s("how", "How it works", [
        "A small client-side tracker records events (page views, CTA clicks, hub searches) into the analytics_events table when the public site loads. This page queries those events and groups them into reports. No cookies, no personal data, no third-party scripts required.",
      ]),
      s("effects", "What happens if tracking is off", [
        "All charts stay at zero and the config banner warns you. Turn tracking back on in the configuration card below.",
      ]),
      s("best", "Best practices", [
        "Leave tracking enabled; it is cheap, private and invisible to visitors.",
        "Use the report window selector to zoom in on campaigns (7–14 days) or watch long-term trends (60–90 days).",
      ]),
      s("notes", "Important notes", [
        "Counts start at zero when the site first loads — early numbers look small and that is expected.",
        "Sessions are approximate (client-side session ids, 30-minute idle timeout).",
      ]),
    ],
  ),

  "analytics-config": entry(
    "analytics-config",
    "Analytics configuration",
    "Master controls for the tracker: on/off, event retention, the report window, and search-keyword recording.",
    [
      s("what", "What this is", [
        "Four settings stored in the site_settings row that govern how events are collected, kept and reported.",
      ]),
      s("why", "Why it exists", [
        "Analytics behaviour should be adjustable without code changes — turn it off for privacy-sensitive launches, tune how long history is kept, and pick the report scope.",
      ]),
      s("when", "When to change it", [
        "Rarely. Toggle tracking off only temporarily (for example during an NDA launch); set retention before long campaigns; change the window to fit how you review reports.",
      ]),
      s("how", "How it works", [
        "Changes are written to the analytics_config column of the settings row. The tracker reads it on every event, the nightly backup job uses retention for pruning, and reports use the window for grouping.",
      ]),
      s("effects", "What happens when you change it", [
        "Immediate: the very next page view follows the new settings. The configuration is cached briefly (60s) to keep page loads fast.",
      ]),
      s("best", "Best practices", [
        "Save one change at a time and re-check the charts to confirm the effect.",
      ]),
    ],
  ),

  "analytics-enabled": entry(
    "analytics-enabled",
    "Tracking enabled",
    "The master on/off switch for collecting analytics events.",
    [
      s("what", "What this does", [
        "When off, the tracker ignores every event: no page views, clicks or searches are written. Existing events remain in the database.",
      ]),
      s("why", "Why it exists", [
        "A single switch lets you stop data collection instantly — for privacy-sensitive periods, debugging, or if you ever want to remove tracking entirely.",
      ]),
      s("when", "When to change it", [
        "Turn it off only for specific short periods. Turn it back on as soon as they end.",
      ]),
      s("how", "How it works", [
        "The tracker checks this flag before writing each event. The admin page shows a banner while it is off so the state is never invisible.",
      ]),
      s("effects", "What happens if you change it", [
        "Off: charts stop growing (old data stays). On: recording resumes with the next visitor.",
        "Important: while it is off, the window reports freeze — do not mistake frozen numbers for zero traffic.",
      ]),
      s("best", "Best practices", [
        "Keep it on. If you want history gone, lower the retention instead of leaving tracking off.",
      ]),
      s("warning", "Warning", [
        "If tracking stays off for a long time you lose the data permanently — it cannot be reconstructed retroactively.",
      ]),
    ],
  ),

  "analytics-retention": entry(
    "analytics-retention",
    "Retention (days)",
    "How long individual analytics events are kept before the nightly job deletes them.",
    [
      s("what", "What this does", [
        "Sets how many days of raw events are kept. Every night the backup job deletes events older than this.",
      ]),
      s("why", "Why it exists", [
        "Raw events grow without bound on a busy site, filling the free-tier database. Retention keeps the table small while preserving enough history for meaningful reports.",
      ]),
      s("when", "When to change it", [
        "Lower it if the analytics_events table grows too fast; raise it if you need longer raw history than 90 days.",
      ]),
      s("how", "How it works", [
        "The nightly /api/backup run deletes events older than retention days. Range 7–365; default 90.",
      ]),
      s("effects", "What happens if you change it", [
        "Lower: events disappear sooner — daily charts before that window become empty.",
        "Higher: more rows kept, larger table, longer history. Note the report window (7–90 days) limits what charts show regardless.",
      ]),
      s("best", "Best practices", ["Keep 90 — it matches the longest report window."]),
      s("notes", "Important notes", [
        "Deletion runs nightly, so recently expired events may linger until the next run.",
      ]),
    ],
  ),

  "analytics-window": entry(
    "analytics-window",
    "Report window (days)",
    "How many days every chart and stat on this page covers.",
    [
      s("what", "What this does", [
        "Sets the time range for all reports: page views, CTA clicks, leads, charts, leaderboards and sources all cover 'last N days'.",
      ]),
      s("why", "Why it exists", [
        "Different questions need different time spans: campaigns need 7 days, trends need 90. One setting controls them all.",
      ]),
      s("when", "When to change it", [
        "For campaign reviews use 7–14; for monthly reporting use 30; for long-term trend watching use 60–90.",
      ]),
      s("how", "How it works", [
        "Reports filter events to the last N days and the daily chart fills in zero-value days so the shape of the window is always visible. Range 7–90; default 30.",
      ]),
      s("effects", "What happens if you change it", [
        "Every number on the page immediately covers the new window. Wider windows smooth out daily noise but hide recent spikes.",
      ]),
      s("best", "Best practices", [
        "Keep 30 for default views and switch to 7 after big launches to watch the immediate response.",
      ]),
    ],
  ),

  "analytics-keywords": entry(
    "analytics-keywords",
    "Record hub search keywords",
    "Whether searches typed into the Automation Hub's search box are stored and reported.",
    [
      s("what", "What this does", [
        "When enabled, each hub search stores the search term (as an event with keyword metadata), which powers the 'Search keywords' leaderboard.",
      ]),
      s("why", "Why it exists", [
        "What visitors search for tells you exactly what they expect to find — the highest-value product discovery signal you can get.",
      ]),
      s("when", "When to change it", [
        "Keep it on to learn visitor intent. Turn it off only if you want to minimize what is stored about visitors.",
      ]),
      s("how", "How it works", [
        "The hub search box records a hub_search event containing the keyword when tracking is enabled. Keywords are aggregated into the leaderboard.",
      ]),
      s("effects", "What happens if you change it", [
        "On: keywords accumulate and the leaderboard fills in. Off: new searches are not recorded; existing keyword rows stay.",
      ]),
      s("best", "Best practices", [
        "Keep it on. Repeatedly searched terms that return nothing are content gaps worth filling.",
      ]),
      s("notes", "Important notes", [
        "Only the search box on the public Hub page records keywords — no other inputs do.",
      ]),
    ],
  ),

  "analytics-chart": entry(
    "analytics-chart",
    "Daily page views chart",
    "A per-day view-count bar chart covering the report window, with zero-filled days.",
    [
      s("what", "What this does", [
        "Plots page views per calendar day across the report window so you can see peaks, troughs and the effect of launches at a glance.",
      ]),
      s("why", "Why it exists", [
        "Totals hide shape: a flat 300-view week and a spiky one are completely different stories. The daily view reveals both.",
      ]),
      s("when", "When to use it", [
        "After publishing content or running campaigns, to see the day-by-day response.",
      ]),
      s("how", "How it works", [
        "Events are grouped by calendar day over the window; days with zero views are included so gaps (downtime, tracking off) are visible rather than invisible.",
      ]),
      s("effects", "What happens if it looks flat", [
        "No recent views — check that tracking is enabled and visitors are reaching the site, or that the window covers the traffic period.",
      ]),
    ],
  ),

  "analytics-funnel": entry(
    "analytics-funnel",
    "Conversion funnel",
    "Page views → CTA clicks → leads, plus the conversion rate between clicks and leads.",
    [
      s("what", "What this does", [
        "Shows the three stages of visitor intent side by side: how many pages were viewed, how many CTAs were clicked (Book a call, Get access), and how many leads arrived (contact form / booking submissions).",
      ]),
      s("why", "Why it exists", [
        "Traffic is vanity without action. The funnel shows where visitors drop off — if 1,000 views produce 2 clicks, the message or placement is wrong; if clicks never become leads, the landing page is.",
      ]),
      s("when", "When to use it", [
        "Whenever you evaluate whether the site converts, or after changing CTAs/landing copy.",
      ]),
      s("how", "How it works", [
        "Clicks on tracked CTAs raise cta_click events; contact submissions raise leads. The conversion rate is leads ÷ CTA clicks (shown once there is data).",
      ]),
      s("effects", "What happens if the funnel is empty", [
        "No events yet — the page has to actually be visited and CTAs clicked before anything appears.",
      ]),
      s("best", "Best practices", [
        "Watch the click→lead rate most closely — it reflects how compelling your offer pages are.",
      ]),
    ],
  ),

  "analytics-top-projects": entry(
    "analytics-top-projects",
    "Most viewed projects",
    "Projects ranked by how often visitors open them.",
    [
      s("what", "What this does", [
        "Lists projects ordered by view count (from the projects' own view counters), with the leader bar showing relative popularity.",
      ]),
      s("why", "Why it exists", [
        "Popular projects reveal what visitors care about, guiding which projects to feature on the homepage and which are worth expanding into case studies.",
      ]),
      s("when", "When to use it", [
        "Before restructuring the projects page, or to decide the featured/landing project.",
      ]),
      s("how", "How it works", [
        "Project views are counted on each public project page visit (increment_project_views). The leaderboard reads those counters.",
      ]),
      s("effects", "What happens if a project is missing", [
        "Unpublished or never-visited projects naturally have no views and may not appear.",
      ]),
    ],
  ),

  "analytics-top-templates": entry(
    "analytics-top-templates",
    "Most viewed templates",
    "Workflow playground templates ranked by public views.",
    [
      s("what", "What this does", [
        "Shows which shared workflow templates visitors open most often in the playground.",
      ]),
      s("why", "Why it exists", [
        "Template popularity shows which automations resonate — the strongest candidates for blog posts, offers and featured content.",
      ]),
      s("when", "When to use it", [
        "When deciding what to write about or which templates to promote.",
      ]),
      s("how", "How it works", [
        "Each public template view increments a counter; this card ranks by it.",
      ]),
    ],
  ),

  "analytics-top-blog": entry(
    "analytics-top-blog",
    "Most read blog posts",
    "Blog posts ranked by visits to their /blog/... URL over the report window.",
    [
      s("what", "What this does", [
        "Ranks blog posts by page views within the window, joining analytics event paths to post titles.",
      ]),
      s("why", "Why it exists", [
        "Post popularity shows what topics drive traffic — the best guide for your content calendar.",
      ]),
      s("when", "When to use it", [
        "Weekly, to decide the next article, or to refresh titles on underperforming posts.",
      ]),
      s("how", "How it works", [
        "Analytics events whose page path starts with /blog/ are grouped by path and matched to published posts by slug.",
      ]),
      s("effects", "What happens if a post is missing", [
        "Draft or never-visited posts have no events; older events may have been pruned by retention.",
      ]),
    ],
  ),

  "analytics-top-resources": entry(
    "analytics-top-resources",
    "Top downloads",
    "Resources (free guides, PDFs, downloads) ranked by download count.",
    [
      s("what", "What this does", [
        "Shows which downloadable resources are downloaded most, combining lifetime download counts and recent download events.",
      ]),
      s("why", "Why it exists", [
        "Downloads are a strong interest signal — high-download resources prove demand you can monetize or expand.",
      ]),
      s("when", "When to use it", [
        "When planning lead magnets or evaluating which resources to keep building.",
      ]),
      s("how", "How it works", [
        "Resource downloads raise download events; the card merges those with each resource's lifetime counter.",
      ]),
    ],
  ),

  "analytics-sources": entry(
    "analytics-sources",
    "Traffic sources",
    "Where visitors come from, grouped by referring site or marked as direct.",
    [
      s("what", "What this does", [
        "Groups page views by the referrer: Google, LinkedIn, GitHub, X, or '(direct)' when no referrer exists.",
      ]),
      s("why", "Why it exists", [
        "Knowing which channels bring visitors tells you where to invest: if LinkedIn sends most traffic, double down there.",
      ]),
      s("when", "When to use it", [
        "After sharing links on social media or running outreach, to measure channel effectiveness.",
      ]),
      s("how", "How it works", [
        "The tracker records the page's document.referrer host on each page view. No third-party attribution scripts involved.",
      ]),
      s("effects", "What happens if everything is direct", [
        "Referrers are invisible when links are opened from apps (in-app browsers) or typed manually — common, and not a bug.",
      ]),
      s("best", "Best practices", [
        "Use UTM-less but distinct landing links (e.g. /?ref=linkedin) if you need sharper attribution.",
      ]),
    ],
  ),

  "analytics-devices": entry(
    "analytics-devices",
    "Devices",
    "Breakdown of visitors by desktop, mobile or tablet, derived from their browser's user agent.",
    [
      s("what", "What this does", [
        "Shows the share of traffic per device class so you know what screens to design and test for.",
      ]),
      s("why", "Why it exists", [
        "If 70% of visitors are on mobile and the mobile experience is secondary, that is a priority signal.",
      ]),
      s("when", "When to use it", [
        "Before redesigns or when investigating mobile-specific issues like slow loads.",
      ]),
      s("how", "How it works", [
        "A lightweight user-agent sniff classifies each visit as mobile, tablet or desktop. No device fingerprinting, no personal data.",
      ]),
      s("effects", "What happens if the split seems off", [
        "User-agent parsing is approximate — tablets may land in desktop occasionally. The ratio is still reliable for decisions.",
      ]),
    ],
  ),

  "analytics-keywords-top": entry(
    "analytics-keywords-top",
    "Search keywords",
    "The terms visitors type into the Automation Hub search box, ranked by frequency.",
    [
      s("what", "What this does", [
        "Lists hub search terms in descending frequency — visible only when 'Record hub search keywords' is enabled.",
      ]),
      s("why", "Why it exists", [
        "Search terms are the visitors' own words for what they need. Frequent terms with few results are content gaps.",
      ]),
      s("when", "When to use it", ["Monthly, to plan new resources, templates or blog posts."]),
      s("how", "How it works", [
        "Reads hub_search events (only recorded when the keyword setting is on) and groups by term.",
      ]),
      s("effects", "What happens if it is empty", [
        "Keyword recording is off, or nobody has searched the hub yet.",
      ]),
    ],
  ),

  "analytics-pages": entry(
    "analytics-pages",
    "Visitor flow · top pages",
    "The most-viewed page paths across the whole site.",
    [
      s("what", "What this does", [
        "Ranks every public page path (/, /projects, /blog/..., /hub/...) by views in the window — the quickest read on what the site's traffic actually looks at.",
      ]),
      s("why", "Why it exists", [
        "Top pages show which entry points matter; pairing this with sources and devices tells the full story of how people arrive and where they go.",
      ]),
      s("when", "When to use it", [
        "When evaluating navigation, hero content, or landing page performance.",
      ]),
      s("how", "How it works", [
        "Groups page-view events by path. The home page dominating is normal; odd spikes deserve a look.",
      ]),
    ],
  ),

  "analytics-cta-breakdown": entry(
    "analytics-cta-breakdown",
    "CTA clicks by source",
    "Every tracked call-to-action, ranked by clicks.",
    [
      s("what", "What this does", [
        "Lists each tracked CTA (e.g. 'Book a free audit', 'Get access', 'Download') by click count so you can see which buttons actually get pressed.",
      ]),
      s("why", "Why it exists", [
        "Buttons are the money moments. Comparing click counts across placements tells you which copy and locations work.",
      ]),
      s("when", "When to use it", [
        "After changing button text, color or position, to measure the difference.",
      ]),
      s("how", "How it works", [
        "Clickable CTAs across the site raise cta_click events carrying the button label; this card aggregates them.",
      ]),
      s("effects", "What happens if a CTA is missing", [
        "Only CTAs wired into the tracker appear — links written in plain markdown are not tracked.",
      ]),
    ],
  ),

  "analytics-recent": entry(
    "analytics-recent",
    "Recent events",
    "A live-ish feed of the latest tracked events with type, label, page and timestamp.",
    [
      s("what", "What this does", [
        "Lists the most recent events (page views, CTA clicks, downloads, hub searches) with their details and timestamps.",
      ]),
      s("why", "Why it exists", [
        "Aggregates hide outliers. The feed is the raw pulse of the site — useful right after a launch to confirm tracking works at all.",
      ]),
      s("when", "When to use it", [
        "Right after deploying or enabling tracking, to confirm events are flowing.",
      ]),
      s("how", "How it works", [
        "Reads the newest rows from analytics_events. Rows age out per the retention setting.",
      ]),
      s("effects", "What happens if the feed is empty", [
        "Tracking is off or no one has visited since it was enabled.",
      ]),
    ],
  ),

  "analytics-export": entry(
    "analytics-export",
    "Export CSV",
    "Downloads up to the 5,000 most recent analytics events as a CSV file for spreadsheets or external analysis.",
    [
      s("what", "What this does", [
        "Generates and downloads a CSV containing the latest events (up to 5,000) with event type, label, page, metadata, session and timestamps.",
      ]),
      s("why", "Why it exists", [
        "In-depth analysis (pivot tables, custom funnels, retention cohorts) belongs in a spreadsheet. This export makes the raw data available without database access.",
      ]),
      s("when", "When to use it", [
        "Monthly reviews, or when you need numbers the dashboard does not show.",
      ]),
      s("how", "How it works", [
        "The server queries the latest events, formats them as CSV with proper escaping, and your browser downloads the file. The button shows a spinner while the export is generated.",
      ]),
      s("effects", "What happens if you export often", [
        "Nothing changes on the site — exports are read-only.",
      ]),
      s("best", "Best practices", [
        "Export before lowering retention if you want to keep long-term history offline.",
      ]),
      s("notes", "Important notes", [
        "Only events within the retention window exist; older events are already pruned.",
      ]),
    ],
  ),

  /* ───────────────────────────── Activity ───────────────────────────── */

  "activity-page": entry(
    "activity-page",
    "Activity page",
    "An append-only log of every important admin change — who did what, when, on which item.",
    [
      s("what", "What this page does", [
        "Lists the most recent entries from the audit log: actions like media uploads, content changes, SEO edits, settings updates and integration key changes, each with the affected section, item id, extra details, timestamp and the admin who performed it.",
      ]),
      s("why", "Why it exists", [
        "It makes the CMS accountable: when something changed unexpectedly, you can see exactly what happened, when, and by whom, without digging through database logs.",
      ]),
      s("when", "When to use it", [
        "After publishing major changes, when you suspect something was edited accidentally, or whenever you want to audit recent admin activity.",
      ]),
      s("how", "How it works", [
        "Every admin mutation action (media, blog, projects, services, SEO, settings, integrations) writes one row to the audit log after it succeeds. This page reads the log in reverse-chronological order and offers a section filter.",
      ]),
      s("effects", "What happens if it is empty", [
        "No auditable admin actions have happened yet. Public-site visits do not appear here — use Analytics for visitor data.",
      ]),
      s("best", "Best practices", [
        "Check the filter when hunting for a specific change; the full detail JSON is available on hover of the details snippet.",
      ]),
      s("notes", "Important notes", [
        "The log is append-only and best-effort: a failure to write an audit entry never blocks the underlying action.",
      ]),
    ],
  ),

  /* ─────────────────────────── Integrations ─────────────────────────── */

  "integrations-page": entry(
    "integrations-page",
    "Integrations page",
    "Manage external API keys (Groq, OpenRouter) from the admin panel — stored encrypted, never shown again.",
    [
      s("what", "What this page does", [
        "Shows the external services the site can use (AI providers), their current source (stored key, environment variable, or unconfigured), usage counts, and lets you save, rotate, expire or remove stored keys.",
      ]),
      s("why", "Why it exists", [
        "Previously API keys could only be set as environment variables in the hosting provider — slow to change and invisible in the CMS. Now keys are manageable from the admin panel, encrypted at rest.",
      ]),
      s("when", "When to use it", [
        "To add a new provider key, rotate a key that may have leaked, or remove a key you no longer use.",
      ]),
      s("how", "How it works", [
        "Keys are encrypted with AES-256-GCM before they reach the database, using a key derived from your deployment secrets. At runtime the AI providers use the stored key first, falling back to the matching environment variable. The key is decrypted only server-side, momentarily, inside the AI call.",
      ]),
      s("effects", "What happens when you save a key", [
        "The AI chat uses it on the next request. The key is never displayed again after saving — rotate instead of re-reading.",
      ]),
      s("best", "Best practices", [
        "Set an expiry date when the key is temporary.",
        "Rotate immediately if you suspect a key leaked.",
        "If the environment variable exists, it acts as a fallback when no stored key exists.",
      ]),
      s("warning", "Security warning", [
        "Treat keys as credentials: never paste them into chats, support tickets, or anywhere else. The stored value is encrypted, but access to the admin panel is still the ultimate gate.",
      ]),
    ],
  ),

  /* ───────────────────────────── Security ───────────────────────────── */

  "security-page": entry(
    "security-page",
    "Security page",
    "Sign-in history for the admin panel: every attempt with IP address, browser and success state.",
    [
      s("what", "What this page does", [
        "Shows the last 100 sign-in attempts against the admin login, including successful and failed ones, with the email used, IP address, browser user-agent and timestamp, plus summary counts.",
      ]),
      s("why", "Why it exists", [
        "Spotting failed login bursts or logins from unknown IPs lets you react before an account is compromised.",
      ]),
      s("when", "When to use it", [
        "Occasionally as a health check, or immediately if you suspect your admin credentials were exposed.",
      ]),
      s("how", "How it works", [
        "Every sign-in attempt (success or failure) writes a row to the login history with the forwarded IP and user agent. The page reads the latest entries and summarizes them.",
      ]),
      s("effects", "What happens after a failed login", [
        "The failure is recorded with the IP; repeated failures from the same IP indicate a brute-force attempt.",
      ]),
      s("best", "Best practices", [
        "Use a strong, unique password for the admin panel.",
        "If you see unexpected failed attempts, rotate the password immediately.",
      ]),
      s("notes", "Important notes", [
        "Only the latest 100 entries are shown; the full table keeps growing in the database.",
      ]),
    ],
  ),
};

export function getHelp(id: string): HelpEntry | undefined {
  return ADMIN_HELP[id];
}

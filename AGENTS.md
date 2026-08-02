# AGENTS.md — Portfolio CMS (v5)

Project root instructions for all coding agents.

## Standing permission (user-granted, permanent)

The user has explicitly granted full permission to request — and use — any
credentials needed to complete this project: passwords, API keys, tokens,
deployment credentials, personal data, anything. **Do not hesitate to ask.**
Ask whenever a credential or configuration value is missing or unverified.
Nothing is off-limits; the user prefers being asked over being skipped.

- All secrets live in `.env.local` (gitignored, never commit it). Re-read it
  when env values are needed instead of asking the user to re-send.
- `.env.example` must contain ONLY placeholders — never real values.
- User-approved sources: Supabase (URL, anon/publishable key, service role
  key, DB password), Groq, OpenRouter, Vercel (token in user's account).

## Project overview

- Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript strict,
  Tailwind v4, Supabase (Postgres + Auth + Storage), Zod validation.
- Supabase project ref: `quekecvmdbzpxqglztsa` (hosted). Local migrations in
  `supabase/migrations/` (00001–00007, all applied remotely).
- Public portfolio site + password-protected admin CMS at `/admin`.
- Single source of truth docs: `docs/project-handoff-v2.md` (always update it
  when project state changes), `docs/media-architecture.md`,
  `docs/phase-8b-cleanup-report.md`.

## Non-negotiable rules (from handoff §17)

- Never duplicate upload logic — use `src/lib/media/upload.ts` +
  `MediaUploader`/`MediaField`.
- Never bypass auth — every mutation action calls `auth.getUser()`; RLS is the
  final gate. Never weaken RLS or security headers.
- Never duplicate repositories — extend the module repository.
- Never duplicate validation — reuse/combine Zod schemas in
  `validation/schemas/`.
- Keep backward compatibility for legacy URL values.
- Never change the `media:<uuid>` reference format — it is load-bearing.
- Never import server barrels (`@/lib/<module>` or `@/lib/media`) into client
  components — import actions directly.
- Use `Result<T>` for all repositories and actions.
- Hand-sync `src/database.types.ts` when migrations change.
- Every migration creating a table MUST also declare its Data API grants,
  `ENABLE ROW LEVEL SECURITY` and policies together — Supabase removes
  automatic grants for new tables (Oct 30, 2026), so a table without explicit
  `GRANT` statements is invisible to the Data API. Verify via
  `list_data_api_grants()` (shown on `/admin/dx`).
- Resolve media references at render time (never persist resolved URLs).
- Resolve the site URL / domain at render time via `getSiteUrl()` from
  `@/lib/site/urls` (DB `monitoring_config.siteUrl` → `NEXT_PUBLIC_SITE_URL`
  env → default). Never hardcode the public domain in consumers; health/backup
  URLs resolve through `getHealthCheckUrl()` / `getBackupUrl()`.
- Public pages fall back to mocks/defaults when Supabase is unavailable; admin
  pages must surface real errors.
- Admin timestamps display in Bangladesh Time (GMT+6, Asia/Dhaka) — use the
  `src/lib/format/dates.ts` formatters (`formatDateTimeBD`, `formatDateBD`,
  `formatDateTimeShortBD`, `formatTimeBD`, `formatDateKeyBD`); never render
  raw UTC in admin UI.
- Never mask a real failure as OK — admin statuses must reflect the actual
  ledger/probe (a probe error throws, not `?? 0`).
- Health/backup ledger rows carry a `source` (`vercel` | `github`); `vercel`
  is the primary writer, `github` a redundant fallback. When reading ledger
  rows prefer `source='vercel'` and fall back to `github` only when vercel is
  missing.

## Workflows

- Lint: `npm run lint` (eslint). Build: `npm run build` (must stay green,
  31/31 routes). Dev: `npm run dev`.
- Supabase CLI (v2.111.0, globally installed, project linked): read the DB
  password from `.env.local` (`SUPABASE_DB_PASSWORD`) when running
  `supabase db push` / `supabase db query` / `supabase migration repair`.
- To verify remote state without writing data: REST probes with the anon key
  against `https://quekecvmdbzpxqglztsa.supabase.co/rest/v1/...`.
- Keep-alive/backup redundancy (3 layers, all verified): Vercel cron
  (`/api/health` 12:00 UTC, `/api/backup` 00:00 UTC, `BACKUP_CRON_SECRET` /
  `HEALTH_CRON_SECRET` env); GitHub Actions `keepalive` + `nightly-backup`
  (repo secrets + `vars.HEALTH_URL` override; `backups` branch is the offsite
  copy); UptimeRobot monitors 803645358 (root) + 803645542 (`/api/health`).
  UptimeRobot v3 API requires `timeout` on HTTP monitors; v2 `newMonitor` is
  rejected on Free plan (`access_denied`).
- After any schema change: update `supabase/migrations/`, hand-sync
  `src/database.types.ts`, apply to remote, update the handoff.

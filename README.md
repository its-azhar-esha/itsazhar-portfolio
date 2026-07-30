This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase Backend

This project uses [Supabase](https://supabase.com) as its backend for authentication, database, storage, and the future admin CMS.

### Connecting Supabase

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Copy your project URL and anon key from **Project Settings > API**
3. Copy the service role key (keep it secret — never expose it to the browser)

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- `NEXT_PUBLIC_*` variables are safe for client-side use
- `SUPABASE_SERVICE_ROLE_KEY` must **never** be exposed to the browser — it bypasses Row Level Security and is only used in server-only code (API routes, server actions, cron jobs)

### Client Architecture

The Supabase client lives in `src/lib/supabase/`:

| File | Client | Import from | Used In |
|------|--------|-------------|---------|
| `client.ts` | Browser (client-side) | `@/lib/supabase` | Client components, `useEffect` calls |
| `server.ts` | Server (per-request) | `@/lib/supabase` | Server components, Server Actions |
| `middleware.ts` | Middleware (request/response) | `@/lib/supabase` | `middleware.ts` at app root |
| `admin.ts` | Service Role (admin) | `@/lib/supabase` | API routes, cron, migrations |

Each client is lazily initialized and reused within its environment to avoid duplicate connections.

### Generating Database Types

After creating tables in the Supabase dashboard, run:

```bash
npx supabase gen types typescript --linked > src/database.types.ts
```

Or link a remote project first:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase gen types typescript --linked > src/database.types.ts
```

The generated types automatically flow through `@/lib/supabase/types.ts` helpers (`Tables`, `Enums`, `DbResult`, `DbResultOk`).

### Storage Buckets

Prepared buckets (create in Supabase Dashboard > Storage):

- `project-images` — project screenshots, thumbnails
- `project-videos` — project demo videos
- `avatars` — user profile images
- `documents` — downloadable assets
- `future-assets` — reserved for future use

### Deploying on Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com/new)
3. Add all environment variables from `.env.example` in **Project Settings > Environment Variables**
4. Deploy — no build changes needed

All Supabase clients gracefully handle missing configuration without crashing the website. The public site continues working even without Supabase connected.

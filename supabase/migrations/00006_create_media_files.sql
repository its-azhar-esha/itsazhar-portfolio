-- ============================================================
-- Migration: Create media_files table + media storage bucket
-- Portfolio CMS — reusable media infrastructure (Phase 8A)
-- ============================================================

-- 1. Storage bucket
-- Public bucket so portfolio images render without signed URLs.
-- The schema (nullable public_url + storage_path) supports private
-- buckets via signed URLs in the future without breaking the API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, null)
on conflict (id) do nothing;

-- 2. media_files table
create table if not exists public.media_files (
  -- identifiers
  id            uuid primary key default gen_random_uuid(),
  filename      text not null,
  original_name text not null,

  -- storage
  bucket       text not null default 'media',
  storage_path text not null,
  public_url   text,

  -- file metadata
  mime_type  text not null,
  extension  text not null,
  size_bytes bigint not null default 0,
  width      integer,
  height     integer,

  -- editable metadata
  alt_text text,
  caption  text,

  -- audit
  uploaded_by uuid references auth.users (id) on delete set null,

  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Constraints
alter table public.media_files
  add constraint media_files_filename_unique unique (filename);

alter table public.media_files
  add constraint media_files_storage_path_unique unique (storage_path);

alter table public.media_files
  add constraint media_files_filename_not_empty
    check (filename <> '');

alter table public.media_files
  add constraint media_files_storage_path_not_empty
    check (storage_path <> '');

alter table public.media_files
  add constraint media_files_original_name_not_empty
    check (original_name <> '');

alter table public.media_files
  add constraint media_files_size_nonnegative
    check (size_bytes >= 0);

-- 4. Indexes
create index if not exists idx_media_files_created_at
  on public.media_files (created_at desc);

create index if not exists idx_media_files_original_name
  on public.media_files (original_name);

create index if not exists idx_media_files_mime_type
  on public.media_files (mime_type);

create index if not exists idx_media_files_uploaded_by
  on public.media_files (uploaded_by);

-- 5. Trigger: auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger set_updated_at
  before update on public.media_files
  for each row
  execute function public.handle_updated_at();

-- 6. Row Level Security
alter table public.media_files enable row level security;

create policy "Anyone can view media files"
  on public.media_files
  for select
  using (true);

create policy "Authenticated users can insert media files"
  on public.media_files
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update media files"
  on public.media_files
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete media files"
  on public.media_files
  for delete
  to authenticated
  using (true);

-- 7. Storage object policies for the media bucket
create policy "Public read access for media bucket objects"
  on storage.objects
  for select
  using (bucket_id = 'media');

create policy "Authenticated users can upload to media bucket"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'media');

create policy "Authenticated users can update media bucket objects"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

create policy "Authenticated users can delete media bucket objects"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media');

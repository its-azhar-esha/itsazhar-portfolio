-- ============================================================
-- Migration: Raise media bucket file size limit to 50 MB
-- Portfolio CMS — upload limit increase (50 MB = Supabase Free
-- plan global maximum)
-- ============================================================

-- Bucket-level limit was 10 MB (10,485,760 bytes) from migration 00006.
-- The global limit on the Free plan is 50 MB, so this matches it.
update storage.buckets
set file_size_limit = 52428800
where id = 'media';

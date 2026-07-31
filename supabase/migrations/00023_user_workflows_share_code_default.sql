-- Fix: user_workflows.share_code had no default, so anon Save & Share inserts
-- (which omit share_code by design) failed with a not-null violation.
-- Generate an 8-char alphanumeric code from a random UUID.
alter table public.user_workflows
  alter column share_code set default substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);

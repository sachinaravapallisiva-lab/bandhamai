-- Bandham AI — Instagram-only social connect (run in the Supabase SQL editor)
--
-- Sai: run this once. The app stores a clean handle (e.g. ananya), not an OAuth token.
-- Empty is fine — Instagram is optional on profile create/edit.
--
-- What this does:
--   1. Adds public.profiles.instagram (text) if missing
--   2. Caps length at 30 characters (Instagram username max)
--
-- The app:
--   - Accepts @handle or an instagram.com profile URL
--   - Rejects Facebook, LinkedIn, X, TikTok, and other social URLs
--   - Stores the handle only. Browse does not show it publicly.
--   - After supabase/instagram_shares.sql, the owner chooses who sees the chip
--   - Does not post to Instagram and does not use Instagram OAuth
--
-- Until this runs, profile submit still works; the handle is omitted.
-- PATCH /api/profiles (edit) returns 503 and asks you to run this file.

alter table public.profiles
  add column if not exists instagram text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_instagram_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_instagram_length_check
      check (instagram is null or char_length(instagram) <= 30);
  end if;
end $$;

-- Bandham AI — profile photos (run in the Supabase SQL editor)
--
-- What this does:
--   1. Ensures profiles.photo_url exists (already on the live table; IF NOT EXISTS is safe)
--   2. Adds profiles.photo_blurred_url if missing (blur-until-matched storage derivative)
--   3. Creates a public Storage bucket named profile-photos
--
-- Uploads go through POST /api/photos using SUPABASE_SERVICE_KEY, so they bypass
-- Storage RLS. The bucket is public so the app can persist stable photo_url values.
-- Public URLs are not access-control privacy. Authenticated / signed URLs can be a
-- later follow-up if Browse must hide the full photo until a match.
--
-- This is NOT a beauty-filter setup. The app only stores a resolution/clarity pass
-- plus a heavily downscaled blur derivative.

alter table public.profiles
  add column if not exists photo_url text;

alter table public.profiles
  add column if not exists photo_blurred_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Optional: if you later set public = false, uncomment these so signed reads work
-- for the owner. Service-role uploads still bypass RLS.
--
-- create policy "profile_photos_owner_read"
-- on storage.objects
-- for select
-- to authenticated
-- using (
--   bucket_id = 'profile-photos'
--   and (storage.foldername(name))[1] = (select auth.uid()::text)
-- );

-- One profile per account (from the earlier profile-creation PR). Needed so
-- POST /api/photos can attach URLs to an already-submitted row.
-- alter table public.profiles
--   add column if not exists user_id uuid references auth.users (id);
-- create unique index if not exists profiles_user_id_key on public.profiles (user_id);

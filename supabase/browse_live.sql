-- Bandham AI — put a reviewed profile on Browse
--
-- POST /api/profiles always inserts status = 'pending'.
-- GET /api/profiles/search only returns status = 'live'.
-- Until at least one row is live, Browse shows "No live profiles yet."
--
-- After reviewing a row in the Table Editor:

update public.profiles
set status = 'live'
where id = '<profile-id>';

-- Optional: confirm what Browse can see
-- select id, full_name, city, profession, status
-- from public.profiles
-- where status = 'live';

-- Bandham AI — feature ideas on the existing support queue
-- (additive, run AFTER support_tickets.sql; also after voice_support.sql
-- if you already applied phone support)
--
-- What this does:
--   1. Allows category = 'idea' on public.support_tickets so product
--      ideas share the same review queue as app issue tickets.
--   2. Allows source = 'idea' so footer / account submissions are
--      distinct from assistant, contact, and voice rows.
--
-- This does not drop support_tickets. Existing rows stay as they are.
-- RLS stays own-row insert/select for signed-in members. Do not grant
-- UPDATE or DELETE to authenticated members.
--
-- Do not write feature ideas to public.feedback. That table is swipe
-- and profile actions (from_profile_id, to_profile_id, action).
-- Do not change RLS on saves, interests, searches, signals, feedback,
-- or photo_grants from this file.
-- Do not change Instagram columns or share tables from this file.

alter table public.support_tickets
  drop constraint if exists support_tickets_category_check;

alter table public.support_tickets
  add constraint support_tickets_category_check
  check (category in ('bug', 'billing', 'account', 'other', 'idea'));

alter table public.support_tickets
  drop constraint if exists support_tickets_source_check;

alter table public.support_tickets
  add constraint support_tickets_source_check
  check (source in ('assistant', 'contact', 'voice', 'idea'));

-- Confirm:
-- select id, user_id, email, category, subject, status, source, created_at
-- from public.support_tickets
-- where category = 'idea'
-- order by created_at desc
-- limit 20;

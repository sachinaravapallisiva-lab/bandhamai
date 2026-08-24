-- Bandham AI — earlier Browse prompts (run in the Supabase SQL editor)
--
-- What this does:
--   1. Creates public.browse_prompts
--   2. Turns on RLS (members can read/insert their own rows only)
--   3. Stores the raw Browse prompt plus the folded search q used to reopen
--      that shortlist. No caste, religion, gotra, height, or income columns.
--
-- CoS / Sai: apply this file in the SQL editor after merge. Until then,
-- signed-in save returns 503 and the member still keeps session-only prompts
-- on this device. Signed-out visitors stay session-only.
--
-- Confirm:
-- select id, user_id, prompt, created_at
-- from public.browse_prompts
-- order by created_at desc
-- limit 10;

create table if not exists public.browse_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt text not null,
  search_q text not null,
  created_at timestamptz not null default now(),
  constraint browse_prompts_prompt_len check (
    char_length(trim(prompt)) >= 1
    and char_length(prompt) <= 280
  ),
  constraint browse_prompts_search_q_len check (
    char_length(trim(search_q)) >= 1
    and char_length(search_q) <= 280
  )
);

create index if not exists browse_prompts_user_id_idx
  on public.browse_prompts (user_id, created_at desc);

alter table public.browse_prompts enable row level security;

revoke all on public.browse_prompts from public, anon;
grant select, insert on public.browse_prompts to authenticated;
grant all on public.browse_prompts to service_role;

drop policy if exists browse_prompts_select_own on public.browse_prompts;
create policy browse_prompts_select_own
  on public.browse_prompts
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists browse_prompts_insert_own on public.browse_prompts;
create policy browse_prompts_insert_own
  on public.browse_prompts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No authenticated UPDATE / DELETE. Service role bypasses RLS.

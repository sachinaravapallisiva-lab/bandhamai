-- Bandham AI — Dodo Payments columns on public.subscriptions
--
-- Run in the Supabase SQL editor after subscriptions.sql.
-- Does not drop stripe_* columns. Existing active/trialing Stripe rows
-- keep messaging until they expire or are updated by a later Dodo event.
--
-- Test product IDs (Sai sets these on Vercel; do not commit secrets):
--   DODO_SUBSCRIBE_PRODUCT_ID=pdt_0NmpiDbCi5EJoEzsRAa1t   -- $9.99/mo
--   DODO_VERIFYAI_PRODUCT_ID=pdt_0NmpiDe3U2blA83EN7qTE    -- $4.99 one-time
--
-- Webhook: https://bandhamai.vercel.app/api/dodo/webhook

alter table public.subscriptions
  add column if not exists provider text;

alter table public.subscriptions
  add column if not exists dodo_customer_id text;

alter table public.subscriptions
  add column if not exists dodo_subscription_id text;

alter table public.subscriptions
  add column if not exists dodo_product_id text;

create unique index if not exists subscriptions_dodo_customer_id_uidx
  on public.subscriptions (dodo_customer_id)
  where dodo_customer_id is not null;

create unique index if not exists subscriptions_dodo_subscription_id_uidx
  on public.subscriptions (dodo_subscription_id)
  where dodo_subscription_id is not null;

-- Confirm:
-- select user_id, provider, stripe_customer_id, dodo_customer_id, status, current_period_end
-- from public.subscriptions
-- order by updated_at desc
-- limit 10;

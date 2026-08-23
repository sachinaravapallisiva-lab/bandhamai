import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import {
  BILLING_COPY,
  SUBSCRIPTIONS_SQL_FILE,
  SUBSCRIPTIONS_TABLE,
  emptyEntitlement,
  isEntitledStatus,
  type Entitlement,
  type SubscriptionRow,
} from "./billing";
import { subscriptionPeriodEnd, subscriptionPriceId } from "./stripe";
import { tableExists } from "./server-supabase";

export async function subscriptionsTableReady(supabase: SupabaseClient) {
  return tableExists(supabase, SUBSCRIPTIONS_TABLE);
}

export function tableMissingPayload() {
  return {
    configured: true,
    canMessage: false,
    code: "table_missing" as const,
    error: BILLING_COPY.tableMissing,
    sql: SUBSCRIPTIONS_SQL_FILE,
  };
}

export async function getSubscriptionRow(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_TABLE)
    .select("user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_end, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as SubscriptionRow;
}

export async function findUserIdByCustomer(
  supabase: SupabaseClient,
  customerId: string
): Promise<string | null> {
  if (!customerId) return null;
  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_TABLE)
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error || !data?.user_id) return null;
  return String(data.user_id);
}

export async function upsertSubscription(
  supabase: SupabaseClient,
  row: SubscriptionRow
) {
  return supabase.from(SUBSCRIPTIONS_TABLE).upsert(
    {
      user_id: row.user_id,
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: row.stripe_subscription_id,
      stripe_price_id: row.stripe_price_id,
      status: row.status || "none",
      current_period_end: row.current_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export function entitlementFromRow(row: SubscriptionRow | null, configured: boolean): Entitlement {
  return emptyEntitlement({
    configured: configured,
    canMessage: configured && isEntitledStatus(row?.status),
    status: row?.status || null,
    stripeCustomerId: row?.stripe_customer_id || null,
    currentPeriodEnd: row?.current_period_end || null,
  });
}

export function rowFromStripeSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  customerId: string
): SubscriptionRow {
  return {
    user_id: userId,
    stripe_customer_id: customerId || asCustomerId(subscription.customer),
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscriptionPriceId(subscription),
    status: subscription.status,
    current_period_end: subscriptionPeriodEnd(subscription),
  };
}

function asCustomerId(value: Stripe.Subscription["customer"]) {
  return typeof value === "string" ? value : value && !("deleted" in value && value.deleted) ? value.id : "";
}

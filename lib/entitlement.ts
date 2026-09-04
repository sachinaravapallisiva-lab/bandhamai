import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Payment, Subscription as DodoSubscription } from "dodopayments/resources";
import {
  BILLING_COPY,
  SUBSCRIPTIONS_SQL_FILE,
  SUBSCRIPTIONS_TABLE,
  emptyEntitlement,
  isEntitledStatus,
  type Entitlement,
  type SubscriptionRow,
} from "./billing";
import { mapDodoSubscriptionStatus, productIdsFromPayment, userIdFromMetadata } from "./dodo";
import { subscriptionPeriodEnd, subscriptionPriceId } from "./stripe";
import { tableExists, tableHasColumn } from "./server-supabase";

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

function asRow(data: Record<string, unknown>): SubscriptionRow {
  return {
    user_id: String(data.user_id || ""),
    stripe_customer_id: data.stripe_customer_id ? String(data.stripe_customer_id) : null,
    stripe_subscription_id: data.stripe_subscription_id ? String(data.stripe_subscription_id) : null,
    stripe_price_id: data.stripe_price_id ? String(data.stripe_price_id) : null,
    dodo_customer_id: data.dodo_customer_id ? String(data.dodo_customer_id) : null,
    dodo_subscription_id: data.dodo_subscription_id ? String(data.dodo_subscription_id) : null,
    dodo_product_id: data.dodo_product_id ? String(data.dodo_product_id) : null,
    provider: data.provider ? String(data.provider) : null,
    status: String(data.status || "none"),
    current_period_end: data.current_period_end ? String(data.current_period_end) : null,
    updated_at: data.updated_at ? String(data.updated_at) : undefined,
  };
}

export async function getSubscriptionRow(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase.from(SUBSCRIPTIONS_TABLE).select("*").eq("user_id", userId).maybeSingle();

  if (error || !data) return null;
  return asRow(data as Record<string, unknown>);
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
  if (!error && data?.user_id) return String(data.user_id);

  if (await tableHasColumn(supabase, SUBSCRIPTIONS_TABLE, "dodo_customer_id")) {
    const dodo = await supabase
      .from(SUBSCRIPTIONS_TABLE)
      .select("user_id")
      .eq("dodo_customer_id", customerId)
      .maybeSingle();
    if (!dodo.error && dodo.data?.user_id) return String(dodo.data.user_id);
  }
  return null;
}

export async function findUserIdByDodoSubscription(
  supabase: SupabaseClient,
  subscriptionId: string
): Promise<string | null> {
  if (!subscriptionId) return null;
  if (!(await tableHasColumn(supabase, SUBSCRIPTIONS_TABLE, "dodo_subscription_id"))) return null;
  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_TABLE)
    .select("user_id")
    .eq("dodo_subscription_id", subscriptionId)
    .maybeSingle();
  if (error || !data?.user_id) return null;
  return String(data.user_id);
}

export function mergeSubscriptionRow(
  existing: SubscriptionRow | null,
  next: Partial<SubscriptionRow> & { user_id: string }
): SubscriptionRow {
  return {
    user_id: next.user_id,
    stripe_customer_id: next.stripe_customer_id ?? existing?.stripe_customer_id ?? null,
    stripe_subscription_id: next.stripe_subscription_id ?? existing?.stripe_subscription_id ?? null,
    stripe_price_id: next.stripe_price_id ?? existing?.stripe_price_id ?? null,
    dodo_customer_id: next.dodo_customer_id ?? existing?.dodo_customer_id ?? null,
    dodo_subscription_id: next.dodo_subscription_id ?? existing?.dodo_subscription_id ?? null,
    dodo_product_id: next.dodo_product_id ?? existing?.dodo_product_id ?? null,
    provider: next.provider ?? existing?.provider ?? null,
    status: next.status || existing?.status || "none",
    current_period_end: next.current_period_end ?? existing?.current_period_end ?? null,
  };
}

export async function upsertSubscription(supabase: SupabaseClient, row: SubscriptionRow) {
  const payload: Record<string, unknown> = {
    user_id: row.user_id,
    stripe_customer_id: row.stripe_customer_id,
    stripe_subscription_id: row.stripe_subscription_id,
    stripe_price_id: row.stripe_price_id,
    status: row.status || "none",
    current_period_end: row.current_period_end,
    updated_at: new Date().toISOString(),
  };
  if (await tableHasColumn(supabase, SUBSCRIPTIONS_TABLE, "dodo_customer_id")) {
    payload.dodo_customer_id = row.dodo_customer_id;
    payload.dodo_subscription_id = row.dodo_subscription_id;
    payload.dodo_product_id = row.dodo_product_id;
  }
  if (await tableHasColumn(supabase, SUBSCRIPTIONS_TABLE, "provider")) {
    payload.provider = row.provider;
  }
  return supabase.from(SUBSCRIPTIONS_TABLE).upsert(payload, { onConflict: "user_id" });
}

export function entitlementFromRow(row: SubscriptionRow | null, configured: boolean): Entitlement {
  return emptyEntitlement({
    configured: configured,
    canMessage: isEntitledStatus(row?.status),
    status: row?.status || null,
    stripeCustomerId: row?.stripe_customer_id || null,
    dodoCustomerId: row?.dodo_customer_id || null,
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
    dodo_customer_id: null,
    dodo_subscription_id: null,
    dodo_product_id: null,
    provider: "stripe",
    status: subscription.status,
    current_period_end: subscriptionPeriodEnd(subscription),
  };
}

export function rowFromDodoSubscription(
  userId: string,
  subscription: DodoSubscription,
  existing?: SubscriptionRow | null
): SubscriptionRow {
  const customerId = subscription.customer?.customer_id || "";
  return mergeSubscriptionRow(existing || null, {
    user_id: userId,
    dodo_customer_id: customerId || null,
    dodo_subscription_id: subscription.subscription_id || null,
    dodo_product_id: subscription.product_id || null,
    provider: "dodo",
    status: mapDodoSubscriptionStatus(subscription.status),
    current_period_end: subscription.next_billing_date || null,
  });
}

export async function resolveDodoUserId(
  supabase: SupabaseClient,
  input: { metadata?: unknown; customerId?: string | null; subscriptionId?: string | null }
): Promise<string> {
  return (
    userIdFromMetadata(input.metadata) ||
    (input.customerId ? await findUserIdByCustomer(supabase, input.customerId) : null) ||
    (input.subscriptionId ? await findUserIdByDodoSubscription(supabase, input.subscriptionId) : null) ||
    ""
  );
}

export function purposeFromPayment(payment: { metadata?: unknown }) {
  if (!payment.metadata || typeof payment.metadata !== "object") return "";
  const raw = (payment.metadata as { purpose?: unknown }).purpose;
  if (typeof raw === "string") return raw.trim();
  return "";
}

export function paymentLooksLikeSubscribe(
  payment: Payment,
  subscribeProductId: string,
  messagingPurpose: string
) {
  const purpose = purposeFromPayment(payment);
  if (purpose === messagingPurpose) return true;
  if (purpose && purpose !== messagingPurpose) return false;
  if (payment.subscription_id) return true;
  if (!subscribeProductId) return false;
  return productIdsFromPayment(payment).includes(subscribeProductId);
}

function asCustomerId(value: Stripe.Subscription["customer"]) {
  return typeof value === "string" ? value : value && !("deleted" in value && value.deleted) ? value.id : "";
}

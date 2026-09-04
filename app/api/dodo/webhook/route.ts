/**
 * Dodo Payments → Bandham AI entitlement sync.
 *
 * Production URL for Sai: https://bandhamai.vercel.app/api/dodo/webhook
 * After merge, allow this path the same way /api/stripe/webhook is skipped
 * from WAF rate limits. Do not change Vercel firewall from this PR.
 *
 * Events: payment.succeeded, subscription.active, subscription.renewed,
 * subscription.on_hold, subscription.failed, subscription.cancelled,
 * subscription.expired.
 */
import { NextResponse } from "next/server";
import type { Payment, Subscription as DodoSubscription } from "dodopayments/resources";
import { getServiceSupabase, tableExists } from "../../../../lib/server-supabase";
import {
  BILLING_COPY,
  MESSAGING_PURPOSE,
  SUBSCRIPTIONS_SQL_FILE,
  SUBSCRIPTIONS_TABLE,
} from "../../../../lib/billing";
import {
  getSubscriptionRow,
  paymentLooksLikeSubscribe,
  purposeFromPayment,
  resolveDodoUserId,
  rowFromDodoSubscription,
  upsertSubscription,
} from "../../../../lib/entitlement";
import {
  dodoSubscribeProductId,
  dodoVerifyaiProductId,
  dodoWebhookHeaders,
  dodoWebhookKey,
  getDodo,
  isDodoWebhookConfigured,
  mapDodoSubscriptionStatus,
  productIdsFromPayment,
} from "../../../../lib/dodo";
import { VERIFYAI_PURPOSE } from "../../../../lib/verifyai";
import { recordVerifyaiPayment } from "../../../../lib/verifyai-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function paymentLooksLikeVerifyai(payment: Payment) {
  const purpose = purposeFromPayment(payment);
  if (purpose === VERIFYAI_PURPOSE) return true;
  if (purpose === MESSAGING_PURPOSE) return false;
  if (payment.subscription_id) return false;
  const verifyaiProductId = dodoVerifyaiProductId();
  if (!verifyaiProductId) return false;
  return productIdsFromPayment(payment).includes(verifyaiProductId);
}

async function upsertFromDodoSubscription(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
  subscription: DodoSubscription
) {
  if (!supabase) return { error: "Server is missing Supabase configuration." };
  if (!(await tableExists(supabase, SUBSCRIPTIONS_TABLE))) {
    return { error: BILLING_COPY.tableMissing, sql: SUBSCRIPTIONS_SQL_FILE };
  }
  const existing = await getSubscriptionRow(supabase, userId);
  const { error } = await upsertSubscription(supabase, rowFromDodoSubscription(userId, subscription, existing));
  if (error) return { error: error.message };
  return { error: null as string | null };
}

export async function POST(request: Request) {
  try {
    if (!isDodoWebhookConfigured()) {
      return NextResponse.json(
        { error: BILLING_COPY.notConfigured, code: "billing_not_configured" },
        { status: 503 }
      );
    }

    const dodo = getDodo();
    const webhookKey = dodoWebhookKey();
    if (!dodo || !webhookKey) {
      return NextResponse.json(
        { error: BILLING_COPY.notConfigured, code: "billing_not_configured" },
        { status: 503 }
      );
    }

    const headers = dodoWebhookHeaders(request);
    if (!headers["webhook-id"] || !headers["webhook-signature"] || !headers["webhook-timestamp"]) {
      return NextResponse.json({ error: "Missing Dodo webhook signature." }, { status: 400 });
    }

    const rawBody = await request.text();
    let event;
    try {
      event = dodo.webhooks.unwrap(rawBody, { headers, key: webhookKey });
    } catch {
      return NextResponse.json({ error: "Invalid Dodo webhook signature." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Server is missing Supabase configuration." }, { status: 500 });
    }

    if (event.type === "payment.succeeded") {
      const payment = event.data as Payment;
      if (paymentLooksLikeVerifyai(payment)) {
        const userId = await resolveDodoUserId(supabase, {
          metadata: payment.metadata,
          customerId: payment.customer?.customer_id,
        });
        if (!userId) {
          return NextResponse.json({ error: "VerifyAI payment is missing user_id." }, { status: 500 });
        }
        const recorded = await recordVerifyaiPayment(supabase, {
          userId,
          profileId: typeof payment.metadata?.profile_id === "string" ? payment.metadata.profile_id : null,
          checkoutSessionId: payment.checkout_session_id || payment.payment_id,
          paymentIntentId: payment.payment_id,
          amountCents: typeof payment.total_amount === "number" ? payment.total_amount : undefined,
        });
        if (recorded.error) {
          return NextResponse.json({ error: recorded.error }, { status: 500 });
        }
        return NextResponse.json({ received: true, purpose: VERIFYAI_PURPOSE, verified: false });
      }

      if (paymentLooksLikeSubscribe(payment, dodoSubscribeProductId(), MESSAGING_PURPOSE)) {
        const subscriptionId = payment.subscription_id || "";
        const userId = await resolveDodoUserId(supabase, {
          metadata: payment.metadata,
          customerId: payment.customer?.customer_id,
          subscriptionId,
        });
        if (!userId) {
          return NextResponse.json({ error: "Subscribe payment is missing user_id." }, { status: 500 });
        }
        if (subscriptionId) {
          const subscription = await dodo.subscriptions.retrieve(subscriptionId);
          const written = await upsertFromDodoSubscription(supabase, userId, subscription);
          if (written.error) {
            return NextResponse.json(
              { error: written.error, sql: "sql" in written ? written.sql : undefined },
              { status: written.sql ? 503 : 500 }
            );
          }
        } else {
          const existing = await getSubscriptionRow(supabase, userId);
          const { error } = await upsertSubscription(supabase, {
            user_id: userId,
            stripe_customer_id: existing?.stripe_customer_id || null,
            stripe_subscription_id: existing?.stripe_subscription_id || null,
            stripe_price_id: existing?.stripe_price_id || null,
            dodo_customer_id: payment.customer?.customer_id || existing?.dodo_customer_id || null,
            dodo_subscription_id: existing?.dodo_subscription_id || null,
            dodo_product_id: productIdsFromPayment(payment)[0] || existing?.dodo_product_id || null,
            provider: "dodo",
            status: "active",
            current_period_end: existing?.current_period_end || null,
          });
          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        }
        return NextResponse.json({ received: true, purpose: MESSAGING_PURPOSE });
      }

      return NextResponse.json({ received: true });
    }

    if (
      event.type === "subscription.active" ||
      event.type === "subscription.renewed" ||
      event.type === "subscription.on_hold" ||
      event.type === "subscription.failed" ||
      event.type === "subscription.cancelled" ||
      event.type === "subscription.expired"
    ) {
      const subscription = event.data as DodoSubscription;
      const subscribeProductId = dodoSubscribeProductId();
      if (subscribeProductId && subscription.product_id && subscription.product_id !== subscribeProductId) {
        return NextResponse.json({ received: true });
      }

      const userId = await resolveDodoUserId(supabase, {
        metadata: subscription.metadata,
        customerId: subscription.customer?.customer_id,
        subscriptionId: subscription.subscription_id,
      });
      if (!userId) {
        return NextResponse.json({ error: "Subscription is missing user_id." }, { status: 500 });
      }

      const written = await upsertFromDodoSubscription(supabase, userId, subscription);
      if (written.error) {
        return NextResponse.json(
          { error: written.error, sql: "sql" in written ? written.sql : undefined },
          { status: written.sql ? 503 : 500 }
        );
      }
      return NextResponse.json({
        received: true,
        status: mapDodoSubscriptionStatus(subscription.status),
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

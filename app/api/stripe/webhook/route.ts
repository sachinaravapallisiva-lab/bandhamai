/**
 * Stripe → Bandham AI subscription sync.
 *
 * Events write public.subscriptions via the service role. No payment UI here.
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getServiceSupabase,
  tableExists,
} from "../../../../lib/server-supabase";
import {
  BILLING_COPY,
  SUBSCRIPTIONS_SQL_FILE,
  SUBSCRIPTIONS_TABLE,
} from "../../../../lib/billing";
import {
  findUserIdByCustomer,
  rowFromStripeSubscription,
  upsertSubscription,
} from "../../../../lib/entitlement";
import {
  asStripeId,
  getStripe,
  isStripeConfigured,
  stripeWebhookSecret,
} from "../../../../lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userIdFromMetadata(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const raw = (value as { user_id?: unknown }).user_id;
  return typeof raw === "string" ? raw.trim() : "";
}

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: BILLING_COPY.notConfigured, code: "billing_not_configured" },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    const webhookSecret = stripeWebhookSecret();
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: BILLING_COPY.notConfigured, code: "billing_not_configured" },
        { status: 503 }
      );
    }

    const signature = request.headers.get("stripe-signature") || "";
    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const rawBody = await request.text();
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Server is missing Supabase configuration." }, { status: 500 });
    }

    if (!(await tableExists(supabase, SUBSCRIPTIONS_TABLE))) {
      return NextResponse.json(
        { error: BILLING_COPY.tableMissing, sql: SUBSCRIPTIONS_SQL_FILE },
        { status: 503 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode !== "subscription") {
        return NextResponse.json({ received: true });
      }

      const customerId = asStripeId(session.customer);
      const subscriptionId = asStripeId(session.subscription);
      const userId =
        userIdFromMetadata(session.metadata) ||
        (typeof session.client_reference_id === "string" ? session.client_reference_id : "") ||
        (await findUserIdByCustomer(supabase, customerId));

      if (!userId) {
        return NextResponse.json({ error: "Checkout session is missing user_id." }, { status: 500 });
      }

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { error } = await upsertSubscription(
          supabase,
          rowFromStripeSubscription(userId, subscription, customerId)
        );
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
      return NextResponse.json({ received: true });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = asStripeId(subscription.customer);
      const userId =
        userIdFromMetadata(subscription.metadata) ||
        (await findUserIdByCustomer(supabase, customerId));

      if (!userId) {
        return NextResponse.json({ error: "Subscription is missing user_id." }, { status: 500 });
      }

      const { error } = await upsertSubscription(
        supabase,
        rowFromStripeSubscription(userId, subscription, customerId)
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subscriptionId =
        asStripeId(invoice.parent?.subscription_details?.subscription) ||
        asStripeId((invoice as { subscription?: unknown }).subscription);
      if (!subscriptionId) {
        return NextResponse.json({ received: true });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customerId = asStripeId(subscription.customer) || asStripeId(invoice.customer);
      const userId =
        userIdFromMetadata(subscription.metadata) ||
        (await findUserIdByCustomer(supabase, customerId));

      if (!userId) {
        return NextResponse.json({ error: "Invoice subscription is missing user_id." }, { status: 500 });
      }

      const { error } = await upsertSubscription(
        supabase,
        rowFromStripeSubscription(userId, subscription, customerId)
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

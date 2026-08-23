/**
 * Stripe Checkout Session for the $9.99/mo messaging plan.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableExists,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { BILLING_COPY, SUBSCRIPTIONS_SQL_FILE, SUBSCRIPTIONS_TABLE } from "../../../../lib/billing";
import { getSubscriptionRow, upsertSubscription } from "../../../../lib/entitlement";
import {
  appOrigin,
  billingNotConfiguredResponse,
  getStripe,
  isStripeConfigured,
  stripePriceId,
} from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) return billingNotConfiguredResponse();

    if (!hasBearerToken(request)) {
      return unauthorizedResponse(BILLING_COPY.signIn);
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || BILLING_COPY.signIn);

    if (!(await tableExists(supabase, SUBSCRIPTIONS_TABLE))) {
      return NextResponse.json(
        { error: BILLING_COPY.tableMissing, code: "table_missing", sql: SUBSCRIPTIONS_SQL_FILE },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    const priceId = stripePriceId();
    if (!stripe || !priceId) return billingNotConfiguredResponse();

    const existing = await getSubscriptionRow(supabase, user.id);
    let customerId = existing?.stripe_customer_id || "";

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      const { error } = await upsertSubscription(supabase, {
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: existing?.stripe_subscription_id || null,
        stripe_price_id: existing?.stripe_price_id || null,
        status: existing?.status || "none",
        current_period_end: existing?.current_period_end || null,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    const origin = appOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      allow_promotion_codes: false,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: origin + "/?billing=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/?billing=cancel",
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

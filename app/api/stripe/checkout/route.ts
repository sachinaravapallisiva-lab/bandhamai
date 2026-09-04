/**
 * Dodo Checkout Session for the $9.99/mo Bandham AI subscription.
 * Client path stays /api/stripe/checkout. Stripe is not required.
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
import { BILLING_COPY, MESSAGING_PURPOSE, SUBSCRIPTIONS_SQL_FILE, SUBSCRIPTIONS_TABLE } from "../../../../lib/billing";
import { getSubscriptionRow } from "../../../../lib/entitlement";
import { appOrigin } from "../../../../lib/stripe";
import {
  billingNotConfiguredResponse,
  dodoSubscribeProductId,
  getDodo,
  isDodoSubscribeConfigured,
} from "../../../../lib/dodo";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isDodoSubscribeConfigured()) return billingNotConfiguredResponse();

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

    const dodo = getDodo();
    const productId = dodoSubscribeProductId();
    if (!dodo || !productId) return billingNotConfiguredResponse();

    const existing = await getSubscriptionRow(supabase, user.id);
    const origin = appOrigin(request);
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: existing?.dodo_customer_id
        ? { customer_id: existing.dodo_customer_id }
        : user.email
          ? { email: user.email }
          : undefined,
      return_url: origin + "/?billing=success",
      cancel_url: origin + "/?billing=cancel",
      metadata: { user_id: user.id, purpose: MESSAGING_PURPOSE },
      feature_flags: { allow_discount_code: false },
    });

    if (!session.checkout_url) {
      return NextResponse.json({ error: "Checkout did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.checkout_url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

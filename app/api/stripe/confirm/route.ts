/**
 * After Checkout returns, confirm the Session with Stripe (not a fake receipt).
 * The webhook remains the durable source of truth.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { MESSAGING_PRICE_LABEL } from "../../../../lib/billing";
import {
  entitlementFromRow,
  getSubscriptionRow,
  rowFromStripeSubscription,
  subscriptionsTableReady,
  tableMissingPayload,
  upsertSubscription,
} from "../../../../lib/entitlement";
import {
  asStripeId,
  billingNotConfiguredResponse,
  getStripe,
  isStripeConfigured,
} from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) return billingNotConfiguredResponse();

    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to confirm checkout.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a checkout session_id." }, { status: 400 });
    }

    const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
    if (!sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Send a checkout session_id." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await subscriptionsTableReady(supabase))) {
      return NextResponse.json(tableMissingPayload(), { status: 503 });
    }

    const stripe = getStripe();
    if (!stripe) return billingNotConfiguredResponse();

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionUser =
      (session.metadata && session.metadata.user_id) || session.client_reference_id || "";
    if (sessionUser && sessionUser !== user.id) {
      return NextResponse.json({ error: "This checkout session belongs to another account." }, { status: 403 });
    }

    const subscriptionId = asStripeId(session.subscription);
    const customerId = asStripeId(session.customer);
    if (subscriptionId && (session.payment_status === "paid" || session.status === "complete")) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const { error } = await upsertSubscription(
        supabase,
        rowFromStripeSubscription(user.id, subscription, customerId)
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    const row = await getSubscriptionRow(supabase, user.id);
    return NextResponse.json({
      ...entitlementFromRow(row, true),
      priceLabel: MESSAGING_PRICE_LABEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not confirm checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

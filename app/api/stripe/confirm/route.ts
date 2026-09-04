/**
 * After Dodo Checkout returns, confirm payment/subscription (not a fake receipt).
 * The webhook remains the durable source of truth. This path also polls the row.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { MESSAGING_PRICE_LABEL, MESSAGING_PURPOSE } from "../../../../lib/billing";
import {
  entitlementFromRow,
  getSubscriptionRow,
  paymentLooksLikeSubscribe,
  purposeFromPayment,
  rowFromDodoSubscription,
  subscriptionsTableReady,
  tableMissingPayload,
  upsertSubscription,
} from "../../../../lib/entitlement";
import { dodoSubscribeProductId, getDodo, isPaidIntentStatus } from "../../../../lib/dodo";
import { VERIFYAI_PURPOSE } from "../../../../lib/verifyai";

export const runtime = "nodejs";

function asId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to confirm checkout.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const sessionId = asId(body.session_id);
    const paymentIdInput = asId(body.payment_id);
    const subscriptionIdInput = asId(body.subscription_id);

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await subscriptionsTableReady(supabase))) {
      return NextResponse.json(tableMissingPayload(), { status: 503 });
    }

    const dodo = getDodo();
    if (dodo && (sessionId || paymentIdInput || subscriptionIdInput)) {
      try {
        let paymentId = paymentIdInput;
        if (!paymentId && sessionId) {
          const session = await dodo.checkoutSessions.retrieve(sessionId);
          if (session.payment_id && isPaidIntentStatus(session.payment_status)) {
            paymentId = session.payment_id;
          }
        }

        let subscriptionId = subscriptionIdInput;
        if (paymentId) {
          const payment = await dodo.payments.retrieve(paymentId);
          const purpose = purposeFromPayment(payment);
          if (purpose === VERIFYAI_PURPOSE) {
            const row = await getSubscriptionRow(supabase, user.id);
            return NextResponse.json({
              ...entitlementFromRow(row, true),
              priceLabel: MESSAGING_PRICE_LABEL,
            });
          }
          if (
            paymentLooksLikeSubscribe(payment, dodoSubscribeProductId(), MESSAGING_PURPOSE) &&
            (isPaidIntentStatus(payment.status) || payment.subscription_id)
          ) {
            subscriptionId = subscriptionId || payment.subscription_id || "";
          }
        }

        if (subscriptionId) {
          const subscription = await dodo.subscriptions.retrieve(subscriptionId);
          const existing = await getSubscriptionRow(supabase, user.id);
          const { error } = await upsertSubscription(
            supabase,
            rowFromDodoSubscription(user.id, subscription, existing)
          );
          if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
          }
        }
      } catch {
        // Webhook may already have written the row. Fall through to poll.
      }
    }

    const row = await getSubscriptionRow(supabase, user.id);
    const configured = true;
    return NextResponse.json({
      ...entitlementFromRow(row, configured),
      priceLabel: MESSAGING_PRICE_LABEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not confirm checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

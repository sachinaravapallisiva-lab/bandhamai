/**
 * After $4.99 Checkout, confirm the Session with Stripe.
 * Records payment and sets verifyai_status=pending. Never verified from pay alone.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { VERIFYAI_COPY, VERIFYAI_PURPOSE, isVerifyaiVerified } from "../../../../lib/verifyai";
import {
  buildVerifyaiStartUrl,
  loadVerifyaiState,
  recordVerifyaiPayment,
  rememberVerifyaiExternalId,
} from "../../../../lib/verifyai-checkout";
import { appOrigin, asStripeId, getStripe, stripeSecretKey } from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!stripeSecretKey()) {
      return NextResponse.json({ error: VERIFYAI_COPY.notConfigured }, { status: 503 });
    }
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to confirm VerifyAI payment.");
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

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: VERIFYAI_COPY.notConfigured }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const purpose = session.metadata?.purpose || "";
    const sessionUser = session.metadata?.user_id || session.client_reference_id || "";
    if (sessionUser && sessionUser !== user.id) {
      return NextResponse.json({ error: "This checkout session belongs to another account." }, { status: 403 });
    }
    if (session.mode !== "payment" || purpose !== VERIFYAI_PURPOSE) {
      return NextResponse.json({ error: "This checkout session is not the $4.99 VerifyAI payment." }, { status: 400 });
    }
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json({ error: "Stripe has not marked this payment paid yet." }, { status: 402 });
    }

    const recorded = await recordVerifyaiPayment(supabase, {
      userId: user.id,
      profileId: session.metadata?.profile_id || null,
      checkoutSessionId: session.id,
      paymentIntentId: asStripeId(session.payment_intent),
      amountCents: typeof session.amount_total === "number" ? session.amount_total : undefined,
    });
    if (recorded.error) {
      return NextResponse.json({ error: recorded.error, sql: "sql" in recorded ? recorded.sql : undefined }, { status: 400 });
    }

    const start = await buildVerifyaiStartUrl({
      origin: appOrigin(request),
      userId: user.id,
      email: user.email,
      profileId: recorded.profileId,
      checkoutSessionId: session.id,
    });
    if (start.externalId) {
      await rememberVerifyaiExternalId(supabase, {
        userId: user.id,
        profileId: recorded.profileId,
        externalId: start.externalId,
      });
    }

    const state = await loadVerifyaiState(supabase, user.id);
    return NextResponse.json({
      paid: true,
      verified: isVerifyaiVerified(state.status),
      status: state.status,
      start_url: start.url,
      start_configured: !!start.url,
      message: start.url ? VERIFYAI_COPY.paid : VERIFYAI_COPY.startMissing,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not confirm VerifyAI payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * After $4.99 Checkout, confirm the Session with Dodo.
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
import { MESSAGING_PURPOSE } from "../../../../lib/billing";
import { VERIFYAI_COPY, VERIFYAI_PURPOSE, isVerifyaiVerified } from "../../../../lib/verifyai";
import {
  buildVerifyaiStartUrl,
  loadVerifyaiState,
  recordVerifyaiPayment,
  rememberVerifyaiExternalId,
} from "../../../../lib/verifyai-checkout";
import { appOrigin } from "../../../../lib/stripe";
import {
  dodoSubscribeProductId,
  dodoVerifyaiProductId,
  getDodo,
  isDodoVerifyaiConfigured,
  isPaidIntentStatus,
  productIdsFromPayment,
} from "../../../../lib/dodo";
import { purposeFromPayment } from "../../../../lib/entitlement";
import { canStartVerifyai } from "../../../../lib/terms-agree";

export const runtime = "nodejs";

function asId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    if (!isDodoVerifyaiConfigured()) {
      return NextResponse.json({ error: VERIFYAI_COPY.notConfigured }, { status: 503 });
    }
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to confirm VerifyAI payment.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a checkout session_id or payment_id." }, { status: 400 });
    }

    const sessionId = asId(body.session_id);
    let paymentId = asId(body.payment_id);
    if (!sessionId && !paymentId) {
      return NextResponse.json({ error: "Send a checkout session_id or payment_id." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const dodo = getDodo();
    if (!dodo) {
      return NextResponse.json({ error: VERIFYAI_COPY.notConfigured }, { status: 503 });
    }

    if (!paymentId && sessionId) {
      const session = await dodo.checkoutSessions.retrieve(sessionId);
      if (!isPaidIntentStatus(session.payment_status) || !session.payment_id) {
        return NextResponse.json({ error: "Billing has not marked this payment paid yet." }, { status: 402 });
      }
      paymentId = session.payment_id;
    }

    const payment = await dodo.payments.retrieve(paymentId);
    const purpose = purposeFromPayment(payment);
    const productIds = productIdsFromPayment(payment);
    const verifyaiProductId = dodoVerifyaiProductId();
    const subscribeProductId = dodoSubscribeProductId();
    const isVerifyai =
      purpose === VERIFYAI_PURPOSE ||
      (!purpose && !!verifyaiProductId && productIds.includes(verifyaiProductId));
    if (!isVerifyai || purpose === MESSAGING_PURPOSE || (subscribeProductId && productIds.includes(subscribeProductId))) {
      return NextResponse.json({ error: "This checkout session is not the $4.99 VerifyAI payment." }, { status: 400 });
    }
    if (!isPaidIntentStatus(payment.status)) {
      return NextResponse.json({ error: "Billing has not marked this payment paid yet." }, { status: 402 });
    }

    const recorded = await recordVerifyaiPayment(supabase, {
      userId: user.id,
      profileId: typeof payment.metadata?.profile_id === "string" ? payment.metadata.profile_id : null,
      checkoutSessionId: payment.checkout_session_id || sessionId || payment.payment_id,
      paymentIntentId: payment.payment_id,
      amountCents: typeof payment.total_amount === "number" ? payment.total_amount : undefined,
    });
    if (recorded.error) {
      return NextResponse.json({ error: recorded.error, sql: "sql" in recorded ? recorded.sql : undefined }, { status: 400 });
    }

    const state = await loadVerifyaiState(supabase, user.id);
    if (state.under18) {
      return NextResponse.json({
        paid: true,
        verified: false,
        status: state.status,
        hasPhoto: state.hasPhoto,
        under18: true,
        start_url: null,
        start_configured: state.startConfigured,
        first_party: state.firstParty,
        error: VERIFYAI_COPY.underage,
        message: VERIFYAI_COPY.underage,
      });
    }
    if (!state.hasPhoto) {
      return NextResponse.json({
        paid: true,
        verified: false,
        status: state.status,
        hasPhoto: false,
        under18: false,
        start_url: null,
        start_configured: state.startConfigured,
        first_party: state.firstParty,
        error: VERIFYAI_COPY.photoRequired,
        message: VERIFYAI_COPY.photoRequired,
      });
    }

    if (!canStartVerifyai(body.agreed)) {
      return NextResponse.json({
        paid: true,
        verified: isVerifyaiVerified(state.status),
        status: state.status,
        hasPhoto: true,
        under18: false,
        start_url: null,
        start_configured: state.startConfigured,
        first_party: state.firstParty,
        message: VERIFYAI_COPY.paid,
      });
    }

    const start = await buildVerifyaiStartUrl({
      origin: appOrigin(request),
      userId: user.id,
      email: user.email,
      profileId: recorded.profileId,
      checkoutSessionId: payment.checkout_session_id || sessionId || payment.payment_id,
    });
    if (start.externalId) {
      await rememberVerifyaiExternalId(supabase, {
        userId: user.id,
        profileId: recorded.profileId,
        externalId: start.externalId,
      });
    }

    return NextResponse.json({
      paid: true,
      verified: isVerifyaiVerified(state.status),
      status: state.status,
      hasPhoto: true,
      under18: false,
      start_url: start.url,
      start_configured: !!start.url,
      first_party: state.firstParty,
      message: start.url ? VERIFYAI_COPY.paid : VERIFYAI_COPY.startMissing,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not confirm VerifyAI payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

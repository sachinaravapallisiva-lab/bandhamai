/**
 * After event ticket Checkout, confirm the Session with Stripe and write RSVP.
 * Does not unlock $9.99/mo messaging.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import {
  EVENT_TICKET_PURPOSE,
  MEETUP_COPY,
  ticketNotConfiguredPayload,
} from "../../../../lib/meetup";
import {
  loadCurrentMeetup,
  meetupTableMissingResponse,
  meetupTablesReady,
  recordEventTicket,
  userHasRsvp,
} from "../../../../lib/meetup-server";
import { asStripeId, getStripe, stripeEventPriceId, stripeSecretKey } from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!stripeSecretKey() || !stripeEventPriceId()) {
      return NextResponse.json(ticketNotConfiguredPayload(), { status: 503 });
    }
    if (!hasBearerToken(request)) {
      return unauthorizedResponse(MEETUP_COPY.rsvpNeedSignIn);
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
    if (!user) return unauthorizedResponse(authError || MEETUP_COPY.rsvpNeedSignIn);

    if (!(await meetupTablesReady(supabase))) {
      return meetupTableMissingResponse();
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(ticketNotConfiguredPayload(), { status: 503 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const purpose = session.metadata?.purpose || "";
    const sessionUser = session.metadata?.user_id || session.client_reference_id || "";
    if (sessionUser && sessionUser !== user.id) {
      return NextResponse.json({ error: "This checkout session belongs to another account." }, { status: 403 });
    }
    if (session.mode !== "payment" || purpose !== EVENT_TICKET_PURPOSE) {
      return NextResponse.json({ error: "This checkout session is not the meetup event ticket." }, { status: 400 });
    }
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json({ error: "Stripe has not marked this payment paid yet." }, { status: 402 });
    }

    const meetup = await loadCurrentMeetup(supabase);
    const meetupId = (session.metadata?.meetup_id || "").trim() || meetup.id;
    const recorded = await recordEventTicket(supabase, {
      meetupId,
      userId: user.id,
      checkoutSessionId: session.id,
      paymentIntentId: asStripeId(session.payment_intent),
      priceId: stripeEventPriceId(),
      amountCents: typeof session.amount_total === "number" ? session.amount_total : null,
    });
    if (recorded.error) {
      return NextResponse.json({ error: recorded.error }, { status: 400 });
    }

    return NextResponse.json({
      ticketPaid: true,
      rsvped: await userHasRsvp(supabase, meetupId, user.id),
      meetup_id: meetupId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not confirm the event ticket.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

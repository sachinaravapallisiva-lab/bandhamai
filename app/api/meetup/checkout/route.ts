/**
 * Stripe Checkout for the meetup event ticket (one time, mode=payment).
 * Separate from /api/stripe/checkout ($9.99/mo messaging) and VerifyAI.
 * Fails closed if STRIPE_EVENT_PRICE_ID is missing. Does not invent an amount.
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
  isEventTicketPrice,
  meetupCheckoutReturnUrls,
  ticketNotConfiguredPayload,
} from "../../../../lib/meetup";
import {
  ensureRsvpFromTicket,
  loadCurrentMeetup,
  meetupTableMissingResponse,
  meetupTablesReady,
  userHasPaidTicket,
} from "../../../../lib/meetup-server";
import {
  appOrigin,
  getStripe,
  stripeEventPriceId,
  stripePriceId,
  stripeSecretKey,
  stripeVerifyaiPriceId,
} from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!stripeSecretKey() || !stripeEventPriceId()) {
      return NextResponse.json(ticketNotConfiguredPayload(), { status: 503 });
    }

    if (!hasBearerToken(request)) {
      return unauthorizedResponse(MEETUP_COPY.rsvpNeedSignIn);
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || MEETUP_COPY.rsvpNeedSignIn);

    if (!(await meetupTablesReady(supabase))) {
      return meetupTableMissingResponse();
    }

    const meetup = await loadCurrentMeetup(supabase);
    if (await userHasPaidTicket(supabase, meetup.id, user.id)) {
      await ensureRsvpFromTicket(supabase, meetup.id, user.id);
      return NextResponse.json({
        alreadyPaid: true,
        rsvped: true,
        ticketPaid: true,
        url: "",
      });
    }

    const stripe = getStripe();
    const priceId = stripeEventPriceId();
    if (!stripe || !priceId) {
      return NextResponse.json(ticketNotConfiguredPayload(), { status: 503 });
    }

    const price = await stripe.prices.retrieve(priceId);
    if (!isEventTicketPrice(price, stripePriceId(), stripeVerifyaiPriceId())) {
      return NextResponse.json(
        { error: MEETUP_COPY.ticketWrongPrice, code: "event_ticket_wrong_price" },
        { status: 503 }
      );
    }

    const origin = appOrigin(request);
    const returnUrls = meetupCheckoutReturnUrls(origin);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      allow_promotion_codes: false,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: returnUrls.success_url,
      cancel_url: returnUrls.cancel_url,
      metadata: {
        user_id: user.id,
        purpose: EVENT_TICKET_PURPOSE,
        meetup_id: meetup.id,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start event ticket checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

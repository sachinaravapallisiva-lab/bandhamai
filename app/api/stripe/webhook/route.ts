/**
 * Stripe webhook — meetup event tickets only.
 * Messaging and VerifyAI checkout now use POST /api/dodo/webhook.
 */
import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../../lib/server-supabase";
import { BILLING_COPY } from "../../../../lib/billing";
import { asStripeId, getStripe, isStripeSignatureConfigured, stripeWebhookSecret } from "../../../../lib/stripe";
import { EVENT_TICKET_PURPOSE } from "../../../../lib/meetup";
import { recordEventTicket } from "../../../../lib/meetup-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userIdFromMetadata(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const raw = (value as { user_id?: unknown }).user_id;
  return typeof raw === "string" ? raw.trim() : "";
}

export async function POST(request: Request) {
  try {
    if (!isStripeSignatureConfigured()) {
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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const purpose = session.metadata?.purpose || "";
      if (session.mode === "payment" && purpose === EVENT_TICKET_PURPOSE) {
        const userId =
          userIdFromMetadata(session.metadata) ||
          (typeof session.client_reference_id === "string" ? session.client_reference_id : "");
        const meetupId = typeof session.metadata?.meetup_id === "string" ? session.metadata.meetup_id.trim() : "";
        if (!userId || !meetupId) {
          return NextResponse.json({ error: "Meetup ticket checkout is missing user_id or meetup_id." }, { status: 500 });
        }
        if (session.payment_status === "paid" || session.status === "complete") {
          const recorded = await recordEventTicket(supabase, {
            meetupId,
            userId,
            checkoutSessionId: session.id,
            paymentIntentId: asStripeId(session.payment_intent),
            amountCents: typeof session.amount_total === "number" ? session.amount_total : null,
          });
          if (recorded.error) {
            return NextResponse.json({ error: recorded.error }, { status: 500 });
          }
        }
        return NextResponse.json({ received: true, purpose: EVENT_TICKET_PURPOSE });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

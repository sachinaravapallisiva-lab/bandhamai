/**
 * Stripe Customer Portal — manage or cancel the messaging subscription.
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
import { getSubscriptionRow } from "../../../../lib/entitlement";
import {
  appOrigin,
  billingNotConfiguredResponse,
  getStripe,
  isStripeConfigured,
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

    const row = await getSubscriptionRow(supabase, user.id);
    if (!row?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer yet. Subscribe first.", code: "no_customer" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    if (!stripe) return billingNotConfiguredResponse();

    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: appOrigin(request) + "/",
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a portal URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not open the billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

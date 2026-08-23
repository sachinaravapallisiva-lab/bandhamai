/**
 * Current member's messaging entitlement (from public.subscriptions).
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
  subscriptionsTableReady,
  tableMissingPayload,
} from "../../../../lib/entitlement";
import { billingNotConfiguredResponse, isStripeConfigured } from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!isStripeConfigured()) return billingNotConfiguredResponse();

    if (!hasBearerToken(request)) {
      return NextResponse.json({
        configured: true,
        canMessage: false,
        status: null,
        priceLabel: MESSAGING_PRICE_LABEL,
        stripeCustomerId: null,
        currentPeriodEnd: null,
        code: "signed_out",
        error: "Sign in to subscribe or send a message.",
      });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await subscriptionsTableReady(supabase))) {
      return NextResponse.json(tableMissingPayload(), { status: 503 });
    }

    const row = await getSubscriptionRow(supabase, user.id);
    return NextResponse.json({
      ...entitlementFromRow(row, true),
      priceLabel: MESSAGING_PRICE_LABEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not check messaging access.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

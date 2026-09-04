/**
 * Dodo customer portal — manage or cancel the messaging subscription.
 * Legacy Stripe-only rows keep messaging; this does not open a Stripe portal.
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
import { appOrigin } from "../../../../lib/stripe";
import { billingNotConfiguredResponse, getDodo, isDodoSubscribeConfigured } from "../../../../lib/dodo";

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

    const row = await getSubscriptionRow(supabase, user.id);
    if (!row?.dodo_customer_id) {
      return NextResponse.json(
        {
          error:
            "Manage billing is available after you subscribe with the current checkout. This account does not have a billing customer yet.",
          code: "no_customer",
        },
        { status: 400 }
      );
    }

    const dodo = getDodo();
    if (!dodo) return billingNotConfiguredResponse();

    const session = await dodo.customers.customerPortal.create(row.dodo_customer_id, {
      return_url: appOrigin(request) + "/",
    });

    if (!session.link) {
      return NextResponse.json({ error: "Billing did not return a portal URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not open the billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Stripe Checkout for the $4.99 VerifyAI SKU (one-time, mode=payment).
 * Separate from /api/stripe/checkout ($9.99/mo messaging).
 * Paying does not set verifyai_status=verified.
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
import {
  VERIFYAI_COPY,
  VERIFYAI_DEFAULT_RETURN_PATH,
  VERIFYAI_PAYMENTS_TABLE,
  VERIFYAI_PRICE_LABEL,
  VERIFYAI_PURPOSE,
  VERIFYAI_SQL_FILE,
  isOneTimeVerifyaiPrice,
  safeVerifyaiReturnPath,
  verifyaiCheckoutReturnUrls,
} from "../../../../lib/verifyai";
import { loadVerifyaiState, verifyaiPhotoRequiredBody, verifyaiUnderageBody } from "../../../../lib/verifyai-checkout";
import { appOrigin, getStripe, stripeSecretKey, stripeVerifyaiPriceId } from "../../../../lib/stripe";

export const runtime = "nodejs";

function checkoutNotConfigured() {
  return NextResponse.json(
    { error: VERIFYAI_COPY.notConfigured, code: "verifyai_checkout_not_configured" },
    { status: 503 }
  );
}

async function readCheckoutReturnPath(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const next = typeof body.next === "string" ? body.next : "";
    const returnPath = typeof body.return_path === "string" ? body.return_path : "";
    return safeVerifyaiReturnPath(next || returnPath);
  } catch {
    return VERIFYAI_DEFAULT_RETURN_PATH;
  }
}

export async function POST(request: Request) {
  try {
    if (!stripeSecretKey() || !stripeVerifyaiPriceId()) return checkoutNotConfigured();

    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to pay for VerifyAI.");
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await tableExists(supabase, VERIFYAI_PAYMENTS_TABLE))) {
      return NextResponse.json(
        { error: "Run " + VERIFYAI_SQL_FILE + " before taking a VerifyAI payment.", sql: VERIFYAI_SQL_FILE },
        { status: 503 }
      );
    }

    const state = await loadVerifyaiState(supabase, user.id);
    if (state.verified) {
      return NextResponse.json({ error: VERIFYAI_COPY.already, verified: true }, { status: 409 });
    }
    if (!state.hasPhoto) {
      return NextResponse.json(verifyaiPhotoRequiredBody(), { status: 409 });
    }
    if (state.under18) {
      return NextResponse.json(verifyaiUnderageBody(), { status: 403 });
    }

    const stripe = getStripe();
    const priceId = stripeVerifyaiPriceId();
    if (!stripe || !priceId) return checkoutNotConfigured();

    const price = await stripe.prices.retrieve(priceId);
    if (!isOneTimeVerifyaiPrice(price)) {
      return NextResponse.json(
        { error: VERIFYAI_COPY.wrongPrice, code: "verifyai_price_not_one_time" },
        { status: 503 }
      );
    }

    const origin = appOrigin(request);
    const returnPath = await readCheckoutReturnPath(request);
    const returnUrls = verifyaiCheckoutReturnUrls(origin, returnPath);
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
        purpose: VERIFYAI_PURPOSE,
        profile_id: state.profileId || "",
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({
      url: session.url,
      priceLabel: VERIFYAI_PRICE_LABEL,
      verified: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start VerifyAI checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

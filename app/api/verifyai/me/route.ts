import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { VERIFYAI_COPY, VERIFYAI_PRICE_LABEL } from "../../../../lib/verifyai";
import { loadVerifyaiState } from "../../../../lib/verifyai-checkout";
import { isDodoVerifyaiConfigured } from "../../../../lib/dodo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to see verification status.");
    }
    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();
    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const state = await loadVerifyaiState(supabase, user.id);
    const checkoutConfigured = isDodoVerifyaiConfigured();
    return NextResponse.json({
      ...state,
      checkoutConfigured,
      priceLabel: VERIFYAI_PRICE_LABEL,
      copy: VERIFYAI_COPY,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load verification status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

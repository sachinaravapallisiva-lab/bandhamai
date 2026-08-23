/**
 * After a paid $4.99 session, hand the member to VerifyAI.
 * Does not mark the profile verified.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { VERIFYAI_COPY } from "../../../../lib/verifyai";
import {
  buildVerifyaiStartUrl,
  hasPaidVerifyai,
  loadVerifyaiState,
  rememberVerifyaiExternalId,
} from "../../../../lib/verifyai-checkout";
import { appOrigin } from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to start VerifyAI.");
    }
    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();
    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const state = await loadVerifyaiState(supabase, user.id);
    if (state.verified) {
      return NextResponse.json({ verified: true, url: null, message: VERIFYAI_COPY.already });
    }
    if (!(await hasPaidVerifyai(supabase, user.id, state.profileId))) {
      return NextResponse.json(
        { error: "Pay $4.99 first. Payment alone does not verify the profile.", paid: false, verified: false },
        { status: 402 }
      );
    }

    const start = await buildVerifyaiStartUrl({
      origin: appOrigin(request),
      userId: user.id,
      email: user.email,
      profileId: state.profileId,
    });
    if (start.externalId) {
      await rememberVerifyaiExternalId(supabase, {
        userId: user.id,
        profileId: state.profileId,
        externalId: start.externalId,
      });
    }
    if (!start.url) {
      return NextResponse.json(
        { paid: true, verified: false, url: null, error: VERIFYAI_COPY.startMissing },
        { status: 503 }
      );
    }
    return NextResponse.json({ paid: true, verified: false, url: start.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start VerifyAI.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * First-party VerifyAI device check. WebAuthn with userVerification required.
 * Stores pass or fail only.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { canStartVerifyai, TERMS_NEED_VERIFYAI } from "../../../../lib/terms-agree";
import { VERIFYAI_COPY, isVerifyaiVerified } from "../../../../lib/verifyai";
import {
  hasPaidVerifyai,
  loadVerifyaiState,
  markVerifyaiSessionResult,
  profileIsUnder18,
  verifyaiPhotoRequiredBody,
  verifyaiUnderageBody,
} from "../../../../lib/verifyai-checkout";
import {
  authenticatorUserVerified,
  createVerifyaiDeviceChallenge,
  originsMatch,
  parseWebAuthnClientData,
  readVerifyaiDeviceChallenge,
  verifyaiDeviceFailedBody,
  verifyaiDevicePublicKeyOptions,
  verifyaiTermsRequiredBody,
} from "../../../../lib/verifyai-device";
import { appOrigin } from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to start the device check.");
    }
    const url = new URL(request.url);
    if (!canStartVerifyai(url.searchParams.get("agreed"))) {
      return NextResponse.json({ ...verifyaiTermsRequiredBody(), error: TERMS_NEED_VERIFYAI }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();
    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const state = await loadVerifyaiState(supabase, user.id);
    if (state.verified) {
      return NextResponse.json({ verified: true, publicKey: null, message: VERIFYAI_COPY.already });
    }
    if (!state.hasPhoto) {
      return NextResponse.json({ ...verifyaiPhotoRequiredBody(), paid: state.paid }, { status: 409 });
    }
    if (state.under18 || (await profileIsUnder18(supabase, state.profileId))) {
      return NextResponse.json({ ...verifyaiUnderageBody(), paid: state.paid }, { status: 403 });
    }
    if (!(await hasPaidVerifyai(supabase, user.id, state.profileId))) {
      return NextResponse.json(
        { error: "Pay $4.99 first. Payment alone does not verify the profile.", paid: false, verified: false },
        { status: 402 }
      );
    }

    const issued = createVerifyaiDeviceChallenge({ userId: user.id, profileId: state.profileId });
    const origin = appOrigin(request);
    return NextResponse.json({
      paid: true,
      verified: false,
      token: issued.token,
      userVerification: "required",
      publicKey: verifyaiDevicePublicKeyOptions({
        challenge: issued.challenge,
        origin,
        userId: user.id,
        email: user.email,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start the device check.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to finish the device check.");
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Send the device check result." }, { status: 400 });
    }

    if (!canStartVerifyai(body.agreed)) {
      return NextResponse.json({ ...verifyaiTermsRequiredBody(), error: TERMS_NEED_VERIFYAI }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();
    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const state = await loadVerifyaiState(supabase, user.id);
    if (state.verified) {
      return NextResponse.json({ verified: true, status: "verified", message: VERIFYAI_COPY.already });
    }
    if (!state.hasPhoto) {
      return NextResponse.json({ ...verifyaiPhotoRequiredBody(), paid: state.paid }, { status: 409 });
    }
    if (state.under18 || (await profileIsUnder18(supabase, state.profileId))) {
      return NextResponse.json({ ...verifyaiUnderageBody(), paid: state.paid }, { status: 403 });
    }
    if (!(await hasPaidVerifyai(supabase, user.id, state.profileId))) {
      return NextResponse.json(
        { error: "Pay $4.99 first. Payment alone does not verify the profile.", paid: false, verified: false },
        { status: 402 }
      );
    }
    if (!state.profileId) {
      return NextResponse.json({ error: "Create a profile before VerifyAI." }, { status: 409 });
    }

    const canceled = body.canceled === true || body.result === "canceled";
    const failed = body.failed === true || body.result === "failed";
    if (canceled || failed) {
      const status = canceled ? "pending" : "failed";
      await markVerifyaiSessionResult(supabase, {
        userId: user.id,
        profileId: state.profileId,
        status,
        externalId: "device",
      });
      return NextResponse.json({
        ...verifyaiDeviceFailedBody(canceled),
        paid: true,
        verified: false,
        status,
      });
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const clientDataJSON = typeof body.clientDataJSON === "string" ? body.clientDataJSON.trim() : "";
    const authenticatorData = typeof body.authenticatorData === "string" ? body.authenticatorData.trim() : "";
    if (!token || !clientDataJSON || !authenticatorData) {
      return NextResponse.json({ error: VERIFYAI_COPY.deviceFailed, paid: true, verified: false }, { status: 400 });
    }

    const challenge = readVerifyaiDeviceChallenge(token, user.id);
    if ("error" in challenge) {
      return NextResponse.json({ error: challenge.error, paid: true, verified: false }, { status: 400 });
    }

    const client = parseWebAuthnClientData(clientDataJSON);
    const origin = appOrigin(request);
    const typeOk = client.type === "webauthn.create" || client.type === "webauthn.get";
    if (!typeOk || client.challenge !== challenge.challenge || !originsMatch(client.origin, origin)) {
      await markVerifyaiSessionResult(supabase, {
        userId: user.id,
        profileId: state.profileId,
        status: "failed",
        externalId: "device",
      });
      return NextResponse.json({ ...verifyaiDeviceFailedBody(false), paid: true, verified: false }, { status: 400 });
    }
    if (!authenticatorUserVerified(authenticatorData)) {
      await markVerifyaiSessionResult(supabase, {
        userId: user.id,
        profileId: state.profileId,
        status: "failed",
        externalId: "device",
      });
      return NextResponse.json({ ...verifyaiDeviceFailedBody(false), paid: true, verified: false }, { status: 400 });
    }

    const marked = await markVerifyaiSessionResult(supabase, {
      userId: user.id,
      profileId: state.profileId,
      status: "verified",
      externalId: "device",
    });
    if (marked.error) {
      const underage = marked.error === VERIFYAI_COPY.underage;
      const photo = marked.error === VERIFYAI_COPY.photoRequired;
      return NextResponse.json(
        { error: marked.error, paid: true, verified: false },
        { status: underage ? 403 : photo ? 409 : 400 }
      );
    }

    const next = await loadVerifyaiState(supabase, user.id);
    return NextResponse.json({
      paid: true,
      verified: isVerifyaiVerified(next.status),
      status: next.status,
      hasPhoto: next.hasPhoto,
      message: isVerifyaiVerified(next.status) ? VERIFYAI_COPY.already : VERIFYAI_COPY.deviceFailed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not finish the device check.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Quiet in-app profile views.
 *
 * POST — signed-in member opened another member's profile
 * GET  — own incoming viewers (Who viewed you) or own outgoing ids
 *
 * Browse stays free. No subscription check. No email. No push.
 */
import { NextResponse } from "next/server";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../lib/server-supabase";
import {
  PROFILE_VIEWS_SQL_FILE,
  profileViewsTableMissingHint,
} from "../../../lib/profile-views";
import {
  loadIncomingViewers,
  loadOutgoingViewedIds,
  profileViewsReady,
  recordProfileView,
} from "../../../lib/profile-views-server";
import { asId } from "../../../lib/safety-server";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

function tableMissingResponse() {
  return NextResponse.json(
    { error: profileViewsTableMissingHint(), code: "table_missing", sql: PROFILE_VIEWS_SQL_FILE },
    { status: 503 }
  );
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to see who viewed you.");
    }

    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await profileViewsReady(supabase))) {
      return tableMissingResponse();
    }

    const url = new URL(request.url);
    const kind = (url.searchParams.get("kind") || "incoming").trim().toLowerCase();

    if (kind === "outgoing") {
      const raw = url.searchParams.get("profile_ids") || "";
      const profileIds = raw
        .split(",")
        .map(function (id) {
          return id.trim();
        })
        .filter(Boolean)
        .slice(0, 40);
      const viewed = await loadOutgoingViewedIds(supabase, user.id, profileIds);
      return NextResponse.json({
        profile_ids: Array.from(viewed),
      });
    }

    const viewers = await loadIncomingViewers(supabase, user.id);
    return NextResponse.json({ viewers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to record a profile view.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON profile view." }, { status: 400 });
    }

    const profileId = asId(body.profile_id);
    if (!profileId) {
      return NextResponse.json({ error: "Choose a profile to record." }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save a profile view." },
        { status: 500 }
      );
    }

    if (!(await profileViewsReady(supabase))) {
      return tableMissingResponse();
    }

    const result = await recordProfileView(supabase, {
      viewerId: user.id,
      profileId,
    });
    if (!result.ok) {
      const status = result.code === "not_found" ? 404 : result.code === "skipped" ? 400 : 400;
      return NextResponse.json({ error: result.error, code: result.code || "error" }, { status });
    }

    return NextResponse.json({ ok: true, seen: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not record the profile view.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Block / unblock another member.
 *
 * POST hides that profile from Browse and stops messaging both ways once
 * supabase/safety.sql is applied. GET lists the viewer's blocks.
 */
import { NextResponse } from "next/server";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableExists,
  unauthorizedResponse,
} from "../../../lib/server-supabase";
import { BLOCKS_TABLE, SAFETY_SQL_FILE, tableMissingHint } from "../../../lib/safety";
import {
  asId,
  loadBlockedSet,
  pairIsBlocked,
  resolveProfileUserId,
  resolveUserProfileId,
} from "../../../lib/safety-server";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

function tableMissingResponse() {
  return NextResponse.json(
    { error: tableMissingHint(), code: "table_missing", sql: SAFETY_SQL_FILE },
    { status: 503 }
  );
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to see who you blocked.");
    }

    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await tableExists(supabase, BLOCKS_TABLE))) {
      return tableMissingResponse();
    }

    const url = new URL(request.url);
    const peerProfile = asId(url.searchParams.get("profile_id"));
    const peerUser = asId(url.searchParams.get("user_id"));
    if (peerProfile || peerUser) {
      const blocked = await loadBlockedSet(supabase, user.id);
      return NextResponse.json({
        blocked: pairIsBlocked(blocked, peerProfile || null, peerUser || null),
      });
    }

    const { data, error } = await supabase
      .from(BLOCKS_TABLE)
      .select("id, blocked_profile_id, blocked_user_id, created_at")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      blocks: Array.isArray(data) ? data : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to block someone.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON block." }, { status: 400 });
    }

    const profileId = asId(body.profile_id);
    let userId = asId(body.user_id);
    if (!profileId && !userId) {
      return NextResponse.json({ error: "Choose a profile or account to block." }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save a block." },
        { status: 500 }
      );
    }

    if (!(await tableExists(supabase, BLOCKS_TABLE))) {
      return tableMissingResponse();
    }

    if (profileId && !userId) {
      userId = (await resolveProfileUserId(supabase, profileId)) || "";
    }
    if (userId && userId === user.id) {
      return NextResponse.json({ error: "You cannot block your own account." }, { status: 400 });
    }

    const row: Record<string, string | null> = {
      blocker_id: user.id,
      blocked_profile_id: profileId || (userId ? await resolveUserProfileId(supabase, userId) : null),
      blocked_user_id: userId || null,
    };

    const { data, error } = await supabase
      .from(BLOCKS_TABLE)
      .insert([row])
      .select("id, blocked_profile_id, blocked_user_id, created_at")
      .maybeSingle();

    if (error) {
      const message = error.message || "";
      if (message.toLowerCase().includes("duplicate") || error.code === "23505") {
        return NextResponse.json({
          ok: true,
          already: true,
          block: null,
        });
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, already: false, block: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to unblock someone.");
    }

    const url = new URL(request.url);
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const profileId = asId(body.profile_id) || asId(url.searchParams.get("profile_id"));
    const userId = asId(body.user_id) || asId(url.searchParams.get("user_id"));
    const blockId = asId(body.id) || asId(url.searchParams.get("id"));
    if (!profileId && !userId && !blockId) {
      return NextResponse.json({ error: "Choose who to unblock." }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to remove a block." },
        { status: 500 }
      );
    }

    if (!(await tableExists(supabase, BLOCKS_TABLE))) {
      return tableMissingResponse();
    }

    let q = supabase.from(BLOCKS_TABLE).delete().eq("blocker_id", user.id);
    if (blockId) q = q.eq("id", blockId);
    else if (profileId) q = q.eq("blocked_profile_id", profileId);
    else q = q.eq("blocked_user_id", userId);

    const { error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Owner-initiated Instagram share. Auth required.
 *
 * POST   — A shows A’s Instagram to B
 * DELETE — A revokes that grant
 * GET    — whether A has shared with B, and B’s handle only if B shared with A
 *
 * Handles never go public. Like / match does not create a row.
 */
import { NextResponse } from "next/server";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import {
  INSTAGRAM_SHARES_SQL_FILE,
  INSTAGRAM_SHARES_TABLE,
  instagramSharesTableMissingHint,
} from "../../../../lib/instagram-shares";
import {
  findInstagramShare,
  instagramSharesReady,
  loadOwnInstagramHandle,
  loadPeerInstagramHandle,
  resolveSharePeerUserId,
} from "../../../../lib/instagram-shares-server";
import { asId } from "../../../../lib/safety-server";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

function tableMissingResponse() {
  return NextResponse.json(
    { error: instagramSharesTableMissingHint(), code: "table_missing", sql: INSTAGRAM_SHARES_SQL_FILE },
    { status: 503 }
  );
}

function readPeerIds(source: Record<string, unknown> | URLSearchParams) {
  if (source instanceof URLSearchParams) {
    return {
      profileId: asId(source.get("profile_id")),
      userId: asId(source.get("user_id")),
    };
  }
  return {
    profileId: asId(source.profile_id),
    userId: asId(source.user_id),
  };
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to manage Instagram sharing.");
    }

    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await instagramSharesReady(supabase))) {
      return tableMissingResponse();
    }

    const url = new URL(request.url);
    const peer = readPeerIds(url.searchParams);
    if (!peer.profileId && !peer.userId) {
      return NextResponse.json({ error: "Choose who you are looking at." }, { status: 400 });
    }

    const peerUserId = await resolveSharePeerUserId(supabase, peer.profileId, peer.userId);
    if (!peerUserId) {
      return NextResponse.json({ error: "This profile is not linked to an account." }, { status: 400 });
    }
    if (peerUserId === user.id) {
      return NextResponse.json({ error: "You already see your own Instagram." }, { status: 400 });
    }

    const [ownHandle, outgoing, incoming] = await Promise.all([
      loadOwnInstagramHandle(supabase, user.id),
      findInstagramShare(supabase, user.id, peerUserId),
      findInstagramShare(supabase, peerUserId, user.id),
    ]);

    const received = !!incoming;
    const instagram = received ? await loadPeerInstagramHandle(supabase, peerUserId) : "";

    return NextResponse.json({
      canShare: !!ownHandle,
      shared: !!outgoing,
      received,
      instagram,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to share Instagram.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON share." }, { status: 400 });
    }

    const peer = readPeerIds(body);
    if (!peer.profileId && !peer.userId) {
      return NextResponse.json({ error: "Choose who should see your Instagram." }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save a share." },
        { status: 500 }
      );
    }

    if (!(await instagramSharesReady(supabase))) {
      return tableMissingResponse();
    }

    const peerUserId = await resolveSharePeerUserId(supabase, peer.profileId, peer.userId);
    if (!peerUserId) {
      return NextResponse.json({ error: "This profile is not linked to an account." }, { status: 400 });
    }
    if (peerUserId === user.id) {
      return NextResponse.json({ error: "You cannot share Instagram with yourself." }, { status: 400 });
    }

    const ownHandle = await loadOwnInstagramHandle(supabase, user.id);
    if (!ownHandle) {
      return NextResponse.json({ error: "Add your Instagram first." }, { status: 400 });
    }

    const existing = await findInstagramShare(supabase, user.id, peerUserId);
    if (existing) {
      return NextResponse.json({ ok: true, already: true, shared: true, share: existing });
    }

    const inserted = await supabase
      .from(INSTAGRAM_SHARES_TABLE)
      .insert([{ owner_user_id: user.id, viewer_user_id: peerUserId }])
      .select("id, owner_user_id, viewer_user_id, created_at")
      .maybeSingle();

    if (inserted.error) {
      const message = inserted.error.message || "";
      if (message.toLowerCase().includes("duplicate") || inserted.error.code === "23505") {
        return NextResponse.json({ ok: true, already: true, shared: true, share: null });
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, already: false, shared: true, share: inserted.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to hide Instagram.");
    }

    const url = new URL(request.url);
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const peer = {
      profileId: asId(body.profile_id) || asId(url.searchParams.get("profile_id")),
      userId: asId(body.user_id) || asId(url.searchParams.get("user_id")),
    };
    if (!peer.profileId && !peer.userId) {
      return NextResponse.json({ error: "Choose who to hide Instagram from." }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to remove a share." },
        { status: 500 }
      );
    }

    if (!(await instagramSharesReady(supabase))) {
      return tableMissingResponse();
    }

    const peerUserId = await resolveSharePeerUserId(supabase, peer.profileId, peer.userId);
    if (!peerUserId) {
      return NextResponse.json({ error: "This profile is not linked to an account." }, { status: 400 });
    }

    const { error } = await supabase
      .from(INSTAGRAM_SHARES_TABLE)
      .delete()
      .eq("owner_user_id", user.id)
      .eq("viewer_user_id", peerUserId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, shared: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

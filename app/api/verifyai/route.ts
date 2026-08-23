/**
 * Read (and, with the webhook secret, set) VerifyAI status on a Bandham profile.
 *
 * GET is public for a profile id and only returns status / verified.
 * POST is for Sai / operators while the live verifyai.llc service is wired.
 * Members cannot self-verify. Setting verified still requires a paid $4.99 row.
 */
import { NextResponse } from "next/server";
import {
  getAnonSupabase,
  getServiceSupabase,
  missingConfigResponse,
  tableHasColumn,
} from "../../../lib/server-supabase";
import {
  VERIFYAI_EXTERNAL_ID_COLUMN,
  VERIFYAI_SQL_FILE,
  VERIFYAI_STATUS_COLUMN,
  VERIFYAI_UPDATED_AT_COLUMN,
  isVerifyaiVerified,
  normalizeVerifyaiStatus,
} from "../../../lib/verifyai";
import { asId, resolveProfileUserId } from "../../../lib/safety-server";
import { hasPaidVerifyai } from "../../../lib/verifyai-checkout";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

function webhookSecret() {
  return (process.env.VERIFYAI_WEBHOOK_SECRET || "").trim();
}

function hasOperatorAuth(request: Request) {
  const secret = webhookSecret();
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  return token.length > 0 && token === secret;
}

async function columnsReady(supabase: ReturnType<typeof dataClient>) {
  if (!supabase) return false;
  return tableHasColumn(supabase, "profiles", VERIFYAI_STATUS_COLUMN);
}

export async function GET(request: Request) {
  try {
    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    if (!(await columnsReady(supabase))) {
      return NextResponse.json({
        verified: false,
        status: null,
        configured: false,
        sql: VERIFYAI_SQL_FILE,
      });
    }

    const url = new URL(request.url);
    const profileId = asId(url.searchParams.get("profile_id"));
    const userId = asId(url.searchParams.get("user_id"));
    if (!profileId && !userId) {
      return NextResponse.json({ error: "Pass profile_id or user_id." }, { status: 400 });
    }

    let q = supabase.from("profiles").select("id, " + VERIFYAI_STATUS_COLUMN).limit(1);
    q = profileId ? q.eq("id", profileId) : q.eq("user_id", userId);
    const { data, error } = await q.maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const row = data as unknown as { id?: unknown; verifyai_status?: unknown } | null;
    const status = row ? row.verifyai_status : null;
    return NextResponse.json({
      verified: isVerifyaiVerified(status),
      status: typeof status === "string" ? status : null,
      configured: true,
      profile_id: row ? asId(row.id) || null : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!webhookSecret()) {
      return NextResponse.json(
        {
          error:
            "VERIFYAI_WEBHOOK_SECRET is not set. The live VerifyAI service is not wired yet. Run " +
            VERIFYAI_SQL_FILE +
            " and see README.",
          sql: VERIFYAI_SQL_FILE,
        },
        { status: 503 }
      );
    }
    if (!hasOperatorAuth(request)) {
      return NextResponse.json({ error: "Operator authorization required." }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();
    if (!(await columnsReady(supabase))) {
      return NextResponse.json(
        { error: "VerifyAI columns are missing. Run " + VERIFYAI_SQL_FILE + ".", sql: VERIFYAI_SQL_FILE },
        { status: 503 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON status update." }, { status: 400 });
    }

    const status = normalizeVerifyaiStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: "Send a VerifyAI status (unverified, pending, verified, failed, revoked)." }, { status: 400 });
    }

    const profileId = asId(body.profile_id);
    const userId = asId(body.user_id);
    const email = asId(body.email).toLowerCase();
    const externalId = asId(body.external_id) || asId(body.verifyai_external_id) || null;

    let targetId = profileId;
    if (!targetId && userId) {
      const found = await supabase.from("profiles").select("id").eq("user_id", userId).limit(1).maybeSingle();
      targetId = asId((found.data as { id?: unknown } | null)?.id);
    }

    if (!targetId && email) {
      const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const match = users.data.users.find(function (row) {
        return (row.email || "").toLowerCase() === email;
      });
      if (match) {
        const found = await supabase.from("profiles").select("id").eq("user_id", match.id).limit(1).maybeSingle();
        targetId = asId((found.data as { id?: unknown } | null)?.id);
      }
    }

    if (!targetId) {
      return NextResponse.json({ error: "Could not find a Bandham profile for that id or email." }, { status: 404 });
    }

    if (isVerifyaiVerified(status)) {
      const ownerId = userId || (await resolveProfileUserId(supabase, targetId)) || "";
      if (!ownerId || !(await hasPaidVerifyai(supabase, ownerId, targetId))) {
        return NextResponse.json(
          {
            error: "A paid $4.99 VerifyAI checkout is required before a verified badge. Operator POST is not a shortcut around payment or the VerifyAI flow.",
            verified: false,
          },
          { status: 409 }
        );
      }
    }

    const patch: Record<string, string | null> = {
      [VERIFYAI_STATUS_COLUMN]: status,
      [VERIFYAI_UPDATED_AT_COLUMN]: new Date().toISOString(),
    };
    if (await tableHasColumn(supabase, "profiles", VERIFYAI_EXTERNAL_ID_COLUMN)) {
      if (externalId) patch[VERIFYAI_EXTERNAL_ID_COLUMN] = externalId;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", targetId)
      .select("id, " + VERIFYAI_STATUS_COLUMN)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const updated = data as unknown as { verifyai_status?: unknown } | null;
    const next = updated ? updated.verifyai_status : status;
    return NextResponse.json({
      ok: true,
      profile_id: targetId,
      status: next,
      verified: isVerifyaiVerified(next),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Dry-run list of Regular members who would get a subscribe reminder call.
 *
 * This route does not place outbound calls. It does not write last_subscribe_call_at.
 * Auth is the same shared secret as inbound Bandham Support.
 * Fail closed if BANDHAM_VOICE_SUPPORT_SECRET is unset.
 */
import { NextResponse } from "next/server";
import { getServiceSupabase, missingConfigResponse } from "../../../../lib/server-supabase";
import {
  SUBSCRIBE_CALL_PATH,
  SUBSCRIBE_CALL_SQL_FILE,
  SUBSCRIBE_CALL_SQL_HINT,
} from "../../../../lib/subscribe-call";
import { listEligibleSubscribeCalls, optOutSubscribeCall } from "../../../../lib/subscribe-call-server";
import { authorizeVoiceSupport } from "../../../../lib/voice-support";

export const runtime = "nodejs";

function secretMissingResponse() {
  return NextResponse.json(
    {
      error: "BANDHAM_VOICE_SUPPORT_SECRET is not set. Subscribe reminder listing cannot run yet.",
      dry_run: true,
      dialed: false,
      armed: false,
      count: 0,
    },
    { status: 503 }
  );
}

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

function readAction(body: Record<string, unknown>, query: URLSearchParams) {
  const raw = body.action ?? body.tool ?? query.get("action") ?? query.get("tool") ?? "list";
  return typeof raw === "string" ? raw.trim().toLowerCase() : "list";
}

function isDialAction(action: string) {
  return (
    action === "dial" ||
    action === "call" ||
    action === "place_call" ||
    action === "outbound" ||
    action === "start_calls"
  );
}

export async function GET(request: Request) {
  return handle(request, {});
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = asRecord(await request.json());
  } catch {
    body = {};
  }
  return handle(request, body);
}

async function handle(request: Request, body: Record<string, unknown>) {
  try {
    const auth = authorizeVoiceSupport(request);
    if (!auth.ok) {
      if (auth.reason === "missing_secret") return secretMissingResponse();
      return NextResponse.json(
        { error: "Invalid voice support secret.", dry_run: true, dialed: false, armed: false, count: 0 },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = readAction(body, url.searchParams);
    if (isDialAction(action) || body.dial === true || url.searchParams.get("dial") === "1") {
      return NextResponse.json(
        {
          error: "This route does not place calls. It only lists who would be called.",
          dry_run: true,
          dialed: false,
          armed: false,
          count: 0,
          path: SUBSCRIBE_CALL_PATH,
        },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    if (action === "opt_out" || action === "stop") {
      const profileId =
        typeof body.profile_id === "string"
          ? body.profile_id
          : typeof body.profileId === "string"
            ? body.profileId
            : "";
      const result = await optOutSubscribeCall(supabase, profileId);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error, sql: "sql" in result ? result.sql : undefined, dry_run: true, dialed: false },
          { status: result.error.includes("not applied") ? 503 : 400 }
        );
      }
      return NextResponse.json({
        ok: true,
        opted_out: true,
        profile_id: result.profile_id,
        dry_run: true,
        dialed: false,
        armed: false,
      });
    }

    const listed = await listEligibleSubscribeCalls(supabase);
    if (!listed.ready) {
      return NextResponse.json(
        {
          error: SUBSCRIBE_CALL_SQL_HINT,
          code: "subscribe_call_sql_missing",
          sql: SUBSCRIBE_CALL_SQL_FILE,
          dry_run: true,
          dialed: false,
          armed: false,
          count: 0,
          members: [],
        },
        { status: 503 }
      );
    }

    if ("error" in listed && listed.error) {
      return NextResponse.json({ error: listed.error, dry_run: true, dialed: false, armed: false, count: 0 }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      dry_run: true,
      dialed: false,
      armed: false,
      count: listed.count,
      members: listed.members,
      cadence_days: 15,
      path: SUBSCRIBE_CALL_PATH,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json(
      { error: message, dry_run: true, dialed: false, armed: false, count: 0 },
      { status: 500 }
    );
  }
}

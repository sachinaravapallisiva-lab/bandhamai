/**
 * Speed Match rounds for the signed-in member.
 *
 * POST writes one completed 10-question round. GET lists that member's latest
 * rounds. No compatibility score is stored or returned.
 *
 * If `speed_match_rounds` is missing, the playable UI still finishes
 * session-local. Run supabase/speed_match.sql to persist.
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
import {
  SPEED_MATCH_SQL_FILE,
  SPEED_MATCH_TABLE,
  parseRoundAnswers,
} from "../../../lib/speed-match";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function tableMissingResponse() {
  return NextResponse.json(
    {
      persisted: false,
      code: "table_missing",
      error: "Speed Match storage is not applied yet. Run " + SPEED_MATCH_SQL_FILE + " in the Supabase SQL editor.",
      sql: SPEED_MATCH_SQL_FILE,
    },
    { status: 503 }
  );
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to see your Speed Match rounds.");
    }

    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await tableExists(supabase, SPEED_MATCH_TABLE))) {
      return tableMissingResponse();
    }

    const { data, error } = await supabase
      .from(SPEED_MATCH_TABLE)
      .select("id, partner_profile_id, answers, completed_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      persisted: true,
      rounds: Array.isArray(data) ? data : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to save a Speed Match round.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON Speed Match round." }, { status: 400 });
    }

    const partnerId = asString(body.partner_profile_id);
    if (!partnerId) {
      return NextResponse.json({ error: "Choose a liked profile to Speed Match with." }, { status: 400 });
    }

    const answers = parseRoundAnswers(body.answers);
    if (!answers) {
      return NextResponse.json(
        { error: "Send exactly 10 answers from the Speed Match question set." },
        { status: 400 }
      );
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to save a Speed Match round.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save a Speed Match round." },
        { status: 500 }
      );
    }

    if (!(await tableExists(supabase, SPEED_MATCH_TABLE))) {
      return tableMissingResponse();
    }

    const { data, error } = await supabase
      .from(SPEED_MATCH_TABLE)
      .insert([
        {
          user_id: user.id,
          partner_profile_id: partnerId,
          answers: answers,
          completed_at: new Date().toISOString(),
        },
      ])
      .select("id, partner_profile_id, answers, completed_at, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      persisted: true,
      round: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Create a reviewable safety report.
 *
 * This stores a row. It does not dispatch police or promise a response time.
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
  REPORTS_TABLE,
  SAFETY_SQL_FILE,
  isReportReason,
  isReportSurface,
  tableMissingHint,
} from "../../../lib/safety";
import { asId, resolveProfileUserId } from "../../../lib/safety-server";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to report someone.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON report." }, { status: 400 });
    }

    const profileId = asId(body.profile_id);
    let userId = asId(body.user_id);
    const reason = asId(body.reason);
    const details = asId(body.details).slice(0, 2000);
    const surfaceRaw = asId(body.surface) || "profile";

    if (!profileId && !userId) {
      return NextResponse.json({ error: "Choose a profile or conversation to report." }, { status: 400 });
    }
    if (!isReportReason(reason)) {
      return NextResponse.json({ error: "Pick a report reason." }, { status: 400 });
    }
    if (reason === "other" && details.length < 4) {
      return NextResponse.json({ error: "Add a short note for “something else.”" }, { status: 400 });
    }
    if (!isReportSurface(surfaceRaw)) {
      return NextResponse.json({ error: "Say whether this is from a profile or chat." }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save a report." },
        { status: 500 }
      );
    }

    if (!(await tableExists(supabase, REPORTS_TABLE))) {
      return NextResponse.json(
        { error: tableMissingHint(), code: "table_missing", sql: SAFETY_SQL_FILE },
        { status: 503 }
      );
    }

    if (profileId && !userId) {
      userId = (await resolveProfileUserId(supabase, profileId)) || "";
    }
    if (userId && userId === user.id) {
      return NextResponse.json({ error: "You cannot report your own account." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(REPORTS_TABLE)
      .insert([
        {
          reporter_id: user.id,
          reported_profile_id: profileId || null,
          reported_user_id: userId || null,
          surface: surfaceRaw,
          reason,
          details: details || null,
        },
      ])
      .select("id, reason, surface, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      report: data,
      message:
        "Report saved. We will look at it. If someone is in immediate danger, contact local authorities. We are not an emergency service.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Look up whether a signed-in member is currently online.
 * Used by the live /chat partner header. Browse cards get `online`
 * from GET /api/profiles/search instead.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableExists,
  unauthorizedResponse,
} from "../../../lib/server-supabase";
import {
  PRESENCE_SQL_FILE,
  PRESENCE_TABLE,
  presenceFromRow,
  presenceTableMissingHint,
} from "../../../lib/presence";

export const runtime = "nodejs";

function asId(value: string | null) {
  return value ? value.trim() : "";
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to see who is online.");
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const url = new URL(request.url);
    const userId = asId(url.searchParams.get("user_id"));
    if (!userId) {
      return NextResponse.json({ error: "Enter a member to look up." }, { status: 400 });
    }

    if (!(await tableExists(supabase, PRESENCE_TABLE))) {
      return NextResponse.json({
        online: false,
        last_seen_at: null,
        code: "table_missing",
        sql: PRESENCE_SQL_FILE,
        error: presenceTableMissingHint(),
      });
    }

    const { data, error } = await supabase
      .from(PRESENCE_TABLE)
      .select("user_id, last_seen_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(presenceFromRow(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load presence.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

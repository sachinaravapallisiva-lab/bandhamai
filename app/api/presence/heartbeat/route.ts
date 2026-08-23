/**
 * Signed-in heartbeat. Upserts public.presence.last_seen_at = now().
 * Browse treats a ping within ~3 minutes as Online.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableExists,
  tableHasColumn,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { PRESENCE_SQL_FILE, PRESENCE_TABLE, presenceTableMissingHint } from "../../../../lib/presence";
import { resolveOwnProfileId } from "../../../../lib/presence-server";

export const runtime = "nodejs";

function tableMissingResponse() {
  return NextResponse.json(
    { error: presenceTableMissingHint(), code: "table_missing", sql: PRESENCE_SQL_FILE },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to share that you are online.");
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await tableExists(supabase, PRESENCE_TABLE))) {
      return tableMissingResponse();
    }

    const now = new Date().toISOString();
    const row: Record<string, string> = {
      user_id: user.id,
      last_seen_at: now,
    };
    const [profileId, hasProfileId] = await Promise.all([
      resolveOwnProfileId(supabase, user.id),
      tableHasColumn(supabase, PRESENCE_TABLE, "profile_id"),
    ]);
    if (profileId && hasProfileId) row.profile_id = profileId;

    const { data, error } = await supabase
      .from(PRESENCE_TABLE)
      .upsert(row, { onConflict: "user_id" })
      .select("user_id, last_seen_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      online: true,
      last_seen_at: data?.last_seen_at || now,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update presence.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

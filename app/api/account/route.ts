/**
 * Close the signed-in account when the service role can.
 *
 * Always records a deletion request and hides the profile (status = removed).
 * Then tries auth.admin.deleteUser. If that fails, the request stays for an operator.
 */
import { NextResponse } from "next/server";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableExists,
  tableHasColumn,
  unauthorizedResponse,
} from "../../../lib/server-supabase";
import {
  DELETION_REQUESTS_TABLE,
  DELETE_CONFIRM_WORD,
  SAFETY_SQL_FILE,
  tableMissingHint,
} from "../../../lib/safety";
import { asId } from "../../../lib/safety-server";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

export async function DELETE(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to delete your account.");
    }

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const confirm = asId(body.confirm);
    if (confirm !== DELETE_CONFIRM_WORD) {
      return NextResponse.json(
        { error: "Type " + DELETE_CONFIRM_WORD + " to confirm account deletion." },
        { status: 400 }
      );
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to delete an account." },
        { status: 500 }
      );
    }

    if (!(await tableExists(supabase, DELETION_REQUESTS_TABLE))) {
      return NextResponse.json(
        { error: tableMissingHint(), code: "table_missing", sql: SAFETY_SQL_FILE },
        { status: 503 }
      );
    }

    let profileHidden = false;
    if (await tableHasColumn(supabase, "profiles", "user_id")) {
      const hasStatus = await tableHasColumn(supabase, "profiles", "status");
      if (hasStatus) {
        const hidden = await supabase
          .from("profiles")
          .update({ status: "removed" })
          .eq("user_id", user.id);
        profileHidden = !hidden.error;
      } else {
        const removed = await supabase.from("profiles").delete().eq("user_id", user.id);
        profileHidden = !removed.error;
      }
    }

    let loginRemoved = false;
    let loginError: string | null = null;
    const deleted = await supabase.auth.admin.deleteUser(user.id);
    if (deleted.error) {
      loginError = deleted.error.message;
    } else {
      loginRemoved = true;
    }

    const requestRow = await supabase
      .from(DELETION_REQUESTS_TABLE)
      .insert([
        {
          user_id: user.id,
          email: user.email || null,
          status: loginRemoved ? "completed" : "requested",
          login_removed: loginRemoved,
          profile_hidden: profileHidden,
          note: loginError,
          completed_at: loginRemoved ? new Date().toISOString() : null,
        },
      ])
      .select("id, status, login_removed, profile_hidden")
      .maybeSingle();

    if (requestRow.error) {
      return NextResponse.json({ error: requestRow.error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      login_removed: loginRemoved,
      profile_hidden: profileHidden,
      request: requestRow.data,
      message: loginRemoved
        ? "Your login was removed. Your profile is hidden from Browse. Some safety reports may be kept if a case is still open."
        : "Your profile is hidden from Browse when that step succeeded. The login could not be removed automatically — we recorded a deletion request. Sign out on this device.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

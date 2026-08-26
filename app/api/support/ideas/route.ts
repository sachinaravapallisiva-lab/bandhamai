/**
 * Save a member feature idea on the existing support_tickets queue.
 *
 * Same Resend notify as app issue tickets. Email failure is logged and
 * does not undo the saved row.
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
} from "../../../../lib/server-supabase";
import { emailFounderTicket } from "../../../../lib/support-email";
import {
  FEATURE_IDEA_CONFIRM,
  FEATURE_IDEA_SOURCE,
  FEATURE_IDEA_SQL_FILE,
  FEATURE_IDEA_TOO_SHORT,
  ideaTableMissingHint,
  normalizeIdeaDraft,
} from "../../../../lib/feature-idea";
import { SUPPORT_TICKETS_TABLE, tableMissingHint } from "../../../../lib/support";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

function tableMissingResponse() {
  return NextResponse.json(
    { error: tableMissingHint(), code: "table_missing", sql: FEATURE_IDEA_SQL_FILE },
    { status: 503 }
  );
}

function constraintMissingResponse() {
  return NextResponse.json(
    { error: ideaTableMissingHint(), code: "constraint_missing", sql: FEATURE_IDEA_SQL_FILE },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to send a feature idea.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON idea." }, { status: 400 });
    }

    const draft = normalizeIdeaDraft(body);
    if (!draft) {
      return NextResponse.json({ error: FEATURE_IDEA_TOO_SHORT }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save an idea." },
        { status: 500 }
      );
    }

    if (!(await tableExists(supabase, SUPPORT_TICKETS_TABLE))) {
      return tableMissingResponse();
    }

    const { data, error } = await supabase
      .from(SUPPORT_TICKETS_TABLE)
      .insert([
        {
          user_id: user.id,
          email: user.email || null,
          category: draft.category,
          subject: draft.subject,
          body: draft.body,
          status: "open",
          source: FEATURE_IDEA_SOURCE,
        },
      ])
      .select("id, category, subject, status, created_at")
      .maybeSingle();

    if (error) {
      const message = (error.message || "").toLowerCase();
      if (
        message.includes("category") ||
        message.includes("source") ||
        message.includes("check")
      ) {
        return constraintMissingResponse();
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data || typeof (data as { id?: unknown }).id !== "string") {
      return NextResponse.json({ error: "Idea did not save." }, { status: 500 });
    }

    const ticket = data as {
      id: string;
      category: string;
      subject: string;
      status: string;
      created_at: string;
    };

    const email = await emailFounderTicket({
      id: ticket.id,
      userId: user.id,
      email: user.email || null,
      category: draft.category,
      subject: draft.subject,
      body: draft.body,
      source: FEATURE_IDEA_SOURCE,
    });

    return NextResponse.json({
      ok: true,
      ticket,
      email_sent: email.sent,
      message: FEATURE_IDEA_CONFIRM,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

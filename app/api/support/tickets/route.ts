/**
 * Create an in-app support ticket after the member confirms.
 *
 * Saves a row, then emails the founder. Email failure is logged and
 * does not undo the saved ticket.
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
  SUPPORT_SQL_FILE,
  SUPPORT_TICKETS_TABLE,
  normalizeTicketDraft,
  tableMissingHint,
} from "../../../../lib/support";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

function tableMissingResponse() {
  return NextResponse.json(
    { error: tableMissingHint(), code: "table_missing", sql: SUPPORT_SQL_FILE },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to open a ticket.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON ticket." }, { status: 400 });
    }

    const draft = normalizeTicketDraft(body);
    if (!draft) {
      return NextResponse.json(
        { error: "Add a short summary (and a category if you have one) before opening a ticket." },
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
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save a ticket." },
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
          source: "assistant",
        },
      ])
      .select("id, category, subject, status, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data || typeof (data as { id?: unknown }).id !== "string") {
      return NextResponse.json({ error: "Ticket did not save." }, { status: 500 });
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
    });

    return NextResponse.json({
      ok: true,
      ticket,
      email_sent: email.sent,
      message:
        "Ticket saved. We will look into it. Tickets are for app issues, not emergencies. If someone is harassing you, use Block or Report on their profile.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

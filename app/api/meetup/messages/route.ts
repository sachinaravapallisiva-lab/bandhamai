/**
 * Meetup group chat. Signed in + paid ticket RSVP only.
 * Not WhatsApp. Not a backdoor around $9.99/mo 1:1 Chat.
 * The Bandham assistant never writes this table.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { MEETUP_COPY, MEETUP_MESSAGE_MAX } from "../../../../lib/meetup";
import {
  insertGroupMessage,
  loadCurrentMeetup,
  loadGroupMessages,
  meetupTableMissingResponse,
  meetupTablesReady,
  userHasRsvp,
} from "../../../../lib/meetup-server";

export const runtime = "nodejs";

function asBody(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse(MEETUP_COPY.chatNeedSignIn);
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || MEETUP_COPY.chatNeedSignIn);

    if (!(await meetupTablesReady(supabase))) {
      return meetupTableMissingResponse();
    }

    const meetup = await loadCurrentMeetup(supabase);
    if (!(await userHasRsvp(supabase, meetup.id, user.id))) {
      return NextResponse.json(
        { error: MEETUP_COPY.chatNeedRsvp, code: "rsvp_required", messages: [] },
        { status: 403 }
      );
    }

    const messages = await loadGroupMessages(supabase, meetup.id, user.id);
    return NextResponse.json({ meetup_id: meetup.id, messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load group chat.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse(MEETUP_COPY.chatNeedSignIn);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON group message." }, { status: 400 });
    }

    const text = asBody(body.body);
    if (!text) {
      return NextResponse.json({ error: "Write a message first." }, { status: 400 });
    }
    if (text.length > MEETUP_MESSAGE_MAX) {
      return NextResponse.json({ error: "That message is too long." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || MEETUP_COPY.chatNeedSignIn);

    if (!(await meetupTablesReady(supabase))) {
      return meetupTableMissingResponse();
    }

    const meetup = await loadCurrentMeetup(supabase);
    if (!(await userHasRsvp(supabase, meetup.id, user.id))) {
      return NextResponse.json(
        { error: MEETUP_COPY.chatNeedRsvp, code: "rsvp_required" },
        { status: 403 }
      );
    }

    const result = await insertGroupMessage(supabase, meetup.id, user.id, text);
    if (result.error || !result.message) {
      return NextResponse.json({ error: result.error || "Could not send." }, { status: 400 });
    }

    return NextResponse.json({
      message: {
        id: result.message.id,
        meetup_id: meetup.id,
        sender_id: user.id,
        sender_name: "You",
        body: result.message.body,
        created_at: result.message.created_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

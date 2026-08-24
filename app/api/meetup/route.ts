/**
 * Current month meetup. Viewing is public. RSVP is only after a paid event ticket.
 * The $9.99/mo messaging plan does not grant RSVP or group chat.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
} from "../../../lib/server-supabase";
import {
  MEETUP_COPY,
  MEETUP_SQL_FILE,
  fallbackMeetup,
  ticketNotConfiguredPayload,
} from "../../../lib/meetup";
import {
  countRsvps,
  ensureRsvpFromTicket,
  loadCurrentMeetup,
  meetupTableMissingResponse,
  meetupTablesReady,
  userHasPaidTicket,
  userHasRsvp,
} from "../../../lib/meetup-server";
import { isEventTicketConfigured } from "../../../lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const ticketConfigured = isEventTicketConfigured();
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({
        meetup: fallbackMeetup(),
        rsvpCount: 0,
        rsvped: false,
        ticketPaid: false,
        ticketConfigured,
        tableReady: false,
        fallback: true,
        sql: MEETUP_SQL_FILE,
      });
    }

    const ready = await meetupTablesReady(supabase);
    if (!ready) {
      return NextResponse.json({
        meetup: fallbackMeetup(),
        rsvpCount: 0,
        rsvped: false,
        ticketPaid: false,
        ticketConfigured,
        tableReady: false,
        fallback: true,
        code: "table_missing",
        sql: MEETUP_SQL_FILE,
        error: MEETUP_COPY.tableMissing,
      });
    }

    const meetup = await loadCurrentMeetup(supabase);
    let rsvped = false;
    let ticketPaid = false;
    if (hasBearerToken(request)) {
      const { user } = await getRequestUser(request, supabase);
      if (user) {
        ticketPaid = await userHasPaidTicket(supabase, meetup.id, user.id);
        if (ticketPaid) {
          const healed = await ensureRsvpFromTicket(supabase, meetup.id, user.id);
          rsvped = healed.rsvped;
        } else {
          rsvped = await userHasRsvp(supabase, meetup.id, user.id);
        }
      }
    }

    return NextResponse.json({
      meetup,
      rsvpCount: await countRsvps(supabase, meetup.id),
      rsvped,
      ticketPaid,
      ticketConfigured,
      tableReady: true,
      fallback: meetup.id === fallbackMeetup().id && meetup.month_key === fallbackMeetup().month_key,
      sql: MEETUP_SQL_FILE,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load the meetup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isEventTicketConfigured()) {
      return NextResponse.json(ticketNotConfiguredPayload(), { status: 503 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    if (!hasBearerToken(request)) {
      return NextResponse.json({ error: MEETUP_COPY.rsvpNeedSignIn }, { status: 401 });
    }

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) {
      return NextResponse.json({ error: authError || MEETUP_COPY.rsvpNeedSignIn }, { status: 401 });
    }

    if (!(await meetupTablesReady(supabase))) {
      return meetupTableMissingResponse();
    }

    const meetup = await loadCurrentMeetup(supabase);
    const ticketPaid = await userHasPaidTicket(supabase, meetup.id, user.id);
    if (!ticketPaid) {
      return NextResponse.json(
        {
          error: MEETUP_COPY.ticketRequired,
          code: "event_ticket_required",
          rsvped: false,
          ticketPaid: false,
        },
        { status: 402 }
      );
    }

    const healed = await ensureRsvpFromTicket(supabase, meetup.id, user.id);
    if (!healed.rsvped) {
      return NextResponse.json({ error: healed.error || "Could not save the RSVP." }, { status: 400 });
    }

    return NextResponse.json({
      rsvped: true,
      ticketPaid: true,
      meetup_id: meetup.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not RSVP.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

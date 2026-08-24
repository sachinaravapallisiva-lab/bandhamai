/**
 * Other RSVPs after Speed Match. Honors blocks. Requires a paid ticket RSVP.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import { MEETUP_COPY } from "../../../../lib/meetup";
import {
  loadCurrentMeetup,
  loadMeetupShortlist,
  meetupTableMissingResponse,
  meetupTablesReady,
  userHasRsvp,
} from "../../../../lib/meetup-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse(MEETUP_COPY.rsvpNeedSignIn);
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || MEETUP_COPY.rsvpNeedSignIn);

    if (!(await meetupTablesReady(supabase))) {
      return meetupTableMissingResponse();
    }

    const meetup = await loadCurrentMeetup(supabase);
    if (!(await userHasRsvp(supabase, meetup.id, user.id))) {
      return NextResponse.json(
        { error: MEETUP_COPY.ticketRequired, code: "rsvp_required", members: [] },
        { status: 403 }
      );
    }

    const members = await loadMeetupShortlist(supabase, meetup.id, user.id);
    return NextResponse.json({ meetup_id: meetup.id, members });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load the shortlist.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

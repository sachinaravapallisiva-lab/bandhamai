/**
 * Service API for the Bandham Support phone agent (xAI Voice or Vapi).
 *
 * This is not the in-app Bandham assistant / love guru.
 * Phone callers are not signed in. Auth is a shared secret, not a member JWT.
 * Fail closed if BANDHAM_VOICE_SUPPORT_SECRET is unset.
 *
 * Human handoff stays on this same Support bot. Destination is server-only
 * (BANDHAM_SUPPORT_HANDOFF_E164). Caller ID on the transfer stays the public
 * 803 Support number. Do not patch the live Vapi assistant from a preview.
 */
import { NextResponse } from "next/server";
import {
  getServiceSupabase,
  missingConfigResponse,
  tableExists,
} from "../../../../lib/server-supabase";
import { emailFounderTicket } from "../../../../lib/support-email";
import {
  SUPPORT_SQL_FILE,
  SUPPORT_TICKETS_TABLE,
  normalizeTicketDraft,
  tableMissingHint,
} from "../../../../lib/support";
import {
  VOICE_RESOLVED_STATUS,
  VOICE_SPOKEN_NOT_FOUND,
  VOICE_SPOKEN_SAFETY,
  VOICE_SUPPORT_SQL_FILE,
  VOICE_TICKET_SELECT,
  VOICE_TICKET_SOURCE,
  authorizeVoiceSupport,
  callerMissing,
  flattenVoiceSupportBody,
  isIgnorableVoiceEvent,
  publicVoiceTicket,
  readVoiceCaller,
  readVoiceTool,
  spokenTicketCreated,
  spokenTicketResolved,
  spokenTicketStatus,
  supportHandoffPayload,
  ticketBelongsToCaller,
  type VoiceTicketRow,
} from "../../../../lib/voice-support";
import { identifyVoiceMember, voiceTicketsReady } from "../../../../lib/voice-support-server";

export const runtime = "nodejs";

function secretMissingResponse() {
  return NextResponse.json(
    {
      error: "BANDHAM_VOICE_SUPPORT_SECRET is not set. Voice support tools cannot run yet.",
    },
    { status: 503 }
  );
}

function tableMissingResponse() {
  return NextResponse.json(
    { error: tableMissingHint(), code: "table_missing", sql: SUPPORT_SQL_FILE },
    { status: 503 }
  );
}

function voiceSqlMissingResponse() {
  return NextResponse.json(
    {
      error:
        "Voice support columns are not applied yet. Run " +
        VOICE_SUPPORT_SQL_FILE +
        " in the Supabase SQL editor after " +
        SUPPORT_SQL_FILE +
        ".",
      code: "voice_sql_missing",
      sql: VOICE_SUPPORT_SQL_FILE,
    },
    { status: 503 }
  );
}

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

function readTicketId(body: Record<string, unknown>) {
  const value = body.ticket_id ?? body.ticketId ?? body.id;
  return typeof value === "string" ? value.trim() : "";
}

function asTicketRow(raw: unknown): VoiceTicketRow | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as VoiceTicketRow;
  if (typeof row.id !== "string" || !row.id) return null;
  return row;
}

export async function POST(request: Request) {
  try {
    const auth = authorizeVoiceSupport(request);
    if (!auth.ok) {
      if (auth.reason === "missing_secret") return secretMissingResponse();
      return NextResponse.json({ error: "Invalid voice support secret." }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      const parsed = await request.json();
      body = asRecord(parsed);
    } catch {
      body = {};
    }

    const url = new URL(request.url);
    if (isIgnorableVoiceEvent(body)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const flat = flattenVoiceSupportBody(body);
    const tool = readVoiceTool(flat, url.searchParams.get("tool"));
    if (!tool) {
      return NextResponse.json(
        {
          error:
            "Send a tool name: identify_member, create_ticket, get_ticket, resolve_ticket, or transfer_to_human.",
        },
        { status: 400 }
      );
    }

    if (tool === "transfer_to_human") {
      const inbound =
        typeof flat.inbound_number === "string" ? flat.inbound_number : "";
      const toolCallId = typeof flat.tool_call_id === "string" ? flat.tool_call_id : "";
      return NextResponse.json(
        supportHandoffPayload({
          inboundNumber: inbound,
          toolCallId,
        })
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    if (tool === "identify_member") {
      const caller = readVoiceCaller(flat);
      if (callerMissing(caller)) {
        return NextResponse.json(
          { error: "Ask for the email or phone on their Bandham account." },
          { status: 400 }
        );
      }
      const member = await identifyVoiceMember(supabase, caller);
      if (!member) {
        return NextResponse.json({
          ok: true,
          found: false,
          message: VOICE_SPOKEN_NOT_FOUND,
        });
      }
      return NextResponse.json({
        ok: true,
        found: true,
        member_id: member.userId,
        first_name: member.firstName || null,
        matched_on: member.matchedOn,
        message: member.firstName
          ? "I found an account for " + member.firstName + "."
          : "I found a Bandham account for those details.",
      });
    }

    if (!(await tableExists(supabase, SUPPORT_TICKETS_TABLE))) {
      return tableMissingResponse();
    }
    if (!(await voiceTicketsReady(supabase))) {
      return voiceSqlMissingResponse();
    }

    const caller = readVoiceCaller(flat);
    if (callerMissing(caller)) {
      return NextResponse.json(
        { error: "Pass the email or phone the caller spoke." },
        { status: 400 }
      );
    }

    const member = await identifyVoiceMember(supabase, caller);

    if (tool === "create_ticket") {
      const draft = normalizeTicketDraft(flat);
      if (!draft) {
        return NextResponse.json(
          { error: "Need a short subject and a summary before opening a ticket." },
          { status: 400 }
        );
      }

      const insert: Record<string, unknown> = {
        user_id: member?.userId || null,
        email: caller.email || null,
        caller_phone: caller.phone || null,
        category: draft.category,
        subject: draft.subject,
        body: draft.body,
        status: "open",
        source: VOICE_TICKET_SOURCE,
      };

      const { data, error } = await supabase
        .from(SUPPORT_TICKETS_TABLE)
        .insert([insert])
        .select("id, category, subject, status, created_at")
        .maybeSingle();

      if (error) {
        const message = (error.message || "").toLowerCase();
        if (message.includes("source") || message.includes("user_id") || message.includes("caller_phone")) {
          return voiceSqlMissingResponse();
        }
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
        userId: member?.userId || "",
        email: caller.email || null,
        category: draft.category,
        subject: draft.subject,
        body: draft.body,
        source: VOICE_TICKET_SOURCE,
        callerPhone: caller.phone || null,
      });

      return NextResponse.json({
        ok: true,
        ticket,
        member_found: !!member,
        email_sent: email.sent,
        message: spokenTicketCreated(ticket.id),
      });
    }

    const ticketId = readTicketId(flat);
    if (!ticketId) {
      return NextResponse.json({ error: "Pass the ticket id." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(SUPPORT_TICKETS_TABLE)
      .select(VOICE_TICKET_SELECT)
      .eq("id", ticketId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const ticket = asTicketRow(data);
    if (!ticket || !ticketBelongsToCaller(ticket, caller, member?.userId || null)) {
      return NextResponse.json({ error: "No ticket matched those details." }, { status: 404 });
    }

    if (tool === "get_ticket") {
      return NextResponse.json({
        ok: true,
        ticket: publicVoiceTicket(ticket),
        message: spokenTicketStatus(ticket) + " " + VOICE_SPOKEN_SAFETY,
      });
    }

    if (ticket.status === VOICE_RESOLVED_STATUS) {
      return NextResponse.json({
        ok: true,
        ticket: publicVoiceTicket(ticket),
        message: spokenTicketResolved(ticket.id),
      });
    }

    const updated = await supabase
      .from(SUPPORT_TICKETS_TABLE)
      .update({ status: VOICE_RESOLVED_STATUS })
      .eq("id", ticket.id)
      .select(VOICE_TICKET_SELECT)
      .maybeSingle();

    if (updated.error) {
      return NextResponse.json({ error: updated.error.message }, { status: 400 });
    }

    const resolved = asTicketRow(updated.data) || { ...ticket, status: VOICE_RESOLVED_STATUS };
    return NextResponse.json({
      ok: true,
      ticket: publicVoiceTicket(resolved),
      message: spokenTicketResolved(resolved.id),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

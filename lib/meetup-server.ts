import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { browseSelectColumns, toBrowseProfile } from "./profile-search";
import { attachLastSeen, loadPresenceByUserIds } from "./presence-server";
import { applyBlockedFilter, loadBlockedSet } from "./safety-server";
import { tableExists, tableHasColumn } from "./server-supabase";
import {
  EVENT_TICKETS_TABLE,
  GROUP_MESSAGES_TABLE,
  MEETUP_COPY,
  MEETUP_SHORTLIST_SIZE,
  MEETUPS_TABLE,
  RSVPS_TABLE,
  asMeetupRecord,
  fallbackMeetup,
  pickCurrentMeetup,
  tableMissingPayload,
  type MeetupGroupMessage,
  type MeetupMember,
  type MeetupRecord,
} from "./meetup";
import { BIODATA_SHARE_COLUMN } from "./biodata-share";
import { INSTAGRAM_COLUMN } from "./instagram";
import { VERIFYAI_STATUS_COLUMN } from "./verifyai";

function asId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function meetupTablesReady(supabase: SupabaseClient) {
  const meetups = await tableExists(supabase, MEETUPS_TABLE);
  if (!meetups) return false;
  const rsvps = await tableExists(supabase, RSVPS_TABLE);
  const tickets = await tableExists(supabase, EVENT_TICKETS_TABLE);
  const messages = await tableExists(supabase, GROUP_MESSAGES_TABLE);
  return rsvps && tickets && messages;
}

export function meetupTableMissingResponse(status = 503) {
  return NextResponse.json(tableMissingPayload(), { status });
}

export async function loadMeetupRows(supabase: SupabaseClient): Promise<MeetupRecord[]> {
  const { data, error } = await supabase
    .from(MEETUPS_TABLE)
    .select("id, title, month_key, starts_at, timezone_note, summary, format, regions")
    .order("month_key", { ascending: false })
    .limit(24);
  if (error || !Array.isArray(data)) return [];
  return data
    .map(function (row) {
      return asMeetupRecord(row as Record<string, unknown>);
    })
    .filter(function (row): row is MeetupRecord {
      return !!row;
    });
}

export async function loadCurrentMeetup(supabase: SupabaseClient): Promise<MeetupRecord> {
  const rows = await loadMeetupRows(supabase);
  return pickCurrentMeetup(rows);
}

export async function userHasRsvp(
  supabase: SupabaseClient,
  meetupId: string,
  userId: string
) {
  if (!meetupId || !userId) return false;
  const { data, error } = await supabase
    .from(RSVPS_TABLE)
    .select("id")
    .eq("meetup_id", meetupId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return !error && !!data;
}

export async function countRsvps(supabase: SupabaseClient, meetupId: string) {
  const { count, error } = await supabase
    .from(RSVPS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("meetup_id", meetupId);
  if (error) return 0;
  return typeof count === "number" ? count : 0;
}

export async function userHasPaidTicket(
  supabase: SupabaseClient,
  meetupId: string,
  userId: string
) {
  if (!meetupId || !userId) return false;
  if (!(await tableExists(supabase, EVENT_TICKETS_TABLE))) return false;
  const { data, error } = await supabase
    .from(EVENT_TICKETS_TABLE)
    .select("id")
    .eq("meetup_id", meetupId)
    .eq("user_id", userId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();
  return !error && !!data;
}

export async function insertRsvp(
  supabase: SupabaseClient,
  meetupId: string,
  userId: string
) {
  const existing = await userHasRsvp(supabase, meetupId, userId);
  if (existing) return { ok: true, created: false as const };

  const { error } = await supabase.from(RSVPS_TABLE).insert([
    {
      meetup_id: meetupId,
      user_id: userId,
    },
  ]);
  if (error) {
    const message = (error.message || "").toLowerCase();
    if (message.includes("duplicate") || message.includes("unique")) {
      return { ok: true, created: false as const };
    }
    return { ok: false, created: false as const, error: error.message };
  }
  return { ok: true, created: true as const };
}

export async function recordEventTicket(
  supabase: SupabaseClient,
  input: {
    meetupId: string;
    userId: string;
    checkoutSessionId: string;
    paymentIntentId?: string | null;
    priceId?: string | null;
    amountCents?: number | null;
  }
) {
  if (!(await tableExists(supabase, EVENT_TICKETS_TABLE))) {
    return { error: MEETUP_COPY.tableMissing, sql: "supabase/meetups.sql" };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from(EVENT_TICKETS_TABLE).upsert(
    {
      meetup_id: input.meetupId,
      user_id: input.userId,
      stripe_checkout_session_id: input.checkoutSessionId,
      stripe_payment_intent_id: input.paymentIntentId || null,
      stripe_price_id: input.priceId || null,
      amount_cents: typeof input.amountCents === "number" ? input.amountCents : null,
      status: "paid",
      paid_at: now,
    },
    { onConflict: "stripe_checkout_session_id" }
  );
  if (error) return { error: error.message };

  const rsvp = await insertRsvp(supabase, input.meetupId, input.userId);
  if (!rsvp.ok) return { error: rsvp.error || "Could not record the RSVP after the ticket." };
  return { error: null as string | null };
}

export async function ensureRsvpFromTicket(
  supabase: SupabaseClient,
  meetupId: string,
  userId: string
) {
  if (!(await userHasPaidTicket(supabase, meetupId, userId))) {
    return { rsvped: false, ticketPaid: false };
  }
  const rsvp = await insertRsvp(supabase, meetupId, userId);
  return { rsvped: rsvp.ok, ticketPaid: true, error: rsvp.ok ? undefined : rsvp.error };
}

async function profileColumns(supabase: SupabaseClient) {
  const [photo, diet, userId, verifyai, instagram, biodata] = await Promise.all([
    tableHasColumn(supabase, "profiles", "photo_url"),
    tableHasColumn(supabase, "profiles", "diet"),
    tableHasColumn(supabase, "profiles", "user_id"),
    tableHasColumn(supabase, "profiles", VERIFYAI_STATUS_COLUMN),
    tableHasColumn(supabase, "profiles", INSTAGRAM_COLUMN),
    tableHasColumn(supabase, "profiles", BIODATA_SHARE_COLUMN),
  ]);
  return {
    photo_url: photo,
    diet,
    user_id: userId,
    verifyai_status: verifyai,
    instagram,
    biodata_share: biodata,
  };
}

export async function loadMeetupShortlist(
  supabase: SupabaseClient,
  meetupId: string,
  viewerId: string
): Promise<MeetupMember[]> {
  const { data, error } = await supabase
    .from(RSVPS_TABLE)
    .select("user_id, created_at")
    .eq("meetup_id", meetupId)
    .neq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error || !Array.isArray(data)) return [];

  const userIds = data
    .map(function (row) {
      return asId((row as { user_id?: unknown }).user_id);
    })
    .filter(Boolean);
  if (!userIds.length) return [];

  const blocked = await loadBlockedSet(supabase, viewerId);
  const flags = await profileColumns(supabase);
  if (!flags.user_id) {
    const fallback: MeetupMember[] = [];
    for (const userId of userIds) {
      if (blocked.userIds.has(userId)) continue;
      fallback.push({
        userId,
        displayName: MEETUP_COPY.memberFallback,
        profile: null,
      });
      if (fallback.length >= MEETUP_SHORTLIST_SIZE) break;
    }
    return fallback;
  }

  const select = browseSelectColumns(flags) + ", status";
  const { data: profiles } = await supabase
    .from("profiles")
    .select(select)
    .in("user_id", userIds);

  const presence = await loadPresenceByUserIds(supabase, userIds);
  const byUser = new Map<string, Record<string, unknown>>();
  if (Array.isArray(profiles)) {
    const rows = profiles as unknown as Record<string, unknown>[];
    const visible = applyBlockedFilter(
      rows.filter(function (row) {
        return asId(row.status) !== "removed";
      }),
      blocked
    );
    visible.forEach(function (row) {
      const userId = asId(row.user_id);
      if (!userId || byUser.has(userId)) return;
      byUser.set(userId, attachLastSeen(row, presence));
    });
  }

  const members: MeetupMember[] = [];
  for (const userId of userIds) {
    if (blocked.userIds.has(userId)) continue;
    const row = byUser.get(userId);
    const profile = row ? toBrowseProfile(row) : null;
    if (profile && profile.id && blocked.profileIds.has(profile.id)) continue;
    members.push({
      userId,
      displayName: (profile && profile.name) || MEETUP_COPY.memberFallback,
      profile,
    });
    if (members.length >= MEETUP_SHORTLIST_SIZE) break;
  }
  return members;
}

export async function loadGroupMessages(
  supabase: SupabaseClient,
  meetupId: string,
  viewerId: string
): Promise<MeetupGroupMessage[]> {
  const { data, error } = await supabase
    .from(GROUP_MESSAGES_TABLE)
    .select("id, meetup_id, sender_id, body, created_at")
    .eq("meetup_id", meetupId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error || !Array.isArray(data)) return [];

  const blocked = await loadBlockedSet(supabase, viewerId);
  const senderIds = Array.from(
    new Set(
      data
        .map(function (row) {
          return asId((row as { sender_id?: unknown }).sender_id);
        })
        .filter(Boolean)
    )
  );

  const names = new Map<string, string>();
  if (senderIds.length && (await tableHasColumn(supabase, "profiles", "user_id"))) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", senderIds);
    if (Array.isArray(profiles)) {
      profiles.forEach(function (row: { user_id?: unknown; full_name?: unknown }) {
        const userId = asId(row.user_id);
        const name = typeof row.full_name === "string" ? row.full_name.trim() : "";
        if (userId && name) names.set(userId, name);
      });
    }
  }

  return data
    .map(function (row) {
      const senderId = asId((row as { sender_id?: unknown }).sender_id);
      if (senderId && senderId !== viewerId && blocked.userIds.has(senderId)) return null;
      return {
        id: asId((row as { id?: unknown }).id),
        meetup_id: asId((row as { meetup_id?: unknown }).meetup_id) || meetupId,
        sender_id: senderId,
        sender_name: names.get(senderId) || MEETUP_COPY.memberFallback,
        body: typeof (row as { body?: unknown }).body === "string" ? (row as { body: string }).body : "",
        created_at:
          typeof (row as { created_at?: unknown }).created_at === "string"
            ? (row as { created_at: string }).created_at
            : "",
      };
    })
    .filter(function (row): row is MeetupGroupMessage {
      return !!row && !!row.id && !!row.body;
    });
}

export async function insertGroupMessage(
  supabase: SupabaseClient,
  meetupId: string,
  userId: string,
  body: string
) {
  const { data, error } = await supabase
    .from(GROUP_MESSAGES_TABLE)
    .insert([
      {
        meetup_id: meetupId,
        sender_id: userId,
        body,
      },
    ])
    .select("id, meetup_id, sender_id, body, created_at")
    .maybeSingle();
  if (error) return { error: error.message, message: null };
  return { error: null, message: data };
}

export function fallbackMeetupPublic() {
  return fallbackMeetup();
}

/** Keep unused import live for callers that only need the type. */
export type { MeetupRecord };

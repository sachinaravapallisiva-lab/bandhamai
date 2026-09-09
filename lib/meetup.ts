/** Locked Meetup this month copy and helpers. Virtual matrimony meetup, not a dating mixer. */

import { BROWSE_SHORTLIST_SIZE } from "./profile-search";
import type { BrowseProfile } from "./profile-search";

export const MEETUP_SQL_FILE = "supabase/meetups.sql";
export const MEETUPS_TABLE = "meetups";
export const RSVPS_TABLE = "rsvps";
export const GROUP_MESSAGES_TABLE = "group_messages";
export const EVENT_TICKETS_TABLE = "event_tickets";

export const MEETUP_PATH = "/meetup";
export const MEETUP_CHAT_PATH = "/chat";
export const MEETUP_API_PATH = "/api/meetup";
export const MEETUP_MESSAGES_PATH = "/api/meetup/messages";
export const MEETUP_SHORTLIST_PATH = "/api/meetup/shortlist";
export const EVENT_TICKET_CHECKOUT_PATH = "/api/meetup/checkout";
export const EVENT_TICKET_CONFIRM_PATH = "/api/meetup/confirm";

export const EVENT_TICKET_PURPOSE = "meetup_event";
export const EVENT_TICKET_PRICE_ENV = "STRIPE_EVENT_PRICE_ID";

export const MEETUP_SHORTLIST_SIZE = BROWSE_SHORTLIST_SIZE;
export const MEETUP_PARTNER_PREFIX = "meetup:";
export const MEETUP_SPEED_STORAGE_KEY = "bandham.meetup.speedMatch";
export const MEETUP_MESSAGE_MAX = 2000;

/** Stable seed so the August 2026 row is the same in SQL and in the fallback card. */
export const SEED_MEETUP_ID = "a2026080-0000-4000-8000-000000000001";
export const SEED_MEETUP_MONTH_KEY = "2026-08";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MEETUP_COPY = {
  kicker: "MEETUP THIS MONTH",
  title: "Meetup this month",
  monthTitle: "August 2026",
  cardBody:
    "A virtual matrimony meetup for members in the US, Australia, the UK, the EU, and Ireland. A separate event ticket is required. It is not part of the Bandham AI subscription.",
  pageBody:
    "This meetup is online. It is for serious matrimony, not a dating mixer. Buy a separate event ticket to RSVP. Then join Speed Match and the group chat on the side.",
  timeNote: "Saturday 29 August 2026 at 12:00 UTC. A time that can work across the US, Australia, the UK, the EU, and Ireland.",
  formatNote: "Online. No venue booking.",
  rsvp: "RSVP",
  rsvped: "You RSVPed",
  rsvpNeedSignIn: "Sign in to get a ticket.",
  rsvpNeedSql: "Meetup storage is not applied yet. Run supabase/meetups.sql in the Supabase SQL editor.",
  ticketHeadline: "A separate event ticket",
  ticketBody:
    "This meetup needs its own ticket. It is not part of the Bandham AI subscription. One to one Chat still needs an active Bandham AI subscription.",
  ticketCta: "Get a ticket",
  ticketBusy: "Opening checkout",
  ticketNotConfigured:
    "Event ticket checkout is not configured. Set STRIPE_EVENT_PRICE_ID on Vercel. The dollar amount is not named in this app yet.",
  ticketWrongPrice:
    "STRIPE_EVENT_PRICE_ID must be a one time event Price. Do not point it at the Bandham AI subscription Price or VerifyAI.",
  ticketRequired: "Buy an event ticket to RSVP. Group chat opens after that paid ticket.",
  ticketPaidNote: "Ticket is on file. You RSVPed.",
  ticketCancel: "Checkout was canceled. No ticket was charged.",
  openMeetup: "Open meetup",
  speedKicker: "SPEED MATCH",
  speedTitle: "Ten questions for this month's meetup",
  speedBody:
    "The same ten desi dealbreakers. Fifteen seconds each. Tap Don't want to answer if you would rather skip. After this round you will see a shortlist of other people who RSVPed.",
  speedBegin: "Begin Speed Match",
  speedDone: "See the shortlist",
  speedClose: "Back to meetup",
  shortlistKicker: "OTHER RSVPS",
  shortlistTitle: "People who RSVPed",
  shortlistBody: "Up to three other members. This is a shortlist, not a score and not a promise that you will match.",
  shortlistEmptyTitle: "No other RSVPs yet.",
  shortlistEmptyBody: "You are on the list. When others RSVP they can show here after you finish Speed Match.",
  chatKicker: "GROUP CHAT",
  chatTitle: "Meetup group chat",
  chatBody: "A room for people who RSVPed. It is not WhatsApp. WhatsApp stays a private one to one choice.",
  chatNeedSignIn: "Sign in to join the group chat.",
  chatNeedRsvp: "Buy an event ticket to join the group chat.",
  chatNeedSql: "Group chat storage is not applied yet. Run supabase/meetups.sql in the Supabase SQL editor.",
  chatGuest: "No public guest posting. Sign in and RSVP first.",
  chatPlaceholder: "Write to the meetup room",
  chatSend: "Send",
  chatEmpty: "No messages yet. Be kind and stay on matrimony.",
  openOneToOne: "Open Chat",
  oneToOneNote: "One to one Chat still needs an active Bandham AI subscription. A meetup ticket does not unlock it.",
  blockedNote: "You cannot open Chat with this person. One of you blocked the other.",
  tableMissing: "Meetup storage is not applied yet. Run supabase/meetups.sql in the Supabase SQL editor.",
  memberFallback: "Meetup member",
  guruNever: "The Bandham assistant never posts here and never writes sendable text.",
} as const;

export type MeetupCopyKey = keyof typeof MEETUP_COPY;

export type MeetupRecord = {
  id: string;
  title: string;
  month_key: string;
  month_label: string;
  summary: string;
  starts_at: string;
  timezone_note: string;
  format: string;
  regions: string[];
};

export type MeetupMember = {
  userId: string;
  displayName: string;
  profile: BrowseProfile | null;
};

export type MeetupGroupMessage = {
  id: string;
  meetup_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
};

export function currentMonthKey(now = new Date()) {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return now.getUTCFullYear() + "-" + month;
}

export function monthLabelFromKey(monthKey: string) {
  const parts = monthKey.split("-");
  const year = parts[0] || "";
  const monthNum = Number(parts[1]);
  const name = MONTH_NAMES[monthNum - 1];
  if (!name || !year) return MEETUP_COPY.monthTitle;
  return name + " " + year;
}

export function meetupPartnerId(meetupId: string) {
  return MEETUP_PARTNER_PREFIX + meetupId;
}

export function isMeetupPartnerId(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith(MEETUP_PARTNER_PREFIX);
}

export function fallbackMeetup(_now = new Date()): MeetupRecord {
  const monthKey = SEED_MEETUP_MONTH_KEY;
  return {
    id: SEED_MEETUP_ID,
    title: MEETUP_COPY.title,
    month_key: monthKey,
    month_label: monthLabelFromKey(monthKey) || MEETUP_COPY.monthTitle,
    summary: MEETUP_COPY.pageBody,
    starts_at: "2026-08-29T12:00:00.000Z",
    timezone_note: MEETUP_COPY.timeNote,
    format: "virtual",
    regions: ["US", "AU", "UK", "EU", "IE"],
  };
}

export function asMeetupRecord(row: Record<string, unknown> | null | undefined): MeetupRecord | null {
  if (!row || typeof row !== "object") return null;
  const id = typeof row.id === "string" ? row.id : "";
  const monthKey = typeof row.month_key === "string" ? row.month_key : "";
  if (!id || !monthKey) return null;
  const regions = Array.isArray(row.regions)
    ? row.regions.filter(function (item): item is string {
        return typeof item === "string" && item.trim().length > 0;
      })
    : [];
  return {
    id,
    title: typeof row.title === "string" && row.title.trim() ? row.title.trim() : MEETUP_COPY.title,
    month_key: monthKey,
    month_label: monthLabelFromKey(monthKey),
    summary: typeof row.summary === "string" && row.summary.trim() ? row.summary.trim() : MEETUP_COPY.pageBody,
    starts_at: typeof row.starts_at === "string" ? row.starts_at : "",
    timezone_note:
      typeof row.timezone_note === "string" && row.timezone_note.trim()
        ? row.timezone_note.trim()
        : MEETUP_COPY.timeNote,
    format: typeof row.format === "string" && row.format.trim() ? row.format.trim() : "virtual",
    regions,
  };
}

export function pickCurrentMeetup(rows: MeetupRecord[], now = new Date()) {
  if (!rows.length) return fallbackMeetup(now);
  const monthKey = currentMonthKey(now);
  const exact = rows.find(function (row) {
    return row.month_key === monthKey;
  });
  if (exact) return exact;
  const sorted = rows.slice().sort(function (a, b) {
    return a.month_key < b.month_key ? 1 : a.month_key > b.month_key ? -1 : 0;
  });
  return sorted[0] || fallbackMeetup(now);
}

export function emptyMeetupProfile(partial: Partial<BrowseProfile> & { id: string; name: string }): BrowseProfile {
  return {
    city: "",
    work: "",
    education: "",
    langs: "",
    diet: "",
    visa: "",
    gender: "",
    note: "",
    promptLabel: "",
    photoUrl: "",
    verified: false,
    online: false,
    instagram: "",
    biodataShare: false,
    membership: "regular",
    ...partial,
  };
}

export function meetupSpeedPartner(meetupId: string): BrowseProfile {
  return emptyMeetupProfile({
    id: meetupPartnerId(meetupId),
    name: "this month's meetup",
  });
}

export function chatHrefForUser(userId: string) {
  return MEETUP_CHAT_PATH + "?to=" + encodeURIComponent(userId);
}

export function copyHasDash(value: string) {
  return /[-–—]/.test(value);
}

export function tableMissingPayload() {
  return {
    error: MEETUP_COPY.tableMissing,
    code: "table_missing",
    sql: MEETUP_SQL_FILE,
  };
}

export function ticketNotConfiguredPayload() {
  return {
    error: MEETUP_COPY.ticketNotConfigured,
    code: "event_ticket_not_configured",
    env: EVENT_TICKET_PRICE_ENV,
  };
}

export type EventTicketPrice = {
  id?: string | null;
  type?: string | null;
  recurring?: unknown;
};

/** One time event Price. Amount is unnamed here. Reject messaging and VerifyAI Prices. */
export function isEventTicketPrice(
  price: EventTicketPrice,
  messagingPriceId?: string | null,
  verifyaiPriceId?: string | null
) {
  if (!price || price.type === "recurring" || price.recurring) return false;
  const id = typeof price.id === "string" ? price.id.trim() : "";
  const messaging = (messagingPriceId || "").trim();
  const verifyai = (verifyaiPriceId || "").trim();
  if (id && messaging && id === messaging) return false;
  if (id && verifyai && id === verifyai) return false;
  return price.type === "one_time" || !price.recurring;
}

export function meetupCheckoutReturnUrls(origin: string) {
  const base = origin.replace(/\/$/, "") + MEETUP_PATH;
  return {
    success_url: base + "?ticket=paid&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: base + "?ticket=cancel",
  };
}

import { timingSafeEqual } from "node:crypto";
import { asTrimmed, SUPPORT_CATEGORIES, type SupportCategory } from "./support";

export const VOICE_SUPPORT_PATH = "/api/voice/support";
export const VOICE_SUPPORT_SQL_FILE = "supabase/voice_support.sql";
export const VOICE_SUPPORT_PROMPT_FILE = "docs/voice-support-prompt.md";
export const VOICE_SUPPORT_SECRET_ENV = "BANDHAM_VOICE_SUPPORT_SECRET";
export const VOICE_SUPPORT_SECRET_HEADER = "x-bandham-voice-support-secret";
export const VOICE_TICKET_SOURCE = "voice";
export const VOICE_RESOLVED_STATUS = "closed";

export const VOICE_SUPPORT_TOOLS = [
  "identify_member",
  "create_ticket",
  "get_ticket",
  "resolve_ticket",
] as const;

export type VoiceSupportTool = (typeof VOICE_SUPPORT_TOOLS)[number];

export const VOICE_TICKET_SELECT =
  "id, user_id, email, caller_phone, category, subject, body, status, source, created_at";

/** Greeting the phone agent may speak. No hyphens or em dashes. */
export const VOICE_SPOKEN_INTRO =
  "Hi, this is Bandham Support. I can help with the app, billing, or your account. I cannot search profiles or write dating messages.";

export const VOICE_SPOKEN_PRICES =
  "Messaging is 9.99 a month. VerifyAI is 4.99 one time. Meetup this month is a feature demo only, not a live paid event.";

export const VOICE_SPOKEN_SAFETY =
  "Tickets are for app issues, not emergencies. If someone is harassing you, use Block or Report in the app. If you are in immediate danger, contact local authorities.";

export const VOICE_SPOKEN_REFUND =
  "I cannot refund or reverse a Stripe charge from this call. I can open a billing ticket for Sai to review.";

export const VOICE_SPOKEN_NOT_FOUND =
  "I could not match that email or phone to a Bandham account. I can still open a ticket with the details you gave.";

export function voiceSupportSecret() {
  return (process.env.BANDHAM_VOICE_SUPPORT_SECRET || "").trim();
}

export function isVoiceSupportTool(value: string): value is VoiceSupportTool {
  return VOICE_SUPPORT_TOOLS.some(function (item) {
    return item === value;
  });
}

export function normalizeVoiceEmail(value: unknown) {
  const email = asTrimmed(value, 254).toLowerCase();
  if (!email || !email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    return "";
  }
  return email;
}

/** Keep digits and a leading plus so later matching can use the last 10 digits. */
export function normalizeVoicePhone(value: unknown) {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return (hasPlus ? "+" : "") + digits;
}

export function phoneMatchKey(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function phonesMatch(left: string, right: string) {
  const a = phoneMatchKey(left);
  const b = phoneMatchKey(right);
  return !!a && a === b;
}

export function firstNameOnly(fullName: unknown) {
  const raw = asTrimmed(fullName, 80);
  if (!raw) return "";
  const token = raw.split(/\s+/)[0] || "";
  return token.replace(/[^A-Za-z.']/g, "").slice(0, 40);
}

export function readVoiceTool(raw: unknown, queryTool?: string | null) {
  const fromQuery = asTrimmed(queryTool, 64).toLowerCase();
  if (isVoiceSupportTool(fromQuery)) return fromQuery;
  if (!raw || typeof raw !== "object") return "";
  const record = raw as { tool?: unknown; name?: unknown; action?: unknown };
  const candidate = asTrimmed(record.tool ?? record.name ?? record.action, 64).toLowerCase();
  return isVoiceSupportTool(candidate) ? candidate : "";
}

function headerSecret(request: Request) {
  const named = (request.headers.get(VOICE_SUPPORT_SECRET_HEADER) || "").trim();
  if (named) return named;
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return "";
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Fail closed: missing secret is not authorized. */
export function authorizeVoiceSupport(request: Request) {
  const expected = voiceSupportSecret();
  if (!expected) {
    return { ok: false as const, reason: "missing_secret" as const };
  }
  const offered = headerSecret(request);
  if (!offered || !safeEqual(offered, expected)) {
    return { ok: false as const, reason: "unauthorized" as const };
  }
  return { ok: true as const, reason: null };
}

export type VoiceCaller = {
  email: string;
  phone: string;
};

export function readVoiceCaller(raw: Record<string, unknown> | null | undefined): VoiceCaller {
  const record = raw || {};
  return {
    email: normalizeVoiceEmail(record.email ?? record.caller_email),
    phone: normalizeVoicePhone(record.phone ?? record.caller_phone),
  };
}

export function callerMissing(caller: VoiceCaller) {
  return !caller.email && !caller.phone;
}

export type VoiceTicketRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  caller_phone?: string | null;
  category: SupportCategory | string;
  subject: string;
  body: string;
  status: string;
  source?: string;
  created_at: string;
};

export function ticketBelongsToCaller(ticket: VoiceTicketRow, caller: VoiceCaller, memberId?: string | null) {
  if (memberId && ticket.user_id && ticket.user_id === memberId) return true;
  if (caller.email && (ticket.email || "").trim().toLowerCase() === caller.email) return true;
  if (caller.phone && ticket.caller_phone && phonesMatch(ticket.caller_phone, caller.phone)) return true;
  return false;
}

export function publicVoiceTicket(ticket: VoiceTicketRow) {
  return {
    id: ticket.id,
    category: ticket.category,
    subject: ticket.subject,
    status: ticket.status,
    created_at: ticket.created_at,
  };
}

/** First 8 hex characters so the agent can say a reference without hyphens. */
export function spokenTicketRef(id: string) {
  return (id || "").replace(/-/g, "").slice(0, 8);
}

export function spokenTicketCreated(id: string) {
  return (
    "Ticket saved. Reference " +
    spokenTicketRef(id) +
    ". We will look into it. " +
    VOICE_SPOKEN_SAFETY
  );
}

export function spokenTicketStatus(ticket: VoiceTicketRow) {
  const status =
    ticket.status === "closed"
      ? "resolved"
      : ticket.status === "in_progress"
        ? "in progress"
        : "open";
  return (
    "Ticket " +
    spokenTicketRef(ticket.id) +
    " is " +
    status +
    ". Category " +
    ticket.category +
    ". " +
    ticket.subject
  );
}

export function spokenTicketResolved(id: string) {
  return "Ticket " + spokenTicketRef(id) + " is marked resolved. Status is closed.";
}

export const VOICE_SUPPORT_TOOL_SPECS = {
  identify_member: {
    name: "identify_member",
    description:
      "Look up the caller as a Bandham member by the email or phone they spoke. Returns only a first name and member id if found. Never searches or lists other profiles.",
    parameters: {
      type: "object",
      properties: {
        email: { type: "string", description: "Email the caller spoke." },
        phone: { type: "string", description: "Phone the caller spoke, with country code if they gave one." },
      },
    },
  },
  create_ticket: {
    name: "create_ticket",
    description:
      "Open an app issue ticket (bug, billing, account, or other) for this caller. Pass the email or phone they spoke. Do not use for harassment, refunds, profile search, or dating help.",
    parameters: {
      type: "object",
      properties: {
        email: { type: "string" },
        phone: { type: "string" },
        category: { type: "string", enum: SUPPORT_CATEGORIES },
        subject: { type: "string", description: "Short title, 4 to 160 characters." },
        body: { type: "string", description: "Short summary of the app issue, 8 to 4000 characters." },
      },
      required: ["category", "subject", "body"],
    },
  },
  get_ticket: {
    name: "get_ticket",
    description:
      "Read status for one ticket that belongs to this caller. Pass the ticket id plus the email or phone they spoke.",
    parameters: {
      type: "object",
      properties: {
        ticket_id: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
      },
      required: ["ticket_id"],
    },
  },
  resolve_ticket: {
    name: "resolve_ticket",
    description:
      "Mark the caller's own ticket resolved (stored as closed) only after they confirm the issue is actually cleared. Pass ticket id plus their email or phone.",
    parameters: {
      type: "object",
      properties: {
        ticket_id: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
      },
      required: ["ticket_id"],
    },
  },
} as const;

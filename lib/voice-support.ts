import { timingSafeEqual } from "node:crypto";
import { asTrimmed, SUPPORT_CATEGORIES, type SupportCategory } from "./support";

export const VOICE_SUPPORT_PATH = "/api/voice/support";
export const VOICE_SUPPORT_SQL_FILE = "supabase/voice_support.sql";
export const VOICE_SUPPORT_PROMPT_FILE = "docs/voice-support-prompt.md";
export const VOICE_SUPPORT_SECRET_ENV = "BANDHAM_VOICE_SUPPORT_SECRET";
export const VOICE_SUPPORT_SECRET_HEADER = "x-bandham-voice-support-secret";
export const VOICE_TICKET_SOURCE = "voice";
export const VOICE_RESOLVED_STATUS = "closed";

/** Server-only destination for Support human handoff. Never prefix NEXT_PUBLIC_. */
export const SUPPORT_HANDOFF_E164_ENV = "BANDHAM_SUPPORT_HANDOFF_E164";
/** Extra server-only subscribe outbound block. The locked subscribe line is always blocked. */
export const SUBSCRIBE_OUTBOUND_E164_ENV = "BANDHAM_SUBSCRIBE_OUTBOUND_E164";
/** Public Bandham Support inbound. Transfer caller ID stays this number. */
export const SUPPORT_PUBLIC_CALLER_ID_E164 = "+18032655233";

export const VOICE_SUPPORT_TOOLS = [
  "identify_member",
  "create_ticket",
  "get_ticket",
  "resolve_ticket",
  "transfer_to_human",
] as const;

export type VoiceSupportTool = (typeof VOICE_SUPPORT_TOOLS)[number];

export const VOICE_TICKET_SELECT =
  "id, user_id, email, caller_phone, category, subject, body, status, source, created_at";

/** Greeting the phone agent may speak. No hyphens or em dashes. */
export const VOICE_SPOKEN_INTRO =
  "Hi, this is Bandham Support. I can help with the app, billing, or your account. I cannot search profiles or write dating messages.";

export const VOICE_SPOKEN_PRICES =
  "Bandham AI subscription is 9.99 a month. VerifyAI is 4.99 one time. Meetup this month is a feature demo only, not a live paid event.";

/** Only if the caller asks what the subscription covers. Do not volunteer this. */
export const VOICE_SPOKEN_INCLUDED_WHEN_ASKED =
  "That unlocks messaging. Browse, search, Speed Match, and creating a profile stay free.";

export const VOICE_SPOKEN_SAFETY =
  "Tickets are for app issues, not emergencies. If someone is harassing you, use Block or Report in the app. If you are in immediate danger, contact local authorities.";

export const VOICE_SPOKEN_REFUND =
  "I cannot refund or reverse a Stripe charge from this call. I can open a billing ticket for Sai to review.";

export const VOICE_SPOKEN_NOT_FOUND =
  "I could not match that email or phone to a Bandham account. I can still open a ticket with the details you gave.";

export const VOICE_SPOKEN_HANDOFF = "I am connecting you now. Please stay on the line.";
export const VOICE_SPOKEN_HANDOFF_UNAVAILABLE =
  "They are not available right now. I can keep helping you here.";
/** Only if the caller asks who they will get. First name only. */
export const VOICE_SPOKEN_HANDOFF_WHO = "You will get Sai.";

export function voiceSupportSecret() {
  return (process.env.BANDHAM_VOICE_SUPPORT_SECRET || "").trim();
}

export function isVoiceSupportTool(value: string): value is VoiceSupportTool {
  return VOICE_SUPPORT_TOOLS.some(function (item) {
    return item === value;
  });
}

function asObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

function firstNonEmpty(values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function asArgs(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return asObject(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  return asObject(raw);
}

function canonicalVoiceTool(value: string): VoiceSupportTool | "" {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "transfer_call" || normalized === "transfercall") return "transfer_to_human";
  return isVoiceSupportTool(normalized) ? normalized : "";
}

export function isSupportPublicNumber(value: string) {
  return phonesMatch(value, SUPPORT_PUBLIC_CALLER_ID_E164);
}

function asE164OrEmpty(value: string) {
  const normalized = normalizeVoicePhone(value);
  if (!normalized) return "";
  return normalized.startsWith("+") ? normalized : "+" + normalized.replace(/\D/g, "");
}

/** Locked subscribe outbound, assembled so git never stores the full digit run. */
function lockedSubscribeOutboundE164() {
  return "+1" + ["6", "4", "0", "8", "3", "7", "9", "4", "5", "9"].join("");
}

/** Extra subscribe outbound from env. Empty means no extra number beyond the lock. */
export function subscribeOutboundE164() {
  const e164 = asE164OrEmpty((process.env[SUBSCRIBE_OUTBOUND_E164_ENV] || "").trim());
  if (!e164 || isSupportPublicNumber(e164)) return "";
  return e164;
}

export function isSubscribeOutboundNumber(value: string) {
  if (!value) return false;
  if (phonesMatch(value, lockedSubscribeOutboundE164())) return true;
  const extra = subscribeOutboundE164();
  if (!extra) return false;
  return phonesMatch(value, extra);
}

/** Caller ID on the transfer. Always the public Support number. Never subscribe outbound. */
export function supportHandoffCallerId() {
  return SUPPORT_PUBLIC_CALLER_ID_E164;
}

/**
 * Server-only E.164 for the human handoff. Empty env means stay on Support.
 * Never returns the subscribe outbound number or the public Support number.
 */
export function supportHandoffE164() {
  const e164 = asE164OrEmpty((process.env[SUPPORT_HANDOFF_E164_ENV] || "").trim());
  if (!e164) return "";
  if (isSubscribeOutboundNumber(e164) || isSupportPublicNumber(e164)) return "";
  return e164;
}

/** Unknown inbound is allowed (xAI). Subscribe outbound is never allowed. Support 803 only. */
export function inboundAllowsSupportHandoff(inbound: string) {
  if (!inbound) return true;
  if (isSubscribeOutboundNumber(inbound)) return false;
  return isSupportPublicNumber(inbound);
}

export function supportHandoffDestination() {
  const number = supportHandoffE164();
  const callerId = supportHandoffCallerId();
  if (!number || isSubscribeOutboundNumber(callerId)) return null;
  return {
    type: "number" as const,
    number,
    callerId,
    description: "Human handoff from Bandham Support. Do not speak this number.",
    message: VOICE_SPOKEN_HANDOFF,
    transferPlan: {
      mode: "warm-transfer-experimental" as const,
      timeout: 25,
      voicemailDetectionType: "transcript" as const,
      message: "Bandham Support has a caller who asked for you. Are you available?",
      fallbackPlan: {
        message: VOICE_SPOKEN_HANDOFF_UNAVAILABLE,
        endCallEnabled: false,
      },
    },
  };
}

export function supportHandoffPayload(input?: { inboundNumber?: string; toolCallId?: string }) {
  const inbound = (input && input.inboundNumber) || "";
  if (!inboundAllowsSupportHandoff(inbound) || !supportHandoffDestination()) {
    const payload: Record<string, unknown> = {
      ok: true,
      transferred: false,
      stay_on_support: true,
      message: VOICE_SPOKEN_HANDOFF_UNAVAILABLE,
    };
    if (input && input.toolCallId) {
      payload.results = [{ toolCallId: input.toolCallId, result: VOICE_SPOKEN_HANDOFF_UNAVAILABLE }];
    }
    return payload;
  }
  const destination = supportHandoffDestination();
  const payload: Record<string, unknown> = {
    ok: true,
    transferred: true,
    stay_on_support: false,
    message: VOICE_SPOKEN_HANDOFF,
    caller_id: SUPPORT_PUBLIC_CALLER_ID_E164,
    destination,
  };
  if (input && input.toolCallId) {
    payload.results = [{ toolCallId: input.toolCallId, result: VOICE_SPOKEN_HANDOFF }];
  }
  return payload;
}

/**
 * Flatten xAI `{ tool, ... }` and Vapi tool-calls / transfer-destination-request
 * envelopes onto one record. Does not invent a second Support bot.
 */
export function flattenVoiceSupportBody(raw: Record<string, unknown>): Record<string, unknown> {
  const message = asObject(raw.message);
  const call = asObject(message.call || raw.call);
  const phoneNumber = asObject(call.phoneNumber || message.phoneNumber || raw.phoneNumber);
  const monitor = asObject(call.monitor);
  const listed = message.toolCallList || message.toolCalls || message.toolWithToolCallList || raw.toolCalls;
  const first = Array.isArray(listed) && listed[0] ? asObject(listed[0]) : {};
  const nested = asObject(first.toolCall);
  const fn = asObject(nested.function || first.function || message.functionCall || raw.functionCall);
  const params = {
    ...asArgs(fn.arguments || fn.parameters),
    ...asArgs(nested.parameters || nested.arguments || first.parameters || first.arguments),
  };
  const extractedName = firstNonEmpty([
    raw.tool,
    raw.name,
    raw.action,
    first.name,
    nested.name,
    fn.name,
    asObject(first.tool).name,
  ]);
  const inbound = firstNonEmpty([
    raw.inbound_number,
    raw.called_number,
    phoneNumber.number,
    typeof call.phoneNumber === "string" ? call.phoneNumber : "",
  ]);
  const type = firstNonEmpty([message.type, raw.type]);
  return {
    ...params,
    ...raw,
    tool: raw.tool || extractedName || (type === "transfer-destination-request" ? "transfer_to_human" : ""),
    inbound_number: inbound,
    tool_call_id: firstNonEmpty([nested.id, nested.toolCallId, first.id, first.toolCallId, fn.id]),
    vapi_message_type: type,
    control_url: firstNonEmpty([monitor.controlUrl, asObject(raw.monitor).controlUrl]),
  };
}

const VAPI_TOOL_TYPES = ["tool-calls", "function-call", "function.call", "tool_calls"];

export function isIgnorableVoiceEvent(raw: Record<string, unknown>) {
  const type = firstNonEmpty([asObject(raw.message).type, raw.type]).toLowerCase();
  if (!type) return false;
  if (type === "transfer-destination-request") return false;
  if (VAPI_TOOL_TYPES.includes(type)) return false;
  return true;
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
  const fromQuery = canonicalVoiceTool(asTrimmed(queryTool, 64));
  if (fromQuery) return fromQuery;
  if (!raw || typeof raw !== "object") return "";
  const record = raw as { tool?: unknown; name?: unknown; action?: unknown };
  return canonicalVoiceTool(asTrimmed(record.tool ?? record.name ?? record.action, 64));
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
  transfer_to_human: {
    name: "transfer_to_human",
    description:
      "Warm transfer this Bandham Support call to a person when the caller asks for Sai, a person, or the founder, or they want further human help and are not satisfied with the bot. Do not use for ordinary product questions the bot can answer. Never say the destination number. Caller ID stays the Bandham Support number they called. If the person does not pick up, stay on Support.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Short reason, such as asked for Sai or wants a person.",
        },
      },
    },
  },
} as const;

export const SUPPORT_SQL_FILE = "supabase/support_tickets.sql";
export const SUPPORT_TICKETS_TABLE = "support_tickets";
export const SUPPORT_TICKETS_PATH = "/api/support/tickets";
export const PROPOSE_SUPPORT_TICKET_TOOL = "propose_support_ticket";

export const SUPPORT_INBOX_EMAIL_DEFAULT = "sachin.aravapallisiva@gmail.com";
const RESEND_TEST_HOST = ["resend", "dev"].join(".");
export const SUPPORT_FROM_EMAIL_DEFAULT = "Bandham AI <onboarding@" + RESEND_TEST_HOST + ">";

export const SUPPORT_CATEGORIES = ["bug", "billing", "account", "other"] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export type SupportTicketDraft = {
  category: SupportCategory;
  subject: string;
  body: string;
};

export const SUPPORT_DISCLAIMER =
  "Tickets are for app issues, not emergencies. If someone is harassing you, use Block or Report on their profile.";

export const TICKET_CONFIRM_HINT =
  "Confirm below and I will file it. " + SUPPORT_DISCLAIMER;

export function tableMissingHint() {
  return "Support ticket storage is not applied yet. Run " + SUPPORT_SQL_FILE + " in the Supabase SQL editor.";
}

export function isSupportCategory(value: string): value is SupportCategory {
  return SUPPORT_CATEGORIES.some(function (item) {
    return item === value;
  });
}

export function asTrimmed(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function normalizeTicketDraft(raw: {
  category?: unknown;
  subject?: unknown;
  body?: unknown;
} | null | undefined): SupportTicketDraft | null {
  if (!raw) return null;
  const categoryRaw = asTrimmed(raw.category, 32).toLowerCase();
  const category = isSupportCategory(categoryRaw) ? categoryRaw : "other";
  const subject = asTrimmed(raw.subject, 160);
  const body = asTrimmed(raw.body, 4000);
  if (subject.length < 4 || body.length < 8) return null;
  return { category, subject, body };
}

export function inferSupportCategory(text: string): SupportCategory {
  const lower = text.toLowerCase();
  if (
    /\b(bill|billing|stripe|charged|charge|refund|subscription|payment|paywall)\b/.test(lower) ||
    /\$9\.99|\$4\.99/.test(lower)
  ) {
    return "billing";
  }
  if (/\b(account|login|sign ?in|password|email|deleted|locked|hacked)\b/.test(lower)) {
    return "account";
  }
  if (/\b(bug|crash|broken|error|glitch|freeze|stuck|not work)/.test(lower)) {
    return "bug";
  }
  return "other";
}

/** Harassment / a person report belongs on Block and Report, not this queue. */
export function looksLikeSafetyRedirect(text: string) {
  const lower = text.toLowerCase();
  return (
    /\breport (this |that )?(person|profile|him|her|them|user|match)\b/.test(lower) ||
    /\b(harass|threat|stalk|under ?18|dowry|won't stop|will not stop)\b/.test(lower) ||
    /\bblock (this |that )?(person|profile|him|her|them)\b/.test(lower)
  );
}

/** Clear ask to file an app issue. Do not treat ordinary coaching as a ticket. */
export function looksLikeSupportIntent(text: string) {
  if (!text || looksLikeSafetyRedirect(text)) return false;
  const lower = text.toLowerCase();
  if (/\bsend a feature idea\b/.test(lower) || /\b(feature idea|product idea)\b/.test(lower)) {
    return false;
  }
  const wantsTicket =
    /\b(open|file|create|submit|raise|start)\b.{0,32}\b(ticket|support ticket)\b/.test(lower) ||
    /\b(ticket|support ticket)\b.{0,24}\b(open|file|create|submit)\b/.test(lower) ||
    /\breport (a |an |the )?(bug|issue|problem|glitch)\b/.test(lower) ||
    /\b(app|site|page|billing|account|login|photo|chat|search)\b.{0,28}\b(bug|broken|crash|error|issue|problem)\b/.test(lower) ||
    /\b(billing|subscription|refund|charged|payment|paywall)\b.{0,24}\b(issue|problem|error|wrong|fail)\b/.test(lower) ||
    /\b(account).{0,24}\b(issue|problem|locked|hacked|deleted|can't (log|sign)|cannot (log|sign))\b/.test(lower);
  return wantsTicket;
}

function ticketSubstance(text: string) {
  return text
    .replace(/\b(please|want to|i|i'd|id|like to|can you|could you|help me|open|file|create|submit|raise|start|a|an|the|support|ticket|about)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Only propose a draft when the member already gave a short summary. */
export function supportFallbackDraft(text: string): SupportTicketDraft | null {
  if (!looksLikeSupportIntent(text)) return null;
  const substance = ticketSubstance(text);
  if (substance.length < 12) return null;
  const subject = asTrimmed(text.replace(/\s+/g, " "), 80);
  return normalizeTicketDraft({
    category: inferSupportCategory(text),
    subject: subject.length >= 4 ? subject : substance.slice(0, 80),
    body: asTrimmed(text, 4000),
  });
}

function toolName(raw: unknown) {
  if (!raw || typeof raw !== "object") return "";
  const record = raw as { function?: { name?: unknown }; name?: unknown };
  if (typeof record.function?.name === "string") return record.function.name;
  if (typeof record.name === "string") return record.name;
  return "";
}

function toolArguments(raw: unknown) {
  if (!raw || typeof raw !== "object") return "";
  const record = raw as { function?: { arguments?: unknown }; arguments?: unknown };
  const value = record.function?.arguments ?? record.arguments;
  return typeof value === "string" ? value : "";
}

export function extractProposeTicketDraft(payload: unknown): SupportTicketDraft | null {
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as { choices?: Array<{ message?: { tool_calls?: unknown } }> })
    .choices?.[0]?.message;
  const calls = message?.tool_calls;
  if (!Array.isArray(calls)) return null;
  for (const call of calls) {
    if (toolName(call) !== PROPOSE_SUPPORT_TICKET_TOOL) continue;
    try {
      const parsed = JSON.parse(toolArguments(call) || "{}");
      const draft = normalizeTicketDraft(parsed);
      if (draft) return draft;
    } catch {
      continue;
    }
  }
  return null;
}

export function replyClaimsTicketCreated(text: string) {
  const lower = text.toLowerCase();
  return (
    /\bticket id\b/.test(lower) ||
    /\bfiled (the |a )?ticket\b/.test(lower) ||
    /\bticket (was |is )?(created|opened|filed)\b/.test(lower) ||
    /#\s*[0-9a-f]{8}/i.test(text)
  );
}

export function ticketConfirmCopy(draft: SupportTicketDraft) {
  return (
    "I can open an app issue ticket. Category: " +
    draft.category +
    ". Summary: " +
    draft.subject +
    ". " +
    TICKET_CONFIRM_HINT
  );
}

export function ticketCreatedCopy(id: string) {
  return (
    "Ticket saved. Reference: " +
    id +
    ". We will look into it. " +
    SUPPORT_DISCLAIMER
  );
}

export function supportInboxEmail() {
  return (process.env.SUPPORT_INBOX_EMAIL || SUPPORT_INBOX_EMAIL_DEFAULT).trim();
}

export function supportFromEmail() {
  return (process.env.RESEND_FROM_EMAIL || SUPPORT_FROM_EMAIL_DEFAULT).trim();
}

export const PROPOSE_SUPPORT_TICKET_TOOL_SPEC = {
  type: "function" as const,
  function: {
    name: PROPOSE_SUPPORT_TICKET_TOOL,
    description:
      "Propose an in-app support ticket for a confirmed app issue (bug, billing, account, or other). The app asks the member to confirm. Never claim the ticket was created. Never use this for harassment, a person report, profile search, or dating messages.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: SUPPORT_CATEGORIES,
        },
        subject: {
          type: "string",
          description: "Short title, 4 to 160 characters.",
        },
        body: {
          type: "string",
          description: "Short summary of the app issue, 8 to 4000 characters.",
        },
      },
      required: ["category", "subject", "body"],
    },
  },
};

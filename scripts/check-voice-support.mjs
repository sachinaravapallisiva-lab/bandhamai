import { readFileSync } from "node:fs";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_INBOX_EMAIL_DEFAULT,
  SUPPORT_SQL_FILE,
  SUPPORT_TICKETS_PATH,
  SUPPORT_TICKETS_TABLE,
  looksLikeSafetyRedirect,
  looksLikeSupportIntent,
  normalizeTicketDraft,
} from "../lib/support.ts";
import {
  VOICE_RESOLVED_STATUS,
  VOICE_SPOKEN_INCLUDED_WHEN_ASKED,
  VOICE_SPOKEN_INTRO,
  VOICE_SPOKEN_NOT_FOUND,
  VOICE_SPOKEN_PRICES,
  VOICE_SPOKEN_REFUND,
  VOICE_SPOKEN_SAFETY,
  VOICE_SUPPORT_PATH,
  VOICE_SUPPORT_PROMPT_FILE,
  VOICE_SUPPORT_SECRET_ENV,
  VOICE_SUPPORT_SECRET_HEADER,
  VOICE_SUPPORT_SQL_FILE,
  VOICE_SUPPORT_TOOLS,
  VOICE_TICKET_SOURCE,
  authorizeVoiceSupport,
  callerMissing,
  firstNameOnly,
  isVoiceSupportTool,
  normalizeVoiceEmail,
  normalizeVoicePhone,
  phonesMatch,
  publicVoiceTicket,
  readVoiceCaller,
  readVoiceTool,
  spokenTicketCreated,
  spokenTicketRef,
  spokenTicketResolved,
  spokenTicketStatus,
  ticketBelongsToCaller,
} from "../lib/voice-support.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function spokenLines(text) {
  return text
    .split(/\n/)
    .filter(function (line) {
      return /^Say this:/i.test(line.trim()) || line.startsWith("Hi, this is Bandham Support");
    });
}

assert(VOICE_SUPPORT_PATH === "/api/voice/support", "voice API path");
assert(VOICE_SUPPORT_SQL_FILE === "supabase/voice_support.sql", "voice SQL file");
assert(VOICE_SUPPORT_PROMPT_FILE === "docs/voice-support-prompt.md", "prompt file");
assert(VOICE_SUPPORT_SECRET_ENV === "BANDHAM_VOICE_SUPPORT_SECRET", "secret env name");
assert(VOICE_SUPPORT_SECRET_HEADER === "x-bandham-voice-support-secret", "secret header");
assert(VOICE_TICKET_SOURCE === "voice", "voice source");
assert(VOICE_RESOLVED_STATUS === "closed", "resolve maps to existing closed status");
assert(VOICE_SUPPORT_TOOLS.join(" ") === "identify_member create_ticket get_ticket resolve_ticket", "tool names");
assert(isVoiceSupportTool("identify_member"), "identify tool");
assert(!isVoiceSupportTool("propose_support_ticket"), "guru ticket tool is not a voice tool");
assert(SUPPORT_CATEGORIES.join(" ") === "bug billing account other", "reuse in-app categories");
assert(SUPPORT_TICKETS_TABLE === "support_tickets", "reuse support_tickets");
assert(SUPPORT_TICKETS_PATH === "/api/support/tickets", "in-app tickets path unchanged");
assert(SUPPORT_INBOX_EMAIL_DEFAULT === "sachin.aravapallisiva@gmail.com", "founder inbox lock");

assert(normalizeVoiceEmail(" Sai@Bandham.ai ") === "sai@bandham.ai", "email normalize");
assert(normalizeVoiceEmail("not-an-email") === "", "bad email rejected");
assert(normalizeVoicePhone("+1 (512) 555-0100") === "+15125550100", "phone keeps plus and digits");
assert(normalizeVoicePhone("512-555-0100") === "15125550100" || normalizeVoicePhone("512-555-0100") === "5125550100", "phone strips punctuation");
assert(phonesMatch("+1 512 555 0100", "5125550100"), "last 10 digits match");
assert(!phonesMatch("5125550100", "5125550199"), "different phones do not match");
assert(firstNameOnly("Sai Aravapalli") === "Sai", "first name only");
assert(firstNameOnly("Priya") === "Priya", "single name");
assert(readVoiceTool({ tool: "get_ticket" }) === "get_ticket", "tool from body");
assert(readVoiceTool({}, "create_ticket") === "create_ticket", "tool from query");
assert(readVoiceTool({ name: "identify_member" }) === "identify_member", "tool from name");
assert(readVoiceTool({ tool: "search_profiles" }) === "", "unknown tool rejected");
assert(callerMissing(readVoiceCaller({})) === true, "caller needs email or phone");
assert(callerMissing(readVoiceCaller({ email: "a@b.co" })) === false, "email is enough");

const ownTicket = {
  id: "11111111-2222-3333-4444-555555555555",
  user_id: "user-1",
  email: "sai@bandham.ai",
  caller_phone: "+15125550100",
  category: "billing",
  subject: "Charged twice",
  body: "Stripe billed messaging twice.",
  status: "open",
  source: "voice",
  created_at: "2026-08-24T00:00:00.000Z",
};
assert(
  ticketBelongsToCaller(ownTicket, { email: "sai@bandham.ai", phone: "" }, null) === true,
  "email owns ticket"
);
assert(
  ticketBelongsToCaller(ownTicket, { email: "", phone: "5125550100" }, null) === true,
  "phone owns ticket"
);
assert(
  ticketBelongsToCaller(ownTicket, { email: "other@bandham.ai", phone: "" }, null) === false,
  "other email does not own ticket"
);
assert(
  ticketBelongsToCaller(ownTicket, { email: "other@bandham.ai", phone: "" }, "user-1") === true,
  "matched member id owns ticket"
);
assert(publicVoiceTicket(ownTicket).body === undefined, "public ticket omits body");
assert(publicVoiceTicket(ownTicket).user_id === undefined, "public ticket omits user_id");
assert(publicVoiceTicket(ownTicket).email === undefined, "public ticket omits email");
assert(spokenTicketRef(ownTicket.id) === "11111111", "spoken ref drops hyphens");

const spoken = [
  VOICE_SPOKEN_INTRO,
  VOICE_SPOKEN_PRICES,
  VOICE_SPOKEN_INCLUDED_WHEN_ASKED,
  VOICE_SPOKEN_SAFETY,
  VOICE_SPOKEN_REFUND,
  VOICE_SPOKEN_NOT_FOUND,
  spokenTicketCreated("abc"),
  spokenTicketResolved("abc"),
  spokenTicketStatus({ ...ownTicket, status: "closed" }),
].join("\n");
assert(!/[—–]/.test(spoken), "spoken copy avoids em dashes");
assert(!/-/.test(spoken), "spoken copy avoids hyphens");
assert(!/STRIPE_EVENT_PRICE_ID|\$5\.99|\$19/.test(spoken), "no invented prices in spoken copy");
assert(VOICE_SPOKEN_PRICES.includes("Bandham AI subscription is 9.99 a month"), "product first spoken price");
assert(VOICE_SPOKEN_PRICES.includes("9.99 a month"), "subscription price spoken");
assert(!/^Messaging is /i.test(VOICE_SPOKEN_PRICES), "do not volunteer messaging as the default spoken line");
assert(VOICE_SPOKEN_INCLUDED_WHEN_ASKED.toLowerCase().includes("messaging"), "asked only include line");
assert(VOICE_SPOKEN_PRICES.includes("4.99 one time"), "VerifyAI price spoken");
assert(VOICE_SPOKEN_PRICES.toLowerCase().includes("feature demo"), "meetup is a demo");

assert(looksLikeSupportIntent("Open a ticket: billing charged me twice") === true, "support intent still works");
assert(looksLikeSafetyRedirect("Report this person for harassment") === true, "safety redirect unchanged");
assert(normalizeTicketDraft({ category: "billing", subject: "Charged twice", body: "Stripe billed me twice today." }), "draft helper reused");

const prev = process.env.BANDHAM_VOICE_SUPPORT_SECRET;
delete process.env.BANDHAM_VOICE_SUPPORT_SECRET;
assert(authorizeVoiceSupport(new Request("http://localhost/api/voice/support")).reason === "missing_secret", "fail closed without secret");
process.env.BANDHAM_VOICE_SUPPORT_SECRET = "test-voice-secret";
assert(
  authorizeVoiceSupport(
    new Request("http://localhost/api/voice/support", {
      headers: { "x-bandham-voice-support-secret": "nope" },
    })
  ).ok === false,
  "wrong secret is rejected"
);
assert(
  authorizeVoiceSupport(
    new Request("http://localhost/api/voice/support", {
      headers: { "x-bandham-voice-support-secret": "test-voice-secret" },
    })
  ).ok === true,
  "named header accepted"
);
assert(
  authorizeVoiceSupport(
    new Request("http://localhost/api/voice/support", {
      headers: { authorization: "Bearer test-voice-secret" },
    })
  ).ok === true,
  "bearer secret accepted"
);
if (prev === undefined) delete process.env.BANDHAM_VOICE_SUPPORT_SECRET;
else process.env.BANDHAM_VOICE_SUPPORT_SECRET = prev;

const sql = read(VOICE_SUPPORT_SQL_FILE);
assert(sql.includes("add column if not exists caller_phone"), "adds caller_phone");
assert(sql.includes("alter column user_id drop not null"), "user_id can be null for unidentified callers");
assert(sql.includes("'voice'"), "source allows voice");
assert(sql.includes("'assistant'") && sql.includes("'contact'"), "keeps existing sources");
assert(!/drop table/i.test(sql), "does not drop support_tickets");
assert(!/alter table public\.profiles/i.test(sql), "voice SQL does not change profiles");
assert(!/add column.*instagram|instagram_shares/i.test(sql), "voice SQL does not change Instagram");
assert(sql.toLowerCase().includes("after support_tickets.sql") || sql.includes(SUPPORT_SQL_FILE), "run after in-app SQL");

const route = read("app/api/voice/support/route.ts");
assert(route.includes("export async function POST"), "voice route is POST");
assert(route.includes("authorizeVoiceSupport"), "secret gate");
assert(route.includes("BANDHAM_VOICE_SUPPORT_SECRET"), "names the env");
assert(route.includes("getServiceSupabase"), "service role writes");
assert(route.includes("emailFounderTicket"), "emails the founder");
assert(route.includes("identify_member"), "identify tool");
assert(route.includes("create_ticket"), "create tool");
assert(route.includes("get_ticket"), "get tool");
assert(route.includes("resolve_ticket"), "resolve tool");
assert(!route.includes("getRequestUser"), "does not use member JWT");
assert(!route.includes("hasBearerToken"), "does not reuse the signed-in tickets gate");
assert(!route.includes("handleGuruChat") && !route.includes("GURU_SYSTEM_PROMPT"), "not the guru");
assert(!route.includes("/api/profiles/search") && !route.includes("profile-search"), "never searches profiles");
assert(!route.includes("refund") && !route.includes("stripe.refunds"), "no Stripe refunds");
assert(!route.includes("STRIPE_EVENT_PRICE_ID"), "no invented event Price");
assert(!route.includes("twilio"), "no Twilio UI clone");

const inApp = read("app/api/support/tickets/route.ts");
assert(inApp.includes("hasBearerToken"), "in-app tickets still require sign-in");
assert(inApp.includes('source: "assistant"'), "in-app tickets still source assistant");
assert(!inApp.includes("BANDHAM_VOICE_SUPPORT_SECRET"), "in-app route is not secret-gated");
assert(!inApp.includes("export async function GET"), "in-app route still has no public list");

const guru = read("lib/guru.ts");
assert(!guru.includes("VOICE_SUPPORT_PATH") && !guru.includes("/api/voice/support"), "guru does not call voice support");
assert(!guru.includes("identify_member"), "guru does not gain phone tools");
assert(guru.includes("propose_support_ticket"), "guru still proposes in-app drafts");
assert(guru.includes("never search") || guru.includes("You never search"), "guru still forbids search");
assert(guru.includes("sendable"), "guru still forbids sendable dating text");

const orb = read("app/components/VoiceAssistant.tsx");
assert(!orb.includes("/api/voice/support"), "in-app orb does not call the phone API");
assert(orb.includes("Open ticket"), "in-app confirm chip remains");

const email = read("lib/support-email.ts");
assert(email.includes("phone support call") || email.includes('source === "voice"'), "voice tickets change founder email lead");
assert(email.includes("A Bandham AI member confirmed an app issue ticket."), "in-app email lead unchanged");

const prompt = read(VOICE_SUPPORT_PROMPT_FILE);
VOICE_SUPPORT_TOOLS.forEach(function (tool) {
  assert(prompt.includes(tool), "prompt names " + tool);
});
assert(prompt.toLowerCase().includes("bandham support"), "prompt is Bandham Support");
assert(!/\blove guru\b/i.test(prompt), "prompt must not name the love guru");
assert(prompt.includes("BANDHAM_VOICE_SUPPORT_SECRET"), "prompt names the secret env");
assert(prompt.includes(VOICE_SUPPORT_PATH) || prompt.includes("/api/voice/support"), "prompt has the API path");
assert(prompt.includes("9.99 a month"), "prompt locks messaging price");
assert(prompt.includes("4.99 one time"), "prompt locks VerifyAI price");
assert(prompt.toLowerCase().includes("feature demo"), "prompt locks meetup as demo");
assert(!prompt.includes("STRIPE_EVENT_PRICE_ID="), "prompt does not invent an event Price id");
assert(prompt.toLowerCase().includes("block or report"), "prompt points harassment to Block/Report");
assert(prompt.toLowerCase().includes("local authorities"), "prompt points danger to authorities");
assert(prompt.toLowerCase().includes("cannot refund") || prompt.includes(VOICE_SPOKEN_REFUND), "prompt forbids refunds");
assert(prompt.toLowerCase().includes("never") && prompt.toLowerCase().includes("search"), "prompt forbids profile search");
assert(!/[—–]/.test(prompt), "prompt file avoids em dashes");

const sayBlocks = prompt.split("Say this:").slice(1).join("\n");
assert(sayBlocks.length > 40, "prompt has spoken examples");
assert(!/-/.test(sayBlocks.replace(/example\.com/g, "examplecom")), "spoken examples avoid hyphens");
assert(spokenLines(prompt).length >= 1 || sayBlocks.includes("Bandham Support"), "spoken examples exist");

const env = read(".env.example");
assert(env.includes("BANDHAM_VOICE_SUPPORT_SECRET="), "env example stubs the secret");
assert(!/BANDHAM_VOICE_SUPPORT_SECRET=\S+/.test(env), "do not invent a live secret");

const readme = read("README.md");
assert(readme.toLowerCase().includes("voice") || readme.includes("/api/voice/support"), "README notes phone voice support");
assert(readme.includes("BANDHAM_VOICE_SUPPORT_SECRET"), "README names the stub secret");

console.log("voice support ok", {
  path: VOICE_SUPPORT_PATH,
  tools: VOICE_SUPPORT_TOOLS,
  sql: VOICE_SUPPORT_SQL_FILE,
});

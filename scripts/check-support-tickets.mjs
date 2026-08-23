import { readFileSync } from "node:fs";
import {
  PROPOSE_SUPPORT_TICKET_TOOL,
  SUPPORT_CATEGORIES,
  SUPPORT_DISCLAIMER,
  SUPPORT_FROM_EMAIL_DEFAULT,
  SUPPORT_INBOX_EMAIL_DEFAULT,
  SUPPORT_SQL_FILE,
  SUPPORT_TICKETS_PATH,
  SUPPORT_TICKETS_TABLE,
  extractProposeTicketDraft,
  inferSupportCategory,
  looksLikeSafetyRedirect,
  looksLikeSupportIntent,
  normalizeTicketDraft,
  replyClaimsTicketCreated,
  supportFallbackDraft,
  ticketConfirmCopy,
  ticketCreatedCopy,
} from "../lib/support.ts";
import { GURU_INTRO, GURU_STARTERS, GURU_SUPPORT_NOTE } from "../lib/surfaces.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

assert(SUPPORT_TICKETS_TABLE === "support_tickets", "table name lock");
assert(SUPPORT_SQL_FILE === "supabase/support_tickets.sql", "SQL file lock");
assert(SUPPORT_TICKETS_PATH === "/api/support/tickets", "tickets API path");
assert(PROPOSE_SUPPORT_TICKET_TOOL === "propose_support_ticket", "tool name lock");
assert(SUPPORT_INBOX_EMAIL_DEFAULT === "sachin.aravapallisiva@gmail.com", "founder inbox lock");
assert(SUPPORT_CATEGORIES.join(" ") === "bug billing account other", "categories lock");
assert(SUPPORT_FROM_EMAIL_DEFAULT.toLowerCase().includes("onboarding@"), "Resend test from-address");
assert(SUPPORT_FROM_EMAIL_DEFAULT.toLowerCase().includes(["resend", "dev"].join(".")), "Resend test host");

assert(isSupportIntentTrue("I want to open a support ticket about billing charging twice"));
assert(looksLikeSupportIntent("The browse search is broken when I type Hyderabad") === true, "broken search is support");
assert(looksLikeSupportIntent("Help me word my profile About section") === false, "coaching is not a ticket");
assert(looksLikeSupportIntent("Find me a doctor in Dallas") === false, "person search is not a ticket");
assert(looksLikeSupportIntent("How do I talk to her in chat?") === false, "chat-script ask is not a ticket");
assert(looksLikeSafetyRedirect("Report this person for harassment") === true, "person report is safety");
assert(looksLikeSupportIntent("Report this person for harassment") === false, "person report is not a ticket");
assert(inferSupportCategory("charged twice on the $9.99 plan") === "billing", "billing category");
assert(inferSupportCategory("I cannot sign in to my account") === "account", "account category");
assert(inferSupportCategory("the photo upload crashes") === "bug", "bug category");

assert(supportFallbackDraft("I want to open a ticket") === null, "no draft without a summary");
assert(!!supportFallbackDraft("Open a ticket: billing charged me twice this morning"), "draft when summary is present");
assert(normalizeTicketDraft({ category: "billing", subject: "Charged twice", body: "Stripe billed me twice today." }), "normalize accepts a real draft");
assert(normalizeTicketDraft({ category: "nope", subject: "x", body: "short" }) === null, "too-short draft is rejected");

const toolPayload = {
  choices: [
    {
      message: {
        content: null,
        tool_calls: [
          {
            type: "function",
            function: {
              name: "propose_support_ticket",
              arguments: JSON.stringify({
                category: "bug",
                subject: "Search box errors",
                body: "Typed Hyderabad and the cards never load.",
              }),
            },
          },
        ],
      },
    },
  ],
};
const extracted = extractProposeTicketDraft(toolPayload);
assert(extracted && extracted.category === "bug", "tool call becomes a draft");
assert(replyClaimsTicketCreated("Ticket id abc was created") === true, "detects a fake created claim");
assert(replyClaimsTicketCreated("I can open an app issue ticket") === false, "confirm copy is not a created claim");
assert(ticketConfirmCopy(extracted).includes("Confirm below"), "confirm copy asks first");
assert(ticketCreatedCopy("11111111-2222").includes("11111111-2222"), "created copy shows the id");
assert(ticketCreatedCopy("11111111-2222").includes("not emergencies"), "created copy keeps the disclaimer");

assert(GURU_INTRO.toLowerCase().includes("ticket"), "intro mentions tickets");
assert(GURU_SUPPORT_NOTE.toLowerCase().includes("not emergencies"), "disclaimer names emergencies");
assert(GURU_SUPPORT_NOTE.toLowerCase().includes("block"), "disclaimer points at Block");
assert(GURU_SUPPORT_NOTE.toLowerCase().includes("report"), "disclaimer points at Report");
assert(SUPPORT_DISCLAIMER === GURU_SUPPORT_NOTE, "shared disclaimer lock");
assert(GURU_STARTERS.some(function (row) { return row.id === "ticket"; }), "Open a ticket starter exists");

const userFacing = [
  GURU_INTRO,
  GURU_SUPPORT_NOTE,
  ticketConfirmCopy(extracted),
  ticketCreatedCopy("abc"),
].join("\n");
assert(!/[—–]/.test(userFacing), "new support copy avoids em dashes");
assert(!/verifyai score|match %|most people/i.test(userFacing), "no fake VerifyAI or marketing");

const sql = read("supabase/support_tickets.sql");
assert(sql.includes("create table if not exists public.support_tickets"), "creates support_tickets");
assert(sql.includes("user_id"), "user_id column");
assert(sql.includes("email"), "email column");
assert(sql.includes("category"), "category column");
assert(sql.includes("subject"), "subject column");
assert(sql.includes("body"), "body column");
assert(sql.includes("default 'open'"), "status defaults open");
assert(sql.includes("default 'assistant'"), "source defaults assistant");
assert(sql.includes("created_at"), "created_at column");
assert(sql.includes("enable row level security"), "RLS on");
assert(sql.includes("support_tickets_select_own"), "select own");
assert(sql.includes("support_tickets_insert_own"), "insert own");
assert(sql.includes("revoke all on public.support_tickets from public, anon"), "no public/anon grants");
assert(!sql.includes("for update"), "members cannot update tickets");
assert(!sql.includes("for delete"), "members cannot delete tickets");
assert(!/alter table public\.profiles|add column.*instagram|share_instagram/i.test(sql), "support SQL does not change Instagram");

const api = read("app/api/support/tickets/route.ts");
assert(api.includes("export async function POST"), "tickets route is POST");
assert(api.includes("hasBearerToken"), "tickets require auth");
assert(api.includes("emailFounderTicket"), "tickets email the founder");
assert(api.includes("RESEND") || read("lib/support-email.ts").includes("api.resend.com"), "email uses Resend");
assert(api.includes("table_missing") || api.includes("SUPPORT_SQL_FILE"), "asks Sai to run SQL");
assert(!api.includes("export async function GET"), "no public ticket list in this pass");

const email = read("lib/support-email.ts");
assert(email.includes("RESEND_API_KEY"), "Resend key env");
assert(email.includes("SUPPORT_INBOX_EMAIL") || email.includes("supportInboxEmail"), "inbox env");
assert(email.includes("console.error"), "email failures are logged");
assert(email.includes("sent: false"), "email fail soft");
assert(!email.includes("nodemailer"), "no nodemailer path");

const guru = read("lib/guru.ts");
assert(guru.includes("propose_support_ticket"), "guru tool is wired");
assert(guru.includes("ticket_draft"), "guru returns a draft");
assert(!guru.includes('.from("support_tickets")'), "guru does not insert tickets");
assert(!guru.includes("emailFounderTicket"), "guru does not send founder email");
assert(guru.includes("Block or Report"), "prompt points harassment to Block/Report");
assert(guru.includes("sendable"), "prompt still forbids sendable dating text");
assert(guru.includes("never search") || guru.includes("You never search"), "prompt still forbids search");

const orb = read("app/components/VoiceAssistant.tsx");
assert(orb.includes("SUPPORT_TICKETS_PATH") || orb.includes("/api/support/tickets"), "orb posts tickets only on confirm");
assert(orb.includes("Open ticket"), "confirm chip label");
assert(orb.includes("Not now"), "member can dismiss the draft");
assert(orb.includes("GURU_SUPPORT_NOTE"), "orb shows the disclaimer");
assert(!orb.includes("/api/profiles/search"), "orb still never searches profiles");

const env = read(".env.example");
assert(env.includes("RESEND_API_KEY"), "env example lists RESEND_API_KEY");
assert(env.includes("SUPPORT_INBOX_EMAIL"), "env example lists SUPPORT_INBOX_EMAIL");

const instagram = read("supabase/instagram.sql");
assert(instagram.includes("add column if not exists instagram"), "Instagram SQL left in place");

function isSupportIntentTrue(text) {
  assert(looksLikeSupportIntent(text) === true, "expected support intent: " + text);
  return true;
}

console.log("support tickets ok", {
  table: SUPPORT_TICKETS_TABLE,
  path: SUPPORT_TICKETS_PATH,
  inbox: SUPPORT_INBOX_EMAIL_DEFAULT,
});

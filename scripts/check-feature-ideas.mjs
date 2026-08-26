import { readFileSync } from "node:fs";
import {
  ACCOUNT_MENU_ITEMS,
} from "../lib/account-menu.ts";
import {
  FEATURE_IDEA_API_PATH,
  FEATURE_IDEA_BODY,
  FEATURE_IDEA_CATEGORY,
  FEATURE_IDEA_CONFIRM,
  FEATURE_IDEA_FIELD_LABEL,
  FEATURE_IDEA_KICKER,
  FEATURE_IDEA_LABEL,
  FEATURE_IDEA_PATH,
  FEATURE_IDEA_PLACEHOLDER,
  FEATURE_IDEA_SAFETY,
  FEATURE_IDEA_SIGN_IN,
  FEATURE_IDEA_SOURCE,
  FEATURE_IDEA_SQL_FILE,
  FEATURE_IDEA_SUBMIT,
  FEATURE_IDEA_TOO_SHORT,
  deriveIdeaSubject,
  looksLikeFeatureIdeaIntent,
  normalizeIdeaDraft,
} from "../lib/feature-idea.ts";
import { ALLOWED_NEXT_PATHS } from "../lib/next-path.ts";
import { FOOTER_LINKS } from "../lib/site.ts";
import { GURU_INTRO, GURU_STARTERS } from "../lib/surfaces.ts";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_INBOX_EMAIL_DEFAULT,
  SUPPORT_TICKETS_PATH,
  SUPPORT_TICKETS_TABLE,
  looksLikeSupportIntent,
  normalizeTicketDraft,
} from "../lib/support.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

assert(FEATURE_IDEA_LABEL === "Send a feature idea", "label lock");
assert(FEATURE_IDEA_CONFIRM === "We got your idea. Thank you.", "confirm lock");
assert(FEATURE_IDEA_CATEGORY === "idea", "category lock");
assert(FEATURE_IDEA_SOURCE === "idea", "source lock");
assert(FEATURE_IDEA_PATH === "/idea", "page path");
assert(FEATURE_IDEA_API_PATH === "/api/support/ideas", "ideas API path");
assert(FEATURE_IDEA_SQL_FILE === "supabase/feature_ideas.sql", "SQL file lock");
assert(FEATURE_IDEA_SUBMIT === "Send a feature idea", "submit uses the same label");
assert(SUPPORT_TICKETS_TABLE === "support_tickets", "reuse support_tickets");
assert(SUPPORT_TICKETS_PATH === "/api/support/tickets", "tickets path unchanged");
assert(SUPPORT_CATEGORIES.join(" ") === "bug billing account other", "assistant categories stay issue only");
assert(SUPPORT_INBOX_EMAIL_DEFAULT === "sachin.aravapallisiva@gmail.com", "founder inbox lock");
assert(ALLOWED_NEXT_PATHS.includes(FEATURE_IDEA_PATH), "login next allows the idea page");

assert(normalizeIdeaDraft({ body: "Add a quiet way to hide a city." })?.category === "idea", "normalize sets idea");
assert(normalizeIdeaDraft({ idea: "Add a quiet way to hide a city." })?.subject === "Add a quiet way to hide a city.", "idea field is accepted");
assert(normalizeIdeaDraft({ body: "short" }) === null, "too short idea is rejected");
assert(deriveIdeaSubject("  Add filters for diet and city. More later.  ") === "Add filters for diet and city. More later.", "subject is derived");
assert(normalizeTicketDraft({ category: "idea", subject: "Add filters", body: "I want city filters on Browse." })?.category === "other", "guru draft helper does not accept idea");

assert(looksLikeFeatureIdeaIntent("I want to send a feature idea about search") === true, "feature idea intent");
assert(looksLikeFeatureIdeaIntent("Help me word my profile About section") === false, "coaching is not an idea");
assert(looksLikeSupportIntent("I want to send a feature idea about search") === false, "ideas are not app issue tickets");
assert(looksLikeSupportIntent("Open a ticket: billing charged me twice this morning") === true, "tickets still work");

const userFacing = [
  FEATURE_IDEA_LABEL,
  FEATURE_IDEA_CONFIRM,
  FEATURE_IDEA_BODY,
  FEATURE_IDEA_SIGN_IN,
  FEATURE_IDEA_SUBMIT,
  FEATURE_IDEA_FIELD_LABEL,
  FEATURE_IDEA_PLACEHOLDER,
  FEATURE_IDEA_TOO_SHORT,
  FEATURE_IDEA_SAFETY,
  FEATURE_IDEA_KICKER,
  GURU_INTRO,
].join("\n");
assert(!/[—–]/.test(userFacing), "idea copy avoids em dashes and en dashes");
assert(!/-/.test(userFacing), "idea copy avoids hyphens");
assert(!/Bandhamai|bandhamAI|\bBandhan\b/.test(userFacing), "product name is Bandham AI");
assert(userFacing.includes("Bandham AI"), "copy names Bandham AI");
assert(!/feedback|suggestion box|request a feature/i.test(userFacing), "label is Send a feature idea");
assert(!/love your idea|so excited|game changer/i.test(userFacing), "no marketing fluff");

assert(FOOTER_LINKS.some(function (item) {
  return item.label === FEATURE_IDEA_LABEL && item.href === FEATURE_IDEA_PATH;
}), "footer shows Send a feature idea");
assert(ACCOUNT_MENU_ITEMS.some(function (item) {
  return item.id === "idea" && item.label === FEATURE_IDEA_LABEL && item.href === FEATURE_IDEA_PATH;
}), "account menu shows Send a feature idea");

const sql = read(FEATURE_IDEA_SQL_FILE);
assert(sql.includes("support_tickets_category_check"), "updates category check");
assert(sql.includes("'idea'"), "allows idea");
assert(sql.includes("bug") && sql.includes("billing") && sql.includes("account") && sql.includes("other"), "keeps issue categories");
assert(sql.includes("'assistant'") && sql.includes("'contact'") && sql.includes("'voice'"), "keeps existing sources");
assert(!/drop table/i.test(sql), "does not drop support_tickets");
assert(!/create table/i.test(sql), "does not invent a second table");
assert(!/alter table public\.(saves|interests|searches|signals|feedback|photo_grants)/i.test(sql), "does not touch the 6 old tables");
assert(!/create policy/i.test(sql), "does not loosen RLS");
assert(sql.toLowerCase().includes("public.feedback"), "warns not to use feedback");
assert(sql.toLowerCase().includes("after support_tickets.sql"), "run after in-app SQL");

const api = read("app/api/support/ideas/route.ts");
assert(api.includes("export async function POST"), "ideas route is POST");
assert(api.includes("hasBearerToken"), "ideas require auth");
assert(api.includes("emailFounderTicket"), "ideas email the founder");
assert(api.includes("SUPPORT_TICKETS_TABLE") || api.includes("support_tickets"), "writes support_tickets");
assert(api.includes("FEATURE_IDEA_SOURCE") || api.includes('"idea"'), "source is idea");
assert(api.includes("FEATURE_IDEA_CONFIRM"), "confirm copy is returned");
assert(!api.includes("export async function GET"), "no public idea list");
assert(!api.includes('.from("feedback")'), "does not write swipe feedback");

const tickets = read("app/api/support/tickets/route.ts");
assert(tickets.includes('source: "assistant"'), "in-app tickets still source assistant");
assert(!tickets.includes("FEATURE_IDEA"), "tickets route stays the issue path");

const email = read("lib/support-email.ts");
assert(email.includes("A Bandham AI member sent a feature idea."), "idea email lead");
assert(email.includes("A Bandham AI member confirmed an app issue ticket."), "in-app email lead unchanged");
assert(email.includes("emailFounderTicket"), "same helper");
assert(email.includes('SupportCategory | "idea"') || email.includes("category: SupportCategory | \"idea\""), "email helper accepts idea category");

const form = read("app/components/FeatureIdeaForm.tsx");
assert(form.includes("FEATURE_IDEA_CONFIRM") || form.includes(FEATURE_IDEA_CONFIRM), "form shows confirm copy");
assert(form.includes("FEATURE_IDEA_API_PATH") || form.includes("/api/support/ideas"), "form posts ideas API");
assert(!form.includes('name="subject"') && !form.includes("setSubject"), "no extra subject field");
assert(!form.includes("type=\"email\""), "no extra email field");

const page = read("app/idea/page.tsx");
assert(page.includes("FEATURE_IDEA_LABEL") || page.includes(FEATURE_IDEA_LABEL), "page title is Send a feature idea");
assert(page.includes("FeatureIdeaForm"), "page hosts the short form");
assert(page.includes("AppChrome"), "page uses Soft Minimal chrome");

const footer = read("app/components/SiteFooter.tsx");
assert(footer.includes("FOOTER_LINKS"), "footer still maps shared links");

const drawer = read("app/components/AccountDrawer.tsx");
assert(drawer.includes('id === "idea"') || drawer.includes('"idea"'), "drawer has an idea icon");
assert(drawer.includes("CREAM") || drawer.includes("#FDF8F1"), "drawer stays cream");
assert(drawer.includes("VIOLET") || drawer.includes("#6D28D9"), "drawer stays violet");

const guru = read("lib/guru.ts");
assert(guru.includes("Send a feature idea"), "guru may point at Send a feature idea");
assert(guru.includes("looksLikeFeatureIdeaIntent"), "guru does not file an idea as a ticket");
assert(!guru.includes(FEATURE_IDEA_API_PATH), "guru is not a second idea form");
assert(!guru.includes('.from("support_tickets")'), "guru still does not write tickets");
assert(guru.includes("never search") || guru.includes("You never search"), "guru still forbids search");
assert(guru.includes("sendable"), "guru still forbids sendable dating text");

assert(GURU_INTRO.includes("Send a feature idea"), "intro can point at the form");
assert(!GURU_STARTERS.some(function (row) {
  return /feature idea/i.test(row.id + row.label + row.text);
}), "no guru starter that collects an idea");

const oldTables = ["saves.sql", "interests.sql", "searches.sql", "signals.sql", "feedback.sql", "photo_grants.sql"];
oldTables.forEach(function (name) {
  const matches = [
    "supabase/safety.sql",
    "supabase/support_tickets.sql",
    "supabase/voice_support.sql",
    FEATURE_IDEA_SQL_FILE,
  ];
  matches.forEach(function (file) {
    const src = read(file);
    assert(!src.includes("alter table public." + name.replace(".sql", "")), "idea SQL does not alter " + name);
  });
});

const ideaLib = read("lib/feature-idea.ts");
assert(!ideaLib.includes('.from("feedback")'), "idea lib does not use swipe feedback");
assert(!ideaLib.includes("browse_prompts"), "does not touch browse_prompts");

console.log("feature ideas ok", {
  label: FEATURE_IDEA_LABEL,
  category: FEATURE_IDEA_CATEGORY,
  path: FEATURE_IDEA_PATH,
  sql: FEATURE_IDEA_SQL_FILE,
});

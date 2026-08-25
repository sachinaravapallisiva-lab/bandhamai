import { readFileSync } from "node:fs";
import { isEntitledStatus } from "../lib/billing.ts";
import {
  SUBSCRIBE_CALL_CADENCE_DAYS,
  SUBSCRIBE_CALL_EXAMPLE_OPENING,
  SUBSCRIBE_CALL_EXAMPLE_OPENING_HI,
  SUBSCRIBE_CALL_EXAMPLE_OPENING_TE,
  SUBSCRIBE_CALL_HINT,
  SUBSCRIBE_CALL_LABEL,
  SUBSCRIBE_CALL_LANGUAGES,
  SUBSCRIBE_CALL_LAST_AT_COLUMN,
  SUBSCRIBE_CALL_NEED_PHONE,
  SUBSCRIBE_CALL_OPT_IN_COLUMN,
  SUBSCRIBE_CALL_PATH,
  SUBSCRIBE_CALL_PHONE_COLUMN,
  SUBSCRIBE_CALL_PHONE_HINT,
  SUBSCRIBE_CALL_PROMPT_FILE,
  SUBSCRIBE_CALL_SAVE_LABEL,
  SUBSCRIBE_CALL_SPOKEN_FREE,
  SUBSCRIBE_CALL_SPOKEN_PRICE,
  SUBSCRIBE_CALL_SPOKEN_STOP,
  SUBSCRIBE_CALL_SPOKEN_TAGLINE,
  SUBSCRIBE_CALL_SQL_FILE,
  calledWithinCadence,
  decideSubscribeCallEligibility,
  displayPhoneWithSpaces,
  isAdultMember,
  isDemoOrPreviewProfile,
  maskPhoneForList,
  normalizeSubscribePhone,
  parseCallSubscribeOptIn,
  publicEligibleMember,
} from "../lib/subscribe-call.ts";
import { VOICE_SUPPORT_SECRET_ENV, authorizeVoiceSupport } from "../lib/voice-support.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function assertEq(got, expected, label) {
  if (got !== expected) {
    throw new Error(label + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(got));
  }
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function noDashCopy(text, label) {
  assert(!/[—–]/.test(text), label + " has no em or en dash");
  assert(!text.includes("-"), label + " has no hyphen: " + text);
}

const ui = [
  SUBSCRIBE_CALL_LABEL,
  SUBSCRIBE_CALL_HINT,
  SUBSCRIBE_CALL_PHONE_HINT,
  SUBSCRIBE_CALL_SAVE_LABEL,
  SUBSCRIBE_CALL_NEED_PHONE,
  SUBSCRIBE_CALL_SPOKEN_PRICE,
  SUBSCRIBE_CALL_SPOKEN_TAGLINE,
  SUBSCRIBE_CALL_SPOKEN_FREE,
  SUBSCRIBE_CALL_SPOKEN_STOP,
  SUBSCRIBE_CALL_EXAMPLE_OPENING,
];
ui.forEach(function (text) {
  noDashCopy(text, text.slice(0, 24));
  assert(/Bandham AI/.test(text) || !/bandham/i.test(text), "Bandham AI two words or not named: " + text);
  assert(!/Paid|Upgrade/i.test(text), "no Paid or Upgrade in new copy: " + text);
});

assertEq(SUBSCRIBE_CALL_EXAMPLE_OPENING, "Hello, my name is Sai.", "English opening is Sai");
assertEq(SUBSCRIBE_CALL_EXAMPLE_OPENING_HI, "Hello, my name is Sai.", "Hindi intent opening is Sai");
assertEq(
  SUBSCRIBE_CALL_EXAMPLE_OPENING_TE,
  "హలో నా పేరు సాయ్ సచ్చన్. ఏం చేస్తున్నారు?",
  "Telugu opening is Sai's sample"
);
assertEq(SUBSCRIBE_CALL_LABEL, "Call me about Bandham AI", "toggle label");
assertEq(SUBSCRIBE_CALL_SQL_FILE, "supabase/subscribe_call_opt_in.sql", "sql file name");
assertEq(SUBSCRIBE_CALL_PROMPT_FILE, "docs/subscribe-call-prompt.md", "prompt file");
assertEq(SUBSCRIBE_CALL_PATH, "/api/voice/subscribe-reminders", "dry run path");
assertEq(SUBSCRIBE_CALL_CADENCE_DAYS, 15, "15 day cadence");
assertEq(SUBSCRIBE_CALL_PHONE_COLUMN, "phone", "phone column");
assertEq(SUBSCRIBE_CALL_OPT_IN_COLUMN, "call_subscribe_opt_in", "opt in column");
assertEq(SUBSCRIBE_CALL_LAST_AT_COLUMN, "last_subscribe_call_at", "last call column");
assertEq(VOICE_SUPPORT_SECRET_ENV, "BANDHAM_VOICE_SUPPORT_SECRET", "reuse support secret");

assertEq(parseCallSubscribeOptIn(undefined), false, "missing opt in is off");
assertEq(parseCallSubscribeOptIn(null), false, "null opt in is off");
assertEq(parseCallSubscribeOptIn(false), false, "false is off");
assertEq(parseCallSubscribeOptIn("false"), false, "string false is off");
assertEq(parseCallSubscribeOptIn(""), false, "empty is off");
assertEq(parseCallSubscribeOptIn(true), true, "true is on");
assertEq(parseCallSubscribeOptIn("yes"), true, "yes is on");

assertEq(normalizeSubscribePhone("+1 (512) 555-0100"), "+15125550100", "phone normalize");
assertEq(normalizeSubscribePhone("12"), "", "short phone fails closed");
assert(displayPhoneWithSpaces("+15125550100").includes(" "), "display uses spaces");
assert(!displayPhoneWithSpaces("+15125550100").includes("-"), "display has no hyphen");
assertEq(maskPhoneForList("+15125550100"), "saved ending 0100", "list masks phone");

const now = new Date("2026-08-24T12:00:00.000Z");
const base = {
  id: "p1",
  user_id: "u1",
  full_name: "Sai Aravapalli",
  phone: "+15125550100",
  call_subscribe_opt_in: true,
  last_subscribe_call_at: null,
  status: "live",
  dob: "1995-01-01",
};

assert(decideSubscribeCallEligibility(base, { entitled: false, now }).eligible, "happy path is eligible");
assert(
  !decideSubscribeCallEligibility({ ...base, phone: "" }, { entitled: false, now }).eligible,
  "missing phone fails closed"
);
assert(
  !decideSubscribeCallEligibility({ ...base, call_subscribe_opt_in: false }, { entitled: false, now }).eligible,
  "opt in off fails closed"
);
assert(
  !decideSubscribeCallEligibility(base, { entitled: true, now }).eligible,
  "Premium / entitled is never called"
);
assert(
  !decideSubscribeCallEligibility({ ...base, last_subscribe_call_at: "2026-08-20T12:00:00.000Z" }, { entitled: false, now })
    .eligible,
  "called inside 15 days is skipped"
);
assert(
  decideSubscribeCallEligibility({ ...base, last_subscribe_call_at: "2026-08-01T12:00:00.000Z" }, { entitled: false, now })
    .eligible,
  "called 23 days ago is eligible"
);
assert(
  !decideSubscribeCallEligibility({ ...base, dob: "2012-01-01" }, { entitled: false, now }).eligible,
  "under 18 fails closed"
);
assert(
  decideSubscribeCallEligibility({ ...base, dob: null }, { entitled: false, now }).eligible,
  "missing dob stays eligible after signup age lock"
);
assert(
  !decideSubscribeCallEligibility({ ...base, user_id: null, status: "preview" }, { entitled: false, now }).eligible,
  "layout preview is not called"
);
assert(isDemoOrPreviewProfile({ user_id: "", id: "x" }), "no user id is preview");
assert(isAdultMember("", now), "empty dob is adult via signup");
assert(!isAdultMember("2010-08-24", now), "stored child dob is not adult");
assert(isEntitledStatus("active") && isEntitledStatus("trialing"), "active and trialing are Premium");
assert(!isEntitledStatus("canceled"), "canceled is Regular");
assert(calledWithinCadence("2026-08-20T00:00:00.000Z", now), "within cadence");
assert(!calledWithinCadence("2026-07-01T00:00:00.000Z", now), "outside cadence");
assertEq(publicEligibleMember(base).phone_masked, "saved ending 0100", "public list hides full phone");
assert(!Object.prototype.hasOwnProperty.call(publicEligibleMember(base), "phone"), "public list has no phone key");

assert(SUBSCRIBE_CALL_LANGUAGES.includes("Telugu"), "Telugu");
assert(SUBSCRIBE_CALL_LANGUAGES.includes("Hindi"), "Hindi");
assert(SUBSCRIBE_CALL_LANGUAGES.includes("English"), "English");
assert(SUBSCRIBE_CALL_LANGUAGES.includes("Urdu"), "Urdu");
assert(SUBSCRIBE_CALL_LANGUAGES.includes("Assamese"), "Assamese");

const prev = process.env.BANDHAM_VOICE_SUPPORT_SECRET;
delete process.env.BANDHAM_VOICE_SUPPORT_SECRET;
assert(
  authorizeVoiceSupport(new Request("http://localhost" + SUBSCRIBE_CALL_PATH)).reason === "missing_secret",
  "fail closed without secret"
);
process.env.BANDHAM_VOICE_SUPPORT_SECRET = "test-voice-secret";
assert(
  authorizeVoiceSupport(
    new Request("http://localhost" + SUBSCRIBE_CALL_PATH, {
      headers: { "x-bandham-voice-support-secret": "test-voice-secret" },
    })
  ).ok === true,
  "same secret header works"
);
if (prev === undefined) delete process.env.BANDHAM_VOICE_SUPPORT_SECRET;
else process.env.BANDHAM_VOICE_SUPPORT_SECRET = prev;

const sql = read(SUBSCRIBE_CALL_SQL_FILE);
assert(sql.includes("add column if not exists phone"), "ensures phone");
assert(sql.includes("add column if not exists call_subscribe_opt_in"), "adds opt in");
assert(sql.includes("add column if not exists call_subscribe_opted_at"), "adds opted at");
assert(sql.includes("add column if not exists last_subscribe_call_at"), "adds last call at");
assert(/default false/i.test(sql), "opt in defaults off");
assert(!/default true/i.test(sql), "opt in must not default on");
assert(sql.toLowerCase().includes("revoke"), "revokes public phone reads");
assert(sql.includes("profiles_update_own_subscribe_call") || sql.includes("auth.uid()"), "own row update");
assert(!/drop table/i.test(sql), "does not drop profiles");
assert(!/twilio|vonage|telnyx|whatsapp/i.test(sql), "sql does not arm a dialer");
assert(!/enable row level security/i.test(sql), "does not flip profiles RLS on");

const route = read("app/api/voice/subscribe-reminders/route.ts");
assert(route.includes("export async function GET"), "dry run GET");
assert(route.includes("export async function POST"), "cron ready POST");
assert(route.includes("authorizeVoiceSupport"), "secret gate");
assert(route.includes("listEligibleSubscribeCalls"), "lists eligible");
assert(route.includes("dry_run: true"), "marks dry run");
assert(route.includes("dialed: false"), "never claims a dial");
assert(route.includes("This route does not place calls"), "rejects dial actions");
assert(!/twilio|vonage|telnyx|whatsapp/i.test(route), "no carrier or WhatsApp");
assert(!/\.update\(.*last_subscribe_call_at|last_subscribe_call_at\s*:/.test(route), "list does not stamp last call");
assert(route.includes("optOutSubscribeCall"), "stop can opt out");

const server = read("lib/subscribe-call-server.ts");
assert(server.includes("loadEntitledUserIds"), "loads Premium to exclude");
assert(server.includes("ENTITLED_STATUSES"), "uses active and trialing");
assert(!/twilio|dial|whatsapp/i.test(server), "server helper does not dial");

const profiles = read("app/api/profiles/route.ts");
assert(profiles.includes("SUBSCRIBE_CALL_OPT_IN_COLUMN") || profiles.includes("call_subscribe_opt_in"), "PATCH writes opt in");
assert(profiles.includes("normalizeSubscribePhone"), "PATCH normalizes phone");
assert(profiles.includes("SUBSCRIBE_CALL_NEED_PHONE"), "opt in without phone fails closed");
assert(!profiles.includes("last_subscribe_call_at ="), "members cannot write last call");

const account = read("app/account/page.tsx");
assert(account.includes("SubscribeCallField"), "account hosts the toggle");
assert(account.includes("call_subscribe_opt_in"), "account saves opt in");
assert(account.includes("SUBSCRIBE_CALL_NEED_PHONE"), "account fails closed without a phone");

const field = read("app/components/SubscribeCallField.tsx");
assert(field.includes('type="checkbox"') || field.includes("type=\"checkbox\""), "explicit tap");
assert(field.includes("displayPhoneWithSpaces"), "phone shown with spaces");
assert(field.includes("SUBSCRIBE_CALL_LABEL"), "uses locked label");
assert(field.includes("SUBSCRIBE_CALL_HINT"), "uses locked hint");

const prompt = read(SUBSCRIBE_CALL_PROMPT_FILE);
assert(!/[—–]/.test(prompt), "prompt avoids em dashes");
assert(prompt.toLowerCase().includes("conversational"), "prompt is conversational");
assert(prompt.toLowerCase().includes("not a robocall") || prompt.toLowerCase().includes("not ivr"), "not IVR");
assert(prompt.toLowerCase().includes("press 1") && prompt.toLowerCase().includes("never"), "forbids press 1");
assert(prompt.toLowerCase().includes("telugu") && prompt.toLowerCase().includes("hindi"), "Telugu and Hindi");
assert(prompt.toLowerCase().includes("mother tongue"), "can use mother tongue");
assert(prompt.toLowerCase().includes("english is first class"), "English is first class");
assert(prompt.toLowerCase().includes("never force english"), "never force English");
assert(prompt.includes("Hello, my name is Sai."), "Sai English opening");
assert(prompt.includes("హలో నా పేరు సాయ్ సచ్చన్"), "Sai Telugu opening");
assert(prompt.toLowerCase().includes("introduces itself as sai") || prompt.toLowerCase().includes("introduce yourself as sai"), "agent is Sai");
assert(!/voice clone is live|already sounds like/i.test(prompt) || prompt.toLowerCase().includes("do not claim"), "no live voice clone claim");
assert(prompt.toLowerCase().includes("vapi") && prompt.toLowerCase().includes("must not"), "no Vapi outbound");
assert(prompt.includes("Bandham AI subscription is 9.99 a month"), "price lock");
assert(prompt.toLowerCase().includes("regular") && prompt.toLowerCase().includes("premium"), "Regular vs Premium");
assert(prompt.toLowerCase().includes("guru never writes sendable"), "guru lock");
assert(prompt.toLowerCase().includes("opt them out") || prompt.includes("opt_out"), "stop opts out");
assert(prompt.toLowerCase().includes("whatsapp") && prompt.toLowerCase().includes("do not"), "no WhatsApp");
assert(prompt.toLowerCase().includes("bandham support"), "separate from support");
assert(!prompt.includes("803"), "does not publish inbound support number");
assert(prompt.includes("Find your vibe match?"), "tagline");
const sayBlocks = prompt
  .split("Say this:")
  .slice(1)
  .map(function (chunk) {
    return chunk.trim().split(/\n\s*\n/)[0] || "";
  })
  .join("\n");
assert(sayBlocks.length > 40, "has example openings");
assert(!/-/.test(sayBlocks.replace(/example\.com/g, "examplecom")), "spoken examples avoid hyphens");
assert(!/\bPaid\b|\bUpgrade\b/.test(sayBlocks), "spoken examples avoid Paid and Upgrade");
assert(!/9\.99 for messaging/i.test(sayBlocks), "spoken examples do not say 9.99 for messaging");

const browse = read("lib/profile-search.ts");
assert(!browse.includes('"phone"') && !browse.includes("'phone'"), "browse select never adds phone");

const search = read("app/api/profiles/search/route.ts");
assert(!/\bphone\b/.test(search), "browse API does not select phone");

const guru = read("lib/guru.ts");
assert(guru.includes("sendable"), "guru still forbids sendable dating text");
assert(guru.includes("never search") || guru.includes("You never search"), "guru still forbids search");
assert(!guru.includes(SUBSCRIBE_CALL_PATH), "guru does not list or dial reminders");

const support = read("app/api/voice/support/route.ts");
assert(support.includes("identify_member"), "inbound support tools stay");
assert(!support.includes("subscribe-reminders"), "support route is not the reminder list");

const instagram = read("app/components/InstagramField.tsx");
assert(instagram.includes("INSTAGRAM"), "Instagram field unchanged");

const checkout = read("app/api/stripe/checkout/route.ts");
assert(checkout.includes("stripePriceId") || checkout.includes("checkout.sessions"), "checkout unchanged");

const chat = read("app/page.tsx");
assert(chat.includes("layout preview") || chat.includes("Priya") || chat.includes("Chat"), "home chat surface left in place");

const env = read(".env.example");
assert(env.includes("BANDHAM_VOICE_SUPPORT_SECRET="), "reuses the stub secret");
assert(!/BANDHAM_VOICE_SUPPORT_SECRET=\S+/.test(env), "do not invent a live secret");

const readme = read("README.md");
assert(readme.includes("subscribe-reminders") || readme.includes("subscribe reminder"), "README notes the dry run");
assert(readme.includes(SUBSCRIBE_CALL_SQL_FILE), "README names the SQL file");

const pkg = read("package.json");
assert(pkg.includes("check:subscribe-call"), "npm script exists");

console.log("subscribe call opt-in ok", {
  path: SUBSCRIBE_CALL_PATH,
  sql: SUBSCRIBE_CALL_SQL_FILE,
  languages: SUBSCRIBE_CALL_LANGUAGES.length,
});

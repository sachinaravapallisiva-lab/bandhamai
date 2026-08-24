import { readFileSync } from "node:fs";
import { STRIPE_ENV_KEYS } from "../lib/billing.ts";
import {
  SPEED_MATCH_QUESTION_COUNT,
  SPEED_MATCH_QUESTIONS,
  SPEED_MATCH_SECONDS,
} from "../lib/speed-match.ts";
import {
  EVENT_TICKET_CHECKOUT_PATH,
  EVENT_TICKET_CONFIRM_PATH,
  EVENT_TICKET_PRICE_ENV,
  EVENT_TICKET_PURPOSE,
  EVENT_TICKETS_TABLE,
  GROUP_MESSAGES_TABLE,
  MEETUP_API_PATH,
  MEETUP_CHAT_PATH,
  MEETUP_COPY,
  MEETUP_MESSAGES_PATH,
  MEETUP_PATH,
  MEETUP_SHORTLIST_PATH,
  MEETUP_SHORTLIST_SIZE,
  MEETUP_SQL_FILE,
  MEETUPS_TABLE,
  RSVPS_TABLE,
  SEED_MEETUP_ID,
  SEED_MEETUP_MONTH_KEY,
  copyHasDash,
  currentMonthKey,
  fallbackMeetup,
  isEventTicketPrice,
  meetupCheckoutReturnUrls,
  meetupPartnerId,
  monthLabelFromKey,
} from "../lib/meetup.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

assert(MEETUP_PATH === "/meetup", "meetup path");
assert(MEETUP_CHAT_PATH === "/chat", "1:1 stays on existing chat");
assert(MEETUP_API_PATH === "/api/meetup", "meetup api");
assert(MEETUP_MESSAGES_PATH === "/api/meetup/messages", "group messages api");
assert(MEETUP_SHORTLIST_PATH === "/api/meetup/shortlist", "shortlist api");
assert(EVENT_TICKET_CHECKOUT_PATH === "/api/meetup/checkout", "event checkout path");
assert(EVENT_TICKET_CONFIRM_PATH === "/api/meetup/confirm", "event confirm path");
assert(MEETUPS_TABLE === "meetups", "meetups table name");
assert(RSVPS_TABLE === "rsvps", "rsvps table name");
assert(GROUP_MESSAGES_TABLE === "group_messages", "group_messages table name");
assert(EVENT_TICKETS_TABLE === "event_tickets", "event_tickets table name");
assert(MEETUP_SQL_FILE === "supabase/meetups.sql", "sql file lock");
assert(EVENT_TICKET_PRICE_ENV === "STRIPE_EVENT_PRICE_ID", "event price env");
assert(EVENT_TICKET_PURPOSE === "meetup_event", "checkout purpose");
assert(!STRIPE_ENV_KEYS.includes(EVENT_TICKET_PRICE_ENV), "do not require event Price for messaging");
assert(MEETUP_SHORTLIST_SIZE === 3, "keep 3 card shortlist spirit");
assert(SEED_MEETUP_MONTH_KEY === "2026-08", "August 2026 seed");
assert(SEED_MEETUP_ID.startsWith("a2026080"), "stable seed id");
assert(monthLabelFromKey("2026-08") === "August 2026", "month label");
assert(currentMonthKey(new Date("2026-08-24T12:00:00.000Z")) === "2026-08", "current month key");
assert(fallbackMeetup().title === MEETUP_COPY.title, "fallback uses locked title");
assert(meetupPartnerId("abc").startsWith("meetup:"), "speed match partner prefix");

const copyValues = Object.values(MEETUP_COPY);
copyValues.forEach(function (value) {
  assert(!copyHasDash(value), "meetup copy has no hyphen or dash: " + value);
  assert(!/Bandhan\b/.test(value), "Bandham AI not Bandhan");
});
assert(MEETUP_COPY.title === "Meetup this month", "title lock");
assert(MEETUP_COPY.ticketCta === "Get a ticket", "ticket CTA names no dollar amount");
assert(MEETUP_COPY.ticketNotConfigured.includes(EVENT_TICKET_PRICE_ENV), "fail closed copy names the env");
assert(MEETUP_COPY.ticketNotConfigured.toLowerCase().includes("not named"), "amount stays unnamed");
assert(MEETUP_COPY.ticketBody.includes("$9.99/mo"), "ticket copy contrasts messaging price");
assert(MEETUP_COPY.ticketBody.toLowerCase().includes("does not include"), "messaging does not include ticket");
assert(MEETUP_COPY.oneToOneNote.includes("$9.99/mo"), "1:1 stays messaging paywall");
assert(MEETUP_COPY.chatNeedRsvp.toLowerCase().includes("ticket"), "group chat after paid ticket");
assert(!/\$\d/.test(copyValues.join("\n").replace(/\$9\.99\/mo/g, "")), "do not invent a ticket dollar amount");
assert(!/price_[a-zA-Z0-9]+/.test(copyValues.join("\n")), "do not invent a live Price ID");

const dating = /\b(swipe|hot near you|hot-near-you|for you tonight|super[\s-]?like|boost now|vibe check|crush|hook-?up|drinks tonight)\b/i;
assert(!dating.test(copyValues.join("\n")), "no dating chrome in meetup copy");

assert(
  isEventTicketPrice({ type: "one_time", id: "price_event", recurring: null }, "price_msg", "price_verify"),
  "accept a one time event Price"
);
assert(
  isEventTicketPrice({ type: "one_time", id: "price_event", recurring: null, unit_amount: 1234 }, "price_msg", "price_verify"),
  "do not lock a dollar amount on the event Price"
);
assert(
  !isEventTicketPrice({ type: "recurring", id: "price_event", recurring: { interval: "month" } }, "price_msg", "price_verify"),
  "reject a subscription Price"
);
assert(
  !isEventTicketPrice({ type: "one_time", id: "price_msg", recurring: null }, "price_msg", "price_verify"),
  "reject the messaging Price"
);
assert(
  !isEventTicketPrice({ type: "one_time", id: "price_verify", recurring: null }, "price_msg", "price_verify"),
  "reject the VerifyAI Price"
);

const urls = meetupCheckoutReturnUrls("https://bandhamai.vercel.app");
assert(urls.success_url.includes("/meetup?ticket=paid"), "ticket success returns to meetup");
assert(urls.cancel_url.includes("/meetup?ticket=cancel"), "ticket cancel returns to meetup");

assert(SPEED_MATCH_QUESTION_COUNT === 10, "reuse locked 10");
assert(SPEED_MATCH_SECONDS === 15, "reuse locked 15s");
assert(SPEED_MATCH_QUESTIONS.length === 10, "reuse existing bank");

const sql = read("supabase/meetups.sql");
assert(sql.includes("create table if not exists public.meetups"), "meetups table");
assert(sql.includes("create table if not exists public.rsvps"), "rsvps table");
assert(sql.includes("create table if not exists public.group_messages"), "group_messages table");
assert(sql.includes("create table if not exists public.event_tickets"), "event_tickets table");
assert(sql.includes("2026-08"), "seeds August 2026");
assert(sql.includes("a2026080-0000-4000-8000-000000000001"), "stable seed uuid");
assert(sql.includes("group_messages_select_rsvp"), "RSVP members read group messages");
assert(sql.includes("group_messages_insert_rsvp"), "RSVP members write group messages");
assert(sql.includes("No authenticated insert"), "no free RSVP insert");
assert(sql.includes("STRIPE_EVENT_PRICE_ID"), "sql documents event Price env");
assert(!sql.includes("default 499") && !sql.includes("default 999"), "sql does not invent a ticket amount");

const checkout = read("app/api/meetup/checkout/route.ts");
assert(checkout.includes('mode: "payment"'), "event ticket is one time payment");
assert(checkout.includes("stripeEventPriceId") || checkout.includes("STRIPE_EVENT_PRICE_ID"), "uses event Price");
assert(checkout.includes("isEventTicketPrice"), "rejects messaging / VerifyAI Prices");
assert(checkout.includes("ticketNotConfiguredPayload"), "fails closed without Price");
assert(!checkout.includes('mode: "subscription"'), "do not bill the ticket on messaging");
assert(!checkout.includes("stripePriceId()") || checkout.includes("isEventTicketPrice"), "messaging Price only for reject");

const messaging = read("app/api/stripe/checkout/route.ts");
assert(messaging.includes('mode: "subscription"'), "messaging stays subscription");
assert(!messaging.includes("STRIPE_EVENT_PRICE_ID"), "messaging checkout does not use event Price");
assert(!messaging.includes("stripeEventPriceId"), "messaging checkout does not read event Price");

const confirm = read("app/api/meetup/confirm/route.ts");
assert(confirm.includes("recordEventTicket"), "confirm writes the paid ticket");
assert(confirm.includes("EVENT_TICKET_PURPOSE"), "confirm checks meetup purpose");
assert(!confirm.includes("canMessage"), "confirm does not unlock messaging");

const rsvp = read("app/api/meetup/route.ts");
assert(rsvp.includes("event_ticket_required") || rsvp.includes("ticketRequired"), "RSVP requires ticket");
assert(rsvp.includes("402"), "unpaid RSVP is 402");
assert(rsvp.includes("isEventTicketConfigured"), "RSVP fails closed without Price");

const messages = read("app/api/meetup/messages/route.ts");
assert(messages.includes("userHasRsvp"), "group chat requires RSVP");
assert(messages.includes("403"), "no RSVP is 403");
assert(messages.includes("401") || messages.includes("unauthorizedResponse"), "signed in only");
assert(!messages.includes("/api/messages"), "group chat is not the paid 1:1 send path");
assert(!messages.includes("canMessage"), "group chat is not messaging entitlement");

const shortlist = read("app/api/meetup/shortlist/route.ts");
assert(shortlist.includes("userHasRsvp"), "shortlist requires RSVP");
assert(shortlist.includes("loadMeetupShortlist"), "shortlist uses block aware loader");

const hook = read("app/api/stripe/webhook/route.ts");
assert(hook.includes("EVENT_TICKET_PURPOSE"), "webhook records event tickets");
assert(hook.includes("recordEventTicket"), "webhook writes ticket + RSVP");

const page = read("app/meetup/page.tsx");
assert(page.includes("SpeedMatch"), "meetup reuses SpeedMatch");
assert(page.includes("MEETUP_COPY.speedTitle") || page.includes("speedTitle"), "meetup uses locked speed copy");
assert(page.includes("startEventTicketCheckout"), "meetup starts event checkout");
assert(page.includes("MeetupGroupChat"), "side group chat");
assert(page.includes("chatHrefForUser") || page.includes("/chat"), "1:1 opens existing chat");
assert(!page.includes("SPEED_MATCH_QUESTIONS"), "do not invent a second quiz on the page");

const speedUi = read("app/components/SpeedMatch.tsx");
assert(speedUi.includes("SPEED_MATCH_QUESTIONS") || speedUi.includes("questionAt"), "Speed Match still uses the locked bank");
assert(speedUi.includes("choicesForQuestion"), "tap only choices stay");

const group = read("app/components/MeetupGroupChat.tsx");
assert(group.includes("rsvped"), "group chat UI gates on RSVP");
assert(group.includes(MEETUP_COPY.openOneToOne) || group.includes("openOneToOne"), "group can open 1:1");
assert(!group.includes("/api/messages"), "group UI does not send paid 1:1");
assert(!group.includes("/api/guru"), "guru never posts in the group");

const card = read("app/components/MeetupCard.tsx");
assert(card.includes("MEETUP_COPY"), "card uses locked copy");
assert(card.includes("CREAM") || card.includes("FDF8F1"), "cream card");
assert(card.includes("VIOLET") || card.includes("6D28D9"), "violet card");

const home = read("app/page.tsx");
assert(home.includes("MeetupCard"), "Browse/Matches show the meetup card");
const account = read("app/account/page.tsx");
assert(account.includes("MeetupCard"), "account shows the meetup card");
const chat = read("app/chat/page.tsx");
assert(chat.includes("MessagePaywall"), "1:1 still gated");
assert(chat.includes('params.get("to")'), "meetup can open a 1:1 recipient");

const env = read(".env.example");
assert(env.includes("STRIPE_EVENT_PRICE_ID="), "env stub exists");
assert(!/STRIPE_EVENT_PRICE_ID=price_/.test(env), "do not invent a live Price ID");

const sources = [stripComments(page), stripComments(card), stripComments(group)];
sources.forEach(function (src) {
  assert(!dating.test(src), "no dating chrome in meetup UI");
});

console.log("meetup this month ok", {
  path: MEETUP_PATH,
  ticketEnv: EVENT_TICKET_PRICE_ENV,
  seed: SEED_MEETUP_MONTH_KEY,
  questions: SPEED_MATCH_QUESTIONS.length,
});

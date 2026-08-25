import { readFileSync } from "node:fs";
import { ACCOUNT_MENU_ITEMS, ACCOUNT_MENU_PAID_CHIP, ACCOUNT_MENU_UPGRADE } from "../lib/account-menu.ts";
import { BILLING_COPY } from "../lib/billing.ts";
import {
  INBOX_BLOCKED_SEND,
  INBOX_EMPTY_BODY,
  INBOX_EMPTY_TITLE,
  INBOX_FALLBACK_NAME,
  INBOX_KICKER,
  INBOX_PATH,
  INBOX_PREVIEW_NOTE,
  INBOX_PREVIEW_OPEN,
  INBOX_SIGN_IN,
  INBOX_TITLE,
  asInboxMessage,
  groupReceivedThreads,
  inboxChatHref,
  inboxDisplayName,
} from "../lib/inbox.ts";
import { ALLOWED_NEXT_PATHS } from "../lib/next-path.ts";
import { BLOCKS_TABLE, SAFETY_SQL_FILE, emptyBlockedSet } from "../lib/safety.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

function copyHasDash(value) {
  return /[-–—]/.test(value);
}

const userFacing = [
  INBOX_TITLE,
  INBOX_KICKER,
  INBOX_SIGN_IN,
  INBOX_EMPTY_TITLE,
  INBOX_EMPTY_BODY,
  INBOX_FALLBACK_NAME,
  INBOX_PREVIEW_NOTE,
  INBOX_PREVIEW_OPEN,
  INBOX_BLOCKED_SEND,
  BILLING_COPY.subscribe,
  BILLING_COPY.headline,
];

userFacing.forEach(function (value) {
  assert(!copyHasDash(value), "inbox copy has no hyphen or dash: " + value);
  assert(!/\bBandhamai\b/.test(value), "copy is not Bandhamai");
  assert(!/\bbandhamAI\b/.test(value), "copy is not bandhamAI");
  assert(!/\bBandhan\b/.test(value), "copy is not Bandhan");
});

assert(INBOX_TITLE === "Inbox", "Inbox label lock");
assert(INBOX_PATH === "/inbox", "Inbox path lock");
assert(INBOX_KICKER === "INBOX", "Inbox kicker lock");
assert(INBOX_EMPTY_TITLE === "No messages yet.", "quiet empty title");
assert(INBOX_FALLBACK_NAME === "Member", "no fake Priya name");
assert(BILLING_COPY.subscribe === "Subscribe $9.99 a month", "subscribe button stays");
assert(BILLING_COPY.headline === "Bandham AI subscription is $9.99 a month", "headline stays product first");
assert(!/\$9\.99 for messaging/i.test(userFacing.join(" ")), "do not say 9.99 for messaging");

assert(inboxChatHref("abc") === "/chat?to=abc", "Inbox opens live /chat");
assert(inboxDisplayName("Priya Reddy") === "Priya", "display uses first name");
assert(inboxDisplayName("") === INBOX_FALLBACK_NAME, "empty name stays Member");
assert(asInboxMessage({ sender_id: "a", recipient_id: "b", body: "hi", id: "1" }).body === "hi", "message parse");

const blocked = emptyBlockedSet();
blocked.userIds.add("blocked-user");
const threads = groupReceivedThreads(
  [
    { id: "1", sender_id: "priya-seed", recipient_id: "me", body: "fake preview", created_at: "2026-01-01" },
    { id: "2", sender_id: "real", recipient_id: "me", body: "hello from them", created_at: "2026-02-01" },
    { id: "3", sender_id: "blocked-user", recipient_id: "me", body: "should hide", created_at: "2026-03-01" },
    { id: "4", sender_id: "me", recipient_id: "real", body: "not received", created_at: "2026-04-01" },
  ],
  "me",
  blocked,
  {
    real: { name: "Ananya", profileId: "p1" },
    "blocked-user": { name: "Hidden", profileId: "p2" },
  }
);
assert(threads.length === 2, "received threads only");
assert(threads[0].userId === "real", "latest received stays first");
assert(threads[0].lastBody === "hello from them", "shows received body");
assert(
  !threads.some(function (row) {
    return row.userId === "blocked-user";
  }),
  "blocked people leave Inbox"
);
assert(
  !threads.some(function (row) {
    return row.lastBody === "not received";
  }),
  "sent only rows are not Inbox mail"
);

const labels = ACCOUNT_MENU_ITEMS.map(function (item) {
  return item.label;
});
const hrefs = ACCOUNT_MENU_ITEMS.map(function (item) {
  return item.href;
});
assert(labels.includes("Inbox"), "account menu shows Inbox");
assert(labels.includes("Block"), "account menu shows Block");
assert(!labels.includes("Messages"), "menu does not hide Inbox behind Messages");
assert(hrefs.includes("/inbox"), "Inbox is a real place");
assert(hrefs.includes("/account#blocked"), "Block opens the unblock list");
assert(ALLOWED_NEXT_PATHS.includes("/inbox"), "login can return to Inbox");

assert(ACCOUNT_MENU_PAID_CHIP !== "Paid", "no Paid chip");
assert(!/\bUpgrade\b/.test(ACCOUNT_MENU_UPGRADE), "no Upgrade");
assert(!/\bCrown\b/.test(labels.join(" ")), "no Crown");

const inboxPage = read("app/inbox/page.tsx");
const inboxList = read("app/components/InboxList.tsx");
const chat = read("app/chat/page.tsx");
const home = read("app/page.tsx");
const messagesApi = read("app/api/messages/route.ts");
const blocksApi = read("app/api/blocks/route.ts");
const safety = read("app/components/SafetyActions.tsx");
const account = read("app/account/page.tsx");
const paywall = read("app/components/MessagePaywall.tsx");
const sql = read("supabase/safety.sql");
const drawer = read("app/components/AccountDrawer.tsx");

assert(inboxPage.includes("InboxList"), "Inbox page lists threads");
assert(inboxPage.includes("INBOX_TITLE"), "Inbox page is titled Inbox");
assert(!inboxPage.includes("Priya"), "Inbox page has no Priya preview");
assert(inboxList.includes("fetchInboxThreads") || inboxList.includes("/api/messages"), "Inbox reads real messages");
assert(inboxList.includes("SafetyActions"), "Inbox threads can be blocked");
assert(inboxList.includes("INBOX_EMPTY_TITLE"), "quiet empty state");
assert(!inboxList.includes("Priya"), "Inbox list has no Priya seed");

assert(chat.includes("InboxList"), "live chat also shows Inbox");
assert(chat.includes("fetchConversation"), "conversation uses the messages API");
assert(chat.includes("INBOX_PATH"), "chat links back to Inbox");
assert(home.includes("INBOX_PREVIEW_NOTE") || home.includes(INBOX_PREVIEW_NOTE), "home Chat stays a preview");
assert(home.includes("Priya"), "home Chat preview Priya stays");
assert(!/THREAD/.test(inboxPage), "Inbox does not reuse the Priya THREAD");

assert(messagesApi.includes("export async function GET"), "GET lists Inbox");
assert(messagesApi.includes("loadInboxThreads"), "GET uses received threads");
assert(messagesApi.includes("messagingPairBlocked"), "send honors blocks");
assert(messagesApi.includes("INBOX_BLOCKED_SEND"), "blocked send copy");
assert(blocksApi.includes("tableMissingHint") || blocksApi.includes("SAFETY_SQL_FILE"), "block fails closed without SQL");
assert(BLOCKS_TABLE === "blocks", "reuse public.blocks");
assert(SAFETY_SQL_FILE === "supabase/safety.sql", "existing safety SQL");
assert(sql.includes("create table if not exists public.blocks"), "blocks table is in safety.sql");
assert(sql.includes("blocks_insert_own"), "own row insert");
assert(sql.includes("blocks_select_own"), "own row select");
assert(sql.includes("blocks_delete_own"), "own row delete");
assert(!sql.includes("public.feedback"), "do not write feedback");
assert(!sql.includes("raised_in"), "do not invent raised_in");
["saves", "interests", "searches", "signals", "feedback", "photo_grants"].forEach(function (table) {
  assert(!new RegExp("alter table public\\." + table + " enable row level security").test(sql), "do not enable RLS on " + table);
});

assert(safety.includes("Block"), "Block control exists");
assert(safety.includes("Cancel"), "confirm before block");
assert(safety.includes("Inbox"), "block copy names Inbox");
assert(account.includes('id="blocked"'), "unblock list is addressable");
assert(account.includes("Unblock"), "unblock from Account");
assert(!/\bPaid\b/.test(stripComments(inboxPage) + stripComments(inboxList)), "Inbox UI is not Paid");
assert(!/\bUpgrade\b/.test(stripComments(inboxPage) + stripComments(inboxList)), "Inbox UI is not Upgrade");
assert(!/\bCrown\b/.test(stripComments(inboxPage) + stripComments(inboxList) + stripComments(drawer)), "no Crown chrome");
assert(paywall.includes("BILLING_COPY.subscribe"), "paywall button stays");
assert(!paywall.includes("$9.99 for messaging"), "paywall does not invent messaging price copy");

console.log("inbox and block ok", {
  inbox: INBOX_PATH,
  subscribe: BILLING_COPY.subscribe,
  blocks: BLOCKS_TABLE,
});

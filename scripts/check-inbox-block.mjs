import { readFileSync } from "node:fs";
import { ACCOUNT_MENU_ITEMS, ACCOUNT_MENU_PAID_CHIP, ACCOUNT_MENU_UPGRADE } from "../lib/account-menu.ts";
import { BILLING_COPY } from "../lib/billing.ts";
import {
  CHATS_BROWSE,
  CHATS_EMPTY_BODY,
  CHATS_EMPTY_TITLE,
  CHATS_OPEN_INBOX,
  CHATS_RAIL_MAX_HEIGHT,
  CHATS_SCOPE,
  CHATS_SEARCH_LABEL,
  CHATS_SEARCH_PLACEHOLDER,
  CHATS_SIGN_IN,
  CHATS_TITLE,
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
  chatRowMatches,
  groupConversationThreads,
  groupReceivedThreads,
  inboxChatHref,
  inboxDisplayName,
  inboxTimeLabel,
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
  CHATS_TITLE,
  CHATS_SIGN_IN,
  CHATS_EMPTY_TITLE,
  CHATS_EMPTY_BODY,
  CHATS_OPEN_INBOX,
  CHATS_BROWSE,
  CHATS_SEARCH_LABEL,
  CHATS_SEARCH_PLACEHOLDER,
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

assert(CHATS_TITLE === "Chats", "rail title lock");
assert(CHATS_SCOPE === "conversations", "rail uses the conversations scope on /api/messages");
assert(CHATS_OPEN_INBOX === "Open Inbox", "empty rail points at Inbox");
assert(CHATS_BROWSE === "Browse", "empty rail can return to Browse");
assert(CHATS_RAIL_MAX_HEIGHT === 288, "rail list stays a short drawer");
assert(CHATS_RAIL_MAX_HEIGHT < 360, "rail is not a full page paste");
assert(CHATS_SEARCH_LABEL === "Search chats", "search label lock");
assert(CHATS_SEARCH_PLACEHOLDER === "Search chats", "search placeholder lock");
assert(
  chatRowMatches({ userId: "a", profileId: null, name: "Ananya", lastBody: "hello from them", lastAt: "" }, "ana"),
  "search matches a display name"
);
assert(
  !chatRowMatches({ userId: "a", profileId: null, name: "Ananya", lastBody: "hello from them", lastAt: "" }, "zzz"),
  "search does not invent a miss"
);
assert(inboxTimeLabel("2026-08-03T12:00:00.000Z", Date.parse("2026-08-03T12:00:20.000Z")) === "Now", "fresh stamp is Now");
assert(inboxTimeLabel("2026-08-03T10:00:00.000Z", Date.parse("2026-08-03T12:00:00.000Z")) === "2h", "hour stamp");
assert(inboxTimeLabel("2026-01-03T12:00:00.000Z", Date.parse("2026-08-03T12:00:00.000Z")) === "Jan 3", "older stamp stays short");

const conversations = groupConversationThreads(
  [
    { id: "1", sender_id: "me", recipient_id: "real", body: "hello from me", created_at: "2026-04-01" },
    { id: "2", sender_id: "real", recipient_id: "me", body: "hello from them", created_at: "2026-02-01" },
    { id: "3", sender_id: "me", recipient_id: "blocked-user", body: "should hide", created_at: "2026-05-01" },
    { id: "4", sender_id: "other", recipient_id: "me", body: "later note", created_at: "2026-06-01" },
  ],
  "me",
  blocked,
  {
    real: { name: "Ananya", profileId: "p1" },
    "blocked-user": { name: "Hidden", profileId: "p2" },
    other: { name: "Kiran", profileId: "p3" },
  }
);
assert(conversations.length === 2, "rail lists every peer, sent or received");
assert(conversations[0].userId === "other", "latest conversation stays first");
assert(
  conversations.some(function (row) {
    return row.userId === "real" && row.lastBody === "hello from me";
  }),
  "sent latest snippet stays"
);
assert(
  !conversations.some(function (row) {
    return row.userId === "blocked-user";
  }),
  "blocked people leave the rail"
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
const chatsRail = read("app/components/ChatsRail.tsx");
const chat = read("app/chat/page.tsx");
const home = read("app/page.tsx");
const messagesApi = read("app/api/messages/route.ts");
const inboxServer = read("lib/inbox-server.ts");
const clientInbox = read("lib/client-inbox.ts");
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
assert(messagesApi.includes("loadConversationThreads"), "GET can list all conversations");
assert(messagesApi.includes("CHATS_SCOPE"), "conversation list stays on /api/messages");
assert(messagesApi.includes("messagingPairBlocked"), "send honors blocks");
assert(inboxServer.includes("groupConversationThreads"), "conversation list reuses inbox grouping");
assert(clientInbox.includes("CHATS_SCOPE"), "client fetch can ask for conversations");
assert(chatsRail.includes("fetchInboxThreads"), "rail reads the existing inbox client");
assert(chatsRail.includes("conversations: true") || chatsRail.includes("conversations:true"), "rail asks for all peers");
assert(chatsRail.includes("inboxChatHref"), "rail opens live /chat");
assert(chatsRail.includes("CHATS_TITLE"), "rail is titled Chats");
assert(chatsRail.includes("sidebarAvatarInitial"), "rail rows use an initial");
assert(chatsRail.includes("inboxTimeLabel"), "rail rows show time");
assert(chatsRail.includes("whiteSpace: \"nowrap\""), "snippet stays one truncated line");
assert(chatsRail.includes("CHATS_RAIL_MAX_HEIGHT") && chatsRail.includes("overflowY"), "many threads scroll inside the card");
assert(chatsRail.includes("INBOX_PATH"), "compose opens existing Inbox");
assert(chatsRail.includes('href="/"') || chatsRail.includes('href={"/"}'), "empty rail links Browse");
assert(chatsRail.includes("CHATS_SEARCH_LABEL"), "header has search");
assert(chatsRail.includes("type=\"search\""), "search filters loaded threads");
assert(chatsRail.includes("chatRowMatches"), "search stays on the inbox client list");
assert(chatsRail.includes("ComposeIcon") || chatsRail.includes("CHATS_OPEN_INBOX"), "compose icon stays on Inbox");
assert(!chatsRail.includes("@"), "do not invent handles");
assert(!/\bunread\b/i.test(chatsRail), "inbox has no unread state, so the rail skips a dot");
assert(!/twitter|tweetdeck|\bx\.com\b|for you/i.test(chatsRail), "do not copy X branding");
assert(!chatsRail.includes("/api/chat"), "rail does not invent a second chat API");
assert(!chatsRail.includes("Priya"), "rail has no Priya seed");
assert(!/subscribe|paywall|upgrade|crown/i.test(stripComments(chatsRail)), "listing is not a paywall");
assert(!/\b(swipe|hot near you|crush|hook-?up|drinks tonight)\b/i.test(chatsRail), "rail is not dating chrome");
assert(!/talk to (her|his|their) parents/i.test(chatsRail), "rail does not pitch parent talk");
assert(home.includes("ChatsRail"), "Home mounts the chats rail");
assert(home.indexOf("<ChatsRail") > home.indexOf("<MeetupCard"), "Chats sits under Meetup");
assert(home.lastIndexOf("<VoiceAssistant") > home.indexOf("<MeetupCard"), "assistant sits under Meetup");
assert(home.lastIndexOf("<VoiceAssistant") < home.indexOf("<ChatsRail"), "Chats sits under the assistant");
assert(home.includes("<VoiceAssistant embedded"), "browse rail embeds the assistant");
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

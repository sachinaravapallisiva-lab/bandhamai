import { readFileSync } from "node:fs";
import {
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_HEARTBEAT_PATH,
  PRESENCE_LOOKUP_PATH,
  PRESENCE_ONLINE_COLOR,
  PRESENCE_ONLINE_WINDOW_MS,
  PRESENCE_SQL_FILE,
  PRESENCE_TABLE,
  isRecentlySeen,
  presenceFromRow,
} from "../lib/presence.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

assert(PRESENCE_TABLE === "presence", "table name lock");
assert(PRESENCE_SQL_FILE === "supabase/presence.sql", "SQL file lock");
assert(PRESENCE_HEARTBEAT_PATH === "/api/presence/heartbeat", "heartbeat path");
assert(PRESENCE_LOOKUP_PATH === "/api/presence", "lookup path");
assert(PRESENCE_ONLINE_WINDOW_MS >= 2 * 60 * 1000, "window at least 2 minutes");
assert(PRESENCE_ONLINE_WINDOW_MS <= 3 * 60 * 1000, "window at most 3 minutes");
assert(PRESENCE_HEARTBEAT_MS >= 30 * 1000 && PRESENCE_HEARTBEAT_MS <= 45 * 1000, "client ping 30–45s");
assert(PRESENCE_ONLINE_COLOR.toLowerCase() === "#16a34a", "green is only the online mark");

assert(isRecentlySeen(null) === false, "missing last_seen is offline");
assert(isRecentlySeen("") === false, "empty last_seen is offline");
assert(isRecentlySeen(new Date().toISOString()) === true, "now is online");
assert(isRecentlySeen(new Date(Date.now() - 2 * 60 * 1000).toISOString()) === true, "2 minutes ago is online");
assert(isRecentlySeen(new Date(Date.now() - 4 * 60 * 1000).toISOString()) === false, "4 minutes ago is offline");
assert(isRecentlySeen(new Date(Date.now() + 60 * 1000).toISOString()) === false, "future timestamp is not online");
assert(presenceFromRow(null).online === false, "no row is offline");
assert(presenceFromRow({ last_seen_at: new Date().toISOString() }).online === true, "row with now is online");

const sql = read("supabase/presence.sql");
assert(sql.includes("create table if not exists public.presence"), "creates presence");
assert(sql.includes("user_id"), "user_id PK");
assert(sql.includes("last_seen_at"), "last_seen_at");
assert(sql.includes("enable row level security"), "RLS on");
assert(sql.includes("presence_insert_own") || sql.includes("insert"), "own insert");
assert(sql.includes("presence_update_own") || sql.includes("for update"), "own update");
assert(sql.includes("status = 'live'") || sql.includes("status = 'live'"), "read limited to live profiles");
assert(!/\bmatch_percent\b|\bcompatibility\b/i.test(sql), "SQL must not invent match %");
assert(!/verifyai_status|verifyai_payments/i.test(sql), "presence SQL stays off VerifyAI columns");

const heartbeat = read("app/api/presence/heartbeat/route.ts");
assert(heartbeat.includes("export async function POST"), "heartbeat is POST");
assert(heartbeat.includes("hasBearerToken"), "heartbeat requires auth");
assert(heartbeat.includes("upsert"), "heartbeat upserts");
assert(heartbeat.includes("last_seen_at"), "writes last_seen_at");
assert(heartbeat.includes("table_missing") || heartbeat.includes("PRESENCE_SQL_FILE"), "asks Sai to run SQL");

const lookup = read("app/api/presence/route.ts");
assert(lookup.includes("export async function GET"), "lookup is GET");
assert(lookup.includes("hasBearerToken"), "lookup requires auth");
assert(lookup.includes("presenceFromRow") || lookup.includes("online"), "returns online");

const search = read("app/api/profiles/search/route.ts");
assert(search.includes("loadPresenceByUserIds"), "Browse search attaches presence");
assert(search.includes("attachLastSeen"), "Browse rows get last_seen");

const mapper = read("lib/profile-search.ts");
assert(mapper.includes("online:"), "BrowseProfile has online");
assert(mapper.includes("isRecentlySeen"), "mapper computes online from last_seen");
assert(mapper.includes("verifyai_status"), "VerifyAI stays a separate field");

const page = read("app/page.tsx");
assert(page.includes("DiscoverCard"), "Browse uses the Arjun cream card");
assert(page.includes("MatchCard"), "Matches use the cream card");

const matchCard = read("app/components/MatchCard.tsx");
assert(matchCard.includes("PresenceMark"), "Matches show presence");
assert(matchCard.includes("online={profile.online}"), "Matches pass online");
assert(matchCard.includes("<VerifyBadge"), "quiet VerifyAI badge stays on Matches");

const card = read("app/components/DiscoverCard.tsx");
assert(card.includes("PresenceMark"), "Browse cream card shows presence");
assert(card.includes("profile.online") || card.includes("online={profile.online}"), "cream card reads online");
assert(card.includes("PRESENCE_ONLINE_COLOR") || card.includes("PresenceMark"), "green mark stays on the card");
assert(card.includes("<VerifyBadge"), "quiet VerifyAI badge stays on the cream card");
assert(!/match\s*%|match percent/i.test(page), "no invented match %");
const priyaBlock = page.slice(page.indexOf("Priya"), page.indexOf("Priya") + 400);
assert(!priyaBlock.includes("PresenceMark"), "home Chat preview Priya is not a live presence");
assert(!priyaBlock.includes("Online"), "home Chat preview does not fake Online");

const chat = read("app/chat/page.tsx");
assert(chat.includes("PresenceMark"), "live /chat partner header shows presence");
assert(chat.includes("PRESENCE_LOOKUP_PATH") || chat.includes("/api/presence"), "chat looks up partner");

const heartbeatUi = read("app/components/PresenceHeartbeat.tsx");
assert(heartbeatUi.includes("PRESENCE_HEARTBEAT_PATH"), "client pings heartbeat");
assert(heartbeatUi.includes("visibilitychange"), "pings on visibility");
assert(heartbeatUi.includes("focus"), "pings on focus");

const layout = read("app/layout.tsx");
assert(layout.includes("PresenceHeartbeat"), "signed-in shell sends heartbeats");

const mark = read("app/components/PresenceMark.tsx");
assert(mark.includes("PRESENCE_ONLINE_COLOR"), "green only on the online mark");
assert(mark.includes("Online"), "Online label");
assert(mark.includes("Offline"), "Offline label");
assert(!/verifyai_status|VERIFYAI/.test(mark), "presence mark is not the quiet badge");
assert(!/match\s*%/i.test(mark), "presence mark is not a match %");

console.log("presence ok", {
  windowMinutes: PRESENCE_ONLINE_WINDOW_MS / 60000,
  heartbeatSeconds: PRESENCE_HEARTBEAT_MS / 1000,
});

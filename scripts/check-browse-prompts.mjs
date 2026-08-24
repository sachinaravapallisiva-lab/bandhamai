import { readFileSync } from "node:fs";
import {
  BROWSE_PROMPTS_HINT,
  BROWSE_PROMPTS_LABEL,
  BROWSE_PROMPTS_LIMIT,
  BROWSE_PROMPTS_MAX_LEN,
  BROWSE_PROMPTS_MENU,
  BROWSE_PROMPTS_NEW,
  BROWSE_PROMPTS_PATH,
  BROWSE_PROMPTS_RERUN,
  BROWSE_PROMPTS_SQL_FILE,
  BROWSE_PROMPTS_STORAGE_KEY,
  BROWSE_PROMPTS_TABLE,
  BROWSE_PROMPTS_VIEW,
  browsePromptWhen,
  dedupeBrowsePrompts,
  normalizeBrowsePromptItem,
  sanitizeBrowsePrompt,
  userFacingBrowsePromptCopy,
} from "../lib/browse-prompts.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function assertEq(got, expected, label) {
  if (got !== expected) {
    throw new Error(label + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(got));
  }
}

function read(rel) {
  return readFileSync(new URL("../" + rel, import.meta.url), "utf8");
}

const dating = /\b(flirt|party|hookup|swipe|streak|ask me anything|manasi|new chat|smart fast personalized)\b/i;
const dash = /[-—–]/;

assertEq(BROWSE_PROMPTS_TABLE, "browse_prompts", "table name");
assertEq(BROWSE_PROMPTS_SQL_FILE, "supabase/browse_prompts.sql", "sql file");
assertEq(BROWSE_PROMPTS_PATH, "/api/browse/prompts", "api path");
assertEq(BROWSE_PROMPTS_VIEW, "View results", "view label");
assertEq(BROWSE_PROMPTS_RERUN, "Search again", "rerun label");
assertEq(BROWSE_PROMPTS_NEW, "New search", "overflow new search, not New chat");
assertEq(BROWSE_PROMPTS_MENU, "More on this search", "3-dot aria label");
assertEq(BROWSE_PROMPTS_LABEL, "EARLIER SEARCHES", "section is Earlier searches, not History");
assert(BROWSE_PROMPTS_HINT.toLowerCase().includes("bandham ai"), "hint names Bandham AI");
assert(!/bandhan\b/i.test(BROWSE_PROMPTS_HINT), "product is Bandham, not Bandhan");
assert(!/ask me anything/i.test(BROWSE_PROMPTS_HINT), "do not copy Manasi input copy");
assert(BROWSE_PROMPTS_LIMIT >= 6 && BROWSE_PROMPTS_LIMIT <= 12, "a short recent list");
assert(BROWSE_PROMPTS_STORAGE_KEY.startsWith("bandham."), "session key is Bandham scoped");

userFacingBrowsePromptCopy().forEach(function (text) {
  assert(!dash.test(text), "user-facing copy has no hyphen: " + text);
  assert(!/bandhan\b/i.test(text), "product name is Bandham, not Bandhan: " + text);
  assert(!dating.test(text), "not dating / not Manasi copy: " + text);
});

assertEq(sanitizeBrowsePrompt("  doctor in Hyderabad  "), "doctor in Hyderabad", "trim prompt");
assert(sanitizeBrowsePrompt("x".repeat(400)).length === BROWSE_PROMPTS_MAX_LEN, "prompt cap");
assert(normalizeBrowsePromptItem({ prompt: "" }) === null, "empty prompt dropped");
assert(normalizeBrowsePromptItem({ prompt: "Brahmin doctor" })?.prompt === "Brahmin doctor", "store raw prompt text, no caste column");

const first = normalizeBrowsePromptItem({
  id: "a",
  prompt: "doctor in Hyderabad",
  search_q: "doctor in Hyderabad vegetarian",
  created_at: "2026-08-24T12:00:00.000Z",
});
const dup = normalizeBrowsePromptItem({
  id: "b",
  prompt: "doctor in Hyderabad",
  search_q: "doctor in Hyderabad",
  created_at: "2026-08-23T12:00:00.000Z",
});
const other = normalizeBrowsePromptItem({
  id: "c",
  prompt: "Telugu woman in Dallas",
  search_q: "Telugu woman in Dallas",
  created_at: "2026-08-22T12:00:00.000Z",
});
assert(first && dup && other, "items map");
const deduped = dedupeBrowsePrompts([first, dup, other]);
assertEq(deduped.length, 2, "same prompt kept once");
assertEq(deduped[0].id, "a", "newest raw prompt wins");
assertEq(deduped[0].searchQ, "doctor in Hyderabad vegetarian", "folded q kept for View results");

assertEq(browsePromptWhen(new Date().toISOString()), "Just now", "just now");
assertEq(browsePromptWhen(new Date(Date.now() - 2 * 60 * 1000).toISOString()), "2 minutes ago", "minutes");
assertEq(browsePromptWhen(new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()), "Yesterday", "yesterday");

const sql = read("supabase/browse_prompts.sql");
const sqlCode = sql.replace(/--[^\n]*/g, "");
assert(sql.includes("create table if not exists public.browse_prompts"), "creates table");
assert(sql.includes("enable row level security"), "RLS on");
assert(sql.includes("browse_prompts_select_own"), "own select");
assert(sql.includes("browse_prompts_insert_own"), "own insert");
assert(sql.includes("auth.uid() = user_id"), "owner check");
assert(sql.includes("CoS") || sql.includes("Sai"), "tells CoS/Sai to apply the file");
assert(!/\bcaste\b/.test(sqlCode), "no caste column");
assert(!/\breligion\b/.test(sqlCode), "no religion column");
assert(!/\bgotra\b/.test(sqlCode), "no gotra column");
assert(!/\bmatch_percent\b/.test(sqlCode), "no match percent");

const route = read("app/api/browse/prompts/route.ts");
assert(route.includes("export async function GET"), "GET list");
assert(route.includes("export async function POST"), "POST save");
assert(route.includes("hasBearerToken"), "auth required");
assert(route.includes(".eq(\"user_id\", user.id)"), "own rows only");
assert(route.includes("table_missing") || route.includes("BROWSE_PROMPTS_SQL_FILE"), "asks Sai to run SQL");
assert(!route.includes("/api/profiles/search"), "history API does not search");

const page = read("app/page.tsx");
const ui = read("app/components/BrowseRecent.tsx");
const surfaces = read("lib/surfaces.ts");
const orb = read("app/components/VoiceAssistant.tsx");

assert(page.includes("BrowseRecent"), "Browse shows earlier search cards");
assert(page.includes("BROWSE_PROMPTS_PATH") || page.includes("/api/browse/prompts"), "signed-in persist path");
assert(page.includes("rememberLocalBrowsePrompt"), "session-only fallback");
assert(page.includes("viewRecent") || page.includes("onView"), "View results path");
assert(ui.includes("BROWSE_PROMPTS_VIEW"), "card has View results");
assert(ui.includes("BROWSE_PROMPTS_RERUN"), "Search again stays on the card menu");
assert(ui.includes("BROWSE_PROMPTS_NEW"), "overflow has New search");
assert(ui.includes("BROWSE_PROMPTS_MENU"), "3-dot menu is labeled");
assert(ui.includes("browsePromptWhen"), "card has a timestamp");
assert(ui.includes("DotsIcon") || ui.includes("circle cx=\"12\""), "3-dot icon on the card");
assert(ui.includes("PROFILE_ACTION_MIN") || ui.includes("minHeight: PROFILE_ACTION_MIN"), "44px taps");
assert(ui.includes("CREAM") || ui.includes("FDF8F1"), "cream cards");
assert(ui.includes("VIOLET") || ui.includes("6D28D9"), "violet actions");
assert(!ui.includes("Ask me anything"), "no Manasi input copy");
assert(!/new chat/i.test(ui), "overflow is New search, not New chat");
assert(!/\bHistory\b/.test(ui), "no Manasi History label; section already says Earlier searches");
assert(!/manasi|smart fast personalized|\bbeta\b/i.test(ui), "no Manasi brand, Beta, or tagline");
assert(!/500 characters/i.test(ui) && !/500 characters/i.test(page), "no invented character count line");
assert(!/swipe|streak/i.test(ui), "not swipe history or streaks");
assert(page.includes("onNewSearch") || page.includes("newSearch"), "New search clears back to PROFILE SEARCH");
assert(!orb.includes("browse-prompts") && !orb.includes("/api/browse/prompts"), "guru orb never stores or searches prompts");
assert(!orb.includes("/api/profiles/search"), "guru orb never searches profiles");
assert(surfaces.includes("Search profiles"), "existing Browse placeholder stays locked");
assert(!surfaces.toLowerCase().includes("ask me anything"), "surfaces do not copy Manasi");

console.log("browse prompts ok", {
  table: BROWSE_PROMPTS_TABLE,
  view: BROWSE_PROMPTS_VIEW,
  rerun: BROWSE_PROMPTS_RERUN,
});

import { readFileSync } from "node:fs";
import {
  INSTAGRAM_COLUMN,
  INSTAGRAM_HANDLE_ERROR,
  INSTAGRAM_ONLY_ERROR,
  INSTAGRAM_SQL_FILE,
  displayInstagramHandle,
  instagramProfileUrl,
  parseInstagramInput,
} from "../lib/instagram.ts";
import { PROFILE_OPTIONAL_WRITE_FIELDS, PROFILE_WRITE_FIELDS } from "../lib/profile-fields.ts";

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

assertEq(parseInstagramInput("").handle, null, "empty stays empty");
assertEq(parseInstagramInput("   ").handle, null, "whitespace stays empty");
assertEq(parseInstagramInput("ananya").handle, "ananya", "bare handle");
assertEq(parseInstagramInput("@ananya").handle, "ananya", "strips @");
assertEq(parseInstagramInput("@@ananya.s").handle, "ananya.s", "strips extra @");
assertEq(parseInstagramInput("https://instagram.com/ananya").handle, "ananya", "https url");
assertEq(parseInstagramInput("https://www.instagram.com/ananya/").handle, "ananya", "www trailing slash");
assertEq(parseInstagramInput("https://instagram.com/ananya?igsh=abc").handle, "ananya", "query string");
assertEq(parseInstagramInput("instagram.com/ananya").handle, "ananya", "host without protocol");
assertEq(parseInstagramInput("https://instagram.com/_u/ananya").handle, "ananya", "_u profile path");
assertEq(instagramProfileUrl("ananya"), "https://instagram.com/ananya", "canonical url");
assertEq(displayInstagramHandle("ananya"), "@ananya", "display @");

assertEq(parseInstagramInput("https://facebook.com/ananya").error, INSTAGRAM_ONLY_ERROR, "blocks facebook");
assertEq(parseInstagramInput("https://www.linkedin.com/in/ananya").error, INSTAGRAM_ONLY_ERROR, "blocks linkedin");
assertEq(parseInstagramInput("https://x.com/ananya").error, INSTAGRAM_ONLY_ERROR, "blocks x");
assertEq(parseInstagramInput("https://twitter.com/ananya").error, INSTAGRAM_ONLY_ERROR, "blocks twitter");
assertEq(parseInstagramInput("https://www.tiktok.com/@ananya").error, INSTAGRAM_ONLY_ERROR, "blocks tiktok");
assertEq(parseInstagramInput("https://example.com/ananya").error, INSTAGRAM_ONLY_ERROR, "blocks other hosts");
assertEq(parseInstagramInput("https://instagram.com/p/ABC123").error, INSTAGRAM_HANDLE_ERROR, "rejects post urls");
assertEq(parseInstagramInput("ananya sharma").error, INSTAGRAM_HANDLE_ERROR, "rejects spaces");
assertEq(parseInstagramInput(".ananya").error, INSTAGRAM_HANDLE_ERROR, "rejects leading dot");
assertEq(parseInstagramInput("ananya.").error, INSTAGRAM_HANDLE_ERROR, "rejects trailing dot");
assert(PROFILE_WRITE_FIELDS.includes("instagram"), "instagram is a write field");
assert(PROFILE_OPTIONAL_WRITE_FIELDS.includes("instagram"), "instagram is optional until SQL exists");
assert(INSTAGRAM_COLUMN === "instagram", "single instagram column");
assert(INSTAGRAM_SQL_FILE === "supabase/instagram.sql", "sql filename lock");

const sql = read("supabase/instagram.sql");
assert(sql.includes("add column if not exists instagram"), "sql adds instagram");
assert(sql.includes("char_length(instagram) <= 30"), "sql caps handle length");
assert(!/add column if not exists (facebook|linkedin|tiktok|twitter|x_handle)/i.test(sql), "sql does not add other social columns");

const create = read("app/profile/new/page.tsx");
assert(create.includes("InstagramField"), "create/edit form has Instagram");
assert(create.includes("CONNECT SOCIALS") || create.includes("InstagramField"), "connect socials on profile form");
assert(create.includes('method: "PATCH"'), "existing profiles can save Instagram");
assert(!/facebook|linkedin|tiktok/i.test(create), "profile form does not add other networks");

const field = read("app/components/InstagramField.tsx");
assert(field.includes("CONNECT SOCIALS"), "section label");
assert(field.includes("INSTAGRAM"), "instagram label");
assert(field.toLowerCase().includes("optional"), "optional copy");

const chip = read("app/components/InstagramChip.tsx");
assert(chip.includes('target="_blank"'), "chip opens a new tab");
assert(chip.includes("instagramProfileUrl"), "chip uses the canonical url");
assert(!/VERIFYAI|match percent|match %/i.test(chip), "chip is not a VerifyAI mark or match %");

const browse = read("app/page.tsx");
assert(browse.includes("MatchCard"), "Matches uses the Pack 2 card");
assert(!browse.includes("InstagramChip"), "page does not inline Instagram — cards own the chip");
const card = read("app/components/DiscoverCard.tsx");
assert(card.includes("InstagramChip"), "Arjun Browse card shows Instagram when set");
assert(card.includes("PresenceMark"), "Browse keeps presence next to Instagram");
assert(!/facebook|linkedin|tiktok/i.test(card), "Browse card does not add other networks");
const match = read("app/components/MatchCard.tsx");
assert(match.includes("InstagramChip"), "Matches card shows Instagram when set");
assert(match.includes("PresenceMark"), "Matches keeps the presence mark");

const write = read("app/api/profiles/route.ts");
assert(write.includes("parseInstagramInput"), "POST validates Instagram");
assert(write.includes("PATCH"), "PATCH edits Instagram");
assert(write.includes("INSTAGRAM_SQL_HINT") || write.includes("instagram.sql"), "edit asks for SQL when missing");
assert(!/oauth|instagram\.com\/oauth|graph\.facebook/i.test(write), "no Instagram OAuth");

const search = read("app/api/profiles/search/route.ts");
assert(search.includes("INSTAGRAM_COLUMN"), "search probes instagram column");

const mapper = read("lib/profile-search.ts");
assert(mapper.includes("instagram?: boolean"), "browse select can include instagram");
assert(mapper.includes('field === "instagram"'), "browse omits instagram until the column exists");
assert(mapper.includes("instagram: asText(row.instagram)"), "mapper passes the handle to cards");

console.log("instagram connect ok", {
  handle: parseInstagramInput("@ananya").handle,
  blocked: parseInstagramInput("https://facebook.com/ananya").error,
});

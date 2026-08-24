import { readFileSync } from "node:fs";
import {
  BIRTH_DATE_LABEL,
  BIRTH_INVALID_ERROR,
  BIRTH_LAT_LABEL,
  BIRTH_LON_LABEL,
  BIRTH_MISSING_BOTH,
  BIRTH_OTHER_MISSING,
  BIRTH_OWN_MISSING,
  BIRTH_PLACE_LABEL,
  BIRTH_PLACE_PRESET_LABEL,
  BIRTH_PLACE_PRESETS,
  BIRTH_PRIVATE_COLUMNS,
  BIRTH_SAVED,
  BIRTH_SAVE_LABEL,
  BIRTH_SAVING_LABEL,
  BIRTH_SECTION_HINT,
  BIRTH_SECTION_TITLE,
  BIRTH_SQL_HINT,
  BIRTH_TIME_LABEL,
  BIRTH_TIME_ZONES,
  BIRTH_TZ_LABEL,
  birthChartCoordinates,
  birthChartDatetime,
  birthFingerprint,
  emptyBirthDetails,
  hasCompleteBirthDetails,
  parseBirthDetailsInput,
  readBirthDetails,
} from "../lib/birth-details.ts";
import {
  assignChartSlots,
  BIRTH_DETAILS_API_PATH,
  decideGunMilanAccess,
  formatScoreLine,
  GUN_MILAN_ACCOUNT_NOTE,
  GUN_MILAN_ACTION,
  GUN_MILAN_API_ERROR,
  GUN_MILAN_BIRTH_ON_ACCOUNT,
  GUN_MILAN_CACHED_NOTE,
  GUN_MILAN_CHOOSE_PLACE,
  GUN_MILAN_EMPTY_RUN,
  GUN_MILAN_API_PATH,
  GUN_MILAN_FOCUS_HINT,
  GUN_MILAN_GENDER_ERROR,
  GUN_MILAN_KOOT_LABEL,
  GUN_MILAN_LOAD_ERROR,
  GUN_MILAN_MANGLIK_LABEL,
  GUN_MILAN_NO_REPORT_REPLY,
  GUN_MILAN_NOT_CONFIGURED,
  GUN_MILAN_PROVIDER_ID,
  GUN_MILAN_PUBLIC_BROWSE_FORBIDDEN,
  GUN_MILAN_REPORTS_TABLE,
  GUN_MILAN_RUN,
  GUN_MILAN_RUNNING,
  GUN_MILAN_SCORE_LABEL,
  GUN_MILAN_SQL_FILE,
  GUN_MILAN_TITLE,
  gunMilanKeysReady,
  gunMilanPath,
  looksLikeGunMilanQuestion,
  pairProfileIds,
  presentGunMilanReport,
  PROKERALA_API_BASE,
  PROKERALA_CLIENT_ID_ENV,
  PROKERALA_CLIENT_SECRET_ENV,
  PROKERALA_KUNDLI_MATCHING_PATH,
  PROKERALA_TOKEN_URL,
  readGunMilanTargetId,
} from "../lib/gun-milan.ts";
import {
  KUNDLI_NOT_ALLOWED_ERROR,
  KUNDLI_SHARE_COLUMN,
  KUNDLI_SHARE_DEFAULT,
  KUNDLI_SHARE_HINT,
  KUNDLI_SHARE_LABEL,
  KUNDLI_SHARE_SAVE_LABEL,
  KUNDLI_SHARE_SAVING_LABEL,
  KUNDLI_SHARE_SQL_FILE,
  KUNDLI_SHARE_SQL_HINT,
  KUNDLI_SIGNED_IN_ERROR,
  canShowGunMilanAction,
  parseKundliShare,
} from "../lib/kundli-share.ts";
import { browseSelectColumns, toBrowseProfile } from "../lib/profile-search.ts";
import { GURU_INTRO, GURU_STARTERS } from "../lib/surfaces.ts";

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

function noHyphenCopy(text, label) {
  assert(typeof text === "string" && text.length > 0, label + " is copy");
  assert(!text.includes("-") && !text.includes("—") && !text.includes("–"), "user-facing copy has no hyphen: " + label + " / " + text);
  assert(!/bandhan\b/i.test(text), "product name is Bandham, not Bandhan: " + text);
}

const copy = [
  GUN_MILAN_TITLE,
  GUN_MILAN_ACTION,
  GUN_MILAN_RUN,
  GUN_MILAN_RUNNING,
  GUN_MILAN_NOT_CONFIGURED,
  GUN_MILAN_SCORE_LABEL,
  GUN_MILAN_KOOT_LABEL,
  GUN_MILAN_MANGLIK_LABEL,
  GUN_MILAN_GENDER_ERROR,
  GUN_MILAN_API_ERROR,
  GUN_MILAN_FOCUS_HINT,
  GUN_MILAN_NO_REPORT_REPLY,
  GUN_MILAN_ACCOUNT_NOTE,
  GUN_MILAN_BIRTH_ON_ACCOUNT,
  GUN_MILAN_CACHED_NOTE,
  GUN_MILAN_CHOOSE_PLACE,
  GUN_MILAN_EMPTY_RUN,
  GUN_MILAN_LOAD_ERROR,
  KUNDLI_SHARE_LABEL,
  KUNDLI_SHARE_HINT,
  KUNDLI_SHARE_SAVE_LABEL,
  KUNDLI_SHARE_SAVING_LABEL,
  KUNDLI_NOT_ALLOWED_ERROR,
  KUNDLI_SIGNED_IN_ERROR,
  KUNDLI_SHARE_SQL_HINT,
  BIRTH_SECTION_TITLE,
  BIRTH_SECTION_HINT,
  BIRTH_DATE_LABEL,
  BIRTH_TIME_LABEL,
  BIRTH_PLACE_LABEL,
  BIRTH_LAT_LABEL,
  BIRTH_LON_LABEL,
  BIRTH_TZ_LABEL,
  BIRTH_PLACE_PRESET_LABEL,
  BIRTH_SAVE_LABEL,
  BIRTH_SAVING_LABEL,
  BIRTH_SAVED,
  BIRTH_MISSING_BOTH,
  BIRTH_OWN_MISSING,
  BIRTH_OTHER_MISSING,
  BIRTH_INVALID_ERROR,
  BIRTH_SQL_HINT,
];
copy.forEach(function (text) {
  noHyphenCopy(text, text);
});
BIRTH_TIME_ZONES.forEach(function (zone) {
  noHyphenCopy(zone.label, "tz " + zone.value);
});
BIRTH_PLACE_PRESETS.forEach(function (place) {
  noHyphenCopy(place.label, "place " + place.id);
});
noHyphenCopy(GURU_INTRO, "guru intro");

assertEq(GUN_MILAN_PROVIDER_ID, "prokerala", "first provider is Prokerala");
assertEq(GUN_MILAN_API_PATH, "/api/gun-milan", "api path");
assertEq(BIRTH_DETAILS_API_PATH, "/api/birth-details", "birth api path");
assertEq(KUNDLI_SHARE_COLUMN, "kundli_share", "opt-in column");
assertEq(KUNDLI_SHARE_DEFAULT, false, "opt-in default off");
assertEq(GUN_MILAN_SQL_FILE, "supabase/gun_milan.sql", "sql file");
assertEq(KUNDLI_SHARE_SQL_FILE, "supabase/gun_milan.sql", "share sql file");
assertEq(PROKERALA_CLIENT_ID_ENV, "PROKERALA_CLIENT_ID", "client id env");
assertEq(PROKERALA_CLIENT_SECRET_ENV, "PROKERALA_CLIENT_SECRET", "client secret env");
assertEq(PROKERALA_TOKEN_URL, "https://api.prokerala.com/token", "oauth token url");
assert(PROKERALA_KUNDLI_MATCHING_PATH.includes("kundli-matching"), "uses kundli matching");
assert(PROKERALA_API_BASE.includes("api.prokerala.com"), "api host");

assertEq(parseKundliShare(undefined), false, "missing share is off");
assertEq(parseKundliShare(null), false, "null share is off");
assertEq(parseKundliShare(false), false, "false is off");
assertEq(parseKundliShare("false"), false, "string false is off");
assertEq(parseKundliShare(true), true, "true is on");
assertEq(parseKundliShare("yes"), true, "yes is on");
assert(!canShowGunMilanAction({ signedIn: false, kundliShare: true }), "hide when signed out");
assert(!canShowGunMilanAction({ signedIn: true, kundliShare: false }), "hide when opt-in is off");
assert(canShowGunMilanAction({ signedIn: true, kundliShare: true }), "show when signed in and opted in");

assertEq(gunMilanKeysReady({}), false, "missing keys fail closed");
assertEq(gunMilanKeysReady({ PROKERALA_CLIENT_ID: "id" }), false, "id alone fails closed");
assertEq(gunMilanKeysReady({ PROKERALA_CLIENT_SECRET: "secret" }), false, "secret alone fails closed");
assertEq(gunMilanKeysReady({ PROKERALA_CLIENT_ID: "  ", PROKERALA_CLIENT_SECRET: "x" }), false, "blank id fails closed");
assertEq(
  gunMilanKeysReady({ PROKERALA_CLIENT_ID: "id", PROKERALA_CLIENT_SECRET: "secret" }),
  true,
  "both keys open the adapter"
);

const ownMissing = decideGunMilanAccess({
  viewerUserId: "me",
  targetUserId: "them",
  targetStatus: "live",
  kundliShare: true,
  viewerHasBirth: false,
  otherHasBirth: true,
});
assert(!ownMissing.ok && ownMissing.status === 409, "viewer without birth is closed");
assertEq(ownMissing.ok ? "" : ownMissing.error, BIRTH_OWN_MISSING, "own birth copy");

const otherOff = decideGunMilanAccess({
  viewerUserId: "me",
  targetUserId: "them",
  targetStatus: "live",
  kundliShare: false,
  viewerHasBirth: true,
  otherHasBirth: true,
});
assert(!otherOff.ok && otherOff.status === 403, "other opt-in off is closed");

const bothReady = decideGunMilanAccess({
  viewerUserId: "me",
  targetUserId: "them",
  targetStatus: "live",
  kundliShare: true,
  viewerHasBirth: true,
  otherHasBirth: true,
});
assert(bothReady.ok, "both birth plus opt-in is allowed");

const slots = assignChartSlots({
  viewerGender: "F",
  otherGender: "M",
  viewer: "viewer-chart",
  other: "other-chart",
});
assert(slots.ok && slots.girl === "viewer-chart" && slots.boy === "other-chart", "F/M maps to girl/boy");
const same = assignChartSlots({
  viewerGender: "F",
  otherGender: "F",
  viewer: "a",
  other: "b",
});
assert(!same.ok, "same gender is not invented");

const parsed = parseBirthDetailsInput({
  birth_date: "1998-01-15",
  birth_time: "06:30",
  place_name: "Hyderabad",
  latitude: "17.3850",
  longitude: "78.4867",
  timezone: "+05:30",
});
assert(parsed.ok, "complete birth parses");
assert(hasCompleteBirthDetails(parsed.ok ? parsed : null), "complete birth helper");
assertEq(birthChartDatetime(parsed.ok ? parsed : emptyBirthDetails()), "1998-01-15T06:30:00+05:30", "iso datetime");
assertEq(birthChartCoordinates(parsed.ok ? parsed : { latitude: 0, longitude: 0 }), "17.385,78.4867", "coordinates");
assert(birthFingerprint(parsed.ok ? parsed : emptyBirthDetails()).includes("1998-01-15"), "fingerprint uses date");
assert(!hasCompleteBirthDetails(emptyBirthDetails()), "empty birth is incomplete");
assert(!parseBirthDetailsInput({ birth_date: "1998-01-15" }).ok, "partial birth is rejected");

const presented = presentGunMilanReport({
  status: "ok",
  data: {
    guna_milan: {
      total_points: 18,
      maximum_points: 36,
      guna: [
        { id: 1, name: "Varna", girl_koot: "Brahmin", boy_koot: "Brahmin", obtained_points: 1, maximum_points: 1 },
        { id: 8, name: "Nadi", girl_koot: "Madhya", boy_koot: "Antya", obtained_points: 8, maximum_points: 8 },
      ],
    },
    girl_mangal_dosha_details: { has_dosha: false, description: "The person is Not Manglik" },
    boy_mangal_dosha_details: { has_dosha: true, description: "The person is Manglik" },
    message: { type: "good", description: "Union is recommended." },
  },
});
assertEq(presented.total_points, 18, "score is copied from the API");
assertEq(presented.maximum_points, 36, "max is copied from the API");
assertEq(formatScoreLine(presented), "18 / 36", "score line uses API fields");
assertEq(presented.koots.length, 2, "koot rows are copied");
assertEq(presented.koots[0].name, "Varna", "koot name is copied");
assertEq(presented.girl_mangal_dosha_details?.has_dosha, false, "girl manglik is copied");
assertEq(presented.boy_mangal_dosha_details?.has_dosha, true, "boy manglik is copied");
const kootSum = presented.koots.reduce(function (sum, row) {
  return sum + Number(row.obtained_points || 0);
}, 0);
assert(kootSum !== presented.total_points, "fixture proves we do not recompute the total from koots");

assert(looksLikeGunMilanQuestion("What is our Gun Milan score?"), "gun milan question is detected");
assert(looksLikeGunMilanQuestion("Are we manglik compatible?"), "manglik question is detected");
assert(!looksLikeGunMilanQuestion("How do I evaluate whether someone is a real fit?"), "ordinary coaching is not a score guess");
assert(GUN_MILAN_NO_REPORT_REPLY.toLowerCase().includes("will not guess"), "refuse copy");
assert(GUN_MILAN_NO_REPORT_REPLY.toLowerCase().includes("invent"), "refuse invent");

assertEq(readGunMilanTargetId(new URLSearchParams("id=p1")), "p1", "reads id");
assertEq(gunMilanPath("abc"), GUN_MILAN_API_PATH + "?id=abc", "path encodes id");
assertEq(pairProfileIds("b", "a").join(","), "a,b", "pair is ordered");

const publicSelect = browseSelectColumns({
  photo_url: true,
  diet: true,
  user_id: true,
  verifyai_status: true,
  instagram: true,
  biodata_share: true,
  kundli_share: true,
});
GUN_MILAN_PUBLIC_BROWSE_FORBIDDEN.forEach(function (col) {
  assert(!publicSelect.split(",").includes(col), "browse select must not include " + col);
});
BIRTH_PRIVATE_COLUMNS.forEach(function (col) {
  assert(!publicSelect.includes(col), "browse select must not include private " + col);
});
assert(publicSelect.includes("kundli_share"), "opt-in flag may appear");
assert(!publicSelect.includes("profile_birth_details"), "birth table stays off browse");

const leaked = toBrowseProfile({
  id: "live-1",
  full_name: "Priya",
  birth_time: "06:30:00",
  latitude: 17.3,
  longitude: 78.4,
  timezone: "+05:30",
  place_name: "Hyderabad",
  dob: "1998-01-15",
  kundli_share: true,
});
assertEq(leaked?.kundliShare, true, "opt-in maps on the card");
assert(!Object.prototype.hasOwnProperty.call(leaked || {}, "birth_time"), "birth time is not a browse field");
assert(!Object.prototype.hasOwnProperty.call(leaked || {}, "latitude"), "latitude is not a browse field");
assert(!JSON.stringify(leaked).includes("06:30"), "public card JSON has no birth time");
assert(!JSON.stringify(leaked).includes("1998-01-15"), "public card JSON has no dob");

const search = read("app/api/profiles/search/route.ts");
assert(search.includes("KUNDLI_SHARE_COLUMN") || search.includes("kundli_share"), "search may select the opt-in flag");
assert(!search.includes("birth_time"), "search route does not select birth_time");
assert(!search.includes("latitude"), "search route does not select latitude");
assert(!search.includes("profile_birth_details"), "search route does not join birth details");

const guru = read("lib/guru.ts");
assert(guru.includes("loadStoredGunMilanReport"), "guru may load a stored report");
assert(guru.includes("GUN_MILAN_NO_REPORT_REPLY"), "guru uses the refuse copy");
assert(guru.includes("looksLikeGunMilanQuestion"), "guru detects score questions");
assert(!guru.includes("profile-search"), "guru still does not import profile search");
assert(!guru.includes("/api/profiles/search"), "guru still does not search");
assert(!guru.includes("fetchKundliMatching"), "guru does not call the matching API");
assert(!/total_points\s*\+|obtained_points\s*\+/.test(guru), "guru does not add gunas");
assert(guru.toLowerCase().includes("stored gun milan report"), "prompt allows stored report only");
assert(guru.toLowerCase().includes("will not guess") || guru.toLowerCase().includes("refuse to guess"), "prompt refuses guesses");

assert(GURU_INTRO.toLowerCase().includes("gun milan"), "intro mentions Gun Milan");
assert(GURU_INTRO.toLowerCase().includes("will not guess"), "intro refuses guesses");
assert(
  GURU_STARTERS.some(function (item) {
    return item.id === "gunmilan";
  }),
  "starter for stored report"
);

const provider = read("lib/gun-milan-prokerala.ts");
assert(provider.includes("PROKERALA_TOKEN_URL") || provider.includes("api.prokerala.com/token"), "oauth token");
assert(provider.includes("PROKERALA_KUNDLI_MATCHING_PATH"), "kundli matching endpoint");
assert(provider.includes("client_credentials"), "oauth client credentials");
assert(!provider.includes("astrosage"), "do not call AstroSage");
assert(!provider.includes("divineapi"), "DivineAPI is not integrated");
assert(!/total_points\s*=/.test(provider), "adapter does not assign invented totals");

const adapter = read("lib/gun-milan-provider.ts");
assert(adapter.includes("GunMilanProvider"), "provider interface exists");
assert(adapter.toLowerCase().includes("divineapi"), "DivineAPI is named only as a later adapter");
assert(!adapter.includes("fetch("), "interface file does not call DivineAPI");

const server = read("lib/gun-milan-server.ts");
assert(server.includes("GUN_MILAN_REPORTS_TABLE"), "reports are persisted");
assert(server.includes("birth_fingerprint"), "cache invalidates when birth details change");
assert(server.includes("getGunMilanProvider"), "server uses the adapter");
assert(!server.includes("astrosage"), "server does not call AstroSage");

const sql = read(GUN_MILAN_SQL_FILE);
assert(sql.includes("add column if not exists kundli_share"), "sql adds kundli_share");
assert(/default false/i.test(sql), "sql defaults opt-in off");
assert(sql.includes("create table if not exists public.profile_birth_details"), "sql adds birth details");
assert(sql.includes("enable row level security"), "rls on");
assert(sql.includes("auth.uid() = user_id"), "owner read/write birth details");
assert(sql.includes("create table if not exists public.gun_milan_reports"), "sql adds report cache");
assert(!/add column if not exists religion|create table.*religion/i.test(sql), "do not invent a religion column");
assert(!/add column if not exists caste|create table.*caste/i.test(sql), "do not invent a caste column");
assert(sql.includes("Sai") || sql.includes("CoS"), "sql tells Sai or CoS to apply it");

const envExample = read(".env.example");
assert(envExample.includes("PROKERALA_CLIENT_ID"), "env example lists client id");
assert(envExample.includes("PROKERALA_CLIENT_SECRET"), "env example lists client secret");
assert(!/\nPROKERALA_CLIENT_SECRET=.+/.test(envExample.replace("PROKERALA_CLIENT_SECRET=", "PROKERALA_CLIENT_SECRET=")), "env example has no secret value");

const account = read("app/account/page.tsx");
assert(account.includes("BirthDetailsFields"), "account can save birth details");
assert(account.includes("KundliShareField"), "account has kundli opt-in");
assert(account.includes("kundli_share"), "account persists the opt-in");

const discover = read("app/components/DiscoverCard.tsx");
assert(discover.includes("GunMilanPanel"), "Browse profile can open Gun Milan");
assert(discover.includes("canShowGunMilanAction"), "Browse hides the action unless opted in");
const match = read("app/components/MatchCard.tsx");
assert(match.includes("GunMilanPanel"), "Matches profile can open Gun Milan");
assert(match.includes("canShowGunMilanAction"), "Matches hides the action unless opted in");

const write = read("app/api/profiles/route.ts");
assert(write.includes("parseKundliShare"), "POST/PATCH persist kundli opt-in");
assert(write.includes("KUNDLI_SHARE_COLUMN"), "writes the locked column");

const birthRoute = read("app/api/birth-details/route.ts");
assert(birthRoute.includes("export async function GET"), "own birth GET");
assert(birthRoute.includes("export async function PUT"), "own birth PUT");
assert(birthRoute.includes("hasBearerToken"), "birth details are signed in");

const milanRoute = read("app/api/gun-milan/route.ts");
assert(milanRoute.includes("lookupGunMilan"), "pair lookup uses the server helper");
assert(milanRoute.includes("hasBearerToken"), "Gun Milan is signed in");
assert(!milanRoute.includes("NEXT_PUBLIC_PROKERALA"), "secrets stay server only");

const allSrc = [
  "lib/gun-milan.ts",
  "lib/gun-milan-prokerala.ts",
  "lib/gun-milan-server.ts",
  "lib/guru.ts",
  "app/api/gun-milan/route.ts",
].map(read).join("\n");
assert(!/astrosage/i.test(allSrc), "no AstroSage");
assert(!/divineapi\.com/i.test(allSrc), "no DivineAPI host");

console.log("gun milan locks ok", {
  provider: GUN_MILAN_PROVIDER_ID,
  sql: GUN_MILAN_SQL_FILE,
  table: GUN_MILAN_REPORTS_TABLE,
  score: formatScoreLine(presented),
});

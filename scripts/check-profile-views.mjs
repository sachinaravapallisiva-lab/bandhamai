import { readFileSync } from "node:fs";
import {
  PREVIEW_PROFILE_IDS,
  PROFILE_VIEWS_PATH,
  PROFILE_VIEWS_SQL_FILE,
  PROFILE_VIEWS_TABLE,
  SEEN_CHIP_LABEL,
  WHO_VIEWED_YOU_BODY,
  WHO_VIEWED_YOU_EMPTY,
  WHO_VIEWED_YOU_KICKER,
  WHO_VIEWED_YOU_SECTION_ID,
  WHO_VIEWED_YOU_SIGN_IN,
  WHO_VIEWED_YOU_TITLE,
  attachSeen,
  isPreviewProfileId,
  shouldRecordProfileView,
  viewedAtLabel,
} from "../lib/profile-views.ts";

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

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const DASH = /[-–—]/;
const OLD_TABLES =
  /\b(alter table|enable row level security|create table|drop table|create policy)[\s\S]{0,80}\b(saves|interests|searches|signals|feedback|photo_grants)\b/i;

assert(PROFILE_VIEWS_TABLE === "profile_views", "table name lock");
assert(PROFILE_VIEWS_SQL_FILE === "supabase/profile_views.sql", "SQL file lock");
assert(PROFILE_VIEWS_PATH === "/api/profile-views", "API path lock");
assert(SEEN_CHIP_LABEL === "Seen", "chip label lock");
assert(WHO_VIEWED_YOU_TITLE === "Who viewed you", "section title lock");
assert(WHO_VIEWED_YOU_KICKER === "YOUR HISTORY", "kicker lock");
assert(WHO_VIEWED_YOU_SECTION_ID === "viewed", "account hash lock");
assert(WHO_VIEWED_YOU_BODY.includes("Only you can see this"), "own history copy");
assert(WHO_VIEWED_YOU_BODY.includes("Newest first"), "newest first copy");
assert(WHO_VIEWED_YOU_EMPTY === "No one has viewed your profile yet.", "empty copy lock");
assert(WHO_VIEWED_YOU_SIGN_IN === "Sign in to see who viewed you.", "sign in copy lock");

const copy = [
  SEEN_CHIP_LABEL,
  WHO_VIEWED_YOU_TITLE,
  WHO_VIEWED_YOU_KICKER,
  WHO_VIEWED_YOU_BODY,
  WHO_VIEWED_YOU_EMPTY,
  WHO_VIEWED_YOU_SIGN_IN,
];
copy.forEach(function (value) {
  assert(!DASH.test(value), "user-facing views copy must not use a hyphen or dash: " + value);
  assert(!/boost|crown|millions/i.test(value), "views copy stays Soft Minimal: " + value);
});

assert(shouldRecordProfileView({ signedIn: false, profileId: "p1" }) === false, "signed out does not record");
assert(shouldRecordProfileView({ signedIn: true, preview: true, profileId: "p1" }) === false, "layout preview does not record");
assert(shouldRecordProfileView({ signedIn: true, profileId: "priya" }) === false, "Priya preview id does not record");
assert(shouldRecordProfileView({ signedIn: true, profileId: "" }) === false, "empty id does not record");
assert(
  shouldRecordProfileView({ signedIn: true, profileId: "p1", viewerProfileId: "p1" }) === false,
  "own card does not record"
);
assert(
  shouldRecordProfileView({
    signedIn: true,
    profileId: "p1",
    viewerUserId: "u1",
    viewedUserId: "u1",
  }) === false,
  "own user does not record"
);
assert(shouldRecordProfileView({ signedIn: true, profileId: "p1" }) === true, "signed in open records");
assert(isPreviewProfileId("Priya") === true, "Priya is a preview id");
assert(PREVIEW_PROFILE_IDS.includes("priya"), "Priya stays in the preview list");

const attached = attachSeen([{ id: "a", seen: false }, { id: "b", seen: false }], ["b"]);
assert(attached[0].seen === false, "unopened card stays unseen");
assert(attached[1].seen === true, "opened card is seen");

const now = Date.parse("2026-08-25T12:00:00.000Z");
assertEq(viewedAtLabel("2026-08-25T11:59:30.000Z", now), "Just now", "just now");
assertEq(viewedAtLabel("2026-08-25T11:50:00.000Z", now), "10 minutes ago", "minutes");
assertEq(viewedAtLabel("2026-08-25T10:00:00.000Z", now), "2 hours ago", "hours");
assertEq(viewedAtLabel("2026-08-24T12:00:00.000Z", now), "Yesterday", "yesterday");
assertEq(viewedAtLabel("2026-08-10T12:00:00.000Z", now), "10 August 2026", "calendar date");
assert(!DASH.test(viewedAtLabel("2026-08-10T12:00:00.000Z", now)), "date label has no hyphen");

const sql = read("supabase/profile_views.sql");
assert(sql.includes("Bandham AI"), "SQL uses the two word product name");
assert(sql.includes("create table if not exists public.profile_views"), "creates profile_views");
assert(sql.includes("viewer_id"), "viewer_id");
assert(sql.includes("profile_id"), "profile_id");
assert(sql.includes("created_at"), "created_at");
assert(sql.includes("profile_views_pair_unique") || sql.includes("unique (viewer_id, profile_id)"), "unique pair");
assert(sql.includes("enable row level security"), "RLS on");
assert(sql.includes("revoke all on public.profile_views from public, anon"), "no anon read");
assert(sql.includes("grant all on public.profile_views to service_role"), "service role");
assert(sql.includes("profile_views_select_own"), "select own or incoming");
assert(sql.includes("profile_views_insert_own"), "viewer insert");
assert(sql.includes("profile_views_update_own"), "viewer update for repeat opens");
assert(sql.includes("auth.uid() = viewer_id"), "viewer can read outgoing");
assert(sql.includes("auth.uid() = viewed_user_id") || sql.includes("profiles p"), "viewed person can read incoming");
assert(!sql.includes("to anon"), "no anon grant or policy");
assert(!/create policy[\s\S]*anon/i.test(sql), "no anon policy");
assert(!OLD_TABLES.test(sql), "SQL must not touch the old tables");
assert(!/\braised_in\b/.test(sql), "SQL must not invent raised_in");
assert(!/\bmatch_percent\b|\bcompatibility\b/i.test(sql), "SQL must not invent match %");
assert(!/enable row level security[\s\S]*\b(saves|interests|feedback)\b/i.test(sql), "do not enable RLS on old tables");

const api = read("app/api/profile-views/route.ts");
assert(api.includes("export async function POST"), "record is POST");
assert(api.includes("export async function GET"), "history is GET");
assert(api.includes("hasBearerToken"), "auth required");
assert(api.includes("recordProfileView"), "POST writes through the helper");
assert(api.includes("loadIncomingViewers"), "GET loads own incoming");
assert(api.includes("table_missing") || api.includes("PROFILE_VIEWS_SQL_FILE"), "asks operators to run SQL");
assert(!/entitlement|canMessage|STRIPE_|subscriptions/i.test(api), "views stay free of the messaging plan");
assert(!/resend|nodemailer|webpush|push notification/i.test(api), "no email or push");
assert(!/\.from\(\s*["']feedback["']\s*\)/.test(api), "do not write views into feedback");

const search = read("app/api/profiles/search/route.ts");
assert(search.includes("loadOutgoingViewedIds"), "Browse search attaches prior opens");
assert(search.includes("attachSeen"), "Browse cards get seen");
assert(search.includes("viewerId"), "seen is only for a signed in viewer");

const mapper = read("lib/profile-search.ts");
assert(mapper.includes("seen:"), "BrowseProfile has seen");
assert(mapper.includes("seen: row.seen === true"), "mapper does not invent seen");

const discover = read("app/components/DiscoverCard.tsx");
assert(discover.includes("RecordProfileView"), "Browse open records a view");
assert(discover.includes("SeenChip"), "Browse can show Seen");
assert(discover.includes("seen={profile.seen}"), "Browse chip uses a prior open, not this first open");
assert(!/Boost|Crown/.test(discover), "Browse card is not dating chrome");

const match = read("app/components/MatchCard.tsx");
assert(match.includes("SeenChip"), "Matches can show Seen");
assert(match.includes("seen={profile.seen}"), "Matches chip reads seen");
assert(!match.includes("RecordProfileView"), "Matches list render does not write views");
assert(!match.includes("PROFILE_VIEWS_PATH"), "Matches list does not POST views");

const record = read("app/components/RecordProfileView.tsx");
assert(record.includes("PROFILE_VIEWS_PATH"), "recorder posts to the views API");
assert(record.includes("shouldRecordProfileView"), "recorder uses the shared guard");
assert(record.includes("preview"), "recorder can skip a layout preview");

const chip = read("app/components/SeenChip.tsx");
assert(chip.includes("SEEN_CHIP_LABEL"), "chip uses the locked label");
assert(chip.includes("CREAM") || chip.includes("#FDF8F1"), "chip sits on cream");
assert(chip.includes("if (!seen || own) return null"), "no Seen on an unseen or own card");
assert(!/Boost|Crown|stamp/i.test(stripComments(chip)), "chip is not a swipe stamp");

const who = read("app/components/WhoViewedYou.tsx");
assert(who.includes("WHO_VIEWED_YOU_TITLE"), "section title");
assert(who.includes("PROFILE_VIEWS_PATH"), "loads own incoming views");
assert(who.includes("viewedAtLabel"), "newest first list uses the quiet time label");
assert(!/Boost|Crown|millions/i.test(who), "Who viewed you stays Soft Minimal");
assert(!DASH.test(WHO_VIEWED_YOU_TITLE), "title has no hyphen");

const page = read("app/page.tsx");
assert(page.includes("WhoViewedYou"), "Matches can show Who viewed you");
assert(page.includes("onViewed"), "Browse open can remember Seen for Matches");
const priyaBlock = page.slice(page.indexOf("Priya"), page.indexOf("Priya") + 500);
assert(!priyaBlock.includes("RecordProfileView"), "home Chat preview Priya does not record a view");
assert(!priyaBlock.includes("PROFILE_VIEWS_PATH"), "home Chat preview does not POST views");
assert(!priyaBlock.includes("SeenChip"), "home Chat preview is not a Seen card");

const account = read("app/account/page.tsx");
assert(account.includes("WhoViewedYou"), "Account shows Who viewed you");
assert(account.includes("see who viewed you"), "Account copy names the section");

const ownProfile = read("app/profile/new/page.tsx");
assert(!ownProfile.includes("SeenChip"), "own profile form does not show Seen");
assert(!ownProfile.includes("RecordProfileView"), "own profile form does not record a view");

const chat = read("app/chat/page.tsx");
assert(!chat.includes("RecordProfileView"), "live chat is not a profile open recorder");
assert(!chat.includes("SeenChip"), "chat is not a Seen stamp");

const speed = read("app/components/SpeedMatch.tsx");
assert(!speed.includes("RecordProfileView"), "Speed Match does not write views");

const billing = read("app/api/stripe/checkout/route.ts");
assert(!billing.includes("profile_views"), "Stripe checkout is unchanged");

const instagram = read("app/components/InstagramShareControls.tsx");
assert(!instagram.includes("profile_views"), "Instagram share is unchanged");

console.log("profile views ok", {
  table: PROFILE_VIEWS_TABLE,
  chip: SEEN_CHIP_LABEL,
  section: WHO_VIEWED_YOU_TITLE,
});

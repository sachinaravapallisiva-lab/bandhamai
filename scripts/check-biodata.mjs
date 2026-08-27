import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import {
  BIODATA_API_PATH,
  BIODATA_BASE_COLUMNS,
  BIODATA_DOWNLOAD_LABEL,
  BIODATA_FAILED_ERROR,
  BIODATA_NO_PROFILE_ERROR,
  BIODATA_OPTIONAL_COLUMNS,
  BIODATA_PREPARING_LABEL,
  BIODATA_PRODUCT,
  BIODATA_SECTION_ABOUT,
  BIODATA_SECTION_DETAILS,
  BIODATA_SECTION_LOOKING,
  BIODATA_SHARE_TITLE,
  BIODATA_SIGNED_IN_ERROR,
  BIODATA_TAGLINE,
  BIODATA_VERIFIED_LABEL,
  BIODATA_VERIFYAI_MARK,
  ageYearsFromDob,
  biodataContentDisposition,
  biodataFilename,
  buildBiodataPdf,
  displayGender,
  firstNameSlug,
  profileToBiodataModel,
} from "../lib/biodata.ts";
import {
  BIODATA_NOT_SHARED_ERROR,
  BIODATA_OTHER_SIGNED_IN_ERROR,
  BIODATA_SHARE_COLUMN,
  BIODATA_SHARE_DEFAULT,
  BIODATA_SHARE_HINT,
  BIODATA_SHARE_LABEL,
  BIODATA_SHARE_SAVE_LABEL,
  BIODATA_SHARE_SAVING_LABEL,
  BIODATA_SHARE_SQL_FILE,
  BIODATA_SHARE_SQL_HINT,
  BIODATA_UNAVAILABLE_ERROR,
  biodataDownloadPath,
  canShowOtherBiodataDownload,
  decideBiodataAccess,
  parseBiodataShare,
  readBiodataTargetId,
} from "../lib/biodata-share.ts";
import { LIVE_PROFILE_STATUS } from "../lib/profile-search.ts";
import { GOLD, VIOLET } from "../lib/theme.ts";
import { isVerifyaiVerified } from "../lib/verifyai.ts";

function hexPdfRgb(hex) {
  const raw = hex.replace("#", "");
  return [
    parseInt(raw.slice(0, 2), 16) / 255,
    parseInt(raw.slice(2, 4), 16) / 255,
    parseInt(raw.slice(4, 6), 16) / 255,
  ].join(" ");
}

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

const copy = [
  BIODATA_DOWNLOAD_LABEL,
  BIODATA_PREPARING_LABEL,
  BIODATA_SIGNED_IN_ERROR,
  BIODATA_NO_PROFILE_ERROR,
  BIODATA_FAILED_ERROR,
  BIODATA_PRODUCT,
  BIODATA_TAGLINE,
  BIODATA_SHARE_TITLE,
  BIODATA_SECTION_DETAILS,
  BIODATA_SECTION_ABOUT,
  BIODATA_SECTION_LOOKING,
  BIODATA_VERIFIED_LABEL,
  BIODATA_VERIFYAI_MARK,
  BIODATA_SHARE_LABEL,
  BIODATA_SHARE_HINT,
  BIODATA_SHARE_SAVE_LABEL,
  BIODATA_SHARE_SAVING_LABEL,
  BIODATA_NOT_SHARED_ERROR,
  BIODATA_UNAVAILABLE_ERROR,
  BIODATA_OTHER_SIGNED_IN_ERROR,
];
copy.forEach(function (text) {
  assert(!text.includes("-") && !text.includes("—") && !text.includes("–"), "user-facing copy has no hyphen: " + text);
  assert(!/bandhan\b/i.test(text), "product name is Bandham, not Bandhan: " + text);
});
assertEq(BIODATA_PRODUCT, "Bandham AI", "product lock");
assertEq(BIODATA_TAGLINE, "Find your vibe match?", "tagline lock");
assertEq(BIODATA_DOWNLOAD_LABEL, "Download biodata", "button label");
assertEq(BIODATA_API_PATH, "/api/profiles/biodata", "api path");
assertEq(BIODATA_SECTION_DETAILS, "DETAILS", "details section");
assertEq(BIODATA_SECTION_ABOUT, "ABOUT", "about section");
assertEq(BIODATA_SECTION_LOOKING, "LOOKING FOR", "looking for section");
assertEq(BIODATA_VERIFIED_LABEL, "Verified", "pdf verified word");
assertEq(BIODATA_VERIFYAI_MARK, "VerifyAI", "pdf VerifyAI mark");

assertEq(displayGender("F"), "Female", "F maps to Female");
assertEq(displayGender("M"), "Male", "M maps to Male");
assertEq(displayGender("Female"), "Female", "Female stays");
assertEq(firstNameSlug("Priya Reddy"), "priya", "first name slug");
assertEq(biodataFilename("Priya Reddy"), "bandham-biodata-priya.pdf", "filename uses first name");
assertEq(biodataFilename(""), "bandham-biodata-member.pdf", "empty name falls back");
assertEq(biodataContentDisposition("bandham-biodata-priya.pdf"), 'attachment; filename="bandham-biodata-priya.pdf"', "disposition");

const now = new Date(Date.UTC(2026, 7, 23));
assertEq(ageYearsFromDob("1998-08-23", now), "28", "age on birthday");
assertEq(ageYearsFromDob("1998-08-24", now), "27", "age day before birthday");
assertEq(ageYearsFromDob("", now), "", "missing dob is omitted");
assertEq(ageYearsFromDob("2012-01-01", now), "", "under 18 is omitted");
assertEq(ageYearsFromDob("not-a-date", now), "", "invalid dob is omitted");

const empty = profileToBiodataModel(
  { id: "1", user_id: "owner", full_name: "Priya", gender: "", city: "", about: "" },
  { viewerUserId: "owner", now }
);
assertEq(empty.rows.length, 0, "empty fields omit rows");
assertEq(empty.about, "", "empty about omitted");
assert(!empty.verified, "unverified has no badge");
assertEq(empty.instagram, "", "no handle stays empty");

const full = profileToBiodataModel(
  {
    id: "2",
    user_id: "owner",
    full_name: "Priya Reddy",
    gender: "F",
    city: "Hyderabad",
    mother_tongue: "Telugu",
    visa_status: "H-1B",
    education: "MBBS",
    profession: "Paediatrician",
    diet: "Vegetarian",
    about: "Near family.",
    wants: "A doctor in Hyderabad.",
    dob: "1998-01-01",
    instagram: "ananya",
    verifyai_status: "verified",
    photo_url: "https://example.supabase.co/storage/v1/object/public/profile-photos/owner/a.webp",
    phone: "9999999999",
    religion: "Hindu",
    caste: "Reddy",
    family: "Joint family",
  },
  { viewerUserId: "owner", now }
);
const labels = full.rows.map(function (row) {
  return row.label;
});
assert(labels.includes("AGE"), "dob becomes AGE");
assert(labels.includes("CITY"), "city row");
assert(labels.includes("VISA STATUS"), "visa row");
assert(labels.includes("DIET"), "diet row");
assert(labels.includes("INSTAGRAM"), "owner sees own Instagram");
assertEq(full.rows.find(function (row) { return row.label === "GENDER"; })?.value, "Female", "gender display");
assertEq(full.instagram, "ananya", "owner handle");
assert(full.verified, "verified badge on");
assertEq(full.about, "Near family.", "about kept");
assert(!labels.includes("PHONE"), "phone is not a biodata row");
assert(!labels.includes("RELIGION"), "do not invent a religion row from leftover keys");
assert(!labels.includes("CASTE"), "do not invent a caste row");
assert(!labels.includes("FAMILY"), "do not invent a family row");
assert(!labels.includes("DOB"), "raw dob is not printed");

const stranger = profileToBiodataModel(
  { id: "3", user_id: "owner", full_name: "Priya", instagram: "ananya", verifyai_status: "pending" },
  { viewerUserId: "viewer", now }
);
assertEq(stranger.instagram, "", "Instagram stays hidden without a share");
assert(!stranger.rows.some(function (row) { return row.label === "INSTAGRAM"; }), "no Instagram row for other people");
assert(!stranger.verified, "pending is not a badge");
assert(!isVerifyaiVerified("pending"), "pending lock");

const granted = profileToBiodataModel(
  { id: "4", user_id: "owner", full_name: "Priya", instagram: "ananya" },
  { viewerUserId: "viewer", granted: true, now }
);
assertEq(granted.instagram, "ananya", "explicit share reveals the handle");

assert(BIODATA_BASE_COLUMNS.includes("full_name"), "name is a real column");
assert(BIODATA_OPTIONAL_COLUMNS.includes("dob"), "dob is optional, not invented age");
assert(BIODATA_OPTIONAL_COLUMNS.includes("diet"), "diet is optional");
assert(!BIODATA_BASE_COLUMNS.includes("phone"), "phone is not selected");
assert(!BIODATA_OPTIONAL_COLUMNS.includes("phone"), "phone is not an optional biodata column");
assert(!BIODATA_OPTIONAL_COLUMNS.includes("religion"), "religion is not a column");
assert(!BIODATA_OPTIONAL_COLUMNS.includes("caste"), "caste is not a column");
assert(!BIODATA_OPTIONAL_COLUMNS.includes("family"), "family is not a column");

const pdfBytes = await buildBiodataPdf(full);
const header = Buffer.from(pdfBytes.subarray(0, 4)).toString("latin1");
assertEq(header, "%PDF", "pdf-lib writes a PDF");
assert(pdfBytes.length > 400, "pdf is not empty");

function inflatePdfStreams(bytes) {
  const raw = Buffer.from(bytes);
  const chunks = [];
  let cursor = 0;
  while (true) {
    const start = raw.indexOf(Buffer.from("stream"), cursor);
    if (start < 0) break;
    const dataStart = start + 6 + (raw[start + 6] === 13 ? 2 : 1);
    const end = raw.indexOf(Buffer.from("endstream"), dataStart);
    if (end < 0) break;
    const slice = raw.subarray(dataStart, end);
    try {
      chunks.push(inflateSync(slice).toString("latin1"));
    } catch {
      chunks.push(slice.toString("latin1"));
    }
    cursor = end + 9;
  }
  return chunks.join("\n");
}

function decodePdfText(bytes) {
  const stream = inflatePdfStreams(bytes);
  const parts = [];
  const hex = /<([0-9A-Fa-f]+)>/g;
  let match;
  while ((match = hex.exec(stream))) {
    parts.push(Buffer.from(match[1], "hex").toString("latin1"));
  }
  const paren = /\(([^\\)]*)\)/g;
  while ((match = paren.exec(stream))) {
    parts.push(match[1]);
  }
  return { stream, text: parts.join("\n") };
}

const decoded = decodePdfText(pdfBytes);
assert(decoded.text.includes(BIODATA_PRODUCT), "pdf prints Bandham AI");
assert(decoded.text.includes(BIODATA_TAGLINE), "pdf prints the tagline");
assert(decoded.text.includes(BIODATA_SECTION_DETAILS), "pdf prints DETAILS");
assert(decoded.text.includes(BIODATA_SECTION_ABOUT), "pdf prints ABOUT");
assert(decoded.text.includes(BIODATA_SECTION_LOOKING), "pdf prints LOOKING FOR");
assert(decoded.text.includes(BIODATA_VERIFIED_LABEL), "pdf prints Verified");
assert(decoded.text.includes(BIODATA_VERIFYAI_MARK), "pdf prints VerifyAI");
assert(decoded.text.includes("Priya Reddy"), "pdf prints the name");
assert(!/Bandhan\b/.test(decoded.text), "pdf product name is Bandham");
assert(decoded.stream.includes(hexPdfRgb(VIOLET)), "pdf paints theme VIOLET");
assert(!decoded.stream.includes(hexPdfRgb(GOLD)), "pdf does not paint GOLD");

const sparsePdf = await buildBiodataPdf(empty);
assertEq(Buffer.from(sparsePdf.subarray(0, 4)).toString("latin1"), "%PDF", "sparse profile still makes a PDF");
assert(sparsePdf.length > 400, "empty photo profile still makes a PDF");
const sparseDecoded = decodePdfText(sparsePdf);
assert(sparseDecoded.text.includes(BIODATA_PRODUCT), "sparse pdf stays branded");
assert(!sparseDecoded.text.includes(BIODATA_SECTION_DETAILS), "empty fields omit DETAILS");
assert(!sparseDecoded.text.includes(BIODATA_VERIFIED_LABEL), "unverified pdf has no Verified mark");

const biodataSrc = read("lib/biodata.ts");
assert(biodataSrc.includes("COLOR_VIOLET"), "pdf wires theme VIOLET");
assert(biodataSrc.includes("VIOLET_DEEP"), "pdf wires VIOLET_DEEP");
assert(biodataSrc.includes("function drawVerifyShield"), "VerifyAI shield is drawn");
assert(
  /function drawVerifyShield[\s\S]*color:\s*COLOR_VIOLET/.test(biodataSrc),
  "VerifyAI shield fill is violet"
);
assert(!/\bGOLD\b/.test(biodataSrc), "pdf chrome is not gold");
assert(!/#C4A36A|#FFD700|#F5C518/i.test(biodataSrc), "no gold hex on the pdf");
assert(!/#16[Aa]34[Aa]|#22[Cc]55[Ee]|#15803[Dd]|#10[Bb]981/i.test(biodataSrc), "VerifyAI is not green");
assert(!/#1[Dd]9[Bb][Ff]0|#1[Dd][Aa]1[Ff]2|#1877[Ff]2|#0[Aa]66[Cc]2/i.test(biodataSrc), "VerifyAI is not a blue tick");
assert(biodataSrc.includes("BIODATA_VERIFIED_LABEL") || biodataSrc.includes("badgeLabel"), "pdf uses Verified lock");
assert(biodataSrc.includes("colWidth"), "facts use a two column grid");

assertEq(parseBiodataShare(undefined), false, "missing share is off");
assertEq(parseBiodataShare(null), false, "null share is off");
assertEq(parseBiodataShare(false), false, "false is off");
assertEq(parseBiodataShare("false"), false, "string false is off");
assertEq(parseBiodataShare(""), false, "empty share is off");
assertEq(parseBiodataShare("no"), false, "no is off");
assertEq(parseBiodataShare(0), false, "0 is off");
assertEq(parseBiodataShare(true), true, "true is on");
assertEq(parseBiodataShare("true"), true, "string true is on");
assertEq(parseBiodataShare("TRUE"), true, "TRUE is on");
assertEq(parseBiodataShare(1), true, "1 is on");
assertEq(parseBiodataShare("1"), true, "string 1 is on");
assertEq(parseBiodataShare("yes"), true, "yes is on");
assertEq(parseBiodataShare("on"), true, "on is on");
assertEq(BIODATA_SHARE_DEFAULT, false, "default stays off");
assertEq(BIODATA_SHARE_COLUMN, "biodata_share", "column lock");
assertEq(LIVE_PROFILE_STATUS, "live", "live status lock for other-profile gate");

assertEq(biodataDownloadPath(), BIODATA_API_PATH, "own download uses the base path");
assertEq(biodataDownloadPath("abc"), BIODATA_API_PATH + "?id=abc", "other download uses id");
assertEq(
  biodataDownloadPath("a b"),
  BIODATA_API_PATH + "?id=" + encodeURIComponent("a b"),
  "id is encoded"
);
assertEq(readBiodataTargetId(new URLSearchParams("id=p1")), "p1", "reads id");
assertEq(readBiodataTargetId(new URLSearchParams("profile_id=p2")), "p2", "reads profile_id");
assertEq(readBiodataTargetId(new URLSearchParams("id=p1&profile_id=p2")), "p1", "id wins over profile_id");
assertEq(readBiodataTargetId(new URLSearchParams("")), "", "missing target stays empty");

const ownLookup = decideBiodataAccess({
  viewerUserId: "me",
  isOwnLookup: true,
  biodataShare: false,
  targetStatus: "pending",
});
assert(ownLookup.ok && ownLookup.kind === "own", "own lookup is always allowed");

const ownById = decideBiodataAccess({
  viewerUserId: "me",
  targetUserId: "me",
  targetStatus: "pending",
  biodataShare: false,
  isOwnLookup: false,
});
assert(ownById.ok && ownById.kind === "own", "own id is always allowed");

const pendingOther = decideBiodataAccess({
  viewerUserId: "me",
  targetUserId: "them",
  targetStatus: "pending",
  biodataShare: true,
  isOwnLookup: false,
});
assert(!pendingOther.ok && pendingOther.status === 404, "pending other is 404");

const missingOther = decideBiodataAccess({
  viewerUserId: "me",
  targetUserId: "them",
  targetStatus: "",
  biodataShare: true,
  isOwnLookup: false,
});
assert(!missingOther.ok && missingOther.status === 404, "unknown status is 404");

const liveOff = decideBiodataAccess({
  viewerUserId: "me",
  targetUserId: "them",
  targetStatus: "live",
  biodataShare: false,
  isOwnLookup: false,
});
assert(!liveOff.ok && liveOff.status === 403, "live without opt-in is 403");
assertEq(liveOff.ok ? "" : liveOff.error, BIODATA_NOT_SHARED_ERROR, "403 copy");

const liveOn = decideBiodataAccess({
  viewerUserId: "me",
  targetUserId: "them",
  targetStatus: "live",
  biodataShare: "true",
  isOwnLookup: false,
});
assert(liveOn.ok && liveOn.kind === "other", "live plus string true is allowed");

assert(!canShowOtherBiodataDownload({ signedIn: false, biodataShare: true }), "hide when signed out");
assert(!canShowOtherBiodataDownload({ signedIn: true, biodataShare: false }), "hide when opt-in is off");
assert(canShowOtherBiodataDownload({ signedIn: true, biodataShare: true }), "show when signed in and opted in");

const route = read("app/api/profiles/biodata/route.ts");
assert(route.includes("export async function GET"), "server GET generates the PDF");
assert(route.includes("hasBearerToken"), "auth required");
assert(route.includes("eq(\"user_id\", user.id)") || route.includes(".eq(\"user_id\", user.id)"), "own profile path remains");
assert(route.includes("eq(\"id\", targetId)") || route.includes(".eq(\"id\", targetId)"), "other profile by id");
assert(route.includes("readBiodataTargetId"), "accepts id or profile_id");
assert(route.includes("decideBiodataAccess"), "opt-in gate is server-side");
assert(route.includes("findInstagramShare") || route.includes("revealInstagramHandle"), "other-profile Instagram still uses share rows");
assert(route.includes("buildBiodataPdf"), "uses shared pdf builder");
assert(route.includes("revealInstagramHandle") || route.includes("profileToBiodataModel"), "instagram privacy goes through the model");
assert(route.includes("isVerifyaiVerified") || route.includes("profileToBiodataModel"), "verifyai goes through the model");
assert(!/stripe|checkout|price_/i.test(route), "no new Stripe on biodata");
assert(!/phone|embedding/.test(route), "route does not select phone or embedding");

const button = read("app/components/DownloadBiodata.tsx");
assert(button.includes("BIODATA_DOWNLOAD_LABEL"), "button uses locked label");
assert(button.includes("navigator.share"), "mobile share sheet when available");
assert(button.includes("download"), "falls back to file download");
assert(button.includes("biodataDownloadPath") || button.includes(BIODATA_API_PATH), "hits the API");
assert(button.includes("profileId"), "button can target another profile");

const account = read("app/account/page.tsx");
assert(account.includes("DownloadBiodata"), "Account has Download biodata");
assert(account.includes("Your profile"), "stays next to Your profile");

const profile = read("app/profile/new/page.tsx");
assert(profile.includes("DownloadBiodata"), "profile screen has Download biodata");
assert(profile.includes("BiodataShareField"), "create form has biodata opt-in");
assert(profile.includes("biodata_share"), "create form persists the opt-in");

assert(account.includes("BiodataShareField"), "account edit has biodata opt-in");
assert(account.includes("biodata_share"), "account can save the opt-in");

const field = read("app/components/BiodataShareField.tsx");
assert(field.includes("BIODATA_SHARE_LABEL"), "checkbox uses locked label");
assert(field.includes("type=\"checkbox\"") || field.includes('type="checkbox"'), "opt-in is a checkbox");

const sql = read(BIODATA_SHARE_SQL_FILE);
assert(sql.includes("add column if not exists biodata_share"), "sql adds biodata_share");
assert(/default false/i.test(sql), "sql defaults off");
assert(sql.includes("boolean"), "sql column is boolean");
assert(!/default true/i.test(sql), "sql must not default on");
assertEq(BIODATA_SHARE_SQL_HINT.includes(BIODATA_SHARE_SQL_FILE), true, "hint names the sql file");

const write = read("app/api/profiles/route.ts");
assert(write.includes("parseBiodataShare"), "POST/PATCH persist the opt-in");
assert(write.includes("BIODATA_SHARE_COLUMN"), "writes the locked column");
assert(write.includes("hasShare") || write.includes("biodata_share"), "PATCH can save share without Instagram");

const discover = read("app/components/DiscoverCard.tsx");
assert(discover.includes("DownloadBiodata"), "Browse card can show Download biodata");
assert(discover.includes("canShowOtherBiodataDownload"), "Browse hides the button unless opted in");
const match = read("app/components/MatchCard.tsx");
assert(match.includes("DownloadBiodata"), "Matches card can show Download biodata");
assert(match.includes("canShowOtherBiodataDownload"), "Matches hides the button unless opted in");

const search = read("app/api/profiles/search/route.ts");
assert(search.includes("BIODATA_SHARE_COLUMN") || search.includes("biodata_share"), "search selects the opt-in flag");
assert(!/stripe|checkout|price_/i.test(search), "search still has no Stripe");

const pkg = read("package.json");
assert(pkg.includes("\"pdf-lib\""), "pdf-lib is the PDF library");

console.log("biodata download ok", {
  filename: biodataFilename("Priya Reddy"),
  rows: labels,
  pdfBytes: pdfBytes.length,
});

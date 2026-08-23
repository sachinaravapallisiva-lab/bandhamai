import { readFileSync } from "node:fs";
import {
  BIODATA_API_PATH,
  BIODATA_BASE_COLUMNS,
  BIODATA_DOWNLOAD_LABEL,
  BIODATA_FAILED_ERROR,
  BIODATA_NO_PROFILE_ERROR,
  BIODATA_OPTIONAL_COLUMNS,
  BIODATA_PREPARING_LABEL,
  BIODATA_PRODUCT,
  BIODATA_SHARE_TITLE,
  BIODATA_SIGNED_IN_ERROR,
  BIODATA_TAGLINE,
  ageYearsFromDob,
  biodataContentDisposition,
  biodataFilename,
  buildBiodataPdf,
  displayGender,
  firstNameSlug,
  profileToBiodataModel,
} from "../lib/biodata.ts";
import { isVerifyaiVerified } from "../lib/verifyai.ts";

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
];
copy.forEach(function (text) {
  assert(!text.includes("-") && !text.includes("—") && !text.includes("–"), "user-facing copy has no hyphen: " + text);
  assert(!/bandhan\b/i.test(text), "product name is Bandham, not Bandhan: " + text);
});
assertEq(BIODATA_PRODUCT, "Bandham AI", "product lock");
assertEq(BIODATA_TAGLINE, "Find your vibe match?", "tagline lock");
assertEq(BIODATA_DOWNLOAD_LABEL, "Download biodata", "button label");
assertEq(BIODATA_API_PATH, "/api/profiles/biodata", "api path");

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

const sparsePdf = await buildBiodataPdf(empty);
assertEq(Buffer.from(sparsePdf.subarray(0, 4)).toString("latin1"), "%PDF", "sparse profile still makes a PDF");

const route = read("app/api/profiles/biodata/route.ts");
assert(route.includes("export async function GET"), "server GET generates the PDF");
assert(route.includes("hasBearerToken"), "auth required");
assert(route.includes("eq(\"user_id\", user.id)") || route.includes(".eq(\"user_id\", user.id)"), "own profile only");
assert(!/searchParams|profile_id|other.*profile/i.test(route), "no other-person profile id");
assert(route.includes("buildBiodataPdf"), "uses shared pdf builder");
assert(route.includes("revealInstagramHandle") || route.includes("profileToBiodataModel"), "instagram privacy goes through the model");
assert(route.includes("isVerifyaiVerified") || route.includes("profileToBiodataModel"), "verifyai goes through the model");
assert(!/stripe|checkout|price_/i.test(route), "no new Stripe on biodata");
assert(!/phone|embedding/.test(route), "route does not select phone or embedding");

const button = read("app/components/DownloadBiodata.tsx");
assert(button.includes("BIODATA_DOWNLOAD_LABEL"), "button uses locked label");
assert(button.includes("navigator.share"), "mobile share sheet when available");
assert(button.includes("download"), "falls back to file download");
assert(button.includes(BIODATA_API_PATH) || button.includes("BIODATA_API_PATH"), "hits the API");

const account = read("app/account/page.tsx");
assert(account.includes("DownloadBiodata"), "Account has Download biodata");
assert(account.includes("Your profile"), "stays next to Your profile");

const profile = read("app/profile/new/page.tsx");
assert(profile.includes("DownloadBiodata"), "profile screen has Download biodata");

const pkg = read("package.json");
assert(pkg.includes("\"pdf-lib\""), "pdf-lib is the PDF library");

console.log("biodata download ok", {
  filename: biodataFilename("Priya Reddy"),
  rows: labels,
  pdfBytes: pdfBytes.length,
});

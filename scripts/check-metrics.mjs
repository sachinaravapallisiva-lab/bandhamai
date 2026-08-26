import { readFileSync } from "node:fs";
import { ACCOUNT_MENU_ITEMS } from "../lib/account-menu.ts";
import { founderAdminEmails, isFounderAdminEmail } from "../lib/internal-admin.ts";
import {
  METRICS_AGE_LABELS,
  METRICS_API_PATH,
  METRICS_PATH,
  METRICS_REGION_LABELS,
  METRICS_UNKNOWN,
  aggregateMemberMetrics,
  ageGroupFromYears,
  ageYearsFromProfile,
  canonicalCityName,
  metricsUserCopy,
  placeFromCity,
} from "../lib/metrics.ts";
import { ALLOWED_NEXT_PATHS } from "../lib/next-path.ts";
import { FOOTER_LINKS } from "../lib/site.ts";
import { SUPPORT_INBOX_EMAIL_DEFAULT } from "../lib/support.ts";

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

const copy = metricsUserCopy();
copy.forEach(function (text) {
  assert(!text.includes("-") && !text.includes("—") && !text.includes("–"), "user-facing copy has no hyphen: " + text);
  assert(!/bandhan\b/i.test(text), "product name is Bandham, not Bandhan: " + text);
});

assertEq(METRICS_PATH, "/metrics", "metrics path");
assertEq(METRICS_API_PATH, "/api/metrics", "metrics api path");
assert(ALLOWED_NEXT_PATHS.includes(METRICS_PATH), "login can return to metrics");

assertEq(SUPPORT_INBOX_EMAIL_DEFAULT, "sachin.aravapallisiva@gmail.com", "founder email lock");
assert(founderAdminEmails().includes(SUPPORT_INBOX_EMAIL_DEFAULT), "allowlist includes founder email");
assert(isFounderAdminEmail("sachin.aravapallisiva@gmail.com"), "founder email is allowed");
assert(isFounderAdminEmail("Sachin.Aravapallisiva@gmail.com"), "founder email match is case insensitive");
assert(!isFounderAdminEmail(""), "empty email fails closed");
assert(!isFounderAdminEmail("someone@example.com"), "other emails fail closed");
assert(!isFounderAdminEmail(null), "missing email fails closed");

assertEq(canonicalCityName("Hyd"), "Hyderabad", "city alias Hyd");
assertEq(canonicalCityName("blr"), "Bengaluru", "city alias blr");
assertEq(canonicalCityName("NYC"), "New York", "city alias NYC");
assertEq(placeFromCity("").city, METRICS_UNKNOWN, "blank city is Unknown");
assertEq(placeFromCity("").region, METRICS_UNKNOWN, "blank region is Unknown");
assertEq(placeFromCity("Hyderabad").city, "Hyderabad", "India city stays Hyderabad");
assertEq(placeFromCity("Hyd").region, "India", "Hyd maps to India");
assertEq(placeFromCity("Dallas").region, "United States", "Dallas maps to United States");
assertEq(placeFromCity("United States").region, "United States", "region stored as city");
assertEq(placeFromCity("United States").city, METRICS_UNKNOWN, "region only city is Unknown");
assertEq(placeFromCity("London").region, METRICS_UNKNOWN, "city without alias region stays Unknown");

const now = new Date("2026-08-26T00:00:00.000Z");
assertEq(ageGroupFromYears(18), "18 to 24", "18");
assertEq(ageGroupFromYears(24), "18 to 24", "24");
assertEq(ageGroupFromYears(25), "25 to 29", "25");
assertEq(ageGroupFromYears(29), "25 to 29", "29");
assertEq(ageGroupFromYears(30), "30 to 34", "30");
assertEq(ageGroupFromYears(34), "30 to 34", "34");
assertEq(ageGroupFromYears(35), "35 to 39", "35");
assertEq(ageGroupFromYears(39), "35 to 39", "39");
assertEq(ageGroupFromYears(40), "40 plus", "40");
assertEq(ageGroupFromYears(55), "40 plus", "55");
assertEq(ageGroupFromYears(null), METRICS_UNKNOWN, "missing age");
assertEq(ageGroupFromYears(17), METRICS_UNKNOWN, "under 18 is Unknown");
assertEq(ageYearsFromProfile({ dob: "2000-01-15" }, now), 26, "dob to years");
assertEq(ageYearsFromProfile({ age: 31 }, now), 31, "age column");
assertEq(ageYearsFromProfile({ dob: "1990-08-26", age: 20 }, now), 36, "dob wins over age");

const totals = aggregateMemberMetrics(
  [
    { city: "Hyd", dob: "2002-01-01" },
    { city: "Dallas", dob: "1994-06-01" },
    { city: "", age: 41 },
    { city: "London" },
  ],
  now
);
assertEq(totals.members, 4, "total is queried rows");
const india = totals.regions.find(function (row) {
  return row.label === "India";
});
const us = totals.regions.find(function (row) {
  return row.label === "United States";
});
const unknownRegion = totals.regions.find(function (row) {
  return row.label === METRICS_UNKNOWN;
});
assert(india && india.count === 1, "one India");
assert(us && us.count === 1, "one United States");
assert(unknownRegion && unknownRegion.count === 2, "two Unknown regions");
assertEq(totals.ages.length, METRICS_AGE_LABELS.length, "all age buckets");
assertEq(totals.regions.length, METRICS_REGION_LABELS.length, "all region buckets");
const zeroEurope = totals.regions.find(function (row) {
  return row.label === "Europe";
});
assert(zeroEurope && zeroEurope.count === 0, "empty region stays 0");

const route = read("app/api/metrics/route.ts");
const page = read("app/metrics/page.tsx");
const view = read("app/components/MetricsView.tsx");
const layout = read("app/metrics/layout.tsx");
const admin = read("lib/internal-admin.ts");
const metrics = read("lib/metrics.ts");
const footer = read("app/components/SiteFooter.tsx");
const contact = read("app/contact/page.tsx");
const drawer = read("app/components/AccountDrawer.tsx");
const menu = read("lib/account-menu.ts");

assert(route.includes("getServiceSupabase"), "metrics uses existing service role");
assert(route.includes('select(columns.join(","))'), "privacy safe select");
assert(!route.includes('.select("*")'), "never select star");
assert(route.includes('const columns = ["city"]'), "select starts at city only");
assert(!route.includes("full_name"), "no names in metrics select");
assert(!route.includes("photo_url"), "no photos in metrics select");
assert(!route.includes("phone"), "no phones in metrics select");
assert(route.includes("user.email"), "gate reads the signed in email");
assert(!/\.select\([^)]*email/.test(route), "email is not a profile column select");
assert(!route.includes('columns.push("user_id")'), "user_id is not a returned column");
assert(!route.includes('columns.push("id")'), "id is not a returned column");
assert(route.includes('.not("user_id", "is", null)'), "counts signed in profiles");
assert(route.includes("isFounderAdminEmail"), "api uses founder gate");
assert(route.includes('status: 404'), "non admin is not available, not 500");
assert(!/status:\s*500/.test(route), "api does not 500");
assert(admin.includes("SUPPORT_INBOX_EMAIL_DEFAULT"), "gate reuses founder inbox");
assert(!admin.includes("clerk") && !admin.includes("auth0"), "no new auth vendor");

assert(layout.includes("index: false"), "metrics is not indexed");
assert(page.includes("MetricsView"), "page renders gated view");
assert(view.includes("METRICS_UNAVAILABLE_TITLE"), "closed page is plain not available");
assert(view.includes("authJsonHeaders"), "view uses existing session");
assert(!view.includes("470") && !view.includes("640"), "no published 470 or 640");
assert(!metrics.includes("470") && !metrics.includes("640"), "lib does not publish 470 or 640");

assert(!FOOTER_LINKS.some(function (item) {
  return item.href === METRICS_PATH;
}), "metrics is not in the footer");
assert(!footer.includes("/metrics"), "footer source has no metrics link");
assert(!contact.includes("/metrics"), "contact has no metrics link");
assert(!ACCOUNT_MENU_ITEMS.some(function (item) {
  return item.href === METRICS_PATH || item.id === "metrics";
}), "no public drawer item");
assert(!menu.includes("/metrics"), "account menu has no metrics href");
assert(!drawer.includes("/metrics"), "drawer has no metrics link");

assert(!read("package.json").includes("@vercel/analytics"), "no new analytics package");
assert(!read("app/layout.tsx").includes("Analytics"), "no vercel analytics in layout");
assert(!route.includes("stripe") && !view.includes("stripe"), "metrics does not touch Stripe");
assert(!route.includes("vapi") && !view.includes("vapi"), "metrics does not touch Vapi");

const dating = /\b(swipe|hot near you|for you tonight|hookup|flirt)\b/i;
assert(!dating.test(view) && !dating.test(metrics), "no dating chrome");

console.log("metrics ok", {
  path: METRICS_PATH,
  founder: SUPPORT_INBOX_EMAIL_DEFAULT,
  ages: METRICS_AGE_LABELS.length,
  regions: METRICS_REGION_LABELS.length,
});

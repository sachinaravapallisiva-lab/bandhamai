import { readFileSync } from "node:fs";
import { ACCOUNT_MENU_ITEMS } from "../lib/account-menu.ts";
import {
  ADMIN_KICKER,
  ADMIN_LEAD,
  ADMIN_ME_PATH,
  ADMIN_MENU_ITEM,
  ADMIN_METRICS_API_PATH,
  ADMIN_METRICS_CARD_ACTION,
  ADMIN_METRICS_CARD_BODY,
  ADMIN_METRICS_CARD_TITLE,
  ADMIN_METRICS_PATH,
  ADMIN_PATH,
  ADMIN_TITLE,
  ADMIN_UNAVAILABLE_BODY,
  ADMIN_UNAVAILABLE_TITLE,
  adminUserCopy,
} from "../lib/admin.ts";
import {
  adminAllowlistEmails,
  envAdminEmails,
  FOUNDER_SIGNIN_ADMIN_EMAIL,
  founderAdminEmails,
  isAdminEmail,
} from "../lib/internal-admin.ts";
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

adminUserCopy().forEach(function (text) {
  assert(!text.includes("-") && !text.includes("—") && !text.includes("–"), "user-facing copy has no hyphen: " + text);
});

assertEq(ADMIN_PATH, "/admin", "admin path");
assertEq(ADMIN_METRICS_PATH, "/admin/metrics", "admin metrics path");
assertEq(ADMIN_ME_PATH, "/api/admin/me", "admin me path");
assertEq(ADMIN_METRICS_API_PATH, "/api/admin/metrics", "admin metrics api");
assertEq(ADMIN_MENU_ITEM.href, ADMIN_PATH, "drawer Admin opens /admin");
assertEq(ADMIN_MENU_ITEM.label, "Admin", "drawer label");
assertEq(ADMIN_TITLE, "Admin", "page title");
assertEq(ADMIN_KICKER, "ADMIN", "kicker");
assertEq(ADMIN_UNAVAILABLE_TITLE, "This page is not available.", "closed title");
assertEq(ADMIN_UNAVAILABLE_BODY, "Nothing to show here.", "closed body");
assert(ADMIN_LEAD.toLowerCase().includes("admins"), "lead names admins");
assertEq(ADMIN_METRICS_CARD_TITLE, "Metrics", "metrics card");
assertEq(ADMIN_METRICS_CARD_ACTION, "Open Metrics", "metrics action");
assert(ADMIN_METRICS_CARD_BODY.toLowerCase().includes("signed in"), "card names signed in profiles");

assert(ALLOWED_NEXT_PATHS.includes(ADMIN_PATH), "login can return to admin");
assert(ALLOWED_NEXT_PATHS.includes(ADMIN_METRICS_PATH), "login can return to admin metrics");

assertEq(SUPPORT_INBOX_EMAIL_DEFAULT, "sachin.aravapallisiva@gmail.com", "founder email lock");
assertEq(FOUNDER_SIGNIN_ADMIN_EMAIL, "sachin.aravapalli.siva@gmail.com", "personal founder email lock");
assert(founderAdminEmails().includes(SUPPORT_INBOX_EMAIL_DEFAULT), "founder stays on the allowlist");
assert(founderAdminEmails().includes(FOUNDER_SIGNIN_ADMIN_EMAIL), "personal founder stays on the allowlist");
assert(adminAllowlistEmails().includes(SUPPORT_INBOX_EMAIL_DEFAULT), "combined allowlist includes founder");
assert(adminAllowlistEmails().includes(FOUNDER_SIGNIN_ADMIN_EMAIL), "combined allowlist includes personal founder");
assert(isAdminEmail("sachin.aravapallisiva@gmail.com"), "founder is admin");
assert(isAdminEmail("sachin.aravapalli.siva@gmail.com"), "personal founder is admin");
assert(isAdminEmail("Sachin.Aravapalli.Siva@gmail.com"), "personal founder match is case insensitive");
assert(!isAdminEmail(""), "empty email fails closed");
assert(!isAdminEmail("someone@example.com"), "unknown email fails closed");
assertEq(envAdminEmails().includes("someone@example.com"), false, "env list is empty in tests unless set");

const previous = process.env.BANDHAM_ADMIN_EMAILS;
process.env.BANDHAM_ADMIN_EMAILS = "ops@example.com, Other@Example.com";
assert(isAdminEmail("ops@example.com"), "env allowlist email is admin");
assert(isAdminEmail("other@example.com"), "env allowlist is case insensitive");
assert(isAdminEmail(SUPPORT_INBOX_EMAIL_DEFAULT), "founder still admin when env is set");
assert(isAdminEmail(FOUNDER_SIGNIN_ADMIN_EMAIL), "personal founder still admin when env is set");
process.env.BANDHAM_ADMIN_EMAILS = previous;

const previousInbox = process.env.SUPPORT_INBOX_EMAIL;
process.env.SUPPORT_INBOX_EMAIL = "opsinbox@example.com";
assert(isAdminEmail("opsinbox@example.com"), "SUPPORT_INBOX_EMAIL env is admin");
assert(isAdminEmail(SUPPORT_INBOX_EMAIL_DEFAULT), "founder inbox still admin when SUPPORT_INBOX_EMAIL is set");
assert(isAdminEmail(FOUNDER_SIGNIN_ADMIN_EMAIL), "personal founder still admin when SUPPORT_INBOX_EMAIL is set");
process.env.SUPPORT_INBOX_EMAIL = previousInbox;

const drawer = read("app/components/AccountDrawer.tsx");
const menu = read("lib/account-menu.ts");
const adminPage = read("app/admin/page.tsx");
const adminView = read("app/components/AdminView.tsx");
const metricsPage = read("app/admin/metrics/page.tsx");
const meRoute = read("app/api/admin/me/route.ts");
const metricsRoute = read("app/api/admin/metrics/route.ts");
const helper = read("lib/internal-admin.ts");
const footer = read("app/components/SiteFooter.tsx");
const contact = read("app/contact/page.tsx");
const envExample = read(".env.example");
const nextConfig = read("next.config.ts");

assert(adminPage.includes("AdminView"), "admin page renders AdminView");
assert(adminView.includes("fetchAdminAccess"), "admin page uses the server gate");
assert(adminView.includes("loginHref(ADMIN_PATH)"), "signed out admin goes to login");
assert(adminView.includes("ADMIN_UNAVAILABLE_TITLE"), "non admin sees not available");
assert(adminView.includes("ADMIN_METRICS_PATH"), "admin board links to metrics");
assert(metricsPage.includes("MetricsView"), "metrics lives under admin");
assert(meRoute.includes("requireAdminRequest"), "me route is gated");
assert(meRoute.includes("admin: true"), "me route only confirms admin");
assert(!meRoute.includes("BANDHAM_ADMIN_EMAILS"), "me route does not leak the allowlist");
assert(metricsRoute.includes("requireAdminRequest"), "metrics api is gated");
assert(helper.includes("BANDHAM_ADMIN_EMAILS"), "allowlist env is server side");
assert(helper.includes("SUPPORT_INBOX_EMAIL_DEFAULT"), "existing founder inbox stays");
assert(helper.includes("sachin.aravapalli.siva@gmail.com"), "personal founder gmail is hardcoded");
assert(!helper.includes("NEXT_PUBLIC_BANDHAM_ADMIN_EMAILS"), "allowlist is not public");
assert(envExample.includes("BANDHAM_ADMIN_EMAILS"), "env example documents the allowlist");
assert(!/BANDHAM_ADMIN_EMAILS=.+@/.test(envExample), "env example does not publish admin emails");
assert(!envExample.includes("803"), "env example does not add a personal phone");
assert(nextConfig.includes('source: "/metrics"'), "legacy metrics path redirects");
assert(nextConfig.includes('destination: "/admin/metrics"'), "legacy metrics goes to admin metrics");

assert(!ACCOUNT_MENU_ITEMS.some(function (item) {
  return item.id === "admin" || item.href === ADMIN_PATH;
}), "Admin is not a public menu row");
assert(!menu.includes("/admin"), "public menu source has no admin href");
assert(drawer.includes("signedIn && isAdmin"), "drawer Admin is gated");
assert(drawer.includes("fetchAdminAccess"), "drawer does not guess admin from email");
assert(!footer.includes("/admin") && !footer.includes("/metrics"), "footer has no admin link");
assert(!contact.includes("/admin") && !contact.includes("Metrics"), "contact does not mention admin metrics");
assert(!FOOTER_LINKS.some(function (item) {
  return item.href === ADMIN_PATH || item.href === ADMIN_METRICS_PATH;
}), "footer links stay public");

assert(!/create table|roles|rpc/i.test(helper), "no new roles table");
assert(!adminView.includes("Power BI") && !adminView.includes("Mixpanel"), "no new analytics vendor");

console.log("admin ok", {
  path: ADMIN_PATH,
  metrics: ADMIN_METRICS_PATH,
  founder: SUPPORT_INBOX_EMAIL_DEFAULT,
});

import { existsSync, readFileSync } from "node:fs";
import { ACCOUNT_MENU_PAID_CHIP, ACCOUNT_MENU_UPGRADE } from "../lib/account-menu.ts";
import { BILLING_COPY } from "../lib/billing.ts";
import {
  REPORT_COPY,
  REPORT_REASONS,
  REPORTS_TABLE,
  SAFETY_SQL_FILE,
  isReportReason,
  reportNeedsDetails,
  reportReasonLabel,
} from "../lib/safety.ts";

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

const requiredIds = ["fake", "harassment", "money", "underage", "other"];
const allowedIds = requiredIds.concat(["photo"]);
const reasonIds = REPORT_REASONS.map(function (row) {
  return row.id;
});
const reasonLabels = REPORT_REASONS.map(function (row) {
  return row.label;
});

requiredIds.forEach(function (id) {
  assert(isReportReason(id), "keep reason " + id);
});
assert(reasonIds.includes("photo"), "may add Inappropriate photo");
assert(reasonIds.length >= 5 && reasonIds.length <= 6, "five reasons, at most one more");
reasonIds.forEach(function (id) {
  assert(allowedIds.includes(id), "do not invent extra reason " + id);
});
assert(reportReasonLabel("other") === "Something else", "Something else label lock");
assert(reportReasonLabel("photo") === "Inappropriate photo", "photo label lock");
assert(reportNeedsDetails("other") === true, "details only for Something else");
assert(reportNeedsDetails("fake") === false, "fixed reasons need no details");
assert(reportNeedsDetails("photo") === false, "photo chip needs no details");

const copyValues = Object.values(REPORT_COPY).concat(reasonLabels);
copyValues.forEach(function (value) {
  assert(!copyHasDash(value), "report copy has no hyphen or dash: " + value);
  assert(!/\bBandhamai\b/.test(value), "copy is not Bandhamai");
  assert(!/\bBandhan\b/.test(value), "copy is not Bandhan");
});

assert(REPORT_COPY.action === "Report", "Report label lock");
assert(REPORT_COPY.submit === "Submit report", "submit label lock");
assert(REPORT_COPY.saved.includes("immediate danger"), "saved copy names local authorities");
assert(REPORT_COPY.saved.includes("not an emergency service"), "saved copy is not an emergency service");
assert(REPORTS_TABLE === "reports", "reuse public.reports");
assert(SAFETY_SQL_FILE === "supabase/safety.sql", "existing safety SQL");

assert(BILLING_COPY.subscribe === "Subscribe $9.99 a month", "subscribe button stays");
assert(ACCOUNT_MENU_UPGRADE === "Subscribe $9.99 a month", "drawer subscribe stays");
assert(ACCOUNT_MENU_PAID_CHIP === "Bandham AI", "subscribed chip is Bandham AI");
assert(!/\bPaid\b/.test(ACCOUNT_MENU_PAID_CHIP + BILLING_COPY.subscribe), "no Paid");
assert(!/\bUpgrade\b/.test(ACCOUNT_MENU_UPGRADE), "no Upgrade");
assert(!/\bCrown\b/.test(ACCOUNT_MENU_UPGRADE), "no Crown");

const safety = read("app/components/SafetyActions.tsx");
const discover = read("app/components/DiscoverCard.tsx");
const matchCard = read("app/components/MatchCard.tsx");
const chat = read("app/chat/page.tsx");
const reportsApi = read("app/api/reports/route.ts");
const sql = read("supabase/safety.sql");
const ui = stripComments(safety);

assert(discover.includes("SafetyActions"), "Browse cards show Report next to Block");
assert(matchCard.includes("SafetyActions"), "Matches cards show Report next to Block");
assert(chat.includes("SafetyActions"), "live /chat shows Report next to Block");
assert(safety.includes("REPORT_COPY.action") || safety.includes(">Report<"), "Report control exists");
assert(safety.includes("Block"), "Block stays its own control");
assert(safety.includes("loginHref(nextPath)"), "signed out Report stays visible and asks for sign in");
assert(safety.includes("!signedIn"), "signed out still sees Report chips");
assert(!/if \(!signedIn\) \{\s*return/.test(ui), "signed out does not hide Report behind login only");
assert(safety.includes("aria-expanded"), "Report is a visible toggle");
assert(safety.includes("REPORT_REASONS.map"), "reasons come from the shared list");
assert(safety.includes("aria-pressed"), "reasons are tap chips");
assert(!/<select\b/.test(ui), "reasons are not a select menu");
assert(!/<option\b/.test(ui), "reasons are not dropdown options");
assert(safety.includes("reportNeedsDetails"), "details only after Something else");
assert(safety.includes('call("/api/reports"'), "submit posts to existing reports");
assert((safety.match(/call\("\/api\/blocks"/g) || []).length === 1, "Block posts from its own confirm");
assert((safety.match(/call\("\/api\/reports"/g) || []).length === 1, "Report posts from Submit report");
assert(!safety.slice(safety.indexOf('call("/api/reports"')).includes("/api/blocks"), "report submit does not auto block");
assert(safety.includes('setOpen(open === "block"') || safety.includes('setOpen("block")'), "Block stays its own confirm");
assert(safety.includes("CREAM") && safety.includes("VIOLET"), "Report stays cream and violet");
assert(!/\bPaid\b/.test(ui), "Report UI is not Paid");
assert(!/\bUpgrade\b/.test(ui), "Report UI is not Upgrade");
assert(!/\bCrown\b/.test(ui), "Report UI is not Crown");
assert(!/\bSupport\b/.test(ui), "Report is not Support");
assert(!/swipe|hook-?up|vibe check|crush/i.test(ui), "no dating slang");

const inboxListUrl = new URL("../app/components/InboxList.tsx", import.meta.url);
if (existsSync(inboxListUrl)) {
  const inboxList = read("app/components/InboxList.tsx");
  assert(inboxList.includes("SafetyActions"), "Inbox threads show Report next to Block");
}

assert(reportsApi.includes("REPORTS_TABLE"), "API writes public.reports");
assert(reportsApi.includes("tableExists"), "API fails closed if reports is missing");
assert(reportsApi.includes("tableMissingHint") || reportsApi.includes("SAFETY_SQL_FILE"), "missing table names the SQL file");
assert(!reportsApi.includes("public.feedback"), "do not write feedback");
assert(!reportsApi.includes("details.length < 4"), "Something else details stay optional");
assert(reportsApi.includes("REPORT_COPY.saved"), "quiet confirmation is shared copy");
assert(sql.includes("create table if not exists public.reports"), "reports table is in safety.sql");
assert(!sql.includes("public.feedback"), "do not write feedback");

const bannedDating = /\b(swipe|streaks?|hot near you|hook-?up|vibe check|crush|for you tonight)\b/i;
assert(!bannedDating.test(ui + reasonLabels.join(" ")), "report copy has no dating chrome");

console.log("report chips ok", {
  reasons: reasonIds,
  subscribe: BILLING_COPY.subscribe,
  reports: REPORTS_TABLE,
});

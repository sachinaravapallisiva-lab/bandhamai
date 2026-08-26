import { readFileSync } from "node:fs";
import {
  ACCOUNT_MENU_CLOSE_LABEL,
  ACCOUNT_MENU_DIALOG_ID,
  ACCOUNT_MENU_FREE_CHIP,
  ACCOUNT_MENU_ITEMS,
  ACCOUNT_MENU_MESSAGES_NOTE,
  ACCOUNT_MENU_OPEN_LABEL,
  ACCOUNT_MENU_PAID_CHIP,
  ACCOUNT_MENU_SIGN_IN,
  ACCOUNT_MENU_TITLE,
  ACCOUNT_MENU_UPGRADE,
  ACCOUNT_MENU_UPGRADE_HREF,
  SIDEBAR_ALWAYS_OPEN,
  PREFERENCES_BODY,
  PREFERENCES_PATH,
  PREFERENCES_TITLE,
} from "../lib/account-menu.ts";
import { BILLING_COPY } from "../lib/billing.ts";
import { ALLOWED_NEXT_PATHS } from "../lib/next-path.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const chrome = read("app/components/AppChrome.tsx");
const drawer = read("app/components/AccountDrawer.tsx");
const home = read("app/page.tsx");
const prefs = read("app/preferences/page.tsx");
const theme = read("lib/theme.ts");
const sources = [stripComments(drawer), stripComments(prefs), stripComments(chrome)];

assert(chrome.includes("AccountDrawer"), "AppChrome hosts the account drawer");
assert(home.includes("AccountDrawer"), "home uses the same sidebar, not a parallel nav");
assert(drawer.includes("DownloadBiodata"), "own biodata reuses DownloadBiodata");
assert(SIDEBAR_ALWAYS_OPEN === true, "sidebar stays open");
assert(drawer.includes("<aside"), "sidebar is a persistent aside");
assert(drawer.includes("bm-rail"), "desktop rail stays in the page");
assert(!/const \[open,\s*setOpen\] = useState\(\s*false\s*\)/.test(drawer), "closed by default drawer fails");
assert(!/{open \?/.test(drawer), "desktop rail is not gated on an open flag");
assert(drawer.includes("bm-account-overlay"), "phones open the same items in an overlay");
assert(drawer.includes("<details"), "phone Account control is a native drawer");
assert(drawer.includes("bm-account-phone"), "phone drawer is marked for the 800px hide");
assert(drawer.includes('aria-modal="true"'), "phone overlay is a dialog");
assert(drawer.includes("AccountMenuControl"), "phones get a compact Account control");
assert(!/<span>Menu<\/span>/.test(drawer), "no hamburger Menu");
assert(drawer.includes("minWidth: 44") || drawer.includes("minHeight: 44"), "touch target height");
assert(drawer.includes("minHeight: 44"), "touch target height");
assert(drawer.includes("prefers-reduced-motion") || theme.includes(".bm-drawer"), "drawer motion is in the theme");
assert(theme.includes("prefers-reduced-motion"), "reduced-motion lock stays");
assert(theme.includes(".bm-drawer"), "drawer transition token");
assert(theme.includes(".bm-menu"), "menu hover token");
assert(theme.includes(".bm-rail{flex:0 0 ") && theme.includes(".bm-dash{flex:0 1 "), "capped rail, capped dash");
assert(!/\.bm-rail\{flex:1 1/.test(theme.replace(/\s/g, "")), "grow-1 rail fails");
assert(!theme.includes("max-width:none"), "full-bleed dash inner fails");
assert(theme.includes("PHONE_ACCOUNT_BREAKPOINT"), "phone breakpoint lives in theme");
assert(theme.includes(".bm-rail{display:none"), "phones hide the always-open rail");
assert(theme.includes(".bm-account-toggle{display:none}"), "desktop has no Account hamburger");
assert(theme.includes(".bm-account-toggle{display:inline-flex"), "phones show the Account control");
assert(theme.includes(".bm-shell{flex-direction:column}"), "phone pages stack one column");
assert(theme.includes("[data-meetup-rail]{display:block"), "meetup sits under Home on phone");
assert(drawer.includes("Menu"), "phone tap control is Menu");
assert(drawer.includes('data-account-cream="true"'), "tap cream closes the phone drawer");
assert(chrome.includes("AccountMenuControl") && home.includes("AccountMenuControl"), "hosts expose the same Account control");
assert(!theme.includes("calc(100% - 240px - 96px)"), "do not use the old gap calc");
assert(!/SIDEBAR_DASH_MAX\s*=\s*640/.test(theme), "640 dash max is the canyon and fails");
assert(chrome.includes('className="bm-dash"') && home.includes('className="bm-dash"'), "hosts use the capped dashboard canvas");
assert(theme.includes("VIOLET"), "violet token stays");
assert(!theme.includes("#2563EB") && !theme.includes("#3B82F6"), "do not replace violet with blue");

assert(ACCOUNT_MENU_OPEN_LABEL === "Open account menu", "open label lock");
assert(ACCOUNT_MENU_CLOSE_LABEL === "Close account menu", "close label lock");
assert(ACCOUNT_MENU_TITLE === "Account", "title lock");
assert(ACCOUNT_MENU_DIALOG_ID === "account-menu", "dialog id lock");
assert(ACCOUNT_MENU_SIGN_IN === "Sign in", "signed-out CTA");
assert(ACCOUNT_MENU_FREE_CHIP === "Free", "free chip");
assert(ACCOUNT_MENU_PAID_CHIP === "Bandham AI", "subscribed chip is Bandham AI");
assert(ACCOUNT_MENU_PAID_CHIP !== "Paid", "Paid is dating chrome");
assert(ACCOUNT_MENU_MESSAGES_NOTE !== "Paid", "messages note is not Paid");
assert(!/paid/i.test(ACCOUNT_MENU_MESSAGES_NOTE), "messages note does not say Paid");
assert(ACCOUNT_MENU_UPGRADE === "Subscribe $9.99 a month", "subscribe label");
assert(ACCOUNT_MENU_UPGRADE === BILLING_COPY.subscribe, "drawer CTA matches paywall button");
assert(!/upgrade/i.test(ACCOUNT_MENU_UPGRADE), "no Upgrade label");
assert(ACCOUNT_MENU_UPGRADE_HREF === "/chat", "subscribe uses existing checkout");
assert(PREFERENCES_TITLE === "Preferences", "preferences page label");
assert(PREFERENCES_PATH === "/preferences", "preferences path");
assert(ALLOWED_NEXT_PATHS.includes(PREFERENCES_PATH), "preferences is a real next path");
assert(ALLOWED_NEXT_PATHS.includes("/meetup"), "meetup is a real next path");

const labels = ACCOUNT_MENU_ITEMS.map(function (item) {
  return item.label;
});
assert(labels.includes("My profile"), "my profile item");
assert(labels.includes("Preferences"), "preferences item");
assert(labels.includes("Browse / Matches"), "browse / matches item");
assert(labels.includes("Meetup this month"), "meetup item");
assert(labels.includes("Inbox"), "inbox item");
assert(!labels.includes("Messages"), "Inbox replaces the Messages label");
assert(!labels.includes("VerifyAI"), "VerifyAI sidebar row is gone");
assert(labels.includes("Help / Support"), "help item");
assert(labels.includes("Call us"), "call us item");
assert(
  ACCOUNT_MENU_ITEMS.map(function (item) {
    return item.id;
  }).join(",") === "profile,preferences,browse,meetup,inbox,plans,help,call,settings,block",
  "Inbox, Call us, Block, and Plans stay in order"
);
assert(labels.includes("Plans"), "Plans item");
assert(labels.includes("Settings / Account"), "settings item");
assert(labels.includes("Block"), "block item");
assert(labels.indexOf("Inbox") === labels.indexOf("Meetup this month") + 1, "Inbox stays where Messages was");
assert(labels.indexOf("Plans") === labels.indexOf("Inbox") + 1, "Plans stays after Inbox");
assert(labels.indexOf("Block") === labels.indexOf("Settings / Account") + 1, "Block is added after Settings");

const hrefs = ACCOUNT_MENU_ITEMS.map(function (item) {
  return item.href;
});
assert(hrefs.includes("/profile/new"), "profile route");
assert(hrefs.includes("/preferences"), "preferences route");
assert(hrefs.includes("/"), "browse route");
assert(hrefs.includes("/meetup"), "meetup route");
assert(hrefs.includes("/inbox"), "inbox route");
assert(!hrefs.includes("/account#verify"), "sidebar does not jump to the verify hash");
assert(hrefs.includes("/plans"), "plans route");
assert(ALLOWED_NEXT_PATHS.includes("/plans"), "plans is a real next path");
assert(read("lib/plans.ts").includes('PLANS_VERIFY_HREF = "/account#verify"'), "Plans still uses the verify hash");
assert(read("app/components/VerifyOffer.tsx").includes('id="verify"'), "verify hash target stays on Account");
assert(!drawer.includes('href="/account#verify"'), "drawer source has no verify hash row");
assert(!drawer.includes('"verifyai"'), "drawer has no VerifyAI icon mapping");
assert(hrefs.includes("/contact"), "support route");
assert(hrefs.includes("/contact#call"), "call us route");
assert(hrefs.includes("/account"), "account route");
assert(hrefs.includes("/account#blocked"), "block route");
assert(ALLOWED_NEXT_PATHS.includes("/inbox"), "inbox is a real next path");

assert(prefs.includes(PREFERENCES_TITLE) || prefs.includes("PREFERENCES_TITLE"), "preferences page titled Preferences");
assert(prefs.includes("AppChrome"), "preferences uses AppChrome");
assert(PREFERENCES_BODY.toLowerCase().includes("dealbreaker"), "preferences copy names dealbreakers");
assert(PREFERENCES_BODY.toLowerCase().includes("speed match"), "preferences defers speed match to matches");

const banned = /\b(swipe home|streaks?|hot near you|hot-near-you|for you tonight)\b/i;
sources.forEach(function (src) {
  assert(!banned.test(src), "no dating-app chrome");
  assert(!/🔥|😍|💘|😉/.test(src), "no emoji icons");
});
assert(!/\bPaid\b/.test(ACCOUNT_MENU_PAID_CHIP + ACCOUNT_MENU_MESSAGES_NOTE + ACCOUNT_MENU_UPGRADE), "drawer labels are not Paid");
assert(!/\bUpgrade\b/.test(ACCOUNT_MENU_UPGRADE), "drawer labels are not Upgrade");
assert(!/>\s*Paid\s*</.test(drawer), "drawer does not render Paid");
assert(!/>\s*Upgrade\s*</.test(drawer), "drawer does not render Upgrade");
assert(!/>\s*Messaging\s*</.test(drawer), "drawer does not list messaging on the subscribe row");
assert(!/Start Speed Match/.test(drawer), "speed match stays off the account hub");
assert(home.includes("Start Speed Match") || read("app/components/MatchCard.tsx").includes("Start Speed Match"), "speed match stays on matches");

assert(drawer.includes("fetchEntitlement"), "plan chip uses existing entitlement");
assert(drawer.includes("ACCOUNT_MENU_SIGN_IN"), "signed-out shows Sign in");
assert(drawer.includes("VIOLET") || drawer.includes("#6D28D9"), "drawer stays violet");
assert(drawer.includes("CREAM") || drawer.includes("#FDF8F1"), "drawer sits on cream");

console.log("account drawer ok", {
  items: ACCOUNT_MENU_ITEMS.length,
  preferences: PREFERENCES_PATH,
  upgrade: ACCOUNT_MENU_UPGRADE_HREF,
});

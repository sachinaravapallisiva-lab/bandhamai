import { readFileSync } from "node:fs";
import {
  ACCOUNT_MENU_CLOSE_LABEL,
  ACCOUNT_MENU_DIALOG_ID,
  ACCOUNT_MENU_FREE_CHIP,
  ACCOUNT_MENU_ITEMS,
  ACCOUNT_MENU_OPEN_LABEL,
  ACCOUNT_MENU_PAID_CHIP,
  ACCOUNT_MENU_SIGN_IN,
  ACCOUNT_MENU_TITLE,
  ACCOUNT_MENU_UPGRADE,
  ACCOUNT_MENU_UPGRADE_HREF,
  PREFERENCES_BODY,
  PREFERENCES_PATH,
  PREFERENCES_TITLE,
} from "../lib/account-menu.ts";
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
assert(home.includes("AccountDrawer"), "home masthead uses the same drawer, not a parallel nav");
assert(drawer.includes("DownloadBiodata"), "own biodata reuses DownloadBiodata");
assert(drawer.includes('role="dialog"'), "drawer is a dialog");
assert(drawer.includes("aria-modal"), "drawer is modal");
assert(drawer.includes('event.key === "Escape"'), "keyboard close for the drawer");
assert(drawer.includes("FOCUSABLE") || drawer.includes("querySelectorAll"), "tab order stays inside the drawer");
assert(drawer.includes("aria-label={ACCOUNT_MENU_OPEN_LABEL}"), "open control has an aria-label");
assert(drawer.includes("minWidth: 44"), "touch target width");
assert(drawer.includes("minHeight: 44"), "touch target height");
assert(drawer.includes("prefers-reduced-motion") || theme.includes(".bm-drawer"), "drawer motion is in the theme");
assert(theme.includes("prefers-reduced-motion"), "reduced-motion lock stays");
assert(theme.includes(".bm-drawer"), "drawer transition token");
assert(theme.includes(".bm-menu"), "menu hover token");
assert(theme.includes("VIOLET"), "violet token stays");
assert(!theme.includes("#2563EB") && !theme.includes("#3B82F6"), "do not replace violet with blue");

assert(ACCOUNT_MENU_OPEN_LABEL === "Open account menu", "open label lock");
assert(ACCOUNT_MENU_CLOSE_LABEL === "Close account menu", "close label lock");
assert(ACCOUNT_MENU_TITLE === "Account", "title lock");
assert(ACCOUNT_MENU_DIALOG_ID === "account-menu", "dialog id lock");
assert(ACCOUNT_MENU_SIGN_IN === "Sign in", "signed-out CTA");
assert(ACCOUNT_MENU_FREE_CHIP === "Free", "free chip");
assert(ACCOUNT_MENU_PAID_CHIP === "Paid", "paid chip");
assert(ACCOUNT_MENU_UPGRADE === "Upgrade", "upgrade label");
assert(ACCOUNT_MENU_UPGRADE_HREF === "/chat", "upgrade uses existing messaging checkout");
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
assert(labels.includes("Messages"), "messages item");
assert(labels.includes("VerifyAI"), "verifyai item");
assert(labels.includes("Help / Support"), "help item");
assert(labels.includes("Settings / Account"), "settings item");

const hrefs = ACCOUNT_MENU_ITEMS.map(function (item) {
  return item.href;
});
assert(hrefs.includes("/profile/new"), "profile route");
assert(hrefs.includes("/preferences"), "preferences route");
assert(hrefs.includes("/"), "browse route");
assert(hrefs.includes("/meetup"), "meetup route");
assert(hrefs.includes("/chat"), "messages route");
assert(hrefs.includes("/account#verify"), "verify anchor");
assert(hrefs.includes("/contact"), "support route");
assert(hrefs.includes("/account"), "account route");

assert(prefs.includes(PREFERENCES_TITLE) || prefs.includes("PREFERENCES_TITLE"), "preferences page titled Preferences");
assert(prefs.includes("AppChrome"), "preferences uses AppChrome");
assert(PREFERENCES_BODY.toLowerCase().includes("dealbreaker"), "preferences copy names dealbreakers");
assert(PREFERENCES_BODY.toLowerCase().includes("speed match"), "preferences defers speed match to matches");

const banned = /\b(swipe home|streaks?|hot near you|hot-near-you|for you tonight)\b/i;
sources.forEach(function (src) {
  assert(!banned.test(src), "no dating-app chrome");
  assert(!/🔥|😍|💘|😉/.test(src), "no emoji icons");
});
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

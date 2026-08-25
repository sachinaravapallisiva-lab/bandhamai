import { readFileSync } from "node:fs";
import {
  ACCOUNT_MENU_FREE_CHIP,
  ACCOUNT_MENU_ITEMS,
  ACCOUNT_MENU_PAID_CHIP,
  ACCOUNT_MENU_TITLE,
  ACCOUNT_MENU_UPGRADE,
  SIDEBAR_ALWAYS_OPEN,
} from "../lib/account-menu.ts";
import {
  isOwnStoredPhotoUrl,
} from "../lib/profile-photos.ts";
import {
  SIDEBAR_AVATAR_ALT,
  SIDEBAR_AVATAR_MARK,
  SIDEBAR_AVATAR_SIZE,
  sidebarAvatarInitial,
  sidebarOwnPhotoUrl,
} from "../lib/sidebar-avatar.ts";
import { SUPPORT_CALL_LABEL, SUPPORT_CALL_PATH } from "../lib/site.ts";
import {
  CREAM,
  LINE,
  SIDEBAR_DASH_BASIS,
  SIDEBAR_RAIL_BASIS,
  SIDEBAR_RAIL_SLIM,
  VIOLET,
  VIOLET_DEEP,
  WASH,
} from "../lib/theme.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const drawer = read("app/components/AccountDrawer.tsx");
const avatar = read("app/components/SidebarAvatar.tsx");
const helper = read("lib/sidebar-avatar.ts");
const chrome = read("app/components/AppChrome.tsx");
const home = read("app/page.tsx");
const meetup = read("app/meetup/page.tsx");
const menu = read("lib/account-menu.ts");
const newUserCopy = SIDEBAR_AVATAR_ALT;
const newSources = [stripComments(drawer), stripComments(avatar), stripComments(helper)];

const itemIds = ACCOUNT_MENU_ITEMS.map(function (item) {
  return item.id;
});
const itemLabels = ACCOUNT_MENU_ITEMS.map(function (item) {
  return item.label;
});

assert(
  itemIds.join(",") === "profile,preferences,browse,meetup,messages,verifyai,help,call,settings",
  "sidebar item order keeps Call us"
);
assert(
  itemLabels.join("|") ===
    "My profile|Preferences|Browse / Matches|Meetup this month|Messages|VerifyAI|Help / Support|Call us|Settings / Account",
  "sidebar labels keep Call us"
);
const callItem = ACCOUNT_MENU_ITEMS.find(function (item) {
  return item.id === "call";
});
assert(!!callItem, "Call us stays in the sidebar");
assert(callItem.label === SUPPORT_CALL_LABEL, "Call us label lock");
assert(callItem.label === "Call us", "Call us is two words");
assert(callItem.href === SUPPORT_CALL_PATH, "Call us goes to contact hash");
assert(callItem.href === "/contact#call", "Call us href lock");
assert(drawer.includes('name === "call"') || drawer.includes('id === "call"'), "rail can icon Call us");
assert(ACCOUNT_MENU_TITLE === "Account", "Account title stays Account");
assert(ACCOUNT_MENU_PAID_CHIP === "Bandham AI", "subscribed self chip stays Bandham AI");
assert(ACCOUNT_MENU_FREE_CHIP === "Free", "free chip stays Free");
assert(ACCOUNT_MENU_UPGRADE === "Subscribe $9.99 a month", "subscribe button copy lock");
assert(!/Upgrade/.test(ACCOUNT_MENU_UPGRADE), "do not add Upgrade");
assert(ACCOUNT_MENU_PAID_CHIP !== "Paid", "do not add Paid");
assert(!/Regular|Premium/.test(menu), "leave Regular vs Premium chips to the other PR");

assert(SIDEBAR_AVATAR_SIZE >= 28 && SIDEBAR_AVATAR_SIZE <= 32, "avatar is a 28 to 32px circle");
assert(avatar.includes("borderRadius: 999"), "avatar is circular");
assert(drawer.includes("SidebarAvatar"), "drawer hosts the signed in mark");
assert(drawer.includes("BANDHAM AI"), "Bandham AI kicker stays two words");
assert(drawer.includes("ACCOUNT_MENU_TITLE"), "Account row stays");
assert(drawer.includes("{signedIn ? <SidebarAvatar"), "avatar only when signed in");
assert(!/signedIn \? null/.test(drawer) || drawer.includes("{signedIn ? <SidebarAvatar"), "no fake signed out avatar");

assert(drawer.includes("sidebarOwnPhotoUrl"), "drawer uses own photo helper");
assert(avatar.includes("isOwnStoredPhotoUrl") || helper.includes("isOwnStoredPhotoUrl"), "own bucket path required");
assert(avatar.includes("photoUrl") && avatar.includes("onError"), "broken photo falls back quietly");

const own = "https://xyz.supabase.co/storage/v1/object/public/profile-photos/user-123/abc.webp";
const other = "https://xyz.supabase.co/storage/v1/object/public/profile-photos/other-user/abc.webp";
const stock = "https://randomuser.me/api/portraits/men/1.jpg";
assert(isOwnStoredPhotoUrl(own, "user-123") === true, "own stored url is own");
assert(sidebarOwnPhotoUrl(own, "user-123") === own, "own profile photo accepted");
assert(sidebarOwnPhotoUrl(other, "user-123") === "", "other member photo rejected");
assert(sidebarOwnPhotoUrl(stock, "user-123") === "", "stock face url rejected");
assert(sidebarOwnPhotoUrl("https://images.unsplash.com/photo-1", "user-123") === "", "unsplash rejected");
assert(sidebarOwnPhotoUrl("", "user-123") === "", "empty photo is not shown as a face");
assert(sidebarOwnPhotoUrl(own, "") === "", "signed out has no photo url");
assert(sidebarAvatarInitial("Priya Sharma") === "P", "quiet single initial");
assert(sidebarAvatarInitial("  ") === "", "no name is an empty circle");
assert(sidebarAvatarInitial(null) === "", "missing name is an empty circle");

assert(!/Photo coming soon/.test(drawer + avatar + helper), "sidebar mark is not Photo coming soon");
assert(!/unsplash|pravatar|ui-avatars|randomuser|thispersondoesnotexist/i.test(drawer + avatar + helper), "no stock face host");
assert(!/raised_in/.test(drawer + avatar + helper), "do not invent raised_in");
assert(!/public\.feedback/.test(drawer + avatar + helper), "do not use public.feedback");

assert(!/[-–—]/.test(newUserCopy), "no hyphens in new user copy");
assert(SIDEBAR_AVATAR_ALT === "Your profile photo", "photo alt has no hyphen");
assert(chrome.includes("Bandham AI"), "wordmark is Bandham AI two words");
assert(home.includes("Bandham AI"), "home wordmark is Bandham AI two words");
assert(!/Bandhamai|bandhamAI|\bBandhan\b/.test(stripComments(chrome)), "chrome is not Bandhamai or Bandhan");
assert(!/Bandhamai|bandhamAI|\bBandhan\b/.test(stripComments(home).replace(/bandhamai\.vercel/g, "")), "home is not Bandhamai or Bandhan");
assert(!/Bandhamai|bandhamAI|\bBandhan\b/.test(newSources.join("\n")), "new sidebar files use Bandham AI");
assert(ACCOUNT_MENU_PAID_CHIP.split(" ").length === 2, "Bandham AI is two words");
assert(!/crown|♛|👑/i.test(drawer + avatar + helper + menu), "do not add Crown");
assert(avatar.includes(String(SIDEBAR_AVATAR_SIZE)) || avatar.includes("SIDEBAR_AVATAR_SIZE"), "component uses the locked size");
assert(avatar.includes("SIDEBAR_AVATAR_MARK") || avatar.includes(SIDEBAR_AVATAR_MARK), "own photo mark is labeled");

assert(CREAM === "#FDF8F1", "cream hex stays");
assert(WASH === "#F7F1E8", "wash hex stays");
assert(VIOLET === "#6D28D9", "violet hex stays");
assert(VIOLET_DEEP === "#4C1D95", "deep violet hex stays");
assert(LINE === "#E8DFD2", "line hex stays");
assert(/minHeight: "100vh", background: CREAM/.test(home), "home dashboard sits on cream");
assert(/minHeight: "100vh", background: CREAM/.test(chrome), "AppChrome dashboard sits on cream");
assert(/minHeight: "100vh", background: CREAM/.test(meetup), "meetup dashboard sits on cream");
assert(/background: CREAM/.test(drawer), "sidebar sits on cream");
assert(!/minHeight: "100vh", background: WASH/.test(home), "home dashboard is not a darker wash");
assert(!/minHeight: "100vh", background: WASH/.test(chrome), "AppChrome dashboard is not a darker wash");
assert(!/minHeight: "100vh", background: WASH/.test(meetup), "meetup dashboard is not a darker wash");
assert(SIDEBAR_ALWAYS_OPEN === true, "always open lock");
assert(drawer.includes('data-sidebar-always-open={SIDEBAR_ALWAYS_OPEN ? "true" : "false"}') || drawer.includes('data-sidebar-always-open="true"'), "rail marks itself always open");
assert(drawer.includes("<aside"), "sidebar is a persistent aside");
assert(drawer.includes("bm-rail"), "sidebar uses the always visible rail");
assert(!/const \[open,\s*setOpen\] = useState\(\s*false\s*\)/.test(drawer), "closed by default drawer fails");
assert(!/{open \?/.test(drawer), "sidebar is not gated on an open flag");
assert(!/<span>Menu<\/span>/.test(drawer), "no Menu hamburger");
assert(!/<span>Close<\/span>/.test(drawer), "no Close control");
assert(!/aria-modal/.test(drawer), "no overlay dialog");
assert(!/bm-scrim/.test(drawer), "no dismiss overlay");
assert(!/ACCOUNT_MENU_OPEN_LABEL/.test(drawer), "no open menu control");
const theme = read("lib/theme.ts");
assert(theme.includes(".bm-rail"), "rail width lives in theme");
assert(theme.includes(".bm-dash"), "dashboard canvas lives in theme");
assert(theme.includes(".bm-dash-inner"), "dashboard inner fills the canvas");
assert(theme.includes(".bm-rail{flex:1 1 "), "rail grows into leftover space");
assert(theme.includes(".bm-dash{flex:1 1 "), "dashboard grows into leftover space");
assert(theme.includes("max-width:none"), "dashboard is not a centered 640 strip");
assert(SIDEBAR_RAIL_BASIS >= 260, "sidebar rail must be wider than the skinny 240 rail");
assert(SIDEBAR_DASH_BASIS >= 660, "dashboard canvas must grow with the rail");
assert(SIDEBAR_RAIL_BASIS !== SIDEBAR_DASH_BASIS, "rail and dash grow as a pair, not one equal clone");
assert(SIDEBAR_RAIL_SLIM >= 140 && SIDEBAR_RAIL_SLIM <= 180, "phones keep a slimmer visible rail");
assert(!theme.includes("flex:0 0 240"), "fixed skinny 240 rail fails");
assert(!/\.bm-rail\{flex:0 0 (2[6-9]\d|[3-9]\d{2})/.test(theme.replace(/\s/g, "")), "do not only widen the rail as a fixed column");
assert(/display: "flex"/.test(home) && home.includes("<AccountDrawer />"), "home paints the rail in the shell");
assert(/display: "flex"/.test(chrome) && chrome.includes("<AccountDrawer />"), "AppChrome paints the rail in the shell");
assert(home.includes('className="bm-dash"') && home.includes("bm-dash-inner"), "home dashboard grows with the rail");
assert(chrome.includes('className="bm-dash"') && chrome.includes("bm-dash-inner"), "AppChrome dashboard grows with the rail");
assert(meetup.includes('className="bm-dash"') && meetup.includes("bm-dash-inner"), "meetup dashboard grows with the rail");
assert(!/maxWidth:\s*640/.test(chrome + home + meetup), "shell must not keep a 640 canvas beside the rail");
assert(!/margin:\s*["']0 auto["']/.test(chrome + home + meetup), "shell must not leave a centered unused middle band");
const themeExports = theme.split("export const BM_CSS")[0];
assert(themeExports.includes('export const CREAM = "#FDF8F1"'), "cream export stays");
assert(themeExports.includes('export const WASH = "#F7F1E8"'), "wash export stays");
assert(!/export const \w+ = "#[0-9A-Fa-f]{6}"/.test(themeExports.replace(/export const (VIOLET|VIOLET_DEEP|INK|MUTED|LINE|WASH|CREAM|GOLD) = "#[0-9A-Fa-f]{6}";/g, "")), "do not invent a new palette token");

assert(!/Start Speed Match/.test(drawer), "Speed Match stays off the sidebar");
assert(!drawer.includes("About"), "footer About stays off the sidebar");
assert(!/Who viewed you|Seen profiles/.test(drawer), "Seen profiles stays off this PR");

console.log("sidebar avatar ok", {
  size: SIDEBAR_AVATAR_SIZE,
  items: itemLabels,
  chip: ACCOUNT_MENU_PAID_CHIP,
  subscribe: ACCOUNT_MENU_UPGRADE,
});

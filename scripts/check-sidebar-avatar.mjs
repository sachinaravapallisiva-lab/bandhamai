import { existsSync, readFileSync, statSync } from "node:fs";
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
import { BANDHAM_MARK_HEADER_SIZE, BANDHAM_MARK_SIZE } from "../lib/bandham-mark.ts";
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
  PHONE_ACCOUNT_BREAKPOINT,
  SIDEBAR_DASH_MAX,
  SIDEBAR_RAIL_BASIS,
  SIDEBAR_RAIL_MAX,
  SIDEBAR_RAIL_MIN,
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
  itemIds.join(",") === "profile,preferences,browse,meetup,inbox,verifyai,plans,help,call,settings,block",
  "sidebar item order keeps Inbox, Call us, Block, and Plans"
);
assert(
  itemLabels.join("|") ===
    "My profile|Preferences|Browse / Matches|Meetup this month|Inbox|VerifyAI|Plans|Help / Support|Call us|Settings / Account|Block",
  "sidebar labels keep Inbox, Call us, Block, and Plans"
);
assert(itemIds.includes("plans") && itemLabels.includes("Plans"), "Plans is in the sidebar");
assert(!itemIds.includes("messages"), "Messages item id is gone");
assert(!itemLabels.includes("Messages"), "Messages label is gone");
assert(itemIds.includes("inbox") && itemLabels.includes("Inbox"), "Inbox stays");
assert(itemIds.includes("block") && itemLabels.includes("Block"), "Block stays");
assert(itemIds.indexOf("help") + 1 === itemIds.indexOf("call"), "Help / Support then Call us");
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
assert(drawer.includes("BandhamMark"), "rail shows the jaimala mark beside Bandham AI");
const mark = read("app/components/BandhamMark.tsx");
assert(mark.includes("BANDHAM_MARK_SRC"), "mark uses the shared src");
assert(mark.includes('objectFit: "contain"'), "rail mark uses contain so the full jaimala is visible");
assert(!/objectFit:\s*["']cover["']/.test(mark), "cover crops the jaimala into a cream speck");
assert(mark.includes('data-bandham-mark="jaimala"'), "mark is tagged as the jaimala");
assert(read("lib/bandham-mark.ts").includes("/brand/bandham-jaimala.png"), "rail uses the jaimala artwork");
assert(BANDHAM_MARK_SIZE >= 48 && BANDHAM_MARK_SIZE <= 56, "rail mark stays 48 to 56px");
assert(BANDHAM_MARK_SIZE === 52, "rail mark lock is 52");
assert(BANDHAM_MARK_HEADER_SIZE >= 72 && BANDHAM_MARK_HEADER_SIZE <= 88, "Home wordmark mark is a bit larger than the rail");
assert(BANDHAM_MARK_HEADER_SIZE > BANDHAM_MARK_SIZE, "header mark is larger than the rail mark");
assert(home.includes("BandhamMark"), "Home wordmark shows the jaimala mark");
assert(home.includes("BANDHAM_MARK_HEADER_SIZE"), "Home uses the larger header mark size");
assert(home.indexOf("Bandham AI") < home.indexOf("<BandhamMark"), "jaimala mark sits to the right of Bandham AI");
assert(drawer.includes("<BandhamMark />"), "rail still uses the small default mark");
assert(!drawer.includes("BANDHAM_MARK_HEADER_SIZE"), "do not enlarge the rail mark");
assert(chrome.includes("BandhamMark"), "AppChrome shows the jaimala next to Bandham AI");
assert(existsSync(new URL("../public/brand/bandham-jaimala.png", import.meta.url)), "jaimala artwork is present");
assert(existsSync(new URL("../public/brand/bandham-mark.png", import.meta.url)), "cropped garland mark PNG is present");
assert(statSync(new URL("../public/icons/icon-192.png", import.meta.url)).size > 2000, "favicon is no longer the old circle placeholder");
assert(statSync(new URL("../public/icons/icon-512.png", import.meta.url)).size > 2000, "512 icon stays a brand PNG");
assert(statSync(new URL("../public/icons/apple-touch-icon.png", import.meta.url)).size > 2000, "apple touch icon stays a brand PNG");
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
assert(!/{open \?/.test(drawer), "desktop rail is not gated on an open flag");
assert(!/<span>Menu<\/span>/.test(drawer), "no Menu hamburger");
assert(!/<span>Close<\/span>/.test(drawer), "no Close control");
assert(drawer.includes("bm-account-overlay"), "phones use an overlay, not a desktop Menu drawer");
assert(drawer.includes("ACCOUNT_MENU_OPEN_LABEL"), "phones get an Account control");
assert(!/bm-scrim/.test(drawer), "do not restore the old desktop scrim drawer");
const theme = read("lib/theme.ts");
assert(theme.includes(".bm-rail"), "rail width lives in theme");
assert(theme.includes(".bm-dash"), "dashboard canvas lives in theme");
assert(theme.includes(".bm-dash-inner"), "dashboard inner is the capped column");
assert(!/\.bm-rail\{flex:1 1/.test(theme.replace(/\s/g, "")), "grow-1 rail fattens the pair and fails");
assert(theme.includes(".bm-rail{flex:0 0 "), "rail is a capped column");
assert(PHONE_ACCOUNT_BREAKPOINT === 800, "phone breakpoint is 800");
assert(theme.includes("PHONE_ACCOUNT_BREAKPOINT"), "phone breakpoint is named");
assert(theme.includes(".bm-rail{display:none"), "phones hide the 240 rail");
assert(theme.includes(".bm-account-toggle{display:none}"), "desktop keeps the rail, no hamburger");
assert(!theme.includes("calc(100% - 240px - 96px)"), "do not use the old gap calc");
assert(!/\.bm-dash-inner\{[^}]*max-width:none/.test(theme.replace(/\s/g, "")), "full-bleed dash inner fails");
assert(!theme.includes("max-width:none"), "dash inner must not drop its max-width");
assert(/max-width:" \+\s*SIDEBAR_DASH_MAX/.test(theme), "dash inner uses the locked dash max");
assert(SIDEBAR_DASH_MAX >= 880 && SIDEBAR_DASH_MAX <= 992, "dash inner is high enough that 1280 is not a canyon");
assert(SIDEBAR_DASH_MAX !== 640, "640 dash max is the canyon and fails");
assert(!/SIDEBAR_DASH_MAX\s*=\s*640/.test(theme), "do not lock the 640 canyon");
const dashAt1280 = 1280 - SIDEBAR_RAIL_BASIS - SIDEBAR_RAIL_BASIS;
assert(dashAt1280 < SIDEBAR_DASH_MAX, "at 1280 the dash gives way so both rails stay 240");
assert(dashAt1280 >= 700, "dash still has room at 1280");
assert(theme.includes("[data-meetup-rail]{flex:0 0 "), "meetup rail matches the Account bar");
assert(!theme.includes("minmax(96px,1fr)"), "meetup is not leftover scraps after the dash");
assert(!/\.bm-dash\{flex:1 1/.test(theme.replace(/\s/g, "")), "do not grow the dash into the right cream");
assert(theme.includes(".bm-dash{flex:0 1 "), "dash column stays next to the rail");
assert(!/\.bm-dash-inner\{[^}]*margin:0 auto/.test(theme.replace(/\s/g, "")), "do not center a gap between rail and dash");
assert(SIDEBAR_RAIL_BASIS >= 240 && SIDEBAR_RAIL_BASIS <= 260, "desktop rail stays 240 to 260");
assert(SIDEBAR_RAIL_MAX >= 260 && SIDEBAR_RAIL_MAX <= 280, "rail max-width stays 260 to 280");
assert(SIDEBAR_RAIL_MIN >= 220 && SIDEBAR_RAIL_MIN <= 240, "rail min-width still fits labels");
assert(SIDEBAR_RAIL_SLIM >= 140 && SIDEBAR_RAIL_SLIM <= 180, "phones keep a slimmer visible rail");
assert(/display: "flex"/.test(home) && home.includes("<AccountDrawer />"), "home paints the rail in the shell");
assert(/display: "flex"/.test(chrome) && chrome.includes("<AccountDrawer />"), "AppChrome paints the rail in the shell");
assert(home.includes("AccountMenuControl") && chrome.includes("AccountMenuControl") && meetup.includes("AccountMenuControl"), "same Account control on Home, chrome, and meetup");
assert(home.includes('className="bm-dash"') && home.includes("bm-dash-inner"), "home uses the capped dash column");
assert(chrome.includes('className="bm-dash"') && chrome.includes("bm-dash-inner"), "AppChrome uses the capped dash column");
assert(meetup.includes('className="bm-dash"') && meetup.includes("bm-dash-inner"), "meetup uses the capped dash column");
assert(!/margin:\s*["']0 auto["']/.test(chrome + home + meetup), "hosts must not center a gap between rail and dash");
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

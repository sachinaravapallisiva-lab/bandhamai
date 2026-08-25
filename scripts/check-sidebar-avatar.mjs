import { readFileSync } from "node:fs";
import {
  ACCOUNT_MENU_FREE_CHIP,
  ACCOUNT_MENU_ITEMS,
  ACCOUNT_MENU_PAID_CHIP,
  ACCOUNT_MENU_TITLE,
  ACCOUNT_MENU_UPGRADE,
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
  itemIds.join(",") === "profile,preferences,browse,meetup,messages,verifyai,help,settings",
  "sidebar item order unchanged"
);
assert(
  itemLabels.join("|") ===
    "My profile|Preferences|Browse / Matches|Meetup this month|Messages|VerifyAI|Help / Support|Settings / Account",
  "sidebar labels unchanged"
);
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

assert(!/Start Speed Match/.test(drawer), "Speed Match stays off the sidebar");
assert(!drawer.includes("About"), "footer About stays off the sidebar");
assert(!/Who viewed you|Seen profiles/.test(drawer), "Seen profiles stays off this PR");

console.log("sidebar avatar ok", {
  size: SIDEBAR_AVATAR_SIZE,
  items: itemLabels,
  chip: ACCOUNT_MENU_PAID_CHIP,
  subscribe: ACCOUNT_MENU_UPGRADE,
});

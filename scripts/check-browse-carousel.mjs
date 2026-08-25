import { readFileSync } from "node:fs";
import {
  BROWSE_CAROUSEL_ADVANCE_MS,
  BROWSE_CAROUSEL_ARIA,
  BROWSE_CAROUSEL_EMPTY_BODY,
  BROWSE_CAROUSEL_EMPTY_TITLE,
  BROWSE_CAROUSEL_MOTION,
  BROWSE_CAROUSEL_NEXT,
  BROWSE_CAROUSEL_PREV,
  BROWSE_CAROUSEL_SLIDE_MS,
  clampCarouselIndex,
  nextCarouselIndex,
  prevCarouselIndex,
  shouldAutoAdvance,
} from "../lib/browse-carousel.ts";
import { BROWSE_PIN_CAP, BROWSE_PINNED_LABEL, BROWSE_PRIORITY_MARK } from "../lib/browse-pin.ts";
import {
  BROWSE_TEST_PINNED_IDS,
  BROWSE_TEST_PROFILES,
  BROWSE_TEST_SEED_COUNT,
  BROWSE_TEST_SEED_ENABLED,
  BROWSE_TEST_SEEDS,
  browsePinnedPreview,
  browseShortlistPond,
} from "../lib/browse-test-pond.ts";
import { PROFILE_PHOTO_SOON } from "../lib/profile-card.ts";
import {
  BROWSE_EMPTY_INVENTORY_TITLE,
  BROWSE_EMPTY_RESULTS_TITLE,
} from "../lib/surfaces.ts";
import { SIDEBAR_DASH_MAX, SIDEBAR_RAIL_BASIS } from "../lib/theme.ts";

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

const page = read("app/page.tsx");
const carousel = read("app/components/BrowseCarousel.tsx");
const discover = read("app/components/DiscoverCard.tsx");
const pinnedRow = read("app/components/PinnedRow.tsx");
const lib = read("lib/browse-carousel.ts");
const pinLib = read("lib/browse-pin.ts");
const testPond = read("lib/browse-test-pond.ts");
const theme = read("lib/theme.ts");
const pageCode = stripComments(page);
const carouselCode = stripComments(carousel);
const libCode = stripComments(lib);
const pinCode = stripComments(pinnedRow + pinLib);

assert(page.includes("BrowseCarousel"), "Browse middle slot must render BrowseCarousel");
assert(page.includes("PinnedRow"), "Pinned row sits on Browse");
assert(page.includes("browseShortlistPond"), "shortlist pond is the preview helper");
assert(page.includes("profiles={pond}"), "carousel rolls the shortlist pond");
assert(page.indexOf("<PinnedRow") < page.indexOf("<BrowseCarousel"), "Pinned row is above the rolling card");
assert(page.includes("/api/profiles/search"), "live search API stays");
assert(!/const current = profiles\[0\]/.test(pageCode), "Browse must not pin a single static middle card");
assert(!/<DiscoverCard[\s\S]*profile=\{current\}/.test(pageCode), "single DiscoverCard shortlist slot is gone");

assert(carousel.includes("DiscoverCard"), "carousel reuses existing Discover card chrome");
assert(carousel.includes("showHeart={false}"), "shortlist does not use heart buttons");
assert(carousel.includes("setInterval"), "auto-advance interval is present");
assert(carousel.includes("BROWSE_CAROUSEL_ADVANCE_MS"), "auto-advance uses the shared interval");
assert(carousel.includes("prefers-reduced-motion"), "reduced motion is read");
assert(carousel.includes("translateX"), "advance is a sideways translateX");
assert(carousel.includes("BROWSE_CAROUSEL_SLIDE_MS"), "slide duration is set");
assert(carousel.includes("data-slide-motion"), "sideways motion is marked");
assert(BROWSE_CAROUSEL_MOTION === "sideways", "motion lock is sideways");
assert(BROWSE_CAROUSEL_SLIDE_MS >= 400, "slide is not an instant swap");
assert(!/opacity:\s*0/.test(carouselCode.replace(/prefers-reduced-motion[\s\S]*?}/g, "")), "advance is not a fade to empty");
assert(!/crossfade|fadeIn|fade-in/i.test(carouselCode), "advance is not a fade");
assert(!/transition:\s*["']opacity/.test(carouselCode), "track must not fade the next card in");
assert(carousel.includes("transform"), "cards slide, they do not swap in place");

assert(BROWSE_CAROUSEL_ADVANCE_MS >= 3000, "auto-advance must wait long enough to read a card");
assert(nextCarouselIndex(0, 3) === 1, "advance moves one profile");
assert(nextCarouselIndex(2, 3) === 0, "advance wraps to the start");
assert(prevCarouselIndex(0, 3) === 2, "previous wraps to the end");
assert(clampCarouselIndex(9, 2) === 1, "index clamps when the pond shrinks");
assert(shouldAutoAdvance({ reduceMotion: false, count: 3 }) === true, "two or more profiles auto-roll");
assert(shouldAutoAdvance({ reduceMotion: true, count: 3 }) === false, "reduced motion does not auto-roll");
assert(shouldAutoAdvance({ reduceMotion: false, count: 1 }) === false, "a single profile does not auto-roll");

assert(BROWSE_TEST_SEED_ENABLED === true, "preview seed is on for this PR");
assert(BROWSE_TEST_SEED_COUNT === 20, "seed count lock");
assert(BROWSE_TEST_SEEDS.length === 20, "twenty test seeds");
assert(BROWSE_TEST_PROFILES.length === 20, "twenty test profiles");
assert(browseShortlistPond([]).length === 20, "empty live pond still rolls the test shortlist");
assert(
  BROWSE_TEST_PROFILES.every(function (profile) {
    return profile.photoUrl === "" && profile.verified === false && profile.promptLabel === "About";
  }),
  "test cards are Photo coming soon, unverified, About"
);
assert(BROWSE_PIN_CAP === 10, "pin cap is 10");
assert(BROWSE_PRIORITY_MARK === "Priority", "mark is Priority");
assert(BROWSE_PINNED_LABEL === "PINNED", "row label is PINNED");
assert(BROWSE_TEST_PINNED_IDS.length >= 3, "several pinned test cards");
assert(BROWSE_TEST_PINNED_IDS.length <= BROWSE_PIN_CAP, "pinned ids honor the cap");
assert(browsePinnedPreview().length === BROWSE_TEST_PINNED_IDS.length, "preview pin row uses the capped ids");
assert(pinnedRow.includes("BROWSE_PRIORITY_MARK"), "pin cards show Priority");
assert(pinnedRow.includes("PROFILE_PHOTO_SOON") || pinnedRow.includes(PROFILE_PHOTO_SOON), "pin cards use Photo coming soon");
assert(pinnedRow.includes("PresenceMark"), "pin cards show online or offline");
assert(pinnedRow.includes("flexWrap: \"nowrap\""), "pinned cards stay on one horizontal line");
assert(pinnedRow.includes("overflowX: \"auto\""), "the pin line can scroll sideways if needed");
assert(!/flexWrap:\s*["']wrap["']/.test(pinnedRow), "pin row must not wrap into a second stack");
assert(!/flex:\s*["']0 0 240px["']/.test(pinnedRow), "pin cards must not be full 240 Discover cards");
assert(!pinnedRow.includes("ProfileFactChips"), "pin cards stay compact, no tall chip stack");
assert(!pinnedRow.includes("profile.note"), "pin cards do not show the tall About body");
assert(testPond.includes("TEST ONLY") || testPond.includes("TEST ONLY preview"), "seed is labeled test in code");
assert(!/Test|Demo|Fake/.test(stripComments(pinnedRow)), "no loud Test Demo Fake banner on the pin row");
assert(!/Featured|boost|crown|♛|👑/i.test(pinCode), "pin row is not Featured, boost, or crown");
assert(!/4\.99|7 days|paywall/i.test(pinCode + testPond), "paid Stripe pin stays parked");

assert(BROWSE_CAROUSEL_EMPTY_TITLE === "No matches yet.", "empty title is honest");
assert(BROWSE_CAROUSEL_EMPTY_BODY.includes(PROFILE_PHOTO_SOON), "empty body names Photo coming soon");
[
  BROWSE_CAROUSEL_ARIA,
  BROWSE_CAROUSEL_PREV,
  BROWSE_CAROUSEL_NEXT,
  BROWSE_CAROUSEL_EMPTY_TITLE,
  BROWSE_CAROUSEL_EMPTY_BODY,
  BROWSE_PRIORITY_MARK,
  BROWSE_PINNED_LABEL,
]
  .concat(
    BROWSE_TEST_SEEDS.flatMap(function (row) {
      return [row.name, row.city, row.work, row.note];
    })
  )
  .forEach(function (value) {
    assert(!copyHasDash(value), "new copy must not use a hyphen or dash: " + value);
  });

assert(page.includes("EmptyState"), "Browse still fails closed with empty copy");
assert(
  page.includes("BROWSE_EMPTY_INVENTORY_TITLE") || page.includes(BROWSE_EMPTY_INVENTORY_TITLE),
  "inventory empty stays honest"
);
assert(
  page.includes("BROWSE_EMPTY_RESULTS_TITLE") || page.includes(BROWSE_EMPTY_RESULTS_TITLE),
  "no-match empty stays honest"
);
assert(discover.includes("ProfilePhotoSoon") || discover.includes(PROFILE_PHOTO_SOON), "cards keep Photo coming soon");
assert(discover.includes("VerifyBadge"), "VerifyAI badge stays on Discover cards");
assert(discover.includes("verified={profile.verified}"), "badge uses the live verified flag");

const fakeNames = /\b(Priya|Ananya)\b/;
assert(!fakeNames.test(carouselCode), "carousel component must not hardcode Priya or Ananya");
assert(!fakeNames.test(libCode), "carousel lib must not hardcode Priya or Ananya");
assert(!fakeNames.test(stripComments(pinnedRow)), "pin row must not hardcode Priya or Ananya");
assert(!/unsplash|randomuser|pravatar|i\.pravatar|placeholder\.com|thispersondoesnotexist/i.test(carouselCode + libCode + testPond), "no stock faces");

const datingChrome =
  /\b(swipe|hot near you|hot-near-you|super[\s-]?like|tinder|snapchat|stories|for you tonight|boost now|hook-?up|crush)\b/i;
assert(!datingChrome.test(carouselCode + pinCode + testPond), "no swipe or hot-near-you dating chrome");
assert(!/\bonTouchStart\b|\bonTouchEnd\b|\bswipeLeft\b|\bswipeRight\b/.test(carouselCode + pinnedRow), "not a swipe deck");
assert(!/\{isLiked \? ["']Liked["'] : ["']Like["']\}/.test(carouselCode + pageCode), "no Like toggle was added");
assert(discover.includes("Interested"), "existing Interested action stays on the card");
assert(page.includes("Find your vibe match?"), "tagline stays Find your vibe match?");
assert(!/Bandhamai/.test(carouselCode + pinnedRow), "wordmark stays Bandham AI as two words");
assert(!/\$9\.99 for messaging/i.test(carouselCode + libCode + pageCode), "do not say subscription is $9.99 for messaging");
assert(!/\+1 640 837 9459/.test(page + carousel + pinnedRow + testPond), "do not publish the support number here");

assert(SIDEBAR_RAIL_BASIS === 240, "rail stays 240");
assert(SIDEBAR_DASH_MAX === 920, "dash stays 920");
assert(!theme.includes("calc(100% - 240px - 96px)"), "do not use the old gap calc");
assert(!/maxWidth:\s*640/.test(pageCode), "do not restore the 640 canyon on Home");

const menu = read("lib/account-menu.ts");
assert(menu.includes("Inbox"), "Inbox stays");
assert(menu.includes("Block"), "Block stays");
assert(menu.includes("Call us"), "Call us stays");

console.log("browse carousel ok", {
  advanceMs: BROWSE_CAROUSEL_ADVANCE_MS,
  slideMs: BROWSE_CAROUSEL_SLIDE_MS,
  motion: BROWSE_CAROUSEL_MOTION,
  seeds: BROWSE_TEST_PROFILES.length,
  pinned: BROWSE_TEST_PINNED_IDS.length,
});

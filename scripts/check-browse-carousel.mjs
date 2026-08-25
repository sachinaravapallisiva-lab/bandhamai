import { readFileSync } from "node:fs";
import {
  BROWSE_CAROUSEL_ADVANCE_MS,
  BROWSE_CAROUSEL_ARIA,
  BROWSE_CAROUSEL_EMPTY_BODY,
  BROWSE_CAROUSEL_EMPTY_TITLE,
  BROWSE_CAROUSEL_NEXT,
  BROWSE_CAROUSEL_PREV,
  clampCarouselIndex,
  nextCarouselIndex,
  prevCarouselIndex,
  shouldAutoAdvance,
} from "../lib/browse-carousel.ts";
import { PROFILE_PHOTO_SOON } from "../lib/profile-card.ts";
import {
  BROWSE_EMPTY_INVENTORY_TITLE,
  BROWSE_EMPTY_RESULTS_TITLE,
} from "../lib/surfaces.ts";

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
const lib = read("lib/browse-carousel.ts");
const pageCode = stripComments(page);
const carouselCode = stripComments(carousel);
const libCode = stripComments(lib);

assert(page.includes("BrowseCarousel"), "Browse middle slot must render BrowseCarousel");
assert(page.includes("/api/profiles/search"), "carousel pond is the live profiles search API");
assert(page.includes("profiles={profiles}"), "carousel uses the live Browse pond, not a dummy list");
assert(!/const current = profiles\[0\]/.test(pageCode), "Browse must not pin a single static middle card");
assert(!/<DiscoverCard[\s\S]*profile=\{current\}/.test(pageCode), "single DiscoverCard shortlist slot is gone");

assert(carousel.includes("DiscoverCard"), "carousel reuses existing Discover card chrome");
assert(carousel.includes("setInterval"), "auto-advance interval is present");
assert(carousel.includes("BROWSE_CAROUSEL_ADVANCE_MS"), "auto-advance uses the shared interval");
assert(carousel.includes("prefers-reduced-motion"), "reduced motion is read");
assert(carousel.includes("shouldAutoAdvance"), "auto-advance is gated");
assert(carousel.includes("data-browse-carousel"), "carousel is marked for the live pond");
assert(carousel.includes("data-auto-advance"), "auto-advance state is visible");
assert(carousel.includes("translateX"), "profiles slide, they do not swap a static dummy");

assert(BROWSE_CAROUSEL_ADVANCE_MS >= 3000, "auto-advance must wait long enough to read a card");
assert(nextCarouselIndex(0, 3) === 1, "advance moves one profile");
assert(nextCarouselIndex(2, 3) === 0, "advance wraps to the start");
assert(prevCarouselIndex(0, 3) === 2, "previous wraps to the end");
assert(clampCarouselIndex(9, 2) === 1, "index clamps when the pond shrinks");
assert(shouldAutoAdvance({ reduceMotion: false, count: 3 }) === true, "two or more live profiles auto-roll");
assert(shouldAutoAdvance({ reduceMotion: true, count: 3 }) === false, "reduced motion does not auto-roll");
assert(shouldAutoAdvance({ reduceMotion: false, count: 1 }) === false, "a single profile does not auto-roll");
assert(shouldAutoAdvance({ reduceMotion: false, count: 4, paused: true }) === false, "hover or focus can pause the roll");

assert(BROWSE_CAROUSEL_EMPTY_TITLE === "No matches yet.", "empty title is honest");
assert(BROWSE_CAROUSEL_EMPTY_BODY.includes(PROFILE_PHOTO_SOON), "empty body names Photo coming soon");
assert(BROWSE_CAROUSEL_ARIA === "Live profiles", "carousel name is Live profiles");
assert(BROWSE_CAROUSEL_PREV === "Previous", "previous copy lock");
assert(BROWSE_CAROUSEL_NEXT === "Next", "next copy lock");
[
  BROWSE_CAROUSEL_ARIA,
  BROWSE_CAROUSEL_PREV,
  BROWSE_CAROUSEL_NEXT,
  BROWSE_CAROUSEL_EMPTY_TITLE,
  BROWSE_CAROUSEL_EMPTY_BODY,
].forEach(function (value) {
  assert(!copyHasDash(value), "new carousel copy must not use a hyphen or dash: " + value);
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
assert(carousel.includes("BROWSE_CAROUSEL_EMPTY_TITLE"), "carousel fail-closed empty is wired");
assert(discover.includes("ProfilePhotoSoon") || discover.includes(PROFILE_PHOTO_SOON), "cards keep Photo coming soon");
assert(discover.includes("VerifyBadge"), "VerifyAI badge stays on Discover cards");
assert(discover.includes("verified={profile.verified}"), "badge uses the live verified flag");

const fakeNames = /\b(Priya|Ananya|Rohan|Kavya|Aisha|Meera)\b/;
assert(!fakeNames.test(carouselCode), "carousel must not hardcode fake Priya or Ananya names");
assert(!fakeNames.test(libCode), "carousel lib must not hardcode fake names");
assert(!/unsplash|randomuser|pravatar|i\.pravatar|placeholder\.com|thispersondoesnotexist/i.test(carouselCode + libCode), "no stock faces");
assert(!/full_name:\s*["']Priya|name:\s*["']Priya|name:\s*["']Ananya/.test(pageCode + carouselCode), "no dummy Priya cards on Browse");

const datingChrome =
  /\b(swipe|hot near you|hot-near-you|super[\s-]?like|tinder|snapchat|stories|for you tonight|boost now|hook-?up|crush)\b/i;
assert(!datingChrome.test(carouselCode), "carousel has no swipe or hot-near-you dating chrome");
assert(!datingChrome.test(libCode), "carousel lib has no dating chrome");
assert(!/\bonTouchStart\b|\bonTouchEnd\b|\bswipeLeft\b|\bswipeRight\b/.test(carouselCode), "carousel is not swipe-first");
assert(!/\{isLiked \? ["']Liked["'] : ["']Like["']\}/.test(carouselCode + pageCode), "no Like toggle was added");
assert(discover.includes("Interested"), "existing Interested action stays on the card");
assert(!carousel.includes("Hot near you"), "no Hot near you");
assert(page.includes("Find your vibe match?"), "tagline stays Find your vibe match?");
assert(!/Bandhamai/.test(carouselCode), "wordmark stays Bandham AI as two words");
assert(!/\$9\.99 for messaging/i.test(carouselCode + libCode + pageCode), "do not say subscription is $9.99 for messaging");

console.log("browse carousel ok", {
  advanceMs: BROWSE_CAROUSEL_ADVANCE_MS,
  empty: BROWSE_CAROUSEL_EMPTY_TITLE,
});

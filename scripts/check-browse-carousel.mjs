import { existsSync, readFileSync, statSync } from "node:fs";
import {
  BROWSE_CAROUSEL_ADVANCE_MS,
  BROWSE_CAROUSEL_ARIA,
  BROWSE_CAROUSEL_EMPTY_BODY,
  BROWSE_CAROUSEL_EMPTY_TITLE,
  BROWSE_CAROUSEL_MOTION,
  BROWSE_CAROUSEL_NEXT,
  BROWSE_CAROUSEL_PREV,
  BROWSE_CAROUSEL_PHOTO_HEIGHT,
  BROWSE_CAROUSEL_PHOTO_WIDTH,
  BROWSE_CAROUSEL_SLIDE_MS,
  clampCarouselIndex,
  nextCarouselIndex,
  prevCarouselIndex,
  shouldAutoAdvance,
} from "../lib/browse-carousel.ts";
import {
  BROWSE_PIN_CAP,
  BROWSE_PIN_CAP_NOTE,
  BROWSE_PIN_CARD_WIDTH,
  BROWSE_PIN_NOT_CONFIGURED,
  BROWSE_PIN_PHOTO_DIR,
  BROWSE_PIN_PHOTO_HEIGHT,
  BROWSE_PIN_RENEW_NOTE,
  BROWSE_PIN_SEPARATE_NOTE,
  BROWSE_PIN_VOICE,
  BROWSE_PINNED_LABEL,
  BROWSE_PRIORITY_MARK,
  PIN_CHECKOUT_PATH,
} from "../lib/browse-pin.ts";
import { MEETUP_TEST_POSTS, MEETUP_TEST_SEED_ENABLED } from "../lib/meetup-test-pond.ts";
import {
  BROWSE_TEST_PINNED_IDS,
  BROWSE_TEST_PROFILES,
  BROWSE_TEST_SEED_COUNT,
  BROWSE_TEST_SEED_ENABLED,
  BROWSE_TEST_SEEDS,
  browsePinnedPreview,
  browseShortlistPond,
} from "../lib/browse-test-pond.ts";
import {
  GET_PRIORITY,
  PLANS_BODY,
  PLANS_PATH,
  PLANS_PRIORITY_BODY,
  PLANS_PRIORITY_HEADLINE,
  PLANS_SUBSCRIBE_BODY,
  PLANS_SUBSCRIBE_CTA,
  PLANS_SUBSCRIBE_HEADLINE,
  PLANS_TITLE,
  PLANS_VERIFY_BODY,
  PLANS_VERIFY_HEADLINE,
} from "../lib/plans.ts";
import { PROFILE_PHOTO_HEIGHT, PROFILE_PHOTO_SOON } from "../lib/profile-card.ts";
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
    return profile.verified === false && profile.promptLabel === "About";
  }),
  "test cards stay unverified About"
);
assert(
  BROWSE_TEST_PROFILES.filter(function (profile) {
    return !BROWSE_TEST_PINNED_IDS.includes(profile.id);
  }).every(function (profile) {
    return profile.photoUrl === "";
  }),
  "unpinned slideshow cards stay Photo coming soon"
);
assert(BROWSE_PIN_CAP === 10, "pin cap is 10");
assert(BROWSE_PRIORITY_MARK === "Priority", "mark is Priority");
assert(BROWSE_PINNED_LABEL === "PINNED", "row label is PINNED");
assert(BROWSE_TEST_PINNED_IDS.length >= 3, "several pinned test cards");
assert(BROWSE_TEST_PINNED_IDS.length <= BROWSE_PIN_CAP, "pinned ids honor the cap");
assert(browsePinnedPreview().length === BROWSE_TEST_PINNED_IDS.length, "preview pin row uses the capped ids");
assert(pinnedRow.includes("BROWSE_PRIORITY_MARK"), "pin cards show Priority");
assert(!pinnedRow.includes("PROFILE_PHOTO_SOON") && !pinnedRow.includes(PROFILE_PHOTO_SOON), "pin cards must not say Photo coming soon");
assert(pinnedRow.includes("data-pin-photo"), "pin cards render a real photo");
assert(pinnedRow.includes('objectFit: "contain"'), "pin photos use contain so faces are not cropped");
assert(!/objectFit:\s*["']cover["']/.test(pinnedRow), "do not crop pin photos into a dating headshot");
assert(BROWSE_PIN_PHOTO_HEIGHT >= 140, "pin photo well is tall enough to show the portrait");
assert(BROWSE_PIN_CARD_WIDTH >= 148 && BROWSE_PIN_CARD_WIDTH < 240, "pin cards stay compact, not 240 roll cards");
assert(pinnedRow.includes("overflow: \"visible\"") || pinnedRow.includes("overflowY: \"visible\""), "pin bar does not clip card contents");
assert(!/maxHeight:\s*\d+/.test(pinnedRow), "do not lock a short max height that clips the city line");
assert(browsePinnedPreview().length === BROWSE_TEST_PINNED_IDS.length, "preview pin row uses the capped ids");
assert(
  browsePinnedPreview().every(function (profile) {
    return profile.photoUrl.indexOf(BROWSE_PIN_PHOTO_DIR + "/") === 0 && profile.city.trim().length > 0;
  }),
  "every pinned preview card has a portrait and a city"
);
browsePinnedPreview().forEach(function (profile) {
  const rel = "public" + profile.photoUrl;
  assert(existsSync(new URL("../" + rel, import.meta.url)), "pin portrait file exists: " + rel);
  assert(statSync(new URL("../" + rel, import.meta.url)).size > 4000, "pin portrait is a real image: " + rel);
});
const pinPhotos = browsePinnedPreview().map(function (profile) {
  return profile.photoUrl;
});
assert(new Set(pinPhotos).size === pinPhotos.length, "pinned portraits are distinct");
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
assert(BROWSE_PIN_VOICE === "Priority $4.99 for 7 days", "pin voice lock stays for Plans");
assert(GET_PRIORITY === "Get Priority", "dashboard CTA is Get Priority");
assert(PLANS_PATH === "/plans", "Plans path lock");
assert(pinnedRow.includes("GET_PRIORITY") || pinnedRow.includes(GET_PRIORITY), "pin row shows Get Priority");
assert(pinnedRow.includes("PLANS_PATH") || pinnedRow.includes(PLANS_PATH), "Get Priority goes to Plans");
assert(!/\$4\.99/.test(pinnedRow), "pin row has no $4.99 prose");
assert(!/\$9\.99/.test(pinnedRow), "pin row has no $9.99 prose");
assert(!/Cap 10 pins per week/.test(pinnedRow), "cap copy left the dashboard");
assert(!/Pay again to renew/.test(pinnedRow), "renew copy left the dashboard");
assert(!/\$4\.99/.test(page), "Home dashboard has no $4.99 prose");
assert(BROWSE_PIN_CAP_NOTE.toLowerCase().includes("cap 10 pins per week"), "weekly cap is named on Plans");
assert(BROWSE_PIN_RENEW_NOTE.toLowerCase().includes("pay again"), "same or new profiles renew by paying again");
assert(BROWSE_PIN_SEPARATE_NOTE.includes("$9.99 a month"), "pin is separate from the monthly subscription");
assert(BROWSE_PIN_SEPARATE_NOTE.includes("$4.99 one time"), "pin is separate from VerifyAI");
assert(BROWSE_CAROUSEL_PHOTO_HEIGHT >= 180 && BROWSE_CAROUSEL_PHOTO_HEIGHT <= 220, "shortlist photo is medium small");
assert(BROWSE_CAROUSEL_PHOTO_WIDTH < 240, "shortlist photo is not a wide billboard");
assert(BROWSE_CAROUSEL_PHOTO_HEIGHT < PROFILE_PHOTO_HEIGHT, "shortlist photo is shorter than the old 280 well");
assert(discover.includes("BROWSE_CAROUSEL_PHOTO_HEIGHT"), "Discover card uses the smaller photo well");
assert(discover.includes('objectFit: "cover"'), "shortlist photo keeps the face in frame");
assert(BROWSE_PIN_PHOTO_HEIGHT === 150, "do not retune the pin photo well");
assert(BROWSE_PIN_CARD_WIDTH === 168, "do not retune the pin card width");
assert(!/\$9\.99 for messaging/i.test(pinCode + testPond), "do not say subscription is $9.99 for messaging");
assert(!/price_[a-zA-Z0-9]+/.test(pinCode + testPond), "do not invent a pin Price ID");
assert(!/STRIPE_PIN_PRICE_ID/.test(stripComments(pinLib + pinnedRow)), "do not invent STRIPE_PIN_PRICE_ID in pin UI");

const pinCheckout = read("app/api/pins/checkout/route.ts");
assert(pinCheckout.includes("pinCheckoutNotConfiguredPayload") || pinCheckout.includes(BROWSE_PIN_NOT_CONFIGURED), "pin pay fails closed");
assert(pinCheckout.includes("503"), "pin pay fail closed is 503");
assert(!pinCheckout.includes("checkout.sessions.create"), "pin checkout does not open live Stripe");
assert(!/price_[a-zA-Z0-9]+/.test(pinCheckout), "pin checkout does not invent a Price ID");
assert(!/STRIPE_PIN_PRICE_ID\s*=/.test(pinCheckout), "pin checkout does not invent STRIPE_PIN_PRICE_ID");

const envExample = read(".env.example");
assert(!/STRIPE_PIN_PRICE_ID=/.test(envExample), "do not invent STRIPE_PIN_PRICE_ID");
assert(!/STRIPE_PIN_PRICE_ID=price_/.test(envExample), "do not invent a live pin Price ID");

const plansPage = read("app/plans/page.tsx");
const plansPanel = read("app/components/PlansPanel.tsx");
const plansLib = read("lib/plans.ts");
assert(plansPage.includes("PlansPanel"), "Plans page hosts the three costs");
assert(PLANS_SUBSCRIBE_HEADLINE === "Bandham AI subscription is $9.99 a month", "Bandham AI price line lock");
assert(
  PLANS_SUBSCRIBE_BODY ===
    "View numbers. Socials after they approve. Send unlimited messages. Call on the app. Browse, search, Speed Match, and profile stay free.",
  "Bandham AI description lock"
);
assert(PLANS_SUBSCRIBE_CTA === "Subscribe $9.99 a month", "Bandham AI button lock");
assert(PLANS_PRIORITY_HEADLINE === "Priority $4.99 for 7 days", "Priority price line lock");
assert(
  PLANS_PRIORITY_BODY ===
    "Puts your profile on top of Home and Browse for 7 days. Cap 10 pins a week. Pay again to stay on top.",
  "Priority description lock"
);
assert(PLANS_VERIFY_HEADLINE === "VerifyAI $4.99 one time", "VerifyAI price line lock");
assert(
  PLANS_VERIFY_BODY === "Profile verification. Adds a verification badge on your Bandham profile.",
  "VerifyAI description lock"
);
assert(plansPanel.includes("PLANS_PRIORITY_HEADLINE"), "Plans names Priority $4.99 for 7 days");
assert(plansPanel.includes("PIN_CHECKOUT_PATH"), "Plans pin pay stays fail closed");
assert(!/STRIPE_PIN_PRICE_ID=price_/.test(plansPanel), "Plans does not invent a pin Price");
assert(PLANS_SUBSCRIBE_BODY.toLowerCase().includes("unlimited messages"), "unlimited messages is a required feature");
assert(PLANS_SUBSCRIBE_BODY.toLowerCase().includes("socials after they approve"), "socials only after approval");
assert(!/view numbers and socials/i.test(PLANS_SUBSCRIBE_BODY), "do not say you can view socials with the month alone");
assert(!/monthly messaging/i.test(plansLib + plansPanel + plansPage + page), "do not write Monthly messaging");
assert(!/messaging/i.test(plansLib + plansPanel + plansPage + page), "Plans and Home do not call the product messaging");
assert(!/\$9\.99 for messaging/i.test(plansLib + plansPanel + page), "do not say subscription is $9.99 for messaging");
assert(plansPanel.includes('data-plan-card="bandham-ai"'), "Bandham AI is its own card");
assert(plansPanel.includes('data-plan-card="priority"'), "Priority is its own card");
assert(plansPanel.includes('data-plan-card="verifyai"'), "VerifyAI is its own card");
assert(plansPanel.includes("bm-serif"), "Bandham AI keeps a serif price line");
assert(plansPanel.includes("WASH"), "Priority card is visually distinct");

assert(page.includes("MeetupRail"), "right cream is the meetup stack");
assert(page.indexOf("<MeetupRail") > page.indexOf('className="bm-dash"'), "meetup stack sits after the dash");
assert(page.indexOf("<MeetupCard") > page.indexOf("<MeetupRail"), "this month card is in the right stack");
assert(MEETUP_TEST_SEED_ENABLED === true, "meetup test posts are on for this PR");
assert(MEETUP_TEST_POSTS.length >= 3, "right stack has more than this month");
assert(
  MEETUP_TEST_POSTS.every(function (post) {
    return post.body && !/\$\d/.test(post.body) && !/price_/i.test(post.body + post.title);
  }),
  "test meetup posts name no ticket price"
);

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
  BROWSE_PIN_VOICE,
  BROWSE_PIN_CAP_NOTE,
  BROWSE_PIN_RENEW_NOTE,
  BROWSE_PIN_SEPARATE_NOTE,
  BROWSE_PIN_NOT_CONFIGURED,
  GET_PRIORITY,
  PLANS_TITLE,
  PLANS_BODY,
  PLANS_SUBSCRIBE_HEADLINE,
  PLANS_SUBSCRIBE_BODY,
  PLANS_SUBSCRIBE_CTA,
  PLANS_PRIORITY_HEADLINE,
  PLANS_PRIORITY_BODY,
  PLANS_VERIFY_HEADLINE,
  PLANS_VERIFY_BODY,
]
  .concat(
    BROWSE_TEST_SEEDS.flatMap(function (row) {
      return [row.name, row.city, row.work, row.note];
    })
  )
  .concat(
    MEETUP_TEST_POSTS.flatMap(function (post) {
      return [post.kicker, post.monthLabel, post.title, post.body];
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

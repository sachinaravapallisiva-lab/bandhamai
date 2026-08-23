import { readFileSync } from "node:fs";
import { CREAM, GOLD, WASH } from "../lib/theme.ts";
import { SEARCH_HINT } from "../lib/surfaces.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const page = read("app/page.tsx");
const card = read("app/components/DiscoverCard.tsx");
const badge = read("app/components/VerifyBadge.tsx");
const chip = read("app/components/VoiceAssistant.tsx");
const layout = read("app/layout.tsx");
const theme = read("lib/theme.ts");

assert(layout.includes('default: "Bandham AI"'), "document title is Bandham AI");
assert(!layout.includes("Create Next App"), "layout must not use the create-next-app title");
assert(layout.includes("Newsreader"), "serif wordmark font is loaded");
assert(layout.includes("Schibsted_Grotesk"), "sans UI font is loaded");

assert(WASH === "#F6F0E6", "page wash is warm cream");
assert(CREAM === "#FBF6EC", "card surface is soft cream");
assert(GOLD === "#C4A46A", "muted gold token exists");
assert(theme.includes("export const GOLD"), "gold is a named token");

assert(page.includes("DiscoverCard"), "Browse uses the photo-first Discover card");
assert(page.includes("currentProfile"), "Browse shows one profile at a time");
assert(!page.includes("A SHORTLIST, NOT A STACK"), "shortlist stack label is gone");
assert(!page.includes("{profiles.map"), "Browse must not render a stack of cards");
assert(!/94\s*%|91\s*%|match\s*%|matchPercent|match_percent/i.test(page), "no match % theater on home");
assert(!/94\s*%|91\s*%|match\s*%|matchPercent|match_percent/i.test(card), "no match % theater on Discover card");
assert(!page.includes(">Like<") && !page.includes('"Like"') && !page.includes("'Like'"), "Like label is gone from home");
assert(card.includes("Interested"), "primary action is Interested");
assert(card.includes("Pass"), "Pass stays");
assert(card.includes("Save"), "Save is present");
assert(!card.includes("Speed Match") && !card.includes("SpeedMatch"), "Speed Match stays off Discover");
assert(!page.includes("Start Speed Match") || page.includes('tab === "matches"'), "Speed Match remains Matches-only");

assert(badge.includes("GOLD"), "VerifyAI mark uses muted gold");
assert(badge.includes("<svg"), "VerifyAI is a quiet shield, not a loud text pill");
assert(!badge.includes("VERIFYAI"), "no loud VERIFYAI text badge");
assert(badge.includes("if (!verified) return null"), "unverified stays hidden");

assert(chip.includes("ba-chip"), "guru launcher is a chip");
assert(chip.includes("height: 36"), "chip is small so the profile card owns the screen");
assert(!chip.includes("width: 58"), "large 58px orb is gone");
assert(SEARCH_HINT.toLowerCase().includes("mic chip"), "search copy points at the chip");
assert(chip.includes("GURU_PATH") || chip.includes("/api/guru"), "chip still opens the guru");
assert(!chip.includes("/api/profiles/search"), "chip never searches profiles");

assert(page.includes("BrandWordmark"), "home uses BANDHAM AI wordmark");
assert(read("app/components/BrandWordmark.tsx").includes("BANDHAM AI"), "wordmark text is Bandham AI");

console.log("pack 1 ui locks ok");

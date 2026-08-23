import { readFileSync } from "node:fs";
import {
  BROWSE_EMPTY_INVENTORY_TITLE,
  BROWSE_EMPTY_RESULTS_TITLE,
  GURU_INTRO,
  GURU_ORB_LABEL,
  GURU_SPEAKER,
  GURU_TITLE,
  MATCHES_EMPTY_TITLE,
} from "../lib/surfaces.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const orb = readFileSync(new URL("../app/components/VoiceAssistant.tsx", import.meta.url), "utf8");
const empty = readFileSync(new URL("../app/components/EmptyState.tsx", import.meta.url), "utf8");
const matchCard = readFileSync(new URL("../app/components/MatchCard.tsx", import.meta.url), "utf8");
const discover = readFileSync(new URL("../app/components/DiscoverCard.tsx", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../app/components/AppChrome.tsx", import.meta.url), "utf8");

const userFacing = [GURU_TITLE, GURU_ORB_LABEL, GURU_INTRO, GURU_SPEAKER].join("\n");
assert(GURU_TITLE === "Bandham assistant", "title lock");
assert(GURU_ORB_LABEL === "Open Bandham assistant", "aria-label lock");
assert(GURU_SPEAKER === "ASSISTANT", "transcript speaker lock");
assert(!/love guru/i.test(userFacing), "exported copy must not say love guru");
assert(!/open love guru/i.test(userFacing), "exported copy must not say open love guru");

const uiSources = [stripComments(page), stripComments(orb), stripComments(empty), stripComments(matchCard)];
uiSources.forEach(function (src) {
  assert(!/love guru/i.test(src), "no user-visible love guru leftover");
  assert(!/open love guru/i.test(src), "no Open love guru leftover");
});

assert(orb.includes("GURU_TITLE"), "chip uses shared title");
assert(orb.includes("GURU_ORB_LABEL"), "chip uses shared aria-label");
assert(orb.includes("height: 36"), "Pack 1 mic chip stays small");
assert(!/width:\s*64|height:\s*64|width:\s*72|height:\s*72/.test(orb), "large orb must not return");
assert(orb.includes("borderRadius: 999"), "chip stays pill-shaped");

assert(page.includes("EmptyState"), "Browse/Matches empty states are designed");
assert(page.includes("BROWSE_EMPTY_RESULTS_TITLE") || page.includes(BROWSE_EMPTY_RESULTS_TITLE), "Browse no-results copy");
assert(page.includes("MATCHES_EMPTY_TITLE") || page.includes(MATCHES_EMPTY_TITLE), "Matches empty copy");
assert(BROWSE_EMPTY_INVENTORY_TITLE === "No live profiles yet.", "inventory empty title");
assert(BROWSE_EMPTY_RESULTS_TITLE === "No matches for that yet.", "results empty title");
assert(MATCHES_EMPTY_TITLE === "No one yet.", "matches empty title");

assert(empty.includes("FDF8F1") || empty.includes("CREAM"), "empty state sits on cream");
assert(empty.includes("GOLD") || empty.includes("#C4A36A"), "empty state uses quiet gold");
assert(empty.includes("VIOLET_DEEP") || empty.includes("#4C1D95"), "empty state uses deep violet");
assert(empty.includes("borderRadius: 22"), "empty state uses Pack 1 card radius");

assert(page.includes("MatchCard"), "Matches uses the cream card");
assert(matchCard.includes("VerifyBadge"), "Matches keep the quiet gold VerifyAI mark");
assert(matchCard.includes("PresenceMark"), "Matches keep the signed-in presence mark");
assert(matchCard.includes("VIOLET_DEEP") || matchCard.includes("#4C1D95"), "Matches name uses deep violet");
assert(matchCard.includes("borderRadius: 22"), "Matches card radius matches Discover");
assert(matchCard.includes("Start Speed Match"), "Speed Match stays on Matches cards");
assert(!page.includes("Start Speed Match") || !/tab === \"browse\"[\s\S]*Start Speed Match/.test(page), "Speed Match stays off Browse");
assert(discover.includes("Interested"), "Pack 1 DiscoverCard actions stay");
assert(chrome.includes("Bandhamai"), "wordmark is still Bandhamai");
assert(page.includes("Bandhamai"), "home wordmark is still Bandhamai");

console.log("pack 2 ui ok", {
  title: GURU_TITLE,
  orbLabel: GURU_ORB_LABEL,
  emptyBrowse: BROWSE_EMPTY_RESULTS_TITLE,
  emptyMatches: MATCHES_EMPTY_TITLE,
});

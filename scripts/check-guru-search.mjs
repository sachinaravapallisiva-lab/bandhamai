import { readFileSync } from "node:fs";
import {
  GURU_INTRO,
  GURU_ORB_LABEL,
  GURU_PATH,
  GURU_PLACEHOLDER,
  GURU_STARTERS,
  GURU_TITLE,
  SEARCH_HINT,
  SEARCH_PLACEHOLDER,
} from "../lib/surfaces.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const orb = readFileSync(new URL("../app/components/VoiceAssistant.tsx", import.meta.url), "utf8");
const guruRoute = readFileSync(new URL("../app/api/guru/route.ts", import.meta.url), "utf8");
const chatRoute = readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
const guruLib = readFileSync(new URL("../lib/guru.ts", import.meta.url), "utf8");

assert(SEARCH_PLACEHOLDER.toLowerCase().includes("search profiles"), "search placeholder names the job");
assert(SEARCH_HINT.toLowerCase().includes("search for people"), "search hint names people search");
assert(SEARCH_HINT.toLowerCase().includes("mic chip"), "search hint points at the mic chip for advice");
assert(SEARCH_HINT.toLowerCase().includes("bandham assistant"), "search hint names the assistant");
assert(GURU_TITLE === "Bandham assistant", "chip title is Bandham assistant");
assert(GURU_ORB_LABEL === "Open Bandham assistant", "chip aria-label is Open Bandham assistant");
assert(GURU_INTRO.toLowerCase().includes("bandham assistant"), "guru intro names the assistant");
assert(!/love guru/i.test([GURU_TITLE, GURU_ORB_LABEL, GURU_INTRO, SEARCH_HINT].join("\n")), "user-facing guru copy must not say love guru");
assert(GURU_INTRO.toLowerCase().includes("search box above"), "guru intro soft-handoffs to search");
assert(!GURU_INTRO.toLowerCase().includes("who you're hoping to meet"), "old search-shaped guru intro is gone");
assert(!/talking to parents|talk to her parents/i.test(GURU_INTRO), "intro must not offer parent-talk coaching");
assert(/suggestion|guidance|advice/i.test(GURU_INTRO), "intro names suggestions or guidance");
assert(GURU_INTRO.toLowerCase().includes("ticket"), "intro mentions app issue tickets");
assert(GURU_INTRO.toLowerCase().includes("gun milan"), "intro mentions stored Gun Milan");
assert(GURU_INTRO.toLowerCase().includes("will not guess"), "intro refuses invented compatibility");

const starterCopy = GURU_STARTERS.map(function (s) {
  return s.id + " " + s.label + " " + s.text;
}).join("\n");
assert(!/talk to her parents|how do i talk to her/i.test(starterCopy), "starters must not offer parent-talk or chat scripts");
assert(!/pickup/i.test(starterCopy), "starters must not offer pickup lines");
assert(/open a ticket/i.test(starterCopy), "starters include an app issue ticket path");
assert(/gun milan/i.test(starterCopy), "starters include stored Gun Milan");
assert(GURU_PLACEHOLDER.toLowerCase().includes("advice"), "guru placeholder is advice, not search");
assert(SEARCH_PLACEHOLDER !== GURU_PLACEHOLDER, "placeholders must differ");
assert(GURU_PATH === "/api/guru", "guru path lock");

assert(page.includes("/api/profiles/search"), "Browse search hits /api/profiles/search");
assert(page.includes("/api/transcribe"), "Browse mic uses STT");
assert(page.includes("SEARCH_PLACEHOLDER"), "Browse uses shared search placeholder");
assert(page.includes("DiscoverCard"), "Browse uses the photo-forward discover card");
assert(page.includes("Interested"), "Browse primary action is Interested");
assert(!page.includes("{isLiked ? \"Liked\" : \"Like\"}"), "Like button is gone");
assert(!/94\s*%|match percent/i.test(page), "Browse must not show match percentage theater");
assert(!/fetch\(\s*["']\/api\/(chat|guru)/.test(page), "Browse must never open guru chat");
assert(!page.includes("Tell me who you're hoping to meet"), "Browse must not reuse guru search-shaped copy");

assert(orb.includes("GURU_PATH") || orb.includes("/api/guru"), "orb posts to /api/guru");
assert(orb.includes("GURU_INTRO"), "orb uses the guru intro");
assert(!orb.includes("/api/profiles/search"), "orb never searches profiles");
assert(!orb.includes('"/api/chat"'), "orb does not keep the leftover /api/chat fetch");
assert(orb.includes("SUPPORT_TICKETS_PATH") || orb.includes("/api/support/tickets"), "orb can confirm a ticket");
assert(orb.includes("Open ticket"), "orb shows a confirm chip before filing");
assert(!orb.includes("send this"), "orb UI must not offer send-this drafts");
assert(!/match\s*%|match percent|verified badge/i.test(orb), "orb UI must not invent VerifyAI or match %");

assert(guruRoute.includes("handleGuruChat"), "guru route uses the shared handler");
assert(chatRoute.includes("handleGuruChat"), "legacy /api/chat is retargeted to guru");
assert(!guruLib.includes("profile-search"), "guru handler must not import profile search");
assert(!guruLib.includes("/api/profiles/search"), "guru handler must not call profile search");
assert(guruLib.includes("propose_support_ticket"), "guru can propose a support ticket");
assert(guruLib.includes("ticket_draft"), "guru returns a draft for confirm, not a silent create");
assert(!guruLib.includes('.from("support_tickets")'), "guru handler must not write support_tickets");
assert(!guruLib.includes("emailFounderTicket"), "guru handler must not email the founder");

const prompt = guruLib.toLowerCase();
assert(prompt.includes("bandham assistant"), "prompt names the assistant");
assert(prompt.includes("never search") || prompt.includes("you never search"), "prompt forbids search");
assert(prompt.includes("search box above"), "prompt may soft-handoff only");
assert(prompt.includes("verifyai"), "prompt forbids invented VerifyAI");
assert(prompt.includes("match percentage"), "prompt forbids match %");
assert(prompt.includes("paste") || prompt.includes("sendable") || prompt.includes("ghostwritten"), "prompt forbids ghostwritten chat");
assert(prompt.includes("pickup"), "prompt forbids pickup lines");
assert(prompt.includes("chat script") || prompt.includes("talk to her in chat"), "prompt forbids chat scripts");
assert(prompt.includes("send this"), "prompt still forbids send-this drafts");
assert(prompt.includes("auto-reply") || prompt.includes("auto-replies"), "prompt forbids auto-replies");
assert(prompt.includes("rate") || prompt.includes("judge"), "prompt forbids rating the other person");
assert(!guruLib.includes("Help someone talk to her parents"), "old parent-talk coaching is gone");
assert(prompt.includes("conversation script"), "prompt forbids parent conversation scripts");
assert(prompt.includes("not silly") || prompt.includes("not dating-app"), "prompt stays adult, not dating-app");
assert(!/\bmost people\b|\blimited time\b|\bact now\b/.test(prompt), "no marketing in the guru prompt");
assert(prompt.includes("gun milan"), "prompt knows Gun Milan");
assert(prompt.includes("stored") && (prompt.includes("refuse to guess") || prompt.includes("will not guess")), "prompt refuses invented Gun Milan");
assert(guruLib.includes("loadStoredGunMilanReport"), "guru may explain a stored report only");
assert(guruLib.includes("GUN_MILAN_NO_REPORT_REPLY"), "guru fail-closed copy when no report");
assert(!guruLib.includes("fetchKundliMatching"), "guru does not call the matching API");
assert(!/astrosage/i.test(guruLib), "guru does not call AstroSage");

console.log("guru / search split ok", {
  searchPlaceholder: SEARCH_PLACEHOLDER,
  guruIntro: GURU_INTRO,
  guruPath: GURU_PATH,
});

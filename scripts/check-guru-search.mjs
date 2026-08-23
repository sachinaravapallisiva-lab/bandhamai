import { readFileSync } from "node:fs";
import {
  GURU_INTRO,
  GURU_PATH,
  GURU_PLACEHOLDER,
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
assert(SEARCH_HINT.toLowerCase().includes("violet orb"), "search hint points at the orb for advice");
assert(GURU_INTRO.toLowerCase().includes("love guru"), "guru intro names the guru");
assert(GURU_INTRO.toLowerCase().includes("search box above"), "guru intro soft-handoffs to search");
assert(!GURU_INTRO.toLowerCase().includes("who you're hoping to meet"), "old search-shaped guru intro is gone");
assert(GURU_PLACEHOLDER.toLowerCase().includes("advice"), "guru placeholder is advice, not search");
assert(SEARCH_PLACEHOLDER !== GURU_PLACEHOLDER, "placeholders must differ");
assert(GURU_PATH === "/api/guru", "guru path lock");

assert(page.includes("/api/profiles/search"), "Browse search hits /api/profiles/search");
assert(page.includes("/api/transcribe"), "Browse mic uses STT");
assert(page.includes("SEARCH_PLACEHOLDER"), "Browse uses shared search placeholder");
assert(!/fetch\(\s*["']\/api\/(chat|guru)/.test(page), "Browse must never open guru chat");
assert(!page.includes("Tell me who you're hoping to meet"), "Browse must not reuse guru search-shaped copy");

assert(orb.includes("GURU_PATH") || orb.includes("/api/guru"), "orb posts to /api/guru");
assert(orb.includes("GURU_INTRO"), "orb uses the guru intro");
assert(!orb.includes("/api/profiles/search"), "orb never searches profiles");
assert(!orb.includes('"/api/chat"'), "orb does not keep the leftover /api/chat fetch");
assert(!/match\s*%|match percent|verified badge/i.test(orb), "orb UI must not invent VerifyAI or match %");

assert(guruRoute.includes("handleGuruChat"), "guru route uses the shared handler");
assert(chatRoute.includes("handleGuruChat"), "legacy /api/chat is retargeted to guru");
assert(!guruLib.includes("profile-search"), "guru handler must not import profile search");
assert(!guruLib.includes("/api/profiles/search"), "guru handler must not call profile search");

const prompt = guruLib.toLowerCase();
assert(prompt.includes("love guru"), "prompt names the guru");
assert(prompt.includes("never search") || prompt.includes("you never search"), "prompt forbids search");
assert(prompt.includes("search box above"), "prompt may soft-handoff only");
assert(prompt.includes("verifyai"), "prompt forbids invented VerifyAI");
assert(prompt.includes("match percentage"), "prompt forbids match %");
assert(prompt.includes("paste") || prompt.includes("sendable") || prompt.includes("ghostwritten"), "prompt forbids ghostwritten chat");
assert(prompt.includes("auto-reply") || prompt.includes("auto-replies"), "prompt forbids auto-replies");
assert(prompt.includes("rate") || prompt.includes("judge"), "prompt forbids rating the other person");
assert(prompt.includes("parents"), "prompt covers talking to parents");
assert(!/\bmost people\b|\blimited time\b|\bact now\b/.test(prompt), "no marketing in the guru prompt");

console.log("guru / search split ok", {
  searchPlaceholder: SEARCH_PLACEHOLDER,
  guruIntro: GURU_INTRO,
  guruPath: GURU_PATH,
});

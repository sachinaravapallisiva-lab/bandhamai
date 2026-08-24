import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  BROWSE_ASK_BANK,
  BROWSE_ASK_HINT,
  BROWSE_ASK_KICKER,
  BROWSE_ASK_LIST_LABEL,
  BROWSE_ASK_MAX,
  BROWSE_ASK_MIN,
  BROWSE_ASK_NO_ANSWER_ID,
  BROWSE_ASK_NO_ANSWER_LABEL,
  BROWSE_ASK_PRODUCT,
  BROWSE_ASK_TAP_MIN,
  BROWSE_ASK_TITLE,
  answeredBrowseAskTopics,
  choicesForBrowseAsk,
  filterTextForAnswer,
  foldBrowseAskIntoQuery,
  progressLabel,
  questionsForBrowsePrompt,
  shouldAskAfterPrompt,
  userFacingBrowseAskCopy,
} from "../lib/browse-ask.ts";
import { BROWSE_SHORTLIST_SIZE, parseSearchQuery } from "../lib/profile-search.ts";
import { SPEED_MATCH_NO_ANSWER_LABEL, SPEED_MATCH_QUESTIONS } from "../lib/speed-match.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function assertEq(got, expected, label) {
  if (got !== expected) throw new Error(label + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(got));
}

const bannedDating = /\b(flirt|party|hookup|hook-up|crush|drinks tonight|vibe check|swipe|hot take|never have i|love language|attachment style)\b/i;
const hyphenMarks = /[-—–]/;

assertEq(BROWSE_ASK_PRODUCT, "Bandham AI", "product lock");
assert(!/bandhan\b/i.test(BROWSE_ASK_PRODUCT), "product is Bandham AI, not Bandhan");
assertEq(BROWSE_ASK_NO_ANSWER_LABEL, "Don't want to answer", "same skip label as Speed Match");
assertEq(BROWSE_ASK_NO_ANSWER_LABEL, SPEED_MATCH_NO_ANSWER_LABEL, "Don't want to answer stays shared");
assertEq(BROWSE_ASK_NO_ANSWER_ID, "dont_answer", "canonical skip id");
assert(BROWSE_ASK_BANK.length >= BROWSE_ASK_MIN && BROWSE_ASK_BANK.length <= BROWSE_ASK_MAX, "bank is 2 to 4 questions");
assertEq(BROWSE_ASK_BANK.length, 4, "locked four dealbreaker asks");
assertEq(BROWSE_ASK_TAP_MIN, 44, "44px taps");
assertEq(BROWSE_SHORTLIST_SIZE, 3, "shortlist size stays 3");

const ids = new Set();
BROWSE_ASK_BANK.forEach(function (q) {
  assert(q.id && !ids.has(q.id), "unique question id: " + q.id);
  ids.add(q.id);
  assert(!bannedDating.test(q.prompt), "not dating copy: " + q.id);
  assert(q.choices.length >= 2 && q.choices.length <= 4, "2 to 4 taps before skip: " + q.id);
  assert(
    !q.choices.some(function (c) { return c.id === BROWSE_ASK_NO_ANSWER_ID; }),
    "Don't want to answer is appended, not stored on the bank: " + q.id
  );
  const taps = choicesForBrowseAsk(q);
  assert(taps[taps.length - 1].id === BROWSE_ASK_NO_ANSWER_ID, "skip is last tap: " + q.id);
  assert(taps[taps.length - 1].label === BROWSE_ASK_NO_ANSWER_LABEL, "skip label: " + q.id);
  assert(taps[taps.length - 1].filterText === null, "Don't want to answer has no filter token: " + q.id);
  q.choices.forEach(function (c) {
    assert(!bannedDating.test(c.label), "not dating choice: " + q.id + "/" + c.id);
  });
});

assert(ids.has("diet") && ids.has("location") && ids.has("family_living") && ids.has("children"), "desi dealbreaker topics");
assert(!ids.has("community") && !ids.has("faith") && !ids.has("dowry"), "do not invent caste, religion, or extra Speed Match items");

userFacingBrowseAskCopy().forEach(function (text) {
  assert(!hyphenMarks.test(text), "user-facing copy has no hyphen: " + text);
  assert(!/bandhan\b/i.test(text), "Bandham AI, not Bandhan: " + text);
  assert(!bannedDating.test(text), "not dating copy: " + text);
});

assertEq(questionsForBrowsePrompt("").length, 0, "blank Browse load does not ask");
assert(!shouldAskAfterPrompt("   "), "whitespace prompt does not ask");

const openPrompt = questionsForBrowsePrompt("doctor");
assert(openPrompt.length >= BROWSE_ASK_MIN && openPrompt.length <= BROWSE_ASK_MAX, "open prompt asks 2 to 4");
assertEq(openPrompt.length, 4, "thin prompt asks the full bank");
assertEq(progressLabel(0, openPrompt.length), "1 of 4", "progress copy");

const vegHyd = "vegetarian in Hyderabad";
const vegHydTopics = answeredBrowseAskTopics(vegHyd);
assert(vegHydTopics.has("diet"), "vegetarian prompt skips diet");
assert(vegHydTopics.has("location"), "Hyderabad prompt skips location");
assert(!vegHydTopics.has("family_living"), "vegetarian in Hyderabad still asks family");
assert(!vegHydTopics.has("children"), "vegetarian in Hyderabad still asks children");
const vegHydAsk = questionsForBrowsePrompt(vegHyd);
assertEq(vegHydAsk.length, 2, "skip-if-already-in-prompt leaves two asks");
assert(
  vegHydAsk.every(function (q) { return q.id === "family_living" || q.id === "children"; }),
  "remaining asks are family and children"
);

const nriJoint = questionsForBrowsePrompt("NRI vegetarian joint family");
assert(
  nriJoint.every(function (q) { return q.id === "children"; }),
  "NRI vegetarian joint family only leaves children"
);
assertEq(nriJoint.length, 1, "three answered topics leave one ask");

const kidsPrompt = questionsForBrowsePrompt("looking for kids friendly doctor");
assert(
  !kidsPrompt.some(function (q) { return q.id === "children"; }),
  "kids in the prompt skips the children ask"
);

assertEq(filterTextForAnswer("diet", BROWSE_ASK_NO_ANSWER_ID), null, "Don't want to answer omitted from diet filter");
assertEq(filterTextForAnswer("location", "dont_answer"), null, "Don't want to answer omitted from location filter");
assertEq(filterTextForAnswer("family_living", "prefer_not"), null, "prefer_not alias omitted from filters");
assertEq(filterTextForAnswer("children", "dont"), null, "No on children does not invent a kids column");
assertEq(filterTextForAnswer("location", "india"), null, "India does not invent a country column");

const skipped = foldBrowseAskIntoQuery("doctor", [
  { questionId: "diet", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "location", choiceId: "dont_answer" },
  { questionId: "family_living", choiceId: "prefer_not" },
  { questionId: "children", choiceId: "open" },
]);
assertEq(skipped, "doctor", "Don't want to answer omitted from folded query");

const folded = foldBrowseAskIntoQuery("doctor", [
  { questionId: "diet", choiceId: "vegetarian" },
  { questionId: "location", choiceId: "abroad" },
  { questionId: "family_living", choiceId: "joint" },
  { questionId: "children", choiceId: "want" },
]);
assert(folded.startsWith("doctor"), "folded query keeps the original prompt");
assert(/\bvegetarian\b/.test(folded), "diet answer folds vegetarian");
assert(/\bnri\b/.test(folded), "abroad answer folds nri");
assert(/joint family/.test(folded), "family answer folds joint family");
assert(/\bchildren\b/.test(folded), "yes on children folds children");

const parsed = parseSearchQuery(folded);
assertEq(parsed.city, null, "folded doctor prompt has no city");
assert(parsed.keywords.includes("doctor"), "original keyword survives");
assert(parsed.keywords.includes("vegetarian"), "diet answer is a search keyword");
assert(parsed.keywords.includes("nri"), "location answer is a search keyword");
assert(parsed.keywords.includes("joint family"), "family answer is a search keyword");
assert(parsed.keywords.includes("children"), "children answer is a leftover keyword search already accepts");
assert(!parsed.keywords.includes("dont_answer"), "skip id never becomes a keyword");

const indiaFold = foldBrowseAskIntoQuery("teacher", [{ questionId: "location", choiceId: "india" }]);
assertEq(indiaFold, "teacher", "India tap does not invent a filter token");

assertEq(SPEED_MATCH_QUESTIONS.length, 10, "Speed Match bank stays 10");
assert(
  SPEED_MATCH_QUESTIONS[0].prompt === "Vegetarian or non-veg at home after marriage?",
  "Speed Match diet prompt is unchanged"
);

const pagePath = fileURLToPath(new URL("../app/page.tsx", import.meta.url));
const page = readFileSync(pagePath, "utf8");
const uiPath = fileURLToPath(new URL("../app/components/BrowseAsk.tsx", import.meta.url));
const ui = readFileSync(uiPath, "utf8");
const orb = readFileSync(fileURLToPath(new URL("../app/components/VoiceAssistant.tsx", import.meta.url)), "utf8");

assert(page.includes("BrowseAsk"), "Browse renders the ask widget");
assert(page.includes("beginPrompt"), "typed and spoken prompts go through beginPrompt");
assert(page.includes("questionsForBrowsePrompt"), "Browse asks only the remaining questions");
assert(page.includes("foldBrowseAskIntoQuery"), "Browse folds answers into the search query");
assert(page.includes('if (searchRef.current) searchRef.current("")'), "empty first paint still loads the default shortlist");
assert(!/queueMicrotask\(function \(\) \{ runSearch\(next\); \}\)/.test(page), "speak path asks before search");
assert(page.includes("beginPrompt(next)"), "speak path starts the ask");
assert(page.includes("SpeedMatch"), "Speed Match stays on Matches");
assert(!page.includes("SPEED_MATCH_QUESTIONS"), "Browse does not reuse the Speed Match bank");
assert(!/fetch\(\s*["']\/api\/(chat|guru)/.test(page), "Browse still never opens guru chat");
assert(!orb.includes("/api/profiles/search"), "violet orb still must not search profiles");

assert(ui.includes("choicesForBrowseAsk"), "widget renders tap choices including Don't want to answer");
assert(ui.includes("BROWSE_ASK_TAP_MIN") || ui.includes("minHeight: 44") || ui.includes("minHeight: BROWSE_ASK_TAP_MIN"), "44px taps");
assert(!/<textarea\b/.test(ui) && !/<input\b/.test(ui), "tap choices only");
assert(ui.includes("CREAM") || ui.includes("FDF8F1"), "cream surface");
assert(!bannedDating.test(ui), "widget source is not dating copy");
assert(!hyphenMarks.test(BROWSE_ASK_KICKER + BROWSE_ASK_LIST_LABEL + BROWSE_ASK_TITLE + BROWSE_ASK_HINT), "chrome copy has no hyphen");

console.log("browse ask ok", {
  product: BROWSE_ASK_PRODUCT,
  bank: BROWSE_ASK_BANK.map(function (q) { return q.id; }),
  vegHyd: vegHydAsk.map(function (q) { return q.id; }),
  folded: folded,
});

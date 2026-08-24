import { readFileSync } from "node:fs";
import {
  BROWSE_ASK_HINT,
  BROWSE_ASK_LABEL,
  BROWSE_ASK_NO_ANSWER_CHOICE,
  BROWSE_ASK_NO_ANSWER_ID,
  BROWSE_ASK_NO_ANSWER_LABEL,
  BROWSE_ASK_QUESTIONS,
  browseAskAlreadyAnswered,
  browseAskChoices,
  browseAskProgress,
  findBrowseAskQuestion,
  foldBrowseAnswers,
  foldPhraseForAnswer,
  isBrowseAskNoAnswer,
  remainingBrowseQuestions,
  userFacingBrowseAskCopy,
} from "../lib/browse-ask.ts";
import { parseSearchQuery } from "../lib/profile-search.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function assertEq(got, expected, label) {
  if (got !== expected) {
    throw new Error(label + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(got));
  }
}

function read(rel) {
  return readFileSync(new URL("../" + rel, import.meta.url), "utf8");
}

const dating = /\b(flirt|party|hookup|hook-up|crush|drinks tonight|vibe check|swipe|hot take|never have i|love language|attachment style|ask me anything)\b/i;
const dash = /[-—–]/;

assert(BROWSE_ASK_NO_ANSWER_ID === "dont_answer", "shared no-answer id");
assert(BROWSE_ASK_NO_ANSWER_LABEL === "Don't want to answer", "Don't want to answer label");
assert(BROWSE_ASK_NO_ANSWER_CHOICE.id === BROWSE_ASK_NO_ANSWER_ID, "no-answer choice id");
assert(BROWSE_ASK_HINT.toLowerCase().includes("bandham ai"), "hint names Bandham AI");
assert(!/bandhan\b/i.test(BROWSE_ASK_HINT), "product is Bandham, not Bandhan");
assert(BROWSE_ASK_LABEL === "STILL NEEDED", "ask eyebrow");

const ids = new Set();
BROWSE_ASK_QUESTIONS.forEach(function (q) {
  assert(q.id && !ids.has(q.id), "unique question id: " + q.id);
  ids.add(q.id);
  assert(!dating.test(q.prompt), "not dating prompt: " + q.id);
  assert(!dash.test(q.prompt), "no hyphen in prompt: " + q.prompt);
  assert(
    !q.choices.some(function (c) { return isBrowseAskNoAnswer(c.id); }),
    "dont_answer stays off the bank at " + q.id
  );
  const taps = browseAskChoices(q);
  assert(taps[taps.length - 1].id === BROWSE_ASK_NO_ANSWER_ID, "Don't want to answer is last at " + q.id);
  assert(taps[taps.length - 1].label === BROWSE_ASK_NO_ANSWER_LABEL, "skip label at " + q.id);
  q.choices.forEach(function (c) {
    assert(!dating.test(c.label), "not dating choice: " + c.label);
    assert(!dash.test(c.label), "no hyphen in choice: " + c.label);
  });
});

assert(ids.has("diet"), "diet is needed");
assert(ids.has("location"), "India vs abroad is needed");
assert(ids.has("city"), "city is needed");
assert(ids.has("gender"), "gender is needed");
assert(ids.has("mother_tongue"), "mother tongue is needed");
assert(ids.has("parents"), "parents is needed");
assert(ids.has("timeline"), "timeline is needed");
assert(ids.has("family_living"), "joint vs nuclear is needed");
assert(ids.has("children"), "children uses Speed Match language");
assert(!ids.has("community"), "do not invent caste / community");
assert(!ids.has("faith"), "do not invent religion");
assert(!ids.has("dowry"), "Browse ask is not the Speed Match bank");
assert(!ids.has("work"), "Browse ask is not the Speed Match bank");

assert(remainingBrowseQuestions("").length === 0, "blank prompt never asks");
assert(remainingBrowseQuestions("   ").length === 0, "whitespace prompt never asks");

const thin = remainingBrowseQuestions("doctor");
assert(thin.length === BROWSE_ASK_QUESTIONS.length, "thin prompt asks every needed question");
assert(thin.length > 4, "no hard cap of 2 to 4");
assertEq(thin[0].id, "diet", "ask order starts at diet");

const answered = remainingBrowseQuestions("Telugu vegetarian woman in Hyderabad");
const answeredIds = answered.map(function (q) { return q.id; });
assert(!answeredIds.includes("diet"), "skip diet when prompt said vegetarian");
assert(!answeredIds.includes("city"), "skip city when prompt said Hyderabad");
assert(!answeredIds.includes("gender"), "skip gender when prompt said woman");
assert(!answeredIds.includes("mother_tongue"), "skip mother tongue when prompt said Telugu");
assert(answeredIds.includes("parents"), "still ask parents when unknown");
assert(answeredIds.includes("timeline"), "still ask timeline when unknown");
assert(answeredIds.includes("children"), "still ask children when unknown");
assert(answeredIds.includes("location"), "still ask India vs abroad when unknown");
assert(answeredIds.includes("family_living"), "still ask joint vs nuclear when unknown");

const nri = remainingBrowseQuestions("NRI vegetarian joint family");
const nriIds = nri.map(function (q) { return q.id; });
assert(!nriIds.includes("diet"), "skip diet after vegetarian");
assert(!nriIds.includes("location"), "skip location after NRI");
assert(!nriIds.includes("family_living"), "skip family after joint family");
assert(nriIds.includes("city"), "city still needed");
assert(nriIds.includes("gender"), "gender still needed");

assert(browseAskAlreadyAnswered("diet", "a woman in Dallas, vegetarian"), "diet detected from prompt");
assert(!browseAskAlreadyAnswered("diet", "doctor in Dallas"), "diet unknown on English profession prompt");

const foldedSkip = foldBrowseAnswers("doctor", [
  { questionId: "diet", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "location", choiceId: "abroad" },
]);
assert(foldedSkip.indexOf("nri") >= 0, "abroad folds to nri");
assert(foldedSkip.indexOf("vegetarian") < 0, "Don't want to answer omits diet");
assert(foldedSkip.indexOf("doctor") >= 0, "original prompt stays");

assertEq(foldPhraseForAnswer("diet", BROWSE_ASK_NO_ANSWER_ID), "", "no-answer fold is empty");
assertEq(foldPhraseForAnswer("diet", "vegetarian"), "vegetarian", "diet fold");
assertEq(foldPhraseForAnswer("location", "india"), "", "India has no AND keyword that would empty the shortlist");
assertEq(foldPhraseForAnswer("family_living", "joint"), "joint family", "joint family reuses search alias");
assertEq(foldPhraseForAnswer("children", "want"), "children", "kids fold uses Speed Match yes");

const womanFold = foldBrowseAnswers("doctor", [{ questionId: "gender", choiceId: "woman" }]);
assertEq(parseSearchQuery(womanFold).gender, "Female", "folded woman is parsed as Female");

const cityFold = foldBrowseAnswers("doctor", [{ questionId: "city", choiceId: "hyderabad" }]);
assertEq(parseSearchQuery(cityFold).city, "Hyderabad", "folded city is parsed");

userFacingBrowseAskCopy().forEach(function (text) {
  assert(!dash.test(text), "user-facing copy has no hyphen: " + text);
  assert(!/bandhan\b/i.test(text), "product name is Bandham, not Bandhan: " + text);
  assert(!dating.test(text), "not dating copy: " + text);
});
assertEq(browseAskProgress(0, 9), "1 of 9", "progress has no slash or hyphen");

assert(findBrowseAskQuestion("diet")?.id === "diet", "lookup diet");
assert(findBrowseAskQuestion("gotra") === null, "no invented gotra question");
assert(
  !BROWSE_ASK_QUESTIONS.some(function (q) {
    return /caste|gotra|religion|income|height/.test(q.id + " " + q.prompt);
  }),
  "bank does not ask caste, gotra, religion, income, or height"
);

const page = read("app/page.tsx");
const ui = read("app/components/BrowseAsk.tsx");
const speed = read("app/components/SpeedMatch.tsx");
const speedLib = read("lib/speed-match.ts");

assert(page.includes("remainingBrowseQuestions"), "Browse asks remaining questions after a prompt");
assert(page.includes("submitPrompt"), "typed/spoken prompt goes through ask first");
assert(page.includes("foldBrowseAnswers"), "answers fold into search q");
assert(page.includes("BrowseAsk"), "Browse renders the ask widget");
assert(page.includes("/api/profiles/search"), "search still hits profiles search");
assert(!/fetch\(\s*["']\/api\/(chat|guru)/.test(page), "Browse still never opens guru");
assert(!ui.includes("<input") && !ui.includes("<textarea"), "ask is tap only");
assert(ui.includes("PROFILE_ACTION_MIN") || ui.includes("minHeight: 44") || ui.includes("minHeight: PROFILE_ACTION_MIN"), "44px taps");
assert(ui.includes("CREAM") || ui.includes("FDF8F1"), "cream surface");
assert(ui.includes("VIOLET") || ui.includes("6D28D9") || ui.includes("WASH"), "soft violet family");
assert(!speed.includes("browse-ask"), "Speed Match UI is unchanged by Browse ask");
assert(speedLib.includes("SPEED_MATCH_QUESTION_COUNT = 10"), "Speed Match bank stays 10");
assert(!page.includes("Ask me anything"), "do not copy Manasi input copy");
assert(!/manasi\.ai|smart fast personalized/i.test(page), "Browse page has no Manasi brand copy");

const askLib = read("lib/browse-ask.ts");
assert(/not speed match/i.test(askLib), "lib names the split");

console.log("browse ask ok", {
  needed: BROWSE_ASK_QUESTIONS.map(function (q) { return q.id; }),
  thin: thin.length,
  skipped: ["diet", "city", "gender", "mother_tongue"],
  remainingAfterAnswered: answeredIds,
});

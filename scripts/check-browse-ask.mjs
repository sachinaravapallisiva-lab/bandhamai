import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  BROWSE_ASK_BANK,
  BROWSE_ASK_HINT,
  BROWSE_ASK_MAX,
  BROWSE_ASK_MIN,
  BROWSE_ASK_NO_ANSWER_ID,
  BROWSE_ASK_NO_ANSWER_LABEL,
  BROWSE_ASK_PRODUCT,
  BROWSE_ASK_TITLE,
  browseAskProgress,
  browseAskUserFacingCopy,
  choicesForBrowseAsk,
  filterPhraseForAnswer,
  foldBrowseAskQuery,
  isBrowseAskSkip,
  questionsForBrowsePrompt,
} from "../lib/browse-ask.ts";
import { BROWSE_SHORTLIST_SIZE, parseSearchQuery } from "../lib/profile-search.ts";
import { SPEED_MATCH_NO_ANSWER_LABEL, SPEED_MATCH_QUESTION_COUNT, SPEED_MATCH_QUESTIONS } from "../lib/speed-match.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function assertEq(got, expected, label) {
  if (got !== expected) {
    throw new Error(label + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(got));
  }
}

function assertHas(list, value, label) {
  if (!list.includes(value)) {
    throw new Error(label + ": expected " + JSON.stringify(value) + " in " + JSON.stringify(list));
  }
}

function read(rel) {
  return readFileSync(new URL("../" + rel, import.meta.url), "utf8");
}

assertEq(BROWSE_ASK_PRODUCT, "Bandham AI", "product lock");
assertEq(BROWSE_ASK_NO_ANSWER_LABEL, "Don't want to answer", "skip label lock");
assertEq(SPEED_MATCH_NO_ANSWER_LABEL, BROWSE_ASK_NO_ANSWER_LABEL, "same skip wording as Speed Match");
assert(BROWSE_ASK_MIN === 2 && BROWSE_ASK_MAX === 4, "ask window is 2 to 4");
assertEq(BROWSE_SHORTLIST_SIZE, 3, "shortlist stays 3");
assert(SPEED_MATCH_QUESTION_COUNT === 10 && SPEED_MATCH_QUESTIONS.length === 10, "Speed Match bank stays 10");

const dating = /\b(flirt|party|hookup|hook-up|crush|drinks tonight|vibe check|swipe|hot take|never have i|love language|attachment style|pickup|date night)\b/i;
const hyphen = /[-—–]/;

browseAskUserFacingCopy().forEach(function (text) {
  assert(!hyphen.test(text), "user-facing copy has no hyphen: " + text);
  assert(!/bandhan\b/i.test(text), "product name is Bandham, not Bandhan: " + text);
  assert(!dating.test(text), "not dating copy: " + text);
});
assert(BROWSE_ASK_HINT.includes("Bandham AI"), "hint names Bandham AI");
assert(!/bandhan\b/i.test(BROWSE_ASK_HINT), "hint is not Bandhan");

BROWSE_ASK_BANK.forEach(function (question) {
  assert(question.prompt && question.prompt.length > 8, "prompt missing at " + question.id);
  assert(question.choices.length >= 2 && question.choices.length <= 4, "2 to 4 taps at " + question.id);
  assert(
    !question.choices.some(function (choice) {
      return isBrowseAskSkip(choice.id);
    }),
    "dont_answer stays off the dealbreaker bank at " + question.id
  );
  const taps = choicesForBrowseAsk(question);
  assert(taps.length === question.choices.length + 1, "every question adds Don't want to answer at " + question.id);
  assert(taps[taps.length - 1].id === BROWSE_ASK_NO_ANSWER_ID, "skip is last tap at " + question.id);
  assert(taps[taps.length - 1].label === BROWSE_ASK_NO_ANSWER_LABEL, "skip label at " + question.id);
});

assertEq(questionsForBrowsePrompt("").length, 0, "blank Browse load has no ask");
assertEq(questionsForBrowsePrompt("   ").length, 0, "whitespace prompt has no ask");

const doctor = questionsForBrowsePrompt("doctor");
assert(doctor.length >= BROWSE_ASK_MIN && doctor.length <= BROWSE_ASK_MAX, "plain prompt asks 2 to 4");
assertHas(
  doctor.map(function (q) {
    return q.id;
  }),
  "diet",
  "doctor still asks diet"
);

const vegHyd = questionsForBrowsePrompt("vegetarian in Hyderabad");
const vegHydIds = vegHyd.map(function (q) {
  return q.id;
});
assert(!vegHydIds.includes("diet"), "skip diet when the prompt already said vegetarian");
assert(!vegHydIds.includes("location"), "skip city / India vs abroad when the prompt already said Hyderabad");
assert(vegHyd.length >= BROWSE_ASK_MIN && vegHyd.length <= BROWSE_ASK_MAX, "remaining asks stay 2 to 4");

const nriVeg = questionsForBrowsePrompt("NRI vegetarian joint family");
const nriIds = nriVeg.map(function (q) {
  return q.id;
});
assert(!nriIds.includes("diet"), "skip diet for NRI vegetarian joint family");
assert(!nriIds.includes("location"), "skip location when NRI is already in the prompt");
assert(!nriIds.includes("family_living"), "skip joint vs nuclear when the prompt said joint family");

const kids = questionsForBrowsePrompt("doctor who wants children");
assert(
  !kids.some(function (q) {
    return q.id === "children";
  }),
  "skip children when the prompt already said children"
);

const skipped = foldBrowseAskQuery("doctor", [{ questionId: "diet", choiceId: BROWSE_ASK_NO_ANSWER_ID }]);
assertEq(skipped, "doctor", "Don't want to answer is omitted from filters");
assertEq(filterPhraseForAnswer("diet", BROWSE_ASK_NO_ANSWER_ID), "", "skip phrase is empty");

const vegFold = foldBrowseAskQuery("doctor", [{ questionId: "diet", choiceId: "vegetarian" }]);
assertHas(parseSearchQuery(vegFold).keywords, "vegetarian", "diet tap folds into search keywords");
assertEq(parseSearchQuery(vegFold).city, null, "diet tap does not invent a city");

const indiaFold = foldBrowseAskQuery("doctor", [{ questionId: "location", choiceId: "india" }]);
assertEq(indiaFold, "doctor", "India tap does not invent a city or india keyword");
assertEq(parseSearchQuery(indiaFold).city, null, "India tap leaves city empty");

const abroadFold = foldBrowseAskQuery("doctor", [{ questionId: "location", choiceId: "abroad" }]);
assertHas(parseSearchQuery(abroadFold).keywords, "nri", "abroad tap uses the existing nri keyword");

const jointFold = foldBrowseAskQuery("doctor in Hyderabad", [{ questionId: "family_living", choiceId: "joint" }]);
const jointParsed = parseSearchQuery(jointFold);
assertEq(jointParsed.city, "Hyderabad", "folded query keeps the original city");
assertHas(jointParsed.keywords, "joint family", "joint tap uses the existing joint family keyword");
assertHas(jointParsed.keywords, "doctor", "original profession survives");

const mixed = foldBrowseAskQuery("doctor", [
  { questionId: "diet", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "location", choiceId: "abroad" },
  { questionId: "family_living", choiceId: "nuclear" },
]);
const mixedParsed = parseSearchQuery(mixed);
assertHas(mixedParsed.keywords, "nri", "kept abroad filter");
assertHas(mixedParsed.keywords, "nuclear family", "kept nuclear filter");
assert(!/\bvegetarian\b/.test(mixed), "skipped diet is not in the folded query");

assertEq(browseAskProgress(0, 3), "1 of 3", "progress has no hyphen");

const page = read("app/page.tsx");
const askUi = read("app/components/BrowseAsk.tsx");
const askLib = read("lib/browse-ask.ts");
const speedLib = read("lib/speed-match.ts");
const speedUi = read("app/components/SpeedMatch.tsx");
const orb = read("app/components/VoiceAssistant.tsx");

assert(page.includes("questionsForBrowsePrompt"), "Browse decides asks from the prompt");
assert(page.includes("submitBrowsePrompt"), "typed/spoken submit goes through the ask step");
assert(page.includes("foldBrowseAskQuery"), "Browse folds answers into the search query");
assert(page.includes("BrowseAsk"), "Browse renders the ask widget");
assert(page.includes('searchRef.current("")') || page.includes("searchRef.current(\"\")"), "empty first paint still loads the default shortlist");
assert(!/tab === ["']browse["'][\s\S]*Start Speed Match/.test(page), "Speed Match stays off Browse");
assert(page.includes("<SpeedMatch"), "Speed Match stays on Matches");
assert(!page.includes("SPEED_MATCH_QUESTIONS"), "Browse ask does not reuse the Speed Match bank");
assert(!askLib.includes("SPEED_MATCH_QUESTIONS"), "ask lib does not import the Speed Match bank");
assert(!askUi.includes("<textarea") && !askUi.includes("<input"), "ask widget is tap only");
assert(askUi.includes("PROFILE_ACTION_MIN") || askUi.includes("minHeight: 44") || askUi.includes("minHeight: PROFILE_ACTION_MIN"), "taps are 44px");
assert(askUi.includes("CREAM") && askUi.includes("WASH"), "ask widget stays cream / wash");
assert(askUi.includes("Don't want to answer") || askUi.includes("BROWSE_ASK_NO_ANSWER") || askUi.includes("choicesForBrowseAsk"), "skip tap is rendered");
assert(!dating.test(askUi), "ask UI is not dating copy");
assert(!orb.includes("/api/profiles/search"), "violet orb still must not search profiles");
assert(!page.includes('fetch("/api/guru') && !page.includes("fetch('/api/guru"), "Browse still never opens guru chat");

assert(speedLib.includes("SPEED_MATCH_QUESTIONS"), "Speed Match file is still the locked bank");
assert(speedUi.includes("choicesForQuestion"), "Speed Match UI is unchanged in role");

const unused = fileURLToPath(new URL("../lib/browse-ask.ts", import.meta.url));
assert(unused.endsWith("browse-ask.ts"), "ask module path");

console.log("browse ask ok", {
  product: BROWSE_ASK_PRODUCT,
  title: BROWSE_ASK_TITLE,
  doctorIds: doctor.map(function (q) {
    return q.id;
  }),
  vegHydIds: vegHydIds,
  skipLabel: BROWSE_ASK_NO_ANSWER_LABEL,
});

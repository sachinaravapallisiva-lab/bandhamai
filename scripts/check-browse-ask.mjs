import { readFileSync } from "node:fs";
import {
  BROWSE_ASK_FIELD_ORDER,
  BROWSE_ASK_HINT,
  BROWSE_ASK_LABEL,
  BROWSE_ASK_NO_ANSWER_CHOICE,
  BROWSE_ASK_NO_ANSWER_ID,
  BROWSE_ASK_NO_ANSWER_LABEL,
  BROWSE_ASK_QUESTIONS,
  BROWSE_ASK_VISA_NO_ANSWER_LABEL,
  browseAskAlreadyAnswered,
  browseAskChoices,
  browseAskProgress,
  browseAskReadyForShortlist,
  findBrowseAskQuestion,
  foldBrowseAnswers,
  foldPhraseForAnswer,
  isBrowseAskNoAnswer,
  promptHasCaste,
  promptHasLocation,
  promptHasReligion,
  promptHasVisa,
  remainingBrowseQuestions,
  userFacingBrowseAskCopy,
} from "../lib/browse-ask.ts";
import { parseSearchQuery } from "../lib/profile-search.ts";
import { VISA_STATUS_GROUPS, VISA_STATUS_UNGROUPED } from "../lib/visa-status.ts";
import { KEYWORD_ALIASES, SEARCH_CITIES } from "../lib/desi-search-aliases.ts";

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
const emDash = /[—–]/;

assert(BROWSE_ASK_NO_ANSWER_ID === "dont_answer", "shared no-answer id");
assert(BROWSE_ASK_NO_ANSWER_LABEL === "Don't want to answer", "Don't want to answer label");
assert(BROWSE_ASK_VISA_NO_ANSWER_LABEL === "Prefer not to say", "visa keeps Prefer not to say");
assert(BROWSE_ASK_NO_ANSWER_CHOICE.id === BROWSE_ASK_NO_ANSWER_ID, "no-answer choice id");
assert(BROWSE_ASK_HINT.toLowerCase().includes("bandham ai"), "hint names Bandham AI");
assert(!/bandhan\b/i.test(BROWSE_ASK_HINT), "product is Bandham, not Bandhan");
assert(BROWSE_ASK_LABEL === "STILL NEEDED", "ask eyebrow");
assertEq(
  BROWSE_ASK_FIELD_ORDER.join(" "),
  "location visa religion caste family_living parents work timeline children mother_tongue",
  "locked field order"
);

const ids = BROWSE_ASK_QUESTIONS.map(function (q) {
  return q.id;
});
assertEq(
  ids.join(" "),
  "location visa religion caste family_living parents work timeline children mother_tongue",
  "bank order is the ten household dealbreakers"
);
assert(!ids.includes("city"), "city is a follow-up, not one of the 10");
assert(!ids.includes("diet"), "diet is not a main question");
assert(!ids.includes("dowry"), "dowry is not in this 10");
assert(!ids.includes("gender"), "gender is not one of the ten");

BROWSE_ASK_QUESTIONS.forEach(function (q) {
  assert(!dating.test(q.prompt), "not dating prompt: " + q.id);
  assert(!emDash.test(q.prompt), "no em dash in prompt: " + q.prompt);
  const taps = browseAskChoices(q);
  const last = taps[taps.length - 1];
  assert(isBrowseAskNoAnswer(last.id), "skip is last at " + q.id);
  if (q.id === "visa") {
    assert(last.label === BROWSE_ASK_VISA_NO_ANSWER_LABEL, "visa skip is Prefer not to say");
  } else {
    assert(last.label === BROWSE_ASK_NO_ANSWER_LABEL, "Don't want to answer is last at " + q.id);
  }
  q.choices.forEach(function (c) {
    assert(!dating.test(c.label), "not dating choice: " + c.label);
    assert(!emDash.test(c.label), "no em dash in choice: " + c.label);
  });
});

const visaQ = findBrowseAskQuestion("visa");
assert(visaQ && visaQ.groups, "visa uses country headings");
assertEq(
  visaQ.groups.map(function (g) { return g.heading; }).join(" | "),
  VISA_STATUS_GROUPS.map(function (g) { return g.heading; }).join(" | "),
  "visa headings reuse VISA_STATUS_GROUPS"
);
VISA_STATUS_GROUPS.forEach(function (group, i) {
  assertEq(
    visaQ.groups[i].choices.map(function (c) { return c.label; }).join(" | "),
    group.options.join(" | "),
    "visa options reused for " + group.heading
  );
});
assert(
  visaQ.choices.some(function (c) { return c.label === "Indian citizen (living abroad)"; }),
  "ungrouped visa option stays"
);
assert(
  !visaQ.choices.some(function (c) { return c.label === BROWSE_ASK_VISA_NO_ANSWER_LABEL; }),
  "Prefer not to say is the skip, not a second visa chip"
);
assert(VISA_STATUS_UNGROUPED.includes(BROWSE_ASK_VISA_NO_ANSWER_LABEL), "visa skip label already exists");

const location = findBrowseAskQuestion("location");
const locationLabels = location.choices.map(function (c) { return c.label; });
["United States", "Australia", "United Kingdom", "Europe", "Ireland", "India"].forEach(function (label) {
  assert(locationLabels.includes(label), "location includes " + label);
});

const religion = findBrowseAskQuestion("religion");
["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Other"].forEach(function (label) {
  assert(religion.choices.some(function (c) { return c.label === label; }), "religion includes " + label);
});

const caste = findBrowseAskQuestion("caste");
assert(caste.choices.some(function (c) { return c.label === "Any"; }), "caste includes Any");
caste.choices.forEach(function (c) {
  if (c.id === "any") return;
  assert(KEYWORD_ALIASES[c.id], "caste chip reuses an existing community alias: " + c.id);
});

const thinPrompt = "indian girl with family values";
const thinParsed = parseSearchQuery(thinPrompt);
assertEq(thinParsed.city, null, "thin prompt has no city");
assert(!promptHasLocation(thinPrompt), "indian is not a location tap skip");
assert(!promptHasVisa(thinPrompt), "plain English does not invent a visa");
assert(!promptHasReligion(thinPrompt), "family values is not a faith");
assert(!promptHasCaste(thinPrompt), "family values is not a community");
["telugu", "tamil", "nri", "iyengar", "reddy", "hindu", "muslim"].forEach(function (word) {
  assert(!thinParsed.keywords.includes(word), "must not invent " + word + " from a plain English prompt");
});

assert(remainingBrowseQuestions("").length === 0, "blank prompt never asks");
assert(browseAskReadyForShortlist(""), "empty first load may show the default shortlist");
assert(!browseAskReadyForShortlist(thinPrompt), "thin prompt must not render the shortlist yet");

const thin = remainingBrowseQuestions(thinPrompt);
assertEq(
  thin.map(function (q) { return q.id; }).join(" "),
  "location visa religion caste family_living parents work timeline children mother_tongue",
  "thin prompt asks the ten in order"
);
assertEq(thin[0].id, "location", "first leftover question is location");
assertEq(thin[0].prompt, "Where should we look?", "location copy");

const dallas = remainingBrowseQuestions("indian girl with family values in Dallas");
assertEq(dallas[0].id, "visa", "in Dallas skips location");
assert(!dallas.some(function (q) { return q.id === "location" || q.id === "city"; }), "city in the prompt skips the location taps");
assert(browseAskAlreadyAnswered("location", "indian girl with family values in Dallas"), "Dallas is a location answer");

const h1b = remainingBrowseQuestions("indian girl with family values H1B");
assertEq(h1b[0].id, "location", "H1B still asks location first");
assert(!h1b.some(function (q) { return q.id === "visa"; }), "H1B skips visa");
assert(promptHasVisa("h1b"), "visa aliases skip visa");
assert(promptHasVisa("green card doctor"), "green card skips visa");

const faith = remainingBrowseQuestions("Hindu Reddy girl in Dallas");
assert(!faith.some(function (q) { return q.id === "location"; }), "Dallas skips location");
assert(!faith.some(function (q) { return q.id === "religion"; }), "Hindu skips religion");
assert(!faith.some(function (q) { return q.id === "caste"; }), "Reddy skips caste");
assertEq(faith[0].id, "visa", "still ask visa when unknown");

const afterUs = remainingBrowseQuestions(thinPrompt, [{ questionId: "location", choiceId: "us" }]);
assertEq(afterUs[0].id, "city", "US region can ask a city from the existing list");
afterUs[0].choices.forEach(function (c) {
  assert(SEARCH_CITIES.includes(c.fold), "city tap is already in SEARCH_CITIES: " + c.fold);
});

const afterAu = remainingBrowseQuestions(thinPrompt, [{ questionId: "location", choiceId: "australia" }]);
assertEq(afterAu[0].id, "visa", "Australia has no invented city list, so visa is next");

const afterSkip = remainingBrowseQuestions(thinPrompt, [{ questionId: "location", choiceId: BROWSE_ASK_NO_ANSWER_ID }]);
assertEq(afterSkip[0].id, "visa", "Don't want to answer on location skips city and goes to visa");

const allSkipped = [
  { questionId: "location", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "visa", choiceId: "prefer_not" },
  { questionId: "religion", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "caste", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "family_living", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "parents", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "work", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "timeline", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "children", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "mother_tongue", choiceId: BROWSE_ASK_NO_ANSWER_ID },
];
assert(browseAskReadyForShortlist(thinPrompt, allSkipped), "ten skips unlock the shortlist");
assertEq(foldBrowseAnswers(thinPrompt, allSkipped), thinPrompt, "Don't want to answer omits filters");

const cityFold = foldBrowseAnswers(thinPrompt, [
  { questionId: "location", choiceId: "us" },
  { questionId: "city", choiceId: "dallas" },
]);
assertEq(parseSearchQuery(cityFold).city, "Dallas", "folded city is parsed");

const visaFold = foldBrowseAnswers(thinPrompt, [{ questionId: "visa", choiceId: "H-1B" }]);
assert(parseSearchQuery(visaFold).keywords.includes("H-1B"), "folded visa reuses the stored label");
assertEq(foldPhraseForAnswer("visa", "prefer_not"), "", "Prefer not to say fold is empty");
assertEq(foldPhraseForAnswer("caste", "any"), "", "Any community fold is empty");

userFacingBrowseAskCopy().forEach(function (text) {
  assert(!emDash.test(text), "user-facing copy has no em dash: " + text);
  assert(!/bandhan\b/i.test(text), "product name is Bandham, not Bandhan: " + text);
  assert(!dating.test(text), "not dating copy: " + text);
});
assertEq(browseAskProgress(0, 10), "1 of 10", "progress has no slash or hyphen");

const page = read("app/page.tsx");
const ui = read("app/components/BrowseAsk.tsx");
const askLib = read("lib/browse-ask.ts");

assert(page.includes("remainingBrowseQuestions"), "Browse asks remaining questions after a prompt");
assert(page.includes("submitPrompt"), "typed/spoken prompt goes through ask first");
assert(!/onClick=\{function \(\) \{ submitPrompt\(\); \}\}[\s\S]{0,80}disabled=\{searching\}/.test(page), "Search stays tappable while the default shortlist is still looking");
assert(page.includes("foldBrowseAnswers"), "answers fold into search q");
assert(page.includes("browseAskReadyForShortlist"), "shortlist waits until leftover dealbreakers are resolved or skipped");
assert(page.includes("showBrowseShortlist"), "shortlist render is gated");
assert(page.includes("data-search-enlarged"), "search box marks enlarged");
assert(page.includes("data-browse-shortlist"), "shortlist ready/waiting is marked");
assert(page.includes("minHeight: asking ? 280"), "box enlarges after the prompt");
assert(page.includes("<BrowseAsk"), "Browse renders the ask widget");
assert(page.includes("/api/profiles/search"), "search still hits profiles search");
assert(!/fetch\(\s*["']\/api\/(chat|guru)/.test(page), "Browse still never opens guru");
assert(page.includes("askQueue[0]"), "one question at a time");
assert(!/askQueue\.map/.test(page), "do not render a wall of leftover questions");
assert(page.includes("sessionAnswers"), "answers are remembered in this session");

const enlargedAt = page.indexOf("data-search-enlarged");
const askAt = page.indexOf("<BrowseAsk\n") >= 0 ? page.indexOf("<BrowseAsk\n") : page.indexOf("<BrowseAsk ");
const sectionClose = page.indexOf("</section>", enlargedAt);
assert(enlargedAt >= 0 && askAt > enlargedAt && askAt < sectionClose, "ask lives inside the enlarged search box");
assert(page.indexOf("showBrowseShortlist") < page.indexOf("<BrowseCarousel"), "carousel is behind the ask gate");
assert(page.indexOf("showBrowseShortlist") < page.indexOf("<PinnedRow"), "pinned row is behind the ask gate while asking");
assert(page.includes('data-browse-shortlist="waiting"'), "waiting mark is present while asking");

assert(!ui.includes("<input") && !ui.includes("<textarea"), "ask is tap only");
assert(ui.includes("PROFILE_ACTION_MIN") || ui.includes("minHeight: 44"), "44px taps");
assert(ui.includes("CREAM") || ui.includes("FDF8F1"), "cream surface");
assert(ui.includes("VIOLET") || ui.includes("6D28D9") || ui.includes("WASH"), "soft violet family");
assert(ui.includes("data-browse-ask"), "current question is marked");
assert(ui.includes("BROWSE_ASK_NO_ANSWER_ID"), "Don't want to answer is the skip chip, not Any");
assert(ui.includes("BROWSE_ASK_NO_ANSWER_ALIAS"), "visa skip stays Prefer not to say");
assert(!page.includes("Ask me anything"), "do not copy Manasi input copy");
assert(!/manasi\.ai|smart fast personalized/i.test(page + ui), "Browse has no Manasi brand copy");
assert(!/\bswipe\b/i.test(ui), "ask is not a swipe deck");

const speed = read("app/components/SpeedMatch.tsx");
const speedLib = read("lib/speed-match.ts");
assert(speedLib.includes("speedMatchDealbreakerQuestions"), "Speed Match uses the shared household bank");
assert(speedLib.includes("SPEED_MATCH_QUESTION_COUNT = 10"), "Speed Match bank stays 10");
assert(/not the speed match timer/i.test(askLib), "Browse ask is not the timer");
assert(!/diet/i.test(ids.join(" ")), "Browse bank has no diet id");
assert(findBrowseAskQuestion("work")?.prompt.includes("keep working"), "work after marriage is in Browse");
assert(findBrowseAskQuestion("mother_tongue")?.id === "mother_tongue", "mother tongue is in Browse");
assert(!browseAskAlreadyAnswered("family_living", thinPrompt), "family values is not joint family");
assert(browseAskAlreadyAnswered("family_living", "joint family in Dallas"), "joint family skips that tap");
assert(browseAskAlreadyAnswered("mother_tongue", "Telugu doctor"), "Telugu skips mother tongue");
assert(!browseAskAlreadyAnswered("children", thinPrompt), "family values is not kids");
assert(askLib.includes("VISA_STATUS_GROUPS"), "visa taps reuse VISA_STATUS_GROUPS");
assert(page.includes("MeetupRail"), "home meetup rail stays");
assert(page.includes("PinnedRow"), "home pinned row stays");
assert(page.includes('data-home-shell="true"'), "home shell stays locked");

console.log("browse ask one by one ok", {
  fields: BROWSE_ASK_FIELD_ORDER.slice(),
  thin: thin.map(function (q) { return q.id; }),
  dallasFirst: dallas[0].id,
  skippedUnlocks: browseAskReadyForShortlist(thinPrompt, allSkipped),
});

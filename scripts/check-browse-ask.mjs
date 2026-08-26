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
  appendFoldPhrase,
  browseAskAlreadyAnswered,
  browseAskChoices,
  browseAskProgress,
  browseAskReadyForShortlist,
  findBrowseAskQuestion,
  browseAskRegionFolds,
  foldBrowseAnswers,
  foldPhraseForAnswer,
  foldsIntoSearchBox,
  isBrowseAskNoAnswer,
  lookingForFromPrompt,
  matchCountryFromPrompt,
  promptHasCaste,
  promptHasLocation,
  promptHasLookingFor,
  promptHasReligion,
  promptHasSeekerCountry,
  promptHasVisa,
  regionIdFromPlace,
  remainingBrowseQuestions,
  searchQueryFromBox,
  seekerCountryFromPrompt,
  userFacingBrowseAskCopy,
} from "../lib/browse-ask.ts";
import {
  BROWSE_PREFS_STORAGE_KEY,
  applyAnswerToPrefs,
  applyPromptToPrefs,
  dropRemovedMatchPrefs,
  emptyBrowsePrefs,
  foldMatchPrefsIntoQuery,
  hydratePrefsFromProfile,
  persistBrowsePrefsToServer,
  prefsToAnswers,
} from "../lib/browse-prefs.ts";
import { hasCriteria, parseSearchQuery } from "../lib/profile-search.ts";
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
assert(BROWSE_ASK_HINT.toLowerCase().includes("filter"), "hint calls leftover taps filters");
assert(!/dealbreaker/i.test(BROWSE_ASK_HINT), "search box hint must not say dealbreaker");
assert(!/bandhan\b/i.test(BROWSE_ASK_HINT), "product is Bandham, not Bandhan");
assert(BROWSE_ASK_LABEL === "FILTERS", "ask eyebrow says FILTERS");
assertEq(
  BROWSE_ASK_FIELD_ORDER.join(" "),
  "looking_for seeker location visa religion caste",
  "leftover order is bride or groom, seeker country, then the four filters"
);

const ids = BROWSE_ASK_QUESTIONS.map(function (q) {
  return q.id;
});
assertEq(
  ids.join(" "),
  "looking_for seeker location visa religion caste",
  "bank order is looking for, seeker, then the four search filters"
);
assert(!ids.includes("city"), "city is a follow-up, not a bank id");
assert(!ids.includes("mother_tongue"), "mother tongue is not a Browse filter");
assert(!ids.includes("diet"), "diet is not a Browse filter");
assert(!ids.includes("family_living"), "joint family is not a Browse filter");
assert(!ids.includes("parents"), "parents in the decision is not a Browse filter");
assert(!ids.includes("work"), "work after marriage is not a Browse filter");
assert(!ids.includes("timeline"), "timeline is not a Browse filter");
assert(!ids.includes("children"), "kids is not a Browse filter");
assert(!ids.includes("gender"), "gender is not a leftover tap id");

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
  "seeker location visa religion caste",
  "thin girl prompt skips bride or groom and asks seeker then the four filters"
);
assertEq(thin[0].id, "seeker", "first leftover question is seeker country when looking for is known");
assertEq(thin[0].prompt, "Where are you now?", "seeker copy");
assertEq(findBrowseAskQuestion("location").prompt, "Where should they be from?", "match country copy");
assert(promptHasLookingFor(thinPrompt), "girl in the prompt is a bride or groom answer");
assertEq(lookingForFromPrompt(thinPrompt), "bride", "girl maps to bride");

const dallas = remainingBrowseQuestions("indian girl with family values in Dallas");
assertEq(dallas[0].id, "seeker", "in Dallas still asks where the seeker is");
assert(!dallas.some(function (q) { return q.id === "location" || q.id === "city"; }), "city in the prompt skips the match location taps");
assert(browseAskAlreadyAnswered("location", "indian girl with family values in Dallas"), "Dallas is a match location answer");

const dallasKnownSeeker = remainingBrowseQuestions("indian girl with family values in Dallas", [
  { questionId: "seeker", choiceId: "us" },
]);
assertEq(dallasKnownSeeker[0].id, "visa", "known seeker plus Dallas starts at visa");

const h1b = remainingBrowseQuestions("indian girl with family values H1B");
assertEq(h1b[0].id, "seeker", "H1B still asks seeker country first");
assert(!h1b.some(function (q) { return q.id === "visa"; }), "H1B skips visa");
assert(promptHasVisa("h1b"), "visa aliases skip visa");
assert(promptHasVisa("green card doctor"), "green card skips visa");

const faith = remainingBrowseQuestions("Hindu Reddy girl in Dallas");
assert(!faith.some(function (q) { return q.id === "location"; }), "Dallas skips location");
assert(!faith.some(function (q) { return q.id === "religion"; }), "Hindu skips religion");
assert(!faith.some(function (q) { return q.id === "caste"; }), "Reddy skips caste");
assertEq(faith[0].id, "seeker", "still ask seeker country when unknown");
assertEq(
  remainingBrowseQuestions("Hindu Reddy girl in Dallas", [{ questionId: "seeker", choiceId: "us" }])[0].id,
  "visa",
  "still ask visa when unknown"
);

const afterUs = remainingBrowseQuestions(thinPrompt, [
  { questionId: "seeker", choiceId: "india" },
  { questionId: "location", choiceId: "us" },
]);
assertEq(afterUs[0].id, "city", "US region can ask a city from the existing list");
afterUs[0].choices.forEach(function (c) {
  assert(SEARCH_CITIES.includes(c.fold), "city tap is already in SEARCH_CITIES: " + c.fold);
});

const afterUsSkipCity = remainingBrowseQuestions(thinPrompt, [
  { questionId: "seeker", choiceId: "india" },
  { questionId: "location", choiceId: "us" },
  { questionId: "city", choiceId: BROWSE_ASK_NO_ANSWER_ID },
]);
assertEq(afterUsSkipCity[0].id, "visa", "skip city keeps the region and continues to visa");
assert(!afterUsSkipCity.some(function (q) { return q.id === "city"; }), "city is not asked again after skip");

const afterAu = remainingBrowseQuestions(thinPrompt, [
  { questionId: "seeker", choiceId: "india" },
  { questionId: "location", choiceId: "australia" },
]);
assertEq(afterAu[0].id, "visa", "Australia has no invented city list, so visa is next");

const afterSkip = remainingBrowseQuestions(thinPrompt, [
  { questionId: "seeker", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "location", choiceId: BROWSE_ASK_NO_ANSWER_ID },
]);
assertEq(afterSkip[0].id, "visa", "Don't want to answer on location skips city and goes to visa");

const allSkipped = [
  { questionId: "looking_for", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "seeker", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "location", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "visa", choiceId: "prefer_not" },
  { questionId: "religion", choiceId: BROWSE_ASK_NO_ANSWER_ID },
  { questionId: "caste", choiceId: BROWSE_ASK_NO_ANSWER_ID },
];
assert(browseAskReadyForShortlist(thinPrompt, allSkipped), "four filter skips unlock the shortlist");
assertEq(foldBrowseAnswers(thinPrompt, allSkipped), thinPrompt, "Don't want to answer omits filters");

const cityFold = foldBrowseAnswers(thinPrompt, [
  { questionId: "location", choiceId: "us" },
  { questionId: "city", choiceId: "dallas" },
]);
assertEq(parseSearchQuery(cityFold).city, "Dallas", "folded city is parsed");
assert(cityFold.includes("United States"), "region phrase stays when a city is also tapped");

const regionSkipCity = foldBrowseAnswers(thinPrompt, [
  { questionId: "location", choiceId: "us" },
  { questionId: "city", choiceId: BROWSE_ASK_NO_ANSWER_ID },
]);
assert(regionSkipCity.includes("United States"), "skip city still folds the United States phrase");
const regionParsed = parseSearchQuery(regionSkipCity);
assert(hasCriteria(regionParsed), "skipped city still leaves a searchable location");
assert(
  regionParsed.city === "United States" ||
    regionParsed.keywords.some(function (kw) {
      return /united|states/i.test(kw);
    }),
  "parseSearchQuery keeps the United States region: " + JSON.stringify(regionParsed)
);

["us", "australia", "uk", "europe", "ireland", "india"].forEach(function (regionId) {
  const phrase = foldPhraseForAnswer("location", regionId);
  assert(!!phrase, "region " + regionId + " folds a searchable phrase");
  assert(!emDash.test(phrase), "region fold has no em dash: " + phrase);
});
assertEq(
  browseAskRegionFolds().join(" | "),
  "United States | Australia | United Kingdom | Europe | Ireland | India",
  "region folds reuse existing English region labels"
);

const indiaSkipCity = foldBrowseAnswers(thinPrompt, [
  { questionId: "location", choiceId: "india" },
  { questionId: "city", choiceId: BROWSE_ASK_NO_ANSWER_ID },
]);
assert(indiaSkipCity.includes("India"), "skip city still folds India");
assert(hasCriteria(parseSearchQuery(indiaSkipCity)), "India region is searchable without a city");

const visaFold = foldBrowseAnswers(thinPrompt, [{ questionId: "visa", choiceId: "H-1B" }]);
assert(parseSearchQuery(visaFold).keywords.includes("H-1B"), "folded visa reuses the stored label");
assertEq(foldPhraseForAnswer("visa", "prefer_not"), "", "Prefer not to say fold is empty");
assertEq(foldPhraseForAnswer("caste", "any"), "", "Any community fold is empty");

userFacingBrowseAskCopy().forEach(function (text) {
  assert(!emDash.test(text), "user-facing copy has no em dash: " + text);
  assert(!/bandhan\b/i.test(text), "product name is Bandham, not Bandhan: " + text);
  assert(!dating.test(text), "not dating copy: " + text);
  assert(!/dealbreaker/i.test(text), "search box copy must not say dealbreaker: " + text);
});
assertEq(browseAskProgress(0, 6), "1 of 6", "progress has no slash or hyphen");
assert(/filter/i.test(userFacingBrowseAskCopy().join(" ")), "user-facing ask copy names filters");

const page = read("app/page.tsx");
const ui = read("app/components/BrowseAsk.tsx");
const askLib = read("lib/browse-ask.ts");

assert(page.includes("remainingBrowseQuestions"), "Browse asks remaining questions after a prompt");
assert(page.includes("submitPrompt"), "typed/spoken prompt goes through ask first");
assert(!/onClick=\{function \(\) \{ submitPrompt\(\); \}\}[\s\S]{0,80}disabled=\{searching\}/.test(page), "Search stays tappable while the default shortlist is still looking");
assert(page.includes("foldBrowseAnswers"), "answers fold into search q");
assert(page.includes("appendFoldPhrase"), "taps append a phrase into the visible search input");
assert(page.includes("setQuery(nextQuery)") || page.includes("setQuery(visible)"), "the PROFILE SEARCH box text updates when they tap");
assert(page.includes("loadBrowsePrefs"), "prefs load from localStorage");
assert(page.includes("saveBrowsePrefs"), "prefs save on this device");
assert(page.includes("hydratePrefsFromProfile"), "signed in profile can fill seeker or looking for");
assert(page.includes("persistBrowsePrefsToServer"), "server persist is attempted and fails closed");
assert(page.includes("foldMatchPrefsIntoQuery"), "remembered match prefs can appear in the box");
assert(page.includes("searchQueryFromBox"), "seeker words are stripped before the search request");
assert(page.includes("browseAskReadyForShortlist"), "shortlist waits until leftover filters are resolved or skipped");
assert(page.includes("SEARCH_FILTER_HELPER"), "quiet helper sits under the search box");
assert(
  page.indexOf("aria-label=\"Search profiles\"") < page.indexOf("{SEARCH_FILTER_HELPER}"),
  "helper copy is under the input box, not above it"
);
assert(page.includes("SEARCH_HINT"), "loved search hint stays");
assert(page.indexOf("{SEARCH_HINT}") < page.indexOf("{SEARCH_FILTER_HELPER}"), "hint stays above the box");
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
assert(page.includes("prefsToAnswers"), "remembered prefs become leftover answers");

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
const surfaces = read("lib/surfaces.ts");
assert(!speedLib.includes("speedMatchDealbreakerQuestions"), "Speed Match is not rewritten onto a shared filter bank");
assert(!speedLib.includes("from \"./dealbreakers\""), "Speed Match does not import dealbreakers.ts");
assert(speedLib.includes('id: "diet"'), "Speed Match keeps diet from main");
assert(speedLib.includes('id: "family_living"'), "Speed Match keeps family from main");
assert(speedLib.includes('id: "location"'), "Speed Match keeps location from main");
assert(speedLib.includes('id: "parents"'), "Speed Match keeps parents from main");
assert(speedLib.includes('id: "timeline"'), "Speed Match keeps timeline from main");
assert(speedLib.includes('id: "children"'), "Speed Match keeps kids from main");
assert(speedLib.includes("SPEED_MATCH_QUESTION_COUNT = 10"), "Speed Match bank stays 10");
assert(/not the speed match timer/i.test(askLib) || /not speed match/i.test(askLib), "Browse ask is not the timer");
assert(askLib.toLowerCase().includes("filter"), "Browse ask lib names leftover taps filters");
assert(!askLib.includes("mother_tongue"), "Browse ask has no mother tongue path");
assert(!/diet/i.test(ids.join(" ")), "Browse bank has no diet id");
assert(!findBrowseAskQuestion("mother_tongue"), "mother tongue is gone from Browse");
assert(!findBrowseAskQuestion("work"), "work after marriage is not a Browse filter");
assert(!findBrowseAskQuestion("family_living"), "joint family is not a Browse filter");
assert(askLib.includes("VISA_STATUS_GROUPS"), "visa taps reuse VISA_STATUS_GROUPS");
assert(surfaces.includes('Add city, visa, and religion if you know them.'), "helper copy is Sai's line");
assert(!emDash.test(surfaces.match(/SEARCH_FILTER_HELPER[\s\S]{0,80}/)?.[0] || ""), "helper has no em dash");
assert(!/dealbreaker/i.test(surfaces.match(/SEARCH_FILTER_HELPER[\s\S]{0,120}/)?.[0] || ""), "helper does not say dealbreaker");
assert(!/dealbreaker/i.test(page.slice(page.indexOf("SEARCH_HINT"), page.indexOf("<BrowseAsk"))), "search box copy does not say dealbreaker");
assert(page.includes("MeetupRail"), "home meetup rail stays");
assert(page.includes("PinnedRow"), "home pinned row stays");
assert(page.includes('data-home-shell="true"'), "home shell stays locked");

assertEq(appendFoldPhrase("Dallas groom", "Hindu"), "Dallas groom Hindu", "religion tap lands in the box");
assertEq(appendFoldPhrase("Dallas groom Hindu", "H-1B"), "Dallas groom Hindu H-1B", "visa tap lands in the box");
assertEq(appendFoldPhrase("Dallas groom", "groom"), "Dallas groom", "do not repeat a phrase already in the box");
assertEq(foldPhraseForAnswer("looking_for", "groom"), "groom", "groom tap folds the word groom");
assertEq(foldPhraseForAnswer("looking_for", "bride"), "bride", "bride tap folds the word bride");
assertEq(foldPhraseForAnswer("seeker", "us"), "", "seeker country never folds into search");
assert(!foldsIntoSearchBox("seeker"), "seeker answers stay out of the query");
assert(foldsIntoSearchBox("location"), "match country still folds");
assertEq(
  foldBrowseAnswers("Dallas groom", [
    { questionId: "seeker", choiceId: "us" },
    { questionId: "religion", choiceId: "hindu" },
  ]),
  "Dallas groom Hindu",
  "seeker country is omitted while religion folds"
);
assertEq(lookingForFromPrompt("Dallas groom"), "groom", "groom in the prompt is looking for");
assertEq(parseSearchQuery("Dallas groom").gender, "Male", "groom is a male match search");
assertEq(parseSearchQuery("Dallas bride").gender, "Female", "bride is a female match search");
assert(!promptHasLocation("I am in the United States"), "seeker country is not a match location");
assert(promptHasSeekerCountry("I am in the United States"), "I am in marks seeker country");
assertEq(seekerCountryFromPrompt("I am in India"), "india", "I am in India is seeker country");
assertEq(
  searchQueryFromBox("I am in the United States looking for a Dallas groom"),
  "looking for a Dallas groom",
  "seeker country is stripped from the search q"
);
assertEq(matchCountryFromPrompt("Dallas groom"), "us", "Dallas is a US match location");
assertEq(matchCountryFromPrompt("I am in the United States looking for a Dallas groom"), "us", "Dallas is still the match place");
assertEq(regionIdFromPlace("Hyderabad"), "india", "profile city Hyderabad is India");
assertEq(regionIdFromPlace("Dallas"), "us", "profile city Dallas is the United States");
assert(
  remainingBrowseQuestions("I am in the United States looking for a groom").some(function (q) {
    return q.id === "location";
  }),
  "seeker phrase still asks where they should be from"
);
assert(
  !remainingBrowseQuestions("I am in the United States looking for a groom").some(function (q) {
    return q.id === "seeker" || q.id === "looking_for";
  }),
  "I am in plus groom skips seeker and looking for"
);

const remembered = applyAnswerToPrefs(emptyBrowsePrefs(), "looking_for", "groom");
const withSeeker = applyAnswerToPrefs(remembered, "seeker", "us");
const withMatch = applyAnswerToPrefs(withSeeker, "location", "india");
assertEq(prefsToAnswers(withMatch).map(function (a) { return a.questionId; }).join(" "), "looking_for seeker location", "prefs become answers");
assertEq(foldMatchPrefsIntoQuery("pediatrician", withMatch), "pediatrician groom India", "remembered match prefs fold, seeker does not");
assertEq(applyPromptToPrefs("bride in India", withMatch).lookingFor, "bride", "typed bride beats saved groom");
assertEq(applyPromptToPrefs("bride in India", withMatch).matchCountry, "india", "typed India stays the match country");
assertEq(
  dropRemovedMatchPrefs("Dallas groom", "Dallas groom Hindu", applyAnswerToPrefs(emptyBrowsePrefs(), "religion", "hindu")).religion,
  "",
  "editing Hindu out of the box clears that pref"
);
assertEq(
  hydratePrefsFromProfile(emptyBrowsePrefs(), { city: "Dallas", wants: "looking for a groom" }).seekerCountry,
  "us",
  "profile city can fill seeker country"
);
assertEq(
  hydratePrefsFromProfile(emptyBrowsePrefs(), { city: "Dallas", wants: "looking for a groom" }).lookingFor,
  "groom",
  "profile wants can fill bride or groom"
);
assertEq(BROWSE_PREFS_STORAGE_KEY, "bandham.browse.prefs", "prefs key is device localStorage");
assertEq(persistBrowsePrefsToServer(), false, "no browse_prompts table, server persist fails closed");

const prefsLib = read("lib/browse-prefs.ts");
assert(prefsLib.includes("localStorage"), "prefs persist on the device");
assert(!prefsLib.includes("from("), "prefs do not invent a SQL write");
assert(!askLib.includes("mother_tongue"), "Browse ask still has no mother tongue path");
assert(findBrowseAskQuestion("looking_for"), "bride or groom is a leftover tap");
assert(findBrowseAskQuestion("seeker"), "seeker country is a leftover tap");
assert(!/Ask me anything|working in IT in Bangalore|Recent Results/i.test(page + ui + askLib), "no Manasi leftover copy");

console.log("browse ask one by one ok", {
  fields: BROWSE_ASK_FIELD_ORDER.slice(),
  thin: thin.map(function (q) { return q.id; }),
  dallasFirst: dallas[0].id,
  skippedUnlocks: browseAskReadyForShortlist(thinPrompt, allSkipped),
});

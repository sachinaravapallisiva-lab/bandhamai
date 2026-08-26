/**
 * Browse leftover FILTER taps after a PROFILE SEARCH prompt. Not Speed Match.
 *
 * After a typed or spoken prompt, enlarge the search box and ask leftover
 * search filters as tap chips, one at a time. These are filters, not
 * dealbreakers. Dealbreakers stay on Speed Match / when they talk.
 * Taps fold into the visible PROFILE SEARCH input so they can edit the
 * words. Seeker country is remembered only; it is not a match filter.
 * Session + localStorage remember prefs. A short prompt is never blocked.
 */

import { SEARCH_CITIES } from "./desi-search-aliases";
import { parseSearchQuery, type SearchCriteria } from "./profile-search";
import {
  VISA_STATUS_ALIASES,
  VISA_STATUS_GROUPS,
  VISA_STATUS_UNGROUPED,
  isVisaStatusOption,
  resolveVisaAlias,
} from "./visa-status";

export const BROWSE_ASK_NO_ANSWER_ID = "dont_answer";
export const BROWSE_ASK_NO_ANSWER_ALIAS = "prefer_not";
export const BROWSE_ASK_NO_ANSWER_LABEL = "Don't want to answer";
export const BROWSE_ASK_VISA_NO_ANSWER_LABEL = "Prefer not to say";
/** Explicit preference that community does not matter. Not Don't want to answer. */
export const BROWSE_ASK_CASTE_NO_BAR_ID = "caste_no_bar";
export const BROWSE_ASK_CASTE_NO_BAR_LABEL = "Caste no bar";

export const BROWSE_ASK_LABEL = "FILTERS";
export const BROWSE_ASK_HINT = "Tap one filter. Bandham AI uses this for the shortlist.";

/** Leftover order. City is an optional follow-up after match country, not a bank id. */
export const BROWSE_ASK_FIELD_ORDER = [
  "looking_for",
  "seeker",
  "location",
  "visa",
  "religion",
  "caste",
] as const;

export type BrowseAskField = (typeof BROWSE_ASK_FIELD_ORDER)[number];

export type BrowseAskChoice = {
  id: string;
  label: string;
  /** Text appended to the Browse prompt. Empty means omit that filter. */
  fold: string;
};

export type BrowseAskChoiceGroup = {
  heading: string;
  choices: BrowseAskChoice[];
};

export type BrowseAskQuestion = {
  id: string;
  prompt: string;
  choices: BrowseAskChoice[];
  groups?: BrowseAskChoiceGroup[];
  noAnswerLabel?: string;
};

export type BrowseAskAnswer = {
  questionId: string;
  choiceId: string;
};

const SEARCH_FILTER_PROMPTS: Record<BrowseAskField, string> = {
  looking_for: "Bride or groom?",
  seeker: "Where are you now?",
  location: "Where should they be from?",
  visa: "Which visa status should we look for?",
  religion: "Any faith we should look for?",
  caste: "Which community should we look for?",
};

/**
 * Region labels already used as ordinary English in Browse.
 * fold is the searchable phrase parseSearchQuery keeps (city or leftover keywords).
 * Do not invent a country taxonomy beyond these existing names.
 */
const LOCATION_CHOICES: BrowseAskChoice[] = [
  { id: "us", label: "United States", fold: "United States" },
  { id: "australia", label: "Australia", fold: "Australia" },
  { id: "uk", label: "United Kingdom", fold: "United Kingdom" },
  { id: "europe", label: "Europe", fold: "Europe" },
  { id: "ireland", label: "Ireland", fold: "Ireland" },
  { id: "india", label: "India", fold: "India" },
];

const LOOKING_FOR_CHOICES: BrowseAskChoice[] = [
  { id: "bride", label: "Bride", fold: "bride" },
  { id: "groom", label: "Groom", fold: "groom" },
];

const LOOKING_FOR_BRIDE_TERMS = ["bride", "brides"];
const LOOKING_FOR_GROOM_TERMS = ["groom", "grooms"];

const REGION_DETECT: { id: string; terms: string[] }[] = [
  { id: "us", terms: ["united states", "usa", "u s a"] },
  { id: "australia", terms: ["australia"] },
  { id: "uk", terms: ["united kingdom", "britain", "uk"] },
  { id: "europe", terms: ["europe"] },
  { id: "ireland", terms: ["ireland"] },
  { id: "india", terms: ["india"] },
];

const EXTRA_SEEKER_CITIES: Record<string, string> = {
  london: "uk",
  birmingham: "uk",
  manchester: "uk",
  sydney: "australia",
  melbourne: "australia",
  dublin: "ireland",
};

const SEEKER_LEAD = "(?:i am|i'm|im|i live|we are|we're)\\s+in\\s+(?:the\\s+)?";

const RELIGION_CHOICES: BrowseAskChoice[] = [
  { id: "hindu", label: "Hindu", fold: "Hindu" },
  { id: "muslim", label: "Muslim", fold: "Muslim" },
  { id: "christian", label: "Christian", fold: "Christian" },
  { id: "sikh", label: "Sikh", fold: "Sikh" },
  { id: "jain", label: "Jain", fold: "Jain" },
  { id: "buddhist", label: "Buddhist", fold: "Buddhist" },
  { id: "other", label: "Other", fold: "Other" },
];

const RELIGION_TERMS = [
  "hindu",
  "muslim",
  "islam",
  "islamic",
  "christian",
  "sikh",
  "jain",
  "buddhist",
  "buddhism",
];

const COMMUNITY_CHIP_IDS = [
  "reddy",
  "iyengar",
  "iyer",
  "nair",
  "naidu",
  "brahmin",
  "patel",
  "gowda",
  "shetty",
  "aggarwal",
];

const COMMUNITY_ALIAS_TERMS = [
  "iyengar",
  "iyer",
  "reddy",
  "nair",
  "nambiar",
  "menon",
  "naidu",
  "kamma",
  "kapu",
  "velama",
  "raju",
  "brahmin",
  "namboodiri",
  "pillai",
  "chettiar",
  "mudaliar",
  "gowda",
  "shetty",
  "patel",
  "aggarwal",
  "agarwal",
  "kayastha",
  "syrian christian",
];

const LOCATION_REGION_TERMS = [
  "united states",
  "usa",
  "u s a",
  "australia",
  "united kingdom",
  "britain",
  "europe",
  "ireland",
  "in india",
  "from india",
];

const US_CITY_SET = new Set([
  "Dallas",
  "Austin",
  "Houston",
  "Atlanta",
  "Chicago",
  "Seattle",
  "San Jose",
  "Bay Area",
  "New Jersey",
  "New York",
  "Edison",
  "Irving",
  "Frisco",
  "Princeton",
  "Fremont",
  "Cupertino",
  "Sunnyvale",
  "Santa Clara",
  "Iselin",
  "Jersey City",
]);

const INDIA_CITY_SET = new Set(
  SEARCH_CITIES.filter(function (city) {
    return !US_CITY_SET.has(city);
  })
);

const REGION_CITY_SETS: Record<string, Set<string>> = {
  us: US_CITY_SET,
  india: INDIA_CITY_SET,
};

export const BROWSE_ASK_NO_ANSWER_CHOICE: BrowseAskChoice = {
  id: BROWSE_ASK_NO_ANSWER_ID,
  label: BROWSE_ASK_NO_ANSWER_LABEL,
  fold: "",
};

export const BROWSE_ASK_CASTE_NO_BAR_CHOICE: BrowseAskChoice = {
  id: BROWSE_ASK_CASTE_NO_BAR_ID,
  label: BROWSE_ASK_CASTE_NO_BAR_LABEL,
  fold: "",
};

function titleLabel(value: string) {
  return value
    .split(/\s+/)
    .map(function (part) {
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function communityChoices(): BrowseAskChoice[] {
  return COMMUNITY_CHIP_IDS.map(function (id) {
    return { id: id, label: titleLabel(id), fold: titleLabel(id) };
  }).concat(BROWSE_ASK_CASTE_NO_BAR_CHOICE);
}

function cityChoice(city: string): BrowseAskChoice {
  return { id: city.toLowerCase().replace(/\s+/g, "_"), label: city, fold: city };
}

function citiesForRegion(regionId: string): BrowseAskChoice[] {
  const allowed = REGION_CITY_SETS[regionId];
  if (!allowed) return [];
  return SEARCH_CITIES.filter(function (city) {
    return allowed.has(city);
  }).map(cityChoice);
}

function visaChoice(label: string): BrowseAskChoice {
  return { id: label, label: label, fold: label };
}

function visaQuestion(): BrowseAskQuestion {
  const groups = VISA_STATUS_GROUPS.map(function (group) {
    return {
      heading: group.heading,
      choices: group.options.map(visaChoice),
    };
  });
  const extra = VISA_STATUS_UNGROUPED.filter(function (label) {
    return label !== BROWSE_ASK_VISA_NO_ANSWER_LABEL;
  }).map(visaChoice);
  return {
    id: "visa",
    prompt: SEARCH_FILTER_PROMPTS.visa,
    choices: extra,
    groups: groups,
    noAnswerLabel: BROWSE_ASK_VISA_NO_ANSWER_LABEL,
  };
}

function lookingForQuestion(): BrowseAskQuestion {
  return {
    id: "looking_for",
    prompt: SEARCH_FILTER_PROMPTS.looking_for,
    choices: LOOKING_FOR_CHOICES,
  };
}

function seekerQuestion(): BrowseAskQuestion {
  return {
    id: "seeker",
    prompt: SEARCH_FILTER_PROMPTS.seeker,
    choices: LOCATION_CHOICES.map(function (choice) {
      return { id: choice.id, label: choice.label, fold: "" };
    }),
  };
}

function locationQuestion(): BrowseAskQuestion {
  return {
    id: "location",
    prompt: SEARCH_FILTER_PROMPTS.location,
    choices: LOCATION_CHOICES,
  };
}

function cityQuestion(regionId: string): BrowseAskQuestion {
  return {
    id: "city",
    prompt: "Which city should we look in?",
    choices: citiesForRegion(regionId),
  };
}

function religionQuestion(): BrowseAskQuestion {
  return {
    id: "religion",
    prompt: SEARCH_FILTER_PROMPTS.religion,
    choices: RELIGION_CHOICES,
  };
}

function casteQuestion(): BrowseAskQuestion {
  return {
    id: "caste",
    prompt: SEARCH_FILTER_PROMPTS.caste,
    choices: communityChoices(),
  };
}

export const BROWSE_ASK_QUESTIONS: BrowseAskQuestion[] = [
  lookingForQuestion(),
  seekerQuestion(),
  locationQuestion(),
  visaQuestion(),
  religionQuestion(),
  casteQuestion(),
];

export function isBrowseAskNoAnswer(choiceId: string | null | undefined) {
  if (!choiceId) return true;
  const key = choiceId.toLowerCase();
  return (
    key === BROWSE_ASK_NO_ANSWER_ID ||
    key === BROWSE_ASK_NO_ANSWER_ALIAS ||
    key === BROWSE_ASK_NO_ANSWER_LABEL.toLowerCase() ||
    key === BROWSE_ASK_VISA_NO_ANSWER_LABEL.toLowerCase()
  );
}

export function isCasteNoBar(choiceId: string | null | undefined) {
  if (!choiceId) return false;
  const key = choiceId.toLowerCase().replace(/\s+/g, " ").trim();
  return key === BROWSE_ASK_CASTE_NO_BAR_ID || key === BROWSE_ASK_CASTE_NO_BAR_LABEL.toLowerCase();
}

export function browseAskChoices(question: BrowseAskQuestion) {
  const skip: BrowseAskChoice = question.noAnswerLabel
    ? {
        id: BROWSE_ASK_NO_ANSWER_ALIAS,
        label: question.noAnswerLabel,
        fold: "",
      }
    : BROWSE_ASK_NO_ANSWER_CHOICE;
  const grouped = (question.groups || []).flatMap(function (group) {
    return group.choices;
  });
  const seen = new Set(
    question.choices
      .concat(grouped)
      .map(function (choice) {
        return choice.id;
      })
  );
  if (seen.has(skip.id) || seen.has(skip.label)) {
    return question.choices.concat(grouped).filter(function (choice, index, list) {
      return (
        list.findIndex(function (item) {
          return item.id === choice.id;
        }) === index
      );
    });
  }
  return question.choices.concat(skip);
}

export function browseAskProgress(index: number, total: number) {
  return index + 1 + " of " + total;
}

function normalizeHay(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function haystack(raw: string, criteria: SearchCriteria) {
  return normalizeHay(
    [raw, criteria.city || "", criteria.gender || "", criteria.keywords.join(" ")].join(" ")
  );
}

function citySetHas(set: Set<string>, place: string) {
  const needle = place.trim().toLowerCase();
  if (!needle) return false;
  for (const city of set) {
    if (city.toLowerCase() === needle) return true;
  }
  return false;
}

function regionTerms() {
  return REGION_DETECT.flatMap(function (region) {
    return region.terms;
  });
}

export function stripSeekerPhrases(raw: string) {
  let text = typeof raw === "string" ? raw : "";
  regionTerms().forEach(function (term) {
    text = text.replace(new RegExp("\\b" + SEEKER_LEAD + escapeRe(term) + "\\b", "ig"), " ");
  });
  return text.replace(/\s+/g, " ").trim();
}

export function regionIdFromPlace(place: string) {
  const hay = normalizeHay(place);
  if (!hay) return "";
  for (let i = 0; i < REGION_DETECT.length; i += 1) {
    if (hasTerm(hay, REGION_DETECT[i].terms)) return REGION_DETECT[i].id;
  }
  if (citySetHas(US_CITY_SET, hay)) return "us";
  if (citySetHas(INDIA_CITY_SET, hay)) return "india";
  return EXTRA_SEEKER_CITIES[hay] || "";
}

export function lookingForFromPrompt(raw: string, criteria?: SearchCriteria) {
  const parsed = criteria || parseSearchQuery(raw);
  const hay = haystack(raw, parsed);
  if (hasTerm(hay, LOOKING_FOR_BRIDE_TERMS)) return "bride";
  if (hasTerm(hay, LOOKING_FOR_GROOM_TERMS)) return "groom";
  if (parsed.gender === "Female") return "bride";
  if (parsed.gender === "Male") return "groom";
  return "";
}

export function seekerCountryFromPrompt(raw: string) {
  const hay = normalizeHay(raw);
  if (!hay) return "";
  for (let i = 0; i < REGION_DETECT.length; i += 1) {
    const terms = REGION_DETECT[i].terms;
    for (let t = 0; t < terms.length; t += 1) {
      if (new RegExp("\\b" + SEEKER_LEAD + escapeRe(terms[t]) + "\\b", "i").test(hay)) {
        return REGION_DETECT[i].id;
      }
    }
  }
  return "";
}

export function matchCountryFromPrompt(raw: string, criteria?: SearchCriteria) {
  const matchText = stripSeekerPhrases(raw);
  if (!matchText) return "";
  const parsed = criteria || parseSearchQuery(matchText);
  if (parsed.city) {
    const fromCity = regionIdFromPlace(parsed.city);
    if (fromCity) return fromCity;
  }
  const hay = haystack(matchText, parsed);
  for (let i = 0; i < REGION_DETECT.length; i += 1) {
    if (hasTerm(hay, REGION_DETECT[i].terms)) return REGION_DETECT[i].id;
  }
  return "";
}

export function promptHasLookingFor(raw: string, criteria?: SearchCriteria) {
  return !!lookingForFromPrompt(raw, criteria);
}

export function promptHasSeekerCountry(raw: string) {
  return !!seekerCountryFromPrompt(raw);
}

/** Append a tap phrase to the visible search box. Does not invent words. */
export function appendFoldPhrase(prompt: string, phrase: string) {
  const text = typeof prompt === "string" ? prompt.trim() : "";
  const add = typeof phrase === "string" ? phrase.trim() : "";
  if (!add) return text;
  if (hasTerm(normalizeHay(text), [add])) return text;
  return (text ? text + " " + add : add).replace(/\s+/g, " ").trim();
}

function escapeRe(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasTerm(hay: string, terms: string[]) {
  return terms.some(function (term) {
    const needle = term.toLowerCase().trim();
    if (!needle) return false;
    if (needle.indexOf(" ") >= 0) return hay.indexOf(needle) >= 0;
    return new RegExp("(?:^|\\s)" + escapeRe(needle) + "(?:\\s|$)", "i").test(hay);
  });
}

function answerFor(answers: BrowseAskAnswer[] | undefined, questionId: string) {
  if (!answers || !answers.length) return null;
  for (let i = answers.length - 1; i >= 0; i -= 1) {
    if (answers[i].questionId === questionId) return answers[i];
  }
  return null;
}

export function mergeBrowseAskAnswers(base: BrowseAskAnswer[], extra: BrowseAskAnswer[]) {
  const map = new Map<string, BrowseAskAnswer>();
  base.concat(extra).forEach(function (answer) {
    map.set(answer.questionId, answer);
  });
  return Array.from(map.values());
}

export function promptHasLocation(raw: string, _criteria?: SearchCriteria) {
  const matchText = stripSeekerPhrases(raw);
  if (!matchText) return false;
  const parsed = parseSearchQuery(matchText);
  if (parsed.city) return true;
  return hasTerm(haystack(matchText, parsed), LOCATION_REGION_TERMS);
}

/** Search q with seeker country removed so it cannot act as a match filter. */
export function searchQueryFromBox(raw: string) {
  return stripSeekerPhrases(raw).replace(/\s+/g, " ").trim();
}

export function promptHasVisa(raw: string, criteria?: SearchCriteria) {
  const parsed = criteria || parseSearchQuery(raw);
  const hay = haystack(raw, parsed);
  const aliasKeys = Object.keys(VISA_STATUS_ALIASES).filter(function (alias) {
    return alias.replace(/\s+/g, "").length >= 2;
  });
  if (hasTerm(hay, aliasKeys)) return true;
  return parsed.keywords.some(function (kw) {
    return !!resolveVisaAlias(kw) || isVisaStatusOption(kw);
  });
}

export function promptHasReligion(raw: string, criteria?: SearchCriteria) {
  const parsed = criteria || parseSearchQuery(raw);
  return hasTerm(haystack(raw, parsed), RELIGION_TERMS);
}

export function promptHasCaste(raw: string, criteria?: SearchCriteria) {
  if (isCasteNoBar(casteChoiceFromPrompt(raw))) return true;
  const parsed = criteria || parseSearchQuery(raw);
  const hay = haystack(raw, parsed);
  if (hasTerm(hay, COMMUNITY_ALIAS_TERMS)) return true;
  return parsed.keywords.some(function (kw) {
    const lower = kw.toLowerCase();
    return COMMUNITY_ALIAS_TERMS.indexOf(lower) >= 0;
  });
}

export function religionChoiceFromPrompt(raw: string) {
  const hay = normalizeHay(raw);
  if (hasTerm(hay, ["islam", "islamic"])) return "muslim";
  if (hasTerm(hay, ["buddhism"])) return "buddhist";
  for (let i = 0; i < RELIGION_CHOICES.length; i += 1) {
    const choice = RELIGION_CHOICES[i];
    if (hasTerm(hay, [choice.id, choice.label])) return choice.id;
  }
  return "";
}

export function casteChoiceFromPrompt(raw: string) {
  const hay = normalizeHay(raw);
  if (hasTerm(hay, ["caste no bar"]) || hasTerm(hay, ["no caste bar"])) {
    return BROWSE_ASK_CASTE_NO_BAR_ID;
  }
  for (let i = 0; i < COMMUNITY_CHIP_IDS.length; i += 1) {
    const id = COMMUNITY_CHIP_IDS[i];
    if (hasTerm(hay, [id])) return id;
  }
  return "";
}

export function visaChoiceFromPrompt(raw: string) {
  const parsed = parseSearchQuery(raw);
  for (let i = 0; i < parsed.keywords.length; i += 1) {
    const resolved = resolveVisaAlias(parsed.keywords[i]);
    if (resolved) return resolved;
    if (isVisaStatusOption(parsed.keywords[i])) return parsed.keywords[i];
  }
  const hay = normalizeHay(raw);
  const aliases = Object.keys(VISA_STATUS_ALIASES).sort(function (a, b) {
    return b.length - a.length;
  });
  for (let i = 0; i < aliases.length; i += 1) {
    if (hasTerm(hay, [aliases[i]])) return VISA_STATUS_ALIASES[aliases[i]];
  }
  return "";
}

export function foldsIntoSearchBox(questionId: string) {
  return questionId !== "seeker";
}

export function browseAskAlreadyAnswered(
  questionId: string,
  raw: string,
  criteria?: SearchCriteria,
  answers?: BrowseAskAnswer[]
) {
  if (answerFor(answers, questionId)) return true;
  const parsed = criteria || parseSearchQuery(raw);
  if (questionId === "looking_for") return promptHasLookingFor(raw, parsed);
  if (questionId === "seeker") return promptHasSeekerCountry(raw);
  if (questionId === "location") return promptHasLocation(raw, parsed);
  if (questionId === "city") return !!parseSearchQuery(stripSeekerPhrases(raw)).city;
  if (questionId === "visa") return promptHasVisa(raw, parsed);
  if (questionId === "religion") return promptHasReligion(raw, parsed);
  if (questionId === "caste") return promptHasCaste(raw, parsed);
  return false;
}

export function findBrowseAskQuestion(questionId: string) {
  if (questionId === "city") return cityQuestion("us");
  return (
    BROWSE_ASK_QUESTIONS.find(function (question) {
      return question.id === questionId;
    }) || null
  );
}

function findChoice(question: BrowseAskQuestion, choiceId: string) {
  const pool = question.choices.concat(
    (question.groups || []).flatMap(function (group) {
      return group.choices;
    })
  );
  return (
    pool.find(function (choice) {
      return choice.id === choiceId || choice.label === choiceId;
    }) || null
  );
}

export function foldPhraseForAnswer(questionId: string, choiceId: string) {
  if (isBrowseAskNoAnswer(choiceId) || isCasteNoBar(choiceId)) return "";
  if (questionId === "city") {
    const fromUs = citiesForRegion("us").find(function (choice) {
      return choice.id === choiceId || choice.label.toLowerCase() === choiceId.toLowerCase();
    });
    if (fromUs) return fromUs.fold;
    const fromIndia = citiesForRegion("india").find(function (choice) {
      return choice.id === choiceId || choice.label.toLowerCase() === choiceId.toLowerCase();
    });
    return fromIndia ? fromIndia.fold : "";
  }
  const question = findBrowseAskQuestion(questionId);
  if (!question) return "";
  const choice = findChoice(question, choiceId);
  return choice && choice.fold ? choice.fold : "";
}

/** Prompt plus tap answers. Skips and empty folds are omitted. Prompt wins over session. */
export function foldBrowseAnswers(prompt: string, answers: BrowseAskAnswer[]) {
  const bits = [typeof prompt === "string" ? prompt.trim() : ""];
  answers.forEach(function (answer) {
    if (browseAskAlreadyAnswered(answer.questionId, bits[0])) return;
    const phrase = foldPhraseForAnswer(answer.questionId, answer.choiceId);
    if (phrase && bits.indexOf(phrase) === -1) bits.push(phrase);
  });
  return bits.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Still-unknown FILTER questions in lock order.
 * City is inserted only after they tap a region that already has cities
 * in SEARCH_CITIES, and only when the prompt had no city.
 */
export function remainingBrowseQuestions(
  raw: string,
  answers: BrowseAskAnswer[] = [],
  criteria?: SearchCriteria
): BrowseAskQuestion[] {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return [];
  const parsed = criteria || parseSearchQuery(text);
  const needed: BrowseAskQuestion[] = [];

  if (!browseAskAlreadyAnswered("looking_for", text, parsed, answers)) {
    needed.push(lookingForQuestion());
  }
  if (!browseAskAlreadyAnswered("seeker", text, parsed, answers)) {
    needed.push(seekerQuestion());
  }
  if (!browseAskAlreadyAnswered("location", text, parsed, answers)) {
    needed.push(locationQuestion());
  }

  const locationAnswer = answerFor(answers, "location");
  const regionId = locationAnswer && !isBrowseAskNoAnswer(locationAnswer.choiceId)
    ? locationAnswer.choiceId
    : "";
  if (
    regionId &&
    citiesForRegion(regionId).length > 0 &&
    !parsed.city &&
    !browseAskAlreadyAnswered("city", text, parsed, answers)
  ) {
    needed.push(cityQuestion(regionId));
  }

  if (!browseAskAlreadyAnswered("visa", text, parsed, answers)) {
    needed.push(visaQuestion());
  }
  if (!browseAskAlreadyAnswered("religion", text, parsed, answers)) {
    needed.push(religionQuestion());
  }
  if (!browseAskAlreadyAnswered("caste", text, parsed, answers)) {
    needed.push(casteQuestion());
  }
  return needed;
}

/** True only when leftover filters are answered or skipped. Empty prompt is ready. */
export function browseAskReadyForShortlist(raw: string, answers: BrowseAskAnswer[] = []) {
  return remainingBrowseQuestions(raw, answers).length === 0;
}

export function userFacingBrowseAskCopy() {
  const fromQuestions = BROWSE_ASK_QUESTIONS.flatMap(function (question) {
    return [question.prompt].concat(
      question.choices.map(function (choice) {
        return choice.label;
      })
    );
  });
  return [
    BROWSE_ASK_LABEL,
    BROWSE_ASK_HINT,
    BROWSE_ASK_NO_ANSWER_LABEL,
    BROWSE_ASK_VISA_NO_ANSWER_LABEL,
    browseAskProgress(0, 6),
    BROWSE_ASK_CASTE_NO_BAR_LABEL,
  ]
    .concat(fromQuestions)
    .concat(
      LOCATION_CHOICES.map(function (choice) {
        return choice.label;
      })
    );
}

export function browseAskCommunityChipIds() {
  return COMMUNITY_CHIP_IDS.slice();
}

export function browseAskRegionFolds() {
  return LOCATION_CHOICES.map(function (choice) {
    return choice.fold;
  });
}

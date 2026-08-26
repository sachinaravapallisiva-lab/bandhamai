/**
 * Browse leftover FILTER taps after a PROFILE SEARCH prompt. Not Speed Match.
 *
 * After a typed or spoken prompt, enlarge the search box and ask leftover
 * search filters as tap chips, one at a time. These are filters, not
 * dealbreakers. Dealbreakers stay on Speed Match / when they talk.
 * Answers fold into the same q / parseSearchQuery path. Session answers
 * stay until reload. A short prompt is never blocked; it still gets chips.
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

export const BROWSE_ASK_LABEL = "FILTERS";
export const BROWSE_ASK_HINT = "Tap one filter. Bandham AI uses this for the shortlist.";

/** Locked filter order. City is an optional follow-up after a region, not one of the 4. */
export const BROWSE_ASK_FIELD_ORDER = ["location", "visa", "religion", "caste"] as const;

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
  location: "Where should we look?",
  visa: "Which visa status should we look for?",
  religion: "Any faith we should look for?",
  caste: "Any community we should look for?",
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

const CASTE_ANY_CHOICE: BrowseAskChoice = {
  id: "any",
  label: "Any",
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
  }).concat(CASTE_ANY_CHOICE);
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
    key === BROWSE_ASK_VISA_NO_ANSWER_LABEL.toLowerCase() ||
    key === "any"
  );
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

export function promptHasLocation(raw: string, criteria?: SearchCriteria) {
  const parsed = criteria || parseSearchQuery(raw);
  if (parsed.city) return true;
  return hasTerm(haystack(raw, parsed), LOCATION_REGION_TERMS);
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
  const parsed = criteria || parseSearchQuery(raw);
  const hay = haystack(raw, parsed);
  if (hasTerm(hay, COMMUNITY_ALIAS_TERMS)) return true;
  return parsed.keywords.some(function (kw) {
    const lower = kw.toLowerCase();
    return COMMUNITY_ALIAS_TERMS.indexOf(lower) >= 0;
  });
}

export function browseAskAlreadyAnswered(
  questionId: string,
  raw: string,
  criteria?: SearchCriteria,
  answers?: BrowseAskAnswer[]
) {
  if (answerFor(answers, questionId)) return true;
  const parsed = criteria || parseSearchQuery(raw);
  if (questionId === "location") return promptHasLocation(raw, parsed);
  if (questionId === "city") return !!parsed.city;
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
  if (isBrowseAskNoAnswer(choiceId)) return "";
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
    browseAskProgress(0, 4),
    CASTE_ANY_CHOICE.label,
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

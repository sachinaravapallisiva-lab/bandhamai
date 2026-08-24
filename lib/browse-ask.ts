/**
 * Browse ask-after-prompt. Not Speed Match.
 *
 * After a typed or spoken Browse prompt, ask every remaining matrimony
 * dealbreaker that search can actually apply. Tap chips only. Answers fold
 * into the same q string / parseSearchQuery path. No new profile columns.
 */

import { parseSearchQuery, type SearchCriteria } from "./profile-search";

export const BROWSE_ASK_NO_ANSWER_ID = "dont_answer";
export const BROWSE_ASK_NO_ANSWER_ALIAS = "prefer_not";
export const BROWSE_ASK_NO_ANSWER_LABEL = "Don't want to answer";

export const BROWSE_ASK_LABEL = "STILL NEEDED";
export const BROWSE_ASK_HINT =
  "Tap what still matters. Bandham AI uses this for the shortlist.";

export type BrowseAskChoice = {
  id: string;
  label: string;
  /** Text appended to the Browse prompt. Empty means omit that filter. */
  fold: string;
};

export type BrowseAskQuestion = {
  id: string;
  prompt: string;
  choices: BrowseAskChoice[];
};

export type BrowseAskAnswer = {
  questionId: string;
  choiceId: string;
};

const LANGUAGE_TERMS = [
  "telugu",
  "tamil",
  "hindi",
  "malayalam",
  "kannada",
  "marathi",
  "gujarati",
  "punjabi",
  "bengali",
  "bangla",
  "urdu",
  "odia",
  "oriya",
  "tulu",
  "konkani",
];

const CITY_CHOICES: BrowseAskChoice[] = [
  { id: "hyderabad", label: "Hyderabad", fold: "Hyderabad" },
  { id: "bengaluru", label: "Bengaluru", fold: "Bengaluru" },
  { id: "chennai", label: "Chennai", fold: "Chennai" },
  { id: "mumbai", label: "Mumbai", fold: "Mumbai" },
  { id: "delhi", label: "Delhi", fold: "Delhi" },
  { id: "dallas", label: "Dallas", fold: "Dallas" },
  { id: "houston", label: "Houston", fold: "Houston" },
  { id: "new_jersey", label: "New Jersey", fold: "New Jersey" },
  { id: "bay_area", label: "Bay Area", fold: "Bay Area" },
  { id: "new_york", label: "New York", fold: "New York" },
];

const TONGUE_CHOICES: BrowseAskChoice[] = [
  { id: "telugu", label: "Telugu", fold: "Telugu" },
  { id: "tamil", label: "Tamil", fold: "Tamil" },
  { id: "hindi", label: "Hindi", fold: "Hindi" },
  { id: "malayalam", label: "Malayalam", fold: "Malayalam" },
  { id: "kannada", label: "Kannada", fold: "Kannada" },
  { id: "marathi", label: "Marathi", fold: "Marathi" },
  { id: "gujarati", label: "Gujarati", fold: "Gujarati" },
  { id: "punjabi", label: "Punjabi", fold: "Punjabi" },
  { id: "bengali", label: "Bengali", fold: "Bengali" },
];

/**
 * Needed Browse dealbreakers only. Search applies these via city, gender,
 * diet, visa, mother_tongue, or existing about/wants keywords.
 * No religion, caste, gotra, height, or income questions.
 */
export const BROWSE_ASK_QUESTIONS: BrowseAskQuestion[] = [
  {
    id: "diet",
    prompt: "Vegetarian or non veg at home after marriage?",
    choices: [
      { id: "vegetarian", label: "Vegetarian only", fold: "vegetarian" },
      { id: "eggetarian", label: "Eggetarian ok", fold: "eggetarian" },
      { id: "nonveg", label: "Non veg ok", fold: "non veg" },
      { id: "decide", label: "Flexible", fold: "" },
    ],
  },
  {
    id: "location",
    prompt: "Live in India or abroad after marriage?",
    choices: [
      { id: "india", label: "India", fold: "" },
      { id: "abroad", label: "US or abroad", fold: "nri" },
      { id: "either", label: "Either", fold: "" },
      { id: "undecided", label: "Not sure yet", fold: "" },
    ],
  },
  {
    id: "city",
    prompt: "Which city or region should we search?",
    choices: CITY_CHOICES,
  },
  {
    id: "gender",
    prompt: "Looking for a woman or a man?",
    choices: [
      { id: "woman", label: "A woman", fold: "woman" },
      { id: "man", label: "A man", fold: "man" },
    ],
  },
  {
    id: "mother_tongue",
    prompt: "Any mother tongue we should look for?",
    choices: TONGUE_CHOICES,
  },
  {
    id: "parents",
    prompt: "Should parents be involved in this match?",
    choices: [
      { id: "from_start", label: "From the start", fold: "parents" },
      { id: "after_talk", label: "After we talk", fold: "" },
      { id: "inform", label: "We decide, then inform", fold: "" },
      { id: "talking", label: "Still deciding", fold: "" },
    ],
  },
  {
    id: "timeline",
    prompt: "How soon do you want to marry?",
    choices: [
      { id: "year", label: "Within a year", fold: "" },
      { id: "two_years", label: "1 to 2 years", fold: "" },
      { id: "families", label: "When families are ready", fold: "" },
      { id: "none", label: "No timeline yet", fold: "" },
    ],
  },
  {
    id: "family_living",
    prompt: "Joint family or nuclear after marriage?",
    choices: [
      { id: "joint", label: "Joint with parents", fold: "joint family" },
      { id: "nearby", label: "Nuclear, parents nearby", fold: "nuclear family" },
      { id: "nuclear", label: "Nuclear, distance ok", fold: "nuclear family" },
      { id: "open", label: "Depends", fold: "" },
    ],
  },
  {
    id: "children",
    prompt: "Do you want children?",
    choices: [
      { id: "want", label: "Yes", fold: "children" },
      { id: "dont", label: "No", fold: "" },
      { id: "open", label: "Open", fold: "" },
      { id: "undecided", label: "Still deciding", fold: "" },
    ],
  },
];

export const BROWSE_ASK_NO_ANSWER_CHOICE: BrowseAskChoice = {
  id: BROWSE_ASK_NO_ANSWER_ID,
  label: BROWSE_ASK_NO_ANSWER_LABEL,
  fold: "",
};

export function isBrowseAskNoAnswer(choiceId: string | null | undefined) {
  return (
    !choiceId ||
    choiceId === BROWSE_ASK_NO_ANSWER_ID ||
    choiceId === BROWSE_ASK_NO_ANSWER_ALIAS
  );
}

export function browseAskChoices(question: BrowseAskQuestion) {
  if (question.choices.some(function (c) { return c.id === BROWSE_ASK_NO_ANSWER_ID; })) {
    return question.choices;
  }
  return question.choices.concat(BROWSE_ASK_NO_ANSWER_CHOICE);
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

function hasTerm(hay: string, terms: string[]) {
  return terms.some(function (term) {
    const needle = term.toLowerCase().trim();
    if (!needle) return false;
    if (needle.indexOf(" ") >= 0) return hay.indexOf(needle) >= 0;
    return new RegExp("(?:^|\\s)" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:\\s|$)", "i").test(hay);
  });
}

export function browseAskAlreadyAnswered(
  questionId: string,
  raw: string,
  criteria?: SearchCriteria
) {
  const parsed = criteria || parseSearchQuery(raw);
  const hay = haystack(raw, parsed);

  if (questionId === "diet") {
    return hasTerm(hay, ["vegetarian", "eggetarian", "non veg", "non-veg", "nonveg", "vegan", "veggie"]) ||
      parsed.keywords.some(function (kw) {
        return /vegetarian|eggetarian|non-veg|vegan/.test(kw.toLowerCase());
      });
  }
  if (questionId === "location") {
    return hasTerm(hay, [
      "nri",
      "abroad",
      "india",
      "h1b",
      "h-1b",
      "green card",
      "us citizen",
      "indian citizen",
      "f1",
      "f-1",
      "ilr",
      "oci",
    ]) || parsed.keywords.some(function (kw) {
      return /nri|h-1b|green card|citizen|f-1|ilr|oci/i.test(kw);
    });
  }
  if (questionId === "city") return !!parsed.city;
  if (questionId === "gender") return !!parsed.gender;
  if (questionId === "mother_tongue") {
    return LANGUAGE_TERMS.some(function (lang) {
      return parsed.keywords.some(function (kw) {
        return kw.toLowerCase() === lang || kw.toLowerCase() === "bengali";
      }) || hasTerm(hay, [lang]);
    });
  }
  if (questionId === "parents") {
    return hasTerm(hay, ["parents involved", "involve parents", "from the start", "family involved"]);
  }
  if (questionId === "timeline") {
    return hasTerm(hay, [
      "within a year",
      "1 to 2 years",
      "marry soon",
      "no timeline",
      "when families",
      "timeline",
    ]);
  }
  if (questionId === "family_living") {
    return hasTerm(hay, ["joint family", "nuclear family", "joint", "nuclear"]) ||
      parsed.keywords.some(function (kw) {
        return /joint family|nuclear family/.test(kw.toLowerCase());
      });
  }
  if (questionId === "children") {
    return hasTerm(hay, ["children", "kids", "want kids", "no kids"]);
  }
  return false;
}

/** Empty prompt never asks. No 2 to 4 cap: every still-unknown needed question is returned. */
export function remainingBrowseQuestions(raw: string, criteria?: SearchCriteria): BrowseAskQuestion[] {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return [];
  const parsed = criteria || parseSearchQuery(text);
  return BROWSE_ASK_QUESTIONS.filter(function (question) {
    return !browseAskAlreadyAnswered(question.id, text, parsed);
  });
}

export function findBrowseAskQuestion(questionId: string) {
  return BROWSE_ASK_QUESTIONS.find(function (q) {
    return q.id === questionId;
  }) || null;
}

export function foldPhraseForAnswer(questionId: string, choiceId: string) {
  if (isBrowseAskNoAnswer(choiceId)) return "";
  const question = findBrowseAskQuestion(questionId);
  if (!question) return "";
  const choice = question.choices.find(function (c) {
    return c.id === choiceId;
  });
  return choice && choice.fold ? choice.fold : "";
}

/** Prompt plus tap answers. Don't want to answer and empty folds are omitted. */
export function foldBrowseAnswers(prompt: string, answers: BrowseAskAnswer[]) {
  const bits = [typeof prompt === "string" ? prompt.trim() : ""];
  answers.forEach(function (answer) {
    const phrase = foldPhraseForAnswer(answer.questionId, answer.choiceId);
    if (phrase && bits.indexOf(phrase) === -1) bits.push(phrase);
  });
  return bits.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function userFacingBrowseAskCopy() {
  const fromQuestions = BROWSE_ASK_QUESTIONS.flatMap(function (q) {
    return [q.prompt].concat(q.choices.map(function (c) { return c.label; }));
  });
  return [
    BROWSE_ASK_LABEL,
    BROWSE_ASK_HINT,
    BROWSE_ASK_NO_ANSWER_LABEL,
    browseAskProgress(0, 3),
  ].concat(fromQuestions);
}

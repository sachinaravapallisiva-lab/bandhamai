import { parseSearchQuery, type SearchCriteria } from "./profile-search";
import { resolveVisaAlias } from "./visa-status";

/**
 * Browse ask: 2 to 4 tap dealbreakers AFTER a prompt, BEFORE the shortlist.
 * Not Speed Match. Answers fold into the existing search query string.
 */

export const BROWSE_ASK_MIN = 2;
export const BROWSE_ASK_MAX = 4;
export const BROWSE_ASK_NO_ANSWER_ID = "dont_answer";
export const BROWSE_ASK_NO_ANSWER_LABEL = "Don't want to answer";
export const BROWSE_ASK_PRODUCT = "Bandham AI";

export const BROWSE_ASK_EYEBROW = "A FEW FILTERS";
export const BROWSE_ASK_TITLE = "A few dealbreakers first";
export const BROWSE_ASK_HINT =
  "Tap one answer. Bandham AI uses this with your search, then shows three profiles.";
export const BROWSE_ASK_STATUS = "A few taps first";

export type BrowseAskChoice = {
  id: string;
  label: string;
  /** Words appended to the Browse prompt. Empty means no extra filter. */
  filter: string;
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

export const BROWSE_ASK_NO_ANSWER_CHOICE: BrowseAskChoice = {
  id: BROWSE_ASK_NO_ANSWER_ID,
  label: BROWSE_ASK_NO_ANSWER_LABEL,
  filter: "",
};

/**
 * Indian / desi matrimony dealbreakers only. Filters must already exist
 * on Browse search (city, gender, diet, visa, mother tongue, education,
 * profession, leftover keywords). No religion, caste, gotra, height, or income.
 */
export const BROWSE_ASK_BANK: BrowseAskQuestion[] = [
  {
    id: "diet",
    prompt: "Vegetarian or non veg at home after marriage?",
    choices: [
      { id: "vegetarian", label: "Vegetarian only", filter: "vegetarian" },
      { id: "eggetarian", label: "Eggetarian ok", filter: "eggetarian" },
      { id: "nonveg", label: "Non veg ok", filter: "non veg" },
    ],
  },
  {
    id: "location",
    prompt: "Live in India or abroad after marriage?",
    choices: [
      { id: "india", label: "India", filter: "" },
      { id: "abroad", label: "US or abroad", filter: "nri" },
      { id: "either", label: "Either", filter: "" },
    ],
  },
  {
    id: "family_living",
    prompt: "Joint family or nuclear after marriage?",
    choices: [
      { id: "joint", label: "Joint with parents", filter: "joint family" },
      { id: "nearby", label: "Nuclear, parents nearby", filter: "nuclear family" },
      { id: "nuclear", label: "Nuclear, distance ok", filter: "nuclear family" },
    ],
  },
  {
    id: "children",
    prompt: "Do you want children?",
    choices: [
      { id: "want", label: "Yes", filter: "children" },
      { id: "dont", label: "No", filter: "" },
      { id: "open", label: "Open", filter: "" },
    ],
  },
  {
    id: "parents",
    prompt: "Should parents be involved in this match?",
    choices: [
      { id: "from_start", label: "From the start", filter: "parents" },
      { id: "after_talk", label: "After we talk", filter: "parents" },
      { id: "inform", label: "We decide, then inform", filter: "parents" },
    ],
  },
  {
    id: "timeline",
    prompt: "How soon do you want to marry?",
    choices: [
      { id: "year", label: "Within a year", filter: "" },
      { id: "two_years", label: "1 to 2 years", filter: "" },
      { id: "families", label: "When families are ready", filter: "" },
    ],
  },
];

function normalizeHay(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordLooksVisa(keyword: string) {
  const key = keyword.toLowerCase().trim();
  if (!key) return false;
  if (key === "nri" || key === "h4" || key === "ead" || key === "oci" || key === "pio") return true;
  if (resolveVisaAlias(key)) return true;
  return /citizen|visa|green card|h-1b|f-1|ilr|settled|skilled worker/.test(key);
}

function isTopicCovered(topicId: string, raw: string, criteria: SearchCriteria) {
  const hay = normalizeHay(raw);
  const keywords = criteria.keywords.map(function (word) {
    return word.toLowerCase();
  });

  if (topicId === "diet") {
    if (keywords.some(function (word) {
      return word === "vegetarian" || word === "eggetarian" || word === "non-veg" || word === "vegan";
    })) {
      return true;
    }
    return /\b(vegetarian|veggie|veg|eggetarian|eggeterian|vegan|non\s*veg|nonveg|non-veg)\b/i.test(hay);
  }

  if (topicId === "location") {
    if (criteria.city) return true;
    if (keywords.some(keywordLooksVisa)) return true;
    return /\b(nri|abroad|india|usa|united states|\bus\b|h1b|h-1b|green card|oci|pio|f1|f-1|ilr)\b/i.test(hay);
  }

  if (topicId === "family_living") {
    if (keywords.some(function (word) {
      return word === "joint family" || word === "nuclear family";
    })) {
      return true;
    }
    return /\b(joint family|nuclear family|joint-family|joint|nuclear)\b/i.test(hay);
  }

  if (topicId === "children") {
    return /\b(children|child|kids|kid)\b/i.test(hay);
  }

  if (topicId === "parents") {
    return /\bparents?\b/i.test(hay);
  }

  if (topicId === "timeline") {
    return /\b(timeline|within a year|marry soon|getting married|1 to 2 years)\b/i.test(hay);
  }

  return false;
}

export function isBrowseAskSkip(choiceId: string | null | undefined) {
  return !choiceId || choiceId === BROWSE_ASK_NO_ANSWER_ID;
}

export function choicesForBrowseAsk(question: BrowseAskQuestion) {
  if (question.choices.some(function (choice) {
    return choice.id === BROWSE_ASK_NO_ANSWER_ID;
  })) {
    return question.choices;
  }
  return question.choices.concat(BROWSE_ASK_NO_ANSWER_CHOICE);
}

export function browseAskProgress(index: number, total: number) {
  return index + 1 + " of " + total;
}

/** Remaining dealbreakers the prompt did not already answer. At most 4. */
export function questionsForBrowsePrompt(raw: string, criteria?: SearchCriteria): BrowseAskQuestion[] {
  const text = raw.trim();
  if (!text) return [];

  const parsed = criteria || parseSearchQuery(text);
  return BROWSE_ASK_BANK.filter(function (question) {
    return !isTopicCovered(question.id, text, parsed);
  }).slice(0, BROWSE_ASK_MAX);
}

export function filterPhraseForAnswer(questionId: string, choiceId: string) {
  if (isBrowseAskSkip(choiceId)) return "";
  const question = BROWSE_ASK_BANK.find(function (item) {
    return item.id === questionId;
  });
  const choice = question?.choices.find(function (item) {
    return item.id === choiceId;
  });
  return (choice?.filter || "").trim();
}

/** Original prompt plus answer filters. Skip / empty filters are omitted. */
export function foldBrowseAskQuery(prompt: string, answers: BrowseAskAnswer[]) {
  const extras: string[] = [];
  answers.forEach(function (answer) {
    const phrase = filterPhraseForAnswer(answer.questionId, answer.choiceId);
    if (!phrase) return;
    if (extras.indexOf(phrase) === -1) extras.push(phrase);
  });
  return [prompt.trim(), extras.join(" ")].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function browseAskUserFacingCopy() {
  const copy: string[] = [
    BROWSE_ASK_PRODUCT,
    BROWSE_ASK_EYEBROW,
    BROWSE_ASK_TITLE,
    BROWSE_ASK_HINT,
    BROWSE_ASK_STATUS,
    BROWSE_ASK_NO_ANSWER_LABEL,
  ];
  BROWSE_ASK_BANK.forEach(function (question) {
    copy.push(question.prompt);
    question.choices.forEach(function (choice) {
      copy.push(choice.label);
    });
  });
  copy.push(BROWSE_ASK_NO_ANSWER_CHOICE.label);
  return copy;
}

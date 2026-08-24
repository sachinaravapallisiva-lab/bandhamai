import { parseSearchQuery, type SearchCriteria } from "./profile-search";
import {
  SPEED_MATCH_NO_ANSWER_CHOICE,
  SPEED_MATCH_NO_ANSWER_ID,
  SPEED_MATCH_NO_ANSWER_LABEL,
  isNoAnswerChoiceId,
} from "./speed-match";
import { resolveVisaAlias } from "./visa-status";

/**
 * Browse ask: a short tap widget after a typed or spoken prompt,
 * before the three card shortlist. Not Speed Match. Speed Match stays on Matches.
 */

export const BROWSE_ASK_PRODUCT = "Bandham AI";
export const BROWSE_ASK_KICKER = "A FEW QUESTIONS";
export const BROWSE_ASK_LIST_LABEL = "A FEW QUESTIONS FIRST";
export const BROWSE_ASK_TITLE = "Bandham AI will shortlist three after this.";
export const BROWSE_ASK_HINT = "Tap one option. Don't want to answer skips that filter.";
export const BROWSE_ASK_MIN = 2;
export const BROWSE_ASK_MAX = 4;
export const BROWSE_ASK_TAP_MIN = 44;

export const BROWSE_ASK_NO_ANSWER_ID = SPEED_MATCH_NO_ANSWER_ID;
export const BROWSE_ASK_NO_ANSWER_LABEL = SPEED_MATCH_NO_ANSWER_LABEL;
export const BROWSE_ASK_NO_ANSWER_CHOICE = SPEED_MATCH_NO_ANSWER_CHOICE;

export type BrowseAskTopic = "diet" | "location" | "family_living" | "children";

export type BrowseAskChoice = {
  id: string;
  label: string;
  /** Text folded into the existing Browse query. Null means skip that filter. */
  filterText: string | null;
};

export type BrowseAskQuestion = {
  id: BrowseAskTopic;
  prompt: string;
  choices: BrowseAskChoice[];
};

export type BrowseAskAnswer = {
  questionId: BrowseAskTopic;
  choiceId: string;
};

const DIET_KEYWORDS = ["vegetarian", "eggetarian", "non-veg", "vegan"];
const FAMILY_KEYWORDS = ["joint family", "nuclear family"];

export const BROWSE_ASK_BANK: BrowseAskQuestion[] = [
  {
    id: "diet",
    prompt: "Vegetarian or non veg at home after marriage?",
    choices: [
      { id: "vegetarian", label: "Vegetarian only", filterText: "vegetarian" },
      { id: "eggetarian", label: "Eggetarian ok", filterText: "eggetarian" },
      { id: "nonveg", label: "Non veg ok", filterText: "non veg" },
    ],
  },
  {
    id: "location",
    prompt: "Live in India or abroad after marriage?",
    choices: [
      // Country is not a stored column. India adds no token so we do not invent one.
      { id: "india", label: "India", filterText: null },
      { id: "abroad", label: "Abroad or NRI", filterText: "nri" },
      { id: "h1b", label: "H1B", filterText: "h1b" },
    ],
  },
  {
    id: "family_living",
    prompt: "Joint family or nuclear after marriage?",
    choices: [
      { id: "joint", label: "Joint with parents", filterText: "joint family" },
      { id: "nuclear", label: "Nuclear family", filterText: "nuclear family" },
    ],
  },
  {
    id: "children",
    prompt: "Do you want children?",
    choices: [
      { id: "want", label: "Yes", filterText: "children" },
      { id: "dont", label: "No", filterText: null },
      { id: "open", label: "Open", filterText: null },
    ],
  },
];

function normalizeHay(raw: string) {
  return raw.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function keywordHas(criteria: SearchCriteria, wanted: string[]) {
  return criteria.keywords.some(function (word) {
    return wanted.indexOf(word.toLowerCase()) !== -1;
  });
}

function looksLikeVisaKeyword(word: string) {
  const key = word.toLowerCase().trim();
  if (!key) return false;
  if (key === "nri" || key === "citizen" || key === "oci" || key === "pio" || key === "h4" || key === "ead") {
    return true;
  }
  return !!resolveVisaAlias(key) || !!resolveVisaAlias(word.trim());
}

export function answeredBrowseAskTopics(raw: string, criteria?: SearchCriteria): Set<BrowseAskTopic> {
  const parsed = criteria || parseSearchQuery(raw);
  const hay = normalizeHay(raw);
  const answered = new Set<BrowseAskTopic>();

  if (
    keywordHas(parsed, DIET_KEYWORDS) ||
    /\b(vegetarian|veggie|eggetarian|eggeterian|vegan|pure veg|non veg|nonveg|non vegetarian)\b/.test(hay) ||
    /(^|\s)veg(\s|$)/.test(hay)
  ) {
    answered.add("diet");
  }

  if (
    parsed.city ||
    parsed.keywords.some(looksLikeVisaKeyword) ||
    /\b(nri|india|abroad|visa|h1b|green card|citizen|oci|usa|united states)\b/.test(hay)
  ) {
    answered.add("location");
  }

  if (keywordHas(parsed, FAMILY_KEYWORDS) || /\b(joint family|nuclear family|joint|nuclear)\b/.test(hay)) {
    answered.add("family_living");
  }

  if (/\b(child|children|kid|kids)\b/.test(hay) || keywordHas(parsed, ["children", "child", "kids", "kid"])) {
    answered.add("children");
  }

  return answered;
}

export function questionsForBrowsePrompt(raw: string, criteria?: SearchCriteria): BrowseAskQuestion[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const answered = answeredBrowseAskTopics(trimmed, criteria);
  return BROWSE_ASK_BANK.filter(function (question) {
    return !answered.has(question.id);
  }).slice(0, BROWSE_ASK_MAX);
}

export function shouldAskAfterPrompt(raw: string, criteria?: SearchCriteria) {
  return questionsForBrowsePrompt(raw, criteria).length > 0;
}

export function choicesForBrowseAsk(question: BrowseAskQuestion) {
  if (question.choices.some(function (choice) { return isNoAnswerChoiceId(choice.id); })) {
    return question.choices;
  }
  return question.choices.concat({
    id: BROWSE_ASK_NO_ANSWER_ID,
    label: BROWSE_ASK_NO_ANSWER_LABEL,
    filterText: null,
  });
}

export function progressLabel(index: number, total: number) {
  return index + 1 + " of " + total;
}

export function filterTextForAnswer(questionId: BrowseAskTopic, choiceId: string): string | null {
  if (isNoAnswerChoiceId(choiceId)) return null;
  const question = BROWSE_ASK_BANK.find(function (item) {
    return item.id === questionId;
  });
  const choice = question?.choices.find(function (item) {
    return item.id === choiceId;
  });
  return choice?.filterText || null;
}

/** Original prompt plus filter tokens. Don't want to answer adds nothing. */
export function foldBrowseAskIntoQuery(prompt: string, answers: BrowseAskAnswer[]): string {
  const bits = [prompt.trim()];
  answers.forEach(function (answer) {
    const token = filterTextForAnswer(answer.questionId, answer.choiceId);
    if (token) bits.push(token);
  });
  return bits.join(" ").replace(/\s+/g, " ").trim();
}

export function userFacingBrowseAskCopy(): string[] {
  const copy = [BROWSE_ASK_PRODUCT, BROWSE_ASK_KICKER, BROWSE_ASK_LIST_LABEL, BROWSE_ASK_TITLE, BROWSE_ASK_HINT, BROWSE_ASK_NO_ANSWER_LABEL];
  BROWSE_ASK_BANK.forEach(function (question) {
    copy.push(question.prompt);
    question.choices.forEach(function (choice) {
      copy.push(choice.label);
    });
  });
  return copy;
}

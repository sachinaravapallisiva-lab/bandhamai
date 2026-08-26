/**
 * Two banks, not one.
 * Browse leftover taps are SEARCH FILTERS (location, visa, religion, caste, mother tongue).
 * Speed Match is HOUSEHOLD DEALBREAKERS. Diet is not a main question.
 * City is a Browse-only follow-up after a region, not a filter in the 5.
 */

import { VISA_STATUS_OPTIONS } from "./visa-status";

export const SEARCH_FILTER_FIELD_ORDER = [
  "location",
  "visa",
  "religion",
  "caste",
  "mother_tongue",
] as const;

export type SearchFilterField = (typeof SEARCH_FILTER_FIELD_ORDER)[number];

export const DEALBREAKER_FIELD_ORDER = [
  "family_living",
  "parents",
  "work",
  "timeline",
  "children",
  "live_after",
  "community",
  "dowry",
  "faith",
  "habits",
] as const;

export type DealbreakerField = (typeof DEALBREAKER_FIELD_ORDER)[number];

export type DealbreakerChoice = {
  id: string;
  label: string;
  fold: string;
};

export const DEALBREAKER_LOCATION_CHOICES: DealbreakerChoice[] = [
  { id: "us", label: "United States", fold: "" },
  { id: "australia", label: "Australia", fold: "" },
  { id: "uk", label: "United Kingdom", fold: "" },
  { id: "europe", label: "Europe", fold: "" },
  { id: "ireland", label: "Ireland", fold: "" },
  { id: "india", label: "India", fold: "" },
];

export const DEALBREAKER_RELIGION_CHOICES: DealbreakerChoice[] = [
  { id: "hindu", label: "Hindu", fold: "Hindu" },
  { id: "muslim", label: "Muslim", fold: "Muslim" },
  { id: "christian", label: "Christian", fold: "Christian" },
  { id: "sikh", label: "Sikh", fold: "Sikh" },
  { id: "jain", label: "Jain", fold: "Jain" },
  { id: "buddhist", label: "Buddhist", fold: "Buddhist" },
  { id: "other", label: "Other", fold: "Other" },
];

export const DEALBREAKER_COMMUNITY_CHIP_IDS = [
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

export const DEALBREAKER_COMMUNITY_ALIAS_TERMS = [
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

export const DEALBREAKER_LANGUAGE_CHOICES: DealbreakerChoice[] = [
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

export const DEALBREAKER_LANGUAGE_TERMS = DEALBREAKER_LANGUAGE_CHOICES.map(function (choice) {
  return choice.id;
}).concat(["bangla", "urdu", "odia", "oriya", "tulu", "konkani"]);

export const DEALBREAKER_RELIGION_TERMS = [
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

export const DEALBREAKER_ANY_CHOICE: DealbreakerChoice = {
  id: "any",
  label: "Any",
  fold: "",
};

export const SEARCH_FILTER_PROMPTS: Record<SearchFilterField, string> = {
  location: "Where should we look?",
  visa: "Which visa status should we look for?",
  religion: "Any faith we should look for?",
  caste: "Any community we should look for?",
  mother_tongue: "Any mother tongue we should look for?",
};

export const DEALBREAKER_FAMILY_LIVING_CHOICES: DealbreakerChoice[] = [
  { id: "joint", label: "Joint with parents", fold: "joint family" },
  { id: "nearby", label: "Nuclear, parents nearby", fold: "nuclear family" },
  { id: "nuclear", label: "Nuclear, distance ok", fold: "nuclear family" },
  { id: "open", label: "Depends", fold: "" },
];

export const DEALBREAKER_PARENTS_CHOICES: DealbreakerChoice[] = [
  { id: "from_start", label: "From the start", fold: "parents" },
  { id: "after_talk", label: "After we talk", fold: "" },
  { id: "inform", label: "We decide, then inform", fold: "" },
  { id: "talking", label: "Still deciding", fold: "" },
];

export const DEALBREAKER_WORK_CHOICES: DealbreakerChoice[] = [
  { id: "working", label: "Yes, keep working", fold: "" },
  { id: "either", label: "Either path", fold: "" },
  { id: "home", label: "Prefer home focus", fold: "" },
  { id: "later", label: "Decide later", fold: "" },
];

export const DEALBREAKER_TIMELINE_CHOICES: DealbreakerChoice[] = [
  { id: "year", label: "Within a year", fold: "" },
  { id: "two_years", label: "1 to 2 years", fold: "" },
  { id: "families", label: "When families are ready", fold: "" },
  { id: "none", label: "No timeline yet", fold: "" },
];

export const DEALBREAKER_CHILDREN_CHOICES: DealbreakerChoice[] = [
  { id: "want", label: "Yes", fold: "children" },
  { id: "dont", label: "No", fold: "" },
  { id: "open", label: "Open", fold: "" },
  { id: "undecided", label: "Still deciding", fold: "" },
];

/** After-marriage settlement talk. Not the Browse location filter. */
export const DEALBREAKER_LIVE_AFTER_CHOICES: DealbreakerChoice[] = [
  { id: "india", label: "India", fold: "" },
  { id: "abroad", label: "US / abroad", fold: "" },
  { id: "either", label: "Either", fold: "" },
  { id: "undecided", label: "Not sure yet", fold: "" },
];

/** Same-community preference talk. Not the Browse caste chips. */
export const DEALBREAKER_COMMUNITY_PREF_CHOICES: DealbreakerChoice[] = [
  { id: "same", label: "Prefer same community", fold: "" },
  { id: "values", label: "Open if values match", fold: "" },
  { id: "none", label: "No preference", fold: "" },
  { id: "family", label: "Deciding with family", fold: "" },
];

export const DEALBREAKER_DOWRY_CHOICES: DealbreakerChoice[] = [
  { id: "refuse", label: "Never ask or accept", fold: "" },
  { id: "walk_away", label: "Walk away if it comes up", fold: "" },
  { id: "both_clear", label: "Both families must refuse", fold: "" },
];

/** Practice at home. Not the Browse religion filter. */
export const DEALBREAKER_FAITH_CHOICES: DealbreakerChoice[] = [
  { id: "regular", label: "Regular practice", fold: "" },
  { id: "festivals", label: "Festivals / family rituals", fold: "" },
  { id: "private", label: "Private", fold: "" },
  { id: "not_central", label: "Not central", fold: "" },
];

/** Parked in supabase/speed_match.sql as alcohol / smoking comfort. */
export const DEALBREAKER_HABITS_CHOICES: DealbreakerChoice[] = [
  { id: "neither", label: "Neither at home", fold: "" },
  { id: "drink_ok", label: "Drinks ok, no smoking", fold: "" },
  { id: "occasional", label: "Occasional is fine", fold: "" },
  { id: "talk", label: "We'll talk it through", fold: "" },
];

export const DEALBREAKER_PROMPTS: Record<DealbreakerField, string> = {
  family_living: "Joint family or live with parents after marriage?",
  parents: "Should parents be involved in this match?",
  work: "Can your spouse keep working after marriage?",
  timeline: "How soon do you want to marry?",
  children: "Do you want children?",
  live_after: "Live in India or abroad after marriage?",
  community: "Same community preference?",
  dowry: "Asking or offering dowry?",
  faith: "Temple, church, or mosque practice?",
  habits: "Alcohol or smoking at home?",
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

export function dealbreakerCommunityChoices() {
  return DEALBREAKER_COMMUNITY_CHIP_IDS.map(function (id) {
    return { id: id, label: titleLabel(id), fold: titleLabel(id) };
  }).concat(DEALBREAKER_ANY_CHOICE);
}

export type SharedDealbreakerQuestion = {
  id: DealbreakerField;
  prompt: string;
  choices: DealbreakerChoice[];
};

/** Speed Match bank: household talk items already in the product. Not Browse filters. */
export function speedMatchDealbreakerQuestions(): SharedDealbreakerQuestion[] {
  return [
    { id: "family_living", prompt: DEALBREAKER_PROMPTS.family_living, choices: DEALBREAKER_FAMILY_LIVING_CHOICES },
    { id: "parents", prompt: DEALBREAKER_PROMPTS.parents, choices: DEALBREAKER_PARENTS_CHOICES },
    { id: "work", prompt: DEALBREAKER_PROMPTS.work, choices: DEALBREAKER_WORK_CHOICES },
    { id: "timeline", prompt: DEALBREAKER_PROMPTS.timeline, choices: DEALBREAKER_TIMELINE_CHOICES },
    { id: "children", prompt: DEALBREAKER_PROMPTS.children, choices: DEALBREAKER_CHILDREN_CHOICES },
    { id: "live_after", prompt: DEALBREAKER_PROMPTS.live_after, choices: DEALBREAKER_LIVE_AFTER_CHOICES },
    { id: "community", prompt: DEALBREAKER_PROMPTS.community, choices: DEALBREAKER_COMMUNITY_PREF_CHOICES },
    { id: "dowry", prompt: DEALBREAKER_PROMPTS.dowry, choices: DEALBREAKER_DOWRY_CHOICES },
    { id: "faith", prompt: DEALBREAKER_PROMPTS.faith, choices: DEALBREAKER_FAITH_CHOICES },
    { id: "habits", prompt: DEALBREAKER_PROMPTS.habits, choices: DEALBREAKER_HABITS_CHOICES },
  ];
}

export function assertVisaLabelsAreKnown(choices: DealbreakerChoice[]) {
  return choices.every(function (choice) {
    return VISA_STATUS_OPTIONS.some(function (label) {
      return label === choice.label;
    });
  });
}

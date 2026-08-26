/**
 * Sai's locked Indian household / NRI dealbreakers.
 * Same 10 for Browse leftover taps and Speed Match. Diet is not a main question.
 * City is a Browse-only follow-up after a region, not one of the 10.
 */

import { VISA_STATUS_OPTIONS } from "./visa-status";

export const DEALBREAKER_FIELD_ORDER = [
  "location",
  "visa",
  "religion",
  "caste",
  "family_living",
  "parents",
  "work",
  "timeline",
  "children",
  "mother_tongue",
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

/** Compact existing visa labels for the 15s Speed Match round. Browse keeps the full grouped list. */
export const DEALBREAKER_SPEED_VISA_CHOICES: DealbreakerChoice[] = [
  { id: "US Citizen", label: "US Citizen", fold: "US Citizen" },
  { id: "Green Card (LPR)", label: "Green Card (LPR)", fold: "Green Card (LPR)" },
  { id: "H-1B", label: "H-1B", fold: "H-1B" },
  { id: "Indian citizen (living abroad)", label: "Indian citizen (living abroad)", fold: "Indian citizen (living abroad)" },
];

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

export const DEALBREAKER_PROMPTS: Record<DealbreakerField, string> = {
  location: "Where should we look?",
  visa: "Which visa status should we look for?",
  religion: "Any faith we should look for?",
  caste: "Any community we should look for?",
  family_living: "Joint family or live with parents after marriage?",
  parents: "Should parents be involved in this match?",
  work: "Can your spouse keep working after marriage?",
  timeline: "How soon do you want to marry?",
  children: "Do you want children?",
  mother_tongue: "Any mother tongue we should look for?",
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

/** Speed Match bank: same 10 prompts. Visa uses existing labels only, not a new taxonomy. */
export function speedMatchDealbreakerQuestions(): SharedDealbreakerQuestion[] {
  return [
    { id: "location", prompt: DEALBREAKER_PROMPTS.location, choices: DEALBREAKER_LOCATION_CHOICES },
    { id: "visa", prompt: DEALBREAKER_PROMPTS.visa, choices: DEALBREAKER_SPEED_VISA_CHOICES },
    { id: "religion", prompt: DEALBREAKER_PROMPTS.religion, choices: DEALBREAKER_RELIGION_CHOICES },
    { id: "caste", prompt: DEALBREAKER_PROMPTS.caste, choices: dealbreakerCommunityChoices() },
    { id: "family_living", prompt: DEALBREAKER_PROMPTS.family_living, choices: DEALBREAKER_FAMILY_LIVING_CHOICES },
    { id: "parents", prompt: DEALBREAKER_PROMPTS.parents, choices: DEALBREAKER_PARENTS_CHOICES },
    { id: "work", prompt: DEALBREAKER_PROMPTS.work, choices: DEALBREAKER_WORK_CHOICES },
    { id: "timeline", prompt: DEALBREAKER_PROMPTS.timeline, choices: DEALBREAKER_TIMELINE_CHOICES },
    { id: "children", prompt: DEALBREAKER_PROMPTS.children, choices: DEALBREAKER_CHILDREN_CHOICES },
    { id: "mother_tongue", prompt: DEALBREAKER_PROMPTS.mother_tongue, choices: DEALBREAKER_LANGUAGE_CHOICES },
  ];
}

export function assertVisaLabelsAreKnown(choices: DealbreakerChoice[]) {
  return choices.every(function (choice) {
    return VISA_STATUS_OPTIONS.some(function (label) {
      return label === choice.label;
    });
  });
}

/**
 * Browse leftover prefs for the next PROFILE SEARCH on this device.
 * localStorage + session only. No new SQL table. Server write fails closed.
 *
 * Seeker country is memory, never a match filter. Match country / city,
 * bride or groom, visa, religion, and caste can fold into the search box.
 */

import {
  casteChoiceFromPrompt,
  foldBrowseAnswers,
  foldPhraseForAnswer,
  foldsIntoSearchBox,
  isBrowseAskNoAnswer,
  lookingForFromPrompt,
  matchCountryFromPrompt,
  religionChoiceFromPrompt,
  regionIdFromPlace,
  seekerCountryFromPrompt,
  visaChoiceFromPrompt,
  type BrowseAskAnswer,
} from "./browse-ask";

export const BROWSE_PREFS_STORAGE_KEY = "bandham.browse.prefs";

export type BrowseSearchPrefs = {
  lookingFor: string;
  seekerCountry: string;
  matchCountry: string;
  visa: string;
  religion: string;
  caste: string;
};

export type BrowseProfilePrefSource = {
  city?: unknown;
  looking_for?: unknown;
  wants?: unknown;
};

export function emptyBrowsePrefs(): BrowseSearchPrefs {
  return {
    lookingFor: "",
    seekerCountry: "",
    matchCountry: "",
    visa: "",
    religion: "",
    caste: "",
  };
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeChoice(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeBrowsePrefs(raw: unknown): BrowseSearchPrefs {
  const empty = emptyBrowsePrefs();
  if (!raw || typeof raw !== "object") return empty;
  const row = raw as Record<string, unknown>;
  return {
    lookingFor: sanitizeChoice(row.lookingFor),
    seekerCountry: sanitizeChoice(row.seekerCountry),
    matchCountry: sanitizeChoice(row.matchCountry),
    visa: sanitizeChoice(row.visa),
    religion: sanitizeChoice(row.religion),
    caste: sanitizeChoice(row.caste),
  };
}

export function loadBrowsePrefs(): BrowseSearchPrefs {
  try {
    if (typeof window === "undefined" || !window.localStorage) return emptyBrowsePrefs();
    const raw = window.localStorage.getItem(BROWSE_PREFS_STORAGE_KEY);
    if (!raw) return emptyBrowsePrefs();
    return sanitizeBrowsePrefs(JSON.parse(raw));
  } catch {
    return emptyBrowsePrefs();
  }
}

export function saveBrowsePrefs(prefs: BrowseSearchPrefs) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    window.localStorage.setItem(BROWSE_PREFS_STORAGE_KEY, JSON.stringify(sanitizeBrowsePrefs(prefs)));
    return true;
  } catch {
    return false;
  }
}

export function prefsToAnswers(prefs: BrowseSearchPrefs): BrowseAskAnswer[] {
  const out: BrowseAskAnswer[] = [];
  if (prefs.lookingFor) out.push({ questionId: "looking_for", choiceId: prefs.lookingFor });
  if (prefs.seekerCountry) out.push({ questionId: "seeker", choiceId: prefs.seekerCountry });
  if (prefs.matchCountry) out.push({ questionId: "location", choiceId: prefs.matchCountry });
  if (prefs.visa) out.push({ questionId: "visa", choiceId: prefs.visa });
  if (prefs.religion) out.push({ questionId: "religion", choiceId: prefs.religion });
  if (prefs.caste) out.push({ questionId: "caste", choiceId: prefs.caste });
  return out;
}

export function applyAnswerToPrefs(
  prefs: BrowseSearchPrefs,
  questionId: string,
  choiceId: string
): BrowseSearchPrefs {
  const next = sanitizeBrowsePrefs(prefs);
  if (questionId === "looking_for") next.lookingFor = choiceId;
  if (questionId === "seeker") next.seekerCountry = choiceId;
  if (questionId === "location") next.matchCountry = choiceId;
  if (questionId === "visa") next.visa = choiceId;
  if (questionId === "religion") next.religion = choiceId;
  if (questionId === "caste") next.caste = choiceId;
  return next;
}

export function applyPromptToPrefs(raw: string, prefs: BrowseSearchPrefs): BrowseSearchPrefs {
  const next = sanitizeBrowsePrefs(prefs);
  const looking = lookingForFromPrompt(raw);
  if (looking) next.lookingFor = looking;
  const seeker = seekerCountryFromPrompt(raw);
  if (seeker) next.seekerCountry = seeker;
  const match = matchCountryFromPrompt(raw);
  if (match) next.matchCountry = match;
  const visa = visaChoiceFromPrompt(raw);
  if (visa) next.visa = visa;
  const religion = religionChoiceFromPrompt(raw);
  if (religion) next.religion = religion;
  const caste = casteChoiceFromPrompt(raw);
  if (caste) next.caste = caste;
  return next;
}

export function dropRemovedMatchPrefs(
  raw: string,
  previousRaw: string,
  prefs: BrowseSearchPrefs
): BrowseSearchPrefs {
  const text = typeof raw === "string" ? raw.trim() : "";
  const previous = typeof previousRaw === "string" ? previousRaw.trim() : "";
  if (!previous) return sanitizeBrowsePrefs(prefs);
  const next = sanitizeBrowsePrefs(prefs);
  const checks: Array<[keyof BrowseSearchPrefs, string]> = [
    ["lookingFor", "looking_for"],
    ["matchCountry", "location"],
    ["visa", "visa"],
    ["religion", "religion"],
    ["caste", "caste"],
  ];
  checks.forEach(function (pair) {
    const key = pair[0];
    const questionId = pair[1];
    const choiceId = next[key];
    if (!choiceId || isBrowseAskNoAnswer(choiceId)) return;
    const phrase = foldPhraseForAnswer(questionId, choiceId);
    if (!phrase) return;
    const wasVisible = previous.toLowerCase().indexOf(phrase.toLowerCase()) >= 0;
    const stillVisible = text.toLowerCase().indexOf(phrase.toLowerCase()) >= 0;
    if (wasVisible && !stillVisible) next[key] = "";
  });
  return next;
}

/** Fold remembered match prefs into the visible box. Never folds seeker country. */
export function foldMatchPrefsIntoQuery(raw: string, prefs: BrowseSearchPrefs) {
  const matchAnswers = prefsToAnswers(prefs).filter(function (answer) {
    return foldsIntoSearchBox(answer.questionId);
  });
  return foldBrowseAnswers(raw, matchAnswers);
}

export function hydratePrefsFromProfile(
  prefs: BrowseSearchPrefs,
  profile: BrowseProfilePrefSource | null | undefined
): BrowseSearchPrefs {
  const next = sanitizeBrowsePrefs(prefs);
  if (!profile) return next;
  if (!next.seekerCountry) {
    const region = regionIdFromPlace(asText(profile.city));
    if (region) next.seekerCountry = region;
  }
  if (!next.lookingFor) {
    next.lookingFor =
      lookingForFromPrompt(asText(profile.looking_for)) || lookingForFromPrompt(asText(profile.wants));
  }
  return next;
}

/** No looking_for / browse_prompts column to write. Fail closed. */
export function persistBrowsePrefsToServer() {
  return false;
}

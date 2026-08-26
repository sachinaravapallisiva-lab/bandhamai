/**
 * Browse leftover prefs for the next PROFILE SEARCH on this device.
 * localStorage + session only. No new SQL table. Server write fails closed.
 *
 * Registration seed reuses live profiles columns only: gender, city,
 * visa_status, wants, plus looking_for / religion / community if they
 * already exist on the row. Preferred match country is not a column yet.
 *
 * Seeker country is memory, never a match filter. Match country / city,
 * bride or groom, visa, religion, and a specific community can fold into the
 * search box. Caste no bar is remembered and stays out of the box. Don't want
 * to answer on caste records no caste preference.
 */

import {
  casteChoiceFromPrompt,
  foldBrowseAnswers,
  foldPhraseForAnswer,
  foldsIntoSearchBox,
  BROWSE_ASK_CASTE_NO_BAR_ID,
  isBrowseAskNoAnswer,
  isCasteNoBar,
  lookingForFromPrompt,
  matchCountryFromPrompt,
  religionChoiceFromPrompt,
  regionIdFromPlace,
  seekerCountryFromPrompt,
  visaChoiceFromPrompt,
  type BrowseAskAnswer,
} from "./browse-ask";
import { normalizeProfileGender } from "./profile-fields";
import { isVisaStatusOption, resolveVisaAlias } from "./visa-status";

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
  location?: unknown;
  gender?: unknown;
  looking_for?: unknown;
  wants?: unknown;
  visa_status?: unknown;
  religion?: unknown;
  community?: unknown;
  caste?: unknown;
  preferred_country?: unknown;
  match_country?: unknown;
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
    caste: sanitizeCastePref(row.caste),
  };
}

function sanitizeCastePref(value: unknown) {
  const text = sanitizeChoice(value);
  if (!text || isBrowseAskNoAnswer(text)) return "";
  if (text === "any" || isCasteNoBar(text)) return BROWSE_ASK_CASTE_NO_BAR_ID;
  return text;
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
  if (questionId === "caste") {
    if (isBrowseAskNoAnswer(choiceId)) next.caste = "";
    else if (isCasteNoBar(choiceId)) next.caste = BROWSE_ASK_CASTE_NO_BAR_ID;
    else next.caste = choiceId;
  }
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

/** Own gender on registration maps to the match they seek. M looks for a bride. */
export function lookingForFromOwnGender(gender: unknown) {
  const code = normalizeProfileGender(gender);
  if (code === "F") return "groom";
  if (code === "M") return "bride";
  return "";
}

function visaFromProfileField(value: unknown) {
  const text = asText(value);
  if (!text) return "";
  if (isVisaStatusOption(text)) return text;
  const resolved = resolveVisaAlias(text);
  if (resolved) return resolved;
  return visaChoiceFromPrompt(text);
}

function firstText(profile: BrowseProfilePrefSource, keys: Array<keyof BrowseProfilePrefSource>) {
  for (let i = 0; i < keys.length; i += 1) {
    const text = asText(profile[keys[i]]);
    if (text) return text;
  }
  return "";
}

export function hydratePrefsFromProfile(
  prefs: BrowseSearchPrefs,
  profile: BrowseProfilePrefSource | null | undefined
): BrowseSearchPrefs {
  const next = sanitizeBrowsePrefs(prefs);
  if (!profile) return next;
  const wants = asText(profile.wants);
  const lookingField = asText(profile.looking_for);

  if (!next.lookingFor) {
    next.lookingFor =
      lookingForFromPrompt(lookingField) ||
      lookingForFromPrompt(wants) ||
      lookingForFromOwnGender(profile.gender);
  }
  if (!next.seekerCountry) {
    const region = regionIdFromPlace(firstText(profile, ["city", "location"]));
    if (region) next.seekerCountry = region;
  }
  if (!next.matchCountry) {
    const preferred = firstText(profile, ["preferred_country", "match_country"]);
    next.matchCountry = matchCountryFromPrompt(preferred) || matchCountryFromPrompt(wants);
  }
  if (!next.visa) {
    next.visa = visaFromProfileField(profile.visa_status) || visaChoiceFromPrompt(wants);
  }
  if (!next.religion) {
    next.religion = religionChoiceFromPrompt(firstText(profile, ["religion"])) || religionChoiceFromPrompt(wants);
  }
  if (!next.caste) {
    next.caste =
      casteChoiceFromPrompt(firstText(profile, ["community", "caste"])) || casteChoiceFromPrompt(wants);
  }
  return next;
}

/** Seed leftover prefs when they sign up or finish a profile. Device only. */
export function seedBrowsePrefsFromRegistration(profile: BrowseProfilePrefSource | null | undefined) {
  const next = hydratePrefsFromProfile(loadBrowsePrefs(), profile);
  saveBrowsePrefs(next);
  return next;
}

/**
 * Leftover prefs stay on the device. browse_prompts stores recent search
 * text only. Live profiles has no looking_for write column. Fail closed.
 */
export function persistBrowsePrefsToServer() {
  return false;
}

import {
  CITY_ALIASES,
  KEYWORD_ALIASES,
  SEARCH_CITIES,
  cityMatchValues,
  isKnownCityName,
  isKnownKeywordAlias,
} from "./desi-search-aliases";
import { PROFILE_WRITE_FIELDS } from "./profile-fields";

export { cityMatchValues } from "./desi-search-aliases";

/** Only approved rows appear on Browse. Creation always inserts `pending`. */
export const LIVE_PROFILE_STATUS = "live";

export const BROWSE_SHORTLIST_SIZE = 3;

export type SearchCriteria = {
  city: string | null;
  gender: "Female" | "Male" | "Other" | null;
  keywords: string[];
};

export type BrowseProfile = {
  id: string;
  name: string;
  city: string;
  work: string;
  education: string;
  langs: string;
  diet: string;
  visa: string;
  gender: string;
  note: string;
  /** Existing field label for the Hinge-style prompt — About or Wants. */
  promptLabel: string;
  photoUrl: string;
  /** True only when profiles.verifyai_status is exactly `verified`. */
  verified: boolean;
};

export type BrowseFactChip = {
  key: string;
  label: string;
  icon: "lang" | "edu" | "home";
};

/** Age is not a stored profile field — do not invent one. */
export function browseMetaLine(profile: BrowseProfile) {
  return [profile.city, profile.work].filter(Boolean).join(" · ");
}

/**
 * Up to three chips from existing fields: language, education,
 * then family-like visa/diet text if present, else diet or visa.
 */
export function browseFactChips(profile: BrowseProfile): BrowseFactChip[] {
  const chips: BrowseFactChip[] = [];
  if (profile.langs) chips.push({ key: "lang", label: profile.langs, icon: "lang" });
  if (profile.education) chips.push({ key: "edu", label: profile.education, icon: "edu" });

  const familyHay = [profile.visa, profile.diet].filter(Boolean);
  const family = familyHay.find(function (value) {
    return /nuclear|joint/i.test(value);
  });
  if (family) {
    chips.push({ key: "family", label: family, icon: "home" });
  } else if (profile.diet) {
    chips.push({ key: "diet", label: profile.diet, icon: "home" });
  } else if (profile.visa) {
    chips.push({ key: "visa", label: profile.visa, icon: "home" });
  }

  return chips.slice(0, 3);
}

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "in",
  "at",
  "from",
  "near",
  "around",
  "looking",
  "look",
  "find",
  "for",
  "someone",
  "somebody",
  "who",
  "with",
  "and",
  "or",
  "under",
  "over",
  "about",
  "want",
  "wants",
  "like",
  "likes",
  "prefer",
  "preferably",
  "please",
  "me",
  "my",
  "i",
  "im",
  "i'm",
  "seeking",
  "search",
  "show",
  "get",
  "any",
  "some",
  "profile",
  "profiles",
  "match",
  "matches",
  "person",
  "people",
  "live",
  "based",
  "located",
  "staying",
  "stay",
  "years",
  "year",
  "old",
  "age",
  "under",
  "over",
  "than",
  "to",
  "of",
  "on",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
]);

const FEMALE_WORDS = new Set(["female", "woman", "women", "girl", "girls", "lady", "ladies", "she", "her"]);
const MALE_WORDS = new Set(["male", "man", "men", "boy", "boys", "guy", "guys", "he", "him"]);
const OTHER_WORDS = new Set(["nonbinary", "non-binary", "other"]);

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCity(name: string) {
  return name
    .split(/\s+/)
    .map(function (part) {
      if (!part) return part;
      if (part === "nyc") return "NYC";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function escapeRe(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseRe(phrase: string) {
  return new RegExp("(?:^|\\s)(?:" + escapeRe(phrase) + ")(?:\\s|$)", "i");
}

function extractCity(text: string): { city: string | null; rest: string } {
  const aliasKeys = Object.keys(CITY_ALIASES).sort(function (a, b) {
    return b.length - a.length;
  });
  for (const alias of aliasKeys) {
    const re = phraseRe(alias);
    if (re.test(text)) {
      return { city: CITY_ALIASES[alias], rest: text.replace(re, " ") };
    }
  }

  const cities = SEARCH_CITIES.slice().sort(function (a, b) {
    return b.length - a.length;
  });
  for (const city of cities) {
    const re = phraseRe(city);
    if (re.test(text)) {
      return { city: city, rest: text.replace(re, " ") };
    }
  }

  const inMatch = text.match(/\b(?:in|from|near|at)\s+([a-z][a-z]+(?:\s+[a-z][a-z]+)?)\b/i);
  const guess = inMatch && inMatch[1] ? normalize(inMatch[1]) : "";
  const guessHead = guess.split(" ")[0] || "";
  if (
    inMatch &&
    guess &&
    !STOPWORDS.has(guess) &&
    !STOPWORDS.has(guessHead) &&
    !isKnownKeywordAlias(guess) &&
    !isKnownKeywordAlias(guessHead)
  ) {
    return { city: titleCity(guess), rest: text.replace(inMatch[0], " ") };
  }

  return { city: null, rest: text };
}

function extractKeywordAliases(text: string): { keywords: string[]; rest: string } {
  const aliases = Object.keys(KEYWORD_ALIASES).sort(function (a, b) {
    return b.length - a.length;
  });
  const keywords: string[] = [];
  let rest = text;
  for (const alias of aliases) {
    const re = phraseRe(alias);
    if (!re.test(rest)) continue;
    const keyword = KEYWORD_ALIASES[alias];
    if (keyword && keywords.indexOf(keyword) === -1) keywords.push(keyword);
    rest = rest.replace(re, " ");
  }
  return { keywords, rest: normalize(rest) };
}

function extractGender(text: string): { gender: SearchCriteria["gender"]; rest: string } {
  const looking = text.match(/\b(?:looking for|find|want|wants)\s+(?:a\s+)?(woman|women|female|girl|man|men|male|boy|guy)\b/i);
  const token = looking?.[1] || text.match(/\b(female|woman|women|girl|girls|lady|ladies|male|man|men|boy|boys|guy|guys|nonbinary|non-binary)\b/i)?.[1];
  if (!token) return { gender: null, rest: text };
  const lower = token.toLowerCase();
  const gender: SearchCriteria["gender"] = FEMALE_WORDS.has(lower)
    ? "Female"
    : MALE_WORDS.has(lower)
      ? "Male"
      : OTHER_WORDS.has(lower)
        ? "Other"
        : null;
  return { gender, rest: text.replace(new RegExp("\\b" + token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "ig"), " ") };
}

/**
 * Deterministic criteria from a spoken/typed Browse prompt.
 * English leftover keywords always survive. Desi aliases only enrich
 * tokens the user actually said. No model required.
 */
export function parseSearchQuery(raw: string): SearchCriteria {
  const text = normalize(raw);
  if (!text) return { city: null, gender: null, keywords: [] };

  const cityHit = extractCity(text);
  const genderHit = extractGender(cityHit.rest);
  const aliasHit = extractKeywordAliases(genderHit.rest);
  const leftover = normalize(aliasHit.rest);

  const keywords = aliasHit.keywords.slice();
  leftover.split(" ").forEach(function (word) {
    if (!word || STOPWORDS.has(word)) return;
    if (/^\d+$/.test(word)) return;
    if (word.length < 3 && word !== "ca") return;
    if (isKnownCityName(word)) return;
    if (keywords.indexOf(word) === -1) keywords.push(word);
  });

  return {
    city: cityHit.city,
    gender: genderHit.gender,
    keywords: keywords.slice(0, 6),
  };
}

/** Optional xAI when the English + desi parse is still thin. Never required. */
export function needsLlmAssist(query: string, criteria: SearchCriteria) {
  if (!query.trim()) return false;
  if (criteria.city && criteria.keywords.length > 0) return false;
  if (criteria.keywords.length >= 2) return false;
  return normalize(query).split(" ").filter(Boolean).length >= 2;
}

export function emptyCriteria(): SearchCriteria {
  return { city: null, gender: null, keywords: [] };
}

export function hasCriteria(criteria: SearchCriteria) {
  return !!(criteria.city || criteria.gender || criteria.keywords.length);
}

export function mergeCriteria(base: SearchCriteria, extra: SearchCriteria | null): SearchCriteria {
  if (!extra) return base;
  const keywords = base.keywords.slice();
  extra.keywords.forEach(function (word) {
    const lower = word.toLowerCase();
    if (!lower || STOPWORDS.has(lower)) return;
    if (keywords.indexOf(lower) === -1) keywords.push(lower);
  });
  return {
    city: extra.city || base.city,
    gender: extra.gender || base.gender,
    keywords: keywords.slice(0, 6),
  };
}

export function ilikeContains(value: string) {
  return "%" + value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_") + "%";
}

/** Strip characters that break PostgREST `or()` filters. */
export function safeOrValue(value: string) {
  return value.replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
}

export function browseSelectColumns(flags: {
  photo_url: boolean;
  diet: boolean;
  user_id?: boolean;
  verifyai_status?: boolean;
}) {
  const cols: string[] = ["id", ...PROFILE_WRITE_FIELDS];
  if (flags.photo_url) cols.push("photo_url");
  if (flags.diet) cols.push("diet");
  if (flags.user_id) cols.push("user_id");
  if (flags.verifyai_status) cols.push("verifyai_status");
  return cols.join(",");
}

function cityLooksLike(profileCity: string, wanted: string) {
  const a = profileCity.toLowerCase();
  const b = wanted.toLowerCase();
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const terms = cityMatchValues(wanted).map(function (term) {
    return term.toLowerCase();
  });
  return terms.some(function (term) {
    return a.includes(term) || term.includes(a);
  });
}

function dietLooksLike(diet: string, keyword: string) {
  const d = diet.toLowerCase();
  const k = keyword.toLowerCase();
  if (!d || !k) return false;
  if (k === "vegetarian") return (d.includes("vegetarian") || d === "veg") && !d.includes("non");
  if (k === "non-veg") return d.includes("non");
  if (k === "eggetarian") return d.includes("egg");
  return d.includes(k);
}

export function scoreBrowseRow(row: Record<string, unknown>, criteria: SearchCriteria) {
  let score = 0;
  const city = asText(row.city);
  const gender = asText(row.gender).toLowerCase();
  const diet = asText(row.diet);
  const haystacks = [
    asText(row.profession),
    asText(row.education),
    asText(row.about),
    asText(row.wants),
    asText(row.mother_tongue),
    asText(row.diet),
    asText(row.visa_status),
    asText(row.full_name),
  ].map(function (s) {
    return s.toLowerCase();
  });

  if (criteria.city && cityLooksLike(city, criteria.city)) score += 5;
  if (criteria.gender && gender === criteria.gender.toLowerCase()) score += 3;

  criteria.keywords.forEach(function (kw) {
    const needle = kw.toLowerCase();
    if (asText(row.profession).toLowerCase().includes(needle)) score += 4;
    else if (asText(row.education).toLowerCase().includes(needle)) score += 3;
    else if (dietLooksLike(diet, needle)) score += 3;
    else if (asText(row.visa_status).toLowerCase().includes(needle)) score += 3;
    else if (asText(row.mother_tongue).toLowerCase().includes(needle)) score += 3;
    else if (haystacks.some(function (h) { return h.includes(needle); })) score += 2;
  });

  return score;
}

export function toBrowseProfile(row: Record<string, unknown>): BrowseProfile | null {
  const id = row.id == null ? "" : String(row.id);
  if (!id) return null;

  const name = asText(row.full_name);
  const about = asText(row.about);
  const wants = asText(row.wants);

  return {
    id,
    name,
    city: asText(row.city),
    work: asText(row.profession),
    education: asText(row.education),
    langs: asText(row.mother_tongue),
    diet: asText(row.diet),
    visa: asText(row.visa_status),
    gender: asText(row.gender),
    note: about || wants,
    promptLabel: about ? "About" : wants ? "Wants" : "",
    photoUrl: asText(row.photo_url),
    verified: asText(row.verifyai_status).toLowerCase() === "verified",
  };
}

export function pickShortlist(rows: Record<string, unknown>[], criteria: SearchCriteria) {
  const ranked = rows
    .map(function (row) {
      return { row, score: scoreBrowseRow(row, criteria) };
    })
    .sort(function (a, b) {
      return b.score - a.score;
    });

  const cards: BrowseProfile[] = [];
  for (const item of ranked) {
    const card = toBrowseProfile(item.row);
    if (card) cards.push(card);
    if (cards.length >= BROWSE_SHORTLIST_SIZE) break;
  }
  return cards;
}

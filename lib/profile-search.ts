import { PROFILE_WRITE_FIELDS } from "./profile-fields";

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
  photoUrl: string;
  verified: boolean;
};

const SEARCH_CITIES = [
  "Hyderabad",
  "Secunderabad",
  "Vijayawada",
  "Guntur",
  "Warangal",
  "Karimnagar",
  "Nizamabad",
  "Rajahmundry",
  "Kakinada",
  "Tirupati",
  "Nellore",
  "Visakhapatnam",
  "Vizag",
  "Kurnool",
  "Anantapur",
  "Khammam",
  "Ongole",
  "Eluru",
  "Bhimavaram",
  "Machilipatnam",
  "Bengaluru",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Pune",
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
];

const CITY_ALIASES: Record<string, string> = {
  vizag: "Visakhapatnam",
  "twin cities": "Hyderabad",
  "twin city": "Hyderabad",
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  "new york city": "New York",
  nyc: "New York",
  "bay area": "Bay Area",
  "new jersey": "New Jersey",
};

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

function extractCity(text: string): { city: string | null; rest: string } {
  const aliasKeys = Object.keys(CITY_ALIASES).sort(function (a, b) {
    return b.length - a.length;
  });
  for (const alias of aliasKeys) {
    const re = new RegExp("(?:^|\\s)(?:" + alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?:\\s|$)", "i");
    if (re.test(text)) {
      return { city: CITY_ALIASES[alias], rest: text.replace(re, " ") };
    }
  }

  const cities = SEARCH_CITIES.slice().sort(function (a, b) {
    return b.length - a.length;
  });
  for (const city of cities) {
    const re = new RegExp("(?:^|\\s)(?:" + city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?:\\s|$)", "i");
    if (re.test(text)) {
      return { city: city === "Vizag" ? "Visakhapatnam" : city === "Bangalore" ? "Bengaluru" : city, rest: text.replace(re, " ") };
    }
  }

  const inMatch = text.match(/\b(?:in|from|near|at)\s+([a-z][a-z]+(?:\s+[a-z][a-z]+)?)\b/i);
  if (inMatch && inMatch[1] && !STOPWORDS.has(inMatch[1].toLowerCase())) {
    return { city: titleCity(inMatch[1]), rest: text.replace(inMatch[0], " ") };
  }

  return { city: null, rest: text };
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

/** Deterministic criteria from a spoken/typed Browse prompt. No model required. */
export function parseSearchQuery(raw: string): SearchCriteria {
  const text = normalize(raw);
  if (!text) return { city: null, gender: null, keywords: [] };

  const cityHit = extractCity(text);
  const genderHit = extractGender(cityHit.rest);
  const leftover = normalize(genderHit.rest);

  const keywords: string[] = [];
  leftover.split(" ").forEach(function (word) {
    if (!word || STOPWORDS.has(word)) return;
    if (/^\d+$/.test(word)) return;
    if (word.length < 3 && word !== "ca") return;
    if (keywords.indexOf(word) === -1) keywords.push(word);
  });

  return {
    city: cityHit.city,
    gender: genderHit.gender,
    keywords: keywords.slice(0, 6),
  };
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
  photo_blurred_url: boolean;
  diet: boolean;
  verified: boolean;
}) {
  const cols: string[] = ["id", ...PROFILE_WRITE_FIELDS];
  if (flags.photo_url) cols.push("photo_url");
  if (flags.photo_blurred_url) cols.push("photo_blurred_url");
  if (flags.diet) cols.push("diet");
  if (flags.verified) cols.push("verified");
  return cols.join(",");
}

export function scoreBrowseRow(row: Record<string, unknown>, criteria: SearchCriteria) {
  let score = 0;
  const city = asText(row.city).toLowerCase();
  const gender = asText(row.gender).toLowerCase();
  const haystacks = [
    asText(row.profession),
    asText(row.education),
    asText(row.about),
    asText(row.wants),
    asText(row.mother_tongue),
    asText(row.diet),
    asText(row.full_name),
  ].map(function (s) {
    return s.toLowerCase();
  });

  if (criteria.city && city.includes(criteria.city.toLowerCase())) score += 5;
  if (criteria.gender && gender === criteria.gender.toLowerCase()) score += 3;

  criteria.keywords.forEach(function (kw) {
    const needle = kw.toLowerCase();
    if (asText(row.profession).toLowerCase().includes(needle)) score += 4;
    else if (asText(row.education).toLowerCase().includes(needle)) score += 3;
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
  const blurred = asText(row.photo_blurred_url);
  const photo = asText(row.photo_url);

  return {
    id,
    name: name || "Member",
    city: asText(row.city),
    work: asText(row.profession),
    education: asText(row.education),
    langs: asText(row.mother_tongue),
    diet: asText(row.diet),
    visa: asText(row.visa_status),
    gender: asText(row.gender),
    note: about || wants,
    photoUrl: blurred || photo,
    verified: row.verified === true,
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

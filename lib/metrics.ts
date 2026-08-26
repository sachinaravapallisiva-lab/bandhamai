import { ageYearsFromDob } from "./biodata";
import { CITY_ALIASES, SEARCH_CITIES } from "./desi-search-aliases";

export const METRICS_PATH = "/admin/metrics";
export const METRICS_API_PATH = "/api/admin/metrics";
export const METRICS_LEGACY_PATH = "/metrics";

export const METRICS_UNAVAILABLE_TITLE = "This page is not available.";
export const METRICS_UNAVAILABLE_BODY = "Nothing to show here.";
export const METRICS_KICKER = "MEMBERS";
export const METRICS_TITLE = "Where members are from";
export const METRICS_LEAD =
  "Counts from signed in profiles. Place uses city. Age group uses date of birth or age when those fields exist.";
export const METRICS_TOTAL_LABEL = "Signed in profiles";
export const METRICS_PLACE_TITLE = "Where they are";
export const METRICS_REGION_TITLE = "Country and region";
export const METRICS_CITY_TITLE = "Top cities";
export const METRICS_AGE_TITLE = "Age groups";
export const METRICS_EMPTY_TITLE = "No signed in profiles to count yet.";
export const METRICS_EMPTY_BODY = "Empty groups show 0. Nothing here is a visitor count.";
export const METRICS_EMPTY_MARK = "Empty";
export const METRICS_EMPTY_CITIES = "No cities to rank yet.";
export const METRICS_SHARE_HINT = "Bar width is share of the total.";
export const METRICS_READ_FAILED = "Counts are not available.";
export const METRICS_UNKNOWN = "Unknown";

export const METRICS_AGE_LABELS = [
  "18 to 24",
  "25 to 29",
  "30 to 34",
  "35 to 39",
  "40 plus",
  METRICS_UNKNOWN,
] as const;

export type MetricsAgeLabel = (typeof METRICS_AGE_LABELS)[number];

/** Same region names Browse and visa location already use. */
export const METRICS_REGION_LABELS = [
  "United States",
  "Australia",
  "United Kingdom",
  "Europe",
  "Ireland",
  "India",
  METRICS_UNKNOWN,
] as const;

export type MetricsRegionLabel = (typeof METRICS_REGION_LABELS)[number];

/** Short chips for the six known regions. Unknown stays in the ranked rows. */
export const METRICS_REGION_CHIPS: { label: string; region: Exclude<MetricsRegionLabel, "Unknown"> }[] = [
  { label: "US", region: "United States" },
  { label: "India", region: "India" },
  { label: "Australia", region: "Australia" },
  { label: "UK", region: "United Kingdom" },
  { label: "Europe", region: "Europe" },
  { label: "Ireland", region: "Ireland" },
];

export const METRICS_TOP_CITIES = 12;

/** Same US city set Browse leftover location already uses. */
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

const REGION_ALIASES: Record<string, MetricsRegionLabel> = {
  "united states": "United States",
  usa: "United States",
  "u s a": "United States",
  us: "United States",
  australia: "Australia",
  "united kingdom": "United Kingdom",
  uk: "United Kingdom",
  britain: "United Kingdom",
  europe: "Europe",
  ireland: "Ireland",
  india: "India",
  "in india": "India",
  "from india": "India",
};

export type MetricsBucket = {
  label: string;
  count: number;
};

export type MemberMetrics = {
  members: number;
  regions: MetricsBucket[];
  cities: MetricsBucket[];
  ages: MetricsBucket[];
};

export type MetricsRow = {
  city?: unknown;
  dob?: unknown;
  age?: unknown;
};

export function metricsUserCopy() {
  return [
    METRICS_UNAVAILABLE_TITLE,
    METRICS_UNAVAILABLE_BODY,
    METRICS_KICKER,
    METRICS_TITLE,
    METRICS_LEAD,
    METRICS_TOTAL_LABEL,
    METRICS_PLACE_TITLE,
    METRICS_REGION_TITLE,
    METRICS_CITY_TITLE,
    METRICS_AGE_TITLE,
    METRICS_EMPTY_TITLE,
    METRICS_EMPTY_BODY,
    METRICS_EMPTY_MARK,
    METRICS_EMPTY_CITIES,
    METRICS_SHARE_HINT,
    METRICS_READ_FAILED,
    METRICS_UNKNOWN,
    ...METRICS_REGION_CHIPS.map(function (chip) {
      return chip.label;
    }),
    ...METRICS_AGE_LABELS,
    ...METRICS_REGION_LABELS,
  ];
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function titleCity(value: string) {
  return value
    .split(/\s+/)
    .map(function (part) {
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export function canonicalCityName(raw: string) {
  const key = raw.toLowerCase().trim();
  if (!key) return "";
  if (CITY_ALIASES[key]) return CITY_ALIASES[key];
  const known = SEARCH_CITIES.find(function (city) {
    return city.toLowerCase() === key;
  });
  return known || titleCity(raw.trim());
}

function regionAlias(raw: string): MetricsRegionLabel | "" {
  return REGION_ALIASES[raw.toLowerCase().trim()] || "";
}

function regionForKnownCity(city: string): MetricsRegionLabel | "" {
  if (US_CITY_SET.has(city)) return "United States";
  if (INDIA_CITY_SET.has(city)) return "India";
  return "";
}

export function placeFromCity(raw: unknown): { city: string; region: MetricsRegionLabel } {
  const trimmed = asText(raw);
  if (!trimmed) {
    return { city: METRICS_UNKNOWN, region: METRICS_UNKNOWN };
  }

  const wholeRegion = regionAlias(trimmed);
  if (wholeRegion) {
    return { city: METRICS_UNKNOWN, region: wholeRegion };
  }

  const parts = trimmed.split(",").map(function (part) {
    return part.trim();
  }).filter(Boolean);

  const cityPart = parts[0] || trimmed;
  const cityRegion = regionAlias(cityPart);
  if (cityRegion && parts.length === 1) {
    return { city: METRICS_UNKNOWN, region: cityRegion };
  }

  const city = canonicalCityName(cityPart) || METRICS_UNKNOWN;
  let region = regionForKnownCity(city);
  if (!region) {
    for (const part of parts) {
      const hit = regionAlias(part);
      if (hit) {
        region = hit;
        break;
      }
    }
  }

  return {
    city: city || METRICS_UNKNOWN,
    region: region || METRICS_UNKNOWN,
  };
}

export function ageYearsFromProfile(row: MetricsRow, now = new Date()) {
  const fromDob = ageYearsFromDob(row.dob, now);
  if (fromDob) return Number(fromDob);

  const age = row.age;
  if (typeof age === "number" && Number.isFinite(age)) {
    const years = Math.floor(age);
    if (years >= 18 && years <= 120) return years;
  }
  if (typeof age === "string") {
    const years = Number.parseInt(age.trim(), 10);
    if (years >= 18 && years <= 120) return years;
  }
  return null;
}

export function ageGroupFromYears(years: number | null): MetricsAgeLabel {
  if (years == null) return METRICS_UNKNOWN;
  if (years >= 18 && years <= 24) return "18 to 24";
  if (years >= 25 && years <= 29) return "25 to 29";
  if (years >= 30 && years <= 34) return "30 to 34";
  if (years >= 35 && years <= 39) return "35 to 39";
  if (years >= 40 && years <= 120) return "40 plus";
  return METRICS_UNKNOWN;
}

function emptyAgeCounts(): Record<MetricsAgeLabel, number> {
  return {
    "18 to 24": 0,
    "25 to 29": 0,
    "30 to 34": 0,
    "35 to 39": 0,
    "40 plus": 0,
    [METRICS_UNKNOWN]: 0,
  };
}

function emptyRegionCounts(): Record<MetricsRegionLabel, number> {
  return {
    "United States": 0,
    Australia: 0,
    "United Kingdom": 0,
    Europe: 0,
    Ireland: 0,
    India: 0,
    [METRICS_UNKNOWN]: 0,
  };
}

function sortedCityBuckets(counts: Record<string, number>, limit: number): MetricsBucket[] {
  return Object.keys(counts)
    .map(function (label) {
      return { label: label, count: counts[label] };
    })
    .sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      if (a.label === METRICS_UNKNOWN) return 1;
      if (b.label === METRICS_UNKNOWN) return -1;
      return a.label.localeCompare(b.label);
    })
    .slice(0, limit);
}

/** In memory aggregates. Input rows must be city + dob/age only. */
export function aggregateMemberMetrics(rows: MetricsRow[], now = new Date()): MemberMetrics {
  const regions = emptyRegionCounts();
  const ages = emptyAgeCounts();
  const cities: Record<string, number> = {};

  rows.forEach(function (row) {
    const place = placeFromCity(row.city);
    regions[place.region] += 1;
    cities[place.city] = (cities[place.city] || 0) + 1;
    ages[ageGroupFromYears(ageYearsFromProfile(row, now))] += 1;
  });

  return {
    members: rows.length,
    regions: METRICS_REGION_LABELS.map(function (label) {
      return { label: label, count: regions[label] };
    }),
    cities: sortedCityBuckets(cities, METRICS_TOP_CITIES),
    ages: METRICS_AGE_LABELS.map(function (label) {
      return { label: label, count: ages[label] };
    }),
  };
}

export function emptyMemberMetrics(): MemberMetrics {
  return aggregateMemberMetrics([]);
}

/** Bar width as a percent of the queried total. Never a sample scale. */
export function shareOfTotal(count: number, total: number) {
  if (!(total > 0) || !(count > 0)) return 0;
  return Math.min(100, (count / total) * 100);
}

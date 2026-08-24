/** Private birth chart inputs for Gun Milan. Never public on Browse. */

export const BIRTH_DETAILS_TABLE = "profile_birth_details";
export const BIRTH_DETAILS_SQL_FILE = "supabase/gun_milan.sql";

export const BIRTH_SECTION_TITLE = "Birth details";
export const BIRTH_SECTION_HINT =
  "Used only for Gun Milan. Never shown on Browse cards.";
export const BIRTH_DATE_LABEL = "BIRTH DATE";
export const BIRTH_TIME_LABEL = "BIRTH TIME";
export const BIRTH_PLACE_LABEL = "BIRTH PLACE";
export const BIRTH_LAT_LABEL = "LATITUDE";
export const BIRTH_LON_LABEL = "LONGITUDE";
export const BIRTH_TZ_LABEL = "TIME ZONE";
export const BIRTH_PLACE_PRESET_LABEL = "COMMON PLACE";
export const BIRTH_SAVE_LABEL = "Save birth details";
export const BIRTH_SAVING_LABEL = "Saving…";
export const BIRTH_SAVED = "Birth details saved.";
export const BIRTH_MISSING_BOTH =
  "Gun Milan needs birth date, time, and place for both people.";
export const BIRTH_OWN_MISSING =
  "Add your birth date, time, and place on Account first.";
export const BIRTH_OTHER_MISSING =
  "This member still needs birth date, time, and place.";
export const BIRTH_INVALID_ERROR = "Check the birth date, time, place, and time zone.";
export const BIRTH_SQL_HINT =
  "Run supabase/gun_milan.sql in the Supabase SQL editor to store birth details.";

export const BIRTH_PRIVATE_COLUMNS = [
  "birth_date",
  "birth_time",
  "place_name",
  "latitude",
  "longitude",
  "timezone",
] as const;

export type BirthDetailsFields = {
  birth_date: string;
  birth_time: string;
  place_name: string;
  latitude: string;
  longitude: string;
  timezone: string;
};

export type BirthPlacePreset = {
  id: string;
  label: string;
  place_name: string;
  latitude: string;
  longitude: string;
  timezone: string;
};

export type TimeZoneOption = {
  value: string;
  label: string;
};

/** Offset values may use a sign. Labels stay hyphen free. */
export const BIRTH_TIME_ZONES: TimeZoneOption[] = [
  { value: "+05:30", label: "India (plus 05 30)" },
  { value: "+04:00", label: "Gulf (plus 04 00)" },
  { value: "+01:00", label: "Central Europe (plus 01 00)" },
  { value: "+00:00", label: "UTC" },
  { value: "-05:00", label: "US East (five hours behind UTC)" },
  { value: "-06:00", label: "US Central (six hours behind UTC)" },
  { value: "-07:00", label: "US Mountain (seven hours behind UTC)" },
  { value: "-08:00", label: "US Pacific (eight hours behind UTC)" },
];

export const BIRTH_PLACE_PRESETS: BirthPlacePreset[] = [
  { id: "hyderabad", label: "Hyderabad", place_name: "Hyderabad", latitude: "17.3850", longitude: "78.4867", timezone: "+05:30" },
  { id: "bengaluru", label: "Bengaluru", place_name: "Bengaluru", latitude: "12.9716", longitude: "77.5946", timezone: "+05:30" },
  { id: "chennai", label: "Chennai", place_name: "Chennai", latitude: "13.0827", longitude: "80.2707", timezone: "+05:30" },
  { id: "mumbai", label: "Mumbai", place_name: "Mumbai", latitude: "19.0760", longitude: "72.8777", timezone: "+05:30" },
  { id: "delhi", label: "Delhi", place_name: "Delhi", latitude: "28.6139", longitude: "77.2090", timezone: "+05:30" },
  { id: "pune", label: "Pune", place_name: "Pune", latitude: "18.5204", longitude: "73.8567", timezone: "+05:30" },
  { id: "kolkata", label: "Kolkata", place_name: "Kolkata", latitude: "22.5726", longitude: "88.3639", timezone: "+05:30" },
  { id: "kochi", label: "Kochi", place_name: "Kochi", latitude: "9.9312", longitude: "76.2673", timezone: "+05:30" },
  { id: "dallas", label: "Dallas", place_name: "Dallas", latitude: "32.7767", longitude: "-96.7970", timezone: "-06:00" },
  { id: "austin", label: "Austin", place_name: "Austin", latitude: "30.2672", longitude: "-97.7431", timezone: "-06:00" },
  { id: "newjersey", label: "New Jersey", place_name: "New Jersey", latitude: "40.0583", longitude: "-74.4057", timezone: "-05:00" },
  { id: "london", label: "London", place_name: "London", latitude: "51.5074", longitude: "-0.1278", timezone: "+00:00" },
  { id: "dubai", label: "Dubai", place_name: "Dubai", latitude: "25.2048", longitude: "55.2708", timezone: "+04:00" },
];

export function emptyBirthDetails(): BirthDetailsFields {
  return {
    birth_date: "",
    birth_time: "",
    place_name: "",
    latitude: "",
    longitude: "",
    timezone: "+05:30",
  };
}

function asText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function normalizeBirthTime(value: unknown) {
  const raw = asText(value);
  if (/^\d{2}:\d{2}$/.test(raw)) return raw + ":00";
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
  return "";
}

export function normalizeBirthDate(value: unknown) {
  const raw = asText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);
  return "";
}

export function normalizeTimeZone(value: unknown) {
  const raw = asText(value);
  if (/^[+-]\d{2}:\d{2}$/.test(raw)) return raw;
  return "";
}

export function parseCoordinate(value: unknown, min: number, max: number) {
  const raw = asText(value);
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export function readBirthDetails(row: Record<string, unknown> | null | undefined): BirthDetailsFields {
  const src = row || {};
  return {
    birth_date: normalizeBirthDate(src.birth_date) || normalizeBirthDate(src.dob),
    birth_time: normalizeBirthTime(src.birth_time) || asText(src.birth_time),
    place_name: asText(src.place_name),
    latitude: asText(src.latitude),
    longitude: asText(src.longitude),
    timezone: normalizeTimeZone(src.timezone) || "+05:30",
  };
}

export function hasCompleteBirthDetails(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const parsed = parseBirthDetailsInput(value as Record<string, unknown>);
  return parsed.ok;
}

export type ParsedBirthDetails =
  | {
      ok: true;
      birth_date: string;
      birth_time: string;
      place_name: string;
      latitude: number;
      longitude: number;
      timezone: string;
    }
  | { ok: false; error: string };

export function parseBirthDetailsInput(body: Record<string, unknown>): ParsedBirthDetails {
  const birth_date = normalizeBirthDate(body.birth_date);
  const birth_time = normalizeBirthTime(body.birth_time);
  const place_name = asText(body.place_name).slice(0, 120);
  const latitude = parseCoordinate(body.latitude, -90, 90);
  const longitude = parseCoordinate(body.longitude, -180, 180);
  const timezone = normalizeTimeZone(body.timezone);

  if (!birth_date || !birth_time || !place_name || latitude == null || longitude == null || !timezone) {
    return { ok: false, error: BIRTH_INVALID_ERROR };
  }

  return { ok: true, birth_date, birth_time, place_name, latitude, longitude, timezone };
}

export function birthChartDatetime(details: {
  birth_date: string;
  birth_time: string;
  timezone: string;
}) {
  const time = normalizeBirthTime(details.birth_time);
  const date = normalizeBirthDate(details.birth_date);
  const zone = normalizeTimeZone(details.timezone);
  if (!date || !time || !zone) return "";
  return date + "T" + time + zone;
}

export function birthChartCoordinates(details: { latitude: number | string; longitude: number | string }) {
  const latitude = parseCoordinate(details.latitude, -90, 90);
  const longitude = parseCoordinate(details.longitude, -180, 180);
  if (latitude == null || longitude == null) return "";
  return latitude + "," + longitude;
}

export function birthFingerprint(details: {
  birth_date: string;
  birth_time: string;
  latitude: number | string;
  longitude: number | string;
  timezone: string;
}) {
  return [
    normalizeBirthDate(details.birth_date),
    normalizeBirthTime(details.birth_time),
    birthChartCoordinates(details),
    normalizeTimeZone(details.timezone),
  ].join("|");
}

export function findBirthPlacePreset(id: string) {
  const key = id.trim().toLowerCase();
  return BIRTH_PLACE_PRESETS.find(function (item) {
    return item.id === key;
  }) || null;
}

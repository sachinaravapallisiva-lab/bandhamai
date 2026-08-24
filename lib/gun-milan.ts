import { BIRTH_MISSING_BOTH, BIRTH_OTHER_MISSING, BIRTH_OWN_MISSING } from "./birth-details";
import {
  KUNDLI_NOT_ALLOWED_ERROR,
  KUNDLI_SIGNED_IN_ERROR,
  KUNDLI_UNAVAILABLE_ERROR,
  parseKundliShare,
} from "./kundli-share";
import { normalizeProfileGender, type ProfileGenderCode } from "./profile-fields";

export const GUN_MILAN_PROVIDER_ID = "prokerala";
export const GUN_MILAN_REPORTS_TABLE = "gun_milan_reports";
export const GUN_MILAN_SQL_FILE = "supabase/gun_milan.sql";
export const GUN_MILAN_API_PATH = "/api/gun-milan";
export const BIRTH_DETAILS_API_PATH = "/api/birth-details";
export const GUN_MILAN_FOCUS_KEY = "bandham.gunMilanProfileId";

export const GUN_MILAN_TITLE = "Gun Milan";
export const GUN_MILAN_ACTION = "Gun Milan";
export const GUN_MILAN_RUN = "Run Gun Milan";
export const GUN_MILAN_RUNNING = "Asking the matching API…";
export const GUN_MILAN_NOT_CONFIGURED = "Matching is not set up yet.";
export const GUN_MILAN_SCORE_LABEL = "API score";
export const GUN_MILAN_KOOT_LABEL = "Koot table";
export const GUN_MILAN_MANGLIK_LABEL = "Manglik flags";
export const GUN_MILAN_GENDER_ERROR = "Gun Milan needs one Female chart and one Male chart.";
export const GUN_MILAN_API_ERROR = "Could not load Gun Milan from the matching API.";
export const GUN_MILAN_FOCUS_HINT =
  "The Bandham assistant can explain this stored report. It will not invent a score.";
export const GUN_MILAN_NO_REPORT_REPLY =
  "I can only explain a stored Gun Milan report from the paid matching API. Run Gun Milan on that profile first. I will not guess compatibility or invent a score.";
export const GUN_MILAN_ACCOUNT_NOTE =
  "Gun Milan is matrimony matching from a paid chart API. Bandham AI explains a stored report only.";
export const GUN_MILAN_EMPTY_RUN =
  "No stored report yet. Run Gun Milan once. The paid API does the chart math.";
export const GUN_MILAN_CACHED_NOTE =
  "Stored report. The matching API was not called again.";
export const GUN_MILAN_LOAD_ERROR = "Could not load Gun Milan.";
export const GUN_MILAN_CHOOSE_PLACE = "Choose a common place";
export const GUN_MILAN_BIRTH_ON_ACCOUNT =
  "Birth date, time, and place are saved on Account. They stay off Browse cards.";

export const PROKERALA_CLIENT_ID_ENV = "PROKERALA_CLIENT_ID";
export const PROKERALA_CLIENT_SECRET_ENV = "PROKERALA_CLIENT_SECRET";
export const PROKERALA_TOKEN_URL = "https://api.prokerala.com/token";
export const PROKERALA_KUNDLI_MATCHING_PATH = "/v2/astrology/kundli-matching/advanced";
export const PROKERALA_API_BASE = "https://api.prokerala.com";

export const GUN_MILAN_PUBLIC_BROWSE_FORBIDDEN = [
  "birth_date",
  "birth_time",
  "place_name",
  "latitude",
  "longitude",
  "timezone",
  "dob",
] as const;

export type GunMilanKootRow = {
  id: unknown;
  name: unknown;
  girl_koot: unknown;
  boy_koot: unknown;
  obtained_points: unknown;
  maximum_points: unknown;
  description: unknown;
};

export type GunMilanManglik = {
  has_dosha: unknown;
  has_exception: unknown;
  dosha_type: unknown;
  description: unknown;
};

export type GunMilanView = {
  provider: string;
  total_points: unknown;
  maximum_points: unknown;
  koots: GunMilanKootRow[];
  girl_mangal_dosha_details: GunMilanManglik | null;
  boy_mangal_dosha_details: GunMilanManglik | null;
  message: { type: unknown; description: unknown } | null;
  raw: unknown;
};

export type GunMilanAccess =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 404 | 409; error: string; reason: string };

export function gunMilanKeysReady(env: NodeJS.ProcessEnv = process.env) {
  const id = typeof env.PROKERALA_CLIENT_ID === "string" ? env.PROKERALA_CLIENT_ID.trim() : "";
  const secret =
    typeof env.PROKERALA_CLIENT_SECRET === "string" ? env.PROKERALA_CLIENT_SECRET.trim() : "";
  return !!(id && secret);
}

export function readGunMilanTargetId(searchParams: URLSearchParams) {
  const raw = searchParams.get("id") || searchParams.get("profile_id") || "";
  return raw.trim();
}

export function gunMilanPath(profileId?: string) {
  const id = typeof profileId === "string" ? profileId.trim() : "";
  if (!id) return GUN_MILAN_API_PATH;
  return GUN_MILAN_API_PATH + "?id=" + encodeURIComponent(id);
}

export function pairProfileIds(a: string, b: string) {
  const left = a.trim();
  const right = b.trim();
  return left < right ? [left, right] : [right, left];
}

export function decideGunMilanAccess(options: {
  viewerUserId: string;
  targetUserId?: string | null;
  targetStatus?: string | null;
  kundliShare?: unknown;
  viewerHasBirth: boolean;
  otherHasBirth: boolean;
}): GunMilanAccess {
  const viewer = typeof options.viewerUserId === "string" ? options.viewerUserId.trim() : "";
  if (!viewer) {
    return { ok: false, status: 401, error: KUNDLI_SIGNED_IN_ERROR, reason: "signed_out" };
  }

  const owner = typeof options.targetUserId === "string" ? options.targetUserId.trim() : "";
  if (owner && viewer === owner) {
    return { ok: false, status: 403, error: KUNDLI_NOT_ALLOWED_ERROR, reason: "self" };
  }

  const status = typeof options.targetStatus === "string" ? options.targetStatus.trim().toLowerCase() : "";
  if (status !== "live") {
    return { ok: false, status: 404, error: KUNDLI_UNAVAILABLE_ERROR, reason: "unavailable" };
  }
  if (!parseKundliShare(options.kundliShare)) {
    return { ok: false, status: 403, error: KUNDLI_NOT_ALLOWED_ERROR, reason: "not_opted_in" };
  }
  if (!options.viewerHasBirth) {
    return { ok: false, status: 409, error: BIRTH_OWN_MISSING, reason: "missing_own_birth" };
  }
  if (!options.otherHasBirth) {
    return { ok: false, status: 409, error: BIRTH_OTHER_MISSING, reason: "missing_other_birth" };
  }
  return { ok: true };
}

export function assignChartSlots(options: {
  viewerGender: unknown;
  otherGender: unknown;
  viewer: unknown;
  other: unknown;
}):
  | { ok: true; girl: unknown; boy: unknown }
  | { ok: false; error: string } {
  const viewerGender = normalizeProfileGender(options.viewerGender);
  const otherGender = normalizeProfileGender(options.otherGender);
  if (!viewerGender || !otherGender || viewerGender === otherGender) {
    return { ok: false, error: GUN_MILAN_GENDER_ERROR };
  }

  const girlIsViewer: ProfileGenderCode = "F";
  if (viewerGender === girlIsViewer && otherGender === "M") {
    return { ok: true, girl: options.viewer, boy: options.other };
  }
  if (viewerGender === "M" && otherGender === girlIsViewer) {
    return { ok: true, girl: options.other, boy: options.viewer };
  }
  return { ok: false, error: GUN_MILAN_GENDER_ERROR };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readManglik(value: unknown): GunMilanManglik | null {
  const row = asRecord(value);
  if (!row) return null;
  return {
    has_dosha: row.has_dosha,
    has_exception: row.has_exception,
    dosha_type: row.dosha_type,
    description: row.description,
  };
}

/**
 * Copy API fields for display. Do not sum, infer, or invent points.
 * Missing fields stay omitted.
 */
export function presentGunMilanReport(raw: unknown, provider = GUN_MILAN_PROVIDER_ID): GunMilanView {
  const root = asRecord(raw) || {};
  const data = asRecord(root.data) || root;
  const guna = asRecord(data.guna_milan) || {};
  const rows = Array.isArray(guna.guna) ? guna.guna : [];
  const koots: GunMilanKootRow[] = [];
  rows.forEach(function (item) {
    const row = asRecord(item);
    if (!row) return;
    koots.push({
      id: row.id,
      name: row.name,
      girl_koot: row.girl_koot,
      boy_koot: row.boy_koot,
      obtained_points: row.obtained_points,
      maximum_points: row.maximum_points,
      description: row.description,
    });
  });

  const message = asRecord(data.message);

  return {
    provider,
    total_points: Object.prototype.hasOwnProperty.call(guna, "total_points") ? guna.total_points : null,
    maximum_points: Object.prototype.hasOwnProperty.call(guna, "maximum_points") ? guna.maximum_points : null,
    koots,
    girl_mangal_dosha_details: readManglik(data.girl_mangal_dosha_details),
    boy_mangal_dosha_details: readManglik(data.boy_mangal_dosha_details),
    message: message
      ? { type: message.type, description: message.description }
      : null,
    raw,
  };
}

export function looksLikeGunMilanQuestion(text: string) {
  const raw = typeof text === "string" ? text.toLowerCase() : "";
  if (!raw) return false;
  return /gun\s*milan|kundli|guna|ashtakoot|ashta\s*koot|manglik|mangal\s*dosha|koot|compatibility|match(?:ing)? score/.test(
    raw
  );
}

export function rememberGunMilanProfile(profileId: string) {
  if (typeof window === "undefined") return;
  const id = profileId.trim();
  if (!id) return;
  try {
    window.sessionStorage.setItem(GUN_MILAN_FOCUS_KEY, id);
  } catch {
    /* ignore quota */
  }
}

export function readRememberedGunMilanProfile() {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(GUN_MILAN_FOCUS_KEY) || "";
  } catch {
    return "";
  }
}

export function formatScoreLine(view: GunMilanView) {
  if (view.total_points == null || view.maximum_points == null) return "";
  return String(view.total_points) + " / " + String(view.maximum_points);
}

export function missingBirthCopy(own: boolean, other: boolean) {
  if (!own && !other) return BIRTH_MISSING_BOTH;
  if (!own) return BIRTH_OWN_MISSING;
  return BIRTH_OTHER_MISSING;
}

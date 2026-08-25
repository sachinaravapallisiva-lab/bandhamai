/** Regular-member subscribe reminder calls. Opt-in default off. No live dialer here. */

export const SUBSCRIBE_CALL_SQL_FILE = "supabase/subscribe_call_opt_in.sql";
export const SUBSCRIBE_CALL_PROMPT_FILE = "docs/subscribe-call-prompt.md";
export const SUBSCRIBE_CALL_PATH = "/api/voice/subscribe-reminders";
export const SUBSCRIBE_CALL_CADENCE_DAYS = 15;

export const SUBSCRIBE_CALL_PHONE_COLUMN = "phone";
export const SUBSCRIBE_CALL_OPT_IN_COLUMN = "call_subscribe_opt_in";
export const SUBSCRIBE_CALL_OPTED_AT_COLUMN = "call_subscribe_opted_at";
export const SUBSCRIBE_CALL_LAST_AT_COLUMN = "last_subscribe_call_at";

export const SUBSCRIBE_CALL_SQL_HINT =
  "Run supabase/subscribe_call_opt_in.sql in the Supabase SQL editor to add subscribe call opt-in.";

export const SUBSCRIBE_CALL_LABEL = "Call me about Bandham AI";
export const SUBSCRIBE_CALL_HINT =
  "Regular members can get one voice call every 15 days about Bandham AI. You can turn this off anytime. Premium members are not called.";
export const SUBSCRIBE_CALL_PHONE_LABEL = "PHONE";
export const SUBSCRIBE_CALL_PHONE_HINT =
  "This number stays on your Bandham AI profile. We only call the number you save here.";
export const SUBSCRIBE_CALL_SAVE_LABEL = "Save call choice";
export const SUBSCRIBE_CALL_SAVING_LABEL = "Saving…";
export const SUBSCRIBE_CALL_NEED_PHONE =
  "Save a phone on your profile before turning this on.";
export const SUBSCRIBE_CALL_NEED_PROFILE = "Create a profile first.";
export const SUBSCRIBE_CALL_SAVED_ON = "We will only call if you stay Regular and opted in.";
export const SUBSCRIBE_CALL_SAVED_OFF = "Subscribe reminder calls are off.";

export const SUBSCRIBE_CALL_LANGUAGES = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Punjabi",
  "Odia",
  "Assamese",
  "Urdu",
] as const;

/** Openings they may use. Not a recitation. No hyphens. English is first class. */
export const SUBSCRIBE_CALL_EXAMPLE_OPENING =
  "Hello, my name is Sai.";
export const SUBSCRIBE_CALL_EXAMPLE_OPENING_TE = "హలో నా పేరు సాయ్ సచ్చన్. ఏం చేస్తున్నారు?";
export const SUBSCRIBE_CALL_EXAMPLE_OPENING_HI = "Hello, my name is Sai.";

export const SUBSCRIBE_CALL_SPOKEN_PRICE =
  "Bandham AI subscription is 9.99 a month.";

export const SUBSCRIBE_CALL_SPOKEN_TAGLINE = "Find your vibe match?";

export const SUBSCRIBE_CALL_SPOKEN_FREE =
  "Browse, search, Speed Match, and creating a profile stay free.";

export const SUBSCRIBE_CALL_SPOKEN_STOP =
  "I can stop these calls. Say the word and I will turn them off.";

export type SubscribeCallProfileRow = {
  id?: string | null;
  user_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
  mother_tongue?: string | null;
  dob?: string | Date | null;
  status?: string | null;
  call_subscribe_opt_in?: unknown;
  call_subscribe_opted_at?: string | null;
  last_subscribe_call_at?: string | null;
};

export type SubscribeCallReason =
  | "missing_phone"
  | "missing_opt_in"
  | "entitled"
  | "recent_call"
  | "under_18"
  | "demo_or_preview"
  | "no_profile";

export type SubscribeCallDecision = {
  eligible: boolean;
  reasons: SubscribeCallReason[];
};

/** True only for an explicit tap. Everything else stays off. */
export function parseCallSubscribeOptIn(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return raw === "true" || raw === "1" || raw === "on" || raw === "yes";
  }
  return false;
}

/** Keep digits and a leading plus. Fail closed on short or long junk. */
export function normalizeSubscribePhone(value: unknown) {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return (hasPlus ? "+" : "") + digits;
}

export function displayPhoneWithSpaces(value: string) {
  const trimmed = (value || "").replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return plus ? "+" : "";

  if (plus && digits.startsWith("1") && digits.length >= 11) {
    return ("+1 " + groupNational(digits.slice(1))).trim();
  }
  if (plus && digits.length > 10) {
    const ccLen = digits.length >= 12 ? 2 : 1;
    const cc = digits.startsWith("353") ? 3 : ccLen;
    return ("+" + digits.slice(0, cc) + " " + groupNational(digits.slice(cc))).trim();
  }
  return (plus ? "+" : "") + groupNational(digits);
}

function groupNational(digits: string) {
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return digits.slice(0, 3) + " " + digits.slice(3);
  if (digits.length <= 10) {
    return digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6);
  }
  return digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6, 10) + " " + digits.slice(10);
}

export function maskPhoneForList(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 4) return "saved";
  return "saved ending " + digits.slice(-4);
}

export function adultAgeYears(dob: unknown, now = new Date()): number | null {
  let raw = "";
  if (typeof dob === "string") raw = dob.trim();
  else if (dob instanceof Date && !Number.isNaN(dob.getTime())) {
    raw = dob.toISOString().slice(0, 10);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const todayY = now.getUTCFullYear();
  const todayM = now.getUTCMonth() + 1;
  const todayD = now.getUTCDate();
  let age = todayY - year;
  if (todayM < month || (todayM === month && todayD < day)) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

/** Missing dob is allowed: signup already asks for 18 and over. A stored under 18 fails closed. */
export function isAdultMember(dob: unknown, now = new Date()) {
  if (dob == null || (typeof dob === "string" && !dob.trim())) return true;
  const age = adultAgeYears(dob, now);
  if (age == null) return true;
  return age >= 18;
}

export function isDemoOrPreviewProfile(row: SubscribeCallProfileRow) {
  const userId = typeof row.user_id === "string" ? row.user_id.trim() : "";
  if (!userId) return true;
  const status = typeof row.status === "string" ? row.status.trim().toLowerCase() : "";
  return (
    status === "removed" ||
    status === "demo" ||
    status === "preview" ||
    status === "layout" ||
    status === "layout_preview"
  );
}

export function calledWithinCadence(lastAt: string | null | undefined, now = new Date()) {
  if (!lastAt) return false;
  const stamp = Date.parse(lastAt);
  if (Number.isNaN(stamp)) return false;
  const windowMs = SUBSCRIBE_CALL_CADENCE_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() - stamp < windowMs;
}

export function firstNameFromProfile(fullName: unknown) {
  if (typeof fullName !== "string") return "";
  const token = fullName.trim().split(/\s+/)[0] || "";
  return token.replace(/[^A-Za-z.']/g, "").slice(0, 40);
}

export function decideSubscribeCallEligibility(
  row: SubscribeCallProfileRow | null | undefined,
  options: { entitled: boolean; now?: Date }
): SubscribeCallDecision {
  const reasons: SubscribeCallReason[] = [];
  if (!row || !(typeof row.id === "string" && row.id.trim())) {
    return { eligible: false, reasons: ["no_profile"] };
  }
  if (isDemoOrPreviewProfile(row)) reasons.push("demo_or_preview");
  if (!normalizeSubscribePhone(row.phone || "")) reasons.push("missing_phone");
  if (!parseCallSubscribeOptIn(row.call_subscribe_opt_in)) reasons.push("missing_opt_in");
  if (options.entitled) reasons.push("entitled");
  if (calledWithinCadence(row.last_subscribe_call_at, options.now)) reasons.push("recent_call");
  if (!isAdultMember(row.dob, options.now)) reasons.push("under_18");
  return { eligible: reasons.length === 0, reasons };
}

export function publicEligibleMember(row: SubscribeCallProfileRow) {
  return {
    profile_id: typeof row.id === "string" ? row.id : "",
    user_id: typeof row.user_id === "string" ? row.user_id : "",
    first_name: firstNameFromProfile(row.full_name),
    mother_tongue: typeof row.mother_tongue === "string" ? row.mother_tongue.trim() : "",
    phone_masked: maskPhoneForList(typeof row.phone === "string" ? row.phone : ""),
    last_subscribe_call_at: row.last_subscribe_call_at || null,
  };
}
